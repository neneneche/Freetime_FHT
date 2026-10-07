// === Dashboard + Liked Events (M3, XSS-safe) ===

let dashboardEvents = [];
let dashboardIndex = 0;

router.register('dashboard', async () => {
    const app = document.getElementById('app');
    try {
        dashboardEvents = await api('/dashboard?radius=50');
        dashboardIndex = 0;

        if (dashboardEvents.length === 0) {
            app.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded">celebration</span>
                <h5 class="headline-small">Keine Vorschläge</h5>
                <p class="body-medium text-muted">Erkunde die Karte oder erstelle ein eigenes Event!</p>
                <div style="display:flex;gap:12px;margin-top:16px">
                    <button class="btn-filled tonal" onclick="router.navigate('map')">
                        <span class="material-symbols-rounded" style="font-size:18px">map</span> Karte
                    </button>
                    <button class="btn-filled" onclick="router.navigate('events')">
                        <span class="material-symbols-rounded" style="font-size:18px">add</span> Event erstellen
                    </button>
                </div>
            </div>`;
            return;
        }
        renderDashboardCard();
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

function renderDashboardCard() {
    const app = document.getElementById('app');

    if (dashboardIndex >= dashboardEvents.length) {
        app.innerHTML = `
        <div class="empty-state">
            <span class="material-symbols-rounded filled" style="color:var(--md-success)">check_circle</span>
            <h5 class="headline-small">Alle durchgesehen!</h5>
            <p class="body-medium text-muted">Du hast alle verfügbaren Events bewertet.</p>
            <div style="display:flex;gap:12px;margin-top:12px">
                <button class="btn-filled tonal" onclick="router.navigate('map')">
                    <span class="material-symbols-rounded" style="font-size:18px">map</span> Karte
                </button>
                <button class="btn-outlined" onclick="router.navigate('liked')">
                    <span class="material-symbols-rounded" style="font-size:18px">favorite</span> Gemerkte Events
                </button>
            </div>
        </div>`;
        return;
    }

    const ev = dashboardEvents[dashboardIndex];
    const scorePercent = Math.round((ev.score || 0) * 100);

    app.innerHTML = `
    <div class="dash-container">
        <div class="dash-counter">
            <span class="body-medium text-muted">${dashboardIndex + 1} / ${dashboardEvents.length}</span>
            <span class="score-badge"><span class="material-symbols-rounded" style="font-size:14px">auto_awesome</span> ${scorePercent}% Match</span>
        </div>

        <div class="dash-card">
            <div class="dash-card-body">
                <h4 class="headline-small" style="margin-bottom:8px"></h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px" id="dashChips"></div>
                <p class="body-medium text-muted" style="margin-bottom:12px" id="dashDesc"></p>
                <div class="detail-row"><span class="material-symbols-rounded">location_on</span><span class="body-medium" id="dashAddr"></span></div>
                <div class="detail-row"><span class="material-symbols-rounded">schedule</span><span class="body-medium" id="dashTime"></span></div>
            </div>
            ${ev.latitude && ev.longitude ? `<div class="dash-card-map"><div id="dashMap" style="height:100%"></div></div>` : ''}
        </div>

        <div class="dash-actions">
            <button class="dash-btn dash-btn-dislike" onclick="dashDislike(${ev.id})" title="Dislike">
                <span class="material-symbols-rounded" style="font-size:28px">close</span>
            </button>
            <button class="dash-btn dash-btn-skip" onclick="dashSkip()" title="Überspringen">
                <span class="material-symbols-rounded" style="font-size:22px">skip_next</span>
            </button>
            <button class="dash-btn dash-btn-like" onclick="dashLike(${ev.id})" title="Like">
                <span class="material-symbols-rounded filled" style="font-size:28px">favorite</span>
            </button>
        </div>
    </div>`;

    // XSS-safe text injection
    app.querySelector('h4').textContent = ev.title;
    const chips = document.getElementById('dashChips');
    chips.innerHTML = categoryChip(ev.category) +
        `<span class="chip ${ev.source === 'STADTWIEN' ? 'chip-tonal' : 'chip-outlined'}">
            <span class="material-symbols-rounded" style="font-size:16px">${ev.source === 'STADTWIEN' ? 'account_balance' : 'person'}</span>
            ${ev.source === 'STADTWIEN' ? 'Stadt Wien' : 'Nutzer'}</span>`;
    document.getElementById('dashDesc').textContent = ev.description || '';
    document.getElementById('dashAddr').textContent = ev.address;
    document.getElementById('dashTime').textContent = formatDate(ev.startTime) + ' – ' + formatDateShort(ev.endTime);

    if (ev.latitude && ev.longitude) {
        setTimeout(() => {
            const miniMap = L.map('dashMap', { zoomControl: false, attributionControl: false })
                .setView([ev.latitude, ev.longitude], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
            L.marker([ev.latitude, ev.longitude]).addTo(miniMap);
        }, 100);
    }
}

async function dashLike(eventId) {
    try {
        await api(`/ratings/${eventId}`, { method: 'POST', body: JSON.stringify({ value: 'LIKE' }) });
        showToast('Gemocht!');
        dashboardIndex++;
        renderDashboardCard();
    } catch (err) { showToast(err.message); }
}

async function dashDislike(eventId) {
    try {
        await api(`/ratings/${eventId}`, { method: 'POST', body: JSON.stringify({ value: 'DISLIKE' }) });
        showToast('Nicht gemocht.');
        dashboardIndex++;
        renderDashboardCard();
    } catch (err) { showToast(err.message); }
}

function dashSkip() { dashboardIndex++; renderDashboardCard(); }

// === Liked Events View ===
router.register('liked', async () => {
    const app = document.getElementById('app');
    try {
        const events = await api('/events?radius=50');
        const ratings = await api('/dashboard?radius=50').catch(() => []);

        // Get liked events by fetching user ratings for each event is expensive;
        // instead use the chat conversations which include liked events
        const convs = await api('/chat/conversations');
        const likedEventIds = new Set();
        const likedEvents = [];

        // Get all visible events, then check which ones the user liked
        // We'll use a simpler approach: the event detail endpoint works, but we need all ratings
        // Use the conversations endpoint which already has liked events
        for (const c of convs) {
            if (c.type === 'EVENT' && c.eventId) {
                try {
                    const ev = await api(`/events/${c.eventId}`);
                    likedEvents.push(ev);
                } catch (e) {}
            }
        }

        if (likedEvents.length === 0) {
            app.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded">favorite</span>
                <h5 class="headline-small">Noch keine gemerkten Events</h5>
                <p class="body-medium text-muted">Like Events auf dem Dashboard, um sie hier zu sehen!</p>
                <button class="btn-filled" style="margin-top:12px" onclick="router.navigate('dashboard')">
                    <span class="material-symbols-rounded" style="font-size:18px">home</span> Zum Dashboard
                </button>
            </div>`;
            return;
        }

        app.innerHTML = `
        <div class="liked-header">
            <div>
                <h4 class="headline-small" style="display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-rounded filled" style="color:var(--md-error)">favorite</span>
                    Gemerkte Events
                </h4>
                <p class="body-medium text-muted">${likedEvents.length} Events, die du geliked hast</p>
            </div>
            <button class="btn-filled tonal" onclick="router.navigate('dashboard')">
                <span class="material-symbols-rounded" style="font-size:18px">explore</span> Mehr entdecken
            </button>
        </div>
        <div class="events-grid" id="likedGrid"></div>`;

        const grid = document.getElementById('likedGrid');
        likedEvents.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.onclick = () => router.navigate('events', { detail: ev.id });
            card.innerHTML = `
                <div class="cat-bar" style="background:${categoryColors[ev.category] || '#6750A4'}"></div>
                <h6 class="title-medium"></h6>
                <div style="display:flex;gap:6px;flex-wrap:wrap"></div>
                <div class="body-small text-muted" style="display:flex;align-items:center;gap:4px">
                    <span class="material-symbols-rounded" style="font-size:14px">location_on</span>
                    <span class="addr"></span>
                </div>
                <div class="body-small text-muted" style="display:flex;align-items:center;gap:4px">
                    <span class="material-symbols-rounded" style="font-size:14px">schedule</span>
                    <span class="time"></span>
                </div>
                <div class="body-small" style="display:flex;align-items:center;gap:4px;color:var(--md-error)">
                    <span class="material-symbols-rounded filled" style="font-size:14px">favorite</span> Gemerkt
                </div>`;
            card.querySelector('h6').textContent = ev.title; // Safe
            const chipContainer = card.querySelector('div[style*="flex-wrap"]');
            chipContainer.innerHTML = categoryChip(ev.category) +
                `<span class="chip chip-outlined" style="font-size:11px;height:24px;padding:0 8px">${ev.source === 'STADTWIEN' ? 'Stadt Wien' : 'Nutzer'}</span>`;
            card.querySelector('.addr').textContent = ev.address;
            card.querySelector('.time').textContent = formatDateShort(ev.startTime);
            grid.appendChild(card);
        });
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});