const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const headerHtml = `
            <div class="header">
                <div>
                    <h1>__TITLE__</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="position: relative; color: var(--text-muted); cursor: pointer;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div style="position: relative; color: var(--text-muted); cursor: pointer;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span style="position: absolute; top: 0px; right: 0px; background: var(--danger); width: 8px; height: 8px; border-radius: 50%;"></span>
                    </div>
                    <div style="background: var(--primary-color); color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                        AS
                    </div>
__EXTRA_BUTTON__
                </div>
            </div>
`;

files.forEach(file => {
    // Skip ones already perfectly customized
    if (file === 'dashboard.html' || file === 'settings.html' || file === 'projects.html') return;
    if (file === 'login.html' || file === 'register.html' || file === '404.html') return;

    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Inject theme.js
    if (!content.includes('theme.js')) {
        content = content.replace('<script src="../js/auth.js"></script>', '<script src="../js/auth.js"></script>\n    <script src="../js/theme.js"></script>');
    }

    // 2. Extract Title and Button specifically for other pages
    const headerMatch = content.match(/<div class="header">([\s\S]*?)<\/div>(?=\s*<(?:div id="loader"|div class="container"|div class="grid"))/);
    if (headerMatch) {
        const titleMatch = headerMatch[1].match(/<h1>(.*?)<\/h1>/);
        const title = titleMatch ? titleMatch[1] : 'RiskGuard';

        // find buttons, some pages have them inside header 
        const buttonMatch = headerMatch[1].match(/<button[\s\S]*?>[\s\S]*?<\/button>|<a[\s\S*]*?class="btn[\s\S]*?>[\s\S]*?<\/a>/g);
        let extraBtn = '';
        if (buttonMatch) {
            extraBtn = '\n                    <div style="margin-left:10px;">' + buttonMatch.join('\n                    ') + '</div>';
        }

        let newHeader = headerHtml.replace('__TITLE__', title).replace('__EXTRA_BUTTON__', extraBtn);
        // Replace inner structure
        content = content.replace(headerMatch[0], newHeader);
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    }
});
