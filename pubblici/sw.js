// Quaderno del Respiro: funziona anche senza internet.
// La pagina si chiede prima alla rete (così gli aggiornamenti arrivano) e, offline,
// si prende dalla memoria; tutto il resto si serve dalla memoria. Cambiare VERSIONE
// a ogni pubblicazione fa ripartire la memoria con i file nuovi.
const VERSIONE = "qg-__VERSIONE__";
const FONT = "qg-font";
const FILE = ["./", "index.html", "manifest.webmanifest", "icona.svg", "icona-180.png", "icona-192.png", "icona-512.png", "quaderno-del-respiro.pdf.enc"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
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
    e.respondWith(
      fetch(r)
        .then((res) => { const copia = res.clone(); caches.open(VERSIONE).then((c) => c.put("index.html", copia)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(caches.match(r).then((m) => m || fetch(r)));
});
