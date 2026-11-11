# Quaderno del Respiro

La guida a un metodo di respiro e movimento come web app: si apre da un link, si installa sul
telefono, funziona anche senza internet. Per entrare serve una password.

## Come funziona la password

Il repository è pubblico, ma la guida qui dentro è **cifrata** (AES-256): senza password
i file sono illeggibili, sia nel repository sia sul sito.

- `sorgente/` contiene guida e PDF sigillati con una chiave che sta solo tra i segreti del
  repository (`CHIAVE_SORGENTE`).
- A ogni pubblicazione il workflow **Pubblica** li apre e li richiude con una chiave nuova.
  Quella chiave viene chiusa una volta per ogni password (`PASSWORD` e `PASSWORDS`), e il
  risultato va su GitHub Pages: la pagina d'ingresso `index.html`, i dati cifrati della guida in
  `guida.json` e il PDF cifrato.
- La pagina d'ingresso scarica `guida.json` solo quando serve: con una password ricordata, o
  quando si preme «Entra». Chi apre il link da Instagram scarica solo la facciata, leggera.
- Chi apre il sito inserisce la sua password e il browser decifra la guida sul suo
  dispositivo. Può spuntare «Ricordala su questo dispositivo» e non dovrà reinserirla.

## Più password, una per persona (anche dal telefono)

Puoi dare a ogni persona una password sua: tutte aprono la stessa guida, e quando ne togli
una smette di funzionare solo quella.

1. Sul repository: **Settings → Secrets and variables → Actions**.
2. Crea il segreto **PASSWORDS** (**New repository secret**) o, se c'è già, tocca la sua
   matita. Scrivi **una password per riga**, ognuna di almeno 8 caratteri. Le righe che
   iniziano con `#` sono note per te, per esempio il nome della persona:

       # Persona 1
       prima-password
       # Persona 2
       seconda-password

3. Salva e vai su **Actions → Pubblica → Run workflow → Run workflow**.

Per **aggiungere** una persona aggiungi una riga; per **toglierla** cancella la sua riga.
Poi rilancia il workflow. GitHub non ti mostra più il contenuto di un segreto dopo averlo
salvato: tieni l'elenco anche da un'altra parte sicura, così quando lo modifichi lo riscrivi
intero. La password del segreto `PASSWORD` continua a funzionare insieme a queste.

Se una riga è più corta di 8 caratteri il workflow si ferma e dice quale riga sistemare,
senza mostrare la password.

## Cambiare la password (anche dal telefono)

1. Sul repository: **Settings → Secrets and variables → Actions**.
2. Alla voce **PASSWORD** tocca la matita, scrivi la password nuova (almeno 8 caratteri) e
   salva con **Update secret**.
3. Vai su **Actions → Pubblica → Run workflow → Run workflow**.
4. Dopo un paio di minuti il sito chiede la password nuova a tutti, anche a chi aveva
   spuntato «Ricordala».

Chi aveva già scaricato la versione precedente sul telefono la può ancora aprire offline con
la vecchia password: la nuova vale per tutto quello che si apre da quel momento.

## Aggiornare la guida

Si fa dal PC, dalla cartella dell'archivio:

    python guida/sorgenti/assembla_web.py .
    node github/strumenti/sigilla.js segreti/chiave-sorgente.txt webapp/index.html guida/quaderno-del-respiro.pdf

Poi si caricano su GitHub i due file nuovi in `sorgente/`: il workflow riparte da solo.
Il file `segreti/chiave-sorgente.txt` non va mai caricato su GitHub.

## La facciata e le sfide

Chi apre il link senza una password ricordata vede una pagina pubblica, in quest'ordine:
l'apertura (sul desktop col player accanto), «Così è dentro» con tre schermate vere del Quaderno,
il test del respiro (BOLT), un esercizio di prova, la sfida del mese con l'offerta, il metodo in
un'immagine, per chi è, le domande frequenti e in fondo il riquadro «Hai già la password?» (in
testata il link «Ho la password»). Chi ha la password ricordata entra nella guida come prima,
senza vedere la facciata. La sfida gratuita «Respiro al muro» è una pagina a sé, `sfida.html`,
senza password: giorni fatti, test e risposte restano sul telefono di chi la fa.

