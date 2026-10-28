# Picky Penny 🍓⭐🎈

Gioco per i più piccoli che usa la **telecamera frontale** del telefono: chi gioca diventa *Penny*, un personaggio stilizzato che segue i movimenti del corpo, e deve **acchiappare al volo** gli oggetti che cadono e volano da tutte le parti.

## Modalità

1. **Acchiappa tutto** – ogni oggetto vale 1 punto, le stelle ⭐ valgono 3. Raggiunti i punti del livello si sale di livello e gli oggetti vanno più veloci.
2. **Acchiappa la parola** – Penny dice una parola (che resta in alto sullo schermo) e bisogna prendere le lettere **in ordine**. Lettera sbagliata = rimbalza via, nessuna penalità. Ogni parola completata fa salire di livello. La parola può essere a sorpresa o scelta da te.

## Penny segue il corpo

Penny si muove come chi gioca, in modo morbido e immediato, con le braccia un po' elastiche per arrivare agli oggetti. Se chi gioca è troppo vicino alla telecamera, Penny viene rimpicciolita fino alla grandezza scelta nel menu (**Piccola / Media / Grande**) e il movimento a destra e sinistra viene amplificato, così si raggiunge tutto lo schermo. La telecamera vera si vede in un riquadro nell'angolo (si può spegnere).

## Come si acchiappa

- **Con una mano** – basta toccare l'oggetto con una mano.
- **Con due mani unite** 🧺 – si acchiappa solo unendo le mani, come per prendere una palla: niente prese per sbaglio agitando le braccia.

Nella modalità *Acchiappa tutto* si possono attivare gli **oggetti da evitare** (🌵 🌧️ 🦔): toccarli toglie 2 punti e congela le mani per un secondo. Per i 3–4 anni compaiono dal livello 2.

## Regole del round

- Prima di giocare scegli **minuti per round** e **quanti round** servono per il premio.
- La velocità cresce col **livello** e anche col **tempo** dentro ogni round.
- Alla fine dell'ultimo round arriva un **premio a caso**, scherzoso (e un bonus da fare in famiglia).
- Tre livelli di difficoltà per età: 3–4, 5–6, 7+ anni (dimensione e velocità degli oggetti, lunghezza delle parole, aiutino che fa brillare la lettera giusta per i più piccoli).

## Come si gioca

1. Appoggia il telefono in piedi (contro qualcosa) con lo schermo verso chi gioca.
2. Fai 2 passi indietro: si devono vedere almeno busto e mani.
3. **Alza le mani sopra la testa** per partire (oppure il genitore preme «Inizia ora»).
4. Senza telecamera si può giocare **col dito**, toccando gli oggetti.

## Tecnologia

- HTML + CSS + JavaScript, nessuna build.
- Riconoscimento del corpo: [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) (modello *lite*), caricato da CDN. **Le immagini della telecamera restano sul telefono.**
- Voce: sintesi vocale del browser in italiano. Suoni generati al volo (Web Audio).
- PWA: si può aggiungere alla schermata Home dell'iPhone (Safari › Condividi › Aggiungi alla schermata Home).

## File

| File | Cosa contiene |
|---|---|
| `index.html` | Schermate (menu, pronti, intro, round, premio, pausa) |
| `style.css` | Grafica |
| `game.js` | Telecamera, riconoscimento, gioco, livelli, premi |
| `manifest.webmanifest`, `sw.js`, `icons/` | App installabile |
| `netlify.toml` | Configurazione Netlify (nessuna build, permesso fotocamera) |

## Pubblicazione su Netlify

1. Netlify › **Add new site › Import an existing project › GitHub** › scegli `pickypenny`.
2. Branch: `main` · Build command: *vuoto* · Publish directory: `.`
3. Deploy. Ogni push su `main` ripubblica in automatico.

La fotocamera funziona solo in **HTTPS** (Netlify lo fornisce già).
