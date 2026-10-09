# Freetime — Docker Version

Läuft auf **jedem Rechner** mit Docker Desktop — kein Java, kein Maven nötig.

## Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) oder Docker Engine (Linux)

## Starten

```bash
cd freetime-docker
docker compose up --build
```

Dann im Browser öffnen: **http://freetime:8032** (oder **http://localhost:8032**)

## Mit Cloudflare Tunnel

Falls die App über einen Cloudflare Tunnel erreichbar sein soll:

```bash
# App starten
docker compose up -d

# Cloudflare Tunnel starten (separates Terminal)
cloudflared tunnel --url http://localhost:8032
```

Oder für einen benannten Tunnel mit eigenem Hostnamen:

```bash
cloudflared tunnel --hostname freetime.example.com http://localhost:8032
```

Die App ist dann unter `http://freetime:8032` bzw. der Tunnel-URL erreichbar.

## Stoppen

```bash
docker compose down
```

## Demo-Zugänge

| Benutzername | Passwort | Rolle |
|---|---|---|
| `admin` | `Admin123!@#$%` | Administrator |
| `moderator` | `Mod1234!@#$%` | Moderator |
| `alice` | `Alice123!@#$%` | Benutzer |
| `bob` | `Bob12345!@#$%` | Benutzer |
| `carla` | `Carla123!@#$%` | Benutzer |

## Technische Details

- **Port:** 8032 (interne und externe Port-Weiterleitung)
- **Bindung:** `0.0.0.0` (erreichbar von außerhalb des Containers)
- **CORS:** Erlaubt `http://freetime:8032`, `http://localhost:8032`
- **Datenbank:** H2 In-Memory (Daten gehen bei Neustart verloren)
- **Beispieldaten:** Werden automatisch bei jedem Start geladen

## Projektstruktur

```
freetime-docker/
├── Dockerfile          ← Multi-stage Build (Maven → JRE Alpine)
├── docker-compose.yml  ← Start-Konfiguration (Port 8032)
└── README.md           ← Diese Datei

freetime/               ← Quellcode (wird von Docker verwendet)
├── pom.xml
└── src/
```

## Alternative: Ohne Docker

Falls Docker nicht verfügbar ist, aber Java 17 installiert ist:

```bash
cd ../freetime
mvn clean package -DskipTests
java -jar target/freetime-0.0.1-SNAPSHOT.jar
# → http://localhost:8032
```