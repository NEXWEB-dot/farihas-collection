/**
 * ============================================================
 * Fariha's Collection — Cloudflare Worker API
 * ============================================================
 * KV Namespace binding name: PRODUCTS
 *
 * Routes:
 *   GET    /api/products           → list all products
 *   GET    /api/products/:id       → single product
 *   POST   /api/products           → create product  [AUTH]
 *   PUT    /api/products/:id       → update product  [AUTH]
 *   DELETE /api/products/:id       → delete product  [AUTH]
 *   GET    /api/settings           → site settings
 *   PUT    /api/settings           → update settings [AUTH]
 *   POST   /api/orders             → place order     [PUBLIC - from checkout]
 *   GET    /api/orders             → list orders     [AUTH]
 *   PUT    /api/orders/:id         → update order    [AUTH]
 *   DELETE /api/orders/:id         → delete order    [AUTH]
 * ============================================================
 */

// ─── CORS Headers ────────────────────────────────────────────
const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
};

function corsHeaders(extra = {}) {
    return { ...CORS, 'Content-Type': 'application/json', ...extra };
}

// ─── Response helpers ────────────────────────────────────────
function ok(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}
function err(message, status = 400) {
    return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders() });
}

// ─── Auth middleware ─────────────────────────────────────────
function isAuthorized(request, env) {
    const header = request.headers.get('Authorization') || '';
    const token  = header.replace('Bearer ', '').trim();
    return token === env.ADMIN_TOKEN;
}

// ─── KV Key helpers ──────────────────────────────────────────
const INDEX_KEY        = 'products:index';
const SETTINGS_KEY     = 'site:settings';
const ORDERS_INDEX_KEY = 'orders:index';

function productKey(id) { return `product:${id}`; }
function orderKey(id)   { return `order:${id}`; }

// ─── ID generator ────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}

// ─── Products index management ───────────────────────────────
async function getIndex(kv) {
    const raw = await kv.get(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function addToIndex(kv, id) {
    const index = await getIndex(kv);
    if (!index.includes(id)) {
        index.unshift(id);
        await kv.put(INDEX_KEY, JSON.stringify(index));
    }
}

async function removeFromIndex(kv, id) {
    const index = await getIndex(kv);
    const updated = index.filter(i => i !== id);
    await kv.put(INDEX_KEY, JSON.stringify(updated));
}

// ─── Orders index management ─────────────────────────────────
async function getOrdersIndex(kv) {
    const raw = await kv.get(ORDERS_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function addToOrdersIndex(kv, id) {
    const index = await getOrdersIndex(kv);
    if (!index.includes(id)) {
        index.unshift(id); // newest first
        await kv.put(ORDERS_INDEX_KEY, JSON.stringify(index));
    }
}

async function removeFromOrdersIndex(kv, id) {
    const index = await getOrdersIndex(kv);
    const updated = index.filter(i => i !== id);
    await kv.put(ORDERS_INDEX_KEY, JSON.stringify(updated));
}

// ─── Main fetch handler ──────────────────────────────────────
export default {
    async fetch(request, env) {
        const url    = new URL(request.url);
        const method = request.method.toUpperCase();
        const path   = url.pathname;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS });
        }

        // ── Route: /api/products ──
        if (path === '/api/products') {
            if (method === 'GET')  return handleListProducts(url, env);
            if (method === 'POST') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleCreateProduct(request, env);
            }
        }

        // ── Route: /api/products/:id ──
        const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
        if (productMatch) {
            const id = productMatch[1];
            if (method === 'GET')    return handleGetProduct(id, env);
            if (method === 'PUT') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleUpdateProduct(id, request, env);
            }
            if (method === 'DELETE') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleDeleteProduct(id, env);
            }
        }

        // ── Route: /api/settings ──
        if (path === '/api/settings') {
            if (method === 'GET') return handleGetSettings(env);
            if (method === 'PUT') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleUpdateSettings(request, env);
            }
        }

        // ── Route: /api/orders ──
        if (path === '/api/orders') {
            if (method === 'POST') return handleCreateOrder(request, env);  // PUBLIC
            if (method === 'GET') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleListOrders(env);
            }
        }

        // ── Route: /api/orders/:id ──
        const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
        if (orderMatch) {
            const id = orderMatch[1];
            if (method === 'PUT') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleUpdateOrder(id, request, env);
            }
            if (method === 'DELETE') {
                if (!isAuthorized(request, env)) return err('Unauthorized', 401);
                return handleDeleteOrder(id, env);
            }
        }

        return err('Not found', 404);
    }
};

