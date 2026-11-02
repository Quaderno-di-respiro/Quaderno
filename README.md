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
  risultato va su GitHub Pages.
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

Chi apre il link senza una password ricordata vede una pagina pubblica: il metodo, il test del
respiro (BOLT), un esercizio di prova, i due percorsi, la sfida del mese con l'offerta, e in fondo
il riquadro «Hai già la password?». Chi ha la password ricordata entra nella guida come prima,
senza vedere la facciata. La sfida gratuita «Respiro al muro» è una pagina a sé, `sfida.html`,
senza password: i giorni fatti e i test restano sul telefono di chi la fa.

| file | cosa |
|---|---|
| `strumenti/porta.html` | la facciata, con dentro la porta della guida cifrata (diventa `index.html`) |
| `pubblici/sfida.html` | la sfida «Respiro al muro», 7 giorni |
| `pubblici/offerta.js` | **il profilo Instagram e l'offerta: è l'unico file da toccare per cambiarli** |
| `pubblici/figure.js` | le figure animate, copia di `guida/sorgenti/figure.js` |

### Cambiare profilo, prezzi e vantaggi (anche dal telefono)

Su GitHub apri `pubblici/offerta.js`, tocca la matita, cambia solo i valori in cima al file e
salva con **Commit changes**: il workflow **Pubblica** riparte da solo e dopo un paio di minuti
le due pagine mostrano la versione nuova.

- **Instagram**: `var INSTAGRAM = "";`. Scrivi l'indirizzo intero tra le virgolette, per esempio
  `var INSTAGRAM = "https://www.instagram.com/nomeprofilo/";`. Finché è vuoto, al posto dei link
  compare «Scrivi PIANO su Instagram (profilo in arrivo)»; quando c'è, i pulsanti portano al
  profilo e la sfida, al giorno 7, invita a taggare `@nomeprofilo`.
- **Prezzi**: in ogni pacchetto `prezzo` è il prezzo pieno in euro, un numero senza virgolette
  (`120`, oppure `89.5` col punto). Con `null` la pagina non mostra numeri e scrive «Il prezzo te
  lo scrivo in DM». Il prezzo al mese si calcola da solo da `prezzo` e `mesi`.
- **Prezzo di lancio**: `prezzoLancio` in ogni pacchetto, e una sola `scadenzaLancio` per tutti,
  l'ultimo giorno valido nella forma `"AAAA-MM-GG"` (per esempio `"2026-12-31"`). Il prezzo pieno
  barrato, il prezzo di lancio e «fino al 31 dicembre 2026» compaiono solo se ci sono `prezzo`,
  `prezzoLancio` e `scadenzaLancio`, se il prezzo di lancio è più basso del pieno e se la data del
  telefono non ha superato la scadenza. Sotto i pacchetti compare «Prezzo di lancio valido fino
  alla data indicata.». Il giorno dopo la scadenza lo sconto sparisce da solo, senza ripubblicare.
  Una data scritta in un altro modo (per esempio `31/12/2026`) vale come nessuna scadenza.
- **Vantaggi**: `vantaggi` è l'elenco del pacchetto, una voce per riga tra virgolette, separate
  da virgole. `breve` è la riga che compare nel riepilogo al giorno 7 della sfida.
- **One to one**: la riga `oneToOne`.

Esempio di un pacchetto con prezzo di lancio:

    { nome: "Trimestrale", mesi: 3, prezzo: 120, prezzoLancio: 99, breve: "…", vantaggi: [ … ] },

Se qualcosa si rompe (una virgola o una virgoletta in meno), le pagine restano in piedi e
mostrano il testo di riserva: «Tre durate: trimestrale, 6 mesi, 1 anno. Il prezzo te lo scrivo
in DM.». Ricontrolla la riga cambiata.

### Altre cose da sapere

- **Motori di ricerca**: `strumenti/porta.html` e `pubblici/sfida.html` hanno
  `<meta name="robots" content="noindex, nofollow">`. Quando profilo e nome sono definitivi si
  toglie quella riga da tutti e due. Nello stesso momento conviene scrivere per intero l'indirizzo
  dell'immagine dell'anteprima (`og:image`, oggi `icona-512.png`), per esempio
  `https://nome.github.io/quaderno/icona-512.png`: alcune app la vogliono completa.
- **Le figure**: quando cambia `guida/sorgenti/figure.js`, copialo di nuovo in `pubblici/figure.js`.
- **I testi degli esercizi** della facciata (E64) e della sfida (E1, E64) sono copiati dalle schede
  della guida: se cambia la scheda, aggiornali lì.
- **Senza internet**: il service worker (`pubblici/sw.js`) salva ogni pagina col suo indirizzo, la
  radice come `index.html`, così aprire la sfida non sovrascrive la copia della guida. Una pagina
  pubblica nuova si aggiunge all'elenco `FILE` in cima a `pubblici/sw.js`.
- **I dati sul telefono**: la sfida usa la chiave `qg-sfida-respiro` di localStorage, il test
  della facciata `qg-bolt`. Il BOLT fatto oggi sulla facciata vale come test del giorno 1.

## Prima pubblicazione

1. Crea il repository e carica questi file (senza `_site/`).
2. **Settings → Secrets and variables → Actions → New repository secret**:
   `CHIAVE_SORGENTE` col contenuto di `segreti/chiave-sorgente.txt`, e `PASSWORD`.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions → Pubblica → Run workflow**. L'indirizzo compare nel riepilogo del workflow
   e in Settings → Pages.
