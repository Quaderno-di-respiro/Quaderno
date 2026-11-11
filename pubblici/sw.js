// Quaderno del Respiro: funziona anche senza internet.
// Le pagine si chiedono prima alla rete (così gli aggiornamenti arrivano) e, offline, si prendono
// dalla memoria; tutto il resto si serve dalla memoria. Ogni pagina si salva col suo indirizzo
// (la radice come index.html): aprire sfida.html non sovrascrive la copia della facciata e della
// guida. Cambiare VERSIONE a ogni pubblicazione fa ripartire la memoria con i file nuovi.
// guida.json (i dati cifrati della guida) e il PDF cifrato stanno in memoria: senza internet la porta
// li prende da qui, e sono sempre della stessa pubblicazione.
// Due modi: la guida registra «sw.js» e mette in memoria tutto; le pagine pubbliche nuove (pillole e
// percorsi) registrano «sw.js?solo=pubblici», che salta la guida cifrata: chi non ha il codice non la
// scarica. Quando poi si entra col codice, la guida registra «sw.js» e la memoria si completa.
const VERSIONE = "qg-__VERSIONE__";
const FONT = "qg-font";
const FILE = ["./", "index.html", "guida.json", "sfida.html", "figure.js", "offerta.js", "manifest.webmanifest", "icona.svg", "icona-180.png", "icona-192.png", "icona-512.png",
  "dentro-programma.webp", "dentro-player.webp", "dentro-scheda.webp", "quaderno-del-respiro.pdf.enc",
  "pillole.html", "percorso-benessere.html", "percorso-corsa.html", "percorso-combattimento.html", "percorso-forza.html", "pillole.js", "sito.js", "sito.css"];
const GUIDA = ["guida.json", "quaderno-del-respiro.pdf.enc"];
const SOLO_PUBBLICI = new URL(self.location.href).searchParams.get("solo") === "pubblici";
const RADICE = new URL("index.html", self.location).href;

// L'indirizzo con cui si salva una pagina: senza ?… e #…, e «cartella/» diventa «cartella/index.html».
function pagina(u) {
  return u.origin + (u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname);
}

self.addEventListener("install", (e) => {
  const lista = SOLO_PUBBLICI ? FILE.filter((f) => GUIDA.indexOf(f) === -1) : FILE;
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(lista)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== VERSIONE && n !== FONT).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);

  // I caratteri di Google Fonts: dalla memoria se ci sono, altrimenti dalla rete e poi in memoria.
  if (u.origin === "https://fonts.googleapis.com" || u.origin === "https://fonts.gstatic.com") {
    e.respondWith(caches.open(FONT).then((c) => c.match(r).then((m) => m || fetch(r).then((res) => { c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== self.location.origin) return;

  if (r.mode === "navigate") {
    const chiave = pagina(u);
    e.respondWith(
      fetch(r)
        .then((res) => {
          // Si salva solo una pagina vera: niente errori (404) e niente redirezioni, che Safari
          // rifiuta quando poi gliele si serve dalla memoria.
          if (res.ok && !res.redirected) {
            const copia = res.clone();
            e.waitUntil(caches.open(VERSIONE).then((c) => c.put(chiave, copia)));
          }
          return res;
        })
        .catch(() => caches.match(chiave).then((m) => m || caches.match(RADICE)))
    );
    return;
  }
  e.respondWith(caches.match(r).then((m) => m || fetch(r)));
});
