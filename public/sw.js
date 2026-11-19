/**
 * TimeDrift Service Worker (FE-8 / URD §3.6.2)
 * Cache Name: timedrift-shell-v1
 * Scope: Precaches essential app shell, fonts, and offline fallback.
 * Strategy: Network-first with cache fallback for HTML navigations.
 */

const CACHE_NAME = 'timedrift-shell-v1';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/scene-host.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Exclude non-GET requests and Next.js HMR
  if (req.method !== 'GET' || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Handle navigation requests (Network-first with Cache fallback)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response(
            '<!DOCTYPE html><html><body style="background:#F4EFE6;font-family:serif;text-align:center;padding:50px;color:#2B2A28;"><h1>TimeDrift</h1><p>You are resting offline. Reconnect to explore new melodies.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Handle static assets & media
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((networkRes) => {
        // Cache successful static responses
        if (networkRes.ok && (url.pathname.startsWith('/icons/') || url.pathname.endsWith('.html'))) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      });
    })
  );
});
