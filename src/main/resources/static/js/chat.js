// === Chat View (M3, XSS-safe) ===

let currentChatId = null;
let chatPollInterval = null;

router.register('chat', async (params) => {
    const app = document.getElementById('app');
    if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }

    if (params && params.chatId) {
        currentChatId = params.chatId;
        await renderChatWithList(params.chatId, params.name);
        return;
    }

    try {
        const conversations = await api('/chat/conversations');

        app.innerHTML = `
        <div class="chat-layout">
            <div class="chat-list">
                <div class="chat-list-header">Chat</div>
                <div id="convList"></div>
            </div>
            <div class="chat-main">
                <div class="empty-state">
                    <span class="material-symbols-rounded" style="font-size:64px;opacity:0.3">forum</span>
                    <p class="body-large text-muted">Wähle eine Unterhaltung</p>
                </div>
            </div>
        </div>`;

        const convList = document.getElementById('convList');
        if (conversations.length === 0) {
            convList.innerHTML = `<div class="empty-state" style="padding:32px">
                <span class="material-symbols-rounded">chat_bubble</span>
                <p class="body-medium">Noch keine Unterhaltungen.</p>
                <p class="body-small text-muted">Verbinde dich mit Freunden oder like Events.</p></div>`;
        } else {
            conversations.forEach(c => {
                const item = document.createElement('div');
                item.className = 'chat-list-item';
                const safeName = escapeJsStr(c.name || '');
                item.onclick = () => router.navigate('chat', { chatId: c.chatId, name: c.name });
                item.innerHTML = `
                    <div class="friend-avatar"><span class="material-symbols-rounded" style="font-size:20px">${c.type === 'DM' ? 'person' : 'event'}</span></div>
                    <div class="friend-info">
                        <div class="title-small"></div>
                        <div class="body-small text-muted"></div>
                    </div>`;
                item.querySelector('.title-small').textContent = c.name;
                item.querySelectorAll('.body-small')[0].textContent =
                    (c.type === 'DM' ? 'Direktnachricht' : 'Event-Chat') + ' · ' + c.messageCount + ' Nachrichten';
                convList.appendChild(item);
            });
        }
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
});

async function renderChatWithList(chatId, name) {
    const app = document.getElementById('app');
    try {
        const conversations = await api('/chat/conversations');

        app.innerHTML = `
        <div class="chat-layout chat-open">
            <div class="chat-list">
                <div class="chat-list-header">
                    <button class="btn-icon" onclick="router.navigate('chat')" style="margin:-4px 4px -4px -8px">
                        <span class="material-symbols-rounded">arrow_back</span></button>
                    Chat
                </div>
                <div id="convList"></div>
            </div>
            <div class="chat-main">
                <div class="chat-header">
                    <button class="btn-icon" onclick="router.navigate('chat')" style="display:none" id="chatBackBtn">
                        <span class="material-symbols-rounded">arrow_back</span></button>
                    <div class="friend-avatar" style="width:32px;height:32px">
                        <span class="material-symbols-rounded" style="font-size:18px">person</span></div>
                    <span class="title-medium" id="chatName"></span>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="loading-center"><div class="spinner"></div></div>
                </div>
                <form id="chatForm" class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Nachricht schreiben..." maxlength="2000" autocomplete="off">
                    <button type="submit" class="btn-filled" style="width:44px;height:44px;padding:0;flex-shrink:0">
                        <span class="material-symbols-rounded" style="font-size:20px">send</span></button>
                </form>
            </div>
        </div>`;

        document.getElementById('chatName').textContent = name || chatId;

        const convList = document.getElementById('convList');
        conversations.forEach(c => {
            const item = document.createElement('div');
            item.className = 'chat-list-item' + (c.chatId === chatId ? ' active' : '');
            item.onclick = () => router.navigate('chat', { chatId: c.chatId, name: c.name });
            item.innerHTML = `
                <div class="friend-avatar"><span class="material-symbols-rounded" style="font-size:20px">${c.type === 'DM' ? 'person' : 'event'}</span></div>
                <div class="friend-info">
                    <div class="title-small"></div>
                    <div class="body-small text-muted"></div>
                </div>`;
            item.querySelector('.title-small').textContent = c.name;
            item.querySelectorAll('.body-small')[0].textContent = c.type === 'DM' ? 'DM' : 'Event';
            convList.appendChild(item);
        });

        await loadMessages(chatId);
        chatPollInterval = setInterval(() => loadMessages(chatId), 3000);

        document.getElementById('chatForm').onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text) return;
            try {
                await api(`/chat/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
                input.value = '';
                await loadMessages(chatId);
            } catch (err) { showToast(err.message); }
        };
    } catch (err) {
        app.innerHTML = `<div class="error-banner"><span class="material-symbols-rounded">error</span> </div>`;
        app.querySelector('.error-banner').appendChild(document.createTextNode(err.message));
    }
}

async function loadMessages(chatId) {
    try {
        const messages = await api(`/chat/${chatId}/messages`);
        const container = document.getElementById('chatMessages');
        if (!container) return;

        container.innerHTML = '';
        if (messages.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:32px">
                <span class="material-symbols-rounded" style="opacity:0.3">chat</span>
                <p class="body-medium text-muted">Noch keine Nachrichten.</p></div>`;
        } else {
            messages.forEach(m => {
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble ' + (m.senderId === state.userId ? 'sent' : 'received');
                if (m.senderId !== state.userId) {
                    const sender = document.createElement('div');
                    sender.className = 'sender';
                    sender.textContent = m.senderUsername; // Safe
                    bubble.appendChild(sender);
                }
                bubble.appendChild(document.createTextNode(m.text)); // Safe
                container.appendChild(bubble);
            });
        }
        container.scrollTop = container.scrollHeight;
    } catch (e) {}
}