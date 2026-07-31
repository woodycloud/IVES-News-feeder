/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = "ives-news-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache-First for static assets, Network-First with fallback for API requests
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // For API endpoints, we do a Network-First strategy
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful, clone and put in a special api cache
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback from cache
          console.log("[Service Worker] API offline fallback for:", requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // If completely unavailable, return JSON error
            return new Response(
              JSON.stringify({ error: "You are offline and this request is not cached." }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  } else {
    // For static assets, we do Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch new version in background to update cache
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Ignore network errors in background
            });
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
