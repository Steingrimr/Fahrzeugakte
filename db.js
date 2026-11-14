// db.js – der Speicher der App im Browser (IndexedDB)
//
// Stell dir die Datenbank wie einen Aktenschrank vor. Jede "Schublade"
// (auf Englisch "object store") enthält eine Art von Einträgen:
//
//   fahrzeuge       – die Fahrzeuge
//   kategorien      – Wartung, Reparatur, Umbau ... (für alle Fahrzeuge gleich)
//   servicestufen   – Ölwechsel, HU ... (je Fahrzeug)
//   ereignisse      – alles, was am Fahrzeug passiert ist, inkl. Kostenposten
//   tankungen       – das Tankbuch (je Fahrzeug)
//   einstellungen   – z. B. die Vorwarnung vor Gelb
//
// Jeder Eintrag bekommt eine eindeutige Nummer ("id"). Einträge, die zu
// einem Fahrzeug gehören, merken sich dessen id im Feld "fahrzeugId".
// So kann die App von Anfang an mehrere Fahrzeuge verwalten.

const DB_NAME = 'fahrzeugakte';
const DB_VERSION = 1; // erhöhen, wenn sich der Aufbau der Schubladen ändert

// Startwerte für Kategorien – nur beim allerersten Start angelegt,
// danach frei änderbar in der App.
const START_KATEGORIEN = [
  { name: 'Wartung',    beschreibung: 'planmäßig' },
  { name: 'Reparatur',  beschreibung: 'ungeplant: defekt oder Verschleiß' },
  { name: 'Umbau',      beschreibung: 'bewusste, fest verbaute Veränderung am Fahrzeug' },
  { name: 'Ausrüstung', beschreibung: 'lose bzw. abnehmbar, z. B. Kompressor' },
  { name: 'Prüfung',    beschreibung: 'HU/AU, Eintragungen, Gutachten' },
  { name: 'Fixkosten',  beschreibung: 'Versicherung, Steuer' },
  { name: 'Sonstiges',  beschreibung: '' }
];

// Startwerte für Einstellungen
const START_EINSTELLUNGEN = [
  { schluessel: 'vorwarnungKm', wert: 1000 },
  { schluessel: 'vorwarnungMonate', wert: 1 }
];

let dbVerbindung = null;

// Öffnet die Datenbank (und legt sie beim ersten Mal an)
function oeffneDatenbank() {
  if (dbVerbindung) return Promise.resolve(dbVerbindung);

  return new Promise((erfolg, fehler) => {
    const anfrage = indexedDB.open(DB_NAME, DB_VERSION);

    // Läuft nur, wenn die Datenbank neu ist oder DB_VERSION erhöht wurde
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result;

      db.createObjectStore('fahrzeuge', { keyPath: 'id' });
      db.createObjectStore('kategorien', { keyPath: 'id' });
      db.createObjectStore('einstellungen', { keyPath: 'schluessel' });

      // Diese Schubladen bekommen ein Register nach Fahrzeug,
      // damit man schnell "alle Ereignisse von Fahrzeug X" findet.
      for (const name of ['servicestufen', 'ereignisse', 'tankungen']) {
        const store = db.createObjectStore(name, { keyPath: 'id' });
        store.createIndex('fahrzeugId', 'fahrzeugId');
      }

      // Startwerte einfüllen
      const kategorien = anfrage.transaction.objectStore('kategorien');
      START_KATEGORIEN.forEach((k, i) =>
        kategorien.add({ id: neueId(), name: k.name, beschreibung: k.beschreibung, reihenfolge: i })
      );
      const einstellungen = anfrage.transaction.objectStore('einstellungen');
      START_EINSTELLUNGEN.forEach((e) => einstellungen.add(e));
    };

    anfrage.onsuccess = () => { dbVerbindung = anfrage.result; erfolg(dbVerbindung); };
    anfrage.onerror = () => fehler(anfrage.error);
  });
}

// Erzeugt eine eindeutige Nummer für einen neuen Eintrag
function neueId() {
  return crypto.randomUUID();
}

// Kleine Hilfsfunktion: führt eine Aktion in einer Schublade aus
async function mitSchublade(name, modus, aktion) {
  const db = await oeffneDatenbank();
  return new Promise((erfolg, fehler) => {
    const tx = db.transaction(name, modus);
    const ergebnis = aktion(tx.objectStore(name));
    tx.oncomplete = () => erfolg(ergebnis && 'result' in ergebnis ? ergebnis.result : undefined);
    tx.onerror = () => fehler(tx.error);
  });
}

// ---- Die Funktionen, die der Rest der App benutzt ----

// Alle Einträge einer Schublade holen
function alleHolen(name) {
  return mitSchublade(name, 'readonly', (s) => s.getAll());
}

// Alle Einträge einer Schublade, die zu einem Fahrzeug gehören
function alleVonFahrzeug(name, fahrzeugId) {
  return mitSchublade(name, 'readonly', (s) => s.index('fahrzeugId').getAll(fahrzeugId));
}

// Einen Eintrag holen
function einenHolen(name, id) {
  return mitSchublade(name, 'readonly', (s) => s.get(id));
}

// Einen Eintrag speichern (neu oder geändert). Neue Einträge bekommen eine id.
async function speichern(name, eintrag) {
  if (!eintrag.id && name !== 'einstellungen') eintrag.id = neueId();
  await mitSchublade(name, 'readwrite', (s) => s.put(eintrag));
  return eintrag;
}

// Einen Eintrag löschen
function loeschen(name, id) {
  return mitSchublade(name, 'readwrite', (s) => s.delete(id));
}
