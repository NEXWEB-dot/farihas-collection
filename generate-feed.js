// Meta/Facebook Commerce Catalog Feed Generator
// Run: node generate-feed.js
// Output: catalog-feed.xml
// Feed URL for Meta Catalog: https://farihascollection.com/catalog-feed.xml
const fs = require('fs');
const https = require('https');

const BASE_URL = 'https://farihascollection.com';
const WORKER_URL = 'fc-cms.sheezarazzak.workers.dev';

const apiUrl = `https://${WORKER_URL}/api/products`;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateXML(products) {
  const items = products.map(p => {
    // Determine condition (if tag contains NWT, it's new with tags, otherwise used)
    const isNew = p.tag && p.tag.toLowerCase().includes('nwt');
    const cond = isNew ? 'new_with_tags' : 'used';
    
    // Default brand to Fariha's Collection if missing
    const brand = p.brand || "Fariha's Collection";
    
    // Base URL mapping
    const link = `${BASE_URL}/product-detail.html?id=${p._id}&name=${encodeURIComponent(p.name)}&price=${p.price}&image=${encodeURIComponent(p.image)}`;
    
    // We try to pull size out of the array if available
    let sizeText = 'One Size';
    if (p.sizes && p.sizes.length > 0) {
      sizeText = `EU ${p.sizes[0].size}`.trim();
    }

    return `    <item>
      <g:id>${p._id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${p.image}</g:image_link>
      <g:price>${p.price} PKR</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>${cond}</g:condition>
      <g:brand>${esc(brand)}</g:brand>
      <g:google_product_category>187</g:google_product_category>
      <g:product_type>Shoes &gt; ${esc(p.category || 'Women\'s Shoes')}</g:product_type>
      <g:size>${esc(sizeText)}</g:size>
      <g:gender>female</g:gender>
      <g:age_group>adult</g:age_group>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard</g:service>
        <g:price>200 PKR</g:price>
      </g:shipping>
    </item>`;
  }).join('\n\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
=======================================================================
  META / FACEBOOK COMMERCE CATALOG FEED
  Store   : Fariha's Collection
  Website : https://farihascollection.com
  Currency: PKR (Pakistani Rupee)
  Products: ${products.length}
  Generated: ${new Date().toISOString().split('T')[0]}
=======================================================================
-->
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Fariha's Collection</title>
    <link>https://farihascollection.com</link>
    <description>Premium Preloved and New Shoes in Pakistan</description>

${items}

  </channel>
</rss>`;

  fs.writeFileSync('catalog-feed.xml', xml, 'utf8');
  console.log(`SUCCESS: catalog-feed.xml written with ${products.length} products.`);
}

console.log('Fetching live products from Worker API...');
https.get(apiUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      // Worker API returns { products: [...] }
      const rawProducts = json.products || json.result || [];
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        // Normalise Worker product shape to match generateXML expectations
        const products = rawProducts.map(p => ({
          _id:         p.id || p._id || '',
          name:        p.name || '',
          price:       p.price || 0,
          tag:         p.subCategory || p.category || '',
          description: p.description || p.name || '',
          image:       (p.images && p.images[0]) ? p.images[0] : '',
          sizes:       (p.sizes || []).map(s => ({ size: s.size || s, stock: s.stock || 1 })),
          brand:       p.brand || "Fariha's Collection",
          category:    p.category || '',
          inStock:     !p.soldOut,
          _type:       p.category === 'clearance' ? 'clearanceSale' : 'shoe',
        }));
        generateXML(products);
      } else {
        console.error('No products returned from Worker API. Response:', JSON.stringify(json).slice(0, 300));
      }
    } catch (e) {
      console.error('Error parsing Worker API data:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('Network error fetching Worker API data:', e.message);
});
