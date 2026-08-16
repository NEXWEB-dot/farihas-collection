// ============================================================
//  Fariha's Collection — Meta Pixel Integration
//  Pixel ID : 965005419926923
//  Events   : PageView, ViewContent, AddToCart,
//             InitiateCheckout, Purchase
// ============================================================

(function () {
    /* ----------------------------------------------------------
       1.  Base Pixel snippet (standard Meta code, minified)
    ---------------------------------------------------------- */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    // Disable automatic event tracking (like button clicks) to prevent duplicate events
    fbq('set', 'autoConfig', false, '965005419926923');

    // Advanced Matching — reads customer info saved at checkout for better conversion tracking
    var _advMatch = {};
    try {
        var _saved = JSON.parse(localStorage.getItem('fc_last_customer') || '{}');
        if (_saved.email)    _advMatch.em      = _saved.email.trim().toLowerCase();
        if (_saved.phone)    _advMatch.ph      = _saved.phone.replace(/\D/g,'');
        if (_saved.name)     _advMatch.fn      = (_saved.name.trim().split(' ')[0] || '').toLowerCase();
        if (_saved.name)     _advMatch.ln      = (_saved.name.trim().split(' ').slice(-1)[0] || '').toLowerCase();
        if (_saved.city)     _advMatch.ct      = _saved.city.trim().toLowerCase();
        if (_saved.province) _advMatch.st      = _saved.province.trim().toLowerCase();
        _advMatch.country = 'pk';
    } catch(e) {}

    fbq('init', '965005419926923', _advMatch);
    fbq('track', 'PageView');          // fires on every page automatically

    /* ----------------------------------------------------------
       2.  Noscript fallback (appended once DOM is ready)
    ---------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        var noscript = document.createElement('noscript');
        var img = document.createElement('img');
        img.height = 1;
        img.width = 1;
        img.style.display = 'none';
        img.src = 'https://www.facebook.com/tr?id=965005419926923&ev=PageView&noscript=1';
        noscript.appendChild(img);
        // Insert right after <body> opens
        var body = document.body;
        if (body && body.firstChild) {
            body.insertBefore(noscript, body.firstChild);
        } else if (body) {
            body.appendChild(noscript);
        }
    });
})();

/* ----------------------------------------------------------
   3.  Helper functions — call these from any page script
---------------------------------------------------------- */

/**
 * ViewContent — fire when a product detail page fully loads.
 * @param {string} name    Product name
 * @param {number} price   Product price (PKR)
 * @param {string} id      Product ID / Sanity _id
 */
window.fcPixelViewContent = function (name, price, id) {
    if (typeof fbq === 'undefined') return;
    fbq('track', 'ViewContent', {
        content_name     : name   || '',
        content_ids      : [id    || name || ''],
        content_type     : 'product',
        value            : Number(price) || 0,
        currency         : 'PKR'
    });
};

/**
 * AddToCart — fire when a product is added to the cart.
 * @param {string} name    Product name
 * @param {number} price   Unit price (PKR)
 * @param {string} id      Product ID / Sanity _id
 * @param {number} qty     Quantity added (default 1)
 */
window.fcPixelAddToCart = function (name, price, id, qty) {
    if (typeof fbq === 'undefined') return;
    fbq('track', 'AddToCart', {
        content_name     : name   || '',
        content_ids      : [id    || name || ''],
        content_type     : 'product',
        value            : (Number(price) || 0) * (Number(qty) || 1),
        currency         : 'PKR',
        num_items        : Number(qty) || 1
    });
};

/**
 * InitiateCheckout — fire when user clicks "Proceed to Checkout"
 * or lands on the checkout page.
 * @param {number} value    Cart total (PKR)
 * @param {number} numItems Number of items in the cart
 */
window.fcPixelInitiateCheckout = function (value, numItems, cartItems) {
    if (typeof fbq === 'undefined') return;
    
    var contents = (cartItems || []).map(function (item) {
        return {
            id        : item.id || item.name || '',
            quantity  : Number(item.qty) || 1,
            item_price: Number(item.price) || 0
        };
    });
    var contentIds = (cartItems || []).map(function (item) { return item.id || item.name || ''; });

    fbq('track', 'InitiateCheckout', {
        value         : Number(value)    || 0,
        currency      : 'PKR',
        num_items     : Number(numItems) || 0,
        content_ids   : contentIds,
        contents      : contents,
        content_type  : 'product'
    });
};

/**
 * Purchase — fire when an order is successfully placed.
 *
 * @param {number} value      Final order total incl. shipping (PKR)
 * @param {string} eventId    Unique event_id for browser↔CAPI deduplication
 *                            (e.g. 'purchase_ORD-1234567890-5678')
 * @param {string} orderId    Sanity order reference ID
 * @param {Array}  cartItems  Array of { name, price, qty } objects
 *
 * ⚠️  Call this ONCE, right after the order is confirmed in Sanity.
 *      Do NOT call it on button click — always call after successful save.
 */
window.fcPixelPurchase = function (value, eventId, orderId, cartItems) {
    if (typeof fbq === 'undefined') return;

    var contents = (cartItems || []).map(function (item) {
        return {
            id        : item.id || item.name || '',
            quantity  : Number(item.qty) || 1,
            item_price: Number(item.price) || 0
        };
    });

    var contentIds = (cartItems || []).map(function (item) { return item.id || item.name || ''; });

    // The eventID here must match the eventID sent via Conversions API (CAPI)
    // so Meta can deduplicate browser + server events automatically.
    fbq('track', 'Purchase', {
        value         : Number(value) || 0,
        currency      : 'PKR',
        order_id      : orderId || eventId || '',
        content_ids   : contentIds,
        contents      : contents,
        content_type  : 'product',
        num_items     : (cartItems || []).reduce(function (s, i) { return s + (Number(i.qty) || 1); }, 0)
    }, { eventID: eventId || ('purchase_' + Date.now()) });
};
