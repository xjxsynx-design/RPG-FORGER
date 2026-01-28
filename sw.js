// Auto-updating Service Worker (network-first) for RPG FORGER
// Bump CACHE_VERSION on each deploy to force fresh loads.
const CACHE_VERSION = "2026-01-27-build1";
const CACHE_NAME = `rpg-forger-cache-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  // Activate updated SW as soon as it's installed
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Delete old caches
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Allow pages to trigger immediate activation
self.addEventListener("message", (event) => {
  if (event?.data === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request) {
  try {
    // cache:'no-store' helps ensure we bypass HTTP cache where possible
    const response = await fetch(request, { cache: "no-store" });
    // Cache successful same-origin GET responses
    if (response && response.ok && request.method === "GET" && new URL(request.url).origin === self.location.origin) {
      const copy = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, copy);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigations, fall back to root index to avoid blank screens
    if (request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Only handle same-origin requests; let CDNs/other origins pass through
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(req));
});
