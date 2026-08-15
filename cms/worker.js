/**
 * ============================================================
 * Fariha's Collection — Cloudflare Worker API (Step 2)
 * ============================================================
 * Deploy this file as your Cloudflare Worker.
 * KV Namespace binding name: PRODUCTS
 *
 * Environment variables to set in Cloudflare Dashboard:
 *   ADMIN_TOKEN  →  your secret token for write operations
 *                   (generate any long random string)
 *
 * Routes handled:
 *   GET    /api/products           → list all products
 *   GET    /api/products/:id       → single product
 *   POST   /api/products           → create product  [AUTH]
 *   PUT    /api/products/:id       → update product  [AUTH]
 *   DELETE /api/products/:id       → delete product  [AUTH]
 *   GET    /api/settings           → site settings
 *   PUT    /api/settings           → update settings [AUTH]
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
const INDEX_KEY    = 'products:index';   // stores array of all product IDs
const SETTINGS_KEY = 'site:settings';

function productKey(id) { return `product:${id}`; }

// ─── ID generator ────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}

// ─── Index management ────────────────────────────────────────
async function getIndex(kv) {
    const raw = await kv.get(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function addToIndex(kv, id) {
    const index = await getIndex(kv);
    if (!index.includes(id)) {
        index.unshift(id); // newest first
        await kv.put(INDEX_KEY, JSON.stringify(index));
    }
}

async function removeFromIndex(kv, id) {
    const index = await getIndex(kv);
    const updated = index.filter(i => i !== id);
    await kv.put(INDEX_KEY, JSON.stringify(updated));
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

        return err('Not found', 404);
    }
};

// ─── GET /api/products ───────────────────────────────────────
// Query params: ?category=heels  ?soldOut=true  ?search=boot  ?limit=50  ?offset=0
async function handleListProducts(url, env) {
    try {
        const index = await getIndex(env.PRODUCTS);
        if (index.length === 0) return ok([]);

        // Fetch all products in parallel
        const fetched = await Promise.all(
            index.map(id => env.PRODUCTS.get(productKey(id)))
        );
        let products = fetched
            .filter(Boolean)
            .map(raw => JSON.parse(raw));

        // ── Filters ──
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

        // ── Pagination ──
        const total    = products.length;
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
        description: body.description || '',
        images:      Array.isArray(body.images) ? body.images : [],
        soldOut:     body.soldOut === true,
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
        id,                                  // id is immutable
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
