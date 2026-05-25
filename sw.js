const CACHE = 'card-app-20260525111213';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './cards-manifest.json',
];

const canHandle = req => req.url.startsWith('http://') || req.url.startsWith('https://');
const isCacheable = (req, res) => canHandle(req) && res && res.ok;

function cacheResponse(req, res) {
  if (!isCacheable(req, res)) return;
  const clone = res.clone();
  caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const isImage = req.destination === 'image';

  if (isImage) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
