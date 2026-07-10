const fs = require('fs');

function createSection(name, categoryValue) {
    const Name = name.charAt(0).toUpperCase() + name.slice(1);
    const gridId = categoryValue + 'Grid';
    const loadingId = categoryValue + 'Loading';
    const fnName = 'load' + Name;

    return `
    <!-- ${Name} Section -->
    <section class="section trendy-section reveal" style="margin-top:0;">
        <h3 class="section-title">${Name}</h3>
        <div class="product-grid" id="${gridId}">
            <p id="${loadingId}" class="col-span-full" style="text-align:center;color:#aaa;font-size:0.9rem;padding:40px 0;">Loading ${name.toLowerCase()}...</p>
        </div>
        <a href="shoes (1).html?filter=${categoryValue}" class="view-all-btn btn-outline reveal-up" style="display:inline-block;text-decoration:none;text-align:center;">View All ${Name}</a>
    </section>

    <script>
    (async function ${fnName}() {
        const SANITY_PROJECT_ID = 'kxnjofhp';
        const SANITY_DATASET = 'production';
        const SANITY_API_VERSION = '2024-01-01';

        const query = \`*[_type == "shoe" && category == "${categoryValue}"] | order(order asc) [0...8]{
            _id, name, price, tag, brand, soldOut,
            "sizes": sizes[]{size, stock},
            "image": image.asset->url
        }\`;

        const url = \`https://\${SANITY_PROJECT_ID}.api.sanity.io/v\${SANITY_API_VERSION}/data/query/\${SANITY_DATASET}?query=\${encodeURIComponent(query)}\`;
        const grid = document.getElementById('${gridId}');

        try {
            const res = await fetch(url);
            const json = await res.json();
            const products = json.result || [];

            if (!products.length) {
                grid.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px 0;">No ${name.toLowerCase()} available right now.</p>';
                return;
            }

            grid.innerHTML = products.map((p, i) => {
                const id    = p._id || '';
                const name  = p.name || 'Untitled';
                const price = Number(p.price) || 0;
                const image = p.image || '';
                const tag   = p.brand || p.tag || "Fariha's Collection";
                const delay = i + 1;
                const params = new URLSearchParams({ id, name, price, image, tag });
                const esc = s => String(s).replace(/"/g, '&quot;');

                // Sold out check
                const isOutOfStock = p.soldOut === true || (Array.isArray(p.sizes) && p.sizes.length > 0 && !p.sizes.some(s => s.stock > 0));
                const soldOutOverlay = isOutOfStock ? \`<div style="position:absolute;top:8px;left:8px;background:#dc2626;color:#fff;font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:3px;">Sold Out</div>\` : '';

                return \`
                    <a href="product-detail.html?\${params.toString()}"
                       class="product-card reveal-up delay-\${delay}"
                       style="text-decoration:none;color:inherit;display:block;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);background:#fff;transition:transform 0.3s ease,box-shadow 0.3s ease;">
                        <div class="product-img-wrap" style="position:relative;border-radius:0;margin-bottom:0;">
                            <img src="\${esc(image)}" alt="\${esc(name)}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">
                            \${soldOutOverlay}
                        </div>
                        <div class="product-info" style="padding:12px 14px 14px;">
                            <p class="brand">\${esc(tag)}</p>
                            <h4>\${esc(name)}</h4>
                            <p class="price">Rs\${price.toLocaleString()}</p>
                        </div>
                    </a>
                \`;
            }).join('');

            // Trigger scroll reveal
            document.querySelectorAll('#${gridId} .reveal-up').forEach(el => {
                if (typeof scrollObserver !== 'undefined') scrollObserver.observe(el);
                else el.classList.add('visible');
            });

        } catch (err) {
            console.error('Failed to load ${name.toLowerCase()}:', err);
            grid.innerHTML = '<p style="text-align:center;color:#e53935;padding:40px 0;">Could not load ${name.toLowerCase()}.</p>';
        }
    })();
    </script>
`;
}

let content = fs.readFileSync('index.html', 'utf8');

// I will just replace the existing Slides section with Flats, Slides, Sneakers, Pumps.
// The existing Slides section ends with `})(); </script> <!-- Banners Section -->`

const target = '    <!-- Banners Section -->';
const sections = createSection('Flats', 'flats') + createSection('Slides', 'slides') + createSection('Sneakers', 'sneakers') + createSection('Pumps', 'pumps');

// Wait, earlier I made "Slides" which is still there. Let's just remove the existing Slides section entirely using regex and replace it with the new ones, or just keep it and add Flats, Sneakers, Pumps.
// To be perfectly safe, I will just remove the existing Slides section and inject Flats, Slides, Sneakers, Pumps.

const regex = /    <!-- Slides Section -->[\s\S]*?    <!-- Banners Section -->/;
content = content.replace(regex, sections + '\n    <!-- Banners Section -->');

fs.writeFileSync('index.html', content);
console.log('Sections updated successfully in index.html');
