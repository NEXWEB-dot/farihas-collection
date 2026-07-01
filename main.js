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
                        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
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
                <span>$${total.toFixed(2)}</span>
            </div>
            <button class="cart-checkout-btn" id="whatsappCheckout">
                <i class="ph ph-whatsapp-logo"></i> Checkout via WhatsApp
            </button>
        `;
        
        document.getElementById('whatsappCheckout').addEventListener('click', checkoutWhatsApp);
    }

    // ===== WHATSAPP CHECKOUT =====
    function checkoutWhatsApp() {
        if (cart.length === 0) return;
        
        const phone = '1800123456'; // Replace with actual WhatsApp number
        let message = '🛒 *New Order from Fariha\'s Collection*\n\n';
        let total = 0;
        
        cart.forEach((item, i) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            message += `${i + 1}. *${item.name}*\n   Qty: ${item.qty} × $${item.price.toFixed(2)} = $${itemTotal.toFixed(2)}\n\n`;
        });
        
        message += `---\n💰 *Total: $${total.toFixed(2)}*\n\nPlease confirm my order. Thank you!`;
        
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

    function performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query) {
            resultsContainer.innerHTML = '<p class="search-hint">Type to search products...</p>';
            return;
        }

        // Search through product cards on the page
        const allCards = document.querySelectorAll('.product-card');
        const matches = [];
        
        allCards.forEach(card => {
            const name = card.querySelector('h4')?.textContent || '';
            const brand = card.querySelector('.brand')?.textContent || '';
            if (name.toLowerCase().includes(query) || brand.toLowerCase().includes(query)) {
                const img = card.querySelector('img')?.src || '';
                const price = card.querySelector('.price')?.textContent || '';
                matches.push({ name, brand, img, price });
            }
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<p class="search-hint">No products found for "${query}"</p>`;
            return;
        }

        let html = '';
        matches.forEach(m => {
            html += `
                <div class="search-result-item" onclick="document.getElementById('searchOverlay').classList.remove('active'); document.body.style.overflow='';">
                    <img src="${m.img}" alt="${m.name}">
                    <div>
                        <p class="search-result-brand">${m.brand}</p>
                        <p class="search-result-name">${m.name}</p>
                        <p class="search-result-price">${m.price}</p>
                    </div>
                </div>
            `;
        });
        resultsContainer.innerHTML = html;
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
                <a href="shoes (1).html" class="menu-link"><i class="ph ph-sneaker"></i> Shoes Collection</a>
                <a href="#" class="menu-link" onclick="closeMenu()"><i class="ph ph-user"></i> About Us</a>
                <a href="#" class="menu-link" onclick="closeMenu()"><i class="ph ph-phone"></i> Contact Us</a>
                <a href="#" class="menu-link" onclick="closeMenu()"><i class="ph ph-truck"></i> Shipping Policy</a>
                <a href="#" class="menu-link" onclick="closeMenu()"><i class="ph ph-arrow-counter-clockwise"></i> Returns & Exchanges</a>
                <a href="#" class="menu-link" onclick="closeMenu()"><i class="ph ph-question"></i> FAQ</a>
            </nav>
            <div class="menu-footer">
                <div class="menu-social">
                    <a href="#"><i class="ph ph-facebook-logo"></i></a>
                    <a href="#"><i class="ph ph-instagram-logo"></i></a>
                    <a href="#"><i class="ph ph-twitter-logo"></i></a>
                    <a href="#"><i class="ph ph-tiktok-logo"></i></a>
                    <a href="#"><i class="ph ph-whatsapp-logo"></i></a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        document.getElementById('closeMenu').addEventListener('click', closeMenu);
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
    const shoesPath = isCollectionPage ? 'shoes (1).html' : 'shoes (1).html';

    // Menu buttons (hamburger icon)
    document.querySelectorAll('.icon-btn, button').forEach(btn => {
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

    // Also wire up explicit IDs on the home page
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
    document.querySelectorAll('.category-card').forEach(card => {
        card.setAttribute('href', shoesPath);
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
    const whatsappFloat = document.createElement('a');
    whatsappFloat.href = 'https://wa.me/1800123456?text=Hi! I\'m interested in Fariha\'s Collection products.';
    whatsappFloat.target = '_blank';
    whatsappFloat.className = 'whatsapp-float';
    whatsappFloat.innerHTML = '<i class="ph-fill ph-whatsapp-logo"></i>';
    whatsappFloat.title = 'Chat with us on WhatsApp';
    document.body.appendChild(whatsappFloat);

    // ===== SCROLL ANIMATIONS (Intersection Observer) =====
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
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
});
