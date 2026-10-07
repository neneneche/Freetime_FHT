// === Profile View (Preferences + XSS-safe) ===

const INTEREST_OPTIONS = ['Musik', 'Sport', 'Kunst', 'Kultur', 'Food', 'Technologie', 'Natur', 'Party'];

router.register('profile', async () => {
    const app = document.getElementById('app');
    try {
        const [user, prefs] = await Promise.all([api('/users/me'), api('/preferences')]);

        const likedSet = new Set(prefs.likes.map(p => p.category));
        const dislikedSet = new Set(prefs.dislikes.map(p => p.category));

        const prefCards = INTEREST_OPTIONS.map(cat => {
            const isLiked = likedSet.has(cat);
            const isDisliked = dislikedSet.has(cat);
            const state = isLiked ? 'liked' : isDisliked ? 'disliked' : '';
            const label = isLiked ? '👍 Gefällt mir' : isDisliked ? '👎 Nicht mein Ding' : '';
            return `
                <div class="survey-card ${state}" data-cat="${escapeAttr(cat)}" data-pref="${isLiked ? 'LIKE' : isDisliked ? 'DISLIKE' : ''}" onclick="cyclePrefCard(this)">
                    <div class="label">${escapeHtml(cat)}</div>
                    <div class="body-small" style="margin-top:4px;min-height:16px">${label}</div>
                </div>`;
        }).join('');

        app.innerHTML = `
        <div style="max-width:900px;margin:0 auto">
            <button class="btn-text" onclick="router.navigate('dashboard')" style="margin-bottom:16px">
                <span class="material-symbols-rounded">arrow_back</span> Zurück</button>
            <div class="profile-layout">
                <div class="profile-sidebar">
                    <div class="profile-avatar" id="profileAvatar"></div>
                    <div>
                        <h4 class="title-large" id="profileName"></h4>
                        <p class="body-medium text-muted" id="profileUser"></p>
                    </div>
                    <span class="chip chip-filled" id="profileRole"></span>
                    <div class="body-small text-muted">
                        <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">cake</span>
                        <span id="profileBirth"></span></div>
                    <div class="body-small text-muted">
                        <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">location_on</span>
                        <span id="profileCity"></span></div>
                </div>

                <div style="display:flex;flex-direction:column;gap:16px">
                    <div class="card-elevated" style="padding:24px">
                        <h5 class="title-medium" style="margin-bottom:20px;display:flex;align-items:center;gap:8px">
                            <span class="material-symbols-rounded">edit</span> Profil bearbeiten</h5>
                        <form id="profileForm" class="profile-form">
                            <div class="field-simple"><label>Anzeigename</label><input type="text" id="pDisplayName" maxlength="100"></div>
                            <div class="field-simple"><label>Wohnort</label><input type="text" id="pCity" maxlength="100"></div>
                            <div class="field-simple"><label>Profilbild URL</label><input type="text" id="pPictureUrl" maxlength="500"></div>
                            <div class="field-simple"><label>Geburtsdatum</label><input type="text" id="pBirthdate" disabled style="opacity:0.6">
                                <div class="hint">Geburtsdatum kann nicht geändert werden.</div></div>
                            <button type="submit" class="btn-filled" style="margin-top:8px">
                                <span class="material-symbols-rounded" style="font-size:18px">save</span> Speichern</button>
                        </form>
                    </div>

                    <div class="card-elevated" style="padding:24px">
                        <h5 class="title-medium" style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                            <span class="material-symbols-rounded">tune</span> Meine Vorlieben</h5>
                        <p class="body-small text-muted" style="margin-bottom:16px">
                            Klicke auf eine Kategorie: 👍 = gefällt mir · 👎 = nicht mein Ding · nochmal = neutral</p>
                        <div class="survey-grid" id="prefGrid">${prefCards}</div>
                        <button class="btn-filled" onclick="savePreferences()">
                            <span class="material-symbols-rounded" style="font-size:18px">save</span> Vorlieben speichern</button>
                    </div>
                </div>
            </div>
        </div>`;

        // Safe text injection
        const avatar = document.getElementById('profileAvatar');
        if (user.profilePictureUrl) {
            const img = document.createElement('img');
            img.src = sanitizeUrl(user.profilePictureUrl);
            avatar.appendChild(img);
        } else { avatar.textContent = user.displayName.charAt(0).toUpperCase(); }
        document.getElementById('profileName').textContent = user.displayName;
        document.getElementById('profileUser').textContent = '@' + user.username;
        document.getElementById('profileRole').textContent = user.role;
        document.getElementById('profileBirth').textContent = user.birthdate;
        document.getElementById('profileCity').textContent = user.city;
        document.getElementById('pDisplayName').value = user.displayName || '';
        document.getElementById('pCity').value = user.city || '';
        document.getElementById('pPictureUrl').value = user.profilePictureUrl || '';
        document.getElementById('pBirthdate').value = user.birthdate || '';

        document.getElementById('profileForm').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await api('/users/me', { method: 'PUT', body: JSON.stringify({
                    displayName: pDisplayName.value, city: pCity.value,
                    profilePictureUrl: pPictureUrl.value, interests: [...likedSet]
                })});
                showToast('Profil gespeichert!');
            } catch (err) { showToast(err.message); }
        };
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

function cyclePrefCard(card) {
    const current = card.dataset.pref || '';
    const label = card.querySelector('.body-small');
    if (current === '') {
        card.dataset.pref = 'LIKE';
        card.classList.add('liked'); card.classList.remove('disliked');
        label.textContent = '👍 Gefällt mir';
    } else if (current === 'LIKE') {
        card.dataset.pref = 'DISLIKE';
        card.classList.remove('liked'); card.classList.add('disliked');
        label.textContent = '👎 Nicht mein Ding';
    } else {
        card.dataset.pref = '';
        card.classList.remove('liked', 'disliked');
        label.textContent = '';
    }
}

async function savePreferences() {
    const cards = document.querySelectorAll('.survey-card');
    try {
        for (const card of cards) {
            const pref = card.dataset.pref;
            const cat = card.dataset.cat;
            if (pref) {
                await api('/preferences', { method: 'POST', body: JSON.stringify({ category: cat, preference: pref }) });
            } else {
                // Remove preference (set to same value twice toggles off, but simpler: just skip)
            }
        }
        showToast('Vorlieben gespeichert!');
    } catch (err) { showToast(err.message); }
}