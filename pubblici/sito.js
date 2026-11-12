/* Prima le Radici: le pagine «Le pillole» (pillole.html) e i quattro percorsi (percorso-*.html).
   Dati: pillole.js (window.QGPillole). Contatto e percorsi attivi: offerta.js (window.QGOfferta).
   Figure: figure.js, caricato dopo il primo disegno; senza figure resta il testo di ripiego.
   Memoria del browser, sempre dentro try/catch: legge qg-parto (le risposte di «Da dove parto?»),
   qg-sfida-respiro (per il passo dopo la routine guidata) e qg-chiave (il codice ricordato, solo per
   sapere se c'è); scrive qg-bolt (il test del respiro, come la home e la sfida) e qg-routine (l'ultima
   routine finita, che la home usa per il passo dopo). Nessun dato esce dal telefono. */
(function (W, D) {
  "use strict";
  var P = W.QGPillole && W.QGPillole.strutture ? W.QGPillole : null;
  var PAGINA = D.body.getAttribute("data-pagina") || "";
  var ID_PERCORSO = D.body.getAttribute("data-percorso") || "";
  // La routine guidata dell'imbuto: pillole.html?guidata=1#routine-{struttura} parte da sola, dopo
  // pochi secondi per mettersi in posizione, e alla fine propone un passo solo: la sfida.
  var GUIDATA = PAGINA === "pillole" && /(?:^|&)guidata=1(?:&|$)/.test(location.search.slice(1));

  // ---- costanti delle pagine ----
  var FILE_PERCORSO = { "benessere": "percorso-benessere.html", "corsa-e-fiato": "percorso-corsa.html", "combattimento": "percorso-combattimento.html", "forza-e-scatti": "percorso-forza.html" };
  // «Da dove parto?»: l'obiettivo sceglie percorso e struttura (02-esperienza.md, 3.3). Uguale nella home.
  var OBIETTIVI = {
    scrivania: { percorso: "benessere", struttura: "collo-e-spalle" },
    calma: { percorso: "benessere", struttura: "respiro-basso" },
    corsa: { percorso: "corsa-e-fiato", struttura: "piede-che-tiene" },
    combattimento: { percorso: "combattimento", struttura: "anche-libere" },
    forza: { percorso: "forza-e-scatti", struttura: "tronco-e-glutei" }
  };
  var TEMPI = ["breve", "base", "pieno"], LIVELLI = ["inizio", "medio", "avanzato"];
  // La pillola che chiede prima un test: il collo contro gravità, dopo il test del collo.
  var TEST_PRIMA = { E45: { test: "T13", breve: "Collo contro gravità" } };
  // Figure dei test: solo T13, con le scritte corrette («se fa male: fermati»). Restano senza figura
  // T14 (la figura appoggia sulla mano, il test gratuito dice «su un gomito») e T4 (la figura di E21
  // dice «un minuto per gamba», il test gratuito si ferma a 30 secondi).
  var FIGURA_TEST = { T13: "T13" };
  // Esercizi senza figura nella parte gratuita: nessuno. E33 ora è la versione in piedi (la seduta è E33S).
  var SENZA_FIGURA = {};
  var AVVISO_BOLT = "<b>Saltalo</b> se sei in gravidanza, hai problemi di cuore o pressione non controllata, se ti capita di svenire, se hai epilessia o attacchi di panico: chiedi prima al medico. Mai in acqua o alla guida.";
  var AVVISI_TEST = { T1: AVVISO_BOLT, T4: "<b>Attenzione.</b> Sempre vicino a un muro o a una sedia. Con l'epilessia, mai a occhi chiusi da solo. Con il diabete e i piedi poco sensibili, tieni le scarpe." };
  var BOLT = "qg-bolt";

  function $(id) { return D.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function due(n) { return (n < 10 ? "0" : "") + n; }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + due(sec % 60); }
  function mmssMs(ms) { return mmss(Math.ceil(Math.max(0, ms) / 1000)); }
  function secondi(ms) { return (ms / 1000).toFixed(1).replace(".", ",") + " s"; }
  function somma(passi) { return (passi || []).reduce(function (t, x) { return t + (x.durataSec || 0); }, 0); }
  function leggi(n, k) { try { var m = W[n]; return m ? m.getItem(k) : null; } catch (e) { return null; } }
  function leggiJSON(k) { try { return JSON.parse(leggi("localStorage", k) || "null"); } catch (e) { return null; } }
  function scriviJSON(k, v) { try { W.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function primaFrase(s) { var m = /^[^.!?]*[.!?]/.exec(String(s || "")); return m ? m[0] : String(s || ""); }
  function fuoco(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (x) {} } }
  function lista(v) { return Array.isArray(v) ? v : v ? [String(v)] : []; }

  // ---- i dati, per codice ----
  var STR = {}, PIL = {}, TST = {};
  if (P) {
    P.strutture.forEach(function (s) {
      STR[s.id] = s;
      (s.pillole || []).forEach(function (p, i) { if (!PIL[p.cod]) PIL[p.cod] = { p: p, s: s, i: i }; });
    });
    (P.test || []).forEach(function (t) { TST[t.cod] = t; });
  }
  function percorso() {
    if (!P || !P.percorsi) return null;
    for (var i = 0; i < P.percorsi.length; i++) if (P.percorsi[i].id === ID_PERCORSO) return P.percorsi[i];
    return null;
  }
  // Le pillole della sessione tipo, nell'ordine in cui compaiono, una volta sola.
  function pillolePercorso() {
    var pc = percorso(), l = [];
    if (pc) pc.sessione.forEach(function (x) { if (x.cod !== "cambio" && PIL[x.cod] && l.indexOf(x.cod) === -1) l.push(x.cod); });
    return l;
  }
  function strutturaDelTest(cod) {
    if (!P) return "";
    for (var i = 0; i < P.strutture.length; i++) if (lista(P.strutture[i].test).indexOf(cod) !== -1) return P.strutture[i].id;
    return "test";
  }

  // ---- «Da dove parto?»: si legge soltanto ----
  function parto() {
    var v = leggiJSON("qg-parto");
    if (!v || typeof v !== "object" || v.v !== 1 || typeof v.obiettivo !== "string" || !Object.prototype.hasOwnProperty.call(OBIETTIVI, v.obiettivo) ||
      TEMPI.indexOf(v.tempo) === -1 || LIVELLI.indexOf(v.allenamento) === -1) return null;
    return OBIETTIVI[v.obiettivo];
  }

  // ---- testata: con un codice ricordato, «Il tuo Quaderno» ----
  function testata() {
    var a = $("vai-accesso");
    if (a && (leggi("localStorage", "qg-chiave") || leggi("sessionStorage", "qg-chiave"))) { a.textContent = "Il tuo Quaderno"; a.setAttribute("href", "./"); }
  }

  // ---- il passo dopo la routine guidata: la sfida (stato in qg-sfida-respiro, scritto dalla sfida) ----
  // «Azione · durata»: la durata va sotto, più piccola.
  function conDurata(t) { var i = t.indexOf(" · "); return i > 0 ? esc(t.slice(0, i)) + '<small class="dur">' + esc(t.slice(i + 3)) + "</small>" : esc(t); }
  function oggiIso() { var d = new Date(); return d.getFullYear() + "-" + due(d.getMonth() + 1) + "-" + due(d.getDate()); }
  function passoSfida() {
    var s = leggiJSON("qg-sfida-respiro");
    if (!s || typeof s !== "object" || !Array.isArray(s.fatti)) return { t: "Continua domani con la sfida · giorno 1 di 7, 3 minuti", h: "sfida.html", cal: true,
      frase: "Il passo dopo è la sfida di 7 giorni: 3 minuti al giorno, sempre la stessa routine, e due test il primo e l'ultimo giorno per confrontare i numeri." };
    var f = s.fatti.filter(function (d) { return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d); });
    var n = Math.min(7, f.length), fattoOggi = f.indexOf(oggiIso()) !== -1;
    if (n >= 7) return { t: "Richiedi un appuntamento · in videochiamata", h: "piano.html", frase: "Hai già fatto la sfida di 7 giorni. Il passo dopo è un programma su misura." };
    if (fattoOggi) return { t: "Continua domani con la sfida · giorno " + (n + 1) + " di 7", h: "sfida.html", cal: !s.ora, frase: "Oggi hai già fatto il giorno " + n + " della sfida." };
    return { t: "Continua la sfida · giorno " + (n + 1) + " di 7", h: "sfida.html", frase: "Oggi tocca al giorno " + (n + 1) + " della sfida: 3 minuti." };
  }
  // Promemoria della sfida nel calendario: un file .ics creato qui, nessun dato inviato. Un evento al
  // giorno per 7 giorni, da domani, alla stessa ora di adesso (arrotondata ai 5 minuti).
  function testoIcs(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function piega(riga) {
    var out = "", n = 0;
    for (var i = 0; i < riga.length;) {
      var cp = riga.codePointAt(i), ch = String.fromCodePoint(cp), len = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
      if (n + len > 75) { out += "\r\n "; n = 1; }
      out += ch; n += len; i += ch.length;
    }
    return out;
  }
  function calendarioSfida(esito) {
    var d = new Date(); d.setDate(d.getDate() + 1); d.setSeconds(0, 0); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    var url = new URL("sfida.html", location.href).href, ora = due(d.getHours()) + ":" + due(d.getMinutes());
    function loc(x) { return x.getFullYear() + due(x.getMonth() + 1) + due(x.getDate()) + "T" + due(x.getHours()) + due(x.getMinutes()) + "00"; }
    function utc(x) { return x.getUTCFullYear() + due(x.getUTCMonth() + 1) + due(x.getUTCDate()) + "T" + due(x.getUTCHours()) + due(x.getUTCMinutes()) + due(x.getUTCSeconds()) + "Z"; }
    var r = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Prima le Radici//Respiro al muro//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      "UID:" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "@primaleradici", "DTSTAMP:" + utc(new Date()), "DTSTART:" + loc(d),
      "DURATION:PT5M", "RRULE:FREQ=DAILY;COUNT=7", "SUMMARY:" + testoIcs("Respiro al muro: 3 minuti"),
      "DESCRIPTION:" + testoIcs("La sfida di 7 giorni, un giorno alla volta. Apri la sfida: " + url), "URL:" + url, "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + testoIcs("Respiro al muro: 3 minuti"), "TRIGGER:PT0S", "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
    var testo = r.map(piega).join("\r\n") + "\r\n";
    try {
      var u = URL.createObjectURL(new Blob([testo], { type: "text/calendar;charset=utf-8" })), a = D.createElement("a");
      a.href = u; a.download = "sfida-7-giorni.ics"; a.rel = "noopener";
      D.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
      if (esito) esito.textContent = "7 promemoria alle " + ora + ", da domani. Apri il file «sfida-7-giorni.ics» e aggiungilo al calendario.";
    } catch (e) { if (esito) esito.textContent = "Questo browser non riesce a creare il file del calendario."; }
  }

  // ---- figure ----
  var figPronte = false, inCoda = [];
  function conFigure(fn) { if (figPronte) { try { fn(); } catch (e) {} } else inCoda.push(fn); }
  function caricaFigure() {
    var s = D.createElement("script");
    s.src = "figure.js";
    s.onload = function () {
      figPronte = !!W.QGFig;
      var l = inCoda; inCoda = [];
      if (figPronte) l.forEach(function (f) { try { f(); } catch (e) {} });
    };
    s.onerror = function () { inCoda = []; };
    D.body.appendChild(s);
  }
  // L'istante del fotogramma fermo: a metà della seconda fase dell'animazione.
  function tempoFoto(id) {
    try {
      var f = W.QGFig.info(id).fasi;
      return f.length > 1 ? f[0].d + f[1].d / 2 : f[0].d / 2;
    } catch (e) { return 0; }
  }
  function foto(el, id) {
    if (SENZA_FIGURA[id]) return;
    conFigure(function () {
      var h = W.QGFig.frame(id, tempoFoto(id));
      if (!h) return;
      el.innerHTML = h;
      var svg = el.querySelector("svg");
      if (svg) { svg.setAttribute("aria-hidden", "true"); svg.removeAttribute("role"); svg.removeAttribute("aria-label"); }
    });
  }
  function fotoTutte(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-foto]"), function (el) { foto(el, el.getAttribute("data-foto")); });
  }
  // Una figura animata, col ripiego testuale finché figure.js non arriva (o se la figura non c'è).
  function montaFigura(el, cod, nome, testo) {
    el.setAttribute("data-anim", cod);
    el.innerHTML = '<div class="fig-fb"><b>' + esc(nome) + "</b>" + (testo ? "<span>" + esc(testo) + "</span>" : "") + "</div>";
    if (SENZA_FIGURA[cod]) return;
    conFigure(function () { if (el.getAttribute("data-anim") === cod && el.isConnected !== false) W.QGFig.mount(el); });
  }

  // ---- schermo acceso dove si può (come nella sfida) ----
  var lock = null, vuole = false;
  function sveglio(si) {
    vuole = si;
    try {
      if (si) {
        if (lock || !navigator.wakeLock || !navigator.wakeLock.request) return;
        navigator.wakeLock.request("screen").then(function (l) {
          lock = l;
          try { l.addEventListener("release", function () { if (lock === l) lock = null; }); } catch (e) {}
          if (!vuole) { lock = null; l.release().catch(function () {}); }
        }).catch(function () {});
      } else if (lock) { var l = lock; lock = null; l.release().catch(function () {}); }
    } catch (e) {}
  }
  D.addEventListener("visibilitychange", function () {
    if (D.visibilityState === "hidden" && F && F.pausa) F.pausa();
    if (D.visibilityState === "visible" && vuole) sveglio(true);
  });
  // La vibrazione breve a fine passo, solo se la pagina ha già ricevuto un tocco (altrimenti Chrome la
  // blocca e lo scrive in console).
  function vibra() {
    try {
      if (!navigator.vibrate) return;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(150);
    } catch (e) {}
  }

  // ================= la finestra: pillola, test, player =================
  var F = null;
  function finestra() {
    if (F) return F;
    var nativa = typeof W.HTMLDialogElement === "function" && typeof D.createElement("dialog").showModal === "function";
    var el = D.createElement(nativa ? "dialog" : "div");
    el.className = "finestra";
    if (!nativa) { el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); }
    el.innerHTML = '<div class="fin"></div>';
    D.body.appendChild(el);
    F = { el: el, box: el.firstChild, nativa: nativa, aperta: false, chiave: "", daTocco: false, chi: null, ferma: null, pausa: null, fig: D.createElement("figure") };
    F.fig.className = "fig";
    if (nativa) {
      el.addEventListener("cancel", function (e) { e.preventDefault(); chiudiDaUtente(); });
      // Se il browser la chiude da sé (per esempio un secondo Esc), si sistema l'indirizzo come per «Chiudi».
      el.addEventListener("close", function () { if (F.aperta) chiudiDaUtente(); });
    }
    el.addEventListener("keydown", function (e) {
      if (nativa) return;
      if (e.key === "Escape") { e.preventDefault(); chiudiDaUtente(); }
      if (e.key === "Tab") trappola(e);
    });
    return F;
  }
  // Senza <dialog>: il fuoco gira dentro la finestra.
  function trappola(e) {
    var l = Array.prototype.filter.call(F.el.querySelectorAll("button:not([disabled]), a[href], summary, [tabindex]:not([tabindex='-1'])"), function (x) { return x.offsetParent !== null; });
    if (!l.length) return;
    var a = l[0], z = l[l.length - 1];
    if (e.shiftKey && (D.activeElement === a || !F.el.contains(D.activeElement))) { e.preventDefault(); fuoco(z); }
    else if (!e.shiftKey && D.activeElement === z) { e.preventDefault(); fuoco(a); }
  }
  function mostraFinestra(classe, etichetta) {
    var f = finestra();
    var nuova = !f.aperta;
    f.aperta = true;
    f.el.className = "finestra" + (classe ? " " + classe : "") + (f.nativa ? "" : " aperta");
    f.el.setAttribute("aria-labelledby", etichetta);
    if (nuova) {
      D.documentElement.classList.add("finestra-aperta");
      if (f.nativa) { try { f.el.showModal(); } catch (e) { f.el.setAttribute("open", ""); } }
    }
  }
  function fermaDentro() {
    if (F.ferma) { try { F.ferma(); } catch (e) {} }
    F.ferma = null; F.pausa = null;
  }
  function chiudiFinestra() {
    if (!F || !F.aperta) return;
    fermaDentro();
    F.aperta = false; F.chiave = "";
    D.documentElement.classList.remove("finestra-aperta");
    if (F.nativa) { try { if (F.el.open) F.el.close(); } catch (e) { F.el.removeAttribute("open"); } }
    F.el.classList.remove("aperta");
    var chi = F.chi; F.chi = null; F.daTocco = false;
    if (chi && D.body.contains(chi)) fuoco(chi);
  }

  // ---- gli indirizzi: #E15, #T13, #routine-{struttura}, #sessione-{percorso} ----
  function chiaveDa(hash) {
    var h = String(hash || "").replace(/^#/, ""), m;
    try { h = decodeURIComponent(h); } catch (e) {}
    if (!P || !h) return null;
    if (PAGINA === "pillole") {
      if (TST[h]) return { tipo: "test", k: h, hash: h };
      if (PIL[h]) return { tipo: "pillola", k: h, hash: h };
      m = /^routine-(.+)$/.exec(h);
      if (m && STR[m[1]]) return { tipo: "routine", k: m[1], hash: h };
    } else if (PAGINA === "percorso") {
      if (PIL[h] && pillolePercorso().indexOf(h) !== -1) return { tipo: "pillola", k: h, hash: h };
      m = /^sessione-(.+)$/.exec(h);
      if (m && m[1] === ID_PERCORSO && percorso()) return { tipo: "sessione", k: m[1], hash: h };
    }
    return null;
  }
  function instrada() {
    var c = chiaveDa(location.hash);
    if (!c) { if (F && F.aperta) chiudiFinestra(); return; }
    if (F && F.aperta && F.chiave === c.hash) return;
    apri(c, false);
  }
  // Aprire con un tocco scrive l'indirizzo (pushState): il tasto Indietro del telefono chiude.
  // Dentro la finestra (precedente, successiva, il test del collo) l'indirizzo si sostituisce.
  function apri(c, daTocco, chi) {
    var f = finestra();
    if (daTocco) {
      try {
        if (f.aperta) history.replaceState({ qg: c.hash }, "", "#" + c.hash);
        else { history.pushState({ qg: c.hash }, "", "#" + c.hash); f.daTocco = true; f.chi = chi || D.activeElement; }
      } catch (e) {}
    } else if (!f.aperta) { f.daTocco = false; f.chi = null; }
    fermaDentro();
    f.chiave = c.hash;
    var player = c.tipo === "routine" || c.tipo === "sessione";
    // la routine guidata vale una volta: si toglie ?guidata=1 dall'indirizzo, così le altre routine della pagina partono a mano
    var guida = GUIDATA && c.tipo === "routine";
    if (GUIDATA) { GUIDATA = false; try { history.replaceState(history.state, "", location.pathname + location.hash); } catch (e) {} }
    if (c.tipo === "pillola") disegnaPillola(c.k);
    else if (c.tipo === "test") disegnaTest(c.k);
    else disegnaPlayer(c.tipo, c.k, guida);
    mostraFinestra(player ? "player" : "", player ? "pl-titolo" : "fin-t");
    fuoco($("fin-t"));
  }
  // «Chiudi», Esc: se l'aveva aperta un tocco si torna indietro; se la pagina è arrivata già con
  // l'indirizzo (un link da Instagram) si toglie il codice e si resta sulla struttura.
  function chiudiDaUtente() {
    if (!F || !F.aperta) return;
    var c = chiaveDa("#" + F.chiave);
    var st = null;
    try { st = history.state; } catch (e) {}
    if (F.daTocco && st && st.qg === F.chiave) {
      history.back();
      // se il browser non torna indietro (nessuna voce), si chiude lo stesso
      setTimeout(function () { if (F.aperta && !chiaveDa(location.hash)) chiudiFinestra(); }, 400);
      return;
    }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    var dove = "";
    if (c && c.tipo === "pillola") dove = PAGINA === "pillole" ? PIL[c.k].s.id : "sessione";
    else if (c && c.tipo === "test") dove = strutturaDelTest(c.k);
    else if (c && c.tipo === "routine") dove = c.k;
    else if (c && c.tipo === "sessione") dove = "sessione";
    var avevaChi = !!F.chi;
    chiudiFinestra();
    if (dove && !avevaChi) vaiA(dove);
  }
  function vaiA(id) {
    var s = $(id);
    if (!s) return;
    var h = s.querySelector("h2") || s;
    // salto secco, non lo scorrimento morbido: la pagina era già sotto la finestra
    try { s.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) { s.scrollIntoView(true); }
    if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
    fuoco(h);
  }
  function barra(testo) {
    return '<div class="fin-barra"><p>' + esc(testo) + '</p><button class="chiudi" type="button" data-azione="chiudi"><span aria-hidden="true">×</span><span class="sr">Chiudi</span></button></div>';
  }
  function piazzaFigura(cod, nome, testo) {
    var posto = F.box.querySelector(".posto-fig");
    if (!posto) return;
    posto.parentNode.replaceChild(F.fig, posto);
    F.fig.hidden = false;
    montaFigura(F.fig, cod, nome, testo);
  }
  var LUCCHETTO = '<svg class="lucchetto" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  // ---- la pillola aperta (4.4) ----
  function disegnaPillola(cod) {
    var x = PIL[cod], p = x.p, l, i, etichetta;
    if (PAGINA === "percorso") { l = pillolePercorso(); i = l.indexOf(cod); etichetta = "Sessione tipo · " + (i + 1) + " di " + l.length; }
    else { l = x.s.pillole.map(function (y) { return y.cod; }); i = x.i; etichetta = x.s.nome + " · " + (i + 1) + " di " + l.length; }
    var h = barra(etichetta) + '<div class="fin-corpo">';
    h += '<h2 id="fin-t" tabindex="-1">' + esc(p.nome) + "</h2>";
    var tp = TEST_PRIMA[cod];
    if (tp) h += '<p class="prima-test"><a href="' + (PAGINA === "pillole" ? "#" + tp.test : "pillole.html#" + tp.test) + '"' + (PAGINA === "pillole" ? ' data-apri="' + tp.test + '"' : "") + ">Prima fai il test del collo ›</a></p>";
    h += '<div class="posto-fig"></div>';
    if (p.avviso) h += '<div class="avviso"><p><b>Attenzione.</b> ' + esc(p.avviso) + "</p></div>";
    h += '<dl class="scheda"><dt>A cosa ti serve</dt><dd>' + esc(p.serve) + "</dd><dt>Come</dt><dd>" + esc(p.come) + "</dd><dt>Senti</dt><dd>" + esc(p.senti) +
      '</dd><dt class="ev">Evita</dt><dd>' + esc(p.evita) + '</dd><dt>Dose di prova, per due settimane <span class="origine">' + esc(p.origineDose) + "</span></dt><dd>" + esc(p.dose) + "</dd></dl>";
    var g = P.generale || {};
    if (g.frequenza) h += '<p class="piccolo"><b>Quante volte</b>' + (g.origineFrequenza ? ' <span class="origine">' + esc(g.origineFrequenza) + "</span>" : "") + " " + esc(g.frequenza) + "</p>";
    h += '<div class="di-piu">' + LUCCHETTO + '<p><b>Di più · nel Quaderno.</b> Perché si fa così, come sale la dose settimana per settimana, le parole del coach. Si apre col codice. <a href="piano.html">Come funziona ›</a></p></div>';
    h += '<div class="nav-fin"><button class="btn" type="button" data-vai="' + esc(l[i - 1] || "") + '"' + (i > 0 ? "" : " disabled") + '>‹ Precedente</button>' +
      '<button class="btn" type="button" data-vai="' + esc(l[i + 1] || "") + '"' + (i < l.length - 1 ? "" : " disabled") + ">Successiva ›</button></div>";
    F.box.innerHTML = h + "</div>";
    piazzaFigura(cod, p.nome, primaFrase(p.come));
  }

  // ---- la scheda di un test (4.5) ----
  function disegnaTest(cod) {
    var t = TST[cod];
    var h = barra("Test") + '<div class="fin-corpo"><h2 id="fin-t" tabindex="-1">' + esc(t.nome) + "</h2>";
    if (AVVISI_TEST[cod]) h += '<div class="avviso"><p>' + AVVISI_TEST[cod] + "</p></div>";
    if (FIGURA_TEST[cod]) h += '<div class="posto-fig"></div>';
    h += '<p class="dt-test">Come si fa</p><p>' + esc(t.come) + "</p>";
    var conStrumento = !!STRUMENTI[cod];
    if (conStrumento) h += '<div class="tool" id="fin-tool"></div>';
    h += '<p class="frase-test" id="fin-frase"' + (conStrumento ? " hidden" : "") + ">" + esc(t.frase) + "</p></div>";
    F.box.innerHTML = h;
    if (FIGURA_TEST[cod]) piazzaFigura(FIGURA_TEST[cod], t.nome, "");
    if (conStrumento) F.ferma = STRUMENTI[cod]($("fin-tool"), function () { var fr = $("fin-frase"); if (fr) fr.hidden = false; });
  }

  // ---- gli strumenti dei test ----
  function parti(box, html) { box.innerHTML = html; return box.children; }
  // BOLT: come nella home; il numero si arrotonda al secondo e si salva in qg-bolt (la sfida lo propone il giorno 1).
  function strumentoBolt(box, fatto) {
    var c = parti(box, '<p class="big" aria-live="off">0,0 s</p><button class="btn primary grande" type="button">Avvia apnea</button><p class="esito" aria-live="polite"></p>');
    var big = c[0], b = c[1], e = c[2], t0 = 0, raf = 0, provaBolt = 0;
    function gira() { big.textContent = secondi(performance.now() - t0); raf = requestAnimationFrame(gira); }
    b.addEventListener("click", function () {
      if (!t0) { t0 = performance.now(); b.textContent = "Stop: voglia di respirare"; e.textContent = ""; gira(); return; }
      cancelAnimationFrame(raf);
      var s = Math.round((performance.now() - t0) / 1000); t0 = 0;
      big.textContent = s + " s"; b.textContent = "Rifai";
      var l = leggiJSON(BOLT); l = Array.isArray(l) ? l : [];
      l.push({ data: new Date().toISOString(), valore: s });
      var ok = scriviJSON(BOLT, l.slice(-10));
      provaBolt++;
      e.textContent = s + (s === 1 ? " secondo" : " secondi") + (provaBolt === 1 ? ". Rifallo fra 5 minuti: vale la seconda prova." : ": il tuo punto di partenza.") + (ok ? " Salvato su questo dispositivo." : "");
      fatto();
    });
    return function () { cancelAnimationFrame(raf); t0 = 0; };
  }
  // Respiri al minuto: come nella sfida, un minuto e il pulsante grande a ogni inspirazione. Non si salva.
  function strumentoRespiri(box, fatto) {
    var c = parti(box, '<p class="big" aria-live="off">1:00</p><button class="btn primary grande" type="button">Avvia 60 s</button><button class="btn tocca" type="button" disabled>Inspiro · 0</button><p class="esito" aria-live="polite"></p>');
    var big = c[0], b = c[1], tap = c[2], e = c[3], n = 0, timer = 0;
    b.addEventListener("click", function () {
      var fine = performance.now() + 60000;
      n = 0; tap.disabled = false; tap.textContent = "Inspiro · 0"; e.textContent = ""; b.disabled = true; big.textContent = "1:00";
      sveglio(true);
      clearInterval(timer);
      timer = setInterval(function () {
        var r = fine - performance.now();
        if (r > 0) { big.textContent = mmssMs(r); return; }
        clearInterval(timer); timer = 0;
        big.textContent = "0:00"; tap.disabled = true; b.disabled = false; b.textContent = "Rifai";
        sveglio(false);
        e.textContent = n + " respiri al minuto.";
        fatto();
      }, 200);
    });
    tap.addEventListener("click", function () { n++; tap.textContent = "Inspiro · " + n; });
    return function () { clearInterval(timer); timer = 0; sveglio(false); };
  }
  // Equilibrio su una gamba: cronometro che si ferma da solo a 30 s, fino a 3 prove, la migliore. Non si salva.
  function strumentoEquilibrio(box, fatto) {
    var MAX = 30;
    var c = parti(box, '<p class="big" aria-live="off">0,0 s</p><button class="btn primary grande" type="button">Avvia</button><p class="esito" aria-live="polite"></p><p class="prove"></p>');
    var big = c[0], b = c[1], e = c[2], pr = c[3], prove = [], t0 = 0, raf = 0;
    function stop(sec) {
      cancelAnimationFrame(raf); t0 = 0;
      var s = Math.min(MAX, Math.round(sec));
      prove.push(s);
      big.textContent = s + " s";
      e.textContent = "Migliore: " + Math.max.apply(null, prove) + " s";
      pr.textContent = prove.map(function (v, i) { return "Prova " + (i + 1) + ": " + v + " s"; }).join(" · ");
      b.textContent = prove.length < 3 ? "Avvia la prova " + (prove.length + 1) : "Ricomincia";
      fatto();
    }
    function gira() {
      var s = (performance.now() - t0) / 1000;
      if (s >= MAX) { stop(MAX); return; }
      big.textContent = secondi(s * 1000);
      raf = requestAnimationFrame(gira);
    }
    b.addEventListener("click", function () {
      if (t0) { stop((performance.now() - t0) / 1000); return; }
      if (prove.length >= 3) { prove = []; pr.textContent = ""; e.textContent = ""; }
      t0 = performance.now(); b.textContent = "Stop"; gira();
    });
    return function () { cancelAnimationFrame(raf); t0 = 0; };
  }
  // Test del collo: un conto alla rovescia di 10 secondi. Non si salva.
  function strumentoCollo(box, fatto) {
    var c = parti(box, '<p class="big" aria-live="off">0:10</p><button class="btn primary grande" type="button">Avvia 10 secondi</button><p class="esito" aria-live="polite"></p>');
    var big = c[0], b = c[1], e = c[2], timer = 0;
    b.addEventListener("click", function () {
      var fine = performance.now() + 10000;
      b.disabled = true; e.textContent = ""; big.textContent = "0:10";
      clearInterval(timer);
      timer = setInterval(function () {
        var r = fine - performance.now();
        if (r > 0) { big.textContent = mmssMs(r); return; }
        clearInterval(timer); timer = 0;
        big.textContent = "0:00"; b.disabled = false; b.textContent = "Rifai";
        e.textContent = "10 secondi: poggia la testa.";
        fatto();
      }, 200);
    });
    return function () { clearInterval(timer); timer = 0; };
  }
  var STRUMENTI = { T1: strumentoBolt, T2: strumentoRespiri, T4: strumentoEquilibrio, T13: strumentoCollo };

  // ================= il player: routine e sessione tipo (5) =================
  function disegnaPlayer(tipo, id, guida) {
    var passi, titolo, nome, fineTesto, tornaTesto;
    if (tipo === "routine") {
      var s = STR[id]; passi = s.routine; nome = s.nome; titolo = s.nome + " · routine";
      tornaTesto = "Torna alle pillole";
    } else {
      var pc = percorso(); passi = pc.sessione; nome = pc.nome; titolo = "Sessione tipo · " + pc.nome;
      tornaTesto = "Torna al percorso";
    }
    var tot = somma(passi);
    fineTesto = tipo === "routine" ? mmss(tot) + " di " + nome + "." : mmss(tot) + ": la sessione tipo di " + nome + ".";
    var st = { i: 0, resta: passi[0].durataSec * 1000, corre: false, fine: 0, timer: 0, pronti: 0 };
    F.box.innerHTML = '<div class="fin-barra sinistra"><button class="chiudi" type="button" data-azione="chiudi"><span aria-hidden="true">×</span><span class="sr">Chiudi</span></button>' +
      '<p id="pl-titolo">' + esc(titolo) + '</p><p class="conta" id="pl-conta"></p></div><div class="fin-corpo" id="pl-corpo"></div><p class="sr" aria-live="polite" id="pl-voce"></p>';
    var corpo = $("pl-corpo"), conta = $("pl-conta"), voce = $("pl-voce"), el = {};

    function scheletro() {
      corpo.innerHTML = '<ol class="player-seg" aria-hidden="true">' + passi.map(function (y) { return '<li style="flex:' + y.durataSec + ' 1 0"></li>'; }).join("") + "</ol>" +
        '<div class="avviso"><p></p></div><div class="posto-fig"></div><div class="player-cambio" hidden><p class="pl-cnota"></p><p class="pl-poi"></p></div>' +
        '<h2 id="fin-t" class="player-nome" tabindex="-1"></h2><p class="player-nota"></p><p class="player-senti"></p>' +
        '<details class="player-det"><summary>Come si fa</summary><p></p></details>' +
        '<div class="player-piede"><p class="pl-pronti" hidden></p><p class="orologio" aria-live="off"></p><p class="pl-dopo"></p><div class="comandi"><button class="btn" type="button" data-pl="indietro">‹ Indietro</button>' +
        '<button class="btn primary" type="button" data-pl="via">Avvia</button><button class="btn" type="button" data-pl="avanti">Avanti ›</button></div>' +
        '<p class="fermati piccolo">Se senti dolore, fermati.</p></div>';
      var posto = corpo.querySelector(".posto-fig");
      posto.parentNode.replaceChild(F.fig, posto);
      el = {
        seg: corpo.querySelectorAll(".player-seg li"), cambio: corpo.querySelector(".player-cambio"), cnota: corpo.querySelector(".pl-cnota"), poi: corpo.querySelector(".pl-poi"),
        nome: $("fin-t"), nota: corpo.querySelector(".player-nota"), senti: corpo.querySelector(".player-senti"), det: corpo.querySelector(".player-det"),
        come: corpo.querySelector(".player-det p"), avv: corpo.querySelector(".avviso"), orologio: corpo.querySelector(".orologio"), pronti: corpo.querySelector(".pl-pronti"), dopo: corpo.querySelector(".pl-dopo"),
        indietro: corpo.querySelector('[data-pl="indietro"]'), via: corpo.querySelector('[data-pl="via"]')
      };
    }
    function nomePasso(x) { return x.cod === "cambio" ? "Cambio" : PIL[x.cod] ? PIL[x.cod].p.nome : x.cod; }
    function aggiornaVia() {
      var pieno = passi[st.i].durataSec * 1000;
      el.via.textContent = st.pronti ? "Parti ora" : st.corre ? "Pausa" : st.resta < pieno - 250 ? "Riprendi" : "Avvia";
    }
    // Routine guidata: qualche secondo per mettersi in posizione, poi parte da sola.
    function prepara() {
      var n = 5;
      function scrivi() { el.pronti.textContent = "Mettiti in posizione: si parte fra " + n + (n === 1 ? " secondo." : " secondi."); }
      el.pronti.hidden = false; scrivi();
      st.pronti = setInterval(function () { n--; if (n > 0) scrivi(); else via(); }, 1000);
      aggiornaVia();
    }
    function finePronti() { if (st.pronti) { clearInterval(st.pronti); st.pronti = 0; } if (el.pronti) el.pronti.hidden = true; }
    function aggiorna() {
      var x = passi[st.i], pil = x.cod !== "cambio" ? PIL[x.cod] : null, p = pil ? pil.p : null;
      Array.prototype.forEach.call(el.seg, function (li, j) { li.className = j < st.i ? "fatto" : j === st.i ? "ora" : ""; });
      conta.textContent = (st.i + 1) + "/" + passi.length;
      el.nome.textContent = p ? p.nome : "Cambio";
      F.fig.hidden = !p; el.cambio.hidden = !!p;
      el.senti.hidden = el.det.hidden = !p;
      el.nota.hidden = !p || !x.nota;
      if (p) {
        montaFigura(F.fig, x.cod, p.nome, primaFrase(p.come));
        el.nota.textContent = x.nota || "";
        el.senti.innerHTML = "<b>Senti:</b> " + esc(p.senti);
        el.come.textContent = p.come;
        el.det.open = false;
      } else {
        var dopo = passi[st.i + 1];
        el.cnota.textContent = x.nota || "";
        el.poi.innerHTML = dopo ? "<b>Poi:</b> " + esc(nomePasso(dopo)) : "";
      }
      // nei cambi si vede già l'avviso del passo dopo
      var prossimo = passi[st.i + 1], pa = p || (prossimo && PIL[prossimo.cod] ? PIL[prossimo.cod].p : null);
      el.avv.hidden = !(pa && pa.avviso);
      el.avv.firstChild.innerHTML = pa && pa.avviso ? "<b>Attenzione" + (p ? "" : ", nel prossimo passo") + ".</b> " + esc(pa.avviso) : "";
      el.orologio.textContent = mmssMs(st.resta);
      // l'esercizio dopo, sempre in vista (i cambi si saltano)
      var j = st.i + 1;
      while (j < passi.length && passi[j].cod === "cambio") j++;
      el.dopo.innerHTML = j < passi.length ? "<b>Poi:</b> " + esc(nomePasso(passi[j])) + (passi[j].nota ? " · " + esc(passi[j].nota) : "") : "<b>Poi:</b> fine";
      el.indietro.disabled = st.i === 0;
      aggiornaVia();
    }
    function annuncia() { voce.textContent = "Passo " + (st.i + 1) + " di " + passi.length + ": " + nomePasso(passi[st.i]) + ", " + mmss(passi[st.i].durataSec); }
    function tick() {
      var r = st.fine - performance.now();
      if (r > 0) { st.resta = r; el.orologio.textContent = mmssMs(r); return; }
      vibra();
      if (st.i >= passi.length - 1) { fatto(); return; }
      st.i++; st.resta = passi[st.i].durataSec * 1000; st.fine = performance.now() + st.resta;
      aggiorna(); annuncia();
    }
    function via() {
      finePronti();
      if (st.corre) { pausa(); return; }
      st.corre = true; st.fine = performance.now() + st.resta;
      clearInterval(st.timer); st.timer = setInterval(tick, 200);
      sveglio(true); aggiornaVia();
    }
    function pausa() {
      if (!st.corre) return;
      st.corre = false; clearInterval(st.timer); st.timer = 0;
      st.resta = Math.max(0, st.fine - performance.now());
      sveglio(false); aggiornaVia();
    }
    function vai(d) {
      var j = st.i + d;
      if (j < 0) return;
      if (j >= passi.length) { fatto(); return; }
      st.i = j; st.resta = passi[j].durataSec * 1000;
      if (st.corre) st.fine = performance.now() + st.resta;
      aggiorna(); annuncia();
    }
    function fatto() {
      finePronti();
      st.corre = false; clearInterval(st.timer); st.timer = 0; sveglio(false);
      if (F.fig._qg) F.fig._qg.play = false;
      if (tipo === "routine") scriviJSON("qg-routine", { v: 1, data: oggiIso(), struttura: id });
      conta.textContent = passi.length + "/" + passi.length;
      if (guida) { fineGuidata(); return; }
      corpo.innerHTML = '<div class="fatto-player"><h2 id="fin-t" tabindex="-1">Fatto</h2><p><b>' + esc(fineTesto) + "</b></p>" +
        "<p>Quanto farne e quando salire lo trovi nel Quaderno, adattato a te in videochiamata.</p>" +
        '<div class="bottoni"><button class="btn primary" type="button" data-pl="rifai">Rifalla</button><button class="btn" type="button" data-azione="chiudi">' + esc(tornaTesto) + "</button></div>" +
        '<p><a class="link-riga" href="piano.html">Come funziona il piano ›</a></p></div>';
      voce.textContent = "Fatto. " + fineTesto;
      fuoco($("fin-t"));
    }
    // La fine della routine guidata: che cosa hai fatto e un passo solo, la sfida.
    function fineGuidata() {
      var cods = [];
      passi.forEach(function (x) { if (x.cod !== "cambio" && cods.indexOf(x.cod) === -1) cods.push(x.cod); });
      var titolo = "Fatto: " + cods.length + " esercizi, " + Math.round(tot / 60) + " minuti.", dopo = passoSfida();
      corpo.innerHTML = '<div class="fatto-player fatto-guida"><h2 id="fin-t" tabindex="-1">' + esc(titolo) + "</h2><p>" + esc(dopo.frase) + "</p>" +
        '<a class="btn primary grande" href="' + esc(dopo.h) + '">' + conDurata(dopo.t) + "</a>" +
        '<p class="pl-link">' + (dopo.cal ? '<button class="link" type="button" data-pl="calendario">Aggiungi al calendario</button>' : "") +
        '<button class="link" type="button" data-pl="rifai">Rifai la routine</button><a href="piano.html">Il piano su misura</a></p>' +
        '<p class="pl-cal piccolo" role="status" aria-live="polite"></p></div>';
      voce.textContent = titolo;
      fuoco($("fin-t"));
    }
    function rifai() { finePronti(); st.i = 0; st.resta = passi[0].durataSec * 1000; st.corre = false; scheletro(); aggiorna(); fuoco($("fin-t")); }

    scheletro(); aggiorna();
    if (guida) prepara();
    F.player = { via: via, vai: vai, rifai: rifai, calendario: function () { calendarioSfida(corpo.querySelector(".pl-cal")); } };
    F.pausa = pausa;
    F.ferma = function () { finePronti(); st.corre = false; clearInterval(st.timer); st.timer = 0; sveglio(false); F.player = null; };
  }

  // ---- i tocchi: un ascoltatore solo per pagina e finestra ----
  D.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-apri],[data-routine],[data-sessione],[data-vai],[data-azione],[data-pl]") : null;
    if (!t) return;
    var dentro = F && F.el.contains(t);
    if (t.hasAttribute("data-azione")) { e.preventDefault(); chiudiDaUtente(); return; }
    if (t.hasAttribute("data-pl")) {
      var a = t.getAttribute("data-pl");
      if (F && F.player) { if (a === "via") F.player.via(); else if (a === "avanti") F.player.vai(1); else if (a === "indietro") F.player.vai(-1); else if (a === "rifai") F.player.rifai(); else if (a === "calendario") F.player.calendario(); }
      return;
    }
    var c = null;
    if (t.hasAttribute("data-vai")) c = chiaveDa("#" + t.getAttribute("data-vai"));
    else if (t.hasAttribute("data-apri")) c = chiaveDa("#" + t.getAttribute("data-apri"));
    else if (t.hasAttribute("data-routine")) c = chiaveDa("#routine-" + t.getAttribute("data-routine"));
    else if (t.hasAttribute("data-sessione")) c = chiaveDa("#sessione-" + t.getAttribute("data-sessione"));
    if (!c) return;
    e.preventDefault();
    apri(c, true, dentro ? null : t);
  });
  W.addEventListener("popstate", instrada);
  W.addEventListener("hashchange", instrada);

  // ================= la pagina «Le pillole» =================
  function cartaTest(cod, primaDi) {
    var t = TST[cod];
    if (!t) return "";
    return '<div class="riquadro tcard' + (primaDi ? " prima-di" : "") + '">' + (primaDi ? '<p class="prima">Prima di «' + esc(primaDi) + "»</p>" : "") +
      "<h3>" + esc(t.nome) + '</h3><p class="tcome">' + esc(t.come) + '</p><button class="btn" type="button" data-apri="' + esc(cod) + '" aria-label="Fai il test: ' + esc(t.nome) + '">Fai il test</button></div>';
  }
  function disegnaStruttura(s) {
    var sec = $(s.id);
    if (!sec) return;
    var corpo = sec.querySelector(".str-corpo");
    var test = lista(s.test).slice(), h = "";
    // il test che va fatto prima di una pillola sta prima delle pillole
    s.pillole.forEach(function (p) {
      var tp = TEST_PRIMA[p.cod], k = tp ? test.indexOf(tp.test) : -1;
      if (k !== -1) { h += cartaTest(tp.test, tp.breve); test.splice(k, 1); }
    });
    h += '<ul class="griglia-pillole">' + s.pillole.map(function (p) {
      return '<li><button class="pcard" type="button" data-apri="' + esc(p.cod) + '"><span class="foto" data-foto="' + esc(p.cod) + '" aria-hidden="true"><span class="fig-fb mini"><b>' + esc(p.nome) + "</b></span></span>" +
        '<span class="pnome">' + esc(p.nome) + '</span><span class="pserve">' + esc(p.serve) + "</span>" + (p.avviso ? '<span class="etichetta avv">Avviso</span>' : "") + "</button></li>";
    }).join("") + "</ul>";
    h += '<div class="riquadro routine"><h3>Routine da 5 minuti</h3><p class="routine-dati">' + s.routine.length + " passi · " + mmss(somma(s.routine)) + "</p>" +
      '<details class="det"><summary>I passi</summary><ol>' + s.routine.map(function (x) {
        var nome = x.cod === "cambio" ? "Cambio" : PIL[x.cod] ? PIL[x.cod].p.nome : x.cod;
        return "<li" + (x.cod === "cambio" ? ' class="cambio"' : "") + ">" + esc(nome) + " · " + mmss(x.durataSec) + (x.nota ? "<small>" + esc(x.nota) + "</small>" : "") + "</li>";
      }).join("") + "</ol></details>" +
      '<button class="btn primary" type="button" data-routine="' + esc(s.id) + '" aria-label="Avvia la routine di ' + esc(s.nome) + '">Avvia la routine</button><p class="piccolo">Prima leggi le pillole: gli avvisi valgono anche qui.</p></div>';
    test.forEach(function (cod) { h += cartaTest(cod, ""); });
    var nq = lista(s.nelQuaderno);
    h += '<div class="one"><h3>Nel Quaderno c\'è di più</h3>' + (nq.length ? "<ul>" + nq.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>" : "") +
      '<p>Si apre col codice che ti do in videochiamata. <a href="piano.html">Come funziona ›</a></p></div>';
    corpo.innerHTML = h;
  }
  function paginaPillole() {
    if (!P) {
      Array.prototype.forEach.call(D.querySelectorAll("section.str"), function (s) { s.hidden = true; });
      var er = $("errore-dati"); if (er) er.hidden = false;
      return;
    }
    // le sezioni nell'ordine di pillole.json
    var fine = $("quaderno-finale");
    P.strutture.forEach(function (s) { var sec = $(s.id); if (sec && fine) fine.parentNode.insertBefore(sec, fine); });
    P.strutture.forEach(disegnaStruttura);
    // i test gratuiti
    var tr = $("test-elenco");
    if (tr) tr.innerHTML = P.test.map(function (t) { return '<a href="#' + esc(t.cod) + '" data-apri="' + esc(t.cod) + '">' + esc(t.nome) + "</a>"; }).join("");
    // l'avviso comune e quante volte
    var g = P.generale || {};
    if (g.avviso && $("avviso-gen")) $("avviso-gen").innerHTML = "<p><b>Prima di iniziare.</b> " + esc(g.avviso) + "</p>";
    if (g.frequenza && $("frequenza")) { $("frequenza").innerHTML = "<b>Quante volte</b>" + (g.origineFrequenza ? " (" + esc(g.origineFrequenza) + ")" : "") + ": " + esc(g.frequenza); $("frequenza").hidden = false; }
    // i numeri calcolati
    var n = P.strutture.reduce(function (t, s) { return t + s.pillole.length; }, 0);
    Array.prototype.forEach.call(D.querySelectorAll('[data-calc="pillole"]'), function (x) { x.textContent = n; });
    Array.prototype.forEach.call(D.querySelectorAll('[data-calc="routine"]'), function (x) { x.textContent = P.strutture.length; });
    // da dove parti
    var pa = parto();
    if (pa) {
      var sec = $(pa.struttura), et = sec ? sec.querySelector(".str-testa .etichetta") : null;
      if (et) et.hidden = false;
      var a = D.querySelector('.indice a[href="#' + pa.struttura + '"]');
      if (a) { a.classList.add("parti"); a.appendChild(D.createTextNode(" · parti da qui")); }
      var q = $("non-sai"); if (q) q.hidden = true;
    }
    fotoTutte(D);
  }

  // ================= le pagine percorso =================
  function paginaPercorso() {
    var pc = percorso(), box = $("sessione-elenco");
    var pa = parto();
    if (pa && pa.percorso === ID_PERCORSO && $("tuo-percorso")) $("tuo-percorso").hidden = false;
    if (!pc || !box) {
      var er = $("errore-dati"); if (er) er.hidden = false;
      var sb = $("sessione-blocco"); if (sb) sb.hidden = true;
      return;
    }
    box.innerHTML = pc.sessione.map(function (x) {
      if (x.cod === "cambio" || !PIL[x.cod]) {
        return '<li class="cambio-riga"><span aria-hidden="true"></span><span class="camb"><b>Cambio</b>' + (x.nota ? " · " + esc(x.nota) : "") + '</span><span class="dur">' + mmss(x.durataSec) + "</span></li>";
      }
      var p = PIL[x.cod].p;
      return '<li><span class="foto" data-foto="' + esc(x.cod) + '" aria-hidden="true"></span><button class="pass" type="button" data-apri="' + esc(x.cod) + '"><span class="n">' + esc(p.nome) + "</span>" +
        (x.nota ? "<small>" + esc(x.nota) + "</small>" : "") + '</button><span class="dur">' + mmss(x.durataSec) + "</span></li>";
    }).join("");
    $("sessione-totale").textContent = "Totale " + mmss(somma(pc.sessione));
    fotoTutte(box);
  }
  function percorsoAttivo() {
    if (PAGINA !== "percorso" || !W.QGOfferta || !W.QGOfferta.percorsoAttivo) return;
    if (W.QGOfferta.percorsoAttivo(ID_PERCORSO)) return;
    var cta = $("cta-piano"), na = $("non-attivo");
    if (!na) return;
    if (cta) cta.hidden = true;
    na.hidden = false;
    var email = W.QGOfferta.contatto().email, a = $("avvisami");
    var nome = (D.querySelector("h1") || {}).textContent || "";
    if (a && email) { a.href = "mailto:" + email + "?subject=" + encodeURIComponent("Avvisami del percorso " + nome.trim()); a.hidden = false; }
  }

  // ---- senza internet: dopo la prima visita le pagine pubbliche restano in memoria ----
  // Si registra la memoria offline «solo pubblici» (sw.js?solo=pubblici), che non scarica la guida cifrata.
  // Se c'è già una memoria (per esempio quella del Quaderno, che salva anche la guida), non si tocca.
  function memoriaOffline() {
    try {
      if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
      navigator.serviceWorker.getRegistration().then(function (r) {
        if (!r) navigator.serviceWorker.register("sw.js?solo=pubblici").catch(function () {});
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- avvio ----
  testata();
  if (PAGINA === "pillole") paginaPillole();
  else if (PAGINA === "percorso") paginaPercorso();
  if (W.QGOfferta) { try { W.QGOfferta.contatti(D); } catch (e) {} percorsoAttivo(); }
  var er = $("ricarica"); if (er) er.addEventListener("click", function () { location.reload(); });
  // il metodo in un'immagine: i quattro fotogrammi fermi, come nella vecchia home
  Array.prototype.forEach.call(D.querySelectorAll(".mini[data-fig]"), function (m) {
    conFigure(function () { m.innerHTML = W.QGFig.frame(m.getAttribute("data-fig"), Number(m.getAttribute("data-t")) || 0); });
  });
  instrada();
  // arrivati con l'indirizzo di una struttura (pillole.html#piede-che-tiene): ora che la pagina è piena, ci si torna
  if (location.hash && !chiaveDa(location.hash)) {
    var dest = null;
    try { dest = D.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    if (dest) setTimeout(function () { try { dest.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) { dest.scrollIntoView(true); } }, 0);
  }
  // le figure dopo il primo disegno (setTimeout e non requestAnimationFrame: in una scheda in secondo
  // piano requestAnimationFrame non parte, e le figure non arriverebbero mai)
  setTimeout(caricaFigure, 0);
  if (D.readyState === "complete") setTimeout(memoriaOffline, 1000);
  else W.addEventListener("load", function () { setTimeout(memoriaOffline, 1000); });
})(window, document);
