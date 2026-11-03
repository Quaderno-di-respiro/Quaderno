"use strict";
// Costruisce il sito da pubblicare in _site/, con la guida cifrata dalle password: la pagina
// d'ingresso (index.html, da porta.html), i dati della guida (guida.json) e il PDF cifrato.
//
//   CHIAVE_SORGENTE=... PASSWORD=... PASSWORDS=... node strumenti/cifra.js
//
// I sorgenti in sorgente/ sono sigillati con CHIAVE_SORGENTE (vedi sigilla.js), così il
// repository pubblico non contiene la guida in chiaro. Qui si aprono e si richiudono con
// una chiave nuova a ogni pubblicazione; quella chiave viene poi chiusa una volta per ogni
// password, e chi apre il sito con una qualsiasi di loro la riapre nel browser.
// Le password vengono dal segreto PASSWORD (una) e dal segreto PASSWORDS (una per riga; le
// righe che iniziano con # sono note, per esempio il nome della persona). Togliere una riga
// e rilanciare il workflow toglie quella password.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RADICE = path.join(__dirname, "..");
const USCITA = path.join(RADICE, "_site");
const ITERAZIONI = 600000;

// Su GitHub il messaggio diventa un'annotazione visibile nel riepilogo del workflow.
function errore(msg) { console.error((process.env.GITHUB_ACTIONS ? "::error::" : "") + msg); process.exit(1); }

function serve(nome) {
  const v = process.env[nome];
  if (!v) errore(`Manca ${nome}: impostalo tra i segreti del repository (Settings → Secrets and variables → Actions).`);
  return v;
}

// La chiave sono 44 caratteri che finiscono con «=»: se nel copia e incolla sono finiti
// spazi, virgolette o a capo intorno, si prende solo lei.
const grezza = serve("CHIAVE_SORGENTE");
const trovata = grezza.match(/[A-Za-z0-9+/]{43}=/g);
const chiaveSorgente = Buffer.from(trovata && trovata.length === 1 ? trovata[0] : grezza.trim(), "base64");
if (chiaveSorgente.length !== 32) errore(`CHIAVE_SORGENTE non è valida: deve essere il contenuto di segreti/chiave-sorgente.txt, 44 caratteri che finiscono con «=» (questa ne ha ${grezza.trim().length}). Incollala di nuovo nel segreto.`);
// Le password: PASSWORD da sola, poi PASSWORDS riga per riga. Nei messaggi d'errore si dice
// solo il numero di riga, mai la password.
const password = [];
const una = (process.env.PASSWORD || "").trim();
if (una) {
  if (una.length < 8) errore(`Il segreto PASSWORD deve avere almeno 8 caratteri (ne ha ${una.length}).`);
  password.push(una);
}
(process.env.PASSWORDS || "").split(/\r?\n/).forEach(function (riga, i) {
  const p = riga.trim();
  if (!p || p.startsWith("#")) return;
  if (p.length < 8) errore(`Nel segreto PASSWORDS la riga ${i + 1} ha una password di ${p.length} caratteri: ne servono almeno 8.`);
  if (!password.includes(p)) password.push(p);
});
if (!password.length) errore("Manca la password: imposta il segreto PASSWORD o il segreto PASSWORDS (Settings → Secrets and variables → Actions).");

// Formato dei file cifrati: iv (12 byte) | testo cifrato | tag (16 byte), AES-256-GCM.
function apri(file) {
  const b = fs.readFileSync(file);
  const d = crypto.createDecipheriv("aes-256-gcm", chiaveSorgente, b.subarray(0, 12));
  d.setAuthTag(b.subarray(b.length - 16));
  try { return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]); }
  catch (e) { errore(`Non riesco ad aprire ${path.basename(file)}: CHIAVE_SORGENTE non corrisponde a quella usata per sigillarlo.`); }
}

// La stessa password dà la stessa chiave finché il sale non cambia: chi ha già
// inserito la password non deve rifarlo a ogni aggiornamento della guida.
const sale = Buffer.from(fs.readFileSync(path.join(__dirname, "sale.txt"), "utf8").trim(), "base64");
function chiudiCon(chiave, buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chiave, iv);
  return Buffer.concat([iv, c.update(buf), c.final(), c.getAuthTag()]);
}
// La guida e il PDF si chiudono con una chiave nuova; la chiave si chiude con ogni password.
// L'ordine delle chiavi si mescola, così la posizione non dice di chi è.
const chiave = crypto.randomBytes(32);
const chiudi = buf => chiudiCon(chiave, buf);
const chiavi = password
  .map(p => chiudiCon(crypto.pbkdf2Sync(p, sale, ITERAZIONI, 32, "sha256"), chiave).toString("base64"))
  .map(c => [crypto.randomBytes(4).readUInt32LE(0), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

fs.rmSync(USCITA, { recursive: true, force: true });
fs.mkdirSync(USCITA, { recursive: true });

// La guida cifrata non sta più dentro la pagina: va in guida.json, che la porta scarica solo quando
// serve (password ricordata o «Entra»). Così la facciata pesa poco per chi la apre da Instagram.
// Il formato dei dati è lo stesso di prima (versione 2).
const guida = chiudi(apri(path.join(RADICE, "sorgente", "guida.enc")));
const dati = JSON.stringify({ v: 2, iter: ITERAZIONI, sale: sale.toString("base64"), chiavi: chiavi, dati: guida.toString("base64") });
const porta = fs.readFileSync(path.join(__dirname, "porta.html"), "utf8");
if (porta.includes("__DATI__")) errore("porta.html contiene ancora __DATI__: i dati della guida vanno in guida.json, non nella pagina.");
if (!porta.includes('"guida.json"')) errore("porta.html deve scaricare guida.json: la porta non troverebbe la guida.");
fs.writeFileSync(path.join(USCITA, "index.html"), porta);
fs.writeFileSync(path.join(USCITA, "guida.json"), dati);
fs.writeFileSync(path.join(USCITA, "quaderno-del-respiro.pdf.enc"), chiudi(apri(path.join(RADICE, "sorgente", "pdf.enc"))));

const pubblici = path.join(RADICE, "pubblici");
for (const f of fs.readdirSync(pubblici)) {
  if (f === "sw.js") continue;
  fs.copyFileSync(path.join(pubblici, f), path.join(USCITA, f));
}
const versione = new Date().toISOString().replace(/\D/g, "").slice(0, 12) + "-" + crypto.createHash("sha256").update(dati).digest("hex").slice(0, 8);
fs.writeFileSync(path.join(USCITA, "sw.js"), fs.readFileSync(path.join(pubblici, "sw.js"), "utf8").replace("__VERSIONE__", versione));
fs.writeFileSync(path.join(USCITA, ".nojekyll"), "");

console.log(`Sito pronto in _site/ (versione ${versione}): guida ${Math.round(guida.length / 1024)} KB, PDF cifrato, ${password.length} password.`);
