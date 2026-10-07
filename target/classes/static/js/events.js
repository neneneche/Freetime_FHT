// === Events View (Filters + XSS-safe) ===

const CATEGORIES = ['Musik', 'Sport', 'Kunst', 'Kultur', 'Food', 'Technologie', 'Natur', 'Party'];
const SOURCES = ['STADTWIEN', 'NUTZER'];
let activeFilters = { category: '', source: '', search: '' };

router.register('events', async (params) => {
    const app = document.getElementById('app');
    if (params && params.detail) { showEventDetail(params.detail); return; }

    try {
        const [myEvents, visibleEvents] = await Promise.all([
            api('/events/mine'),
            api(`/events?radius=50${activeFilters.category ? '&category=' + activeFilters.category : ''}${activeFilters.source ? '&source=' + activeFilters.source : ''}${activeFilters.search ? '&q=' + encodeURIComponent(activeFilters.search) : ''}`)
        ]);

        const catOpts = CATEGORIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');

        app.innerHTML = `
        <div class="events-layout">
            <div class="events-sidebar">
                <div class="card-elevated" style="padding:20px">
                    <h5 class="title-medium" style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
                        <span class="material-symbols-rounded">add_circle</span> Neues Event
                    </h5>
                    <form id="createEventForm" style="display:flex;flex-direction:column;gap:8px">
                        <div class="field-simple"><label>Titel</label><input type="text" id="evTitle" required maxlength="200"></div>
                        <div class="field-simple"><label>Kategorie</label><select id="evCategory" required><option value="">Wählen...</option>${catOpts}</select></div>
                        <div class="field-simple"><label>Beschreibung</label><textarea id="evDesc" rows="2" maxlength="2000"></textarea></div>
                        <div class="field-simple"><label>Adresse</label><input type="text" id="evAddress" required maxlength="500"></div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                            <div class="field-simple"><label>Start</label><input type="datetime-local" id="evStart" required></div>
                            <div class="field-simple"><label>Ende</label><input type="datetime-local" id="evEnd" required></div>
                        </div>
                        <div id="createEventError" class="error-banner" style="display:none"></div>
                        <button type="submit" class="btn-filled full" style="margin-top:8px">
                            <span class="material-symbols-rounded" style="font-size:18px">send</span> Einreichen
                        </button>
                    </form>
                </div>

                ${myEvents.length > 0 ? `
                <div class="card-outlined" style="padding:16px">
                    <h5 class="title-medium" style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                        <span class="material-symbols-rounded">inventory_2</span> Meine Events (${myEvents.length})
                    </h5>
                    <div id="myEventsList"></div>
                </div>` : ''}
            </div>

            <div>
                <h5 class="title-large" style="margin-bottom:12px">Veranstaltungen in der Nähe</h5>

                <!-- Filter Bar -->
                <div class="filter-bar">
                    <div class="search-box" style="flex:1;min-width:200px">
                        <span class="material-symbols-rounded" style="color:var(--md-on-surface-variant)">search</span>
                        <input type="text" id="eventSearch" placeholder="Events suchen..."
                            value="${escapeAttr(activeFilters.search)}"
                            oninput="debounceEventSearch(this.value)">
                    </div>
                    <button class="filter-chip${activeFilters.category === '' ? ' active' : ''}" onclick="setEventFilter('category','')">Alle</button>
                    ${CATEGORIES.map(c => `
                        <button class="filter-chip${activeFilters.category === c ? ' active' : ''}"
                            onclick="setEventFilter('category','${escapeAttr(c)}')">${escapeHtml(c)}</button>
                    `).join('')}
                    <div style="width:1px;background:var(--md-outline-variant);margin:0 4px"></div>
                    <button class="filter-chip${activeFilters.source === '' ? ' active' : ''}" onclick="setEventFilter('source','')">Alle Quellen</button>
                    <button class="filter-chip${activeFilters.source === 'STADTWIEN' ? ' active' : ''}" onclick="setEventFilter('source','STADTWIEN')">Stadt Wien</button>
                    <button class="filter-chip${activeFilters.source === 'NUTZER' ? ' active' : ''}" onclick="setEventFilter('source','NUTZER')">Nutzer</button>
                </div>

                <div class="events-grid" id="eventsGrid"></div>
            </div>
        </div>`;

        // Render my events
        const myList = document.getElementById('myEventsList');
        if (myList) {
            myEvents.forEach(ev => {
                const item = document.createElement('div');
                item.className = 'friend-item';
                item.innerHTML = `
                    <div class="friend-info"><div class="title-small"></div>${stateChip(ev.state)}</div>
                    <div class="friend-actions">
                        ${ev.state === 'EINGEREICHT' || ev.state === 'FREIGEGEBEN' ? `
                            <button class="btn-icon" onclick="editMyEvent(${ev.id})"><span class="material-symbols-rounded">edit</span></button>
                            <button class="btn-icon" onclick="cancelMyEvent(${ev.id})"><span class="material-symbols-rounded" style="color:var(--md-error)">cancel</span></button>` : ''}
                    </div>`;
                item.querySelector('.title-small').textContent = ev.title;
                myList.appendChild(item);
            });
        }

        // Render grid
        const grid = document.getElementById('eventsGrid');
        if (visibleEvents.length === 0) {
            grid.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">search_off</span>
                <p>Keine Events gefunden.</p>
                <button class="btn-text" onclick="clearEventFilters()">Filter zurücksetzen</button></div>`;
        } else {
            visibleEvents.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.onclick = () => router.navigate('events', { detail: ev.id });
                card.innerHTML = `
                    <div class="cat-bar" style="background:${categoryColors[ev.category] || '#0078D4'}"></div>
                    <h6 class="title-medium"></h6>
                    <div style="display:flex;gap:6px;flex-wrap:wrap"></div>
                    <div class="body-small text-muted" style="display:flex;align-items:center;gap:4px">
                        <span class="material-symbols-rounded" style="font-size:14px">location_on</span><span class="addr"></span></div>
                    <div class="body-small text-muted" style="display:flex;align-items:center;gap:4px">
                        <span class="material-symbols-rounded" style="font-size:14px">schedule</span><span class="time"></span></div>`;
                card.querySelector('h6').textContent = ev.title;
                card.querySelector('div[style*="flex-wrap"]').innerHTML =
                    categoryChip(ev.category) + `<span class="chip chip-outlined" style="font-size:10px;height:22px;padding:0 8px">${ev.source === 'STADTWIEN' ? 'Stadt Wien' : 'Nutzer'}</span>`;
                card.querySelector('.addr').textContent = ev.address;
                card.querySelector('.time').textContent = formatDateShort(ev.startTime);
                grid.appendChild(card);
            });
        }

        document.getElementById('createEventForm').onsubmit = async (e) => {
            e.preventDefault();
            const errDiv = document.getElementById('createEventError');
            errDiv.style.display = 'none';
            try {
                await api('/events', { method: 'POST', body: JSON.stringify({
                    title: evTitle.value, category: evCategory.value, description: evDesc.value,
                    address: evAddress.value, startTime: evStart.value, endTime: evEnd.value
                })});
                showToast('Event eingereicht!');
                router.navigate('events');
            } catch (err) {
                errDiv.innerHTML = '<span class="material-symbols-rounded" style="font-size:18px">error</span> ';
                errDiv.appendChild(document.createTextNode(err.message));
                errDiv.style.display = 'flex';
            }
        };
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

let searchTimeout;
function debounceEventSearch(value) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        activeFilters.search = value;
        router.navigate('events');
    }, 400);
}

function setEventFilter(type, value) {
    activeFilters[type] = value;
    router.navigate('events');
}

function clearEventFilters() {
    activeFilters = { category: '', source: '', search: '' };
    router.navigate('events');
}

async function showEventDetail(eventId) {
    const app = document.getElementById('app');
    try {
        const ev = await api(`/events/${eventId}`);
        app.innerHTML = `
        <div style="max-width:1000px">
            <button class="btn-text" onclick="router.navigate('events')" style="margin-bottom:16px">
                <span class="material-symbols-rounded">arrow_back</span> Zurück</button>
            <div class="detail-layout">
                <div class="detail-info">
                    <h3 class="headline-small" id="detailTitle"></h3>
                    <div style="display:flex;gap:8px;flex-wrap:wrap" id="detailChips"></div>
                    <p class="body-large text-muted" id="detailDesc"></p>
                    <div class="card-filled" style="display:flex;flex-direction:column;gap:12px">
                        <div class="detail-row"><span class="material-symbols-rounded">location_on</span><span class="body-medium" id="detailAddr"></span></div>
                        <div class="detail-row"><span class="material-symbols-rounded">schedule</span><span class="body-medium" id="detailTime"></span></div>
                        ${ev.creatorUsername ? `<div class="detail-row"><span class="material-symbols-rounded">person</span><span class="body-medium" id="detailCreator"></span></div>` : ''}
                        ${ev.rejectionReason ? `<div class="detail-row"><span class="material-symbols-rounded" style="color:var(--md-error)">warning</span><span class="body-medium" id="detailReject" style="color:var(--md-error)"></span></div>` : ''}
                    </div>
                    <div class="detail-actions">
                        <button class="btn-filled" onclick="rateFromDetail(${ev.id},'LIKE')">
                            <span class="material-symbols-rounded filled" style="font-size:18px">favorite</span> Like</button>
                        <button class="btn-outlined" onclick="rateFromDetail(${ev.id},'DISLIKE')">
                            <span class="material-symbols-rounded" style="font-size:18px">close</span> Dislike</button>
                        <button class="btn-outlined danger" onclick="showReportModal(${ev.id})">
                            <span class="material-symbols-rounded" style="font-size:18px">flag</span> Melden</button>
                    </div>
                </div>
                <div class="detail-map-container"><div id="detailMap" style="height:100%;min-height:300px"></div></div>
            </div>
        </div>`;

        document.getElementById('detailTitle').textContent = ev.title;
        document.getElementById('detailDesc').textContent = ev.description || '';
        document.getElementById('detailAddr').textContent = ev.address;
        document.getElementById('detailTime').textContent = formatDate(ev.startTime) + ' – ' + formatDate(ev.endTime);
        if (ev.creatorUsername) document.getElementById('detailCreator').textContent = ev.creatorUsername;
        if (ev.rejectionReason) document.getElementById('detailReject').textContent = ev.rejectionReason;
        document.getElementById('detailChips').innerHTML = categoryChip(ev.category) +
            `<span class="chip ${ev.source === 'STADTWIEN' ? 'chip-tonal' : 'chip-outlined'}">${ev.source === 'STADTWIEN' ? 'Stadt Wien' : 'Nutzer'}</span>` +
            stateChip(ev.state);

        if (ev.latitude && ev.longitude) {
            setTimeout(() => {
                const detailMap = L.map('detailMap', { zoomControl: false }).setView([ev.latitude, ev.longitude], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap);
                L.marker([ev.latitude, ev.longitude]).addTo(detailMap);
                setTimeout(() => detailMap.invalidateSize(), 100);
            }, 100);
        }
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
}

function showReportModal(eventId) {
    const reasons = ['Spam', 'Beleidigung', 'Fake Event', 'Gewalt/Anstiftung', 'Sonstiges'];
    showModal('Event melden', `
        <p class="body-medium text-muted" style="margin-bottom:12px">Grund:</p>
        ${reasons.map((r, i) => `<label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer">
            <input type="radio" name="reportReason" value="${escapeAttr(r)}" ${i === 0 ? 'checked' : ''} style="accent-color:var(--md-primary)">
            <span class="body-medium">${escapeHtml(r)}</span></label>`).join('')}
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled danger" onclick="submitReport(${eventId})">Melden</button>`);
}

async function submitReport(eventId) {
    const selected = document.querySelector('input[name="reportReason"]:checked');
    closeModal();
    try {
        await api('/reports', { method: 'POST', body: JSON.stringify({ targetType: 'EVENT', targetId: eventId, reason: selected?.value || 'Sonstiges' }) });
        showToast('Meldung gesendet.');
    } catch (err) { showToast(err.message); }
}

async function rateFromDetail(eventId, value) {
    try {
        await api(`/ratings/${eventId}`, { method: 'POST', body: JSON.stringify({ value }) });
        showToast(value === 'LIKE' ? 'Gemocht!' : 'Nicht gemocht.');
    } catch (err) {
        if (err.message.includes('existiert')) {
            try { await api(`/ratings/${eventId}`, { method: 'PUT', body: JSON.stringify({ value }) }); showToast('Bewertung geändert!'); }
            catch (e2) { showToast(e2.message); }
        } else { showToast(err.message); }
    }
}

async function cancelMyEvent(eventId) {
    showModal('Event absagen', '<p class="body-medium text-muted">Wirklich absagen?</p>',
        `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
         <button class="btn-filled danger" onclick="confirmCancelEvent(${eventId})">Absagen</button>`);
}
async function confirmCancelEvent(eventId) {
    closeModal();
    try { await api(`/events/${eventId}`, { method: 'DELETE' }); showToast('Abgesagt.'); router.navigate('events'); }
    catch (err) { showToast(err.message); }
}

async function editMyEvent(eventId) {
    try {
        const ev = await api(`/events/${eventId}`);
        const catOpts = CATEGORIES.map(c => `<option value="${escapeAttr(c)}" ${ev.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
        const overlay = showModal('Event bearbeiten', `
            <div class="field-simple"><label>Titel</label><input type="text" id="editTitle" maxlength="200"></div>
            <div class="field-simple"><label>Kategorie</label><select id="editCategory">${catOpts}</select></div>
            <div class="field-simple"><label>Beschreibung</label><textarea id="editDesc" rows="2" maxlength="2000"></textarea></div>
            <div class="field-simple"><label>Adresse</label><input type="text" id="editAddress" maxlength="500"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div class="field-simple"><label>Start</label><input type="datetime-local" id="editStart"></div>
                <div class="field-simple"><label>Ende</label><input type="datetime-local" id="editEnd"></div>
            </div>`,
            `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
             <button class="btn-filled" onclick="saveEventEdit(${eventId})">Speichern</button>`);
        overlay.querySelector('#editTitle').value = ev.title || '';
        overlay.querySelector('#editDesc').value = ev.description || '';
        overlay.querySelector('#editAddress').value = ev.address || '';
        overlay.querySelector('#editStart').value = ev.startTime?.slice(0, 16) || '';
        overlay.querySelector('#editEnd').value = ev.endTime?.slice(0, 16) || '';
    } catch (err) { showToast(err.message); }
}

async function saveEventEdit(eventId) {
    const data = {
        title: editTitle?.value, category: editCategory?.value,
        description: editDesc?.value, address: editAddress?.value,
        startTime: editStart?.value, endTime: editEnd?.value
    };
    closeModal();
    try { await api(`/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }); showToast('Gespeichert.'); router.navigate('events'); }
    catch (err) { showToast(err.message); }
}