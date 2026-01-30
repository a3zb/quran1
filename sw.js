const CACHE_NAME = 'quran-library-v2';
const MEDIA_CACHE = 'quran-media-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.js',
  '/tafsir_logic.js',
  '/adhkar_advanced.js',
  '/hadiths_logic.js',
  '/prayer_logic.js',
  '/score_engine.js',
  '/ai_companion.js',
  '/adkar.json',
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

// Fetch Event: Cache-First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it immediately
      if (cachedResponse) return cachedResponse;

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Validation check
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !event.request.url.includes('http')) {
          return networkResponse;
        }

        const isMedia = event.request.url.includes('.mp3') || event.request.url.includes('.mp4');
        const isDataApi = event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('.json');
        const responseToCache = networkResponse.clone();

        if (isMedia) {
          caches.open(MEDIA_CACHE).then(cache => cache.put(event.request, responseToCache));
        } else if (isDataApi || event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      }).catch(err => {
        // If both fail, we can return an offline page here if we had one
        console.error("Fetch failed", err);
      });
    })
  );
});

// Handle messages from the main thread
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
  } else if (event.data.action === 'show-notification') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Open the app or focus the existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
