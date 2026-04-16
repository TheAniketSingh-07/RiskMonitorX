document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const appearanceToggle = document.getElementById('appearanceToggle');

    function setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            if (themeIcon) themeIcon.textContent = '🌙'; // Dark mode icon for setting back to dark
            if (themeText) themeText.textContent = 'Dark Mode';
            if (appearanceToggle) appearanceToggle.checked = false;
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) themeIcon.textContent = '☀️'; // Light mode icon for setting to light
            if (themeText) themeText.textContent = 'Light Mode';
            if (appearanceToggle) appearanceToggle.checked = true;
        }
    }

    // Initialize Theme
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);

    // Sidebar Toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            setTheme(currentTheme === 'light' ? 'dark' : 'light');
        });
    }

    // Settings Page Toggle
    if (appearanceToggle) {
        appearanceToggle.addEventListener('change', (e) => {
            setTheme(e.target.checked ? 'dark' : 'light');
        });
    }

    // Global Notification Dropdown
    initGlobalNotifications();
});

function initGlobalNotifications() {
    // Find the notification bell icon container (the second cursor: pointer div without an id in the header)
    const headerDivs = document.querySelectorAll('.header > div:last-child > div[style*="cursor: pointer"]');
    if (headerDivs.length < 2) return;
    
    const notifContainer = headerDivs[1]; // The second one is the bell
    notifContainer.style.position = 'relative';
    notifContainer.id = "globalNotifBell";
    
    const dropdown = document.createElement('div');
    dropdown.id = "globalNotifDropdown";
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: 35px;
        right: -10px;
        width: 320px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        padding: 0;
        overflow: hidden;
    `;
    
    dropdown.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.1);">
            <strong style="color: var(--text-color);">Notifications</strong>
            <span style="font-size: 0.75rem; color: var(--primary-color); cursor: pointer;" onclick="document.getElementById('globalNotifDropdown').style.display='none'">Mark all as read</span>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--danger); margin-top: 6px; flex-shrink: 0;"></div>
                <div>
                    <div style="font-size: 0.9rem; color: var(--text-color); margin-bottom: 4px;"><strong>High Risk Alert</strong>: Database connection latency threshold exceeded on Production project.</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">10 minutes ago</div>
                </div>
            </div>
            <div style="padding: 12px 16px; display: flex; gap: 12px; opacity: 0.7;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: transparent; margin-top: 6px; flex-shrink: 0;"></div>
                <div>
// ...existing code...
                    <div style="font-size: 0.75rem; color: var(--text-muted);">2 hours ago</div>
                </div>
            </div>
        </div>
        <div style="padding: 10px; text-align: center; border-top: 1px solid var(--border-color); font-size: 0.8rem;">
            <a href="settings.html" style="color: var(--text-muted); text-decoration: none;">View Notification Settings</a>
        </div>
    `;
    
    notifContainer.appendChild(dropdown);
    
    notifContainer.addEventListener('click', (e) => {
        // Toggle dropdown
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        // Hide red dot
        const redDot = notifContainer.querySelector('span[style*="background: var(--danger)"]');
        if (redDot && !isVisible) {
            redDot.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!notifContainer.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

