// index.js
// Social-Event-App – Einlesen und Anzeigen der Veranstaltungsdaten
// Attribute: eventId, titel, kategorie, datumUhrzeit, ort
// Ausführung in VS Code: node index.js  (im Ordner mit veranstaltungen.json)

const fs = require("fs");
const path = require("path");

// --- Teil 2: Funktion zum Einlesen des Datensatzes ---
function readData(filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  const rawData = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(rawData);
}

// --- Teil 3: Funktion zum Anzeigen des Datensatzes ---
function displayData(records) {
  console.log(`\nEs wurden ${records.length} Events geladen:\n`);

  records.forEach((record, index) => {
    console.log(`--- Event ${index + 1} ---`);
    console.log(record);      // gibt den Datensatz als einzelnes Objekt aus
    console.log("");
  });
}

// --- Programmablauf ---
try {
  const events = readData("./veranstaltungen.json");
  displayData(events);
} catch (error) {
  console.error("Fehler beim Einlesen der Datei:", error.message);
}
