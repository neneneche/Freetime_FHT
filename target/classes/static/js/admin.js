// === Admin Panel (User Management + XSS-safe) ===

router.register('admin', async () => {
    const app = document.getElementById('app');

    if (state.role !== 'ADMIN') {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">shield</span> Nur für Administratoren.</div>`;
        return;
    }

    try {
        const users = await api('/admin/users');

        app.innerHTML = `
        <div style="max-width:900px;margin:0 auto">
            <h4 class="headline-small" style="margin-bottom:20px;display:flex;align-items:center;gap:8px">
                <span class="material-symbols-rounded">admin_panel_settings</span>
                Admin – Benutzerverwaltung
            </h4>

            <div class="card-elevated" style="padding:20px">
                <h5 class="title-medium" style="margin-bottom:16px">Alle Benutzer (${users.length})</h5>
                <div id="userList"></div>
            </div>
        </div>`;

        const list = document.getElementById('userList');
        users.forEach(u => {
            const item = document.createElement('div');
            item.className = 'admin-user-item';
            item.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="friend-avatar"></div>
                    <div>
                        <div class="title-small"></div>
                        <div class="body-small text-muted"></div>
                        <div style="display:flex;gap:4px;margin-top:4px">
                            <span class="chip chip-outlined" style="height:22px;font-size:10px;padding:0 8px"></span>
                            <span class="admin-badge ${u.accountNonLocked ? 'active-badge' : 'banned'}">${u.accountNonLocked ? 'Aktiv' : 'Gesperrt'}</span>
                        </div>
                    </div>
                </div>
                <div class="admin-user-actions">
                    <button class="btn-outlined" style="height:32px;padding:0 12px;font-size:12px"
                        onclick="adminResetPassword(${u.id}, '${escapeAttr(u.username)}')">
                        <span class="material-symbols-rounded" style="font-size:14px">key</span> Passwort</button>
                    ${u.accountNonLocked ? `
                        <button class="btn-outlined danger" style="height:32px;padding:0 12px;font-size:12px"
                            onclick="adminBanUser(${u.id}, '${escapeAttr(u.username)}')">
                            <span class="material-symbols-rounded" style="font-size:14px">block</span> Sperren</button>
                    ` : `
                        <button class="btn-filled success" style="height:32px;padding:0 12px;font-size:12px"
                            onclick="adminUnbanUser(${u.id})">
                            <span class="material-symbols-rounded" style="font-size:14px">check</span> Entsperr.</button>
                    `}
                    <button class="btn-text" style="height:32px;padding:0 8px;font-size:12px"
                        onclick="adminChangeRole(${u.id}, '${escapeAttr(u.username)}', '${u.role}')">
                        <span class="material-symbols-rounded" style="font-size:14px">swap_horiz</span> Rolle</button>
                </div>`;
            item.querySelector('.friend-avatar').textContent = u.displayName.charAt(0).toUpperCase();
            item.querySelector('.title-small').textContent = u.displayName;
            item.querySelectorAll('.body-small')[0].textContent = '@' + u.username + ' · ' + u.email;
            item.querySelector('.chip').textContent = u.role;
            list.appendChild(item);
        });
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

async function adminResetPassword(userId, username) {
    const overlay = showModal('Passwort zurücksetzen', `
        <p class="body-medium text-muted" style="margin-bottom:12px">
            Neues Passwort für <strong></strong>:</p>
        <div class="field-simple"><label>Neues Passwort</label>
            <input type="text" id="newPassword" value="Temp123!@#$%" maxlength="100"></div>
        <p class="body-small text-muted">Das Passwort wird dem Benutzer mitgeteilt.</p>
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled" onclick="confirmResetPassword(${userId})">Zurücksetzen</button>`);
    overlay.querySelector('strong').textContent = username;
}

async function confirmResetPassword(userId) {
    const password = document.getElementById('newPassword')?.value || 'Temp123!@#$%';
    closeModal();
    try {
        const result = await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
        showToast('Passwort zurückgesetzt: ' + result.password);
        router.navigate('admin');
    } catch (err) { showToast(err.message); }
}

async function adminBanUser(userId, username) {
    showModal('Benutzer sperren', `
        <p class="body-medium text-muted">Möchtest du <strong></strong> wirklich sperren?</p>
        <div class="field-simple" style="margin-top:12px"><label>Grund</label>
            <input type="text" id="banReason" placeholder="Grund..." maxlength="200"></div>
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled danger" onclick="confirmBanUser(${userId})">Sperren</button>`)
        .querySelector('strong').textContent = username;
}

async function confirmBanUser(userId) {
    const reason = document.getElementById('banReason')?.value || 'Gesperrt';
    closeModal();
    try {
        await api(`/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) });
        showToast('Benutzer gesperrt.');
        router.navigate('admin');
    } catch (err) { showToast(err.message); }
}

async function adminUnbanUser(userId) {
    try {
        await api(`/admin/users/${userId}/unban`, { method: 'POST' });
        showToast('Benutzer entsperrt.');
        router.navigate('admin');
    } catch (err) { showToast(err.message); }
}

async function adminChangeRole(userId, username, currentRole) {
    const roles = ['USER', 'MODERATOR', 'ADMIN'];
    const overlay = showModal('Rolle ändern', `
        <p class="body-medium text-muted" style="margin-bottom:12px">Neue Rolle für <strong></strong>:</p>
        ${roles.map(r => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer">
                <input type="radio" name="newRole" value="${r}" ${r === currentRole ? 'checked' : ''} style="accent-color:var(--md-primary)">
                <span class="body-medium">${r}</span>
            </label>`).join('')}
    `, `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
        <button class="btn-filled" onclick="confirmChangeRole(${userId})">Ändern</button>`);
    overlay.querySelector('strong').textContent = username;
}

async function confirmChangeRole(userId) {
    const selected = document.querySelector('input[name="newRole"]:checked');
    closeModal();
    try {
        await api(`/admin/users/${userId}/change-role`, { method: 'POST', body: JSON.stringify({ role: selected?.value || 'USER' }) });
        showToast('Rolle geändert.');
        router.navigate('admin');
    } catch (err) { showToast(err.message); }
}