/* ════════════════════════════════════════════════════════════════
   J&V Tools — Service Worker
   MR. Home Asesores Inmobiliarios
   Estrategia: Cache-first con network fallback + actualización automática
   ════════════════════════════════════════════════════════════════ */

const VERSION = 'jv-tools-v2.0.0';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_DYNAMIC = `${VERSION}-dynamic`;

// Recursos del shell de la app (siempre disponibles offline)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/db.js',
  './js/plan.js',
  './js/capacidad.js',
  './js/prestamo.js',
  './js/comision.js',
  './js/comparador.js',
  './js/historial.js',
  './js/inversion.js',
  './js/calendario.js',
  './js/pdf-ficha.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // CDNs críticos
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// ── INSTALL: precachear shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Precaching shell:', VERSION);
        return cache.addAll(STATIC_ASSETS).catch(err => {
          // Si algún CDN falla, no bloquees la instalación
          console.warn('[SW] Algunos assets no se cachearon:', err);
          return Promise.all(
            STATIC_ASSETS.map(url =>
              cache.add(url).catch(e => console.warn('[SW] Skip:', url))
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejas ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.startsWith(VERSION))
          .map(key => {
            console.log('[SW] Eliminando cache obsoleto:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first con fallback a red ──────────────────
self.addEventListener('fetch', event => {
  const { request } = event;

  // Solo GET
  if (request.method !== 'GET') return;

  // Evita interceptar la API de tasa de cambio (siempre red)
  if (request.url.includes('infodolar.com.do') ||
      request.url.includes('allorigins.win') ||
      request.url.includes('corsproxy.io')) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ error: 'sin-conexion' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Refresca en background (stale-while-revalidate)
        fetch(request).then(fresh => {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE_DYNAMIC).then(c => c.put(request, fresh.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      // No estaba en cache → buscar en red y cachear
      return fetch(request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => {
          // Fallback offline para HTML
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ── MENSAJES desde la app (forzar update) ──────────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
