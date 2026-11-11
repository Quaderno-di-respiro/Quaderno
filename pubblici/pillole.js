/* Prima le Radici: i contenuti delle pagine «Le pillole» e dei quattro percorsi.
   Non si modifica a mano: si rigenera con «node github/strumenti/estrai_pillole.js» (vedi README).
   Fonte: catalogo/sito-20261111/pillole.json, controllata sulle schede di guida/sorgenti/parti/3-script.html.
   Generato il 2026-11-11: 24 pillole, 6 routine, 4 sessioni tipo, 5 test. */
window.QGPillole = {
 "strutture": [
  {
   "id": "respiro-basso",
   "nome": "Respiro basso",
   "perChi": "Per la calma, prima di dormire o di allenarti",
   "pillole": [
    {
     "cod": "E1",
     "nome": "Respiro di pancia, supino",
     "serve": "Insegna al diaframma a scendere.",
     "come": "Pancia in su, ginocchia piegate e piedi a terra (o polpacci su una sedia), mento un po' dentro. Una mano sul petto, una sulla pancia. Solo naso: la pancia si gonfia inspirando e si sgonfia espirando.",
     "senti": "La mano sulla pancia che sale e scende; quella sul petto quasi ferma.",
     "evita": "Di correre: 3–4 secondi dentro, 4–5 fuori. Di gonfiare la pancia spingendo con gli addominali o inarcando la schiena: la pancia sale da sola, perché il diaframma scende. Il petto si muove un po', va bene, ma cerca la pancia.",
     "dose": "Un minuto: «un minutino».",
     "origineDose": "Coach",
     "avviso": "Se ti gira la testa, torna a un respiro lento e normale. In gravidanza, se a pancia in su stai male, cambia posizione."
    },
    {
     "cod": "E2",
     "nome": "Respiro «candela» 5 + 5",
     "serve": "Ti abitua a respirare lento, dal naso, con pochissima aria: è il ritmo calmo che porterai negli altri esercizi.",
     "come": "5 secondi dentro, 5 fuori, solo naso. Immagina una candela davanti al naso: la fiamma si muove ma non si spegne. Entra pochissima aria, il respiro non si sente.",
     "senti": "Un po' di fame d'aria: è normale e va bene.",
     "evita": "Di forzare i 5 secondi: se non vengono, fai 3. I secondi crescono come i chili in palestra.",
     "dose": "Coach: 5 secondi dentro e 5 fuori; se non vengono, 3 e 3. Nostra: 2 minuti; se ti viene comodo, sali fino a 5 minuti di fila.",
     "origineDose": "Coach e Nostra",
     "avviso": "Cerca solo un po' di fame d'aria, mai di più. Con attacchi di panico, chiedi prima al medico. Se ti gira la testa, torna a un respiro normale."
    },
    {
     "cod": "E4",
     "nome": "Il cilindro: coste, pancia e schiena, petto",
     "serve": "Apre le coste di lato e poi riempie il tronco.",
     "come": "Pancia in su, ginocchia piegate (seduto o in piedi solo quando ti viene facile). Mani sui fianchi, all'altezza delle ultime coste. Inspirando prima si aprono le coste di lato, poi si gonfiano pancia e schiena, per ultimo il petto. Espirando si svuota al contrario: petto, pancia, coste. Lento, 5 + 5.",
     "senti": "Le mani spinte in fuori dalle coste, poi la pancia che si riempie: come l'acqua in una bottiglia, dal basso verso l'alto.",
     "evita": "Di alzare le spalle. Se i fianchi non si gonfiano, per ora fai solo pancia: dai priorità a fianchi e pancia, il petto viene da sé.",
     "dose": "3 minuti, pancia in su.",
     "origineDose": "Coach",
     "avviso": "Se ti gira la testa, torna a un respiro lento e normale. In gravidanza, se a pancia in su stai male, cambia posizione."
    },
    {
     "cod": "E7",
     "nome": "Coccodrillo",
     "serve": "Porta il respiro nella schiena, dove da supino non arriva: è la base del lavoro a pancia in giù.",
     "come": "Pancia in giù, fronte sugli avambracci o sui palmi, gambe un po' aperte e ruotate in fuori. Solo naso, lento, 5 + 5: inspirando si gonfiano le ultime coste e la schiena; espirando la schiena si ritrae. Poi, come nel respiro supino, lascia che l'aria arrivi fino al pelvico: si riempie «dal basso verso l'alto», come una bottiglia.",
     "senti": "La bassa schiena che si alza verso il soffitto a ogni inspiro, la pancia che preme appena sul pavimento, il pelvico che accoglie e risale da solo.",
     "evita": "Di respirare alto o veloce: le scapole che si muovono, il bacino che si solleva («stai respirando troppo davanti»). Di gonfiare il pelvico apposta: «guarda se senti». Porta le ascelle il più vicino al pavimento.",
     "dose": "3 minuti; in lezione anche da un minuto a due.",
     "origineDose": "Coach",
     "avviso": "Se a pancia in giù non stai comodo, per esempio in gravidanza, fai il cilindro a pancia in su. Se ti gira la testa, torna a un respiro normale."
    }
   ],
   "routine": [
    {
     "cod": "E1",
     "durataSec": 60,
     "nota": "Pancia in su, una mano sul petto e una sulla pancia. Solo naso."
    },
    {
     "cod": "E2",
     "durataSec": 60,
     "nota": "5 secondi dentro e 5 fuori; se non vengono, 3 e 3."
    },
    {
     "cod": "E4",
     "durataSec": 75,
     "nota": "Mani sui fianchi: prima le coste, poi pancia e schiena, per ultimo il petto."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Girati a pancia in giù, fronte sugli avambracci."
    },
    {
     "cod": "E7",
     "durataSec": 90,
     "nota": "Respira nella schiena, lento, 5 + 5."
    }
   ],
   "test": [
    "T2",
    "T1"
   ],
   "nelQuaderno": [
    "Il gruppo «Respiro a terra» intero: 10 schede. Qui ne vedi 4, più il respiro sul fianco in «Anche libere».",
    "Altre 5 schede del gruppo, fra cui il respiro che arriva al pavimento pelvico e i tre diaframmi insieme.",
    "Il gruppo «Respiro al muro», con la scheda completa del respiro della sfida.",
    "Nel programma di 12 settimane il respiro a terra c'è ogni settimana: il coccodrillo in 8 settimane, da 2 a 3 minuti; il cilindro in 6, da 2 minuti e 30 secondi a 4 minuti.",
    "Altri 2 test del respiro, i battiti e come respiri quando non ci pensi; e il diario dove segni BOLT e respiri, per il «prima e dopo» della settimana 12."
   ]
  },
  {
   "id": "piede-che-tiene",
   "nome": "Piede che tiene",
   "perChi": "Chi corre, chi sta molto in piedi, chi cerca equilibrio",
   "pillole": [
    {
     "cod": "E12",
     "nome": "I tre punti d'appoggio",
     "serve": "Ti dà un riferimento semplice per sentire il piede a terra: ogni esercizio in piedi parte da questi tre appoggi.",
     "come": "In piedi o seduto, scalzo: senti la base dell'alluce, la base del mignolo e il tallone. Sempre e ovunque.",
     "senti": "Tre punti, tre archi: mediale, laterale, trasverso.",
     "evita": "Di appoggiarti solo sul tallone o solo sull'alluce. Di schiacciare a terra l'arco interno: i punti sono tre, l'arco resta sollevato.",
     "dose": "1 minuto e 30 secondi in piedi.",
     "origineDose": "Nostra",
     "avviso": "Con il diabete e i piedi poco sensibili non stare scalzo: fallo da seduto, con le scarpe."
    },
    {
     "cod": "E14",
     "nome": "L'elica del piede",
     "serve": "Sblocca la torsione del piede ruotando la tibia.",
     "come": "Seduto, piede in scarico, dita incollate a terra, primo e quinto metatarso fermi. Solleva appena il tallone e portalo dentro e fuori come un timone; poi piccoli cerchi. Tallone dentro = ginocchio in fuori.",
     "senti": "La tibia che ruota sopra il piede fermo: «non è il piede che ruota. Ma è la tibia che si muove».",
     "evita": "Di muovere il piede a pezzo unico; di chiudere il ginocchio. All'inizio si muove il ginocchio: l'obiettivo è muovere solo la tibia.",
     "dose": "Nostra: 2 minuti per piede, da seduto. Coach: in piedi, «qualche minuto».",
     "origineDose": "Coach e Nostra",
     "avviso": "Con il diabete e i piedi poco sensibili non stare scalzo: fallo da seduto, con le scarpe."
    },
    {
     "cod": "E15",
     "nome": "Short foot, l'addominale del piede",
     "serve": "Accende i muscoli della pianta e alza l'arco: è la base di squat e affondi.",
     "come": "Apri bene le dita. Attiva i tre punti (base dell'alluce, base del mignolo, tallone) e «acchiappa» il pavimento: la volta si alza e i metatarsi si avvicinano al tallone. Le dita restano lunghe, senza piegarsi.",
     "senti": "L'arco che si alza e il piede che si accorcia.",
     "evita": "Di arricciare le dita e chiudere i pugni. Di lavorare solo con l'avampiede: anche il retropiede, da dove parte l'inversione, deve accendersi. Se la base dell'alluce si solleva invece di scorrere verso il tallone, allena prima solo l'alluce.",
     "dose": "Nostra: 3 tenute da 20–25 secondi per piede, prima da seduto. Coach: col tempo, 30–50 secondi «come se facessi un plank».",
     "origineDose": "Coach e Nostra",
     "avviso": "Con il diabete e i piedi poco sensibili non stare scalzo: fallo da seduto, con le scarpe."
    },
    {
     "cod": "E21",
     "nome": "Equilibrio su una gamba",
     "serve": "Un minuto su una gamba ti dice com'è il tuo appoggio, e allena la stabilità che serve per camminare e correre.",
     "come": "Scalzo, vicino a un muro o a una sedia da toccare se serve. Su una gamba, un minuto per gamba, più volte al giorno, come gioco. Poi a occhi chiusi, quando a occhi aperti stai fermo.",
     "senti": "Il piede che lavora per tenerti. Se è instabile, prova lo short foot e porta il ginocchio in fuori.",
     "evita": "Di irrigidirti: è un gioco. Di chiudere gli occhi lontano da un appoggio.",
     "dose": "Coach: un minuto per gamba, più volte al giorno, scalzo se puoi. Nostra: nelle due settimane, a occhi aperti.",
     "origineDose": "Coach e Nostra",
     "avviso": "Sempre vicino a un muro o a una sedia. Con l'epilessia, mai a occhi chiusi da solo. Con il diabete e i piedi poco sensibili, tieni le scarpe."
    }
   ],
   "routine": [
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Seduto, piede destro: il tallone fa il timone, poi piccoli cerchi."
    },
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Piede sinistro."
    },
    {
     "cod": "E15",
     "durataSec": 30,
     "nota": "Piede destro: acchiappa il pavimento e tieni."
    },
    {
     "cod": "E15",
     "durataSec": 30,
     "nota": "Piede sinistro."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Alzati, scalzo, vicino a un muro o a una sedia."
    },
    {
     "cod": "E12",
     "durataSec": 30,
     "nota": "In piedi: base dell'alluce, base del mignolo, tallone."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Sulla gamba destra, occhi aperti."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Sulla gamba sinistra, occhi aperti."
    }
   ],
   "test": [
    "T4"
   ],
   "nelQuaderno": [
    "I gruppi interi «Seduto: il piede» (4 schede) e «In piedi» (7 schede). Qui ne vedi 4; lo squat è in «Tronco e glutei».",
    "In più, fra le altre: il minuto in piedi col test del peso, il tibiale posteriore, le ginocchia fuori col piede fermo, la postura da seduto.",
    "Nel programma di 12 settimane lo short foot c'è in tutte e 12, da 3 × 20 a 3 × 50 secondi; l'equilibrio su una gamba in 8, da 1 minuto a 1 minuto e 30 secondi per gamba, con gli ultimi secondi a occhi chiusi.",
    "Due prove del piede: il piede d'appoggio e il dito sotto l'arco."
   ]
  },
  {
   "id": "anche-libere",
   "nome": "Anche libere",
   "perChi": "Chi sta seduto, chi calcia, chi fa squat",
   "pillole": [
    {
     "cod": "E9",
     "nome": "Sul fianco 90/90, e due dita nel fianco",
     "serve": "Insegna al respiro ad allargare i fianchi di lato.",
     "come": "Sul fianco, anche e ginocchia a 90 gradi, schiena neutra, testa sulla mano o su un cuscino. La mano libera sul fianco di sopra: 5 + 5, inspirando il fianco spinge la mano. Poi due dita sotto le coste, nella parte morbida: inspirando il fianco le spinge via.",
     "senti": "La mano, e poi le dita, spinte via dal fianco. Memorizza la sensazione.",
     "evita": "Di curvare la schiena: diaframma e pelvico devono restare paralleli. «Colonna neutra evitando la flessione lombare». Di muovere tu la mano: è il fianco che la spinge.",
     "dose": "Da un minuto a un minuto e mezzo per lato: «un minutino, un minutino e mezzo».",
     "origineDose": "Coach",
     "avviso": "Se ti gira la testa, torna a un respiro lento e normale."
    },
    {
     "cod": "E59",
     "nome": "Stacco da seduti a 90/90: spingi il ginocchio a terra",
     "serve": "Ti fa sentire la differenza fra salire tirando con la schiena e salire spingendo col gluteo: è la base di ogni stacco.",
     "come": "Seduto a 90/90, mani staccate da terra, petto in avanti all'altezza del ginocchio davanti. Scendi in avanti come in uno stacco rumeno e risali: cinque volte, senza pensarci. Poi rifallo spingendo forte il ginocchio a terra, e risali con quella spinta. Senti la differenza.",
     "senti": "Con la spinta del ginocchio, la chiappa e «La parte posteriore della coscia.» Senza, la schiena: «Userete la schiena. Si sente proprio.»",
     "evita": "Di salire tirando con la schiena: «C'è gente che sale su con la schiena.»",
     "dose": "Coach: cinque movimenti. Nostra: 5 senza spinta e 5 con la spinta, per lato.",
     "origineDose": "Coach e Nostra",
     "avviso": "Se senti tirare o torcere il ginocchio invece dell'anca, siediti su un cuscino o apri l'angolo di quella gamba, e non forzare."
    },
    {
     "cod": "E41",
     "nome": "Retroversione e antiversione del bacino",
     "serve": "Ti insegna a muovere il bacino senza muovere il resto: ti servirà per tenere la schiena ferma mentre muovi le anche.",
     "come": "In piedi, ginocchia morbide. Retroversione: sedere in dentro, pube verso l'alto, sacro verso il basso. Antiversione: sedere in fuori, indietro. Alterna lentamente: si muove solo il bacino.",
     "senti": "Come due corde: una tira su il pube, l'altra giù il sacro.",
     "evita": "Il bacino bloccato, che si muove appena: «muovilo di più». Di scoraggiarti.",
     "dose": "8–10 alternanze lente.",
     "origineDose": "Nostra",
     "avviso": null
    },
    {
     "cod": "E42",
     "nome": "Anca su una gamba: tergicristallo, piega e stendi, l'otto",
     "serve": "Ti insegna a muovere l'anca con la schiena ferma, su una gamba: è quello che serve per camminare, correre e calciare.",
     "come": "In equilibrio su una gamba, l'altro ginocchio alzato davanti; un dito appoggiato al muro se serve. Tergicristallo: il ginocchio resta fermo e guarda avanti, si muove solo la gamba sotto: il piede sale verso l'esterno, poi torna verso l'interno. Piega e stendi: di profilo, ginocchio su fino a 90°, gamba indietro solo finché la schiena resta ferma; poi in retroversione, in antiversione, e di nuovo neutra. L'otto: disegna col ginocchio un otto fluido. Poi l'altra gamba.",
     "senti": "«Qua sto fermo, è soltanto l'anca che si muove.»",
     "evita": "Di aprire il ginocchio nel tergicristallo: «è il piede che sale». Di muovere la schiena al posto dell'anca: «Tutto di schiena e poco di anche.» Di cercare i 30° indietro: sono il massimo, e se per arrivarci la lombare si inarca sei già oltre.",
     "dose": "Per ogni gamba: 5 tergicristalli; 5 piega e stendi per ognuno dei tre assetti del bacino; 3 otto per verso.",
     "origineDose": "Nostra",
     "avviso": null
    }
   ],
   "routine": [
    {
     "cod": "E9",
     "durataSec": 40,
     "nota": "Su un fianco: 4 respiri lenti, 5 + 5, il fianco spinge la mano."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Girati sull'altro fianco."
    },
    {
     "cod": "E9",
     "durataSec": 40,
     "nota": "Altro fianco: 4 respiri lenti."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Siediti a terra a 90/90."
    },
    {
     "cod": "E59",
     "durataSec": 35,
     "nota": "5 discese senza spinta, poi 5 spingendo il ginocchio a terra."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Cambia lato: la gamba davanti va dietro."
    },
    {
     "cod": "E59",
     "durataSec": 35,
     "nota": "Altro lato: 5 senza spinta, 5 con la spinta."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Alzati, ginocchia morbide."
    },
    {
     "cod": "E41",
     "durataSec": 30,
     "nota": "8 alternanze lente: pube su, poi sedere in fuori."
    },
    {
     "cod": "E42",
     "durataSec": 45,
     "nota": "Su una gamba, un dito al muro se serve: 5 tergicristalli, poi 3 otto per verso."
    },
    {
     "cod": "E42",
     "durataSec": 45,
     "nota": "Altra gamba: 5 tergicristalli, poi 3 otto per verso."
    }
   ],
   "test": [
    "T14"
   ],
   "nelQuaderno": [
    "Il gruppo «Anche a 90/90» intero: 6 schede, seduti a terra, un lato e poi l'altro. Qui ne vedi 1.",
    "Il gruppo «Mobilità in piedi» intero: 11 schede, un'articolazione alla volta. Qui ne vedi 2, e altre 3 in «Collo e spalle».",
    "Nel programma di 12 settimane il lavoro a 90/90 c'è ogni settimana; l'anca su una gamba torna in 4 settimane, il bacino in 6."
   ]
  },
  {
   "id": "collo-e-spalle",
   "nome": "Collo e spalle",
   "perChi": "Chi lavora alla scrivania, chi tiene la guardia alta",
   "pillole": [
    {
     "cod": "E36",
     "nome": "Collo nei tre piani: il no, il sì, Totò",
     "serve": "Muove il collo nei tre piani senza schiacciarlo: prepara il lavoro del collo contro gravità, a terra.",
     "come": "In piedi, allineato. Il no: gira la testa a sinistra e a destra; poi guarda prima con gli occhi e dopo gira il collo. Il sì: per guardare in su porta prima il mento un po' avanti, poi sali con lo sguardo; per guardare in giù schiaccia leggermente il mento e scendi. Totò: mani sui fianchi, la testa trasla a sinistra e a destra, in orizzontale, senza inclinarsi.",
     "senti": "Nel sì, il collo e poi il petto che si aprono da soli: «Guardate come la colonna, fateci caso, si apre proprio il petto.» Nel no guidato dagli occhi: «Se fate caso il collo cambia molto.»",
     "evita": "Di salire piegando subito la nuca: senti «un blocco vertebrale». Di spingere molto avanti il mento: ne basta un po', e salendo la testa torna sopra le spalle. Di lasciar cadere la testa in avanti. In Totò, di inclinarla invece di traslarla. Di irrigidirti: «Fluido, fluido.»",
     "dose": "5 per direzione, lenti.",
     "origineDose": "Nostra",
     "avviso": "Se senti dolore o formicolii che scendono nel braccio, fermati e senti un medico."
    },
    {
     "cod": "E37",
     "nome": "Spalle nei tre piani",
     "serve": "Risveglia la spalla in tutte le direzioni, non solo avanti e indietro.",
     "come": "In piedi, allineato, braccia lungo i fianchi. Cerchi ampi: spalle su, indietro, in basso, avanti; tre giri, poi tre nell'altro verso. Piano frontale: immagina un pennarello sulla spalla e disegna un cerchio davanti a te. Piano trasverso: spalla avanti, fuori, indietro, dentro, cercando la clavicola che si chiude e si apre.",
     "senti": "Nei cerchi ampi, la spalla che si muove tutta. Negli altri due piani il movimento è minimo: «Lavoriamo sulla visualizzazione, la sensazione.»",
     "evita": "I cerchi piccoli: «Ampi. Ampi». Di scoraggiarti se sul piano frontale e trasverso non vedi niente: «Non è un problema.»",
     "dose": "Coach: nei cerchi ampi 3 giri per verso. Nostra: 3 cerchi per verso anche sugli altri due piani.",
     "origineDose": "Coach e Nostra",
     "avviso": null
    },
    {
     "cod": "E33",
     "nome": "Chiudi e apri il petto, lombare ferma",
     "serve": "Separa il petto da bassa schiena e spalle.",
     "come": "In piedi, allineato, bacino e bassa schiena fermi. Chiudi il petto come per assorbire un pugno: lo sterno scende e va indietro, le scapole si allontanano. Aprilo come per lanciarlo: lo sterno va avanti e in su, e le scapole si avvicinano da sole. Il movimento parte dallo sterno, non dalle scapole. Chiudi e apri, lento. Prova della spalla: a petto chiuso alza un braccio e guarda dove arriva; apri il petto e rialzalo.",
     "senti": "Il petto che si chiude e si apre senza che la bassa schiena si muova. All'inizio è rigido.",
     "evita": "Di muovere la lombare al posto del petto: «Il movimento lo stai facendo con la bassa schiena.» Di muovere solo le spalle col petto fermo: «Sono due articolazioni diverse». Di aprire senza mai chiudere.",
     "dose": "8–10 chiusure e aperture lente.",
     "origineDose": "Nostra",
     "avviso": null
    },
    {
     "cod": "E45",
     "nome": "Collo contro gravità, da supino",
     "serve": "Gli stessi movimenti del collo fatti in piedi, ma contro il peso della testa.",
     "come": "Pancia in su, ginocchia piegate. Lingua sul palato, bocca chiusa, respiro dal naso. Porta il mento appena dentro e solleva la testa di pochi centimetri; non appoggiarla fino alla fine: cinque no, cinque avanti e indietro, cinque sì (mento avanti e su, mento schiacciato e giù), cinque Totò. Fra un movimento e l'altro torna col mento appena dentro. Poi poggia.",
     "senti": "La fatica dei muscoli del collo: un minimo va bene. Il respiro è quello di sempre, «i respiri che già conosciamo».",
     "evita": "Di appoggiare la testa fra un movimento e l'altro: «senza appoggiare il collo eh». Di sollevare la testa spingendo il mento verso il soffitto: lavorano i muscoli grossi davanti al collo e la nuca si schiaccia. Di continuare se senti dolore.",
     "dose": "Cinque per movimento, con la testa sempre sollevata; la poggi solo alla fine.",
     "origineDose": "Coach",
     "avviso": "Prima fai il test del collo. Se ti ha dato dolore, salta questo esercizio. Se ti ha dato solo fatica, fai un movimento alla volta e poggia la testa fra uno e l'altro. Se il dolore scende nel braccio o senti formicolii, fermati e senti un medico. In gravidanza, se a pancia in su stai male, cambia posizione."
    }
   ],
   "routine": [
    {
     "cod": "E36",
     "durataSec": 90,
     "nota": "In piedi: 5 no, 5 sì, 5 Totò, lenti."
    },
    {
     "cod": "E37",
     "durataSec": 60,
     "nota": "Cerchi ampi, 3 per verso; poi il pennarello e la clavicola."
    },
    {
     "cod": "E33",
     "durataSec": 60,
     "nota": "8 chiusure e aperture lente, la lombare ferma."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Sdraiati a pancia in su, ginocchia piegate."
    },
    {
     "cod": "E45",
     "durataSec": 60,
     "nota": "Solo se il test del collo è andato senza dolore: 5 no, 5 avanti e indietro, 5 sì, 5 Totò."
    }
   ],
   "test": [
    "T13"
   ],
   "nelQuaderno": [
    "Il gruppo «Collo contro gravità» intero: 3 schede. Qui ne vedi 1.",
    "Il gruppo «Spalle e scapole» intero: 7 schede a terra, col respiro. Qui nessuna.",
    "Gli altri 6 esercizi della «Mobilità in piedi», fra cui gli occhi e il torace.",
    "Nel programma di 12 settimane il collo contro gravità torna in 7 settimane; il collo nei tre piani in 5, le spalle e il petto in 4.",
    "La prova del braccio su, di profilo."
   ]
  },
  {
   "id": "polsi-e-mani",
   "nome": "Polsi e mani",
   "perChi": "Presa, pugni, calisthenics",
   "pillole": [
    {
     "cod": "E38",
     "nome": "Polso e dita, in piedi",
     "serve": "Ti dà il controllo di polso e dita prima di metterci peso sopra, a quattro zampe.",
     "come": "In piedi, allineato, gomito fermo. Apri bene le dita e disegna con la mano un otto, muovendo il polso. Chiudi il pugno con forza e giralo. Poi apri: prima le dita, poi il polso, che si estende. Infine apri e chiudi le dita.",
     "senti": "Gli estensori, sul dorso dell'avambraccio: «Gli estensori che si affaticano.»",
     "evita": "Di muovere il gomito: «Gomito fermo. Si muove solo il polso.» Di perdere la postura mentre lavori con le mani.",
     "dose": "5 otto per verso e 5 aperture lente, per ogni mano.",
     "origineDose": "Nostra",
     "avviso": null
    },
    {
     "cod": "E48",
     "nome": "Polsi a quattro zampe: il gomito che gira, poi carica",
     "serve": "Abitua polsi e mani a reggere il peso, poco alla volta: è la base della routine dei polsi, fino al plank.",
     "come": "A quattro zampe, mani a terra sotto le spalle con le dita in avanti, braccia tese. Senza muovere le mani ruota il gomito in avanti, così che la piega guardi avanti; poi indietro. Alterna, «uno, due». Tieni il peso sulle gambe; man mano portalo sulle braccia.",
     "senti": "Il peso sulle mani: «intanto già metterci il peso sopra non è male».",
     "evita": "Troppo carico subito. Di bloccare i gomiti all'indietro: braccia tese, ma non spinte oltre il dritto.",
     "dose": "2 serie da 10 rotazioni.",
     "origineDose": "Nostra",
     "avviso": "Se non puoi appoggiare le mani a terra, resta sul polso in piedi. Se il polso fa male, porta più peso sulle gambe o fermati."
    },
    {
     "cod": "E50",
     "nome": "Polsi su angoli diversi",
     "serve": "Carica il polso da ogni direzione, non solo dritto.",
     "come": "A quattro zampe, mani a terra, braccia tese. Sposta il peso in avanti, oltre le mani; poi a destra, a sinistra, indietro. Poi disegna dei cerchi col peso sopra le mani.",
     "senti": "Il carico che arriva sui polsi da angoli diversi: «vado a mettere carico sui tessuti, sui vari tipi di angoli».",
     "evita": "Di piegare le braccia. Di caricare tanto all'inizio: prima poco peso, poi di più.",
     "dose": "5 spostamenti per direzione, poi 5 cerchi per verso.",
     "origineDose": "Nostra",
     "avviso": "Se non puoi appoggiare le mani a terra, resta sul polso in piedi. Se il polso fa male, porta più peso sulle gambe o fermati."
    },
    {
     "cod": "E51",
     "nome": "Allungamento dei flessori: mani girate, seduto indietro",
     "serve": "Allunga l'interno dell'avambraccio, che ha appena lavorato.",
     "come": "A quattro zampe, togli il peso da una mano e girala di 180°: le dita guardano le ginocchia; poi l'altra. Braccia tese, porta il sedere indietro verso i talloni e resta nell'allungamento. Poi molla.",
     "senti": "L'allungamento nell'interno dell'avambraccio: «vado a fare stretch di tutta questa parte».",
     "evita": "Di restare troppo avanti: «andate indietro». Di piegare le braccia. Di girare le mani col peso sopra. Di restare se senti formicolio o una scossa nelle dita: torna un po' avanti.",
     "dose": "20–30 secondi, respiro lento dal naso.",
     "origineDose": "Nostra",
     "avviso": "Se non puoi appoggiare le mani a terra, resta sul polso in piedi."
    }
   ],
   "routine": [
    {
     "cod": "E38",
     "durataSec": 50,
     "nota": "Mano destra: 5 otto per verso, pugno forte, poi apri dita e polso."
    },
    {
     "cod": "E38",
     "durataSec": 50,
     "nota": "Mano sinistra."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "A quattro zampe, mani sotto le spalle."
    },
    {
     "cod": "E48",
     "durataSec": 60,
     "nota": "10 rotazioni del gomito; il peso passa piano dalle gambe alle braccia."
    },
    {
     "cod": "E50",
     "durataSec": 75,
     "nota": "5 spostamenti per direzione, poi 5 cerchi per verso."
    },
    {
     "cod": "E51",
     "durataSec": 30,
     "nota": "Gira le mani, dita verso le ginocchia, siediti indietro e tieni."
    }
   ],
   "test": [],
   "nelQuaderno": [
    "Il gruppo «Polsi e mani» intero: 9 schede. Qui ne vedi 4; fra le altre, l'allungamento a pugni chiusi.",
    "Per il coach la routine dei polsi «non deve mai mancare»: nel programma di 12 settimane i polsi ci sono ogni settimana.",
    "I polsi a quattro zampe crescono da 2 × 10 a 3 × 12."
   ]
  },
  {
   "id": "tronco-e-glutei",
   "nome": "Tronco e glutei",
   "perChi": "La base per correre e sollevare",
   "pillole": [
    {
     "cod": "E19",
     "nome": "Ponte glutei",
     "serve": "Insegna a spingere il bacino col gluteo, non con la schiena: lo stesso schema dello stacco e della corsa.",
     "come": "Pancia in su, ginocchia piegate, piedi ben piantati a un palmo dal sedere (short foot se riesci), gomiti a terra e avambracci in alto. Inspira a terra e allarga il cilindro; poi, buttando fuori l'aria, spingi i gomiti nel pavimento e sali col bacino finché spalle, bacino e ginocchia sono in linea, non oltre. Le ginocchia vanno avanti, verso le punte, e l'anca si apre: in alto le tibie sono quasi verticali. Respira lento, cercando il pelvico a ogni respiro.",
     "senti": "Il gluteo che spinge su il bacino, per primo e più di tutto; dietro la coscia lavora poco. Il bacino che sale in piano.",
     "evita": "Di tirare con la schiena: «Non tiro sulla schiena ma vado avanti con le ginocchia». Di salire oltre la linea spalle–bacino–ginocchia: è estensione lombare. Di tenere i piedi lontani dal sedere: lavorano prima i femorali e arriva il crampo dietro la coscia; avvicinali.",
     "dose": "10 ripetizioni.",
     "origineDose": "Coach",
     "avviso": "In gravidanza, se a pancia in su stai male, cambia posizione."
    },
    {
     "cod": "E25",
     "nome": "Dead bug e propedeutiche alla camminata",
     "serve": "Insegna a tenere il tronco fermo mentre braccia e gambe si muovono: è lo schema della camminata, costruito da sdraiato.",
     "come": "Pancia in su, ginocchia piegate, colonna neutra e allungata, gomiti a terra e avambracci in alto, come nel ponte; respira coste, pancia, petto. A tappe: un ginocchio al petto, poi l'altro, senza che il bacino ruoti; poi mentre una gamba sale l'altra spinge a terra; poi il gomito di un lato e il piede dell'altro spingono a terra, e salgono il ginocchio e il braccio rimasti. Prima inspira, poi muovi; torna giù buttando fuori l'aria.",
     "senti": "Il tronco fermo come un blocco mentre braccia e gambe si muovono: «Tronco fermo, arti in movimento».",
     "evita": "Il bacino che ruota o la schiena che si inarca quando alzi una gamba: manca stabilità. «senza sculare e perdere la schiena».",
     "dose": "8–10 ripetizioni per lato.",
     "origineDose": "Coach",
     "avviso": "In gravidanza, se a pancia in su stai male, cambia posizione."
    },
    {
     "cod": "E26",
     "nome": "Bird dog con bottiglietta",
     "serve": "Muovi braccio e gamba opposti con la schiena ferma: è la camminata ricostruita a quattro zampe.",
     "come": "A quattro zampe, ginocchia sotto le anche e mani sotto le spalle (anche e spalle a 90 gradi), schiena neutra, una bottiglietta lungo la colonna. Prima respira: fianchi e schiena, pelvico. Poi allunga piano un braccio in avanti e la gamba opposta indietro, fino alla linea del tronco, senza far cadere la bottiglia. Respiro, allargo, connetto col pelvico, muovo.",
     "senti": "Il gluteo della gamba che sale; mano e ginocchio a terra «incollati» con una leggera tensione. La lombare «come se fosse ingessata».",
     "evita": "L'anca che balla, la schiena che si spezza, il petto chiuso. La gamba più in alto della linea del tronco: oltre i «90 gradi» del coach, cioè oltre l'orizzontale, estendi la lombare. All'opposto, partire flesso: «Parti già neutro». Di tirare un calcio: l'allungo è lento. La bottiglia che cade te lo dice.",
     "dose": "Nostra: 2 serie da 6 per lato, lente. Coach: col tempo 3 serie da 10 per lato.",
     "origineDose": "Coach e Nostra",
     "avviso": "Se non puoi stare in ginocchio o appoggiare le mani, fai il dead bug a pancia in su."
    },
    {
     "cod": "E28",
     "nome": "Squat tecnico",
     "serve": "In un solo gesto unisce respiro, piede e pelvico imparati a terra.",
     "come": "Lento e controllato. Scendi inspirando e gonfiando il cilindro: fianchi larghi, connessione col pelvico. Giù, fermati un attimo: short foot e trattieni la pipì. Poi sali buttando fuori l'aria, senza svuotarti prima di partire.",
     "senti": "«una contrazione riflessa involontaria del gluteo», dei muscoli profondi sotto il gluteo. Prova tre squat senza short foot e pipì, poi tre con.",
     "evita": "Di salire senza aver attivato piede e pelvico; di tirare con la schiena.",
     "dose": "Nostra: 2 serie da 8, lente. Coach: quando lo schema è fissato, 3 serie da 15–20. Non la sera: attiva troppo.",
     "origineDose": "Coach e Nostra",
     "avviso": "In basso c'è una pausa breve a fiato pieno: saltalo se sei in gravidanza o hai problemi di cuore o pressione non controllata, e chiedi prima al medico. Con problemi del pavimento pelvico, chiedi prima. «Trattieni la pipì» è un'immagine: mai mentre urini davvero. Se senti dolore, fermati."
    }
   ],
   "routine": [
    {
     "cod": "E19",
     "durataSec": 60,
     "nota": "8–10 ponti lenti: sali buttando fuori l'aria."
    },
    {
     "cod": "E25",
     "durataSec": 90,
     "nota": "A tappe, alternando i lati: 8 per lato."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "A quattro zampe, la bottiglietta sulla schiena se ce l'hai."
    },
    {
     "cod": "E26",
     "durataSec": 60,
     "nota": "Braccio e gamba opposti, lenti: 5 per lato."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Alzati."
    },
    {
     "cod": "E28",
     "durataSec": 60,
     "nota": "6–8 squat lenti: scendi inspirando, sali buttando fuori l'aria."
    }
   ],
   "test": [],
   "nelQuaderno": [
    "I gruppi interi «Pancia in su e sul fianco: le anche» (4 schede) e «Quadrupedia e in ginocchio» (5 schede). Qui ne vedi 3, più lo squat.",
    "In più, fra le altre: l'estensione dell'anca da prono, il gatto-mucca, il cammello, lo stacco rumeno al muro e col bastone.",
    "Nel programma di 12 settimane ponte e dead bug tornano in 8 settimane; lo squat in 8, da 2 × 8 a 3 × 20 nel blocco «Il carico» delle settimane 9–12."
   ]
  }
 ],
 "percorsi": [
  {
   "id": "benessere",
   "nome": "Benessere",
   "perChi": "Chi lavora seduto e non fa sport",
   "strutture": [
    "respiro-basso",
    "collo-e-spalle",
    "anche-libere"
   ],
   "sessione": [
    {
     "cod": "E36",
     "durataSec": 90,
     "nota": "5 per direzione, lenti."
    },
    {
     "cod": "E37",
     "durataSec": 60,
     "nota": "3 cerchi per verso, nei tre piani."
    },
    {
     "cod": "E33",
     "durataSec": 60,
     "nota": "8–10 chiusure e aperture lente."
    },
    {
     "cod": "E41",
     "durataSec": 45,
     "nota": "8–10 alternanze lente."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba destra: 5 tergicristalli, poi 3 otto per verso."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba sinistra."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Sdraiati su un fianco."
    },
    {
     "cod": "E9",
     "durataSec": 75,
     "nota": "Un fianco: 5 + 5, il fianco spinge la mano."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Girati sull'altro fianco."
    },
    {
     "cod": "E9",
     "durataSec": 75,
     "nota": "Altro fianco."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Pancia in su, ginocchia piegate."
    },
    {
     "cod": "E1",
     "durataSec": 60,
     "nota": "Una mano sul petto, una sulla pancia."
    },
    {
     "cod": "E4",
     "durataSec": 90,
     "nota": "Prima le coste, poi pancia e schiena, per ultimo il petto."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Girati a pancia in giù."
    },
    {
     "cod": "E7",
     "durataSec": 90,
     "nota": "Respira nella schiena, 5 + 5."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Torna a pancia in su, o siediti."
    },
    {
     "cod": "E2",
     "durataSec": 90,
     "nota": "5 secondi dentro e 5 fuori, per chiudere."
    }
   ]
  },
  {
   "id": "corsa-e-fiato",
   "nome": "Corsa e fiato",
   "perChi": "Chi corre o fa sport di resistenza",
   "strutture": [
    "piede-che-tiene",
    "respiro-basso",
    "tronco-e-glutei"
   ],
   "sessione": [
    {
     "cod": "E1",
     "durataSec": 60,
     "nota": "Una mano sul petto, una sulla pancia."
    },
    {
     "cod": "E4",
     "durataSec": 90,
     "nota": "Prima le coste, poi pancia e schiena, per ultimo il petto."
    },
    {
     "cod": "E19",
     "durataSec": 60,
     "nota": "10 ponti lenti."
    },
    {
     "cod": "E25",
     "durataSec": 90,
     "nota": "8 per lato, a tappe."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Girati a pancia in giù."
    },
    {
     "cod": "E7",
     "durataSec": 90,
     "nota": "Respira nella schiena, 5 + 5."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "A quattro zampe."
    },
    {
     "cod": "E26",
     "durataSec": 60,
     "nota": "5 per lato, lenti."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Siediti, piedi a terra, scalzo."
    },
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Piede destro."
    },
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Piede sinistro."
    },
    {
     "cod": "E15",
     "durataSec": 40,
     "nota": "Piede destro: tieni."
    },
    {
     "cod": "E15",
     "durataSec": 40,
     "nota": "Piede sinistro: tieni."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Alzati, vicino a un muro."
    },
    {
     "cod": "E12",
     "durataSec": 30,
     "nota": "I tre punti, in piedi."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba destra, occhi aperti."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba sinistra, occhi aperti."
    },
    {
     "cod": "E28",
     "durataSec": 75,
     "nota": "8 squat lenti."
    }
   ]
  },
  {
   "id": "combattimento",
   "nome": "Combattimento",
   "perChi": "Arti marziali, colpi, lotta",
   "strutture": [
    "anche-libere",
    "polsi-e-mani",
    "piede-che-tiene"
   ],
   "sessione": [
    {
     "cod": "E38",
     "durataSec": 40,
     "nota": "Mano destra."
    },
    {
     "cod": "E38",
     "durataSec": 40,
     "nota": "Mano sinistra."
    },
    {
     "cod": "E41",
     "durataSec": 45,
     "nota": "8–10 alternanze lente."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba destra: 5 tergicristalli, poi 3 otto per verso."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba sinistra."
    },
    {
     "cod": "E12",
     "durataSec": 30,
     "nota": "I tre punti, scalzo."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba destra, occhi aperti."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba sinistra, occhi aperti."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "A terra, su un fianco."
    },
    {
     "cod": "E9",
     "durataSec": 60,
     "nota": "Un fianco: 5 + 5."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Girati sull'altro fianco."
    },
    {
     "cod": "E9",
     "durataSec": 60,
     "nota": "Altro fianco."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Siediti a terra a 90/90."
    },
    {
     "cod": "E59",
     "durataSec": 40,
     "nota": "5 senza spinta, poi 5 con la spinta."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Cambia lato."
    },
    {
     "cod": "E59",
     "durataSec": 40,
     "nota": "Altro lato."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "A quattro zampe."
    },
    {
     "cod": "E48",
     "durataSec": 60,
     "nota": "10 rotazioni."
    },
    {
     "cod": "E50",
     "durataSec": 75,
     "nota": "5 per direzione, poi 5 cerchi per verso."
    },
    {
     "cod": "E51",
     "durataSec": 30,
     "nota": "Siediti indietro e tieni."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Siediti su una sedia, piedi a terra."
    },
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Piede destro."
    },
    {
     "cod": "E14",
     "durataSec": 45,
     "nota": "Piede sinistro."
    }
   ]
  },
  {
   "id": "forza-e-scatti",
   "nome": "Forza e scatti",
   "perChi": "Palestra, calisthenics, sport di squadra",
   "strutture": [
    "tronco-e-glutei",
    "piede-che-tiene",
    "anche-libere"
   ],
   "sessione": [
    {
     "cod": "E19",
     "durataSec": 60,
     "nota": "10 ponti lenti."
    },
    {
     "cod": "E25",
     "durataSec": 90,
     "nota": "8 per lato, a tappe."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "A quattro zampe."
    },
    {
     "cod": "E26",
     "durataSec": 120,
     "nota": "10 per lato, lenti."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Siediti a terra a 90/90."
    },
    {
     "cod": "E59",
     "durataSec": 40,
     "nota": "5 senza spinta, poi 5 con la spinta."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Cambia lato."
    },
    {
     "cod": "E59",
     "durataSec": 40,
     "nota": "Altro lato."
    },
    {
     "cod": "cambio",
     "durataSec": 15,
     "nota": "Siediti coi piedi a terra, scalzo."
    },
    {
     "cod": "E15",
     "durataSec": 40,
     "nota": "Piede destro: tieni."
    },
    {
     "cod": "E15",
     "durataSec": 40,
     "nota": "Piede sinistro: tieni."
    },
    {
     "cod": "cambio",
     "durataSec": 10,
     "nota": "Alzati, vicino a un muro."
    },
    {
     "cod": "E41",
     "durataSec": 45,
     "nota": "8–10 alternanze lente."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba destra: 5 tergicristalli, poi 3 otto per verso."
    },
    {
     "cod": "E42",
     "durataSec": 50,
     "nota": "Gamba sinistra."
    },
    {
     "cod": "E12",
     "durataSec": 30,
     "nota": "I tre punti."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba destra, occhi aperti."
    },
    {
     "cod": "E21",
     "durataSec": 60,
     "nota": "Gamba sinistra, occhi aperti."
    },
    {
     "cod": "E28",
     "durataSec": 120,
     "nota": "Una serie da 15 squat lenti."
    }
   ]
  }
 ],
 "test": [
  {
   "cod": "T2",
   "nome": "Respiri al minuto",
   "come": "Seduto e rilassato, appoggiato allo schienale se c'è. Resta fermo un minuto, poi respira normalmente e conta i respiri che fai in un minuto intero, col cronometro. Non rallentare apposta perché ti stai osservando: se puoi, fatti contare da qualcuno.",
   "frase": "Per gli adulti a riposo il riferimento è 12–20 respiri al minuto. Il tuo numero serve a confrontarti con te stesso: rifallo fra due settimane, alla stessa ora. Se conti più di 20, rifallo dopo qualche minuto seduto e tranquillo."
  },
  {
   "cod": "T1",
   "nome": "BOLT",
   "come": "Saltalo se sei in gravidanza, hai problemi di cuore o pressione non controllata, se ti capita di svenire, se hai epilessia o attacchi di panico, e chiedi prima al medico. Mai in acqua o alla guida. Seduto e tranquillo, qualche respiro normale dal naso. Dopo un'espirazione normale, non forzata, tappa il naso e fai partire il cronometro. Fermalo al primo segnale: voglia di deglutire, primo spasmo, prima fame d'aria; poi respira normalmente. Se alla ripresa boccheggi, sei rimasto troppo. Fai due prove a 5 minuti di distanza e tieni la seconda.",
   "frase": "Il numero serve a confrontarti con te stesso, non è un voto. Rifallo fra due settimane, alla stessa ora e prima del caffè: una differenza sotto gli 8 secondi circa può dipendere dal caso."
  },
  {
   "cod": "T4",
   "nome": "Equilibrio su una gamba, occhi chiusi",
   "come": "Scalzo, vicino a un muro o a una sedia da toccare se serve. Con l'epilessia non farlo a occhi chiusi da solo; con il diabete e i piedi poco sensibili, tieni le scarpe. Su una gamba, l'altro ginocchio alzato: chiudi gli occhi e fai partire il cronometro. Fermalo quando apri gli occhi, tocchi l'appoggio o posi il piede. Tre prove, tieni la migliore; fermati comunque a 30 secondi.",
   "frase": "È un riferimento per te, non un voto: conta il confronto con te stesso fra due settimane."
  },
  {
   "cod": "T13",
   "nome": "Test del collo: 10 secondi a testa su",
   "come": "Pancia in su, ginocchia piegate, piedi a terra. Lingua sul palato e mento appena dentro, come un piccolo doppio mento. Solleva la testa di qualche centimetro senza alzare il mento e resta 10 secondi respirando, senza trattenere il respiro. Poggia la testa e chiediti se hai sentito fatica, fastidio o dolore. Se senti dolore, ti fermi subito.",
   "frase": "Tieni 10 secondi o no: è solo il punto da cui parti, e lo rifai fra due settimane. Se hai sentito dolore, salta gli esercizi del collo a terra; se il dolore è forte, resta o scende nel braccio, senti un medico."
  },
  {
   "cod": "T14",
   "nome": "Flessibile o mobile?",
   "come": "Seduto a 90/90, appoggiato su un gomito. Prendi il piede con la mano e tiralo su: quanto sale è la tua flessibilità. Riportalo giù. Ora sollevalo senza mano, con la forza: quanto sale è la tua mobilità. Confronta le due altezze. Sali piano e fermati se tira il ginocchio invece dell'anca.",
   "frase": "Segna se la seconda altezza è uguale, poco sotto o molto sotto la prima. Se la differenza è grande non succede nulla: è il punto da cui parti, e la rivedi fra qualche settimana."
  }
 ],
 "generale": {
  "avviso": "Questi esercizi sono pensati per adulti. Se senti dolore, fermati. Se sei in gravidanza, hai problemi di cuore o pressione non controllata, epilessia o attacchi di panico, leggi l'avviso sotto ogni pillola e, nel dubbio, chiedi prima al medico. Con il diabete e i piedi poco sensibili, niente esercizi a piedi nudi.",
  "frequenza": "Per due settimane, da 2 a 4 volte a settimana, l'ideale ogni giorno, senza aggiungere altro.",
  "origineFrequenza": "Coach"
 }
};
