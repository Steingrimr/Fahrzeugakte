// Fahrzeugakte – Hauptprogramm
// Aufbau dieser Datei:
//   1) Navigation zwischen den Bereichen (Start, Ereignisse, ...)
//   2) Bereich "Start": Fahrzeug anzeigen
//   3) Bereich "Fahrzeug": Formular zum Anlegen/Bearbeiten
//   4) Technik: Online-Anzeige, Offline-Modus, Installieren

// ---------------------------------------------------------
// 1) Navigation
// ---------------------------------------------------------
// Jeder Bereich ist ein <section data-bereich="..."> in index.html.
// Welcher sichtbar ist, steht hinten in der Adresse, z. B. "#ereignisse".

const BEREICH_TITEL = {
  start: 'Fahrzeugakte',
  fahrzeug: 'Fahrzeug',
  ereignisse: 'Ereignisse',
  stufen: 'Servicestufen',
  einstellungen: 'Einstellungen'
};

function zeigeBereich() {
  let ziel = location.hash.replace('#', '') || 'start';
  if (!BEREICH_TITEL[ziel]) ziel = 'start';

  // passenden Bereich einblenden, alle anderen ausblenden
  document.querySelectorAll('[data-bereich]').forEach((bereich) => {
    bereich.hidden = bereich.dataset.bereich !== ziel;
  });
  // in der Navigation den aktiven Punkt hervorheben
  document.querySelectorAll('.navigation a').forEach((link) => {
    link.classList.toggle('aktiv', link.dataset.ziel === ziel);
  });
  document.getElementById('kopf-titel').textContent = BEREICH_TITEL[ziel];
  window.scrollTo(0, 0);

  // Inhalte des Bereichs frisch laden
  if (ziel === 'start') zeigeStart();
  if (ziel === 'fahrzeug') fuelleFahrzeugFormular();
}
window.addEventListener('hashchange', zeigeBereich);

// ---------------------------------------------------------
// Welches Fahrzeug ist gerade ausgewählt?
// ---------------------------------------------------------
// Die Oberfläche zeigt vorerst nur ein Fahrzeug: das zuerst angelegte.
async function aktuellesFahrzeug() {
  const fahrzeuge = await alleHolen('fahrzeuge');
  fahrzeuge.sort((a, b) => (a.angelegtAm || '').localeCompare(b.angelegtAm || ''));
  return fahrzeuge[0] || null;
}

// Datum "2018-05-17" als "17.05.2018" anzeigen
function datumDeutsch(iso) {
  if (!iso) return '';
  const [jahr, monat, tag] = iso.split('-');
  return `${tag}.${monat}.${jahr}`;
}

// ---------------------------------------------------------
// 2) Bereich "Start"
// ---------------------------------------------------------
async function zeigeStart() {
  const fz = await aktuellesFahrzeug();
  document.getElementById('kein-fahrzeug').hidden = !!fz;
  document.getElementById('fahrzeug-karte').hidden = !fz;
  if (!fz) return;

  document.getElementById('fz-name').textContent = fz.name;
  const unterzeile = [fz.marke, fz.modell].filter(Boolean).join(' ')
    + (fz.baujahr ? ` · Baujahr ${fz.baujahr}` : '');
  document.getElementById('fz-unterzeile').textContent = unterzeile;
  document.getElementById('fz-erstzulassung').textContent = datumDeutsch(fz.erstzulassung) || '–';
  document.getElementById('fz-fin').textContent = fz.fin || '–';
  document.getElementById('fz-notizen').textContent = fz.notizen || '';
}

// ---------------------------------------------------------
// 3) Bereich "Fahrzeug" (Formular)
// ---------------------------------------------------------
const formular = document.getElementById('fahrzeug-formular');
const FELDER = ['name', 'marke', 'modell', 'baujahr', 'erstzulassung', 'fin', 'notizen'];

// Formular mit den gespeicherten Werten füllen (oder leeren)
async function fuelleFahrzeugFormular() {
  const fz = await aktuellesFahrzeug();
  document.getElementById('formular-titel').textContent =
    fz ? 'Fahrzeug bearbeiten' : 'Fahrzeug anlegen';
  for (const feld of FELDER) {
    formular.elements[feld].value = fz && fz[feld] != null ? fz[feld] : '';
  }
}

// Beim Speichern: Werte aus dem Formular holen und ablegen
formular.addEventListener('submit', async (ereignis) => {
  ereignis.preventDefault(); // Seite nicht neu laden

  const vorhanden = await aktuellesFahrzeug();
  const fz = vorhanden || { angelegtAm: new Date().toISOString() };

  for (const feld of FELDER) {
    fz[feld] = formular.elements[feld].value.trim();
  }
  fz.baujahr = fz.baujahr ? Number(fz.baujahr) : null;
  fz.fin = fz.fin.toUpperCase();

  await speichern('fahrzeuge', fz);
  location.hash = '#start';
});

// ---------------------------------------------------------
// 4) Technik
// ---------------------------------------------------------

// Online / Offline anzeigen
function zeigeVerbindung() {
  document.getElementById('online-status').textContent =
    navigator.onLine ? 'online' : 'offline';
}
window.addEventListener('online', zeigeVerbindung);
window.addEventListener('offline', zeigeVerbindung);
zeigeVerbindung();

// Service Worker registrieren – er speichert die App-Dateien,
// damit die App auch ohne Internet startet.
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

// "App installieren"-Knopf (nur Chrome/Android bietet das an;
// auf dem iPad geht es über Teilen → "Zum Home-Bildschirm").
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

// ---------------------------------------------------------
// Los geht's: passenden Bereich anzeigen
// ---------------------------------------------------------
zeigeBereich();
