// Replace BASE_URL with your backend host if needed (keep trailing /api).
const API_BASE = 'https://riskmonitorx-1.onrender.com/api/v1';
const API_TIMEOUT_MS = 15000;
const TOKEN_KEY = 'token';

function getAuthToken() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token, persistent = false) {
    if (persistent) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
        return;
    }

    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
}

function clearAuthToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

async function fetchAPI(endpoint, options = {}) {
    const token = getAuthToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        const raw = await response.text();
        let data = null;
        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch (parseError) {
                data = { message: raw };
            }
        }

        if (response.status === 401 || response.status === 403) {
            clearAuthToken();
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
                window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
            }
        }

        if (!response.ok) {
            throw new Error((data && data.message) || 'Something went wrong');
        }

        if (data && Object.prototype.hasOwnProperty.call(data, 'data')) {
            return data.data;
        }

        return data;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
