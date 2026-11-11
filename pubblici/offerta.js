/* Prima le Radici: il contatto, il profilo Instagram e l'offerta del piano su misura.
   Lo leggono la pagina d'ingresso (index.html) e la sfida (sfida.html).
   Si cambiano solo i valori qui sotto, fino alla riga «Da qui in giù non serve toccare niente».
   Il README, sezione «La facciata e le sfide», spiega ogni voce. */

// Il contatto del progetto. Finché è tutto vuoto, al posto dei pulsanti resta l'invito a Instagram.
// - modulo: l'indirizzo intero di un modulo esterno, per esempio "https://…". Se c'è, i pulsanti
//   «Voglio il piano» e «Avvisami della prossima sfida» aprono il modulo.
// - email: l'indirizzo email del progetto. Se c'è solo l'email, le pagine la mostrano da copiare,
//   con il pulsante «Copia» e un link che apre l'app della posta.
var CONTATTO = { email: "", modulo: "" };

// L'indirizzo del profilo Instagram, per esempio "https://www.instagram.com/nomeprofilo/".
// Vuoto: al posto dei link compare «Scrivi PIANO su Instagram (profilo in arrivo)».
var INSTAGRAM = "";

// I tre pacchetti del piano su misura, nell'ordine in cui compaiono sulla pagina.
// - prezzo: il prezzo pieno in euro, un numero senza virgolette (90, oppure 89.5). null = non
//   ancora deciso: la pagina non mostra numeri e scrive una riga sola, «I prezzi escono presto.».
// - prezzoLancio: il prezzo di lancio. Compare, con «fino al …» e il prezzo pieno dal giorno dopo,
//   solo se ci sono prezzo, prezzoLancio e scadenzaLancio e la data del telefono non ha superato la
//   scadenza. Il giorno dopo la scadenza sparisce da solo. Il prezzo pieno non si barra mai.
// - scadenzaLancio: l'ultimo giorno del prezzo di lancio, "AAAA-MM-GG" (per esempio "2026-12-31").
//   Vuota = nessun prezzo di lancio.
// - rate: in quante rate si può pagare, per esempio 2. null = la riga non compare.
// - consigliato: true sul pacchetto da mettere in evidenza (uno solo).
// - vantaggi: l'elenco completo, una riga per voce. breve: una riga per il riepilogo della sfida.
// - garanzia: il testo della garanzia. Vuoto = non compare.
// - domande: le risposte a tre domande frequenti. Ogni domanda compare solo se la risposta c'è.
var OFFERTA = {
  scadenzaLancio: "",
  pacchetti: [
    {
      nome: "1 anno", mesi: 12, prezzo: null, prezzoLancio: null, rate: null, consigliato: false,
      breve: "Tutto il 6 mesi per 12 mesi: fino a quattro cicli rifatti sui tuoi test, prezzo bloccato ai rinnovi, le sfide una settimana prima.",
      vantaggi: [
        "Tutto il 6 mesi, per 12 mesi: fino a quattro cicli di 12 settimane, ognuno rifatto sui tuoi test, con gli esercizi del Quaderno",
        "La videochiamata a fine ciclo, a ogni ciclo",
        "Prezzo bloccato ai rinnovi",
        "Le sfide del mese una settimana prima degli altri",
        "Il tuo «prima e dopo» di fine anno: tutti i tuoi test a confronto, solo per te",
        "Priorità sul one to one"
      ]
    },
    {
      nome: "6 mesi", mesi: 6, prezzo: null, prezzoLancio: null, rate: null, consigliato: true,
      breve: "Tutto il 3 mesi, una videochiamata a fine ciclo e un secondo ciclo di 12 settimane rifatto sui tuoi test.",
      vantaggi: [
        "Tutto il 3 mesi",
        "Una videochiamata a fine ciclo: rivediamo insieme i test e impostiamo il ciclo dopo",
        "Un secondo ciclo di 12 settimane, rifatto sui tuoi test: nuovo accento e dosi aggiornate, con gli esercizi del Quaderno"
      ]
    },
    {
      nome: "3 mesi", mesi: 3, prezzo: null, prezzoLancio: null, rate: null, consigliato: false,
      breve: "Videochiamata di avvio, il tuo percorso nel Quaderno, 3 controlli video, chat con risposta entro 48 ore.",
      vantaggi: [
        "Questionario e videochiamata di avvio: i tuoi test, il tuo obiettivo, il tuo tempo",
        "Il tuo percorso, adattato da un elenco chiaro: percorso, dosi, esercizi da togliere",
        "Il Quaderno con la tua password: 12 settimane in 3 blocchi, player guidato, 69 schede con figure animate, test e diario. Funziona anche senza internet",
        "3 controlli video, uno a fine blocco: mi mandi il video della prova e ti rispondo con le correzioni",
        "Chat: risposta entro 48 ore nei giorni feriali"
      ]
    }
  ],
  oneToOne: "Correzioni dal vivo, online o in presenza. Pochi posti: si entra dopo una chiamata di 15 minuti.",
  garanzia: "",
  domande: {
    chiMiSegue: "",      // «Chi mi segue?»
    recesso: "",         // «Posso cambiare idea dopo aver pagato?»
    durataAccesso: ""    // «Per quanto tempo posso usare il Quaderno?»
  }
};