| file | cosa |
|---|---|
| `strumenti/porta.html` | la facciata, con dentro la porta della guida cifrata (diventa `index.html`) |
| `pubblici/sfida.html` | la sfida «Respiro al muro», 7 giorni |
| `pubblici/offerta.js` | **contatto, profilo Instagram e offerta: è l'unico file da toccare per cambiarli** |
| `pubblici/figure.js` | le figure animate, copia di `guida/sorgenti/figure.js` |
| `pubblici/dentro-*.webp` | le tre schermate di «Così è dentro» (programma, player, scheda) |

### Cambiare contatto, profilo, prezzi e vantaggi (anche dal telefono)

Su GitHub apri `pubblici/offerta.js`, tocca la matita, cambia solo i valori in cima al file e
salva con **Commit changes**: il workflow **Pubblica** riparte da solo e dopo un paio di minuti
le due pagine mostrano la versione nuova.

- **Contatto**: `var CONTATTO = { email: "", modulo: "" };`. I pulsanti «Richiedi un appuntamento» e
  «Avvisami della prossima sfida» stanno nell'offerta, al giorno 7 della sfida e nel piede. Il sito è
  solo informativo: la vendita passa da una videochiamata privata.
  - **Un pulsante per pacchetto**: ogni pacchetto ha il suo «Richiedi un appuntamento». Con l'email
    apre la posta con l'oggetto «Richiesta di appuntamento · 6 mesi» (col nome del pacchetto) e un
    testo già scritto: giorni e orari, sport praticato, e l'avviso di non scrivere dati sulla salute.
    Col modulo apre il modulo. Senza contatto il pulsante non compare.
  - **Modulo**: scrivi in `modulo` l'indirizzo intero del modulo esterno, quello scelto col
    consulente privacy (per esempio `modulo: "https://…"`). I pulsanti aprono il modulo.
  - **Solo email**: scrivi l'indirizzo in `email` (per esempio `email: "nome@dominio.it"`) e
    lascia `modulo` vuoto. Le pagine mostrano l'indirizzo da selezionare, il pulsante «Copia» e
    un link che apre l'app della posta con l'oggetto già scritto.
  - **Tutto vuoto**: resta l'invito «Scrivi PIANO su Instagram (profilo in arrivo)».
  - Con un contatto acceso, sopra i pacchetti la riga dei prezzi invita a lasciare l'email.
  - Un indirizzo scritto male (senza `https://`, o un'email senza `@`) vale come vuoto.
  - Contatori di visite: nessuno. Lo strumento lo sceglie il consulente.
- **Instagram**: `var INSTAGRAM = "";`. Scrivi l'indirizzo intero tra le virgolette, per esempio
  `var INSTAGRAM = "https://www.instagram.com/nomeprofilo/";`. Finché è vuoto, al posto dei link
  compare «Scrivi PIANO su Instagram (profilo in arrivo)»; quando c'è, i link portano al
  profilo, e la sfida, al giorno 7, invita a taggare `@nomeprofilo` e lo scrive sulla carta da
  condividere.
- **Prezzi**: in ogni pacchetto `prezzo` è il prezzo pieno in euro, un numero senza virgolette
  (`120`, oppure `89.5` col punto). Con `null` la pagina non mostra numeri e scrive una riga sola
  sopra i pacchetti: «I prezzi escono presto.». Il prezzo al mese («circa … al mese») si calcola
  da solo da `prezzo` e `mesi`.
- **Prezzo di lancio**: `prezzoLancio` in ogni pacchetto, e una sola `scadenzaLancio` per tutti,
  l'ultimo giorno valido nella forma `"AAAA-MM-GG"` (per esempio `"2026-12-31"`). Il prezzo di
  lancio e «Prezzo di lancio fino al 31 dicembre 2026. Dal 1 gennaio 2027: 179 €» compaiono solo se
  ci sono `prezzo`, `prezzoLancio` e `scadenzaLancio`, se il prezzo di lancio è più basso del pieno e
  se la data del telefono non ha superato la scadenza. Il prezzo pieno non si barra: un prezzo mai
  praticato non va presentato come sconto. Sotto i pacchetti compare «Prezzo di lancio valido fino
  alla data indicata.». Il giorno dopo la scadenza lo sconto sparisce da solo, senza ripubblicare.
  Una data scritta in un altro modo (per esempio `31/12/2026`) vale come nessuna scadenza.
- **Vantaggi**: `vantaggi` è l'elenco del pacchetto, una voce per riga tra virgolette, separate
  da virgole. Sulla pagina compare sotto «Cosa hai a disposizione»: scrivi che cosa riceve davvero
  la persona. `breve` è la riga che compare nel riepilogo al giorno 7 della sfida.
- **Ordine e pacchetto consigliato**: i pacchetti compaiono nell'ordine in cui sono scritti (oggi
  1 anno, 6 mesi, 3 mesi). `consigliato: true` mette il riquadro in evidenza con «Consigliato»:
  tienilo su un pacchetto solo (oggi il 6 mesi).
