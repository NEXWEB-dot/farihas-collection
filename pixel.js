// ============================================================
//  Fariha's Collection — Meta Pixel Integration
//  Pixel ID : 965005419926923
//  Events   : PageView, ViewContent, AddToCart,
//             InitiateCheckout, Purchase
//  Manual Advanced Matching & CAPI Deduplication Configured
// ============================================================

(function () {
    var PIXEL_ID = '965005419926923';

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
    fbq('set', 'autoConfig', false, PIXEL_ID);

    /* ----------------------------------------------------------
       2.  Manual Advanced Matching Sanitization & Normalization
           Formats data according to Meta's strict specifications
    ---------------------------------------------------------- */
    function sanitizeUserData(data) {
        if (!data || typeof data !== 'object') return {};
        var clean = {};

        // Email: lowercase, trimmed, basic format check
        var rawEmail = String(data.email || data.em || '').trim().toLowerCase();
        if (rawEmail && rawEmail.indexOf('@') > 0 && rawEmail.indexOf('.') > 0) {
            clean.em = rawEmail;
        }

        // Phone: digits only. Standardize Pakistani numbers (03... / 3... -> 923...)
        var rawPhone = String(data.phone || data.ph || '').replace(/\D/g, '');
        if (rawPhone) {
            if (rawPhone.startsWith('03') && rawPhone.length === 11) {
                rawPhone = '92' + rawPhone.slice(1);
            } else if (rawPhone.startsWith('3') && rawPhone.length === 10) {
                rawPhone = '92' + rawPhone;
            } else if (rawPhone.startsWith('9203') && rawPhone.length === 13) {
                rawPhone = '92' + rawPhone.slice(3);
            }
            if (rawPhone.length >= 10) {
                clean.ph = rawPhone;
            }
        }

        // Name parsing: first name & last name (lowercase letters only)
        var fullName = String(data.name || data.customerName || '').trim();
        var rawFn = String(data.firstName || data.fn || (fullName ? fullName.split(/\s+/)[0] : '')).trim().toLowerCase().replace(/[^a-z]/g, '');
        var rawLn = String(data.lastName  || data.ln || (fullName && fullName.split(/\s+/).length > 1 ? fullName.split(/\s+/).slice(-1)[0] : '')).trim().toLowerCase().replace(/[^a-z]/g, '');

        if (rawFn) clean.fn = rawFn;
        if (rawLn) clean.ln = rawLn;

        // City: lowercase, letters only, no punctuation
        var rawCity = String(data.city || data.ct || '').trim().toLowerCase().replace(/[^a-z]/g, '');
        if (rawCity) clean.ct = rawCity;

        // State / Province: lowercase
        var rawState = String(data.province || data.state || data.st || '').trim().toLowerCase();
        if (rawState) clean.st = rawState;

        // Country: ISO 2-letter lowercase code ('pk' for Pakistan)
        clean.country = data.country ? String(data.country).trim().toLowerCase() : 'pk';

        // External ID (if available)
        if (data.external_id || data.externalId) {
            clean.external_id = String(data.external_id || data.externalId).trim();
        }

        return clean;
    }
    window.fcPixelSanitizeUserData = sanitizeUserData;

    // Read stored customer details (e.g. from checkout or previous visits)
    var _advMatch = {};
    try {
        var _saved = JSON.parse(localStorage.getItem('fc_last_customer') || '{}');
        _advMatch = sanitizeUserData(_saved);
    } catch (e) {}

    // Initialize Meta Pixel with Manual Advanced Matching data if available
    if (_advMatch.em || _advMatch.ph || _advMatch.fn) {
        fbq('init', PIXEL_ID, _advMatch);
    } else {
        fbq('init', PIXEL_ID);
    }

    // Generate unique eventId for PageView deduplication between browser Pixel and server CAPI
    var _pvEventId = 'pv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    // Standard PageView event (fires once per page — browser side with deduplication key)
    fbq('track', 'PageView', {}, { eventID: _pvEventId });

    /* ----------------------------------------------------------
       3b. Server-Side CAPI PageView (fires once per page)
           Sends PageView to Cloudflare Worker which relays it to
           Meta's Conversions API — covers ad-blocked / iOS browsers
           and resolves the "Improve CAPI coverage" warning.
    ---------------------------------------------------------- */
    (function () {
        try {
            var _url = window.location.href;
            var _ref = document.referrer || '';
            var _ua  = navigator.userAgent || '';

            // Read Meta cookies for higher Event Match Quality
            function _fbCk(n) {
                var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
                return m ? decodeURIComponent(m[1]) : '';
            }

            // Read stored customer data for Advanced Matching on CAPI side
            var _cm = {};
            try { _cm = JSON.parse(localStorage.getItem('fc_last_customer') || '{}'); } catch(e) {}

            var _payload = {
                eventName:  'PageView',
                eventId:    _pvEventId,
                eventUrl:   _url,
                referrer:   _ref,
                userAgent:  _ua,
                fbp:        _fbCk('_fbp'),
                fbc:        _fbCk('_fbc'),
                userData:   _cm  // Advanced Matching fields (email, phone, etc.)
            };

            // Fire-and-forget — does not block page rendering
            fetch('https://fc-cms.sheezarazzak.workers.dev/api/capi-event', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(_payload),
                keepalive: true   // Ensures request completes even if page navigates away
            }).catch(function () {
                // Silent fail — browser pixel already fired above, no user impact
            });
        } catch (e) {}
    })();

    /* ----------------------------------------------------------
       3.  Dynamic Advanced Matching Updater
           Allows forms (like checkout) to update user data in real-time
    ---------------------------------------------------------- */
    window.fcPixelSetUserData = function (userData) {
        if (!userData || typeof userData !== 'object') return;
        var clean = sanitizeUserData(userData);
        if (clean.em || clean.ph || clean.fn) {
            try {
                var existing = JSON.parse(localStorage.getItem('fc_last_customer') || '{}');
                var merged = Object.assign({}, existing, userData);
                localStorage.setItem('fc_last_customer', JSON.stringify(merged));
            } catch (e) {}

            if (typeof fbq === 'function') {
                fbq('init', PIXEL_ID, clean);
                if (typeof fbq.setUserProperties === 'function') {
                    fbq('setUserProperties', PIXEL_ID, clean);
                }
            }
        }
    };

    /* ----------------------------------------------------------
       4.  Noscript fallback (appended once DOM is ready)
    ---------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        var noscript = document.createElement('noscript');
        var img = document.createElement('img');
        img.height = 1;
        img.width = 1;
        img.style.display = 'none';
        img.src = 'https://www.facebook.com/tr?id=' + PIXEL_ID + '&ev=PageView&noscript=1';
        noscript.appendChild(img);
        var body = document.body;
        if (body && body.firstChild) {
            body.insertBefore(noscript, body.firstChild);
        } else if (body) {
            body.appendChild(noscript);
        }
    });
})();

/* ----------------------------------------------------------
   5.  Helper functions — call these from any page script
---------------------------------------------------------- */

/**
 * ViewContent — fire when a product detail page fully loads.
 * @param {string} name    Product name
 * @param {number} price   Product price (PKR)
 * @param {string} id      Product ID
 */
window.fcPixelViewContent = function (name, price, id) {
    if (typeof fbq === 'undefined') return;
    fbq('track', 'ViewContent', {
        content_name : name || '',
        content_ids  : [id || name || ''],
        content_type : 'product',
        value        : Number(price) || 0,
        currency     : 'PKR'
    });
};

/**
 * AddToCart — fire when a product is added to the cart.
 * @param {string} name    Product name
 * @param {number} price   Unit price (PKR)
 * @param {string} id      Product ID
 * @param {number} qty     Quantity added (default 1)
 */
window.fcPixelAddToCart = function (name, price, id, qty) {
    if (typeof fbq === 'undefined') return;
    fbq('track', 'AddToCart', {
        content_name : name || '',
        content_ids  : [id || name || ''],
        content_type : 'product',
        value        : (Number(price) || 0) * (Number(qty) || 1),
        currency     : 'PKR',
        num_items    : Number(qty) || 1
    });
};

/**
 * InitiateCheckout — fire when user clicks "Proceed to Checkout" or opens checkout page.
 * @param {number} value     Cart total (PKR)
 * @param {number} numItems  Number of items in the cart
 * @param {Array}  cartItems Array of cart item objects
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
        value        : Number(value) || 0,
        currency     : 'PKR',
        num_items    : Number(numItems) || 0,
        content_ids  : contentIds,
        contents     : contents,
        content_type : 'product'
    });
};

/**
 * Purchase — fire when an order is successfully placed.
 *
 * @param {number} value      Final order total incl. shipping (PKR)
 * @param {string} eventId    Unique event_id for browser↔CAPI deduplication
 * @param {string} orderId    Order reference ID
 * @param {Array}  cartItems  Array of { id, name, price, qty } objects
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
        value        : Number(value) || 0,
        currency     : 'PKR',
        order_id     : orderId || eventId || '',
        content_ids  : contentIds,
        contents     : contents,
        content_type : 'product',
        num_items    : (cartItems || []).reduce(function (s, i) { return s + (Number(i.qty) || 1); }, 0)
    }, { eventID: eventId || ('purchase_' + Date.now()) });
};
