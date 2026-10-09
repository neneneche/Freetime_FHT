// === Core App: Aero Sidebar, Clickable Notifications, Survey, XSS-safe ===

const API_BASE = '/api';

const state = {
    token: localStorage.getItem('ft_token'),
    userId: parseInt(localStorage.getItem('ft_userId')) || null,
    username: localStorage.getItem('ft_username'),
    role: localStorage.getItem('ft_role'),
    currentView: null,
    theme: localStorage.getItem('ft_theme') || 'light',
    surveyDone: localStorage.getItem('ft_survey_done') === 'true',
};

// === Sidebar ===
function toggleSidebar() {
    document.getElementById('navRail').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
    document.getElementById('navRail').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

// === Theme ===
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ft_theme', theme);
    document.querySelectorAll('.theme-toggle .thumb .material-symbols-rounded').forEach(el => {
        el.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
    });
}
function toggleTheme() { applyTheme(state.theme === 'light' ? 'dark' : 'light'); }
applyTheme(state.theme);

function setAuth(token, userId, username, role) {
    state.token = token; state.userId = userId;
    state.username = username; state.role = role;
    localStorage.setItem('ft_token', token);
    localStorage.setItem('ft_userId', userId);
    localStorage.setItem('ft_username', username);
    localStorage.setItem('ft_role', role);
    // Check if survey is needed
    state.surveyDone = localStorage.getItem('ft_survey_done') === 'true';
    buildNavigation();
}

function logout() {
    state.token = null; state.userId = null;
    state.username = null; state.role = null;
    state.surveyDone = false;
    localStorage.clear();
    localStorage.setItem('ft_theme', state.theme);
    buildNavigation(); closeSidebar();
    router.navigate('login');
}

function isLoggedIn() { return !!state.token; }

async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    const res = await fetch(API_BASE + path, { ...options, headers });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(text || res.statusText || 'API-Fehler');
    }
    if (!res.ok) throw new Error(data.error || 'API-Fehler');
    return data;
}

// === Snackbar ===
function showToast(message) {
    const container = document.getElementById('snackbarContainer');
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    const span = document.createElement('span');
    span.textContent = message;
    snackbar.appendChild(span);
    container.appendChild(snackbar);
    setTimeout(() => { snackbar.classList.add('out'); setTimeout(() => snackbar.remove(), 200); }, 4000);
}

// === Modal ===
function showModal(title, contentHtml, actionsHtml) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-dialog"><h3 class="title-large"></h3>${contentHtml}<div class="modal-actions">${actionsHtml}</div></div>`;
    overlay.querySelector('h3').textContent = title;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
}
function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
}

