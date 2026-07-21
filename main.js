document.addEventListener('DOMContentLoaded', () => {
    
    // ===== CART SYSTEM =====
    let cart = JSON.parse(localStorage.getItem('fc_cart') || '[]');

    function saveCart() {
        localStorage.setItem('fc_cart', JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    function addToCart(name, price, image) {
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ name, price, image, qty: 1 });
        }
        saveCart();
        showNotification(`${name} added to cart!`);
        if (window.fcPixelAddToCart) window.fcPixelAddToCart(name, price, name, 1);
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        saveCart();
        renderCartPanel();
    }

    function changeQty(index, delta) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        renderCartPanel();
    }

    // ===== NOTIFICATION =====
    function showNotification(message) {
        const existing = document.querySelector('.fc-notification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.className = 'fc-notification';
        notif.innerHTML = `<i class="ph ph-check-circle"></i> ${message}`;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2500);
    }

    // ===== CART SIDE PANEL =====
    function createCartPanel() {
        if (document.getElementById('cartPanel')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'cartOverlay';
        overlay.className = 'cart-overlay';
        overlay.addEventListener('click', closeCartPanel);

        const panel = document.createElement('div');
        panel.id = 'cartPanel';
        panel.className = 'cart-panel';
        panel.innerHTML = `
            <div class="cart-panel-header">
                <h3>Your Cart</h3>
                <button id="closeCart" class="cart-close-btn"><i class="ph ph-x"></i></button>
            </div>
            <div id="cartItems" class="cart-items"></div>
            <div id="cartFooter" class="cart-footer"></div>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        document.getElementById('closeCart').addEventListener('click', closeCartPanel);
    }

    function openCartPanel() {
        createCartPanel();
        renderCartPanel();
        document.getElementById('cartOverlay').classList.add('active');
        document.getElementById('cartPanel').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCartPanel() {
        const overlay = document.getElementById('cartOverlay');
        const panel = document.getElementById('cartPanel');
        if (overlay) overlay.classList.remove('active');
        if (panel) panel.classList.remove('active');
        document.body.style.overflow = '';
    }

    function renderCartPanel() {
        const itemsContainer = document.getElementById('cartItems');
        const footerContainer = document.getElementById('cartFooter');
        if (!itemsContainer || !footerContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<div class="cart-empty"><i class="ph ph-shopping-bag" style="font-size:3rem;color:#ccc;"></i><p>Your cart is empty</p></div>';
            footerContainer.innerHTML = '';
            return;
        }

        let html = '';
        let total = 0;
        cart.forEach((item, i) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            html += `
                <div class="cart-item">
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">Rs${item.price.toLocaleString()}</p>
                        <div class="cart-qty-controls">
                            <button onclick="window.fcChangeQty(${i}, -1)">−</button>
                            <span>${item.qty}</span>
                            <button onclick="window.fcChangeQty(${i}, 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-remove-btn" onclick="window.fcRemoveFromCart(${i})"><i class="ph ph-trash"></i></button>
                </div>
            `;
        });
        itemsContainer.innerHTML = html;
        
        footerContainer.innerHTML = `
            <div class="cart-total">
                <span>Total</span>
                <span>Rs${total.toLocaleString('en-PK', {minimumFractionDigits: 0})}</span>
            </div>
            <button class="cart-checkout-btn" id="proceedToCheckout" onclick="if(window.fcPixelInitiateCheckout) window.fcPixelInitiateCheckout(${total}, cart.length); window.location.href='checkout.html'" style="background:#111;color:#fff;border:none;width:100%;padding:14px;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:12px;letter-spacing:0.5px;">
                <i class="ph ph-shopping-bag"></i> Proceed to Checkout
            </button>
        `;
    }

    // ===== WHATSAPP CHECKOUT =====
    function checkoutWhatsApp() {
        if (cart.length === 0) return;
        
        const phone = '923090625199';
        let message = '🛒 *New Order from Fariha\'s Collection*\n\n';
        let total = 0;
        
        cart.forEach((item, i) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            message += `${i + 1}. *${item.name}*\n   Qty: ${item.qty} × Rs${item.price.toLocaleString()} = Rs${itemTotal.toLocaleString()}\n\n`;
        });
        
        message += `---\n💰 *Total: Rs${total.toLocaleString()}*\n\nPlease confirm my order. Thank you!`;
        
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    // Expose functions globally for inline onclick handlers
    window.fcRemoveFromCart = removeFromCart;
    window.fcChangeQty = changeQty;

    // ===== SEARCH OVERLAY =====
    function createSearchOverlay() {
        if (document.getElementById('searchOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'searchOverlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-overlay-content">
                <div class="search-bar-wrap">
                    <i class="ph ph-magnifying-glass search-icon"></i>
                    <input type="text" id="searchInput" placeholder="Search for shoes, brands, categories..." autocomplete="off">
                    <button id="closeSearch" class="search-close-btn"><i class="ph ph-x"></i></button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('closeSearch').addEventListener('click', closeSearch);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSearch();
        });
        
        const input = document.getElementById('searchInput');
        input.addEventListener('input', performSearch);
    }

    function openSearch() {
        createSearchOverlay();
        document.getElementById('searchOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('searchInput').focus(), 200);
    }
    function closeSearch() {
        const overlay = document.getElementById('searchOverlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    async function performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query) {
            resultsContainer.innerHTML = '<p class="search-hint">Type to search products...</p>';
            return;
        }

        resultsContainer.innerHTML = '<p class="search-hint">Searching...</p>';

        try {
            const SANITY_PROJECT_ID = 'kxnjofhp';
            const SANITY_DATASET = 'production';
            const SANITY_API_VERSION = '2024-01-01';
            
            // Search Sanity where name or tag matches the query (case insensitive)
            const sanityQuery = `*[_type == "shoe" && name match "*${query}*"]{
                _id, name, price, tag, "image": image.asset->url
            }`;
            const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(sanityQuery)}`;
            
            const res = await fetch(url);
            const json = await res.json();
            const matches = json.result || [];

            if (matches.length === 0) {
                resultsContainer.innerHTML = `<p class="search-hint">No products found for "${query}"</p>`;
                return;
            }

            let html = '';
            matches.forEach(m => {
                const name = m.name || 'Untitled';
                const price = Number(m.price) || 0;
                const image = m.image || '';
                const brand = m.tag || 'Fariha\'s Collection';
                const params = new URLSearchParams({ id: m._id, name, price, image });
                
                html += `
                    <a href="product-detail.html?${params.toString()}" class="search-result-item" style="text-decoration:none; color:inherit;">
                        <img src="${image}" alt="${name.replace(/"/g, '&quot;')}">
                        <div class="sr-info" style="display:flex; flex-direction:column;">
                            <span class="search-result-brand">${brand}</span>
                            <span class="search-result-name">${name}</span>
                            <span class="search-result-price">Rs${price.toLocaleString()}</span>
                        </div>
                    </a>
                `;
            });
            resultsContainer.innerHTML = html;
        } catch (err) {
            console.error('Search error:', err);
            resultsContainer.innerHTML = '<p class="search-hint">Error searching products.</p>';
        }
    }

    // ===== MOBILE MENU DRAWER =====
    function createMenuDrawer() {
        if (document.getElementById('menuDrawer')) return;

        const overlay = document.createElement('div');
        overlay.id = 'menuOverlay';
        overlay.className = 'menu-overlay';
        overlay.addEventListener('click', closeMenu);

        const drawer = document.createElement('div');
        drawer.id = 'menuDrawer';
        drawer.className = 'menu-drawer';
        drawer.innerHTML = `
            <div class="menu-drawer-header">
                <h3>FARIHA'S COLLECTION</h3>
                <button id="closeMenu"><i class="ph ph-x"></i></button>
            </div>
            <nav class="menu-nav">
                <a href="index.html" class="menu-link"><i class="ph ph-house"></i> Home</a>
                <div class="menu-link-group" id="menuShopGroup">
                    <button type="button" id="menuShopToggle" class="menu-link menu-shop-toggle">
                        <span class="menu-shop-toggle-label"><i class="ph ph-sneaker"></i> Shop</span>
                        <i class="ph ph-caret-down menu-shop-caret"></i>
                    </button>
                    <div class="menu-shop-submenu" id="menuShopSubmenu">
                        <a href="shop.html" class="menu-link menu-sublink"><i class="ph ph-squares-four"></i> All</a>
                        <div class="menu-link-group menu-subgroup" id="menuWomenGroup">
                            <button type="button" id="menuWomenToggle" class="menu-link menu-sublink menu-shop-toggle">
                                <span class="menu-shop-toggle-label"><i class="ph ph-gender-female"></i> Women</span>
                                <i class="ph ph-caret-down menu-shop-caret"></i>
                            </button>
                            <div class="menu-shop-submenu menu-subsubmenu" id="menuWomenSubmenu">
                                <a href="shop.html?filter=heels" class="menu-link menu-sublink menu-subsublink"><i class="ph ph-high-heel"></i> Heels</a>
                                <a href="shop.html?filter=flats" class="menu-link menu-sublink menu-subsublink"><i class="ph ph-sneaker"></i> Flats</a>
                                <a href="shop.html?filter=slides" class="menu-link menu-sublink menu-subsublink"><img src="images/sandal_icon.png" alt="Slides" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;"> Slides</a>
                                <a href="shop.html?filter=sneakers" class="menu-link menu-sublink menu-subsublink"><i class="ph ph-sneaker"></i> Sneakers</a>
                                <a href="shop.html?filter=pumps" class="menu-link menu-sublink menu-subsublink"><i class="ph ph-high-heel"></i> Pumps</a>
                                <a href="shop.html?filter=loafers" class="menu-link menu-sublink menu-subsublink"><img src="images/loafer_icon.png" alt="Loafers" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;"> Loafers</a>
                                <a href="shop.html?filter=women&category=boots" class="menu-link menu-sublink menu-subsublink"><i class="ph ph-boot"></i> Boots</a>
                                <a href="shop.html?filter=sandals" class="menu-link menu-sublink menu-subsublink"><img src="images/sandal_icon.png" alt="Sandals" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;"> Sandals</a>
                            </div>
                        </div>
                        <a href="shop.html?filter=men" class="menu-link menu-sublink"><i class="ph ph-gender-male"></i> Men</a>
                        <a href="shop.html?filter=unisex" class="menu-link menu-sublink"><i class="ph ph-gender-intersex"></i> Unisex</a>
                        <a href="shop.html?filter=tagged" class="menu-link menu-sublink"><i class="ph ph-tag"></i> Tagged</a>
                    </div>
                </div>
                <a href="reviews.html" class="menu-link"><i class="ph ph-smiley"></i> Happy Customers</a>
                <a href="size-guide.html" class="menu-link"><i class="ph ph-ruler"></i> Size Guide</a>
                <div class="menu-link-group" id="menuBudgetGroup">
                    <button type="button" id="menuBudgetToggle" class="menu-link menu-shop-toggle">
                        <span class="menu-shop-toggle-label"><i class="ph ph-shopping-bag"></i> Shop By Budget</span>
                        <i class="ph ph-caret-down menu-shop-caret"></i>
                    </button>
                    <div class="menu-shop-submenu" id="menuBudgetSubmenu">
                        <a href="shop.html?maxprice=1000" class="menu-link menu-sublink"><i class="ph ph-currency-circle-dollar"></i> Under Rs 1,000</a>
                        <a href="shop.html?maxprice=2000" class="menu-link menu-sublink"><i class="ph ph-currency-circle-dollar"></i> Under Rs 2,000</a>
                        <a href="shop.html?maxprice=3000" class="menu-link menu-sublink"><i class="ph ph-currency-circle-dollar"></i> Under Rs 3,000</a>
                        <a href="shop.html?maxprice=5000" class="menu-link menu-sublink"><i class="ph ph-currency-circle-dollar"></i> Under Rs 5,000</a>
                        <a href="shop.html?minprice=5000" class="menu-link menu-sublink"><i class="ph ph-currency-circle-dollar"></i> Rs 5,000+</a>
                    </div>
                </div>
                <div class="menu-link-group" id="menuSizeGroup">
                    <button type="button" id="menuSizeToggle" class="menu-link menu-shop-toggle">
                        <span class="menu-shop-toggle-label"><i class="ph ph-ruler"></i> Shop By Size</span>
                        <i class="ph ph-caret-down menu-shop-caret"></i>
                    </button>
                    <div class="menu-shop-submenu" id="menuSizeSubmenu">
                        <a href="shop.html?size=35" class="menu-link menu-sublink">Size 35</a>
                        <a href="shop.html?size=36" class="menu-link menu-sublink">Size 36</a>
                        <a href="shop.html?size=37" class="menu-link menu-sublink">Size 37</a>
                        <a href="shop.html?size=38" class="menu-link menu-sublink">Size 38</a>
                        <a href="shop.html?size=39" class="menu-link menu-sublink">Size 39</a>
                        <a href="shop.html?size=40" class="menu-link menu-sublink">Size 40</a>
                        <a href="shop.html?size=41" class="menu-link menu-sublink">Size 41</a>
                        <a href="shop.html?size=42" class="menu-link menu-sublink">Size 42</a>
                        <a href="shop.html?size=43" class="menu-link menu-sublink">Size 43</a>
                    </div>
                </div>
                <button type="button" id="menuTrackOrder" class="menu-link" style="background:none;border:none;width:100%;text-align:left;cursor:pointer;font:inherit;"><i class="ph ph-map-pin"></i> Track Your Order</button>
                <a href="shipping-policy.html" class="menu-link"><i class="ph ph-truck"></i> Shipping Policy</a>
                <a href="privacy-policy.html" class="menu-link"><i class="ph ph-shield-check"></i> Privacy Policy</a>
                <a href="terms-conditions.html" class="menu-link"><i class="ph ph-file-text"></i> Terms & Conditions</a>
                <a href="about-us.html" class="menu-link"><i class="ph ph-info"></i> About Us</a>
            </nav>
            <div class="menu-footer">
                <div class="menu-social">
                    <a href="https://www.facebook.com/share/1GMaKgnphh/?mibextid=wwXIfr" target="_blank" rel="noopener"><i class="ph ph-facebook-logo"></i></a>
                    <a href="https://www.instagram.com/farihapreloved_?igsh=MW1vMnp5em1qNTduag%3D%3D&utm_source=qr" target="_blank" rel="noopener"><i class="ph ph-instagram-logo"></i></a>
                    <a href="https://vt.tiktok.com/ZSCbGXCc5/" target="_blank" rel="noopener"><i class="ph ph-tiktok-logo"></i></a>
                    <a href="https://wa.me/923090625199" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i></a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        // Inject dropdown-specific styles once (kept self-contained so it works
        // regardless of what style.css defines for .menu-link)
        if (!document.getElementById('menuShopDropdownStyles')) {
            const style = document.createElement('style');
            style.id = 'menuShopDropdownStyles';
            style.textContent = `
                .menu-shop-toggle {
                    background: none; border: none; width: 100%; text-align: left;
                    cursor: pointer; font: inherit; display: flex; align-items: center;
                    justify-content: space-between;
                }
                .menu-shop-toggle-label { display: flex; align-items: center; gap: 10px; }
                .menu-shop-caret { transition: transform 0.2s ease; }
                .menu-link-group.open > .menu-shop-toggle .menu-shop-caret { transform: rotate(180deg); }
                .menu-shop-submenu {
                    display: none; flex-direction: column; overflow: hidden;
                }
                .menu-link-group.open > .menu-shop-submenu { display: flex; }
                .menu-sublink { padding-left: 34px !important; font-size: 0.85rem !important; opacity: 0.85; }
                .menu-sublink:hover { opacity: 1; }
                .menu-subgroup .menu-shop-toggle { padding-left: 34px !important; }
                .menu-subsublink { padding-left: 58px !important; font-size: 0.8rem !important; }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('closeMenu').addEventListener('click', closeMenu);

        const shopToggle = document.getElementById('menuShopToggle');
        const shopGroup = document.getElementById('menuShopGroup');
        if (shopToggle && shopGroup) {
            shopToggle.addEventListener('click', (e) => {
                e.preventDefault();
                shopGroup.classList.toggle('open');
            });
        }

        const womenToggle = document.getElementById('menuWomenToggle');
        const womenGroup = document.getElementById('menuWomenGroup');
        if (womenToggle && womenGroup) {
            womenToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                womenGroup.classList.toggle('open');
            });
        }

        const budgetToggle = document.getElementById('menuBudgetToggle');
        const budgetGroup = document.getElementById('menuBudgetGroup');
        if (budgetToggle && budgetGroup) {
            budgetToggle.addEventListener('click', (e) => {
                e.preventDefault();
                budgetGroup.classList.toggle('open');
            });
        }

        const sizeToggle = document.getElementById('menuSizeToggle');
        const sizeGroup = document.getElementById('menuSizeGroup');
        if (sizeToggle && sizeGroup) {
            sizeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                sizeToggle.parentElement.classList.toggle('open');
            });
        }

        const trackOrderBtn = document.getElementById('menuTrackOrder');
        if (trackOrderBtn) {
            trackOrderBtn.addEventListener('click', () => {
                closeMenu();
                openTrackOrderModal();
            });
        }
    }

    // ===== TRACK ORDER MODAL =====
    function openTrackOrderModal() {
        if (document.getElementById('trackOrderModal')) {
            document.getElementById('trackOrderModal').classList.add('active');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'trackOrderModal';
        modal.style.cssText = `
            position:fixed;inset:0;z-index:9999;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
            padding:20px;box-sizing:border-box;
        `;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;width:100%;max-width:420px;
                        padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,0.2);
                        font-family:'Poppins',sans-serif;position:relative;">
                <button id="trackOrderClose" style="position:absolute;top:14px;right:16px;
                    background:none;border:none;cursor:pointer;font-size:1.4rem;
                    color:#888;line-height:1;">&#x2715;</button>
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="width:48px;height:48px;background:#f0fdf4;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 10px;">
                        <i class="ph ph-map-pin" style="font-size:1.5rem;color:#16a34a;"></i>
                    </div>
                    <h2 style="margin:0 0 4px;font-size:1.15rem;font-weight:700;color:#111;">Track Your Order</h2>
                    <p style="margin:0;font-size:0.82rem;color:#888;">Enter your details and we'll connect you to WhatsApp</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:14px;">
                    <div>
                        <label style="font-size:0.75rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Your Name</label>
                        <input id="trackName" type="text" placeholder="e.g. Fariha Khan"
                            style="width:100%;box-sizing:border-box;padding:11px 14px;
                            border:1.5px solid #e5e7eb;border-radius:10px;font-size:0.9rem;
                            font-family:inherit;outline:none;transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    <div>
                        <label style="font-size:0.75rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Phone / WhatsApp Number</label>
                        <input id="trackPhone" type="tel" placeholder="03XX-XXXXXXX"
                            style="width:100%;box-sizing:border-box;padding:11px 14px;
                            border:1.5px solid #e5e7eb;border-radius:10px;font-size:0.9rem;
                            font-family:inherit;outline:none;transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    <div>
                        <label style="font-size:0.75rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Order Details <span style="color:#aaa;font-weight:400;text-transform:none;">(optional)</span></label>
                        <input id="trackOrder" type="text" placeholder="e.g. Order #123 or product name"
                            style="width:100%;box-sizing:border-box;padding:11px 14px;
                            border:1.5px solid #e5e7eb;border-radius:10px;font-size:0.9rem;
                            font-family:inherit;outline:none;transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    <button id="trackSubmitBtn"
                        style="width:100%;padding:13px;background:#25D366;color:#fff;
                        border:none;border-radius:10px;font-size:0.95rem;font-weight:600;
                        font-family:inherit;cursor:pointer;display:flex;align-items:center;
                        justify-content:center;gap:8px;transition:background 0.2s;"
                        onmouseover="this.style.background='#1ebe5d'" onmouseout="this.style.background='#25D366'">
                        <i class="ph-fill ph-whatsapp-logo" style="font-size:1.2rem;"></i>
                        Track via WhatsApp
                    </button>
                    <p style="text-align:center;font-size:0.75rem;color:#aaa;margin:0;">
                        You'll be redirected to WhatsApp to chat with us directly.
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        document.getElementById('trackOrderClose').addEventListener('click', () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        document.getElementById('trackSubmitBtn').addEventListener('click', () => {
            const name  = document.getElementById('trackName').value.trim();
            const phone = document.getElementById('trackPhone').value.trim();
            const order = document.getElementById('trackOrder').value.trim();

            if (!name) { alert('Please enter your name.'); return; }
            if (!phone) { alert('Please enter your phone number.'); return; }

            let msg = `Hi! I'd like to track my order.\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}`;
            if (order) msg += `\n📦 *Order Details:* ${order}`;
            msg += `\n\nKindly provide an update on my order. Thank you! 🙏`;

            const waUrl = `https://wa.me/923090625199?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        });

        // Auto-focus name
        setTimeout(() => document.getElementById('trackName').focus(), 100);
    }

    function openMenu() {
        createMenuDrawer();
        document.getElementById('menuOverlay').classList.add('active');
        document.getElementById('menuDrawer').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        const overlay = document.getElementById('menuOverlay');
        const drawer = document.getElementById('menuDrawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('active');
        document.body.style.overflow = '';
    }
    window.closeMenu = closeMenu;
    window.openMenu = openMenu;
    window.openSearch = openSearch;

    // ===== CONNECT ALL BUTTONS =====
    
    // Detect if we are on the home page or collection page
    const isCollectionPage = window.location.pathname.includes('collection/');
    const homePath = isCollectionPage ? '../index.html' : 'index.html';
    const shoesPath = isCollectionPage ? 'shop.html' : 'shop.html';

    // Menu buttons (hamburger icon)
    // Skip buttons that have a page-specific ID and their own handlers (e.g. pdAddToCart on product-detail).
    const PAGE_OWNED_BTN_IDS = ['pdAddToCart'];
    document.querySelectorAll('.icon-btn, button').forEach(btn => {
        // Don't double-wire buttons that are fully managed by the page's own script
        if (btn.id && PAGE_OWNED_BTN_IDS.includes(btn.id)) return;
        // Skip already-wired buttons
        if (btn._mainJsWired) return;
        btn._mainJsWired = true;

        const icon = btn.querySelector('i');
        if (!icon) return;
        
        if (icon.classList.contains('ph-list')) {
            btn.addEventListener('click', openMenu);
        }
        if (icon.classList.contains('ph-magnifying-glass')) {
            btn.addEventListener('click', openSearch);
        }
        if (icon.classList.contains('ph-shopping-bag') || icon.classList.contains('ph-shopping-cart')) {
            btn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                window.location.href = 'checkout.html'; 
            });
        }
        if (icon.classList.contains('ph-arrow-left')) {
            btn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = homePath;
                }
            });
        }
    });

    // Also wire up explicit IDs on the home/shop page
    const menuToggle = document.getElementById('menuToggle');
    const searchToggle = document.getElementById('searchToggle');
    const cartToggle = document.getElementById('cartToggle');
    if (menuToggle) menuToggle.addEventListener('click', openMenu);
    if (searchToggle) searchToggle.addEventListener('click', openSearch);
    if (cartToggle) cartToggle.addEventListener('click', () => { window.location.href = 'checkout.html'; });

    // ===== ADD-TO-CART BUTTONS ON PRODUCT CARDS =====
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.querySelector('h4')?.textContent || card.querySelector('h3')?.textContent || 'Product';
        const priceText = card.querySelector('.price')?.textContent || '$0';
        const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const img = card.querySelector('img')?.getAttribute('src') || '';

        // Create add-to-cart button
        const addBtn = document.createElement('button');
        addBtn.className = 'add-to-cart-btn';
        addBtn.innerHTML = '<i class="ph ph-shopping-bag"></i>';
        addBtn.title = 'Add to Cart';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(name, priceNum, img);
        });

        const imgWrap = card.querySelector('.product-img-wrap');
        if (imgWrap) {
            imgWrap.style.position = 'relative';
            imgWrap.appendChild(addBtn);
        }
    });

    // ===== CONNECT CATEGORY CARDS TO SHOES PAGE =====
    // Preserve any existing href (e.g. ?filter=men / ?filter=unisex) set in the HTML.
    // Only fall back to the plain shop page if the card has no href at all.
    document.querySelectorAll('.category-card').forEach(card => {
        if (!card.getAttribute('href')) {
            card.setAttribute('href', shoesPath);
        }
    });

    // ===== SIZE BUTTONS -> SHOES PAGE =====
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = shoesPath;
        });
    });

    // ===== VIEW ALL BUTTONS =====
    document.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = shoesPath;
        });
    });

    // ===== BRAND LOGOS -> SHOES PAGE =====
    document.querySelectorAll('.brand-logo').forEach(logo => {
        logo.addEventListener('click', () => {
            window.location.href = shoesPath;
        });
    });

    // ===== LOGO -> HOME =====
    document.querySelectorAll('.logo, .font-logo').forEach(logo => {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = homePath;
        });
    });

    // ===== NEWSLETTER FORM =====
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input');
            if (input && input.value.trim()) {
                showNotification('Thank you for subscribing!');
                input.value = '';
            } else {
                showNotification('Please enter a valid email address.');
            }
        });
    }

    // ===== WHATSAPP FLOATING BUTTON =====
    // Skip if the page already has its own (e.g. product-detail.html, shop.html)
    if (!document.querySelector('.whatsapp-float')) {
        const whatsappFloat = document.createElement('a');
        whatsappFloat.href = 'https://wa.me/923090625199?text=Hi! I\'m interested in Fariha\'s Collection products.';
        whatsappFloat.target = '_blank';
        whatsappFloat.className = 'whatsapp-float';
        whatsappFloat.innerHTML = '<i class="ph-fill ph-whatsapp-logo"></i>';
        whatsappFloat.title = 'Chat with us on WhatsApp';
        document.body.appendChild(whatsappFloat);
    }

    // ===== SCROLL ANIMATIONS (Intersection Observer) =====
    // Use a lower threshold on mobile so cards on small screens still animate in
    const isMobile = window.innerWidth <= 768;
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -30px 0px',
        threshold: isMobile ? 0.05 : 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal-up:not(.reveal .reveal-up), .reveal-scale:not(.reveal .reveal-scale), .reveal-fade:not(.reveal .reveal-fade)');
    revealElements.forEach(el => scrollObserver.observe(el));

    // Safety fallback: if any reveal element is still invisible after 2 seconds, force it visible.
    // This handles edge cases where IntersectionObserver doesn't fire (e.g. old iOS Safari, offscreen quirks).
    setTimeout(() => {
        document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-scale, .reveal').forEach(el => {
            el.classList.add('visible');
        });
    }, 2000);

    // ===== TRENDY ITEMS FILTERING =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('#productGrid .product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                card.classList.remove('reveal-up', 'visible');
                
                if (filterValue === 'all' || card.classList.contains(filterValue)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.classList.add('reveal-up', 'visible');
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // ===== HEADER SCROLL EFFECT =====
    // Header on index.html always starts visible (class 'scrolled' set in HTML).
    // On other pages that use the transparent header, apply scroll effect.
    const header = document.querySelector('.header:not(.scrolled)');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ===== INIT =====
    updateCartBadge();

    // ===== SANITY POWERED BANNER =====
    async function loadGlobalBanner() {
        try {
            const SANITY_PROJECT_ID = 'kxnjofhp';
            const SANITY_DATASET = 'production';
            const SANITY_API_VERSION = '2024-01-01';
            const query = `*[_type == "siteSettings"][0]{
                announcementText, 
                isAnnouncementActive,
                "promoBanner1": promoBanner1.asset->url,
                "promoBanner2": promoBanner2.asset->url
            }`;
            const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
            
            const res = await fetch(url);
            const json = await res.json();
            const settings = json.result;
            
            const banner = document.getElementById('topPinnedBanner');
            if (banner && settings) {
                // If it's explicitly active and has text, replace the default text
                if (settings.isAnnouncementActive && settings.announcementText) {
                    banner.innerHTML = settings.announcementText;
                    banner.style.display = 'block';
                } 
                // If it's explicitly set to not active, hide the banner entirely
                else if (settings.isAnnouncementActive === false) {
                    banner.style.display = 'none';
                }
            }

            // Also update the promotional image banners on index.html if they exist
            if (settings) {
                const img1 = document.getElementById('promoBannerImg1');
                if (img1 && settings.promoBanner1) img1.src = settings.promoBanner1;
                
                const img2 = document.getElementById('promoBannerImg2');
                if (img2 && settings.promoBanner2) img2.src = settings.promoBanner2;
            }
        } catch (e) {
            console.error('Error loading Sanity banner:', e);
        }
    }
    loadGlobalBanner();
});


