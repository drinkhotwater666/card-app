const CACHE = "card-app-20260526-2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./cards-manifest.json",
];

const canHandle = (req) =>
  req.url.startsWith("http://") || req.url.startsWith("https://");

function shouldUseNetworkFirst(req) {
  if (req.mode === "navigate") return true;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return false;
  return [
    "/index.html",
    "/manifest.json",
    "/cards-manifest.json",
    "/",
  ].includes(url.pathname);
}

async function putInCache(req, res) {
  if (!canHandle(req) || !res || !res.ok) return;
  const cache = await caches.open(CACHE);
  await cache.put(req, res.clone());
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: "no-store" });
    await putInCache(req, res);
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") {
      return (await cache.match("./index.html")) || Response.error();
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then(async (res) => {
      await putInCache(req, res);
      return res;
    })
    .catch(() => null);
  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }
  return networkPromise.then((res) => res || Response.error());
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(
          ASSETS.map((url) => new Request(url, { cache: "reload" })),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (!canHandle(req) || req.method !== "GET") return;

  if (shouldUseNetworkFirst(req)) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  event.respondWith(networkFirst(req));
});
