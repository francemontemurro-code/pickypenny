# Picky Penny 🍓⭐🎈

Gioco per i più piccoli che usa la **telecamera frontale** del telefono: chi gioca diventa *Penny*, un personaggio buffo che si muove come lui, e deve **acchiappare al volo** quello che cade e vola da tutte le parti.

## Le modalità

| | Modalità | Come si gioca |
|---|---|---|
| 🍓 | **Acchiappa tutto** | Punti, combo, poteri, pentolaccia, sfide lampo. A ogni livello si cambia mondo. |
| 🔤 | **La parola** | Penny dice una parola: prendi le lettere in ordine (a sorpresa o scelta da te). |
| 🔢 | **I numeri** | Prendi 1, 2, 3… in ordine. |
| 🎨 | **I colori** | «Prendi solo le cose rosse!» |
| 🐮 | **Chi fa muu?** | Penny fa un verso: prendi l'animale giusto (🔊 per riascoltare). |
| 🍎 | **Conta!** | «Prendi 4 mele!» |

Negli ultimi cinque, quando prendi la cosa sbagliata quella rimbalza via, senza togliere punti.

## Cosa rende la partita più divertente

- **6 mondi**, uno nuovo a ogni livello: Prato 🌼, Mare 🌊, Giungla 🌴, Polo Nord ❄️, Paese dei Dolci 🍭, Spazio 🚀, ognuno con i suoi oggetti, sfondo animato e musica.
- **Combo**: tante prese di fila → *Super Penny* ⚡ (punti ×2, scia arcobaleno), poi *Mega Penny* 🌟 (×3). Si perde toccando gli oggetti col cerchio rosso o sbagliando.
- **Poteri speciali**: 🧲 calamita, 🐢 rallentatore, 🦍 mani giganti, 🌈 pioggia di stelle.
- **Pentolaccia** 🪅: colpiscila più volte e piovono dolcetti da 2 punti.
- **Sfide lampo** ⚡: «prendi 3 stelle», «8 cose in 10 secondi», «non toccare niente col cerchio rosso».
- **Penny dice** 🙌: salta, accucciati, mani in alto, batti le mani 3 volte, aeroplano, mani sulla testa. La telecamera controlla che lo fai davvero; se riesci arriva una pioggia di premi.
- **Facce di Penny**: sorride, si stupisce, fa «ahi!», sbatte gli occhi; una voce fa il tifo.
- **In due**: due Penny (azzurra e arancione) giocano insieme, con il conteggio delle prese di ciascuno.

## Cosa fa tornare a giocare

- **Album di 24 figurine**: ogni premio finale è una figurina. Quelle mancanti si vedono come sagome; i doppioni danno monetine.
- **Vestiti per Penny** 👕: cappelli, occhiali, magliette (anche arcobaleno), mantelli, colore della faccia. Si comprano con le **monetine** 🪙.
- **Sfide del giorno** 🏅: 3 sfide nuove ogni giorno (+15 🪙 l'una). Completandole tutte arriva una figurina in regalo e parte la serie di giorni 🔥.
- **Record** per ogni modalità ed età.

Tutto viene salvato sul telefono (localStorage): niente account, niente server.

## Impostazioni della partita

Modalità, età (3–4 / 5–6 / 7+), da soli o in due, minuti per round, round per il premio, presa con una mano o con due mani unite 🧺, grandezza di Penny, oggetti da evitare, musica, riquadro della telecamera.

## Come si gioca

1. Appoggia il telefono in piedi con lo schermo verso chi gioca.
2. Fai 2 passi indietro: si devono vedere busto e mani.
3. **Alza le mani sopra la testa** per partire (oppure «Inizia ora»).
4. Senza telecamera si può giocare **col dito**.

## Tecnologia

- HTML + CSS + JavaScript (moduli ES), nessuna build.
- Riconoscimento del corpo: [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) *lite*, fino a 2 persone, caricato da CDN. **Le immagini della telecamera restano sul telefono.**
- Voce: sintesi vocale del browser in italiano. Suoni e musica generati al volo (Web Audio).
- PWA: si aggiunge alla schermata Home dell'iPhone (Safari › Condividi › Aggiungi alla schermata Home).

## File

| File | Cosa contiene |
|---|---|
| `index.html`, `style.css` | Schermate e grafica |
| `js/game.js` | Partita: round, livelli, combo, poteri, eventi, flusso |
| `js/modes.js` | Le 6 modalità |
| `js/pose.js` | Telecamera, riconoscimento, 2 giocatori, gesti |
| `js/draw.js` | Mondi, Penny con i vestiti, oggetti, effetti |
| `js/ui.js` | Home, album, guardaroba, sfide, record |
| `js/store.js` | Salvataggi, monetine, figurine, sfide del giorno |
| `js/audio.js` | Suoni, musica, voce |
| `js/data.js` | Tutti i contenuti (mondi, figurine, vestiti, parole…) |
| `netlify.toml` | Configurazione Netlify |

## Pubblicazione

Netlify pubblica in automatico ogni push su `main` (nessuna build, publish directory `.`).
