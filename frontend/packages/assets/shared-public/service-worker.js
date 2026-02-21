// const API_CACHE = "funstakes-api-v2";
const STATIC_CACHE = "funstakes-static-v4";

const ESSENTIAL_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/about",
  "/pricing",
  "/support",
];

// 1. Install: Pre-cache with error resilience
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // We use map + add to ensure one missing page doesn't break everything
      return Promise.allSettled(
        ESSENTIAL_ASSETS.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn(`Failed to pre-cache: ${url}`)),
        ),
      );
    }),
  );
  self.skipWaiting();
});

// 2. Activate: Clean up old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// 3. Fetch: The Traffic Controller
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignore non-GET and API calls
  if (request.method !== "GET" || url.pathname.startsWith("/api")) return;

  // 2. STRATEGY: Network-First for Navigations (Pages)
  // This ensures marketing pages stay fresh but work offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);

          // 1. Check for the specific page
          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;

          // 2. Fallback to /offline
          const offlineShell = await cache.match("/offline");
          return offlineShell || cache.match("/");
        }),
    );
    return;
  }

  // 3. STRATEGY: Cache-First for Assets
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/images") ||
    url.pathname.includes("turbopack") ||
    /\.(js|css|png|jpg|svg|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

/* ---------- STRATEGIES ---------- */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.status === 200) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    // Fail-safe for Next.js JS chunks to prevent ChunkLoadError
    if (request.url.endsWith(".js")) {
      return new Response(
        "console.warn('Chunk missing. Redirecting to offline...')",
        { headers: { "Content-Type": "application/javascript" } },
      );
    }
    return new Response(null, { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ offline: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
