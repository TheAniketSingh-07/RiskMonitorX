function pagePath(fileName) {
    return window.location.pathname.includes('/pages/') ? fileName : `pages/${fileName}`;
}

function hasToken() {
    if (typeof getAuthToken === 'function') {
        return !!getAuthToken();
    }
    return !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
}

function requireAuth() {
    if (!hasToken()) {
        window.location.href = pagePath('login.html');
    }
}

function requireGuest() {
    if (hasToken()) {
        window.location.href = pagePath('dashboard.html');
    }
}

function logout() {
    if (typeof clearAuthToken === 'function') {
        clearAuthToken();
    } else {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
    }
    window.location.href = pagePath('login.html');
}

async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Determine current active page
    const currentPath = window.location.pathname;
    const isPageActive = (path) => currentPath.endsWith(path) ? 'style="color: var(--primary-color); background: rgba(74, 144, 226, 0.14);"' : '';

    // Fetch user profile to determine role
    let userRole = 'user';
    try {
        const token = getAuthToken();
        if (token) {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                userRole = data?.data?.role || 'user';
            }
        }
    } catch {}

    sidebarContainer.innerHTML = `
        <div class="sidebar">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:2rem;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; background: var(--primary-glow); color: var(--white); border-radius: 8px; font-size:1.1rem;">🛡️</span>
                <div>
                    <h2 style="margin:0; font-size:1.15rem; display:block;">RiskMonitorX</h2>
                    <span style="font-size:0.75rem; font-weight:normal; color:var(--text-soft); display:block; margin-top:2px;">Risk Management Platform</span>
                </div>
            </div>
            
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px; padding-left: 12px;">MAIN MENU</div>
            <ul style="flex: none;">
                <li><a href="dashboard.html" ${isPageActive('dashboard.html')}>Dashboard</a></li>
                <li><a href="projects.html" ${isPageActive('projects.html')}>Projects</a></li>
                <li><a href="risks.html" ${isPageActive('risks.html')}>Risk Register</a></li>
            </ul>

            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em; margin-top: 24px; margin-bottom: 10px; padding-left: 12px;">SYSTEM</div>
            <ul>
                <li><a href="profile.html" ${isPageActive('profile.html')}>Profile</a></li>
                <li><a href="settings.html" ${isPageActive('settings.html')}>Settings</a></li>
            </ul>

            <div style="margin-top:auto; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <button type="button" id="themeToggleBtn" class="logout-link" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 12px; display:flex; align-items:center; gap:10px; margin-bottom: 16px;">
                    <span id="themeIcon">☀️</span> <span id="themeText">Light Mode</span>
                </button>
                <div style="font-size: 0.8rem; color: var(--text-soft); padding-left: 12px; margin-bottom: 16px;">
                    Signed in as <strong style="color: var(--text-color);">${userRole === 'admin' ? 'Admin' : 'User'}</strong>
                </div>
                <button class="logout-link" id="logoutBtn" type="button" style="display:flex; align-items:center; gap:10px; padding: 10px 12px; color: var(--text-muted);">
                    <span>🚪</span> Log Out
                </button>
            </div>
        </div>
    `;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}
