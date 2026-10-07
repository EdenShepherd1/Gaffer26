/* Gaffer 26 service worker: keeps the game and its fonts on the device so it plays offline.
   The version below changes with every build, so a new version replaces the old one. */
const V = 'g26-20261007155621', FONTS = 'g26-fonts';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === 'navigate') {
      /* online: take the newest page and keep a copy. offline: use the copy */
      e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; }).catch(() => caches.match('index.html')));
      return;
    }
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(FONTS).then(c => c.match(r).then(hit => {
      const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
