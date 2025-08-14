// Custom service worker for PWA app lifecycle management
const CACHE_NAME = 'chitchat-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll([
          '/',
          '/offline.html',
          '/manifest.json'
        ]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'PWA_APP_CLOSE') {
    console.log('PWA app close detected in service worker');
    // Broadcast to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PWA_APP_CLOSE',
          timestamp: event.data.timestamp
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'PWA_APP_BACKGROUND') {
    console.log('PWA app background detected in service worker');
    // Broadcast to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PWA_APP_BACKGROUND',
          timestamp: event.data.timestamp
        });
      });
    });
  }
});

// Handle fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Handle PWA app lifecycle events
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('PWA install prompt available');
});

// Handle app close events (when PWA is closed)
self.addEventListener('appinstalled', (event) => {
  console.log('PWA app installed');
});

// Handle background sync (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);
  });
}

// Handle push notifications (if supported)
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/chitchat-icon-192.png',
      badge: '/chitchat-icon-72.png',
      tag: 'chitchat-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification('ChitChat', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        // Focus existing client
        clients[0].focus();
      } else {
        // Open new client
        return self.clients.openWindow('/');
      }
    })
  );
});

