# Fahrzeugakte – Projektbeschreibung für Claude Code

## Worum es geht
Eine PWA (installierbare Web-App), mit der ich die komplette Historie meines Fahrzeugs führe: Wartung, Reparaturen, Umbauten, Kosten, Tankungen, später mit Belegen. Erstes Testfahrzeug ist mein Jeep Wrangler (Auslieferung 2018).
Langfristige Idee: eine belegbasierte, übertragbare Fahrzeugakte für Young- und Oldtimer und Offroad-Umbauten. Aktuell ist das ein **Lernprojekt**, um Claude Code kennenzulernen.

## Über mich – so arbeiten wir
- Ich habe **keine Programmiererfahrung**. Erkläre kurz und auf Deutsch, was du tust und warum, ohne Fachchinesisch.
- **Kleine Schritte.** Bei größeren Aufgaben nennst du zuerst einen kurzen Plan und wartest auf mein Okay.
- Nach jedem Schritt sagst du mir, **wie ich es teste** (was ich öffnen oder anklicken soll und was ich sehen sollte).
- Wenn ein Schritt funktioniert, machst du einen **Git-Commit** mit einer kurzen deutschen Nachricht.
- Wenn etwas unklar ist, frag nach statt zu raten, vor allem bei meinen Fahrzeugdaten.

## Technik-Entscheidungen
- **PWA mit reinem HTML, CSS und JavaScript**, ohne Build-Tools und ohne Framework, damit ich den Code nachvollziehen kann. Externe Bibliotheken nur nach Rücksprache.
- **Daten nur lokal im Browser (IndexedDB).** Kein Server, keine Benutzerkonten, kein Cloud-Sync.
- **Backup** über Export und Import einer JSON-Datei.
- **Hosting:** GitHub Pages. Entwicklung auf Windows, Test auf Android (Chrome), später auch iPad (Safari).
- **Erinnerungen:** In Version 1 keine Push-Benachrichtigungen. Fälligkeiten zeigt die Ampel beim Öffnen, Termine wie die HU können als Kalenderdatei (.ics) exportiert werden.
- Das Datenmodell muss von Anfang an **mehrere Fahrzeuge** können, auch wenn die Oberfläche zunächst nur eines zeigt.

## Datenschutz – wichtig
Das GitHub-Repo kann öffentlich sein. Deshalb gehören **keine privaten Daten ins Repo**: nicht die Excel-Datei, keine JSON-Exporte, keine Belege oder Fotos. Leg die dafür nötigen Einträge in der `.gitignore` an, bevor du den ersten Commit machst.

## Datenmodell (Konzept)
- **Fahrzeug:** Name, Marke, Modell, Baujahr, FIN (optional), Erstzulassung, Notizen
- **Servicestufe:** Name (z. B. „Ölwechsel“, „Stufe 2“, „Getriebe“, „HU“, „Reifen“), Notiz. Stufen sind **Daten**, keine festen Spalten. Jede Stufe hat zwei Intervalle, jeweils in km und Monaten:
  - **Eigenes Intervall** (wann ich es machen will, z. B. Öl 6.000 km nach Haynes)
  - **Maximales Intervall** (Herstellergrenze, z. B. Öl 12.000 km / 12 Monate laut Jeep, erschwerte Bedingungen 7.500 km / 6 Monate)
  - Zu jedem Intervall eine **Quelle** (Hersteller, Haynes, Werkstatt, eigene Erfahrung). Beide Werte sollen in der App sichtbar sein.
- **Kategorie** (was und warum): frei anlegbar, umbenennbar und erweiterbar in der App, keine feste Liste im Code. Startwerte: Wartung (planmäßig), Reparatur (ungeplant: defekt oder Verschleiß), Umbau (bewusste, fest verbaute Veränderung am Fahrzeug), Ausrüstung (lose bzw. abnehmbar, z. B. Kompressor), Prüfung (HU/AU, Eintragungen, Gutachten), Fixkosten (Versicherung, Steuer), Sonstiges
- **Ereignis:** Datum, Kilometerstand, Kategorie, Beschreibung, erledigte Servicestufen, ausgeführt von (Werkstatt oder selbst). Später kommen angehängte Belege und Fotos dazu.
- **Kostenposten** (gehört zu einem Ereignis, mehrere möglich): Bezeichnung, Betrag, Kostenart (Material, Arbeitslohn, Gebühren, Sonstiges). „Ersatzteile“ ist also keine Kategorie, sondern die Kostenart Material.
- **Tankung:** Datum, Kilometerstand (darf fehlen), Liter, Betrag, vollgetankt ja/nein
- **Aktueller Kilometerstand** = höchster bekannter Stand aus Ereignissen und Tankungen
- **Fälligkeit je Servicestufe:** letzte Erledigung plus Intervall, es zählt, was zuerst erreicht wird (km oder Zeit). Ampel: grün = ok, gelb = eigenes Intervall erreicht (jetzt planen, Entscheidung je nach Einsatz), rot = maximales Intervall erreicht oder überschritten. Optional eine Vorwarnung vor Gelb, einstellbar, Startwert 1.000 km oder 1 Monat. Ist nur ein Intervall gepflegt, gilt es für beides.

## Datenübernahme aus meiner Excel
Die Datei heißt `Fahrzeughistorie.xlsx` und hat 8 Reiter: Wartungsplan, Wartungsintervalle, Dokumentation, Tankübersicht, Umbauten, Rechnungsübersicht, Kostenübersicht u. a. Übernommen wird **alles seit 2018**, auch das komplette Tankbuch. Die Übernahme läuft einmalig über ein Import-Skript, das eine JSON-Datei für den App-Import erzeugt. Den technischen Weg stimmst du vorher mit mir ab.
Bekannte Probleme in der Excel, die du **nicht selbst auflösen** sollst:
- Intervalle stehen doppelt (Wartungsplan und Wartungsintervalle) und widersprechen sich teilweise, etwa beim Öl. Zeig mir die Unterschiede, ich entscheide.
- Bei etwa 20 Tankungen fehlt der Kilometerstand, einige Werte sind „?“, und es gibt ein falsches Datum (28.02.2062). Fehlende Werte bleiben leer, Lücken in Auswertungen sind okay. Gib mir eine Liste der fraglichen Zeilen aus.
- Rechnungen und Ereignisse sind in der Excel nicht verknüpft. Schlag mir Zuordnungen vor, ich bestätige.

## Fahrplan
- **V0 „Hallo Jeep“:** minimale PWA, lokal im Browser testen, auf GitHub Pages veröffentlichen, auf dem Handy installieren
- **V1:** Fahrzeug, Servicestufen, Ereignisse, Kilometerstand, Ampel, JSON-Export und -Import, Excel-Import
- **V2:** Tankbuch mit Verbrauch und einfachen Auswertungen
- **V3:** Belege und Fotos an Ereignisse anhängen (lokal gespeichert)
- **V4:** Fahrzeugakte als PDF bzw. Übergabe an einen Käufer

**Bewusst nicht im Umfang:** Cloud-Sync, Benutzerkonten, Reparaturanleitungen aus fremden Quellen (Urheberrecht und Haftung). Erlaubt sind nur meine eigenen Notizen.
