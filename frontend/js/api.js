/**
 * SMART AGRICULTURE MONITORING SYSTEM (SAMS)
 * Central API Client and Utilities
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? (window.location.port === '8080' ? '/api' : 'http://localhost:8080/api')
    : '/api';

const TOKEN_KEY = 'sams_token';
const USER_KEY = 'sams_user';

const Auth = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    getUser() {
        const u = localStorage.getItem(USER_KEY);
        try {
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    },
    setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        const user = this.getUser();
        if (requiredRole && user && user.role !== requiredRole) {
            if (user.role === 'ADMINISTRATOR') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'farmer-home.html';
            }
            return false;
        }
        return true;
    },
    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    }
};

/**
 * Universal fetch wrapper for SAMS REST APIs
 */
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    const token = Auth.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            Auth.clearSession();
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html') && !window.location.pathname.endsWith('index.html')) {
                showToast('Session expired. Please log in again.', 'error');
                setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            }
            throw new Error('Unauthorized');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = data && data.message ? data.message : `Request failed (${response.status})`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/**
 * Formats ISO date string to human-readable format
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        const lang = (document.documentElement.lang || 'en');
        return d.toLocaleDateString(lang === 'en' ? 'en-IN' : lang + '-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * Update UI Navbar user details
 */
function renderNavUser() {
    const user = Auth.getUser();
    const userContainer = document.getElementById('nav-user-info');
    if (userContainer && user) {
        const hello = typeof t === 'function' ? t('greeting', { name: '' }).replace(/[!！]\s*$/, '').replace(/,\s*$/, '') : 'Welcome';
        const logout = typeof t === 'function' ? t('nav_logout') : 'Logout';
        userContainer.innerHTML = `
            <span>${escapeHtml(hello)}, <strong>${escapeHtml(user.name)}</strong></span>
            <span class="role-badge">${escapeHtml(user.role)}</span>
            <button onclick="Auth.logout()" class="btn btn-sm btn-outline" style="color:#fff; border-color:rgba(255,255,255,0.4);">${escapeHtml(logout)}</button>
        `;
    }
}

/** Escapes text before it is placed into innerHTML. */
function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
