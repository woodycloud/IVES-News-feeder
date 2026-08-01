/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = "ives-news-v2";
const ESSENTIAL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/Ives.png"
];

// Install Event - cache app shell safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[Service Worker] Caching core app shell");
      for (const asset of ESSENTIAL_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("[Service Worker] Could not pre-cache asset:", asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Network-First for API calls (/api/*)
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[Service Worker] API offline fallback for:", requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ error: "You are currently offline. Local cache used where available." }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  } else {
    // Stale-While-Revalidate for static assets & pages
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
