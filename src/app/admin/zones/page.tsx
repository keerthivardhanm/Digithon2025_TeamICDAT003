'use client';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';

export default function ZonesPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const htmlContent = `
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Flow-Track — GeoFence + Density Demo (with Subzones & Volunteers)</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
            :root{
                --bg:#f6f7fb;
                --panel:#ffffff;
                --muted:#6b7280;
                --accent:#1e88e5;
                --accent-2:#3949ab;
                --success:#2ecc71;
                --warn:#f1c40f;
                --danger:#e74c3c;
                --card-radius:12px;
                --gap:12px;
                --panel-width:380px;
            }

            html,body { height:100%; margin:0; font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background:var(--bg); color:#111827; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
            body {
                display:grid;
                grid-template-columns: 1fr var(--panel-width);
                gap:16px;
                align-items:stretch;
                min-height:100vh;
                box-sizing:border-box;
                padding:12px;
            }

            #map {
                width:100%;
                height:calc(100vh - 24px);
                min-width:0;
                border-radius:12px;
                overflow:hidden;
                box-shadow: 0 8px 30px rgba(2,6,23,0.06);
                transition:filter 200ms ease, transform 200ms ease;
            }

            #right {
                width:var(--panel-width);
                box-sizing:border-box;
                padding:18px;
                overflow:auto;
                background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,252,0.98));
                border-radius:12px;
                border:1px solid rgba(15,23,42,0.06);
                height:calc(100vh - 24px);
            }

            h2 { margin:4px 0 14px; font-size:18px; line-height:1.2; color:#0f172a; font-weight:600; }

            .card {
                background:var(--panel);
                padding:12px;
                margin-bottom:12px;
                border-radius:var(--card-radius);
                box-shadow: 0 6px 18px rgba(15,23,42,0.04);
                border:1px solid rgba(15,23,42,0.03);
            }

            .controls { display:flex; flex-direction:column; gap:10px; padding:8px 4px; }
            .small { font-size:12px; color:var(--muted); }

            #zones-list { margin-top:6px; display:flex; flex-direction:column; gap:10px; }
            .zone-title { display:flex; justify-content:space-between; align-items:center; gap:8px; }
            .zone-title strong { font-size:14px; color:#0b1220; font-weight:600; }
            .zone-stats { margin-top:8px; font-size:13px; color:#111827; }

            .badge {
                font-size:12px;
                background:rgba(15,23,42,0.04);
                padding:6px 8px;
                border-radius:999px;
                color:#0b1220;
            }

            .risk-bar { height:12px; border-radius:10px; background:rgba(15,23,42,0.05); overflow:hidden; margin-top:8px; }
            .risk-fill {
                height:100%;
                width:0;
                background:linear-gradient(90deg,var(--success),var(--warn),var(--danger));
                transition:width 300ms ease, background-color 300ms ease;
            }

            input[type="number"], input[type="text"], select, input[type="checkbox"] {
                padding:8px 10px;
                border-radius:8px;
                border:1px solid rgba(15,23,42,0.08);
                background: #fff;
                box-sizing:border-box;
                font-size:13px;
                color:#0b1220;
            }

            .sim-row { display:flex; gap:8px; margin-top:6px; align-items:center; }
            .sim-row input[type="number"] { width:110px; }

            button {
                padding:8px 10px;
                border-radius:8px;
                border:0;
                cursor:pointer;
                background:var(--accent);
                color:white;
                font-weight:600;
                font-size:13px;
                box-shadow: 0 6px 12px rgba(30,136,229,0.08);
                transition:transform 120ms ease, box-shadow 120ms ease, opacity 120ms;
            }
            button:hover { transform:translateY(-1px); box-shadow: 0 10px 20px rgba(30,136,229,0.08); }
            button:active { transform:translateY(0); }

            .card button { padding:6px 8px; font-size:13px; border-radius:8px; box-shadow:none; }
            .card button[data-action="delete"] { background:#ef4444; }
            .card button[data-action="rename"] { background:#6b4c3a; }

            #status { padding:8px 10px; display:inline-block; border-radius:8px; background:rgba(15,23,42,0.03); color:var(--muted); }

            .controls > button, .controls > .estimateBtn { width:100%; }

            #right::-webkit-scrollbar { width:10px; height:10px; }
            #right::-webkit-scrollbar-thumb { background:rgba(2,6,23,0.08); border-radius:10px; }
            #right::-webkit-scrollbar-track { background:transparent; }

            .subzone-card { margin-top:8px; padding:8px; background:#fbfdff; border-radius:8px; border:1px solid rgba(15,23,42,0.03); }
            .vol-list { margin-top:8px; display:flex; flex-direction:column; gap:6px; }

            @media (max-width:980px) {
                body {
                    grid-template-columns: 1fr;
                    grid-auto-rows: auto;
                    padding:8px;
                    gap:8px;
                }
                #map { height:60vh; border-radius:10px; }
                #right { width:100%; height:auto; border-radius:10px; padding:12px; }
            }

            @media (max-width:420px) {
                h2 { font-size:16px; }
                #right { padding:10px; }
                button { font-size:13px; padding:8px; }
            }
        </style>
    </head>
    <body>
        <div id="map"></div>

        <div id="right">
            <h2>Flow-Track — Zones, Subzones & Volunteers</h2>

            <div class="card controls">
                <div class="small">Drawing Tools</div>
                <div style="margin-top:8px;">
                    <div class="small">Click the polygon icon on the map to draw a zone. After drawing, zone is saved automatically. To create subzones, use "Add Sub-zone" on a zone card, then draw polygon on map.</div>
                </div>
                <hr/>
                <div class="small">Map & Location</div>
                <div style="margin-top:8px; display:flex; gap:8px;">
                    <button id="toggle-satellite" style="background:#3949ab;padding:8px 10px">Satellite View</button>
                    <button id="locate-me" style="background:#00796b;padding:8px 10px">Locate Me</button>
                </div>
                <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
                    <input id="use-live-count" type="checkbox" /> <span class="small">Include my live location in counts</span>
                </label>

                <hr/>
                <div class="small">Simulated Attendees (for demo)</div>
                <div class="sim-row">
                    <input id="sim-count" type="number" min="1" value="6"/>
                    <button id="spawn-sim">Spawn</button>
                </div>
                <div style="margin-top:8px;"></div>
                    <button id="export-csv">Download Crowd Report (CSV)</button>
            </div>

            <div id="zones-list"></div>
            <div class="card">
                <div class="small">System Status</div>
                <div id="status" class="small">Initializing...</div>
                <div style="margin-top:8px;" class="small">Communication: BroadcastChannel + localStorage</div>
            </div>
        </div>

    <script async
        src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry,visualization&callback=initMap">
    </script>

    <script>
    const ENTRY_MS = 4000, EXIT_MS = 4000, SMOOTH_ALPHA = 0.7;
    const DENSITY_THRESHOLDS = { low: 0.5, medium: 1.0 };
    const RISK_DENSITY_MAX = 2.0;
    const ZONE_KEY = 'flowtrack_zones_v1';
    const COUNTS_KEY = 'flowtrack_counts_v1';

    let map, drawingManager;
    let zoneMeta = [];        // zones: {id,name,polygon,area,overlay,subzones: [ {id,name,polygon,area,overlay,volunteers:[] } ] }
    let zonePeopleCount = {}; // id -> count
    let userZoneMap = {};     // id -> zoneId|null
    let sims = {};
    let broadcast;
    let heatmapLayer = null;

    let pendingParentForSubzone = null; // when adding subzone via UI

    // Save/load include subzones
    function saveZonesToStorage() {
        const save = zoneMeta.map(z => ({
            id: z.id, name: z.name, polygon: z.polygon, area: z.area,
            subzones: (z.subzones || []).map(s => ({ id: s.id, name: s.name, polygon: s.polygon, area: s.area, volunteers: s.volunteers || [] }))
        }));
        localStorage.setItem(ZONE_KEY, JSON.stringify(save));
        if (broadcast) broadcast.postMessage({ type: 'zones-updated', zones: save });
    }

    function loadZonesFromStorage() {
        const raw = localStorage.getItem(ZONE_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
    }

    function initBroadcast() {
        try {
            broadcast = new BroadcastChannel('flowtrack_channel_v1');
            broadcast.onmessage = e => {
                const msg = e.data;
                if (!msg) return;
                if (msg.type === 'zones-updated') renderZonesFromStorage();
                if (msg.type === 'counts-updated') {
                    zonePeopleCount = msg.counts || {};
                    updateAllZoneCards();
                }
            };
        } catch (err) {
            window.addEventListener('storage', (e) => {
                if (e.key === ZONE_KEY) renderZonesFromStorage();
                if (e.key === COUNTS_KEY) {
                    try { zonePeopleCount = JSON.parse(e.newValue).counts || {}; updateAllZoneCards(); } catch (_) {}
                }
            });
        }
    }

    function broadcastPost(obj) {
        try {
            if (broadcast) broadcast.postMessage(obj);
            if (obj.type === 'counts-updated') localStorage.setItem(COUNTS_KEY, JSON.stringify({ ts: Date.now(), counts: obj.counts }));
        } catch (e) { console.error(e); }
    }

    function renderZonesFromStorage() {
        zoneMeta.forEach(z => { if (z.overlay && z.overlay.setMap) z.overlay.setMap(null); if (z.subzones) z.subzones.forEach(s=>{ if (s.overlay && s.overlay.setMap) s.overlay.setMap(null); }); });
        zoneMeta = [];
        document.getElementById('zones-list').innerHTML = '';
        const saved = loadZonesFromStorage();
        saved.forEach(z => addZoneToMap(z, { saveAfter: false }));
        updateAllZoneCards();
    }

    // Generic attach handler for polygons (zone or subzone)
    function attachEditHandlersGeneric(meta, parentZoneId) {
        const polygon = meta.overlay;
        function syncMeta() {
            const path = polygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
            const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
            meta.polygon = path;
            meta.area = area;
            // if subzone, find parent and update there
            if (parentZoneId) {
                const zp = zoneMeta.find(z=>z.id===parentZoneId);
                if (zp) {
                    const idx = (zp.subzones||[]).findIndex(s=>s.id===meta.id);
                    if (idx>=0) zp.subzones[idx] = meta;
                }
            } else {
                const idx = zoneMeta.findIndex(z=>z.id===meta.id);
                if (idx>=0) zoneMeta[idx] = meta;
            }
            saveZonesToStorage();
            updateAllZoneCards();
        }
        polygon.getPath().addListener('set_at', syncMeta);
        polygon.getPath().addListener('insert_at', syncMeta);
        polygon.getPath().addListener('remove_at', syncMeta);
        map.addListener('mouseup', () => syncMeta());
    }

    function addZoneToMap(z, opts = {}) {
        const polygon = new google.maps.Polygon({
            paths: z.polygon,
            strokeColor: '#1e88e5',
            strokeWeight: 2,
            fillColor: '#90caf9',
            fillOpacity: 0.25,
            editable: true,
            map: map,
        });
        const meta = { id: z.id, name: z.name, polygon: z.polygon, area: z.area, overlay: polygon, subzones: [] };
        zoneMeta.push(meta);
        attachEditHandlersGeneric(meta, null);
        // subzones (if any)
        if (z.subzones && Array.isArray(z.subzones)) {
            z.subzones.forEach(s => {
                const sp = new google.maps.Polygon({
                    paths: s.polygon,
                    strokeColor: '#1b5e20',
                    strokeWeight: 2,
                    fillColor: '#a5d6a7',
                    fillOpacity: 0.35,
                    editable: true,
                    map: map,
                });
                const smeta = { id: s.id, name: s.name, polygon: s.polygon, area: s.area, overlay: sp, volunteers: s.volunteers || [] };
                meta.subzones.push(smeta);
                attachEditHandlersGeneric(smeta, meta.id);
            });
        }
        renderZoneCard(meta, true);
        if (opts.saveAfter !== false) saveZonesToStorage();
        updateAllZoneCards();
    }

    function renderZoneCard(z, overwrite = false) {
        const list = document.getElementById('zones-list');
        let card = document.getElementById(\`card-\${z.id}\`);
        const areaLabel = ((z.area || 0) / 100).toFixed(1) + ' m²';
        if (!card) {
            card = document.createElement('div');
            card.className = 'card';
            card.id = \`card-\${z.id}\`;
            list.appendChild(card);
        }
        // subzone container id: sublist-<zoneid>
        card.innerHTML = \`
            <div class="zone-title">
                <strong>\${z.name}</strong>
                <span class="badge">\${areaLabel}</span>
            </div>
            <div class="zone-stats">People: <span id="count-\${z.id}">0</span></div>
            <div class="risk-bar"><div id="risk-\${z.id}" class="risk-fill"></div></div>
            <div style="margin-top:8px;display:flex;gap:6px">
                <button data-action="rename" data-zone="\${z.id}" style="background:#6d4c41;padding:6px 8px">Rename</button>
                <button data-action="delete" data-zone="\${z.id}" style="background:#e53935;padding:6px 8px">Delete</button>
                <button data-action="add-sub" data-zone="\${z.id}" style="background:#2e7d32;padding:6px 8px">Add Sub-zone</button>
            </div>
            <div id="sublist-\${z.id}"></div>
        \`;
        // attach zone actions
        card.querySelectorAll('button[data-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.getAttribute('data-action');
                const zid = btn.getAttribute('data-zone');
                if (action === 'rename') {
                    const newName = prompt('Zone name:', z.name) || z.name;
                    const zm = zoneMeta.find(x => x.id === zid);
                    if (zm) { zm.name = newName; saveZonesToStorage(); renderZoneCard(zm, true); }
                } else if (action === 'delete') {
                    if (!confirm('Delete zone and its subzones?')) return;
                    const idx = zoneMeta.findIndex(x => x.id === zid);
                    if (idx >= 0) {
                        const zm = zoneMeta[idx];
                        if (zm.overlay && zm.overlay.setMap) zm.overlay.setMap(null);
                        if (zm.subzones) zm.subzones.forEach(s=>{ if (s.overlay && s.overlay.setMap) s.overlay.setMap(null); });
                        zoneMeta.splice(idx, 1);
                        saveZonesToStorage();
                        document.getElementById('zones-list').removeChild(card);
                        delete zonePeopleCount[zid];
                        updateAllZoneCards();
                    }
                } else if (action === 'add-sub') {
                    // set pending parent and switch drawing mode on
                    pendingParentForSubzone = zid;
                    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                    document.getElementById('status').innerText = 'Drawing subzone for ' + zid + ' — draw polygon on map.';
                }
            };
        });

        // render subzones inside this zone card
        const sublist = card.querySelector(\`#sublist-\${z.id}\`);
        sublist.innerHTML = '';
        (z.subzones || []).forEach(s => {
            const sc = document.createElement('div');
            sc.className = 'subzone-card';
            sc.id = \`sub-\${s.id}\`;
            sc.innerHTML = \`
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="font-size:13px">\${s.name}</strong>
                    <span class="badge">\${((s.area||0)/100).toFixed(1)} m²</span>
                </div>
                <div class="small">Volunteers: <span id="volcount-\${s.id}">\${(s.volunteers||[]).length}</span></div>
                <div class="vol-list" id="vol-list-\${s.id}"></div>
                <div style="margin-top:8px;display:flex;gap:6px">
                    <button data-action="assign-vol" data-zone="\${z.id}" data-sub="\${s.id}" style="background:#0288d1;padding:6px 8px">Assign Volunteer</button>
                    <button data-action="delete-sub" data-zone="\${z.id}" data-sub="\${s.id}" style="background:#e53935;padding:6px 8px">Delete Subzone</button>
                </div>
            \`;
            sublist.appendChild(sc);

            // populate volunteers list
            const vlistEl = sc.querySelector(\`#vol-list-\${s.id}\`);
            (s.volunteers || []).forEach((v, idx) => {
                const ve = document.createElement('div');
                ve.style.display = 'flex';
                ve.style.justifyContent = 'space-between';
                ve.style.alignItems = 'center';
                ve.innerHTML = \`<div class="small">\${v}</div><button data-action="remove-vol" data-zone="\${z.id}" data-sub="\${s.id}" data-idx="\${idx}" style="background:#b71c1c;padding:4px 8px">Remove</button>\`;
                vlistEl.appendChild(ve);
            });

            // attach subzone action handlers
            sc.querySelectorAll('button[data-action]').forEach(btn => {
                btn.onclick = () => {
                    const action = btn.getAttribute('data-action');
                    const zid = btn.getAttribute('data-zone');
                    const sid = btn.getAttribute('data-sub');
                    const parent = zoneMeta.find(x => x.id === zid);
                    if (!parent) return;
                    const sidx = (parent.subzones||[]).findIndex(x=>x.id===sid);
                    if (sidx < 0) return;
                    const sm = parent.subzones[sidx];
                    if (action === 'assign-vol') {
                        const name = prompt('Volunteer name:') || null;
                        if (name) {
                            sm.volunteers = sm.volunteers || [];
                            sm.volunteers.push(name);
                            saveZonesToStorage();
                            renderZoneCard(parent, true);
                        }
                    } else if (action === 'delete-sub') {
                        if (!confirm('Delete subzone?')) return;
                        if (sm.overlay && sm.overlay.setMap) sm.overlay.setMap(null);
                        parent.subzones.splice(sidx,1);
                        saveZonesToStorage();
                        renderZoneCard(parent, true);
                    } else if (action === 'remove-vol') {
                        const idx = parseInt(btn.getAttribute('data-idx'),10);
                        if (!isNaN(idx)) {
                            sm.volunteers.splice(idx,1);
                            saveZonesToStorage();
                            renderZoneCard(parent, true);
                        }
                    }
                };
            });
        });
    }

    function updateAllZoneCards() {
        zoneMeta.forEach(z => {
            const count = zonePeopleCount[z.id] || 0;
            const area = z.area || 1;
            const density = count / (area / 100);
            const risk = getRiskColor(density);
            const countEl = document.getElementById(\`count-\${z.id}\`);
            if (countEl) countEl.textContent = count;
            const fill = document.getElementById(\`risk-\${z.id}\`);
            if (fill) {
                fill.style.width = \`\${Math.min((density / RISK_DENSITY_MAX) * 100, 100)}%\`;
                fill.style.background = risk;
            }
            // update volunteer counts UI if present
            (z.subzones||[]).forEach(s=>{
                const volCountEl = document.getElementById(\`volcount-\${s.id}\`);
                if (volCountEl) volCountEl.textContent = (s.volunteers||[]).length;
            });
        });
    }

    function getRiskColor(density) {
        if (density < DENSITY_THRESHOLDS.low) return '#2ecc71';
        if (density < DENSITY_THRESHOLDS.medium) return '#f1c40f';
        return '#e74c3c';
    }

    function setupDrawingTools() {
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: { drawingModes: ['polygon'] },
            polygonOptions: {
                editable: true,
                fillColor: '#42a5f5',
                fillOpacity: 0.2,
                strokeColor: '#1e88e5',
                strokeWeight: 2,
            },
        });
        drawingManager.setMap(map);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', e => {
            if (e.type === google.maps.drawing.OverlayType.POLYGON) {
                const poly = e.overlay;
                const path = poly.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
                const area = google.maps.geometry.spherical.computeArea(poly.getPath());
                if (pendingParentForSubzone) {
                    // create subzone under parent but validate it fits entirely inside parent
                    const parentId = pendingParentForSubzone;
                    pendingParentForSubzone = null;
                    drawingManager.setDrawingMode(null);
                    const parent = zoneMeta.find(z=>z.id===parentId);
                    if (!parent) { poly.setMap(null); return; }
                    const parentPoly = new google.maps.Polygon({ paths: parent.polygon });
                    // ensure all vertices are inside parent polygon
                    const allInside = poly.getPath().getArray().every(v => google.maps.geometry.poly.containsLocation(v, parentPoly));
                    if (!allInside) {
                        alert('Subzone must be fully inside the parent zone. Drawing canceled.');
                        poly.setMap(null);
                        document.getElementById('status').innerText = 'Subzone drawing canceled (outside parent)';
                        return;
                    }
                    poly.setOptions({ strokeColor: '#1b5e20', fillColor: '#a5d6a7', fillOpacity: 0.35 });
                    const sid = 'sub_' + Date.now();
                    const name = prompt('Enter Subzone Name:', 'Subzone ' + (parent.subzones?parent.subzones.length+1:1)) || sid;
                    const sMeta = { id: sid, name, polygon: path, area, overlay: poly, volunteers: [] };
                    parent.subzones = parent.subzones || [];
                    parent.subzones.push(sMeta);
                    attachEditHandlersGeneric(sMeta, parent.id);
                    saveZonesToStorage();
                    renderZoneCard(parent, true);
                    updateAllZoneCards();
                    document.getElementById('status').innerText = 'Subzone added';
                } else {
                    // regular top-level zone
                    const id = 'zone_' + Date.now();
                    const name = prompt('Enter Zone Name:', 'Zone ' + (zoneMeta.length + 1)) || id;
                    const meta = { id, name, polygon: path, area, overlay: poly, subzones: [] };
                    zoneMeta.push(meta);
                    attachEditHandlersGeneric(meta, null);
                    renderZoneCard(meta, true);
                    saveZonesToStorage();
                    drawingManager.setDrawingMode(null);
                }
            }
        });

        // manual draw button etc (unchanged)
        let activePath = [];
        let tempPolyline = null;
        let drawingPolygon = false;

        const drawBtn = document.createElement('button');
        drawBtn.textContent = 'Start Manual Zone Draw';
        drawBtn.style.cssText = 'padding:8px 10px;margin-top:8px;width:100%;border:none;border-radius:6px;background:#43a047;color:white;cursor:pointer;';
        document.querySelector('.controls').appendChild(drawBtn);

        drawBtn.addEventListener('click', () => {
            drawingPolygon = !drawingPolygon;
            drawBtn.textContent = drawingPolygon ? 'Finish Drawing' : 'Start Manual Zone Draw';
            if (!drawingPolygon && activePath.length >= 3) {
                const polygon = new google.maps.Polygon({
                    paths: activePath,
                    strokeColor: '#1e88e5',
                    strokeOpacity: 0.9,
                    strokeWeight: 2,
                    fillColor: '#1e88e5',
                    fillOpacity: 0.25,
                    editable: true,
                    map: map,
                });
                const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
                const id = 'zone_' + Date.now();
                const name = prompt('Enter Zone Name:', 'Zone ' + (zoneMeta.length + 1)) || id;
                const polygonCoords = activePath.map(p => ({ lat: p.lat(), lng: p.lng() }));
                const meta = { id, name, polygon: polygonCoords, area, overlay: polygon, subzones: [] };
                zoneMeta.push(meta);
                attachEditHandlersGeneric(meta, null);
                renderZoneCard(meta, true);
                saveZonesToStorage();
            }
            if (!drawingPolygon) {
                if (tempPolyline) { tempPolyline.setMap(null); tempPolyline = null; }
                activePath = [];
            }
        });

        map.addListener('click', (e) => {
            if (!drawingPolygon) return;
            const latlng = e.latLng;
            activePath.push(latlng);
            if (tempPolyline) tempPolyline.setPath(activePath);
            else {
                tempPolyline = new google.maps.Polyline({
                    map,
                    path: activePath,
                    strokeColor: '#1e88e5',
                    strokeWeight: 2,
                });
            }
        });
    }

    function setupSimButtons() {
        document.getElementById('spawn-sim').onclick = () => {
            const count = parseInt(document.getElementById('sim-count').value, 10) || 0;
            spawnSimulatedPeople(count);
        };

        const estimateBtn = document.createElement('button');
        estimateBtn.textContent = 'Estimate for 25,000 sample audience';
        estimateBtn.style.cssText = 'padding:8px 10px;margin-top:8px;width:100%;border:none;border-radius:6px;background:#ff7043;color:white;cursor:pointer;';
        document.querySelector('.controls').appendChild(estimateBtn);
        estimateBtn.onclick = () => estimateCrowd(25000);
    }

    function randomPointInPolygonPaths(paths, maxTries = 500) {
        if (!paths || paths.length === 0) return null;
        let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
        paths.forEach(p => {
            minLat = Math.min(minLat, p.lat);
            minLng = Math.min(minLng, p.lng);
            maxLat = Math.max(maxLat, p.lat);
            maxLng = Math.max(maxLng, p.lng);
        });
        for (let i = 0; i < maxTries; i++) {
            const lat = minLat + Math.random() * (maxLat - minLat);
            const lng = minLng + Math.random() * (maxLng - minLng);
            const point = new google.maps.LatLng(lat, lng);
            const poly = new google.maps.Polygon({ paths });
            if (google.maps.geometry.poly.containsLocation(point, poly)) return point;
        }
        return null;
    }

    function chooseZoneWeighted() {
        if (!zoneMeta || zoneMeta.length === 0) return null;
        // compute weights by area (fallback to 1)
        const weights = zoneMeta.map(z => (z.area || 1));
        const total = weights.reduce((a,b)=>a+b,0);
        let r = Math.random() * total;
        for (let i = 0; i < zoneMeta.length; i++) {
            r -= weights[i];
            if (r <= 0) return zoneMeta[i];
        }
        return zoneMeta[zoneMeta.length - 1];
    }

    function randomPointInsideAnyZone() {
        // pick zone weighted by area then attempt random point inside it
        const zone = chooseZoneWeighted();
        if (!zone) return null;
        const pt = randomPointInPolygonPaths(zone.polygon, 500);
        if (pt) return pt;
        // fallback: try other zones
        for (let z of zoneMeta) {
            const p = randomPointInPolygonPaths(z.polygon, 200);
            if (p) return p;
        }
        return null;
    }

    function spawnSimulatedPeople(n) {
        if (!zoneMeta || zoneMeta.length === 0) {
            alert('Define at least one zone before spawning simulated people.');
            return;
        }
        const baseIndex = Object.keys(sims).length;
        for (let i = 0; i < n; i++) {
            const pos = randomPointInsideAnyZone();
            if (!pos) {
                console.warn('Could not find point inside zones for spawn; stopping.');
                break;
            }
            const marker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#ff9800', fillOpacity: 1, strokeWeight: 0 },
            });
            const id = 'sim-' + (baseIndex + i);
            sims[id] = { id, marker };
            trackSim(id);
        }
    }

    function randomNearbyPoint(center, radiusDeg) {
        const lat = (typeof center.lat === 'function') ? center.lat() : center.lat;
        const lng = (typeof center.lng === 'function') ? center.lng() : center.lng;
        return new google.maps.LatLng(
            lat + (Math.random() - 0.5) * radiusDeg,
            lng + (Math.random() - 0.5) * radiusDeg
        );
    }

    function trackSim(id) {
        setInterval(() => {
            const sim = sims[id];
            if (!sim || !sim.marker) return;
            const pos = randomNearbyPoint(sim.marker.getPosition(), 0.0005);
            sim.marker.setPosition(pos);
            checkUserInZone(id, { lat: pos.lat(), lng: pos.lng() });
        }, 2500);
    }

    function checkUserInZone(id, pos) {
        let inside = null;
        zoneMeta.forEach(z => {
            const poly = new google.maps.Polygon({ paths: z.polygon });
            if (google.maps.geometry.poly.containsLocation(new google.maps.LatLng(pos.lat, pos.lng), poly)) inside = z.id;
        });

        const prevZone = userZoneMap[id];
        if (prevZone !== inside) {
            if (prevZone && zonePeopleCount[prevZone]) zonePeopleCount[prevZone]--;
            if (inside) zonePeopleCount[inside] = (zonePeopleCount[inside] || 0) + 1;
            userZoneMap[id] = inside;
            broadcastPost({ type: 'counts-updated', counts: zonePeopleCount });
            updateAllZoneCards();
        }
    }

    /* Location UI unchanged */
    let myLocationMarker = null;
    let accuracyCircle = null;
    let locationWatchId = null;
    let useLiveLocation = false;
    const LIVE_USER_ID = 'live-user';

    function setupLocationUI() {
        document.getElementById('toggle-satellite').onclick = () => {
            const btn = document.getElementById('toggle-satellite');
            const isSatellite = map.getMapTypeId() === 'satellite';
            map.setMapTypeId(isSatellite ? 'roadmap' : 'satellite');
            btn.textContent = isSatellite ? 'Satellite View' : 'Roadmap View';
        };

        document.getElementById('locate-me').onclick = () => {
            if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
            navigator.geolocation.getCurrentPosition(pos => {
                const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                updateMyLocationMarker(p, pos.coords.accuracy);

                const DESIRED_ZOOM = 21;
                try {
                    map.setOptions({ maxZoom: DESIRED_ZOOM });
                } catch (e) { /* ignore */ }

                let declaredMax = null;
                try {
                    const mapType = map.mapTypes && map.mapTypes.get(map.getMapTypeId());
                    declaredMax = mapType && mapType.maxZoom;
                } catch (e) { /* ignore */ }

                const targetZoom = declaredMax ? Math.min(DESIRED_ZOOM, declaredMax) : DESIRED_ZOOM;

                map.panTo(p);
                setTimeout(() => {
                    map.setZoom(targetZoom);
                    if (targetZoom < DESIRED_ZOOM) {
                        try {
                            map.setMapTypeId('satellite');
                            map.setOptions({ maxZoom: DESIRED_ZOOM });
                            setTimeout(() => map.setZoom(DESIRED_ZOOM), 150);
                        } catch (e) { /* ignore */ }
                    }
                }, 100);
            }, err => {
                alert('Unable to retrieve location: ' + (err.message || err.code));
                console.error(err);
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
        };

        document.getElementById('use-live-count').addEventListener('change', (e) => {
            useLiveLocation = !!e.target.checked;
            if (useLiveLocation) startWatchingLocation();
            else stopWatchingLocationAndRemoveLiveUser();
        });
    }

    function updateMyLocationMarker(latlng, accuracy) {
        const p = new google.maps.LatLng(latlng.lat, latlng.lng);
        if (!myLocationMarker) {
            myLocationMarker = new google.maps.Marker({
                position: p,
                map: map,
                title: 'You',
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#2196f3', fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 }
            });
        } else {
            myLocationMarker.setPosition(p);
        }
        if (!accuracyCircle) {
            accuracyCircle = new google.maps.Circle({
                strokeColor: '#90caf9',
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: '#90caf9',
                fillOpacity: 0.15,
                map: map,
                center: p,
                radius: Math.max(accuracy || 5, 3)
            });
        } else {
            accuracyCircle.setCenter(p);
            accuracyCircle.setRadius(Math.max(accuracy || 5, 3));
        }

        if (useLiveLocation) {
            checkUserInZone(LIVE_USER_ID, { lat: latlng.lat, lng: latlng.lng });
        }
    }

    function startWatchingLocation() {
        if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
        if (locationWatchId) return;
        // tighter options for better accuracy
        locationWatchId = navigator.geolocation.watchPosition(pos => {
            const coords = pos.coords;
            const p = { lat: coords.latitude, lng: coords.longitude };
            updateMyLocationMarker(p, coords.accuracy);
            if (useLiveLocation) {
                checkUserInZone(LIVE_USER_ID, { lat: p.lat, lng: p.lng });
            }
            document.getElementById('status').innerText = 'Location updated at ' + new Date().toLocaleTimeString();
        }, err => {
            console.error('watchPosition error', err);
            document.getElementById('status').innerText = 'Location error: ' + (err.message || err.code);
        }, { enableHighAccuracy: true, maximumAge: 500, timeout: 20000 });
    }

    function stopWatchingLocationAndRemoveLiveUser() {
        if (locationWatchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
        if (myLocationMarker) { myLocationMarker.setMap(null); myLocationMarker = null; }
        if (accuracyCircle) { accuracyCircle.setMap(null); accuracyCircle = null; }

        const prevZone = userZoneMap[LIVE_USER_ID];
        if (prevZone && zonePeopleCount[prevZone]) {
            zonePeopleCount[prevZone]--;
            delete userZoneMap[LIVE_USER_ID];
            broadcastPost({ type: 'counts-updated', counts: zonePeopleCount });
            updateAllZoneCards();
        }
    }

    /* Estimate unchanged except it preserves subzones in saved structure */
    async function estimateCrowd(totalSample = 25000) {
        if (zoneMeta.length === 0) { alert('No zones defined'); return; }
        document.getElementById('status').innerText = 'Estimating distribution for ' + totalSample + ' sample audience...';

        const counts = {};
        zoneMeta.forEach(z => counts[z.id] = 0);

        const bounds = map.getBounds();
        if (!bounds) { alert('Map bounds not ready'); return; }
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();

        const batch = 2000;
        let processed = 0;
        const heatPoints = [];
        while (processed < totalSample) {
            const take = Math.min(batch, totalSample - processed);
            for (let i = 0; i < take; i++) {
                const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
                const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
                const point = new google.maps.LatLng(lat, lng);
                for (let z of zoneMeta) {
                    const poly = new google.maps.Polygon({ paths: z.polygon });
                    if (google.maps.geometry.poly.containsLocation(point, poly)) {
                        counts[z.id] = (counts[z.id] || 0) + 1;
                        heatPoints.push(point);
                        break;
                    }
                }
            }
            processed += take;
            await new Promise(r => setTimeout(r, 10));
        }

        const sampleTotalInside = Object.values(counts).reduce((a,b)=>a+b,0);
        if (sampleTotalInside === 0) { alert('No sampled points fell into zones — try zooming in'); document.getElementById('status').innerText = 'Ready'; return; }

        const estimatedCounts = {};
        for (let z of zoneMeta) {
            const sampleCount = counts[z.id] || 0;
            estimatedCounts[z.id] = Math.round((sampleCount / sampleTotalInside) * totalSample);
        }
        zonePeopleCount = estimatedCounts;
        updateAllZoneCards();
        broadcastPost({ type: 'counts-updated', counts: zonePeopleCount });

        if (google.maps.visualization && heatPoints.length) {
            if (heatmapLayer) heatmapLayer.setMap(null);
            heatmapLayer = new google.maps.visualization.HeatmapLayer({
                data: heatPoints,
                map: map,
                radius: 20,
                opacity: 0.6
            });
        } else {
            if (heatmapLayer) { heatmapLayer.setMap(null); heatmapLayer = null; }
        }

        document.getElementById('status').innerText = 'Estimated distribution applied (sample=' + totalSample + ')';
    }

    /* Initialize map and UI */
    function initMap() {
        const savedZones = loadZonesFromStorage();

        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 13.6288, lng: 79.4192 },
            zoom: 19,
            mapTypeId: 'roadmap',
            mapTypeControl: false,
            maxZoom: 23
        });

        initBroadcast();
        setupDrawingTools();
        renderZonesFromStorage();
        setupSimButtons();
        setupLocationUI();

        // Enable live tracking by default
        const liveCheckbox = document.getElementById('use-live-count');
        if (liveCheckbox) {
            liveCheckbox.checked = true;
            useLiveLocation = true;
            startWatchingLocation();
        }

        document.getElementById('status').innerText = 'Ready';
    }

    window.initMap = initMap;

    // Per-zone heat overlays (unchanged)
    const zoneHeatOverlays = {};
    function updateZoneHeatOverlays() {
        if (!map || !google || !google.maps) return;
        const keep = new Set();

        zoneMeta.forEach(z => {
            keep.add(z.id);
            const count = zonePeopleCount[z.id] || 0;
            const area = z.area || 1;
            const density = count / (area / 100);
            const color = getRiskColor(density);
            const opacity = Math.max(0.12, Math.min(0.7, (density / RISK_DENSITY_MAX) * 0.7));

            if (zoneHeatOverlays[z.id]) {
                zoneHeatOverlays[z.id].setOptions({
                    paths: z.polygon,
                    fillColor: color,
                    fillOpacity: opacity,
                    strokeOpacity: 0
                });
                zoneHeatOverlays[z.id].setMap(map);
            } else {
                zoneHeatOverlays[z.id] = new google.maps.Polygon({
                    paths: z.polygon,
                    strokeOpacity: 0,
                    fillColor: color,
                    fillOpacity: opacity,
                    clickable: false,
                    map: map,
                });
            }
        });

        Object.keys(zoneHeatOverlays).forEach(id => {
            if (!keep.has(id)) {
                const ov = zoneHeatOverlays[id];
                if (ov && ov.setMap) ov.setMap(null);
                delete zoneHeatOverlays[id];
            }
        });
    }

    // Monkey-patch to also update zone heat overlays
    (function patchUpdateAllZoneCards() {
        if (typeof updateAllZoneCards !== 'function') return;
        const _orig = updateAllZoneCards;
        updateAllZoneCards = function() {
            try { _orig(); } catch (e) { console.error(e); }
            try { updateZoneHeatOverlays(); } catch (e) { console.error(e); }
        };
    })();

    // Toggle heat UI
    (function addHeatToggleButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Toggle Zone Heat Overlay';
        btn.style.cssText = 'padding:8px 10px;margin-top:8px;width:100%;border:none;border-radius:6px;background:#8e24aa;color:white;cursor:pointer;';
        let visible = true;
        btn.onclick = () => {
            visible = !visible;
            Object.values(zoneHeatOverlays).forEach(ov => ov.setMap(visible ? map : null));
            btn.style.opacity = visible ? '1' : '0.6';
        };
        document.querySelector('.controls').appendChild(btn);
    })();
    </script>
    </body>
    </html>
  `;
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
           <iframe srcDoc={htmlContent} style={{ width: '100%', height: 'calc(100vh - 56px)', border: 'none' }} />
        </main>
      </div>
    </div>
  );
}
