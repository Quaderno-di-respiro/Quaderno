#!/usr/bin/env node
/* Prima le Radici: rigenera pubblici/pillole.js, i contenuti delle pagine «Le pillole» e dei percorsi.

   Si lancia dal PC, dalla cartella dell'archivio (quella che contiene guida/, catalogo/ e github/):

       node github/strumenti/estrai_pillole.js

   Legge due cose:
   - catalogo/sito-20261111/pillole.json: quali pillole, i testi tagliati, dosi, avvisi, routine,
     sessioni tipo, test e il blocco «generale». Dosi e avvisi si prendono sempre da qui.
   - guida/sorgenti/parti/3-script.html: le schede della guida (ES). Per ogni pillola controlla che la
     scheda esista, che sia «chiaro» e che nome, «A cosa ti serve», come, senti ed evita siano ancora
     la scheda, al massimo tagliata (stesse parole, nello stesso ordine, senza i riferimenti [[...]]).
   Se tutto torna scrive github/pubblici/pillole.js. Se una scheda è cambiata e un testo non è più un
   suo taglio, si ferma e dice quale: si ritaglia il testo in pillole.json e si rilancia.

   Opzioni:
     --controlla        controlla e basta, senza scrivere pillole.js
     --prendi-schede    per i testi che non tornano usa la scheda intera (senza [[...]]) e scrive lo
                        stesso; poi vanno ritagliati in pillole.json (tagli e promesse vietate!)
     --json FILE        un altro pillole.json        --guida FILE   un altro 3-script.html
     --figure FILE      un altro figure.js           --uscita FILE  dove scrivere pillole.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const arg = process.argv.slice(2);
function opz(nome, def) { const i = arg.indexOf(nome); return i !== -1 && arg[i + 1] ? arg[i + 1] : def; }
const SOLO_CONTROLLO = arg.includes("--controlla");
const PRENDI_SCHEDE = arg.includes("--prendi-schede");
const RADICE = process.cwd();
const F_JSON = path.resolve(RADICE, opz("--json", "catalogo/sito-20261111/pillole.json"));
const F_GUIDA = path.resolve(RADICE, opz("--guida", "guida/sorgenti/parti/3-script.html"));
const F_FIGURE = path.resolve(RADICE, opz("--figure", "github/pubblici/figure.js"));
const F_USCITA = path.resolve(RADICE, opz("--uscita", "github/pubblici/pillole.js"));

const errori = [], avvisi = [], presi = [];
function errore(m) { errori.push(m); }
function avviso(m) { avvisi.push(m); }
function leggi(f) {
  try { return fs.readFileSync(f, "utf8"); }
  catch (e) { console.error("Non trovo " + path.relative(RADICE, f) + ": lancia lo script dalla cartella dell'archivio."); process.exit(2); }
}

// ---- le schede della guida: il blocco da «var LIV» alla fine di «var GRUPPI» ----
function schede() {
  const src = leggi(F_GUIDA);
  const a = src.indexOf("var LIV = {");
  const g = src.indexOf("var GRUPPI = [", a);
  const b = g === -1 ? -1 : src.indexOf("\n  ];", g);
  if (a === -1 || b === -1) { console.error("In 3-script.html non trovo il blocco delle schede (var LIV … var GRUPPI)."); process.exit(2); }
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src.slice(a, b + 5) + "\nthis.ES = ES; this.TEST = TEST; this.GRUPPI = GRUPPI;", ctx);
  return ctx;
}
// ---- le figure: gli id che figure.js sa disegnare (se figure.js non si legge, il controllo si salta) ----
function figure() {
  try {
    const noop = function () {};
    const win = { matchMedia: function () { return { matches: false }; }, requestAnimationFrame: noop };
    const doc = { addEventListener: noop, visibilityState: "visible", head: null };
    const ctx = { window: win, document: doc };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(F_FIGURE, "utf8"), ctx);
    return win.QGFig.ids();
  } catch (e) { avviso("figure.js non si legge con node: il controllo delle figure è saltato."); return null; }
}

// Il testo come lo mostra la pagina: senza [[...]] e senza tag.
function pulito(s) { return String(s == null ? "" : s).replace(/\s*\[\[[^\]]+\]\]/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
function parole(s) { return pulito(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean); }
// true se ogni parola di «taglio» compare in «scheda», nello stesso ordine.
function eTaglio(taglio, scheda) {
  const t = parole(taglio), s = parole(scheda);
  let j = 0;
  for (let i = 0; i < s.length && j < t.length; i++) if (s[i] === t[j]) j++;
  return j === t.length;
}
// Un taglio può togliere frasi intere, ma non una negazione dentro la frase che resta:
// «mai mentre urini» non può diventare «mentre urini». Si segnala, frase per frase.
const NEGAZIONI = ["non", "mai", "senza", "niente", "nessun", "nessuna", "evita", "salta", "fermati", "stop"];
function frasi(s) { return pulito(s).split(/(?<=[.!?;:])\s+/).filter(Boolean); }
function negazioniPerse(taglio, scheda) {
  const fonti = frasi(scheda).map(parole);
  return frasi(taglio).some(function (f) {
    const t = parole(f);
    const src = fonti.find(function (s) { let j = 0; for (let i = 0; i < s.length && j < t.length; i++) if (s[i] === t[j]) j++; return j === t.length; });
    return !!src && NEGAZIONI.some(function (n) { return src.indexOf(n) !== -1 && t.indexOf(n) === -1; });
  });
}
function mmss(sec) { return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }

const dati = JSON.parse(leggi(F_JSON));
const { ES } = schede();
const ids = figure();
const CAMPI = ["nome", "serve", "come", "senti", "evita"];

if (!Array.isArray(dati.strutture) || !Array.isArray(dati.percorsi) || !Array.isArray(dati.test)) {
  console.error("pillole.json non ha strutture, percorsi e test."); process.exit(2);
}

// ---- le pillole ----
const libere = {};
dati.strutture.forEach(function (s) {
  if (!s.id || !s.nome) errore("Una struttura senza id o nome.");
  (s.pillole || []).forEach(function (p) {
    const dove = s.nome + " › " + p.cod;
    libere[p.cod] = s.id;
    const sc = ES[p.cod];
    if (!sc) { errore(dove + ": la scheda non esiste in 3-script.html."); return; }
    if (sc.stato !== "chiaro") errore(dove + ": la scheda è «" + sc.stato + "», non «chiaro»: non può stare nella parte gratuita.");
    if (ids && ids.indexOf(p.cod) === -1) avviso(dove + ": figure.js non ha la figura: sulla pagina compare il testo di ripiego.");
    CAMPI.forEach(function (c) {
      if (!p[c] || !String(p[c]).trim()) { errore(dove + ": manca «" + c + "»."); return; }
      if (eTaglio(p[c], sc[c])) {
        if (negazioniPerse(p[c], sc[c])) avviso(dove + " · " + c + ": il taglio toglie una negazione dalla sua frase. Ricontrolla che il senso non cambi.");
        return;
      }
      if (PRENDI_SCHEDE) { p[c] = pulito(sc[c]); presi.push(dove + " · " + c); }
      else errore(dove + " · " + c + ": il testo di pillole.json non è più un taglio della scheda. Ritaglialo dalla scheda nuova.");
    });
    if (!p.dose) errore(dove + ": manca la dose di prova.");
    if (["Coach", "Nostra", "Coach e Nostra"].indexOf(p.origineDose) === -1) errore(dove + ": origineDose deve essere «Coach», «Nostra» o «Coach e Nostra».");
    if (p.avviso === "") p.avviso = null;
  });
});

// ---- routine e sessioni tipo ----
function controllaPassi(passi, dove, ammesse, min, max) {
  let tot = 0;
  (passi || []).forEach(function (x, i) {
    if (!(x.durataSec > 0)) errore(dove + ", passo " + (i + 1) + ": durata mancante.");
    tot += x.durataSec || 0;
    if (x.cod !== "cambio" && !ammesse(x.cod)) errore(dove + ", passo " + (i + 1) + ": " + x.cod + " non è una pillola gratuita ammessa qui.");
  });
  if (tot < min || tot > max) avviso(dove + ": dura " + mmss(tot) + ", fuori da " + mmss(min) + "–" + mmss(max) + ".");
}
dati.strutture.forEach(function (s) {
  const mie = (s.pillole || []).map(function (p) { return p.cod; });
  controllaPassi(s.routine, s.nome + " › routine", function (c) { return mie.indexOf(c) !== -1; }, 270, 330);
});
const idStrutture = dati.strutture.map(function (s) { return s.id; });
dati.percorsi.forEach(function (p) {
  (p.strutture || []).forEach(function (id) { if (idStrutture.indexOf(id) === -1) errore(p.nome + ": la struttura «" + id + "» non esiste."); });
  controllaPassi(p.sessione, p.nome + " › sessione tipo", function (c) { return p.strutture.indexOf(libere[c]) !== -1; }, 840, 960);
});

// ---- i test: quelli con una scheda in ES si controllano come le pillole ----
dati.test.forEach(function (t) {
  const sc = ES[t.cod];
  if (!sc) return; // BOLT, respiri al minuto, equilibrio: procedure del catalogo, senza scheda in ES
  if (sc.stato !== "chiaro") errore("Test " + t.cod + ": la scheda è «" + sc.stato + "».");
  ["nome", "come"].forEach(function (c) {
    if (eTaglio(t[c], sc[c])) return;
    // la parte Nostra del test (per esempio l'arresto per il dolore) può aggiungere parole: si segnala soltanto
    avviso("Test " + t.cod + " · " + c + ": non è solo un taglio della scheda (parti Nostre?). Ricontrolla.");
  });
});

// ---- il risultato ----
avvisi.forEach(function (m) { console.log("Attenzione: " + m); });
presi.forEach(function (m) { console.log("Preso dalla scheda, da ritagliare in pillole.json: " + m); });
if (errori.length) {
  errori.forEach(function (m) { console.error("Errore: " + m); });
  console.error(errori.length + (errori.length === 1 ? " errore" : " errori") + ": pillole.js non è stato scritto.");
  process.exit(1);
}
const conta = dati.strutture.reduce(function (n, s) { return n + (s.pillole || []).length; }, 0);
if (SOLO_CONTROLLO) { console.log("Tutto torna: " + conta + " pillole, " + dati.percorsi.length + " percorsi, " + dati.test.length + " test. (--controlla: niente scritto)"); process.exit(0); }

const oggi = new Date().toISOString().slice(0, 10);
const testa = "/* Prima le Radici: i contenuti delle pagine «Le pillole» e dei quattro percorsi.\n" +
  "   Non si modifica a mano: si rigenera con «node github/strumenti/estrai_pillole.js» (vedi README).\n" +
  "   Fonte: catalogo/sito-20261111/pillole.json, controllata sulle schede di guida/sorgenti/parti/3-script.html.\n" +
  "   Generato il " + oggi + ": " + conta + " pillole, " + dati.strutture.length + " routine, " + dati.percorsi.length + " sessioni tipo, " + dati.test.length + " test. */\n";
fs.writeFileSync(F_USCITA, testa + "window.QGPillole = " + JSON.stringify(dati, null, 1) + ";\n");
console.log("Scritto " + path.relative(RADICE, F_USCITA) + ": " + conta + " pillole, " + dati.percorsi.length + " percorsi, " + dati.test.length + " test.");
