/* Daily Habits service worker
 *
 * Update safety (no version skew):
 *  - The page and all code (HTML, JS, CSS, manifest) are fetched NETWORK-FIRST and
 *    revalidated with the server on every load, so a new page never runs with old
 *    scripts. The cache is only the offline fallback.
 *  - Static media (icons, fonts, screenshots) is cache-first.
 *  - CACHE_VERSION only controls the precached offline copy and the "Update" prompt:
 *    bump it when you deploy so open apps offer a refresh.
 */
const CACHE_VERSION = 'v1.2.0';
const CACHE = `daily-habits-${CACHE_VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/model.js',
  './js/store.js',
  './js/db.js',
  './fonts/rubik-latin-wght-normal.woff2',
  './fonts/rubik-latin-ext-wght-normal.woff2',
  './fonts/rubik-arabic-wght-normal.woff2',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('daily-habits-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isCode = url => /\.(?:js|css|json|webmanifest|html)$/.test(url.pathname) || url.pathname.endsWith('/');

async function networkFirst(req, cacheKey) {
  const cache = await caches.open(CACHE);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    // cache: 'no-cache' revalidates with the server (cheap 304s) instead of trusting the HTTP cache.
    const fresh = await fetch(req, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (fresh && fresh.ok) cache.put(cacheKey || req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(cacheKey || req, { ignoreSearch: true });
    if (cached) return cached;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') { event.respondWith(networkFirst(req, './index.html')); return; }
  event.respondWith(isCode(url) ? networkFirst(req) : cacheFirst(req));
});
