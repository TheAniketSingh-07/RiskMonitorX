document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadSidebar();
    loadProfileAndSettings();
    
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileAndSettings);
});

async function loadProfileAndSettings() {
    try {
        const res = await fetchAPI('/auth/profile');
        if (res && res._id || res.name) {
            const user = res;
            
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileEmail').value = user.email || '';
            
            if (user.settings) {
                document.getElementById('appearanceToggle').checked = user.settings.darkMode !== false;
                document.getElementById('emailNotifToggle').checked = user.settings.emailNotifications !== false;
                document.getElementById('weeklyReportToggle').checked = user.settings.weeklyReports !== false;
                document.getElementById('projectAlertToggle').checked = user.settings.projectAlerts === true;
                
                // Immediately apply appearance toggle if backend says so
                if (user.settings.darkMode) {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.removeItem('theme');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    localStorage.setItem('theme', 'light');
                }
                
                // Refresh sidebar text toggle if needed based on loaded theme
                const themeText = document.getElementById('themeText');
                const themeIcon = document.getElementById('themeIcon');
                if (themeText && themeIcon) {
                    if (user.settings.darkMode) {
                        themeText.textContent = 'Light Mode';
                        themeIcon.textContent = '☀️';
                    } else {
                        themeText.textContent = 'Dark Mode';
                        themeIcon.textContent = '🌙';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading profile settings:', error);
    }
}

async function saveProfileAndSettings(e) {
    e.preventDefault();
    
    const btn = document.getElementById('saveProfileBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        
        const settings = {
            darkMode: document.getElementById('appearanceToggle').checked,
            emailNotifications: document.getElementById('emailNotifToggle').checked,
            weeklyReports: document.getElementById('weeklyReportToggle').checked,
            projectAlerts: document.getElementById('projectAlertToggle').checked
        };
        
        const res = await fetchAPI('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ name, email, settings })
        });
        
        btn.textContent = 'Saved!';
        
        // Also persist theme local settings so we don't flash on reload
        if (settings.darkMode) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Error saving profile:', error);
        btn.textContent = 'Error';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
}
