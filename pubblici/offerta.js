/* Quaderno del Respiro: il profilo Instagram e l'offerta del piano personalizzato.
   Lo leggono la pagina d'ingresso (index.html) e la sfida (sfida.html).
   Si cambiano solo i valori qui sotto, fino alla riga «Da qui in giù non serve toccare niente».
   Il README, sezione «La facciata e le sfide», spiega ogni voce. */

// L'indirizzo del profilo Instagram, per esempio "https://www.instagram.com/nomeprofilo/".
// Vuoto: al posto dei link compare «Scrivi PIANO su Instagram (profilo in arrivo)».
var INSTAGRAM = "";

// I tre pacchetti del piano personalizzato.
// - prezzo: il prezzo pieno in euro, un numero senza virgolette (90, oppure 89.5). null = non
//   ancora deciso: la pagina non mostra nessun numero e dice «Il prezzo te lo scrivo in DM».
// - prezzoLancio: il prezzo scontato. Compare, col prezzo pieno barrato e «fino al …», solo se ci
//   sono prezzo, prezzoLancio e scadenzaLancio e la data del telefono non ha superato la scadenza.
//   Il giorno dopo la scadenza lo sconto sparisce da solo.
// - scadenzaLancio: l'ultimo giorno del prezzo di lancio, "AAAA-MM-GG" (per esempio "2026-12-31").
//   Vuota = nessun prezzo di lancio.
// - vantaggi: l'elenco completo, una riga per voce. breve: una riga per il riepilogo della sfida.
var OFFERTA = {
  scadenzaLancio: "",
  pacchetti: [
    {
      nome: "Trimestrale", mesi: 3, prezzo: null, prezzoLancio: null,
      breve: "Piano su misura, test rivisti, il Quaderno con la tua password.",
      vantaggi: [
        "Piano su misura, costruito dal questionario di partenza",
        "Test iniziali filmati e rivisti",
        "Password personale al Quaderno: programma di 12 settimane, player, schede animate, diario, PDF",
        "Controllo video a ogni prova di fine blocco",
        "Risposte in chat entro 48 ore"
      ]
    },
    {
      nome: "6 mesi", mesi: 6, prezzo: null, prezzoLancio: null,
      breve: "Tutto il trimestrale, un secondo ciclo e una videochiamata al mese.",
      vantaggi: [
        "Tutto il trimestrale",
        "Un secondo ciclo costruito sui risultati del primo",
        "Una videochiamata di 30 minuti al mese"
      ]
    },
    {
      nome: "1 anno", mesi: 12, prezzo: null, prezzoLancio: null,
      breve: "Tutto il 6 mesi, quattro cicli completi, le sfide nuove in anteprima.",
      vantaggi: [
        "Tutto il 6 mesi",
        "Quattro cicli completi",
        "Le sfide nuove in anteprima",
        "Priorità per il one to one"
      ]
    }
  ],
  oneToOne: "Sessioni dal vivo, online o in presenza. Su richiesta."
};

