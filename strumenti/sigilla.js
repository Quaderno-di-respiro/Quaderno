"use strict";
// Sigilla la guida prima di caricarla nel repository pubblico (si usa sul PC, non su GitHub).
//
//   node strumenti/sigilla.js <file-chiave> <index.html della webapp> <PDF>
//
// Se <file-chiave> non esiste ne crea uno nuovo: il suo contenuto va copiato UNA volta
// nel segreto CHIAVE_SORGENTE del repository e il file NON va caricato su GitHub.
// Scrive sorgente/guida.enc e sorgente/pdf.enc (AES-256-GCM: iv | cifrato | tag).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [fileChiave, html, pdf] = process.argv.slice(2);
if (!fileChiave || !html || !pdf) { console.error("uso: node strumenti/sigilla.js <file-chiave> <index.html> <PDF>"); process.exit(1); }

if (!fs.existsSync(fileChiave)) {
  fs.mkdirSync(path.dirname(fileChiave), { recursive: true });
  fs.writeFileSync(fileChiave, crypto.randomBytes(32).toString("base64") + "\n");
  console.log(`Creata una chiave nuova in ${fileChiave}: copiala nel segreto CHIAVE_SORGENTE su GitHub.`);
}
const chiave = Buffer.from(fs.readFileSync(fileChiave, "utf8").trim(), "base64");
if (chiave.length !== 32) { console.error("La chiave non è valida."); process.exit(1); }

function sigilla(da, a) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chiave, iv);
  const out = Buffer.concat([iv, c.update(fs.readFileSync(da)), c.final(), c.getAuthTag()]);
  fs.writeFileSync(a, out);
  console.log(`${path.basename(a)}: ${Math.round(out.length / 1024)} KB`);
}

const dir = path.join(__dirname, "..", "sorgente");
fs.mkdirSync(dir, { recursive: true });
sigilla(html, path.join(dir, "guida.enc"));
sigilla(pdf, path.join(dir, "pdf.enc"));

const sale = path.join(__dirname, "sale.txt");
if (!fs.existsSync(sale)) fs.writeFileSync(sale, crypto.randomBytes(16).toString("base64") + "\n");
