/**
 * Ray Service Worker
 * Secure, privacy-preserving Progressive Web App Service Worker.
 *
 * CRITICAL PRIVACY & SECURITY RULES:
 * 1. NEVER cache private API responses (/api/*).
 * 2. NEVER cache authentication tokens or credentials.
 * 3. NEVER cache dynamic messages or private media in public SW cache.
 * 4. Only cache app shell, static assets, and offline fallback.
 */

const CACHE_NAME = 'ray-sanctuary-shell-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png',
];

// Install: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Completely bypass caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. NEVER cache API requests, Socket.IO, auth endpoints, or uploads
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/uploads/') ||
    url.searchParams.has('socket')
  ) {
    return; // Pass through to network directly
  }

  // 3. Navigation requests (HTML pages): Network-first with /offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedOffline = await cache.match(OFFLINE_URL);
          if (cachedOffline) {
            return cachedOffline;
          }
          return new Response(
            '<html><body style="background:#050505;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;"><h2>Ray</h2><p>You are currently offline. Please reconnect to access your private sanctuary.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 4. Static assets (_next/static, icons, fonts): Cache-first or Stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {
            // Ignore background revalidation failure
          });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
  }
});

// Listen for message from client to activate immediately upon update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
