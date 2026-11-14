// Service Worker – sorgt dafür, dass die App offline startet.
// WICHTIG: Bei jeder Änderung an den App-Dateien die Versionsnummer
// erhöhen, damit Handy und Browser die neue Version laden.
const CACHE_NAME = 'fahrzeugakte-v0.2.0';

const APP_DATEIEN = [
  './',
  'index.html',
  'style.css',
  'db.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/apple-touch-icon.png'
];

// Beim Installieren: alle App-Dateien zwischenspeichern
self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_DATEIEN))
  );
  self.skipWaiting();
});

// Beim Aktivieren: alte Versionen aus dem Zwischenspeicher löschen
self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Bei jeder Anfrage: erst im Zwischenspeicher schauen, sonst aus dem Netz holen
self.addEventListener('fetch', (ereignis) => {
  if (ereignis.request.method !== 'GET') return;
  ereignis.respondWith(
    caches.match(ereignis.request).then((treffer) => treffer || fetch(ereignis.request))
  );
});
