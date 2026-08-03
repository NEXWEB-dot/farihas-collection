// Meta/Facebook Commerce Catalog Feed Generator
// Run: node generate-feed.js
// Output: catalog-feed.xml
const fs = require('fs');

const BASE_URL = 'https://farihascollection.com';

const products = [
  {id:'0263bba1-f17f-46f5-9da1-de7b936c0469',title:'Vibrant Red Mary Jane Espadrilles - Primark',desc:"Vibrant Red Mary Jane Espadrilles by Primark. Premium pre-loved shoes from Fariha's Collection, Pakistan. Size EU 40.",price:'2700',brand:'Primark',cat:"Women's Shoes > Tagged",size:'EU 40',color:'Red',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/daf369822683efe9746add1aa369a6f94bb5210c-896x1195.jpg'},
  {id:'0e885200-ec3e-4864-8037-ae501d99b589',title:'Elegant Noir Dream Pairs Platform Heels',desc:'Elegant Noir Dream Pairs Platform Heels. DOT PERFECT QUALITY. Pre-loved. Size EU 41.',price:'1250',brand:'Dream Pairs',cat:"Women's Shoes > Heels",size:'EU 41',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/c98eaf0ab39a5bc9b5f1c48395f7127da72af405-896x1195.jpg'},
  {id:'1abb795a-3c10-4579-b3a7-7e057ea8e10c',title:'Skechers Air-Cooled Memory Foam Flats',desc:'Skechers slip-ons with geometric knit pattern and high-quality memory foam technology. Lightweight and breathable. Pre-loved. Size EU 38.5.',price:'2700',brand:'Skechers',cat:"Women's Shoes > Flats",size:'EU 38.5',color:'Neutral',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/154078d50384c3b74000a7ddb3309dc4d775534d-896x1195.jpg'},
  {id:'1f7c05af-68d1-4702-9610-5150c22b27a9',title:'Effortless Espadrille Slides - H&M',desc:'Effortless Espadrille Slides by H&M. Lightweight flat slides for everyday wear. Pre-loved. Size EU 40.',price:'1000',brand:'H&M',cat:"Women's Shoes > Flats",size:'EU 40',color:'Beige',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/e8b81a19ecb87eae7f7a0b817921b4c6f6db6e43-896x1195.jpg'},
  {id:'25e5db40-7518-4f15-8c13-cea2e725a732',title:'Y2K Glam Wild Fable Platform Pumps',desc:'Y2K Glam Platform Pumps by Wild Fable. Bold statement heels with platform sole. Pre-loved. Size EU 39.',price:'1250',brand:'Wild Fable',cat:"Women's Shoes > Heels",size:'EU 39',color:'Multicolor',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/b074d54176b6acade8d13adfd29dbc38a5b9cac2-896x1195.jpg'},
  {id:'26dc61c2-1aaa-4a40-81e0-9c184b15395d',title:'Classic Grey Espadrilles - Primark',desc:'Classic Grey Espadrilles by Primark. Timeless casual style with comfortable espadrille sole. Pre-loved. Size EU 42.',price:'2700',brand:'Primark',cat:"Women's Shoes",size:'EU 42',color:'Grey',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/9c1bb2f6a2a2913b74ff166d1e4476a44c34d1e5-896x1195.jpg'},
  {id:'27690557-719a-4573-9a72-a3acf43f7793',title:'Classic Olive Block Heel Sandals - Merona',desc:'Classic Olive Block Heel Sandals by Merona. Versatile block heels with elegant strap design. Pre-loved. Size EU 41.',price:'1250',brand:'Merona',cat:"Women's Shoes > Heels",size:'EU 41',color:'Olive',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/e18e95487038b3f99604acfd2c9bfe330d461644-896x1195.jpg'},
  {id:'329d47f3-01a1-46ff-9a6f-ac4680fa3998',title:'Fierce Glamorous Zara Snakeskin Platform Heels',desc:'Fierce and Glamorous Zara Snakeskin Platform Heels. DOT PERFECT QUALITY. Bold snakeskin-print platform. Pre-loved. Size EU 37.',price:'2500',brand:'Zara',cat:"Women's Shoes > Heels",size:'EU 37',color:'Brown',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/16b0da10f6abbdc5dc1ac29136b508b6b30fc505-896x1195.jpg'},
  {id:'33195d6c-cad8-4c63-be7a-521b9806cc6b',title:'Classic Black Leather Loafers - Franco Sarto',desc:'Sleek minimalist Black Leather Loafers by Franco Sarto. Refined stitching and signature accent. Transitions from professional to casual. Pre-loved. Size EU 40.',price:'1100',brand:'Franco Sarto',cat:"Women's Shoes > Loafers",size:'EU 40',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/f9e7d7c62fcbf79425ef88ea47485460c213c7d4-1280x720.jpg'},
  {id:'3520b5c9-1d15-4d90-9679-dd0d87efcc96',title:'Sophisticated Suede Stiletto Pumps - Primadonna Collection',desc:'Sophisticated Suede Stiletto Pumps by Primadonna Collection. Elegant timeless stiletto heels in premium suede. Perfect for formal occasions. Pre-loved. Size EU 40.',price:'1250',brand:'Primadonna Collection',cat:"Women's Shoes > Heels",size:'EU 40',color:'Beige',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/b1d145bc1d2488b2fe2a760f906de3465f0049cf-896x1195.jpg'},
  {id:'3fabd824-f96a-419b-9388-58710d8ad07e',title:'Stylish Dream Pairs Clear-Strap Heels',desc:'Stylish Dream Pairs Clear-Strap Heels. Modern transparent strap design for a barely-there elegant look. Pre-loved. Size EU 38.',price:'1250',brand:'Dream Pairs',cat:"Women's Shoes > Heels",size:'EU 38',color:'Clear',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/055fe1d8c51012e040f4b89b333c47a4d748879b-896x1195.jpg'},
  {id:'47742c0d-f490-4039-8b6c-13e28ee8cd5d',title:'Classic Black Penny Loafers - Old Navy',desc:'Classic Black Penny Loafers by Old Navy. Timeless everyday comfort with classic silhouette. Pre-loved. Size EU 38.',price:'1100',brand:'Old Navy',cat:"Women's Shoes > Loafers",size:'EU 38',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/aecb285d765081e07f652aa6118e993ca5a62647-896x1195.jpg'},
  {id:'51b10340-f387-4559-84d4-731786cfb02b',title:'Sleek Minimalist Wild Diva Clear-Strap Heels',desc:'Sleek Minimalist Clear-Strap Heels by Wild Diva. DOT PERFECT QUALITY. Barely-there transparent strap heels. Pre-loved. Size EU 38.',price:'1000',brand:'Wild Diva',cat:"Women's Shoes > Heels",size:'EU 38',color:'Clear',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/5e24bb79e71fb8ea9c2bdcd1dc2209d2e29ece83-896x1195.jpg'},
  {id:'5e49fba4-32ce-4ce3-a7a6-73a4d04a1548',title:'Minimalist Elegance Cushionaire Block Heels',desc:'Minimalist Elegance Block Heels by Cushionaire. Comfortable block heels with clean aesthetic. Great everyday heel. Pre-loved. Size EU 38.',price:'750',brand:'Cushionaire',cat:"Women's Shoes > Heels",size:'EU 38',color:'Beige',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/ada96c791843e4d00a2cca6f054170ae10eabd0a-768x1024.jpg'},
  {id:'7f3cf8f0-bad0-4118-8293-1e27726f8372',title:'Sparkling Skechers Yoga Foam Sandals',desc:'Sparkling Skechers Yoga Foam Sandals. Ultra-comfortable yoga foam footbed with sparkling embellishments. Pre-loved. Size EU 38.',price:'2700',brand:'Skechers',cat:"Women's Shoes > Sandals",size:'EU 38',color:'White',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/b6dcd3594dbf3a9f9c62729858cd2b974328bff6-896x1195.jpg'},
  {id:'862f4663-8e23-458e-aeed-9fde6ec3cfb9',title:'Versatile Merrell Adventure Sandals',desc:'Versatile Merrell Adventure Sandals. DOT PERFECT QUALITY. Durable outdoor adventure sandals by Merrell. Pre-loved. Size EU 40.',price:'2700',brand:'Merrell',cat:"Women's Shoes > Sandals",size:'EU 40',color:'Brown',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/a34313ddca7dce4a31a47820430cc6461b1f0e76-896x1195.jpg'},
  {id:'94882d48-7fd5-4395-ba90-8e0a2d76b67b',title:'Vibrant Fuchsia Satin Heels - Jenn Ardor',desc:"Vibrant Fuchsia Satin Cross-Strap Pumps by Jenn Ardor. Pointed-toe pumps with fuchsia pink satin and asymmetrical cross-strap. Perfect for gala nights and cocktail parties. Thrifted excellent condition. Size EU 38.5.",price:'1250',brand:'Jenn Ardor',cat:"Women's Shoes > Heels",size:'EU 38.5',color:'Fuchsia',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/47b047da379f7644b38a867fbf57f6ce376715f2-896x1195.jpg'},
  {id:'94e1ef1d-6308-47a9-867b-528208ea4296',title:'Classic Tan Block-Heel Mules - PIZZ HNNU',desc:'Classic Tan Block-Heel Mules. Chic block-heel mules in warm tan tone, perfect for any occasion. Pre-loved. Size EU 41.',price:'1250',brand:'PIZZ HNNU',cat:"Women's Shoes > Heels",size:'EU 41',color:'Tan',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/9c26ea1e041247bc373ef97b17206670849015f4-1280x698.jpg'},
  {id:'aa5ac213-071a-49eb-8e49-fd49119e1c7a',title:'Classic Comfort Time and Tru Penny Loafers',desc:'Classic Comfort Penny Loafers by Time and Tru. Premium everyday comfort loafers with classic design. Pre-loved. Size EU 40.5.',price:'1250',brand:'Time and Tru',cat:"Women's Shoes > Loafers",size:'EU 40.5',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/d793d5606ab25d8a9d149d58c06658ec2125ea62-896x1195.jpg'},
  {id:'aeb0293c-f689-467e-844e-538f97aa60c0',title:'Minimalist Nude Block Heel Sandals - CL by Laundry',desc:'Minimalist Nude Block Heel Sandals by CL by Laundry. Clean and elegant nude block heels that pair with everything. Pre-loved. Size EU 40.',price:'1000',brand:'CL by Laundry',cat:"Women's Shoes > Sandals",size:'EU 40',color:'Nude',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/7034ed62774f96f50cdf56733568fcb256a22ce3-896x1195.jpg'},
  {id:'b156fc98-5dce-44ed-b9bd-e268fdd5a95b',title:'Cozy Faux Fur Cross-Strap Slides - Forever 21 (NWT)',desc:'Velvet Luxe Cross-Strap Slides by Forever 21. New With Tags. Plush faux fur upper with metallic stud detailing. Ultra-soft indoor or street-ready. Size EU 40.',price:'1350',brand:'Forever 21',cat:"Women's Shoes > Slides",size:'EU 40',color:'White',cond:'new_with_tags',img:'https://cdn.sanity.io/images/kxnjofhp/production/69cb116430c60f3a5c5e7e1ebc0939ad6a76ba35-1280x698.jpg'},
  {id:'b55f1104-c3de-483c-9d37-fc4136605651',title:'Cape Robbin Clear Strap Heel Mules',desc:'Cape Robbin Clear Strap Heel Mules. Contemporary mule style with sleek transparent straps. Pre-loved. Size EU 40.',price:'1250',brand:'Cape Robbin',cat:"Women's Shoes > Heels",size:'EU 40',color:'Clear',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/d97d5f6afb09ee249704aff982711d0f1de0eb73-896x1195.jpg'},
  {id:'b9d8e709-ed8a-49fa-b05c-e2aa090c44d3',title:'Classic Pink Canvas TOMS Slip-Ons (NWT)',desc:'Classic Pink Canvas TOMS Slip-Ons. New With Tags Pristine. Iconic TOMS comfort in cheerful pink canvas. Lightweight sustainable. Size EU 37.',price:'1250',brand:'TOMS',cat:"Women's Shoes > Flats",size:'EU 37',color:'Pink',cond:'new_with_tags',img:'https://cdn.sanity.io/images/kxnjofhp/production/e1024c9f45470aeb5f5bf8d1cd122e6ecb881066-1280x720.jpg'},
  {id:'c3fd280b-e222-4b1d-9a7c-10195eed9f4c',title:'Timeless Black Block Heel Sandals - A New Day',desc:'Timeless Black Block Heel Sandals by A New Day. Classic block heels that go with any outfit. Comfortable stable heel. Pre-loved. Size EU 38.',price:'1250',brand:'A New Day',cat:"Women's Shoes > Sandals",size:'EU 38',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/6578200976d32b9242cd90889b3f640d8b481ff0-896x1195.jpg'},
  {id:'e9f319e3-545f-4b98-98af-9a5458bc58c0',title:'Glamorous Wetkiss Crystal Embellished Lace-Up Heels',desc:'Glamorous Crystal Embellished Lace-Up Heels by Wetkiss. Stunning heels with sparkling crystal embellishments and lace-up design. Pre-loved. Size EU 38.5.',price:'1100',brand:'Wetkiss',cat:"Women's Shoes > Heels",size:'EU 38.5',color:'Silver',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/445b7ac896b157597f656d57cfc71fa251161f0c-896x1195.jpg'},
  {id:'ea7e59d0-0888-4c5f-b1bf-577652115a20',title:'Comfortable Skechers Arch Fit Clogs',desc:'Comfortable Skechers Arch Fit Clogs. Ergonomically designed with Arch Fit technology for all-day support. Slip-on clog style. Pre-loved. Size EU 37.5.',price:'2500',brand:'Skechers',cat:"Women's Shoes > Clogs and Slides",size:'EU 37.5',color:'Black',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/8448d97528bfabf8cefacb473a9b9d171ce0de03-896x1195.jpg'},
  {id:'f929da42-d247-44bb-9eb0-423ce4887aeb',title:'Vibrant Pink H&M Pointed-Toe Flats',desc:'Vibrant Pink Pointed-Toe Flats by H&M. Chic feminine pointed-toe flats in bold vibrant pink. A stylish everyday staple. Pre-loved. Size EU 40.',price:'1000',brand:'H&M',cat:"Women's Shoes > Flats",size:'EU 40',color:'Pink',cond:'used',img:'https://cdn.sanity.io/images/kxnjofhp/production/5c643fd1c32017d1b927cfacaa934ce06b227d17-896x1195.jpg'}
];

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function item(p) {
  const link = `${BASE_URL}/product-detail.html?id=${p.id}&name=${encodeURIComponent(p.title)}&price=${p.price}&image=${encodeURIComponent(p.img)}`;
  return `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.desc}]]></g:description>
      <g:link>${link}</g:link>
      <g:image_link>${p.img}</g:image_link>
      <g:price>${p.price} PKR</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>${p.cond}</g:condition>
      <g:brand>${esc(p.brand)}</g:brand>
      <g:google_product_category>187</g:google_product_category>
      <g:product_type>Shoes &gt; ${esc(p.cat)}</g:product_type>
      <g:size>${p.size}</g:size>
      <g:gender>female</g:gender>
      <g:age_group>adult</g:age_group>${p.color ? '\n      <g:color>' + esc(p.color) + '</g:color>' : ''}
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard</g:service>
        <g:price>200 PKR</g:price>
      </g:shipping>
    </item>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
=======================================================================
  META / FACEBOOK COMMERCE CATALOG FEED
  Store   : Fariha's Collection
  Website : https://farihascollection.com
  Currency: PKR (Pakistani Rupee)
  Products: ${products.length}
  Generated: 2026-08-03
=======================================================================
  HOW TO USE IN META COMMERCE MANAGER:
  1. Upload catalog-feed.xml to your hosting at:
       https://farihascollection.com/catalog-feed.xml
  2. Go to: Meta Commerce Manager > Catalog > Data Sources > Add Data Source
  3. Select "Use a URL" and paste the URL above
  4. Set refresh: Daily (recommended) or Hourly
=======================================================================
-->
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Fariha's Collection</title>
    <link>https://farihascollection.com</link>
    <description>Premium Preloved and New Shoes in Pakistan</description>

${products.map(item).join('\n\n')}

  </channel>
</rss>
`;

fs.writeFileSync('catalog-feed.xml', xml, 'utf8');
console.log('SUCCESS: catalog-feed.xml written with ' + products.length + ' products.');
console.log('File size: ' + (xml.length / 1024).toFixed(1) + ' KB');
