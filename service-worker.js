const VERSION = "v1.5.1";  // ⬅️ INCREMENT THIS WHEN YOU MAKE CHANGES!

const CACHE_NAME = `es-cafe-${VERSION}`;

const STATIC_ASSETS = [
  "/templates/index.html",
  "/templates/menu.html",
  "/templates/orders.html",
  "/templates/thanks.html",
  "/templates/about.html",
  "/templates/contact.html",
  "/static/style.css",
  "/static/menu.js",
  "/static/orders.js",
  "/static/thanks.js",
  "/static/images/icons/logo-192.png",
  "/static/images/icons/logo-512.png",
  "/static/images/logo.png",
  "/static/images/hero.jpg",
  "/static/images/menu-banner.jpg",
  "/static/images/eggs.jpg",
  "/static/menu-offline.json",
  "/static/images/Flatewhite.jpg",
  "/static/images/Latte(1).jpg",
  "/static/images/icedlate.jpg",
  "/static/images/mocha.jpg",
  "/static/images/San_Chai_Latte-min.jpg",
  "/static/images/Ham-and-Cheese-Croissant-featured.jpg",
  "/static/images/bananabread.jpg",
  "/static/images/Easy-Blueberry-Muffin-Recipe-1-1200.jpg",
  "/static/images/hamandcheesetoastite.jpeg",
  "/static/images/panckatestack.jpg",
  "/static/images/bigbreakfast.jpg",
  "/static/images/parmi.jpg",
  "/static/images/avocadotoast.png",
  "/static/images/beansontoast.jpg",
  "/static/images/hotcooc.webp"
];

// Install event: pre-cache all static assets
self.addEventListener("install", event => {
  console.log(`[Service Worker] Installing ${CACHE_NAME}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log(`[Service Worker] Caching ${STATIC_ASSETS.length} files`);
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event: DELETE old caches with different versions
self.addEventListener("activate", event => {
  console.log(`[Service Worker] Activating ${CACHE_NAME}`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any cache that doesn't match the current version
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: use cache first, then network
self.addEventListener("fetch", event => {
  const requestUrl = event.request.url;

  // Never cache backend API calls to Flask
  if (requestUrl.startsWith("http://127.0.0.1:5050")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If we have a cached response, return it; otherwise go to the network
      return cachedResponse || fetch(event.request).then(response => {
        // Cache new responses for future use
        if (response && response.status === 200) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback - you could return a custom offline page here
      console.log('[Service Worker] Fetch failed; returning offline page');
    })
  );
});

// Listen for messages from the client to manually skip waiting
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
