// === Moderation View (Report responses + Event management + XSS-safe) ===

router.register('moderation', async () => {
    const app = document.getElementById('app');
    if (state.role !== 'ADMIN' && state.role !== 'MODERATOR') {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">shield</span> Zugriff nur für Moderatoren/Admins.</div>`;
        return;
    }

    try {
        const [pending, reports, allEvents] = await Promise.all([
            api('/events/pending'),
            api(state.role === 'ADMIN' ? '/admin/reports' : '/reports').catch(() => []),
            api('/events?radius=50').catch(() => [])
        ]);

        app.innerHTML = `
        <div class="mod-layout">
            <div>
                <h4 class="headline-small" style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-rounded">pending_actions</span>
                    Ausstehende Events <span class="chip chip-filled">${pending.length}</span></h4>
                <div id="pendingEvents"></div>

                ${state.role === 'ADMIN' ? `
                <h4 class="headline-small" style="margin:24px 0 16px;display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-rounded">settings</span> Event-Verwaltung</h4>
                <div id="allEventsList"></div>` : ''}
            </div>

            <div>
                <h4 class="headline-small" style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-rounded">flag</span>
                    Meldungen <span class="chip chip-filled">${reports.length}</span></h4>
                <div id="reportsList"></div>
            </div>
        </div>`;

        // Pending events
        const pendingDiv = document.getElementById('pendingEvents');
        if (pending.length === 0) {
            pendingDiv.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">check_circle</span><p>Keine ausstehenden Events.</p></div>`;
        } else {
            pending.forEach(ev => {
                const item = document.createElement('div');
                item.className = 'mod-event-item';
                item.innerHTML = `
                    <h5 class="title-medium"></h5>
                    <div style="display:flex;gap:6px;margin:6px 0"></div>
                    <p class="body-medium text-muted" style="margin-bottom:8px"></p>
                    <div class="body-small text-muted" style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
                        <span><span class="material-symbols-rounded" style="font-size:14px">location_on</span> <span class="ev-addr"></span></span>
                        <span><span class="material-symbols-rounded" style="font-size:14px">schedule</span> <span class="ev-time"></span></span>
                        <span><span class="material-symbols-rounded" style="font-size:14px">person</span> <span class="ev-creator"></span></span>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button class="btn-filled success" style="height:36px;padding:0 20px" onclick="approveEvent(${ev.id})">
                            <span class="material-symbols-rounded" style="font-size:16px">check</span> Freigeben</button>
                        <button class="btn-outlined danger" style="height:36px;padding:0 20px" onclick="showRejectModal(${ev.id})">
                            <span class="material-symbols-rounded" style="font-size:16px">close</span> Ablehnen</button>
                    </div>`;
                item.querySelector('.title-medium').textContent = ev.title;
                item.querySelector('p').textContent = ev.description || 'Keine Beschreibung';
                item.querySelector('.ev-addr').textContent = ev.address;
                item.querySelector('.ev-time').textContent = formatDate(ev.startTime) + ' – ' + formatDate(ev.endTime);
                item.querySelector('.ev-creator').textContent = ev.creatorUsername || 'Unbekannt';
                item.querySelector('div[style*="gap:6px"]').innerHTML = categoryChip(ev.category);
                pendingDiv.appendChild(item);
            });
        }

        // All events management (admin only)
        const allDiv = document.getElementById('allEventsList');
        if (allDiv && state.role === 'ADMIN') {
            allEvents.forEach(ev => {
                const item = document.createElement('div');
                item.className = 'mod-event-item';
                item.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="display:flex;align-items:center;gap:8px">
                            <h5 class="title-small"></h5>
                            ${stateChip(ev.state)}
                        </div>
                        <div style="display:flex;gap:6px">
                            <button class="btn-icon" onclick="adminEditEvent(${ev.id})" title="Bearbeiten">
                                <span class="material-symbols-rounded" style="font-size:18px">edit</span></button>
                            <button class="btn-icon" onclick="adminDeleteEvent(${ev.id})" title="Löschen">
                                <span class="material-symbols-rounded" style="font-size:18px;color:var(--md-error)">delete</span></button>
                        </div>
                    </div>`;
                item.querySelector('.title-small').textContent = ev.title;
                allDiv.appendChild(item);
            });
        }

        // Reports
        const reportsDiv = document.getElementById('reportsList');
        if (reports.length === 0) {
            reportsDiv.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">check_circle</span><p>Keine Meldungen.</p></div>`;
        } else {
            reports.forEach(r => {
                const isResolved = r.status !== 'PENDING';
                const item = document.createElement('div');
                item.className = 'report-item';
                item.style.opacity = isResolved ? '0.6' : '1';
                item.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                        <div style="display:flex;gap:4px;align-items:center">
                            <span class="chip chip-outlined" style="height:22px;font-size:10px;padding:0 8px"></span>
                            <span class="chip ${isResolved ? 'chip-tonal' : 'chip-filled'}" style="height:22px;font-size:10px;padding:0 8px">${isResolved ? r.status : 'OFFEN'}</span>
                        </div>
                        <span class="body-small text-muted"></span>
                    </div>
                    <p class="body-medium" style="margin:4px 0"><strong>Grund:</strong> <span class="reason"></span></p>
                    <div class="body-small text-muted" style="margin-bottom:8px"></div>
                    ${!isResolved ? `
                    <div style="display:flex;gap:6px">
                        <button class="btn-filled" style="height:30px;padding:0 12px;font-size:11px" onclick="respondToReport(${r.id})">
                            <span class="material-symbols-rounded" style="font-size:14px">reply</span> Antworten</button>
                        <button class="btn-filled success" style="height:30px;padding:0 12px;font-size:11px" onclick="resolveReport(${r.id},'RESOLVED')">
                            <span class="material-symbols-rounded" style="font-size:14px">check</span> Erledigt</button>
                        <button class="btn-outlined" style="height:30px;padding:0 12px;font-size:11px" onclick="resolveReport(${r.id},'DISMISSED')">
                            <span class="material-symbols-rounded" style="font-size:14px">close</span> Verwerfen</button>
                    </div>` : ''}`;
                item.querySelector('.chip').textContent = r.targetType;
                item.querySelectorAll('.body-small')[0].textContent = formatDate(r.createdAt);
                item.querySelector('.reason').textContent = r.reason;
                item.querySelectorAll('.body-small')[1].textContent = 'Von: ' + r.reporterUsername + ' · Status: ' + r.status;
                reportsDiv.appendChild(item);
            });
        }
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

function respondToReport(reportId) {
    showModal('Auf Meldung antworten', `
        <div class="field-simple"><label>Antwort an den Melder</label>
            <textarea id="reportResponse" rows="3" placeholder="Deine Antwort..." maxlength="500"></textarea></div>
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled" onclick="submitReportResponse(${reportId})">Senden</button>`);
}

async function submitReportResponse(reportId) {
    const response = document.getElementById('reportResponse')?.value || '';
    closeModal();
    try {
        await api(`/admin/reports/${reportId}/respond`, { method: 'POST', body: JSON.stringify({ response }) });
        showToast('Antwort gesendet.');
        router.navigate('moderation');
    } catch (err) { showToast(err.message); }
}

async function resolveReport(reportId, action) {
    try {
        await api(`/admin/reports/${reportId}/resolve`, { method: 'POST', body: JSON.stringify({ action, response: action === 'RESOLVED' ? 'Meldung bearbeitet' : 'Meldung verworfen' }) });
        showToast(action === 'RESOLVED' ? 'Meldung als erledigt markiert.' : 'Meldung verworfen.');
        router.navigate('moderation');
    } catch (err) { showToast(err.message); }
}

function showRejectModal(eventId) {
    const reasons = ['Regelverstoß', 'Falsche Informationen', 'Duplikat', 'Unangemessener Inhalt', 'Sonstiges'];
    showModal('Event ablehnen', `
        <p class="body-medium text-muted" style="margin-bottom:12px">Grund:</p>
        ${reasons.map((r, i) => `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
            <input type="radio" name="rejectReason" value="${escapeAttr(r)}" ${i === 0 ? 'checked' : ''} style="accent-color:var(--md-primary)">
            <span class="body-medium">${escapeHtml(r)}</span></label>`).join('')}
        <div class="field-simple" style="margin-top:12px"><label>Details</label>
            <input type="text" id="rejectDetail" maxlength="500" placeholder="Optional..."></div>
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled danger" onclick="submitReject(${eventId})">Ablehnen</button>`);
}

async function submitReject(eventId) {
    const selected = document.querySelector('input[name="rejectReason"]:checked');
    const detail = document.getElementById('rejectDetail')?.value;
    let reason = selected?.value || 'Sonstiges';
    if (detail) reason += ': ' + detail;
    closeModal();
    try {
        await api(`/events/${eventId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
        showToast('Abgelehnt.'); router.navigate('moderation');
    } catch (err) { showToast(err.message); }
}

async function approveEvent(eventId) {
    try { await api(`/events/${eventId}/approve`, { method: 'POST' }); showToast('Freigegeben!'); router.navigate('moderation'); }
    catch (err) { showToast(err.message); }
}

async function adminDeleteEvent(eventId) {
    showModal('Event löschen', `<p class="body-medium text-muted">Dieses Event wirklich löschen?</p>
        <div class="field-simple" style="margin-top:12px"><label>Grund</label>
            <input type="text" id="deleteReason" maxlength="200" placeholder="Grund..."></div>`,
        `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
         <button class="btn-filled danger" onclick="confirmAdminDeleteEvent(${eventId})">Löschen</button>`);
}

async function confirmAdminDeleteEvent(eventId) {
    const reason = document.getElementById('deleteReason')?.value || 'Vom Administrator gelöscht';
    closeModal();
    try {
        await api(`/admin/events/${eventId}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
        showToast('Event gelöscht.'); router.navigate('moderation');
    } catch (err) { showToast(err.message); }
}

async function adminEditEvent(eventId) {
    try {
        const ev = await api(`/events/${eventId}`);
        const CATEGORIES = ['Musik', 'Sport', 'Kunst', 'Kultur', 'Food', 'Technologie', 'Natur', 'Party'];
        const catOpts = CATEGORIES.map(c => `<option value="${escapeAttr(c)}" ${ev.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
        const overlay = showModal('Event bearbeiten (Admin)', `
            <div class="field-simple"><label>Titel</label><input type="text" id="adminEditTitle" maxlength="200"></div>
            <div class="field-simple"><label>Kategorie</label><select id="adminEditCategory">${catOpts}</select></div>
            <div class="field-simple"><label>Beschreibung</label><textarea id="adminEditDesc" rows="2" maxlength="2000"></textarea></div>
            <div class="field-simple"><label>Adresse</label><input type="text" id="adminEditAddress" maxlength="500"></div>`,
            `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
             <button class="btn-filled" onclick="saveAdminEventEdit(${eventId})">Speichern</button>`);
        overlay.querySelector('#adminEditTitle').value = ev.title || '';
        overlay.querySelector('#adminEditDesc').value = ev.description || '';
        overlay.querySelector('#adminEditAddress').value = ev.address || '';
    } catch (err) { showToast(err.message); }
}

async function saveAdminEventEdit(eventId) {
    const data = {
        title: adminEditTitle?.value, category: adminEditCategory?.value,
        description: adminEditDesc?.value, address: adminEditAddress?.value
    };
    closeModal();
    try {
        await api(`/admin/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Event aktualisiert.'); router.navigate('moderation');
    } catch (err) { showToast(err.message); }
}