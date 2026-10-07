// === Map View (M3, XSS-safe) ===

let mapInstance = null;
let markerGroup = null;

router.register('map', async () => {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="map-wrapper">
        <div class="map-controls">
            <span class="material-symbols-rounded" style="color:var(--md-on-surface-variant)">radar</span>
            <label class="label-medium" style="white-space:nowrap">Radius:</label>
            <input type="range" id="radiusSlider" min="1" max="50" value="20">
            <span class="chip chip-filled" id="radiusValue">20 km</span>
            <button class="btn-filled tonal" onclick="refreshMap()" style="height:36px;padding:0 16px">
                <span class="material-symbols-rounded" style="font-size:18px">refresh</span> Laden
            </button>
        </div>
        <div class="map-area"><div id="map"></div></div>
    </div>`;

    if (mapInstance) { mapInstance.remove(); mapInstance = null; }

    mapInstance = L.map('map').setView([48.2082, 16.3738], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(mapInstance);

    markerGroup = L.layerGroup().addTo(mapInstance);

    const slider = document.getElementById('radiusSlider');
    const valueLabel = document.getElementById('radiusValue');
    slider.oninput = () => { valueLabel.textContent = slider.value + ' km'; };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 13);
                L.marker([pos.coords.latitude, pos.coords.longitude])
                    .addTo(mapInstance)
                    .bindPopup('<strong>Dein Standort</strong>')
                    .openPopup();
            }, () => {}
        );
    }

    setTimeout(() => mapInstance.invalidateSize(), 100);
    await refreshMap();
});

async function refreshMap() {
    if (!mapInstance) return;
    const radius = document.getElementById('radiusSlider').value;
    const center = mapInstance.getCenter();

    try {
        const events = await api(`/events?lat=${center.lat}&lng=${center.lng}&radius=${radius}`);
        markerGroup.clearLayers();

        events.forEach(ev => {
            const color = categoryColors[ev.category] || '#6750A4';
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
                iconSize: [16, 16], iconAnchor: [8, 8]
            });

            // XSS-safe popup using DOM creation
            const popupContent = document.createElement('div');
            popupContent.style.minWidth = '200px';

            const title = document.createElement('strong');
            title.style.fontSize = '15px';
            title.textContent = ev.title;
            popupContent.appendChild(title);
            popupContent.appendChild(document.createElement('br'));

            const catSpan = document.createElement('span');
            catSpan.style.cssText = `display:inline-block;padding:2px 8px;border-radius:4px;background:${color}22;color:${color};font-size:12px;font-weight:500;margin:4px 0`;
            catSpan.textContent = ev.category;
            popupContent.appendChild(catSpan);
            popupContent.appendChild(document.createElement('br'));

            const addr = document.createElement('span');
            addr.style.cssText = 'font-size:13px;color:#49454F';
            addr.textContent = ev.address;
            popupContent.appendChild(addr);
            popupContent.appendChild(document.createElement('br'));

            const time = document.createElement('span');
            time.style.cssText = 'font-size:12px;color:#79747E';
            time.textContent = formatDateShort(ev.startTime);
            popupContent.appendChild(time);
            popupContent.appendChild(document.createElement('br'));

            const btn = document.createElement('button');
            btn.style.cssText = 'margin-top:8px;padding:6px 16px;border:none;border-radius:20px;background:#6750A4;color:white;font-size:13px;cursor:pointer';
            btn.textContent = 'Details';
            btn.onclick = () => router.navigate('events', { detail: ev.id });
            popupContent.appendChild(btn);

            const marker = L.marker([ev.latitude, ev.longitude], { icon }).bindPopup(popupContent);
            markerGroup.addLayer(marker);
        });

        if (events.length === 0) showToast('Keine Events im Radius.');
    } catch (err) { showToast('Fehler: ' + err.message); }
}