// === Notifications (CLICKABLE) ===
async function toggleNotifications() {
    const existing = document.querySelector('.notification-panel');
    if (existing) { existing.remove(); return; }

    try {
        const notifications = await api('/notifications');
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <span class="title-medium">Benachrichtigungen</span>
                <button class="btn-text" onclick="markAllNotificationsRead()">Alle gelesen</button>
            </div>
            <div class="notification-list"></div>`;

        const list = panel.querySelector('.notification-list');
        if (notifications.length === 0) {
            list.innerHTML = `<div class="empty-state" style="padding:32px">
                <span class="material-symbols-rounded">notifications_none</span>
                <p>Keine Benachrichtigungen</p></div>`;
        } else {
            notifications.forEach(n => {
                const item = document.createElement('div');
                item.className = 'notification-item' + (n.read ? '' : ' unread');

                // Make clickable based on type
                const navTarget = getNotificationTarget(n);
                item.onclick = () => {
                    markNotificationRead(n.id);
                    if (navTarget) {
                        const panel2 = document.querySelector('.notification-panel');
                        if (panel2) panel2.remove();
                        router.navigate(navTarget.view, navTarget.params);
                    }
                };

                item.innerHTML = `
                    <div class="n-icon"><span class="material-symbols-rounded" style="font-size:18px">${getNotificationIcon(n.type)}</span></div>
                    <div style="flex:1">
                        <div class="body-medium" style="${n.read ? '' : 'font-weight:500'}"></div>
                        <div class="body-small text-muted"></div>
                        ${navTarget ? `<div class="n-action"><span class="material-symbols-rounded" style="font-size:14px">${navTarget.icon}</span> ${navTarget.label}</div>` : ''}
                    </div>`;
                item.querySelectorAll('.body-medium')[0].textContent = n.message;
                item.querySelectorAll('.body-small')[0].textContent = formatDateShort(n.createdAt);
                list.appendChild(item);
            });
        }
        document.body.appendChild(panel);
    } catch (err) {
        showToast('Fehler beim Laden');
    }
}

function getNotificationTarget(n) {
    const targets = {
        'FRIEND_REQUEST': { view: 'friends', params: null, icon: 'group', label: 'Freunde ansehen' },
        'FRIEND_ACCEPTED': { view: 'friends', params: null, icon: 'group', label: 'Freunde ansehen' },
        'EVENT_APPROVED': { view: 'events', params: { detail: n.relatedId }, icon: 'event', label: 'Event ansehen' },
        'EVENT_REJECTED': { view: 'events', params: { detail: n.relatedId }, icon: 'event', label: 'Event ansehen' },
        'EVENT_DELETED': { view: 'events', params: null, icon: 'event', label: 'Events ansehen' },
        'EVENT_CANCELLED': { view: 'events', params: null, icon: 'event', label: 'Events ansehen' },
        'NEW_REPORT': { view: 'moderation', params: null, icon: 'shield', label: 'Moderation öffnen' },
        'REPORT_RESOLVED': { view: 'moderation', params: null, icon: 'shield', label: 'Details ansehen' },
        'REPORT_RESPONSE': { view: 'moderation', params: null, icon: 'shield', label: 'Details ansehen' },
        'PASSWORD_RESET': { view: 'profile', params: null, icon: 'person', label: 'Profil ansehen' },
        'ACCOUNT_BANNED': { view: 'profile', params: null, icon: 'block', label: 'Profil ansehen' },
        'ACCOUNT_UNBANNED': { view: 'profile', params: null, icon: 'check_circle', label: 'Profil ansehen' },
    };
    return targets[n.type] || null;
}

function getNotificationIcon(type) {
    const icons = {
        'FRIEND_REQUEST': 'person_add', 'FRIEND_ACCEPTED': 'group',
        'EVENT_APPROVED': 'check_circle', 'EVENT_REJECTED': 'cancel',
        'EVENT_DELETED': 'delete', 'EVENT_CANCELLED': 'cancel',
        'NEW_REPORT': 'flag', 'REPORT_RESOLVED': 'task_alt',
        'REPORT_RESPONSE': 'reply', 'PASSWORD_RESET': 'key',
        'ACCOUNT_BANNED': 'block', 'ACCOUNT_UNBANNED': 'check_circle',
    };
    return icons[type] || 'notifications';
}

async function markAllNotificationsRead() {
    try {
        await api('/notifications/read-all', { method: 'POST' });
        const panel = document.querySelector('.notification-panel');
        if (panel) panel.remove();
        updateNotificationBadge();
    } catch (e) {}
}

async function markNotificationRead(id) {
    try {
        await api(`/notifications/${id}/read`, { method: 'POST' });
        updateNotificationBadge();
    } catch (e) {}
}

async function updateNotificationBadge() {
    if (!isLoggedIn()) return;
    try {
        const { count } = await api('/notifications/count');
        document.querySelectorAll('.badge-dot').forEach(dot => {
            dot.style.display = count > 0 ? 'block' : 'none';
        });
    } catch (e) {}
}

// === First-Login Survey ===
async function showSurveyIfNeeded() {
    if (state.surveyDone) return;
    try {
        const prefs = await api('/preferences');
        if (prefs.likes.length > 0 || prefs.dislikes.length > 0) {
            state.surveyDone = true;
            localStorage.setItem('ft_survey_done', 'true');
            return;
        }
    } catch (e) {}

    // Show survey modal
    const categories = [
        { id: 'Musik', icon: '🎵' }, { id: 'Sport', icon: '⚽' },
        { id: 'Kunst', icon: '🎨' }, { id: 'Kultur', icon: '🏛' },
        { id: 'Food', icon: '🍔' }, { id: 'Technologie', icon: '💻' },
        { id: 'Natur', icon: '🌿' }, { id: 'Party', icon: '🎉' }
    ];

    const overlay = showModal('Willkommen bei Freetime! 🎉', `
        <p class="body-medium text-muted" style="margin-bottom:16px">
            Erzähl uns, was du magst – damit wir dir die besten Events empfehlen können.
            <br><strong>Klicke:</strong> 👍 = gefällt mir · 👎 = nicht mein Ding · nochmal = neutral
        </p>
        <div class="survey-grid" id="surveyGrid">
            ${categories.map(c => `
                <div class="survey-card" data-cat="${c.id}" onclick="cycleSurveyPref(this)">
                    <div class="icon">${c.icon}</div>
                    <div class="label">${c.id}</div>
                    <div class="body-small" style="margin-top:4px;min-height:16px"></div>
                </div>
            `).join('')}
        </div>
    `, `
        <button class="btn-text" onclick="skipSurvey()">Später</button>
        <button class="btn-filled" onclick="submitSurvey()">Fertig</button>
    `);

    overlay.dataset.survey = 'true';
}

function cycleSurveyPref(card) {
    const current = card.dataset.pref || '';
    const label = card.querySelector('.body-small');
    if (current === '') {
        card.dataset.pref = 'LIKE';
        card.classList.add('liked');
        card.classList.remove('disliked');
        label.textContent = '👍 Gefällt mir';
    } else if (current === 'LIKE') {
        card.dataset.pref = 'DISLIKE';
        card.classList.remove('liked');
        card.classList.add('disliked');
        label.textContent = '👎 Nicht mein Ding';
    } else {
        card.dataset.pref = '';
        card.classList.remove('liked', 'disliked');
        label.textContent = '';
    }
}

function skipSurvey() {
    closeModal();
    state.surveyDone = true;
    localStorage.setItem('ft_survey_done', 'true');
}

async function submitSurvey() {
    const likes = [];
    const dislikes = [];
    document.querySelectorAll('.survey-card').forEach(card => {
        const pref = card.dataset.pref;
        const cat = card.dataset.cat;
        if (pref === 'LIKE') likes.push(cat);
        if (pref === 'DISLIKE') dislikes.push(cat);
    });

    try {
        await api('/preferences/survey', {
            method: 'POST',
            body: JSON.stringify({ likes, dislikes })
        });
        showToast('Danke! Deine Vorlieben wurden gespeichert.');
    } catch (err) {
        showToast('Fehler: ' + err.message);
    }

    closeModal();
    state.surveyDone = true;
    localStorage.setItem('ft_survey_done', 'true');
}

// === Router ===
const router = {
    routes: {},
    register(name, handler) { this.routes[name] = handler; },
    navigate(name, params) {
        if (!isLoggedIn() && name !== 'login' && name !== 'register') name = 'login';
        state.currentView = name;
        closeSidebar();
        const handler = this.routes[name];
        if (handler) {
            document.getElementById('app').innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
            updateNavActive(name);
            handler(params);
            const panel = document.querySelector('.notification-panel');
            if (panel) panel.remove();
            const modal = document.querySelector('.modal-overlay');
            if (modal && !modal.dataset.survey) modal.remove();
        }
    }
};

// === Navigation ===
const NAV_ITEMS = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'map', icon: 'map', label: 'Karte' },
    { id: 'events', icon: 'event', label: 'Events' },
    { id: 'liked', icon: 'favorite', label: 'Gemerkt' },
    { id: 'friends', icon: 'group', label: 'Freunde' },
    { id: 'chat', icon: 'chat', label: 'Chat' },
];

function buildNavigation() {
    const rail = document.getElementById('navRail');
    const bottomNav = document.getElementById('bottomNav');
    const topBar = document.getElementById('topBar');
    const railItems = document.getElementById('navRailItems');
    const railFooter = document.getElementById('navRailFooter');
    const bottomItems = document.getElementById('bottomNavItems');
    const topActions = document.getElementById('topBarActions');
    const menuToggle = document.getElementById('menuToggle');

    if (!isLoggedIn()) {
        rail.style.display = 'none'; bottomNav.style.display = 'none';
        topBar.style.display = 'none'; menuToggle.style.display = 'none';
        return;
    }

    rail.style.display = 'flex'; menuToggle.style.display = 'flex';
    const isTablet = window.innerWidth >= 900;
    bottomNav.style.display = isTablet ? 'none' : 'flex';

    let items = [...NAV_ITEMS];
    if (state.role === 'ADMIN' || state.role === 'MODERATOR') {
        items.push({ id: 'moderation', icon: 'shield', label: 'Moderation' });
    }
    if (state.role === 'ADMIN') {
        items.push({ id: 'admin', icon: 'admin_panel_settings', label: 'Admin' });
    }

    railItems.innerHTML = items.map(item => `
        <a class="nav-rail-item${state.currentView === item.id ? ' active' : ''}" data-view="${item.id}" onclick="router.navigate('${item.id}')">
            <span class="material-symbols-rounded">${item.icon}</span>
            <span>${item.label}</span>
        </a>`).join('');

    railFooter.innerHTML = `
        <a class="nav-rail-item" onclick="toggleNotifications();closeSidebar()">
            <span class="material-symbols-rounded">notifications</span>
            <span>Alerts <span class="badge-dot" style="display:none"></span></span>
        </a>
        <a class="nav-rail-item" onclick="router.navigate('profile')">
            <span class="material-symbols-rounded">person</span>
            <span>Profil</span>
        </a>
        <div class="nav-rail-item" style="cursor:default">
            <button class="theme-toggle" onclick="toggleTheme()">
                <div class="thumb"><span class="material-symbols-rounded">light_mode</span></div>
            </button>
            <span>Theme</span>
        </div>
        <div class="nav-rail-divider"></div>
        <a class="nav-rail-item" onclick="logout()">
            <span class="material-symbols-rounded">logout</span>
            <span>Abmelden</span>
        </a>`;

    bottomItems.innerHTML = items.slice(0, 5).map(item => `
        <a class="bottom-nav-item${state.currentView === item.id ? ' active' : ''}" data-view="${item.id}" onclick="router.navigate('${item.id}')">
            <div class="icon-container"><span class="material-symbols-rounded">${item.icon}</span></div>
            <span>${item.label}</span>
        </a>`).join('');

    topActions.innerHTML = `
        <button class="btn-icon" onclick="toggleNotifications()">
            <span class="material-symbols-rounded">notifications</span>
            <span class="badge-dot" style="display:none"></span>
        </button>
        <button class="theme-toggle" onclick="toggleTheme()" style="width:40px;height:22px">
            <div class="thumb" style="width:18px;height:18px"><span class="material-symbols-rounded" style="font-size:12px">light_mode</span></div>
        </button>
        <button class="btn-icon" onclick="router.navigate('profile')"><span class="material-symbols-rounded">person</span></button>`;

    applyTheme(state.theme);
    updateNotificationBadge();

    // Check survey after navigation is built
    if (isLoggedIn() && !state.surveyDone) {
        setTimeout(showSurveyIfNeeded, 800);
    }
}

function updateNavActive(viewName) {
    document.querySelectorAll('[data-view]').forEach(el => {
        el.classList.toggle('active', el.dataset.view === viewName);
    });
}

// === Helpers ===
const categoryColors = {
    'Musik': '#c33', 'Sport': '#4a8', 'Kunst': '#93c',
    'Kultur': '#1DA0C3', 'Food': '#e80', 'Technologie': '#678',
    'Natur': '#6a5', 'Party': '#d44'
};

function categoryChip(category) {
    return `<span class="chip chip-filled" data-cat="${escapeAttr(category)}">${escapeHtml(category)}</span>`;
}
function stateChip(stateName) {
    return `<span class="chip" data-state="${escapeAttr(stateName)}">${escapeHtml(stateName)}</span>`;
}
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// === Init ===
window.addEventListener('resize', () => { if (isLoggedIn()) buildNavigation(); });
document.addEventListener('DOMContentLoaded', () => {
    buildNavigation();
    if (isLoggedIn()) {
        router.navigate('dashboard');
    } else {
        router.navigate('login');
    }
});