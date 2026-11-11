# Quaderno del Respiro

La guida a un metodo di respiro e movimento come web app: si apre da un link, si installa sul
telefono, funziona anche senza internet. Per entrare serve una password, che sul sito si chiama
**codice**: è quella che dai alla persona in videochiamata (segreto `PASSWORDS`, sotto).

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
- Chi apre il sito scrive il suo codice in «Ho il codice» e il browser decifra la guida sul suo
  dispositivo. Può spuntare «Ricordalo su questo telefono» e non dovrà riscriverlo.

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
4. Dopo un paio di minuti il sito chiede il codice nuovo a tutti, anche a chi aveva
   spuntato «Ricordalo».

Chi aveva già scaricato la versione precedente sul telefono la può ancora aprire offline con
la vecchia password: la nuova vale per tutto quello che si apre da quel momento.

## Aggiornare la guida

Si fa dal PC, dalla cartella dell'archivio:

    python guida/sorgenti/assembla_web.py .
    node github/strumenti/sigilla.js segreti/chiave-sorgente.txt webapp/index.html guida/quaderno-del-respiro.pdf

Poi si caricano su GitHub i due file nuovi in `sorgente/`: il workflow riparte da solo.
Il file `segreti/chiave-sorgente.txt` non va mai caricato su GitHub.

## La facciata, le pillole, i percorsi e le sfide

Il sito pubblico è solo informativo: si prova gratis il cosa (esercizi, routine, test), e il
programma si chiede con «Richiedi un appuntamento», che apre una mail già scritta. Chi ha il codice
ricordato entra nel Quaderno come prima, senza vedere la home.

**La home** (`index.html`, da `strumenti/porta.html`), dall'alto: l'apertura (sul desktop col player
accanto), «Da dove parto?» (tre domande), le sei strutture delle pillole, il test del respiro (BOLT),
la sfida del mese, i quattro percorsi con la regola «Come si sceglie, in chiaro», il Quaderno con le
tre schermate vere, il piano su misura coi pacchetti, le domande frequenti (con la sicurezza in cima)
e in fondo il riquadro «Hai il codice?». In testata, su due righe: il marchio e «Ho il codice»;
poi i quattro link Inizio, Pillole, Percorsi, Sfida. L'esercizio di prova al muro (E64), il metodo
in un'immagine e «Per chi è, per chi no» non sono più nella home: E64 resta nella sfida, il metodo
è nella pagina delle pillole. Sul telefono la home sta in 8 schermate (al massimo 6750 px a 390 px
di larghezza): se si aggiunge un testo, ricontrollalo.
- **Il titolo** della home sta in un punto solo: la riga `<h1>` in `strumenti/porta.html`, sotto il
  commento «Il titolo della home: si cambia solo qui».
- **«Da dove parto?»**: l'obiettivo sceglie percorso e struttura, quanto ti alleni decide se partire
  dalla sfida o dalla struttura e dà il livello, il tempo a settimana dà il tempo del Quaderno (Pieno
  al livello Inizio diventa Base). È una prima idea, da confermare in videochiamata.
- **I pacchetti sul telefono** si vedono uno alla volta, con un selettore «1 anno · 6 mesi · 3 mesi»
  e il consigliato già scelto; dai 720 px in su sono affiancati come prima. La sfida, al giorno 7,
  li mostra come prima.

**Le pillole** (`pubblici/pillole.html`): sei strutture (Respiro basso, Piede che tiene, Anche
libere, Collo e spalle, Polsi e mani, Tronco e glutei), in ognuna 4 pillole, una routine da 5 minuti
col player e i test gratuiti. Ogni pillola si apre sopra la pagina; il tasto Indietro del telefono
la chiude. I testi «per chi, quando» delle strutture stanno nella pagina; esercizi, dosi, avvisi,
routine, sessioni e test stanno in `pubblici/pillole.js` (vedi «Le pillole: rigenerare
pillole.js»).

**I percorsi** (`pubblici/percorso-benessere.html`, `percorso-corsa.html`,
`percorso-combattimento.html`, `percorso-forza.html`): per chi, che cosa cambia, una sessione tipo
da 15 minuti fatta di pillole (col player), come si adatta a te, che cosa si sblocca col codice.

