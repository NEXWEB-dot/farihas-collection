var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};
function corsHeaders(extra = {}) {
  return { ...CORS, "Content-Type": "application/json", ...extra };
}
__name(corsHeaders, "corsHeaders");
function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}
__name(ok, "ok");
function err(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders() });
}
__name(err, "err");
function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.replace("Bearer ", "").trim();
  return token === env.ADMIN_TOKEN;
}
__name(isAuthorized, "isAuthorized");
var INDEX_KEY = "products:index";
var SETTINGS_KEY = "site:settings";
var ORDERS_INDEX_KEY = "orders:index";
function productKey(id) {
  return `product:${id}`;
}
__name(productKey, "productKey");
function orderKey(id) {
  return `order:${id}`;
}
__name(orderKey, "orderKey");
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
async function getIndex(kv) {
  const raw = await kv.get(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}
__name(getIndex, "getIndex");
async function addToIndex(kv, id) {
  const index = await getIndex(kv);
  if (!index.includes(id)) {
    index.unshift(id);
    await kv.put(INDEX_KEY, JSON.stringify(index));
  }
}
__name(addToIndex, "addToIndex");
async function removeFromIndex(kv, id) {
  const index = await getIndex(kv);
  const updated = index.filter((i) => i !== id);
  await kv.put(INDEX_KEY, JSON.stringify(updated));
}
__name(removeFromIndex, "removeFromIndex");
async function getOrdersIndex(kv) {
  const raw = await kv.get(ORDERS_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}
__name(getOrdersIndex, "getOrdersIndex");
async function addToOrdersIndex(kv, id) {
  const index = await getOrdersIndex(kv);
  if (!index.includes(id)) {
    index.unshift(id);
    await kv.put(ORDERS_INDEX_KEY, JSON.stringify(index));
  }
}
__name(addToOrdersIndex, "addToOrdersIndex");
async function removeFromOrdersIndex(kv, id) {
  const index = await getOrdersIndex(kv);
  const updated = index.filter((i) => i !== id);
  await kv.put(ORDERS_INDEX_KEY, JSON.stringify(updated));
}
__name(removeFromOrdersIndex, "removeFromOrdersIndex");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (path === "/api/products") {
      if (method === "GET") return handleListProducts(url, env);
      if (method === "POST") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleCreateProduct(request, env);
      }
    }
    const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch) {
      const id = productMatch[1];
      if (method === "GET") return handleGetProduct(id, env);
      if (method === "PUT") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleUpdateProduct(id, request, env);
      }
      if (method === "DELETE") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleDeleteProduct(id, env);
      }
    }
    if (path === "/api/settings") {
      if (method === "GET") return handleGetSettings(env);
      if (method === "PUT") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleUpdateSettings(request, env);
      }
    }
    if (path === "/api/orders") {
      if (method === "POST") return handleCreateOrder(request, env);
      if (method === "GET") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleListOrders(env);
      }
    }
    const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch) {
      const id = orderMatch[1];
      if (method === "PUT") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleUpdateOrder(id, request, env);
      }
      if (method === "DELETE") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);
        return handleDeleteOrder(id, env);
      }
    }
    return err("Not found", 404);
  }
};
async function handleListProducts(url, env) {
  try {
    const index = await getIndex(env.PRODUCTS);
    if (index.length === 0) return ok({ total: 0, products: [] });
    const fetched = await Promise.all(
      index.map((id) => env.PRODUCTS.get(productKey(id)))
    );
    let products = fetched.filter(Boolean).map((raw) => JSON.parse(raw));
    const category = url.searchParams.get("category");
    const soldOut = url.searchParams.get("soldOut");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "0");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    if (category && category !== "all") {
      products = products.filter(
        (p) => p.category === category || p.subCategory === category
      );
    }
    if (soldOut === "true") products = products.filter((p) => p.soldOut === true);
    if (soldOut === "false") products = products.filter((p) => p.soldOut !== true);
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => (p.name || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
      );
    }
    const total = products.length;
    const paginated = limit > 0 ? products.slice(offset, offset + limit) : products;
    return ok({ total, products: paginated });
  } catch (e) {
    return err("Failed to fetch products: " + e.message, 500);
  }
}
__name(handleListProducts, "handleListProducts");
async function handleGetProduct(id, env) {
  const raw = await env.PRODUCTS.get(productKey(id));
  if (!raw) return err("Product not found", 404);
  return ok(JSON.parse(raw));
}
__name(handleGetProduct, "handleGetProduct");
async function handleCreateProduct(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }
  const id = body.id || generateId();
  const product = {
    id,
    name: body.name || "",
    price: Number(body.price) || 0,
    category: body.category || "women",
    subCategory: body.subCategory || "",
    brand: body.brand || "",
    size: body.size || "",
    condition: body.condition || "",
    description: body.description || "",
    images: Array.isArray(body.images) ? body.images : [],
    soldOut: body.soldOut === true,
    salePercent: Number(body.salePercent) || 0,
    createdAt: body.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!product.name) return err("Product name is required");
  await env.PRODUCTS.put(productKey(id), JSON.stringify(product));
  await addToIndex(env.PRODUCTS, id);
  return ok(product, 201);
}
__name(handleCreateProduct, "handleCreateProduct");
async function handleUpdateProduct(id, request, env) {
  const existing = await env.PRODUCTS.get(productKey(id));
  if (!existing) return err("Product not found", 404);
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }
  const old = JSON.parse(existing);
  const updated = {
    ...old,
    ...body,
    id,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.PRODUCTS.put(productKey(id), JSON.stringify(updated));
  return ok(updated);
}
__name(handleUpdateProduct, "handleUpdateProduct");
async function handleDeleteProduct(id, env) {
  const existing = await env.PRODUCTS.get(productKey(id));
  if (!existing) return err("Product not found", 404);
  await env.PRODUCTS.delete(productKey(id));
  await removeFromIndex(env.PRODUCTS, id);
  return ok({ success: true, id });
}
__name(handleDeleteProduct, "handleDeleteProduct");
async function handleGetSettings(env) {
  const raw = await env.PRODUCTS.get(SETTINGS_KEY);
  const defaults = {
    announcementText: "\u{1F4E6} Free delivery on orders above Rs 3,000 \xB7 Nationwide shipping across Pakistan",
    isAnnouncementActive: true,
    clearanceSaleActive: true,
    marqueeActive: true,
    marqueeMessages: [
      "\u{1F4F9} <strong>Notice:</strong> Please record a complete unboxing video before opening your parcel.",
      "\u{1F3F7}\uFE0F Premium <strong>Preloved Condition</strong> Shoes \u2014 Shipped Across Pakistan"
    ]
  };
  return ok(raw ? { ...defaults, ...JSON.parse(raw) } : defaults);
}
__name(handleGetSettings, "handleGetSettings");
async function handleUpdateSettings(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }
  const raw = await env.PRODUCTS.get(SETTINGS_KEY);
  const existing = raw ? JSON.parse(raw) : {};
  const updated = { ...existing, ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await env.PRODUCTS.put(SETTINGS_KEY, JSON.stringify(updated));
  return ok(updated);
}
__name(handleUpdateSettings, "handleUpdateSettings");
async function handleCreateOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }
  if (!body.customerName) return err("Customer name is required");
  if (!body.customerPhone) return err("Customer phone is required");
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
  const id = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 9e3 + 1e3);
  const order = {
    id,
    status: "pending",
    customerName: body.customerName || "",
    customerPhone: body.customerPhone || "",
    customerEmail: body.customerEmail || "",
    address: body.address || "",
    city: body.city || "",
    province: body.province || "",
    paymentMethod: body.paymentMethod || "cod",
    totalAmount: Number(body.totalAmount) || 0,
    promoCode: body.promoCode || "",
    items: Array.isArray(body.items) ? body.items : [],
    notes: body.notes || "",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    confirmedAt: null,
    cancelledAt: null
  };
  await env.PRODUCTS.put(orderKey(id), JSON.stringify(order));
  await addToOrdersIndex(env.PRODUCTS, id);
  return ok(order, 201);
}
__name(handleCreateOrder, "handleCreateOrder");
async function handleListOrders(env) {
  try {
    const index = await getOrdersIndex(env.PRODUCTS);
    if (index.length === 0) return ok({ total: 0, orders: [] });
    const fetched = await Promise.all(
      index.map((id) => env.PRODUCTS.get(orderKey(id)))
    );
    const orders = fetched.filter(Boolean).map((raw) => JSON.parse(raw));
    return ok({ total: orders.length, orders });
  } catch (e) {
    return err("Failed to fetch orders: " + e.message, 500);
  }
}
__name(handleListOrders, "handleListOrders");
async function handleUpdateOrder(id, request, env) {
  const existing = await env.PRODUCTS.get(orderKey(id));
  if (!existing) return err("Order not found", 404);
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }
  const old = JSON.parse(existing);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updated = {
    ...old,
    ...body,
    id,
    updatedAt: now
  };
  if (body.status === "confirmed" && !old.confirmedAt) updated.confirmedAt = now;
  if (body.status === "cancelled" && !old.cancelledAt) updated.cancelledAt = now;
  await env.PRODUCTS.put(orderKey(id), JSON.stringify(updated));
  return ok(updated);
}
__name(handleUpdateOrder, "handleUpdateOrder");
async function handleDeleteOrder(id, env) {
  const existing = await env.PRODUCTS.get(orderKey(id));
  if (!existing) return err("Order not found", 404);
  await env.PRODUCTS.delete(orderKey(id));
  await removeFromOrdersIndex(env.PRODUCTS, id);
  return ok({ success: true, id });
}
__name(handleDeleteOrder, "handleDeleteOrder");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