- **Rate**: `rate: 2` fa comparire «Anche in 2 rate» sotto il prezzo; `null` la toglie.
- **Garanzia**: `garanzia: ""`. Il testo lo scrive il consulente; finché è vuoto non compare.
  Scritto, compare sotto i pacchetti come «Garanzia. …».
- **Domande frequenti da compilare**: in `domande` ci sono tre risposte vuote: `chiMiSegue`
  («Chi mi segue?»), `recesso` («Posso cambiare idea dopo aver pagato?») e `durataAccesso` («Per
  quanto tempo posso usare il Quaderno?»). Ogni domanda compare in fondo alle domande frequenti
  solo quando la sua risposta è scritta.
- **One to one**: la riga `oneToOne`.

Esempio di un pacchetto con prezzo di lancio e rate:

    { nome: "1 anno", mesi: 12, prezzo: 900, prezzoLancio: 800, rate: 2, consigliato: false, breve: "…", vantaggi: [ … ] },

Se qualcosa si rompe (una virgola o una virgoletta in meno), le pagine restano in piedi e
mostrano il testo di riserva: «Tre durate: 1 anno, 6 mesi, 3 mesi. I prezzi escono presto.» e
l'invito a Instagram. Ricontrolla la riga cambiata.

### Altre cose da sapere

- **Motori di ricerca**: `strumenti/porta.html` e `pubblici/sfida.html` hanno
  `<meta name="robots" content="noindex, nofollow">`. Quando profilo e nome sono definitivi si
  toglie quella riga da tutti e due. Nello stesso momento conviene scrivere per intero l'indirizzo
  dell'immagine dell'anteprima (`og:image`, oggi `icona-512.png`), per esempio
  `https://nome.github.io/quaderno/icona-512.png`: alcune app la vogliono completa.
- **Le figure**: quando cambia `guida/sorgenti/figure.js`, copialo di nuovo in `pubblici/figure.js`.
- **I testi degli esercizi** della facciata (E64, in tre indicazioni) e della sfida (E1, E64)
  vengono dalle schede della guida: se cambia la scheda, aggiornali lì.
- **Le schermate di «Così è dentro»** sono ritagli delle foto del Quaderno, in WebP sotto i 60 KB.
  Se il Quaderno cambia aspetto, rifalle con le stesse misure e lo stesso nome.
- **Senza internet**: il service worker (`pubblici/sw.js`) salva ogni pagina col suo indirizzo, la
  radice come `index.html`, così aprire la sfida non sovrascrive la copia della guida. In memoria ci
  sono anche `guida.json`, il PDF cifrato e le schermate: dopo una visita con la password, la guida
  si apre anche offline. Un file pubblico nuovo si aggiunge all'elenco `FILE` in cima a
  `pubblici/sw.js`.
- **I dati sul telefono**: la sfida usa la chiave `qg-sfida-respiro` di localStorage (giorni fatti,
  test, le tre domande del giorno 1 e del giorno 7, l'ora dei promemoria), il test della facciata
  `qg-bolt`. Il BOLT fatto oggi sulla facciata vale come test del giorno 1.
- **Il calendario e la carta della sfida** si fanno sul telefono: il file `.ics` con un
  promemoria al giorno e l'immagine del risultato (condivisa col menu del telefono, o scaricata
  dove non c'è). Nessun dato parte dalla pagina.

## Prima pubblicazione

1. Crea il repository e carica questi file (senza `_site/`).
2. **Settings → Secrets and variables → Actions → New repository secret**:
   `CHIAVE_SORGENTE` col contenuto di `segreti/chiave-sorgente.txt`, e `PASSWORD`.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions → Pubblica → Run workflow**. L'indirizzo compare nel riepilogo del workflow
   e in Settings → Pages.
