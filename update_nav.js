const fs = require('fs');
const path = require('path');

const replacement = `<div class="nav-shop-menu">
                    <a href="shoes (1).html">Shop</a>
                    <a href="shoes (1).html?filter=women">Women</a>
                    <a href="shoes (1).html?filter=heels">Heels</a>
                    <a href="shoes (1).html?filter=slides">Slides</a>
                    <a href="shoes (1).html?filter=men">Men</a>
                    <a href="shoes (1).html?filter=unisex">Unisex</a>
                    <a href="shoes (1).html?filter=loafers">Loafers</a>
                    <a href="shoes (1).html?filter=sandals">Sandals</a>
                </div>`;

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /<div class="nav-shop-menu">[\s\S]*?<\/div>/;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(f, content);
        console.log('Updated ' + f);
    }
});
