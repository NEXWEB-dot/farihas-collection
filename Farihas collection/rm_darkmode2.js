const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = ['index.html', 'shop.html'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove anti-flash dark mode script block
    content = content.replace(/\n    <script>\n        \/\/ Dark mode: apply before page renders to prevent flash[\s\S]*?\n    <\/script>/g, '');
    
    // Remove dark mode toggle from index.html header if it exists
    if (file === 'index.html') {
        const togglePattern = /<button class="dark-mode-toggle"[\s\S]*?<\/button>\s*/g;
        content = content.replace(togglePattern, '');
        content = content.replace(/align-items:center; gap:12px;"/, 'justify-content:flex-end;"');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Cleaned ${file}`);
});
console.log('Done!');
