// === Auth Views (M3, XSS-safe) ===

router.register('login', () => {
    document.getElementById('navRail').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('topBar').style.display = 'none';
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="logo-area">
                <div class="logo-circle">F</div>
                <h2 class="headline-small">Willkommen bei Freetime</h2>
                <p class="body-medium text-muted">Events entdecken. Menschen treffen.</p>
            </div>
            <form id="loginForm">
                <div class="field-group">
                    <input type="text" id="loginUsername" placeholder=" " required autocomplete="username">
                    <label for="loginUsername">Benutzername</label>
                </div>
                <div class="field-group">
                    <input type="password" id="loginPassword" placeholder=" " required autocomplete="current-password">
                    <label for="loginPassword">Passwort</label>
                </div>
                <div id="loginError" class="error-banner" style="display:none;margin-bottom:16px"></div>
                <button type="submit" class="btn-filled full">
                    <span class="material-symbols-rounded" style="font-size:18px">login</span> Anmelden
                </button>
            </form>
            <div style="text-align:center;margin-top:16px">
                <span class="body-medium text-muted">Noch kein Konto? </span>
                <button class="btn-text" onclick="router.navigate('register')" style="padding:0;height:auto;min-height:0">Registrieren</button>
            </div>
            <div class="demo-box">
                <strong>Demo-Zugänge:</strong><br>
                admin / Admin123!@#$%<br>
                alice / Alice123!@#$%<br>
                bob / Bob12345!@#$%
            </div>
            <div style="text-align:center;margin-top:16px">
                <button class="theme-toggle" onclick="toggleTheme()" style="margin:0 auto">
                    <div class="thumb"><span class="material-symbols-rounded">light_mode</span></div>
                </button>
            </div>
        </div>
    </div>`;

    document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const errDiv = document.getElementById('loginError');
        errDiv.style.display = 'none';
        try {
            const data = await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: document.getElementById('loginUsername').value,
                    password: document.getElementById('loginPassword').value
                })
            });
            setAuth(data.token, data.userId, data.username, data.role);
            showToast('Willkommen, ' + data.username + '!');
            router.navigate('dashboard');
        } catch (err) {
            errDiv.innerHTML = '<span class="material-symbols-rounded" style="font-size:18px">error</span> ';
            errDiv.appendChild(document.createTextNode(err.message));
            errDiv.style.display = 'flex';
        }
    };
});

router.register('register', () => {
    document.getElementById('navRail').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('topBar').style.display = 'none';
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="logo-area">
                <div class="logo-circle">F</div>
                <h2 class="headline-small">Konto erstellen</h2>
            </div>
            <form id="registerForm">
                <div class="field-group">
                    <input type="text" id="regUsername" placeholder=" " required autocomplete="username">
                    <label for="regUsername">Benutzername</label>
                </div>
                <div class="field-group">
                    <input type="email" id="regEmail" placeholder=" " required autocomplete="email">
                    <label for="regEmail">E-Mail</label>
                </div>
                <div class="field-group">
                    <input type="text" id="regDisplayName" placeholder=" " required>
                    <label for="regDisplayName">Anzeigename</label>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="field-simple">
                        <label>Geburtsdatum</label>
                        <input type="date" id="regBirthdate" required>
                    </div>
                    <div class="field-simple">
                        <label>Wohnort</label>
                        <input type="text" id="regCity" required>
                    </div>
                </div>
                <div class="field-group" style="margin-top:8px">
                    <input type="password" id="regPassword" placeholder=" " required autocomplete="new-password">
                    <label for="regPassword">Passwort</label>
                </div>
                <div class="body-small text-muted" style="margin:-8px 0 16px">
                    Mind. 12 Zeichen, Groß-/Kleinbuchstabe, Ziffer, Sonderzeichen
                </div>
                <div id="regError" class="error-banner" style="display:none;margin-bottom:16px"></div>
                <button type="submit" class="btn-filled full">
                    <span class="material-symbols-rounded" style="font-size:18px">person_add</span> Registrieren
                </button>
            </form>
            <div style="text-align:center;margin-top:16px">
                <span class="body-medium text-muted">Bereits ein Konto? </span>
                <button class="btn-text" onclick="router.navigate('login')" style="padding:0;height:auto;min-height:0">Anmelden</button>
            </div>
        </div>
    </div>`;

    document.getElementById('registerForm').onsubmit = async (e) => {
        e.preventDefault();
        const errDiv = document.getElementById('regError');
        errDiv.style.display = 'none';
        try {
            const data = await api('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username: document.getElementById('regUsername').value,
                    email: document.getElementById('regEmail').value,
                    displayName: document.getElementById('regDisplayName').value,
                    birthdate: document.getElementById('regBirthdate').value,
                    city: document.getElementById('regCity').value,
                    password: document.getElementById('regPassword').value,
                    interests: []
                })
            });
            setAuth(data.token, data.userId, data.username, data.role);
            showToast('Registrierung erfolgreich!');
            router.navigate('dashboard');
        } catch (err) {
            errDiv.innerHTML = '<span class="material-symbols-rounded" style="font-size:18px">error</span> ';
            errDiv.appendChild(document.createTextNode(err.message));
            errDiv.style.display = 'flex';
        }
    };
});