// ---- Da qui in giù non serve toccare niente ----
(function (W) {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function num(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : null; }
  // La fine dell'ultimo giorno valido, nell'ora del telefono; null se la data manca o non si legge.
  function fineGiorno(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999);
    return isNaN(d.getTime()) || d.getDate() !== +m[3] ? null : d;
  }
  function euro(v) {
    var intero = Math.round(v * 100) % 100 === 0;
    try { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: intero ? 0 : 2, maximumFractionDigits: intero ? 0 : 2 }).format(v); }
    catch (e) { return (intero ? String(Math.round(v)) : v.toFixed(2).replace(".", ",")) + " €"; }
  }
  function giorno(d) {
    try { return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(); }
  }
  function conf() { return W.OFFERTA && W.OFFERTA.pacchetti ? W.OFFERTA : { pacchetti: [] }; }
  // Il prezzo da mostrare per un pacchetto, deciso solo dalla configurazione e dalla data di oggi.
  function prezzoDi(p, ora) {
    var pieno = num(p.prezzo), lancio = num(p.prezzoLancio), fine = fineGiorno(conf().scadenzaLancio);
    if (!pieno) return null;
    var attivo = !!(lancio && fine && lancio < pieno && (ora || new Date()) <= fine);
    var vale = attivo ? lancio : pieno, mesi = num(p.mesi);
    return { pieno: pieno, vale: vale, lancio: attivo, fino: attivo ? fine : null, alMese: mesi ? vale / mesi : null };
  }
  function lancioAttivo(ora) { return conf().pacchetti.some(function (p) { var x = prezzoDi(p, ora); return x && x.lancio; }); }
  function bloccoPrezzo(x) {
    if (!x) return '<p class="pac-prezzo"><span class="pac-dm">Il prezzo te lo scrivo in DM</span></p>';
    var h = '<p class="pac-prezzo">';
    if (x.lancio) h += '<s class="pac-pieno" aria-label="prezzo pieno ' + esc(euro(x.pieno)) + '">' + esc(euro(x.pieno)) + "</s> ";
    h += '<b class="pac-euro">' + esc(euro(x.vale)) + "</b>";
    if (x.alMese && x.alMese !== x.vale) h += '<span class="pac-mese">' + esc(euro(x.alMese)) + " al mese</span>";
    if (x.lancio) h += '<span class="pac-fino">Prezzo di lancio fino al ' + esc(giorno(x.fino)) + "</span>";
    return h + "</p>";
  }
  // I pacchetti dentro el. opz.breve: una riga per pacchetto (per il riepilogo della sfida).
  function pacchetti(el, opz) {
    if (!el) return;
    opz = opz || {};
    var c = conf(), ora = opz.ora || new Date(), h = '<div class="pac-griglia' + (opz.breve ? " breve" : "") + '">';
    c.pacchetti.forEach(function (p, i) {
      var x = prezzoDi(p, ora), mesi = num(p.mesi);
      h += '<article class="pac' + (i === c.pacchetti.length - 1 ? " pac-lungo" : "") + '">';
      // la durata accanto al nome, se il nome non la dice già («6 mesi»)
      var durata = mesi && String(p.nome).toLowerCase().indexOf(mesi + " mes") === -1 ? mesi + (mesi === 1 ? " mese" : " mesi") : "";
      h += '<div class="pac-testa"><h3>' + esc(p.nome) + "</h3>" + (durata ? '<span class="pac-durata">' + durata + "</span>" : "") + "</div>";
      h += bloccoPrezzo(x);
      if (opz.breve) h += '<p class="pac-breve">' + esc(p.breve || (p.vantaggi || []).join(", ")) + "</p>";
      else h += "<ul>" + (p.vantaggi || []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>";
      h += "</article>";
    });
    h += "</div>";
    if (lancioAttivo(ora)) h += '<p class="pac-nota">Prezzo di lancio valido fino alla data indicata.</p>';
    el.innerHTML = h;
  }
  // Il profilo: { url, nome } se c'è, altrimenti null.
  function profilo() {
    var u = String(W.INSTAGRAM || "").trim();
    if (!/^https?:\/\//i.test(u)) return null;
    var m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(u);
    return { url: u, nome: m ? "@" + m[1] : "il profilo" };
  }
  // Ogni elemento con data-ig diventa un link al profilo (con data-ig-testo come testo), oppure resta
  // testo con «(profilo in arrivo)». data-ig-nome riceve il nome del profilo, per esempio @nome.
  function contatti(root) {
    root = root || document;
    var p = profilo();
    Array.prototype.forEach.call(root.querySelectorAll("[data-ig]"), function (el) {
      var testo = el.getAttribute("data-ig-testo") || "Scrivi PIANO su Instagram";
      if (p) {
        var a = document.createElement("a");
        a.href = p.url; a.target = "_blank"; a.rel = "noopener"; a.className = el.className; a.textContent = testo;
        el.parentNode.replaceChild(a, el);
      } else {
        el.textContent = testo + " (profilo in arrivo)";
        el.classList.add("ig-attesa");
      }
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-ig-nome]"), function (el) { el.textContent = p ? p.nome : "il profilo del Quaderno (in arrivo)"; });
  }
  function haPrezzi() { return conf().pacchetti.some(function (p) { return !!num(p.prezzo); }); }
  W.QGOfferta = { pacchetti: pacchetti, contatti: contatti, profilo: profilo, prezzoDi: prezzoDi, lancioAttivo: lancioAttivo, haPrezzi: haPrezzi, oneToOne: function () { return conf().oneToOne || ""; } };
})(window);