// ---- Da qui in giù non serve toccare niente ----
(function (W) {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function num(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : null; }
  function testo(v) { return typeof v === "string" ? v.trim() : ""; }
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

  // ---- il contatto ----
  // { modulo, email }: ognuno c'è solo se si legge come indirizzo valido.
  function contatto() {
    var c = W.CONTATTO || {}, m = testo(c.modulo), e = testo(c.email);
    return {
      modulo: /^https?:\/\/[^\s"<>]+$/i.test(m) ? m : null,
      email: /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(e) ? e : null
    };
  }
  function haContatto() { var c = contatto(); return !!(c.modulo || c.email); }
  function mailto(email, oggetto, corpo) {
    return "mailto:" + email + "?subject=" + encodeURIComponent(oggetto) + (corpo ? "&body=" + encodeURIComponent(corpo) : "");
  }
  var AZIONI = { piano: "Richiedi un appuntamento", avvisi: "Avvisami della prossima sfida" };
  var OGGETTI = { piano: "Richiesta di appuntamento", avvisi: "Avvisami della prossima sfida" };
  // La mail già scritta della richiesta di appuntamento: senza dati sulla salute.
  function richiesta(pacchetto) {
    return "Ciao, vorrei fissare la videochiamata di avvio" + (pacchetto ? " per il pacchetto " + pacchetto : "") + ".\r\n\r\n" +
      "Giorni e orari in cui posso:\r\n\r\n" +
      "Sport che pratico (o «nessuno»):\r\n\r\n" +
      "Non scrivo qui informazioni sulla salute: il questionario arriva dopo, in un modulo.";
  }
  // Il pulsante del pacchetto: apre il modulo, o la mail già scritta col nome del pacchetto.
  function bottonePacchetto(p) {
    var c = contatto(), cls = "btn pac-cta" + (p.consigliato ? " primary" : "");
    if (c.modulo) return '<a class="' + cls + '" href="' + esc(c.modulo) + '" target="_blank" rel="noopener">' + AZIONI.piano + "</a>";
    if (c.email) return '<a class="' + cls + '" href="' + esc(mailto(c.email, OGGETTI.piano + " · " + p.nome, richiesta(p.nome))) + '">' + AZIONI.piano + "</a>";
    return "";
  }

  // ---- i prezzi ----
  // Il prezzo da mostrare per un pacchetto, deciso solo dalla configurazione e dalla data di oggi.
  function prezzoDi(p, ora) {
    var pieno = num(p.prezzo), lancio = num(p.prezzoLancio), fine = fineGiorno(conf().scadenzaLancio);
    if (!pieno) return null;
    var attivo = !!(lancio && fine && lancio < pieno && (ora || new Date()) <= fine);
    var vale = attivo ? lancio : pieno, mesi = num(p.mesi);
    return { pieno: pieno, vale: vale, lancio: attivo, fino: attivo ? fine : null, alMese: mesi ? vale / mesi : null };
  }
  function lancioAttivo(ora) { return conf().pacchetti.some(function (p) { var x = prezzoDi(p, ora); return x && x.lancio; }); }
  function haPrezzi() { return conf().pacchetti.some(function (p) { return !!num(p.prezzo); }); }
  function bloccoPrezzo(x) {
    if (!x) return "";
    // Niente prezzo barrato: un prezzo pieno mai praticato non si barra. Si dice invece fino a quando
    // vale il lancio e quanto costerà dal giorno dopo.
    var h = '<p class="pac-prezzo">';
    h += '<b class="pac-euro">' + esc(euro(x.vale)) + "</b>";
    if (x.alMese && x.alMese !== x.vale) h += '<span class="pac-mese">circa ' + esc(euro(Math.round(x.alMese))) + " al mese</span>";
    if (x.lancio) h += '<span class="pac-fino">Prezzo di lancio fino al ' + esc(giorno(x.fino)) + ". Dal " + esc(giorno(new Date(x.fino.getTime() + 1))) + ": " + esc(euro(x.pieno)) + "</span>";
    return h + "</p>";
  }
  // Finché i prezzi non ci sono: una riga sola. Col contatto acceso, l'invito a lasciare l'email.
  function presto() {
    var c = contatto(), h = '<p class="pac-presto">I prezzi escono presto.';
    var link = c.modulo ? '<a href="' + esc(c.modulo) + '" target="_blank" rel="noopener">'
      : c.email ? '<a href="' + esc(mailto(c.email, "Avvisami dei prezzi")) + '">' : "";
    if (link) h += " " + link + "Lascia l'email</a>: te li mando per primo, col prezzo di lancio.";
    return h + "</p>";
  }
  // I pacchetti dentro el. opz.breve: una riga per pacchetto (per il riepilogo della sfida).
  function pacchetti(el, opz) {
    if (!el) return;
    opz = opz || {};
    var c = conf(), ora = opz.ora || new Date(), h = '<div class="pac-griglia' + (opz.breve ? " breve" : "") + '">';
    c.pacchetti.forEach(function (p) {
      var x = prezzoDi(p, ora), mesi = num(p.mesi), rate = Math.floor(num(p.rate) || 0);
      h += '<article class="pac' + (p.consigliato ? " pac-consigliato" : "") + '">';
      // la durata accanto al nome, se il nome non la dice già («6 mesi»)
      var durata = mesi && String(p.nome).toLowerCase().indexOf(mesi + " mes") === -1 ? mesi + (mesi === 1 ? " mese" : " mesi") : "";
      h += '<div class="pac-testa"><h3>' + esc(p.nome) + "</h3>" + (durata ? '<span class="pac-durata">' + durata + "</span>" : "") +
        (p.consigliato ? '<span class="pac-badge">Consigliato</span>' : "") + "</div>";
      h += bloccoPrezzo(x);
      if (rate >= 2) h += '<p class="pac-rate">Anche in ' + rate + " rate</p>";
      if (opz.breve) h += '<p class="pac-breve">' + esc(p.breve || (p.vantaggi || []).join(", ")) + "</p>";
      else h += '<p class="pac-cosa">Cosa hai a disposizione</p><ul>' + (p.vantaggi || []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>";
      h += bottonePacchetto(p);
      h += "</article>";
    });
    h += "</div>";
    // finché i prezzi non ci sono, la riga sola sta sopra i pacchetti
    if (!haPrezzi()) h = presto() + h;
    if (lancioAttivo(ora)) h += '<p class="pac-nota">Prezzo di lancio valido fino alla data indicata.</p>';
    var g = testo(c.garanzia);
    if (g) h += '<p class="pac-garanzia"><b>Garanzia.</b> ' + esc(g) + "</p>";
    el.innerHTML = h;
  }

  // ---- il profilo Instagram ----
  // { url, nome } se c'è, altrimenti null.
  function profilo() {
    var u = String(W.INSTAGRAM || "").trim();
    if (!/^https?:\/\//i.test(u)) return null;
    var m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(u);
    return { url: u, nome: m ? "@" + m[1] : "il profilo" };
  }

  // Copia l'indirizzo; se il browser non lo permette, lo seleziona perché si copi a mano.
  function copia(span, esito) {
    function seleziona() {
      try { var r = document.createRange(); r.selectNodeContents(span); var s = W.getSelection(); s.removeAllRanges(); s.addRange(r); return document.execCommand("copy"); }
      catch (e) { return false; }
    }
    function fatto(ok) { esito.textContent = ok ? "Indirizzo copiato." : "Tieni premuto l'indirizzo per copiarlo."; }
    var t = span.textContent;
    if (navigator.clipboard && W.isSecureContext) navigator.clipboard.writeText(t).then(function () { fatto(true); }, function () { fatto(seleziona()); });
    else fatto(seleziona());
  }
  // Un elemento con data-contatto="piano avvisi" riceve i pulsanti del contatto acceso:
  // - col modulo, un pulsante per azione che apre il modulo (il primo è grande se l'elemento ha
  //   la classe cta-forte);
  // - con la sola email, l'indirizzo da copiare e un link per azione che apre la posta.
  // Senza contatto resta quello che c'è dentro (di solito l'invito a Instagram).
  function pulsanti(el, c) {
    var tipi = (el.getAttribute("data-contatto") || "piano").split(/\s+/).filter(function (t) { return AZIONI[t]; });
    var forte = el.classList.contains("cta-forte"), h = "";
    if (c.modulo) {
      tipi.forEach(function (t, i) {
        h += '<a class="btn' + (forte && i === 0 ? " primary grande" : "") + '" href="' + esc(c.modulo) + '" target="_blank" rel="noopener">' + AZIONI[t] + "</a>";
      });
    } else {
      h += '<div class="ce"><p class="ce-riga"><span class="ce-ind">' + esc(c.email) + '</span>' +
        '<button class="btn ce-copia" type="button">Copia</button></p>' +
        '<p class="ce-link">' + tipi.map(function (t) { return '<a href="' + esc(mailto(c.email, OGGETTI[t], t === "piano" ? richiesta("") : "")) + '">' + AZIONI[t] + "</a>"; }).join('<span aria-hidden="true"> · </span>') + "</p>" +
        '<p class="ce-esito" role="status" aria-live="polite"></p></div>';
    }
    el.innerHTML = h;
    el.classList.add("contatto-acceso");
    var b = el.querySelector(".ce-copia");
    if (b) b.addEventListener("click", function () { copia(el.querySelector(".ce-ind"), el.querySelector(".ce-esito")); });
  }
  // data-se mostra o nasconde un elemento secondo la configurazione. Valori: modulo, email,
  // contatto, vuoto (nessun contatto), ig, no-ig, prezzi, senza-prezzi. Spazio = tutti veri;
  // «|» = almeno uno, per esempio data-se="ig|vuoto".
  function vale(cond, s) {
    return String(cond).split("|").some(function (gruppo) {
      return gruppo.trim().split(/\s+/).every(function (v) { return !!s[v]; });
    });
  }
  function contatti(root) {
    root = root || document;
    var c = contatto(), p = profilo(), acceso = !!(c.modulo || c.email), prezzi = haPrezzi();
    var s = { modulo: !!c.modulo, email: !c.modulo && !!c.email, contatto: acceso, vuoto: !acceso, ig: !!p, "no-ig": !p, prezzi: prezzi, "senza-prezzi": !prezzi };
    if (acceso) Array.prototype.forEach.call(root.querySelectorAll("[data-contatto]"), function (el) { pulsanti(el, c); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-se]"), function (el) { el.hidden = !vale(el.getAttribute("data-se"), s); });
    // Ogni elemento con data-ig diventa un link al profilo (con data-ig-testo come testo), oppure resta
    // testo con «(profilo in arrivo)». data-ig-nome riceve il nome del profilo, per esempio @nome.
    Array.prototype.forEach.call(root.querySelectorAll("[data-ig]"), function (el) {
      var t = el.getAttribute("data-ig-testo") || "Scrivi PIANO su Instagram";
      if (p) {
        var a = document.createElement("a");
        a.href = p.url; a.target = "_blank"; a.rel = "noopener"; a.className = el.className; a.textContent = t;
        el.parentNode.replaceChild(a, el);
      } else {
        el.textContent = t + " (profilo in arrivo)";
        el.classList.add("ig-attesa");
      }
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-ig-nome]"), function (el) { el.textContent = p ? p.nome : "il profilo del Quaderno (in arrivo)"; });
  }
  // Le domande frequenti che dipendono dalla configurazione: si aggiungono in fondo a el solo se
  // la risposta è scritta.
  var DOMANDE = [
    ["chiMiSegue", "Chi mi segue?"],
    ["recesso", "Posso cambiare idea dopo aver pagato?"],
    ["durataAccesso", "Per quanto tempo posso usare il Quaderno?"]
  ];
  function domande(el) {
    if (!el) return;
    var d = conf().domande || {};
    DOMANDE.forEach(function (q) {
      var r = testo(d[q[0]]);
      if (!r) return;
      var x = document.createElement("details");
      x.innerHTML = "<summary>" + esc(q[1]) + "</summary><p>" + esc(r) + "</p>";
      el.appendChild(x);
    });
  }
  W.QGOfferta = {
    pacchetti: pacchetti, contatti: contatti, domande: domande, profilo: profilo, contatto: contatto,
    haContatto: haContatto, prezzoDi: prezzoDi, lancioAttivo: lancioAttivo, haPrezzi: haPrezzi,
    oneToOne: function () { return testo(conf().oneToOne); }
  };
})(window);
