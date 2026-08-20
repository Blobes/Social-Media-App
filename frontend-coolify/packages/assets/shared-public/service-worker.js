const STATIC_CACHE = "funstakes-static-v1";

const ESSENTIAL_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/about",
  "/pricing",
  "/support",
];

/**
 * Handles service worker installation and pre-caches static core shell assets.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        ESSENTIAL_ASSETS.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn(`Failed to pre-cache: ${url}`, err)),
        ),
      );
    }),
  );
});

/**
 * Handles service worker activation and removes stale static cache versions.
 */
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

/**
 * Intercepts network requests and routes traffic using network or cache strategies.
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Allow Next.js internal RSC requests to pass directly through to network natively
  if (url.searchParams.has("_rsc")) return;

  // Ignore non-GET requests, local /api routes, and all external API host requests (e.g., api.funstakes.net)
  const isBackendApi =
    url.hostname.includes("api.funstakes.net") ||
    url.hostname !== self.location.hostname;

  if (request.method !== "GET" || isBackendApi) {
    return;
  }

  // Network-First strategy for page navigations
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

          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;

          const offlineShell = await cache.match("/offline");
          return offlineShell || cache.match("/");
        }),
    );
    return;
  }

  // Cache-First strategy for static assets
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.includes("-assets/") ||
    url.pathname.startsWith("/images") ||
    url.pathname.includes("turbopack") ||
    /\.(js|css|png|jpg|svg|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

/**
 * Handles persistent background upload task completion.
 */
self.addEventListener("backgroundfetchsuccess", (event) => {
  const bgFetch = event.registration;

  event.waitUntil(
    (async () => {
      console.log(
        `Background upload task successfully complete: ${bgFetch.id}`,
      );

      const records = await bgFetch.matchAll();
      for (const record of records) {
        const response = await record.responseReady;
        if (!response.ok) {
          console.error(
            `Background upload validation failure for task: ${bgFetch.id}`,
          );
        }
      }

      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({
          type: "BACKGROUND_UPLOAD_COMPLETE",
          id: bgFetch.id,
        });
      }

      await event.updateUI({
        title: "Media uploaded successfully to Funstakes!",
      });
    })(),
  );
});

/**
 * Handles persistent background upload failures or network drops.
 */
self.addEventListener("backgroundfetchfail", (event) => {
  const bgFetch = event.registration;
  console.error(
    `Background upload sync failed or aborted for task: ${bgFetch.id}`,
  );

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({
          type: "BACKGROUND_UPLOAD_FAILED",
          id: bgFetch.id,
        });
      }

      await event.updateUI({
        title: "Upload failed. We will retry once connection re-establishes.",
      });
    })(),
  );
});

/**
 * Handles interactions when clicking on a background fetch notification UI.
 */
self.addEventListener("backgroundfetchclick", (event) => {
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window" });

      if (clientsList.length > 0) {
        await clientsList[0].focus();
      } else {
        await self.clients.openWindow("/");
      }
    })(),
  );
});

/* ---------- STRATEGIES ---------- */

/**
 * Serves cached assets first, falling back to network fetch.
 */
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
    return new Response(null, {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Fetches from network first, falling back to cached response.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(null, {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}