**La sfida** gratuita «Respiro al muro» è una pagina a sé, `sfida.html`, senza codice: giorni
fatti, test e risposte restano sul telefono di chi la fa.

| file | cosa |
|---|---|
| `strumenti/porta.html` | la home, con dentro la porta della guida cifrata (diventa `index.html`) |
| `pubblici/pillole.html` | le pillole: sei strutture, routine, test |
| `pubblici/percorso-*.html` | le quattro pagine percorso |
| `pubblici/pillole.js` | i contenuti di pillole e percorsi: **non si modifica a mano**, si rigenera |
| `pubblici/sito.js`, `pubblici/sito.css` | lo script e lo stile comuni di pillole e percorsi (finestra, test, player) |
| `pubblici/sfida.html` | la sfida «Respiro al muro», 7 giorni |
| `pubblici/offerta.js` | **contatto, profilo Instagram, offerta e percorsi attivi: è l'unico file da toccare per cambiarli** |
| `pubblici/figure.js` | le figure animate, copia di `guida/sorgenti/figure.js` |
| `pubblici/dentro-*.webp` | le tre schermate del Quaderno (programma, player, scheda) |
| `strumenti/estrai_pillole.js` | rigenera `pubblici/pillole.js` |

### I link da usare su Instagram

| per | link (dopo l'indirizzo del sito) |
|---|---|
| bio | `./` |
| il questionario | `./#parto` |
| una pillola | `pillole.html#E15` (il codice della pillola) |
| una struttura | `pillole.html#piede-che-tiene` (respiro-basso, piede-che-tiene, anche-libere, collo-e-spalle, polsi-e-mani, tronco-e-glutei) |
| un test | `pillole.html#T13` (T1 BOLT, T2 respiri al minuto, T4 equilibrio, T13 collo, T14 flessibile o mobile) |
| una routine, col player | `pillole.html#routine-piede-che-tiene` |
| un percorso | `percorso-corsa.html` (benessere, corsa, combattimento, forza) |
| la sfida | `sfida.html` |
| il piano e i pacchetti | `./#piano` |
| il riquadro del codice | `./#accesso` |

Il browser di Instagram ha una memoria sua, separata da Safari e Chrome: le pagine lo dicono (solo
lì) e invitano ad aprire il sito nel browser per ritrovare quello che si è salvato.

### Le pillole: rigenerare pillole.js

I contenuti delle pillole li sceglie e li controlla la chat dei contenuti in
`catalogo/sito-20261111/pillole.json`. Il sito legge `pubblici/pillole.js`, che si rigenera dal PC,
dalla cartella dell'archivio:

    node github/strumenti/estrai_pillole.js

Lo script legge `pillole.json` (quali pillole, i testi tagliati, dosi, avvisi, routine, sessioni,
test e il blocco «generale») e le schede della guida in `guida/sorgenti/parti/3-script.html`. Per
ogni pillola controlla che la scheda esista e sia «chiaro», che la figura ci sia in
`pubblici/figure.js` e che nome, «A cosa ti serve», come, senti ed evita siano ancora la scheda, al
massimo tagliata (stesse parole nello stesso ordine, senza i riferimenti `[[...]]`). Dosi e avvisi si
prendono sempre da `pillole.json`. Controlla anche che routine e sessioni usino solo pillole
gratuite e che durino circa 5 e 15 minuti. Se tutto torna scrive `pubblici/pillole.js`; poi si
caricano su GitHub `pillole.js` e, se è cambiato il numero di pillole, le descrizioni in testa a
`pillole.html` (il numero è scritto a mano). Se una scheda è cambiata e un testo non è più un suo
taglio, lo script si ferma e dice quale: si ritaglia il testo in `pillole.json` e si rilancia.
Opzioni: `--controlla` (controlla e basta), `--prendi-schede` (per i testi che non tornano prende la
scheda intera: poi vanno ritagliati, per le regole su promesse e sicurezza).

### Percorsi attivi

In `pubblici/offerta.js`, sopra «Da qui in giù non serve toccare niente», la voce
`var PERCORSI_ATTIVI = [];` dice quali percorsi si possono già chiedere. Gli id sono `"benessere"`,
`"corsa-e-fiato"`, `"combattimento"`, `"forza-e-scatti"`, per esempio
`var PERCORSI_ATTIVI = ["benessere", "corsa-e-fiato"];`. Vuota vuol dire tutti e quattro. Nelle
pagine dei percorsi non attivi, al posto di «Come funziona il piano» compare «Questo percorso apre
più avanti…» con il link «Avvisami quando parte», che apre una mail all'indirizzo del contatto con
l'oggetto «Avvisami del percorso …». Un id scritto male vale come non scritto; se non resta nessun
id valido, sono attivi tutti e quattro. Il questionario e le pagine si vedono sempre per tutti.

### Cambiare contatto, profilo, prezzi e vantaggi (anche dal telefono)

Su GitHub apri `pubblici/offerta.js`, tocca la matita, cambia solo i valori in cima al file e
salva con **Commit changes**: il workflow **Pubblica** riparte da solo e dopo un paio di minuti
le due pagine mostrano la versione nuova.

- **Contatto**: `var CONTATTO = { email: "", modulo: "" };`. I pulsanti «Richiedi un appuntamento» e
  «Avvisami della prossima sfida» stanno nell'offerta, al giorno 7 della sfida e nel piede di tutte
  le pagine. Il sito è solo informativo: la vendita passa da una videochiamata privata.
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

- **Motori di ricerca**: `strumenti/porta.html`, `pubblici/sfida.html`, `pubblici/pillole.html` e le
  quattro pagine percorso hanno `<meta name="robots" content="noindex, nofollow">`. Quando profilo e
  nome sono definitivi si toglie quella riga da tutte. Nello stesso momento conviene scrivere per intero l'indirizzo
  dell'immagine dell'anteprima (`og:image`, oggi `icona-512.png`), per esempio
  `https://nome.github.io/quaderno/icona-512.png`: alcune app la vogliono completa.
- **Le figure**: quando cambia `guida/sorgenti/figure.js`, copialo di nuovo in `pubblici/figure.js`.
- **I testi degli esercizi** della sfida (E1, E64) vengono dalle schede della guida: se cambia la
  scheda, aggiornali lì. Quelli delle pillole si rigenerano con `estrai_pillole.js` (sopra).
- **Le schermate del Quaderno** sono ritagli delle foto del Quaderno, in WebP sotto i 60 KB.
  Se il Quaderno cambia aspetto, rifalle con le stesse misure e lo stesso nome.
- **Senza internet**: il service worker (`pubblici/sw.js`) salva ogni pagina col suo indirizzo, la
  radice come `index.html`, così aprire la sfida non sovrascrive la copia della guida. In memoria ci
  sono anche `guida.json`, il PDF cifrato e le schermate: dopo una visita col codice, la guida
  si apre anche offline. Le pagine delle pillole e dei percorsi registrano la stessa memoria in un
  modo «solo pubblici» (`sw.js?solo=pubblici`), che salva le pagine pubbliche ma non scarica la guida
  cifrata: così, dopo una visita, pillole e percorsi si aprono anche senza internet. Se c'è già la
  memoria del Quaderno non la toccano; quando si entra col codice, la guida registra la memoria
  intera. Un file pubblico nuovo si aggiunge all'elenco `FILE` in cima a `pubblici/sw.js`.
- **I dati sul telefono**, tutti in localStorage e mai inviati: `qg-parto` le risposte di «Da dove
  parto?» (`v`, `obiettivo`, `tempo`, `allenamento`, `data`; «Cancella le risposte» la toglie);
  `qg-bolt` il test del respiro, fatto nella home o nella pagina delle pillole; `qg-sfida-respiro`
  la sfida (giorni fatti, test, le tre domande del giorno 1 e del giorno 7, l'ora dei promemoria);
  `qg-chiave` il codice ricordato. Il BOLT fatto oggi nella home o nelle pillole vale come test del
  giorno 1 della sfida. Gli altri test delle pillole non salvano niente.
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
