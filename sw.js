// Service Worker — Affittacamere Ancona Centro · Guida Ospiti V5.1
// Ottimizzato per GitHub Pages con immagini locali in /img

let CACHE_NAME = 'ancona-guida-v5.1-1400';
let TILES_CACHE_NAME = CACHE_NAME + '-tiles';
const MAX_TILES = 200;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './img/home.jpg',
    './img/host.jpg',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/fontana-calamo.jpg',
    './img/teatro-muse.jpg',
    './img/loggia-mercanti.jpg',
    './img/santa-maria-piazza.jpg',
    './img/arco-traiano.jpg',
    './img/arco-clementino.jpg',
    './img/lanterna-rossa.jpg',
    './img/porto-romano.jpg',
    './img/palazzo-anziani.jpg',
    './img/museo-archeologico.jpg',
    './img/duomo-san-ciriaco.jpg',
    './img/anfiteatro-romano.jpg',
    './img/piazza-plebiscito.jpg',
    './img/passetto.jpg',
    './img/cittadella.jpg',
    './img/mole-vanvitelliana.jpg',
    './img/portonovo.jpg',
    './img/sirolo.jpg',
    './img/offagna.jpg',
    './img/loreto.jpg',
    './img/recanati.jpg',
    './img/mercato-erbe.jpg',
    './img/parcheggio-archi.jpg',
    './img/rist-cantineta.jpg',
    './img/rist-pozzo.jpg',
    './img/rist-moretta.jpg',
    './img/degosteria.jpg',
    './img/rist-miscia.jpg',
    './img/rist-amelie.jpg',
    './img/rist-giardino.jpg',
    './img/rist-marcello.jpg',
    './img/rist-domus.jpg',
    './img/rist-filotea.jpg',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

function offlineFallback() {
    return new Response(
        '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F3F0EA;color:#1A2332;text-align:center;padding:20px}.card{background:#fff;border-radius:16px;padding:32px;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,.1)}h1{color:#0B1F33;font-size:1.4rem;margin-bottom:8px}p{font-size:.9rem;color:#6B7280;line-height:1.5}</style></head><body><div class="card"><h1>📡 Offline</h1><p>Non è disponibile una connessione internet.<br>Riprova quando sei di nuovo connesso.</p></div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}

async function trimTilesCache() {
    const cache = await caches.open(TILES_CACHE_NAME);
    const keys = await cache.keys();
    if (keys.length > MAX_TILES) {
        const toDelete = keys.slice(0, keys.length - MAX_TILES);
        for (const req of toDelete) {
            await cache.delete(req);
        }
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                    console.warn('⚠️ Alcuni assets non cachati:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== TILES_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;

    if (url.hostname.includes('google-analytics.com') ||
        url.hostname.includes('facebook.com/tr')) return;

    if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname === './') {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request).then(cached => cached || offlineFallback());
            })
        );
        return;
    }

    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                }).catch(() => cached);
                return cached || fetchPromise;
            })
        );
        return;
    }

    if (url.pathname.startsWith('/img/') || url.pathname.startsWith('./img/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                }).catch(() => new Response('', { status: 404 }));
            })
        );
        return;
    }

    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(TILES_CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                        trimTilesCache();
                    });
                    return response;
                }).catch(() => new Response('', { status: 404 }));
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, responseClone); });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cached => cached || offlineFallback());
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
        return;
    }
    if (event.data && event.data.type === 'SET_CACHE_NAME' && event.data.cacheName) {
        CACHE_NAME = event.data.cacheName;
        TILES_CACHE_NAME = CACHE_NAME + '-tiles';
    }
});
