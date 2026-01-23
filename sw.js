const CACHE_NAME = 'quran-library-v2';
const MEDIA_CACHE = 'quran-media-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.js',
  '/favicon.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it
      if (cachedResponse) return cachedResponse;

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Only cache regular assets automatically, not large media
        const isMedia = event.request.url.includes('.mp3') || event.request.url.includes('.mp4');

        if (!isMedia && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      });
    })
  );
});

// Handle messages from the main thread for explicit caching (download)
self.addEventListener('message', (event) => {
  if (event.data.action === 'download') {
    const url = event.data.url;
    event.waitUntil(
      caches.open(MEDIA_CACHE).then((cache) => {
        return fetch(url).then((response) => {
          if (response.ok) {
            cache.put(url, response);
            // Notify UI that download is complete
            self.clients.matchAll().then(clients => {
              clients.forEach(client => client.postMessage({ action: 'download-complete', url: url }));
            });
          }
        });
      })
    );
  }
});
