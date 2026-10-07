# Freetime

Eine Social-Media-App, die Menschen dabei hilft, gemeinsam Veranstaltungen in ihrer Nähe zu besuchen. Statt Events nur zu finden, verbindet Freetime Nutzer mit anderen Interessierten — damit niemand allein hingehen muss.

## Features

- **Dashboard** — Personalisierte Event-Empfehlungen mit Like/Dislike (Swipe-Karten)
- **Kartenansicht** — Leaflet-Karte mit Veranstaltungen im einstellbaren Radius (1–50 km)
- **Events** — Erstellen, Bearbeiten, Suchen und Filtern (Kategorie, Quelle, Textsuche)
- **Freunde** — Anfragen senden, annehmen, ablehnen; Freundesliste
- **Chat** — Direktnachrichten unter Freunden + Gruppenchat pro Event
- **Gemerkt** — Übersicht aller Events, die man geliked hat
- **Sicherheit** — Passwortrichtlinie, JWT-Authentifizierung, Blockieren, Melden
- **Moderation** — Events freigeben/ablehnen, Meldungen bearbeiten, Antworten senden
- **Admin-Panel** — Benutzerverwaltung (Passwort zurücksetzen, Sperren, Rollen ändern), Event-Löschung
- **Profil** — Bearbeitung von Name, Stadt, Profilbild, Vorlieben (Like/Dislike pro Kategorie)
- **Umfrage** — Einmalige Vorlieben-Abfrage beim ersten Login
- **Benachrichtigungen** — Klickbare Notifications für Freundschaftsanfragen, Moderation, etc.
- **Dark Mode** — Hell/Dunkel Umschalter

---

## Anforderungs-Tracking (REQ-001 bis REQ-069)

### 1. Profil- und Kontaktverwaltung

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 001 | Profilerstellung | ✅ | Pflichtfelder + optionale Felder |
| 002 | Profilbearbeitung | ✅ | Alle Felder außer Geburtsdatum änderbar |
| 003 | Freundschaftsanfrage | ✅ | Über Benutzersuche |
| 004 | Bestätigung | ✅ | Nur bei Bestätigung |
| 005 | Auflösung | ✅ | Einseitig möglich |

### 2. Veranstaltungen und Kartenansicht

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 006 | Kartendarstellung | ✅ | Radius 1–50 km, 30-Tage-Fenster |
| 007 | Detailinformation | ✅ | Titel, Zeiten, Adresse, Kategorie |
| 008 | Ladezeit | ⚠️ | Funktioniert, aber keine explizite Messung |
| 009 | Standortfreigabe | ✅ | Geolocation + manuelle Eingabe als Fallback |

### 3. Dashboard und Empfehlungen

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 010 | Interessensbekundung | ✅ | Like/Dislike pro Event genau einmal |
| 011 | Korrektur | ✅ | Zurücknehmen oder Ändern möglich |
| 012 | Vorschlagsliste | ✅ | 10–20 personalisierte Vorschläge |
| 013 | Ausschluss | ✅ | Disliked Events erscheinen nicht erneut |
| 014 | Aktualisierung | ✅ | Sofortige Neuberechnung nach Bewertung |

### 4. Sicherheit

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 015 | Authentifizierung | ✅ | JWT-basiert, alle Daten geschützt |
| 016 | Passwortrichtlinie | ✅ | ≥12 Zeichen, Groß/Klein/Ziffer/Sonderzeichen |
| 017 | Zwei-Faktor-Authentifizierung | ❌ | TOTP nicht implementiert |
| 018 | Transportverschlüsselung | ❌ | Nur HTTP (TLS wäre für Produktion nötig) |
| 019 | Passwortspeicherung | ⚠️ | BCrypt statt Argon2id |
| 020 | Blockieren | ✅ | Blockiert: keine Nachrichten, keine Anfragen |
| 021 | Meldefunktion | ✅ | Profil/Event mit vordefinierten Gründen |
| 022 | Bearbeitung von Meldungen | ✅ | In Moderationsansicht, Admin kann antworten |
| 023 | Mindestalter | ✅ | Registrierung ab 16 Jahren |

