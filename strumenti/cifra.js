"use strict";
// Costruisce il sito da pubblicare in _site/, con la guida cifrata dalla password.
//
//   CHIAVE_SORGENTE=... PASSWORD=... node strumenti/cifra.js
//
// I sorgenti in sorgente/ sono sigillati con CHIAVE_SORGENTE (vedi sigilla.js), così il
// repository pubblico non contiene la guida in chiaro. Qui si aprono e si richiudono con
// una chiave ricavata da PASSWORD: chi apre il sito la inserisce e il browser decifra.
// Cambiare il segreto PASSWORD su GitHub e rilanciare il workflow cambia la password.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RADICE = path.join(__dirname, "..");
const USCITA = path.join(RADICE, "_site");
const ITERAZIONI = 600000;

function serve(nome) {
  const v = process.env[nome];
  if (!v) { console.error(`Manca ${nome}: impostalo tra i segreti del repository (Settings → Secrets and variables → Actions).`); process.exit(1); }
  return v;
}

const chiaveSorgente = Buffer.from(serve("CHIAVE_SORGENTE").trim(), "base64");
if (chiaveSorgente.length !== 32) { console.error("CHIAVE_SORGENTE non è valida: deve essere quella creata con sigilla.js."); process.exit(1); }
const password = serve("PASSWORD");
if (password.length < 8) { console.error("La password deve avere almeno 8 caratteri."); process.exit(1); }

// Formato dei file cifrati: iv (12 byte) | testo cifrato | tag (16 byte), AES-256-GCM.
function apri(file) {
  const b = fs.readFileSync(file);
  const d = crypto.createDecipheriv("aes-256-gcm", chiaveSorgente, b.subarray(0, 12));
  d.setAuthTag(b.subarray(b.length - 16));
  try { return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]); }
  catch (e) { console.error(`Non riesco ad aprire ${path.basename(file)}: CHIAVE_SORGENTE non corrisponde.`); process.exit(1); }
}

// La stessa password dà la stessa chiave finché il sale non cambia: chi ha già
// inserito la password non deve rifarlo a ogni aggiornamento della guida.
const sale = Buffer.from(fs.readFileSync(path.join(__dirname, "sale.txt"), "utf8").trim(), "base64");
const chiave = crypto.pbkdf2Sync(password, sale, ITERAZIONI, 32, "sha256");
function chiudi(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chiave, iv);
  return Buffer.concat([iv, c.update(buf), c.final(), c.getAuthTag()]);
}

fs.rmSync(USCITA, { recursive: true, force: true });
fs.mkdirSync(USCITA, { recursive: true });

const guida = chiudi(apri(path.join(RADICE, "sorgente", "guida.enc")));
const dati = JSON.stringify({ v: 1, iter: ITERAZIONI, sale: sale.toString("base64"), dati: guida.toString("base64") });
const porta = fs.readFileSync(path.join(__dirname, "porta.html"), "utf8");
if (porta.split("__DATI__").length !== 2) { console.error("porta.html deve contenere __DATI__ una volta sola."); process.exit(1); }
fs.writeFileSync(path.join(USCITA, "index.html"), porta.replace("__DATI__", () => dati));
fs.writeFileSync(path.join(USCITA, "quaderno-del-respiro.pdf.enc"), chiudi(apri(path.join(RADICE, "sorgente", "pdf.enc"))));

const pubblici = path.join(RADICE, "pubblici");
for (const f of fs.readdirSync(pubblici)) {
  if (f === "sw.js") continue;
  fs.copyFileSync(path.join(pubblici, f), path.join(USCITA, f));
}
const versione = new Date().toISOString().replace(/\D/g, "").slice(0, 12) + "-" + crypto.createHash("sha256").update(dati).digest("hex").slice(0, 8);
fs.writeFileSync(path.join(USCITA, "sw.js"), fs.readFileSync(path.join(pubblici, "sw.js"), "utf8").replace("__VERSIONE__", versione));
fs.writeFileSync(path.join(USCITA, ".nojekyll"), "");

console.log(`Sito pronto in _site/ (versione ${versione}): guida ${Math.round(guida.length / 1024)} KB, PDF cifrato.`);
