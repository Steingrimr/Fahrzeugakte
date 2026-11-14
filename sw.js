// Service Worker – sorgt dafür, dass die App offline startet.
//
// Strategie "Netz zuerst": Mit Internet holt die App immer die neueste
// Fassung (und legt sie als Kopie ab). Ohne Internet nimmt sie die Kopie.
//
// Bei Änderungen an den App-Dateien die Versionsnummer erhöhen,
// damit alte Kopien aufgeräumt werden.
const CACHE_NAME = 'fahrzeugakte-v0.4.0';

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

// Beim Installieren: alle App-Dateien als Kopie ablegen
self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_DATEIEN))
  );
  self.skipWaiting();
});

// Beim Aktivieren: alte Versionen der Kopien löschen
self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Bei jeder Anfrage: erst aus dem Netz holen, bei Fehler die Kopie nehmen
self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== location.origin) return;

  ereignis.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(() =>
        caches.match(anfrage, { ignoreSearch: true })
          // Seitenaufruf ohne passende Kopie: Startseite zeigen
          .then((treffer) => treffer || (anfrage.mode === 'navigate' ? caches.match('./') : undefined))
      )
  );
});
