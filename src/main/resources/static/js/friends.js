// === Friends View (M3, XSS-safe) ===

router.register('friends', async () => {
    const app = document.getElementById('app');
    try {
        const [friends, pending] = await Promise.all([
            api('/friends'),
            api('/friends/requests')
        ]);

        app.innerHTML = `
        <div class="friends-layout">
            <div style="display:flex;align-items:center;justify-content:space-between">
                <h4 class="headline-small">Freunde</h4>
                <button class="btn-filled tonal" onclick="showAddFriend()">
                    <span class="material-symbols-rounded" style="font-size:18px">person_add</span> Hinzufügen
                </button>
            </div>

            <div id="addFriendForm" style="display:none" class="card-outlined">
                <div style="padding:16px">
                    <div class="search-box">
                        <span class="material-symbols-rounded" style="color:var(--md-on-surface-variant)">search</span>
                        <input type="text" id="friendSearchInput" placeholder="Benutzer suchen..." oninput="searchFriends(this.value)" maxlength="100">
                    </div>
                    <div id="friendSearchResults" class="search-results" style="display:none"></div>
                </div>
            </div>

            <div id="pendingSection"></div>

            <div class="card-outlined" style="padding:8px">
                <h5 class="title-medium" style="padding:8px 16px">Meine Freunde (${friends.length})</h5>
                <div id="friendsList"></div>
            </div>
        </div>`;

        // Pending requests (XSS-safe)
        const pendingSection = document.getElementById('pendingSection');
        if (pending.length > 0) {
            pendingSection.innerHTML = `
                <div class="card-elevated" style="padding:16px">
                    <h5 class="title-medium" style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                        <span class="material-symbols-rounded">mark_email_unread</span> Offene Anfragen
                        <span class="chip chip-filled">${pending.length}</span>
                    </h5>
                    <div id="pendingList"></div>
                </div>`;
            const pendingList = document.getElementById('pendingList');
            pending.forEach(f => {
                const item = document.createElement('div');
                item.className = 'friend-item';
                item.innerHTML = `
                    <div class="friend-avatar"></div>
                    <div class="friend-info">
                        <div class="title-small"></div>
                        <div class="body-small text-muted">möchte dein Freund sein</div>
                    </div>
                    <div class="friend-actions">
                        <button class="btn-filled success" style="height:32px;padding:0 16px" onclick="acceptFriend(${f.id})">Annehmen</button>
                        <button class="btn-outlined danger" style="height:32px;padding:0 16px" onclick="declineFriend(${f.id})">Ablehnen</button>
                    </div>`;
                item.querySelector('.friend-avatar').textContent = f.requesterUsername.charAt(0).toUpperCase();
                item.querySelector('.title-small').textContent = f.requesterUsername;
                pendingList.appendChild(item);
            });
        }

        // Friends list (XSS-safe)
        const friendsList = document.getElementById('friendsList');
        if (friends.length === 0) {
            friendsList.innerHTML = `<div class="empty-state">
                <span class="material-symbols-rounded">group</span>
                <p class="body-medium">Noch keine Freunde.</p></div>`;
        } else {
            friends.forEach(f => {
                const item = document.createElement('div');
                item.className = 'friend-item';
                item.innerHTML = `
                    <div class="friend-avatar"></div>
                    <div class="friend-info">
                        <div class="title-small"></div>
                        <div class="body-small text-muted"></div>
                    </div>
                    <div class="friend-actions">
                        <button class="btn-icon" onclick="router.navigate('chat')" title="Chat">
                            <span class="material-symbols-rounded">chat</span></button>
                        <button class="btn-icon" onclick="removeFriend(${f.friendshipId})" title="Entfernen">
                            <span class="material-symbols-rounded" style="color:var(--md-error)">person_remove</span></button>
                    </div>`;
                item.querySelector('.friend-avatar').textContent = f.displayName.charAt(0).toUpperCase();
                item.querySelector('.title-small').textContent = f.displayName;
                item.querySelectorAll('.body-small')[0].textContent = '@' + f.username;
                friendsList.appendChild(item);
            });
        }
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

function showAddFriend() {
    const form = document.getElementById('addFriendForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') searchFriends('');
}

async function searchFriends(query) {
    try {
        const results = await api(`/users/search?q=${encodeURIComponent(query)}`);
        const container = document.getElementById('friendSearchResults');
        if (!container) return;

        container.style.display = results.length > 0 ? 'block' : 'none';
        container.innerHTML = '';
        results.forEach(u => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.onclick = () => sendFriendRequest(u.id);
            item.innerHTML = `
                <div class="friend-avatar" style="width:32px;height:32px;font-size:14px"></div>
                <div style="flex:1">
                    <div class="title-small"></div>
                    <div class="body-small text-muted"></div>
                </div>
                <span class="material-symbols-rounded" style="color:var(--md-primary)">person_add</span>`;
            item.querySelector('.friend-avatar').textContent = u.displayName.charAt(0).toUpperCase();
            item.querySelector('.title-small').textContent = u.displayName;
            item.querySelectorAll('.body-small')[0].textContent = '@' + u.username;
            container.appendChild(item);
        });
    } catch (e) {}
}

async function sendFriendRequest(userId) {
    try {
        await api(`/friends/request/${userId}`, { method: 'POST' });
        showToast('Freundschaftsanfrage gesendet!');
        const container = document.getElementById('friendSearchResults');
        if (container) container.style.display = 'none';
        const input = document.getElementById('friendSearchInput');
        if (input) input.value = '';
    } catch (err) { showToast(err.message); }
}

async function acceptFriend(id) {
    try {
        await api(`/friends/accept/${id}`, { method: 'POST' });
        showToast('Angenommen!');
        router.navigate('friends');
    } catch (err) { showToast(err.message); }
}

async function declineFriend(id) {
    try {
        await api(`/friends/decline/${id}`, { method: 'POST' });
        showToast('Abgelehnt.');
        router.navigate('friends');
    } catch (err) { showToast(err.message); }
}

async function removeFriend(id) {
    showModal('Freundschaft auflösen',
        '<p class="body-medium text-muted">Möchtest du diese Freundschaft wirklich beenden?</p>',
        `<button class="btn-text" onclick="closeModal()">Abbrechen</button>
         <button class="btn-filled danger" onclick="confirmRemoveFriend(${id})">Auflösen</button>`);
}

async function confirmRemoveFriend(id) {
    closeModal();
    try {
        await api(`/friends/${id}`, { method: 'DELETE' });
        showToast('Freundschaft aufgelöst.');
        router.navigate('friends');
    } catch (err) { showToast(err.message); }
}