// ─── GET /api/products ───────────────────────────────────────
async function handleListProducts(url, env) {
    try {
        const index = await getIndex(env.PRODUCTS);
        if (index.length === 0) return ok({ total: 0, products: [] });

        const fetched = await Promise.all(
            index.map(id => env.PRODUCTS.get(productKey(id)))
        );
        let products = fetched
            .filter(Boolean)
            .map(raw => JSON.parse(raw));

        const category = url.searchParams.get('category');
        const soldOut  = url.searchParams.get('soldOut');
        const search   = url.searchParams.get('search');
        const limit    = parseInt(url.searchParams.get('limit')  || '0');
        const offset   = parseInt(url.searchParams.get('offset') || '0');

        if (category && category !== 'all') {
            products = products.filter(p =>
                p.category    === category ||
                p.subCategory === category
            );
        }
        if (soldOut === 'true')  products = products.filter(p => p.soldOut === true);
        if (soldOut === 'false') products = products.filter(p => p.soldOut !== true);
        if (search) {
            const q = search.toLowerCase();
            products = products.filter(p =>
                (p.name  || '').toLowerCase().includes(q) ||
                (p.brand || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }

        const total     = products.length;
        const paginated = (limit > 0)
            ? products.slice(offset, offset + limit)
            : products;

        return ok({ total, products: paginated });
    } catch (e) {
        return err('Failed to fetch products: ' + e.message, 500);
    }
}

// ─── GET /api/products/:id ───────────────────────────────────
async function handleGetProduct(id, env) {
    const raw = await env.PRODUCTS.get(productKey(id));
    if (!raw) return err('Product not found', 404);
    return ok(JSON.parse(raw));
}

// ─── POST /api/products ──────────────────────────────────────
async function handleCreateProduct(request, env) {
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON body'); }

    const id = body.id || generateId();
    const product = {
        id,
        name:        body.name        || '',
        price:       Number(body.price) || 0,
        category:    body.category    || 'women',
        subCategory: body.subCategory || '',
        brand:       body.brand       || '',
        size:        body.size        || '',
        condition:   body.condition   || '',
        description: body.description || '',
        images:      Array.isArray(body.images) ? body.images : [],
        soldOut:     body.soldOut === true,
        salePercent: Number(body.salePercent) || 0,
        createdAt:   body.createdAt   || new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
    };

    if (!product.name) return err('Product name is required');

    await env.PRODUCTS.put(productKey(id), JSON.stringify(product));
    await addToIndex(env.PRODUCTS, id);

    return ok(product, 201);
}

// ─── PUT /api/products/:id ───────────────────────────────────
async function handleUpdateProduct(id, request, env) {
    const existing = await env.PRODUCTS.get(productKey(id));
    if (!existing) return err('Product not found', 404);

    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON body'); }

    const old     = JSON.parse(existing);
    const updated = {
        ...old,
        ...body,
        id,
        updatedAt: new Date().toISOString(),
    };

    await env.PRODUCTS.put(productKey(id), JSON.stringify(updated));
    return ok(updated);
}

// ─── DELETE /api/products/:id ────────────────────────────────
async function handleDeleteProduct(id, env) {
    const existing = await env.PRODUCTS.get(productKey(id));
    if (!existing) return err('Product not found', 404);

    await env.PRODUCTS.delete(productKey(id));
    await removeFromIndex(env.PRODUCTS, id);

    return ok({ success: true, id });
}

// ─── GET /api/settings ───────────────────────────────────────
async function handleGetSettings(env) {
    const raw = await env.PRODUCTS.get(SETTINGS_KEY);
    const defaults = {
        announcementText:    '📦 Free delivery on orders above Rs 3,000 · Nationwide shipping across Pakistan',
        isAnnouncementActive: true,
        clearanceSaleActive:  true,
        marqueeActive:        true,
        marqueeMessages: [
            '📹 <strong>Notice:</strong> Please record a complete unboxing video before opening your parcel.',
            '🏷️ Premium <strong>Preloved Condition</strong> Shoes — Shipped Across Pakistan',
        ],
    };
    return ok(raw ? { ...defaults, ...JSON.parse(raw) } : defaults);
}

// ─── PUT /api/settings ───────────────────────────────────────
async function handleUpdateSettings(request, env) {
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON body'); }

    const raw = await env.PRODUCTS.get(SETTINGS_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const updated  = { ...existing, ...body, updatedAt: new Date().toISOString() };

    await env.PRODUCTS.put(SETTINGS_KEY, JSON.stringify(updated));
    return ok(updated);
}

// ─── POST /api/orders ────────────────────────────────────────
// PUBLIC: called by checkout page when customer places an order
async function handleCreateOrder(request, env) {
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON body'); }

    if (!body.customerName) return err('Customer name is required');
    if (!body.customerPhone) return err('Customer phone is required');

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

    const id = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);

    const order = {
        id,
        status:         'pending',
        customerName:   body.customerName   || '',
        customerPhone:  body.customerPhone  || '',
        customerEmail:  body.customerEmail  || '',
        address:        body.address        || '',
        city:           body.city           || '',
        province:       body.province       || '',
        paymentMethod:  body.paymentMethod  || 'cod',
        totalAmount:    Number(body.totalAmount) || 0,
        promoCode:      body.promoCode      || '',
        items:          Array.isArray(body.items) ? body.items : [],
        notes:          body.notes          || '',
        createdAt:      now.toISOString(),
        expiresAt:      expiresAt.toISOString(),
        confirmedAt:    null,
        cancelledAt:    null,
    };

    await env.PRODUCTS.put(orderKey(id), JSON.stringify(order));
    await addToOrdersIndex(env.PRODUCTS, id);

    return ok(order, 201);
}

// ─── GET /api/orders ─────────────────────────────────────────
// AUTH: dashboard only
async function handleListOrders(env) {
    try {
        const index = await getOrdersIndex(env.PRODUCTS);
        if (index.length === 0) return ok({ total: 0, orders: [] });

        const fetched = await Promise.all(
            index.map(id => env.PRODUCTS.get(orderKey(id)))
        );
        const orders = fetched
            .filter(Boolean)
            .map(raw => JSON.parse(raw));

        return ok({ total: orders.length, orders });
    } catch (e) {
        return err('Failed to fetch orders: ' + e.message, 500);
    }
}

// ─── PUT /api/orders/:id ─────────────────────────────────────
// AUTH: confirm / cancel / update status
async function handleUpdateOrder(id, request, env) {
    const existing = await env.PRODUCTS.get(orderKey(id));
    if (!existing) return err('Order not found', 404);

    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON body'); }

    const old     = JSON.parse(existing);
    const now     = new Date().toISOString();
    const updated = {
        ...old,
        ...body,
        id,
        updatedAt: now,
    };

    // Stamp timestamps for status changes
    if (body.status === 'confirmed' && !old.confirmedAt) updated.confirmedAt = now;
    if (body.status === 'cancelled' && !old.cancelledAt) updated.cancelledAt = now;

    await env.PRODUCTS.put(orderKey(id), JSON.stringify(updated));
    return ok(updated);
}

// ─── DELETE /api/orders/:id ──────────────────────────────────
async function handleDeleteOrder(id, env) {
    const existing = await env.PRODUCTS.get(orderKey(id));
    if (!existing) return err('Order not found', 404);

    await env.PRODUCTS.delete(orderKey(id));
    await removeFromOrdersIndex(env.PRODUCTS, id);

    return ok({ success: true, id });
}