### 5. Nutzergenerierte Veranstaltungen

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 024 | Anlegen | ✅ | Pflichtfelder vorhanden |
| 025 | Plausibilitätsprüfung | ✅ | Start nicht in Vergangenheit, Ende nach Start |
| 026 | Geokodierung | ⚠️ | Adresse → Koordinaten (Nominatim), aber keine Ablehnung bei unklarer Adresse |
| 027 | Bearbeitung und Absage | ✅ | Nur Ersteller, nur bis Startzeitpunkt |
| 028 | Benachrichtigung bei Änderung | ❌ | Keine Push-Benachrichtigung bei Event-Änderungen |
| 029 | Missbrauchsschutz | ✅ | Max. 5 aktive eigene Events |

### 6. Import externer Veranstaltungsdaten (Stadt Wien)

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 030 | Datenquelle | ❌ | Kein echter API-Import; Beispieldaten simulieren Wien-Events |
| 031 | Aktualisierungsintervall | ❌ | Kein automatischer 24h-Import |
| 032 | Fehlerverhalten | ❌ | Kein Retry-Mechanismus |
| 033 | Kennzeichnung der Quelle | ✅ | „Stadt Wien" / „Nutzer" wird angezeigt |
| 034 | Dublettenerkennung | ❌ | Nicht implementiert |
| 035 | Schreibschutz | ⚠️ | Nutzer können importierte Events nicht bearbeiten; Admin kann es |

### 7. Chat

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 036 | Direktnachrichten | ✅ | Unter bestätigten Freunden |
| 037 | Kontaktaufnahme ohne Freundschaft | ❌ | Keine Nachrichtenanfragen an Nicht-Freunde |
| 038 | Veranstaltungschat | ✅ | Gruppenchat für Events mit Like |
| 038a | Lebensdauer des Gruppenchats | ❌ | Keine Sperrung 24h nach Event-Ende |
| 038b | Austritt | ❌ | Like-Rücknahme entfernt nicht aus Chat |
| 039 | Zustellzeit | ⚠️ | Polling alle 3s (kein Echtzeit-WebSocket) |
| 040 | Nachrichtenlänge | ✅ | Max. 2000 Zeichen |
| 041 | Verschlüsselung | ❌ | Keine AES-256-Verschlüsselung im Ruhezustand |
| 042 | Wirkung des Blockierens | ✅ | Blockierte können keine Nachrichten senden |
| 043 | Meldung im Chat | ⚠️ | Event-Meldung möglich, nicht einzelne Nachrichten |
| 044 | Aufbewahrung | ❌ | Keine automatische Löschung nach 90 Tagen |

### 8. Moderation nutzergenerierter Veranstaltungen

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 045 | Zustände | ✅ | eingereicht / freigegeben / abgelehnt / gesperrt |
| 046 | Anfangszustand | ✅ | Neue Events = eingereicht |
| 047 | Sichtbarkeit | ✅ | Nur freigegeben Events sichtbar |
| 048 | Sichtbarkeit für den Ersteller | ✅ | Ersteller sieht alle Zustände |
| 049 | Bearbeitungsfrist | ✅ | Pending-Queue zeigt eingereichte Events |
| 050 | Entscheidung | ✅ | Freigeben oder Ablehnen mit Grund |
| 051 | Automatische Vorprüfung | ❌ | Keine Sperrwortliste |
| 052 | Benachrichtigung | ✅ | Benachrichtigung bei Freigabe/Ablehnung |
| 053 | Erneute Prüfung nach Änderung | ✅ | Bearbeitung setzt auf eingereicht zurück |
| 054 | Automatische Sperrung | ❌ | Keine Auto-Sperrung bei 5 Meldungen |
| 055 | Wirkung der Sperrung | ❌ | Keine Chat-Sperrung bei abgelehnt/gesperrt |
| 056 | Widerspruch | ❌ | Kein einmaliger Widerspruch möglich |
| 057 | Protokollierung | ❌ | Kein revisionssicheres Moderationsprotokoll |

### 9. Rollenvergabe für Moderatoren

