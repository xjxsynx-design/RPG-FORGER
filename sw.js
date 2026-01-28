const CACHE = 'rpg-forgeworks-v2026-01-28';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/rpg_forgeworks_logo.png",
  "./assets/landing_bg.png",
  "./manager/index.html",
  "./editor/index.html"
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k!==CACHE)?caches.delete(k):null)) ).then(()=>self.clients.claim())));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || (url.pathname.endsWith('.html'));

  if (isHTML) {
    // Network-first for HTML so updates are picked up immediately.
    event.respondWith(
      fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for other assets.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(event.request, copy)).catch(()=>{});
      return res;
    }))
  );
});
