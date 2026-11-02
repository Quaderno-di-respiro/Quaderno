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

## Prima pubblicazione

1. Crea il repository e carica questi file (senza `_site/`).
2. **Settings → Secrets and variables → Actions → New repository secret**:
   `CHIAVE_SORGENTE` col contenuto di `segreti/chiave-sorgente.txt`, e `PASSWORD`.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions → Pubblica → Run workflow**. L'indirizzo compare nel riepilogo del workflow
   e in Settings → Pages.