| REQ | Beschreibung | Status | Hinweis |
|-----|-------------|--------|---------|
| 058 | Rollenzuweisung | ✅ | Admin kann Rolle ändern (USER/MODERATOR/ADMIN) |
| 059 | Geltungsbereich | ❌ | Moderatoren haben globalen Zugriff, nicht event-bezogen |
| 060 | Zuständigkeit bei Einreichung | ❌ | Keine automatische Zuordnung an zuständige Moderatoren |
| 061 | Entzug | ✅ | Admin kann Rolle jederzeit ändern |
| 062 | Nachweisprüfung | ❌ | Keine Identitätsprüfung vor Rollenvergabe |
| 063 | Zuständigkeit bei Stadt-Wien | ❌ | Keine event-bezogene Moderator-Zuweisung |
| 064 | Unmoderierter Chat | ✅ | Keine Moderation für nutzergenerierte Event-Chats |
| 065 | Moderierter Chat | ❌ | Keine Moderation von Wien-Event-Chats |
| 066 | Moderationsrechte im Chat | ❌ | Keine Nachrichtenlöschung / Nutzerentfernung im Chat |
| 067 | Protokollierung von Chat-Moderation | ❌ | Kein Audit-Log für Chat-Moderation |
| 068 | Bearbeitungsrecht des Moderators | ⚠️ | Admin kann Wien-Events bearbeiten, nicht event-bezogene Moderatoren |
| 069 | Kein Bearbeitungsrecht ohne Zuweisung | ⚠️ | Nicht vollständig durchgesetzt |

---

### Zusammenfassung

| Status | Anzahl | Anteil |
|--------|--------|--------|
| ✅ Implementiert | 34 | 49% |
| ⚠️ Teilweise | 8 | 12% |
| ❌ Nicht implementiert | 27 | 39% |

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Backend | Java 17, Spring Boot 3.2 |
| Datenbank | H2 (In-Memory, lädt Beispieldaten bei jedem Start) |
| Auth | JWT (jjwt), BCrypt-Passwort-Hashing |
| Frontend | Vanilla JavaScript, CSS (Material 3 angelehnt) |
| Karten | Leaflet.js + OpenStreetMap |
| Build | Maven |

## Voraussetzungen

- Java 17 oder höher
- Maven 3.6+ (oder der enthaltene Maven-Wrapper)

## Starten

```bash
cd freetime
mvn clean package -DskipTests
java -jar target/freetime-0.0.1-SNAPSHOT.jar
```

Dann im Browser öffnen: **http://localhost:8080**

## Demo-Zugänge

| Benutzername | Passwort | Rolle |
|---|---|---|
| `admin` | `Admin123!@#$%` | Administrator |
| `moderator` | `Mod1234!@#$%` | Moderator |
| `alice` | `Alice123!@#$%` | Benutzer |
| `bob` | `Bob12345!@#$%` | Benutzer |
| `carla` | `Carla123!@#$%` | Benutzer |

## Projektstruktur

```
freetime/
├── pom.xml
└── src/main/
    ├── java/com/freetime/
    │   ├── FreetimeApplication.java
    │   ├── config/          # SecurityConfig, DataInitializer
    │   ├── controller/      # REST-Endpunkte
    │   ├── dto/             # Request/Response-Objekte
    │   ├── model/           # JPA-Entities + Enums
    │   ├── repository/      # Spring Data JPA Repos
    │   ├── security/        # JWT-Util + Auth-Filter
    │   └── service/         # Geschäftslogik
    └── resources/
        ├── application.yml
        └── static/          # Frontend (HTML, CSS, JS)
            ├── index.html
            ├── css/style.css
            └── js/
```

## REST-API (Übersicht)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/auth/register` | Registrierung |
| POST | `/api/auth/login` | Anmeldung |
| GET | `/api/users/me` | Eigenes Profil |
| PUT | `/api/users/me` | Profil bearbeiten |
| GET | `/api/users/search?q=` | Benutzer suchen |
| GET/POST | `/api/friends` | Freunde verwalten |
| GET | `/api/events?lat=&lng=&radius=&category=&source=&q=` | Events filtern |
| POST | `/api/events` | Event erstellen |
| GET | `/api/dashboard` | Empfehlungen |
| POST | `/api/ratings/{id}` | Like/Dislike |
| GET/POST | `/api/chat/*` | Chat-Nachrichten |
| GET/POST | `/api/preferences/*` | Vorlieben |
| GET/POST | `/api/notifications/*` | Benachrichtigungen |
| GET/POST | `/api/admin/*` | Admin-Funktionen |

## Hinweise

- Die Kartenansicht nutzt OpenStreetMap (kostenlos, kein API-Key nötig)
- Geokodierung erfolgt über Nominatim (mit Fallback auf Wien-Zentrum)
- Chat nutzt Polling (alle 3 Sekunden) statt WebSockets
- Passwort-Hashing: BCrypt (für Produktion wäre Argon2id empfohlen)