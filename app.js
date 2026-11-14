// Fahrzeugakte – V0 "Hallo Jeep"
// Diese Datei zeigt nur an, ob die App online ist und ob der
// Offline-Modus (Service Worker) läuft. Mehr passiert hier noch nicht.

// 1) Online / Offline anzeigen
function zeigeVerbindung() {
  document.getElementById('online-status').textContent =
    navigator.onLine ? 'online' : 'offline';
}
window.addEventListener('online', zeigeVerbindung);
window.addEventListener('offline', zeigeVerbindung);
zeigeVerbindung();

// 2) Service Worker registrieren – er speichert die App-Dateien,
//    damit die App auch ohne Internet startet.
const swStatus = document.getElementById('sw-status');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => { swStatus.textContent = 'bereit ✔'; })
    .catch((fehler) => {
      swStatus.textContent = 'Fehler';
      console.error('Service Worker konnte nicht starten:', fehler);
    });
} else {
  swStatus.textContent = 'vom Browser nicht unterstützt';
}

// 3) "App installieren"-Knopf (nur Chrome/Android bietet das an;
//    auf dem iPad geht es über Teilen → "Zum Home-Bildschirm").
let installAngebot = null;
const installKnopf = document.getElementById('installieren');

window.addEventListener('beforeinstallprompt', (ereignis) => {
  ereignis.preventDefault();
  installAngebot = ereignis;
  installKnopf.hidden = false;
});

installKnopf.addEventListener('click', async () => {
  if (!installAngebot) return;
  installAngebot.prompt();
  await installAngebot.userChoice;
  installAngebot = null;
  installKnopf.hidden = true;
});

window.addEventListener('appinstalled', () => { installKnopf.hidden = true; });
