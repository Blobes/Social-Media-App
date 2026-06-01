// const API_CACHE = "funstakes-api-v2";
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

// Install: Pre-cache with error resilience
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Map + add ensures one missing page doesn't break everything
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

// Activate: Clean up old versions
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

// Fetch: The Traffic Controller
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.searchParams.has("_rsc")) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        // Try to find the base page without the _rsc query param
        const match = await cache.match(url.pathname);
        if (match) return match;
        // If no match, return a minimal JSON response to stop Next.js from panicking
        return new Response(JSON.stringify({ offline: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    return;
  }

  // Ignore non-GET and API calls
  if (request.method !== "GET" || url.pathname.startsWith("/api")) return;

  // STRATEGY: Network-First for Navigations (Pages)
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

          // Check for the specific page
          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;

          // Fallback to /offline
          const offlineShell = await cache.match("/offline");
          return offlineShell || cache.match("/");
        }),
    );
    return;
  }

  // STRATEGY: Cache-First for Assets
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.includes("-assets/") || // Catch Micro-Frontend assets
    url.pathname.startsWith("/images") ||
    url.pathname.includes("turbopack") ||
    /\.(js|css|png|jpg|svg|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

// Background Fetch: Intercept successful persistent media transfers
self.addEventListener("backgroundfetchsuccess", (event) => {
  const bgFetch = event.registration;

  event.waitUntil(
    (async () => {
      console.log(
        `Background upload task successfully complete: ${bgFetch.id}`,
      );

      // Extract records to verify the pipeline status codes
      const records = await bgFetch.matchAll();
      for (const record of records) {
        const response = await record.responseReady;
        if (!response.ok) {
          console.error(
            `Background upload validation failure for task: ${bgFetch.id}`,
          );
        }
      }

      // Notify active frontend runtime window clients of successful upload state completion
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({
          type: "BACKGROUND_UPLOAD_COMPLETE",
          id: bgFetch.id,
        });
      }

      // Update native operating system layout UI notification badge toast
      await event.updateUI({
        title: "Media uploaded successfully to Funstakes!",
      });
    })(),
  );
});

// Background Fetch: Handle persistent media transfer failures or network drops
self.addEventListener("backgroundfetchfail", (event) => {
  const bgFetch = event.registration;
  console.error(
    `Background upload sync failed or aborted for task: ${bgFetch.id}`,
  );

  event.waitUntil(
    (async () => {
      // Notify active frontend runtime window clients of terminal execution error tracking frames
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

// Background Fetch: Handle interactions when the user clicks on the notification item
self.addEventListener("backgroundfetchclick", (event) => {
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window" });

      // Focus existing tab window if active, else create a fresh foreground interface stack viewport
      if (clientsList.length > 0) {
        await clientsList[0].focus();
      } else {
        await self.clients.openWindow("/");
      }
    })(),
  );
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
