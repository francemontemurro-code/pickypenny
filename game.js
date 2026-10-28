// Picky Penny — gioco con la telecamera frontale per i più piccoli.
// Il riconoscimento del corpo usa MediaPipe Pose Landmarker e gira tutto sul telefono.

const MP_VER = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const UI_FONT = '"Baloo 2","Arial Rounded MT Bold",system-ui,sans-serif';

// ---------- difficoltà per età ----------
const AGES = {
  // penny = larghezza spalle di Penny (frazione del lato corto dello schermo); avoidFrom = livello da cui compaiono gli oggetti da evitare
  mini:  { speed: 0.15, size: 0.08,  target: 8,  maxObj: 4, spawn: 1.6, catchR: 0.075, penny: 0.2,  rightProb: 0.6, needEvery: 2.0, minLen: 3, maxLen: 4, helper: true,  patterns: [0.75, 0.25, 0],   avoidFrom: 2, avoidProb: 0.14 },
  small: { speed: 0.21, size: 0.068, target: 12, maxObj: 6, spawn: 1.2, catchR: 0.062, penny: 0.18, rightProb: 0.5, needEvery: 2.6, minLen: 4, maxLen: 5, helper: false, patterns: [0.6, 0.3, 0.1],  avoidFrom: 1, avoidProb: 0.2 },
  big:   { speed: 0.29, size: 0.058, target: 15, maxObj: 8, spawn: 0.9, catchR: 0.052, penny: 0.16, rightProb: 0.4, needEvery: 3.2, minLen: 5, maxLen: 6, helper: false, patterns: [0.5, 0.3, 0.2],  avoidFrom: 1, avoidProb: 0.26 },
};
const AVOID = ['🌵', '🌧️', '🦔'];
const MINUTES = [0.5, 1, 2, 3, 4, 5, 7, 10];

const ITEMS = ['🍎', '🍌', '🍓', '🍉', '⚽', '🎈', '🧸', '🍭', '🍩', '🐥', '🦋', '🍒', '🧁', '🐞'];
const STAR = '⭐';

const WORDS = [
  ['SOLE', '☀️'], ['MELA', '🍎'], ['CANE', '🐶'], ['ORSO', '🐻'], ['LUNA', '🌙'], ['CASA', '🏠'],
  ['NAVE', '⛵'], ['TOPO', '🐭'], ['RANA', '🐸'], ['UOVO', '🥚'], ['FATA', '🧚'], ['MARE', '🌊'],
  ['PERA', '🍐'], ['APE', '🐝'], ['RE', '👑'], ['BUS', '🚌'],
  ['GATTO', '🐱'], ['FIORE', '🌸'], ['PESCE', '🐟'], ['PALLA', '⚽'], ['TRENO', '🚂'], ['TORTA', '🎂'],
  ['LEONE', '🦁'], ['MUCCA', '🐮'], ['PIZZA', '🍕'], ['RAZZO', '🚀'], ['ZEBRA', '🦓'], ['BIMBA', '👧'],
  ['STELLA', '⭐'], ['BANANA', '🍌'], ['GELATO', '🍦'], ['MAIALE', '🐷'], ['PANDA', '🐼'], ['NUVOLA', '☁️'],
  ['CAVALLO', '🐴'], ['CONIGLIO', '🐰'], ['PINGUINO', '🐧'], ['FARFALLA', '🦋'], ['ELEFANTE', '🐘'],
];
const LETTERS = 'ABCDEFGILMNOPRSTUVZ';

const PRIZES = [
  ['🧦', "Il Calzino d'Oro del Campione Acchiappatutto"],
  ['🍌', 'La Medaglia della Banana Volante'],
  ['👑', 'La Corona del Re (o della Regina) delle Pernacchie'],
  ['🦖', 'La patente ufficiale per guidare un dinosauro'],
  ['🐧', 'Il titolo di Gran Capo dei Pinguini Ballerini'],
  ['🍝', 'La Coppa Spaghettosa del Super Riflesso'],
  ['🚀', 'Un biglietto per la Luna (ritorno per cena incluso)'],
  ['🥋', 'Il Diploma di Ninja delle Polpette'],
  ['🦄', 'Un unicorno invisibile da tenere in tasca'],
  ['🧁', 'Il Trofeo del Cupcake Saltellante'],
  ['🐸', 'Un abbraccio speciale della Rana Ranocchia'],
  ['🎩', 'Il cappello magico che fa sparire i broccoli (forse)'],
  ['🦸', 'Il mantello da Super Acchiappatore'],
  ['🐌', 'Una lumaca da corsa super veloce'],
  ['🥇', 'La Medaglia di Campione del Mondo del Salto della Pozzanghera'],
  ['🍕', 'La pizza immaginaria più grande dell’universo'],
  ['🐉', 'Un drago cucciolo che fa le bolle di sapone'],
];
const BONUS = [
  'Bonus: 10 secondi di solletico da chi ti guarda! 🤗',
  'Bonus: un balletto della vittoria tutti insieme! 💃',
  'Bonus: la prossima volta scegli tu il gioco! 🎲',
  'Bonus: un super batti cinque! ✋',
  'Bonus: fai la faccia più buffa che sai! 🤪',
  'Bonus: un bacio sul naso! 😘',
  'Bonus: urla «SONO UN CAMPIONE!» 📣',
];

// ---------- utilità ----------
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function show(el) { (typeof el === 'string' ? $(el) : el).classList.remove('hidden'); }
function hide(el) { (typeof el === 'string' ? $(el) : el).classList.add('hidden'); }
function hideScreens() { document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden')); }
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = clamp(t, 0, 1);
  const x = ax + t * dx, y = ay + t * dy; return Math.hypot(px - x, py - y);
}
function cleanWord(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
}

// ---------- impostazioni ----------
const DEFAULTS = { mode: 'punti', age: 'mini', minutes: 2, rounds: 3, wordChoice: 'random', customWord: '', showCam: true, catchMode: 'mano', avoid: true };
let S = { ...DEFAULTS };
try { S = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('pickypenny.settings') || '{}') }; } catch (e) { /* storage non disponibile */ }
function saveSettings() { try { localStorage.setItem('pickypenny.settings', JSON.stringify(S)); } catch (e) { /* ignora */ } }

// ---------- canvas ----------
const canvas = $('#stage');
const ctx = canvas.getContext('2d');
const video = $('#cam');
let W = 0, H = 0, DPR = 1, MIN = 1, bg = null;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(innerWidth * DPR), h = Math.round(innerHeight * DPR);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; bg = null; }
  W = canvas.width; H = canvas.height; MIN = Math.min(W, H);
}
addEventListener('resize', resize);
resize();

const deco = Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), r: rand(1, 3), tw: rand(0, 6) }));
function drawBackground(t) {
  if (!bg) {
    bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#4b25c4'); bg.addColorStop(0.6, '#2a1478'); bg.addColorStop(1, '#170b45');
  }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (const d of deco) {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 700 + d.tw);
    ctx.beginPath(); ctx.arc(d.x * W, d.y * H * 0.8, d.r * DPR, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // collinette
  ctx.fillStyle = '#3a1d8f';
  ctx.beginPath(); ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.25, H * 0.82, W * 0.55, H * 0.93);
  ctx.quadraticCurveTo(W * 0.8, H * 0.86, W, H * 0.9); ctx.lineTo(W, H); ctx.fill();
}

// ---------- emoji pre-renderizzate ----------
const emojiCache = new Map();
function emojiImg(e, size) {
  size = Math.round(size);
  const key = e + size;
  let c = emojiCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    const s = Math.ceil(size * 1.3); c.width = c.height = s;
    const x = c.getContext('2d');
    x.font = `${size}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(e, s / 2, s / 2 + size * 0.06);
    emojiCache.set(key, c);
    if (emojiCache.size > 120) emojiCache.delete(emojiCache.keys().next().value);
  }
  return c;
}

// ---------- audio ----------
let AC = null;
function audio() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
  return AC;
}
function tone(freq, dur, type = 'sine', vol = 0.18, when = 0, slideTo = 0) {
  const a = AC; if (!a) return;
  const t0 = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const SFX = {
  catch() { tone(620, 0.07, 'triangle'); tone(930, 0.12, 'triangle', 0.16, 0.06); },
  star() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.1, 'square', 0.07, i * 0.06)); },
  wrong() { tone(320, 0.28, 'sine', 0.22, 0, 110); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, i * 0.12)); },
  tick() { tone(1250, 0.05, 'square', 0.05); },
  count() { tone(700, 0.14, 'triangle', 0.18); },
  go() { tone(1050, 0.32, 'triangle', 0.22); },
  win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.13)); },
  roll() { tone(rand(500, 900), 0.05, 'square', 0.04); },
  ouch() { tone(520, 0.12, 'sawtooth', 0.12, 0, 260); tone(260, 0.3, 'sine', 0.18, 0.1, 140); },
};

// ---------- voce ----------
let itVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  itVoice = v.find((x) => /^it[-_]IT/i.test(x.lang) && /alice|federica|elsa|paola/i.test(x.name))
    || v.find((x) => /^it[-_]IT/i.test(x.lang)) || v.find((x) => /^it/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, { rate = 0.95, pitch = 1.15, interrupt = true } = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT'; if (itVoice) u.voice = itVoice; u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch (e) { /* voce non disponibile */ }
}

// ---------- telecamera + pose ----------
let stream = null, camOn = false, landmarker = null, poseLoading = null;
let lastVideoTime = -1, lastPoseAt = -1e9, SP = null; // SP = punti a schermo (smussati)
const handPrev = { L: null, R: null, B: null }, handPulse = { L: 0, R: 0, P: 0, B: 0 };

async function loadPose() {
  if (landmarker) return landmarker;
  if (poseLoading) return poseLoading;
  poseLoading = (async () => {
    const vision = await import(`${MP_BASE}/vision_bundle.mjs`);
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO', numPoses: 1,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    try { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch (e) { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
    return landmarker;
  })();
  try { return await poseLoading; } catch (e) { poseLoading = null; throw e; }
}

async function startCamera() {
  if (camOn) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  camOn = true;
}
function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null; camOn = false; SP = null; lastPoseAt = -1e9;
}

function videoRect() {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const s = Math.max(W / vw, H / vh);
  return { vw, vh, s, ox: (W - vw * s) / 2, oy: (H - vh * s) / 2 };
}

function updatePose(now) {
  if (!landmarker || !camOn || video.readyState < 2) return;
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  let res;
  try { res = landmarker.detectForVideo(video, now); } catch (e) { return; }
  const lm = res && res.landmarks && res.landmarks[0];
  if (!lm) return;
  const r = videoRect();
  const raw = lm.map((p) => ({
    x: W - (r.ox + p.x * r.vw * r.s), // specchio: come guardarsi allo specchio
    y: r.oy + p.y * r.vh * r.s,
    v: p.visibility == null ? 1 : p.visibility,
  }));
  const pts = normalizeBody(raw, now);
  if (!pts) return;
  if (!SP || now - lastPoseAt > 600) SP = pts;
  else {
    for (let i = 0; i < pts.length; i++) {
      const a = SP[i], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const k = clamp(d / (MIN * 0.04), 0.35, 0.9); // movimenti veloci: meno ritardo
      a.x += (b.x - a.x) * k; a.y += (b.y - a.y) * k; a.v += (b.v - a.v) * 0.5;
    }
  }
  lastPoseAt = now;
}
const personVisible = (now) => SP && now - lastPoseAt < 500;

// Penny ha sempre la stessa grandezza sullo schermo, anche se chi gioca è vicinissimo
// alla telecamera: il corpo viene rimpicciolito e messo al centro, e spostandosi a
// destra/sinistra Penny attraversa lo schermo (movimento amplificato).
const NB = { k: 0, cx: 0, cy: 0, baseY: 0, last: -1e9 };
function normalizeBody(raw, now) {
  const ls = raw[11], rs = raw[12];
  let cx, cy, sw;
  if (ls.v > 0.4 && rs.v > 0.4) {
    cx = (ls.x + rs.x) / 2; cy = (ls.y + rs.y) / 2; sw = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  } else if (raw[7].v > 0.4 && raw[8].v > 0.4) { // solo la testa: spalle stimate dalle orecchie
    const ew = Math.hypot(raw[7].x - raw[8].x, raw[7].y - raw[8].y);
    cx = (raw[7].x + raw[8].x) / 2; cy = (raw[7].y + raw[8].y) / 2 + ew * 1.4; sw = ew * 2.3;
  } else return null;
  if (sw < 4) return null;
  const target = MIN * A().penny;
  const k = target / sw;
  const fresh = now - NB.last > 800;
  NB.last = now;
  if (fresh) { NB.k = k; NB.cx = cx; NB.cy = cy; NB.baseY = cy; }
  else {
    NB.k += (k - NB.k) * 0.12;        // la grandezza cambia piano (niente zoom a scatti)
    NB.cx += (cx - NB.cx) * 0.6;
    NB.cy += (cy - NB.cy) * 0.6;
    NB.baseY += (cy - NB.baseY) * 0.02; // altezza "normale" di chi gioca, si adatta lentamente
  }
  const margin = target * 1.1;
  const ax = clamp(W / 2 + (NB.cx - W / 2) * 2.2, margin, W - margin);
  const ay = clamp(H * 0.5 + (NB.cy - NB.baseY) * NB.k * 1.5, H * 0.3, H * 0.7); // salti e piegamenti
  return raw.map((p) => ({ x: ax + (p.x - NB.cx) * NB.k, y: ay + (p.y - NB.cy) * NB.k, v: p.v }));
}

function handPoint(side) {
  const [w, i, p] = side === 'L' ? [15, 19, 17] : [16, 20, 18];
  const W_ = SP[w];
  if (W_.v < 0.35) return null;
  const I = SP[i], P = SP[p];
  if (I.v > 0.25 && P.v > 0.25) {
    const mx = (I.x + P.x) / 2, my = (I.y + P.y) / 2;
    return { x: W_.x + (mx - W_.x) * 0.9, y: W_.y + (my - W_.y) * 0.9 };
  }
  return { x: W_.x, y: W_.y };
}

// ---------- tocco (alternativa senza telecamera, utile anche ai genitori per provare) ----------
const pointer = { x: 0, y: 0, px: 0, py: 0, active: false };
canvas.addEventListener('pointerdown', (e) => { pointer.active = true; pointer.x = pointer.px = e.clientX * DPR; pointer.y = pointer.py = e.clientY * DPR; });
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || pointer.active) { pointer.active = true; pointer.x = e.clientX * DPR; pointer.y = e.clientY * DPR; } });
const endPointer = (e) => { if (e.pointerType !== 'mouse') pointer.active = false; };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { pointer.active = false; });

// Modalità "due mani": si acchiappa solo con le mani unite (come prendere una palla)
function handsTogether() {
  const l = handPoint('L'), r = handPoint('R');
  if (!l || !r) return null;
  const rad = A().catchR * MIN;
  const d = Math.hypot(l.x - r.x, l.y - r.y);
  return d < rad * 2.6 ? { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 } : null;
}

function getCatchers(now) {
  const r = A().catchR * MIN;
  const out = [];
  if (G.frozen > 0) { handPrev.L = handPrev.R = handPrev.B = null; return out; }
  if (personVisible(now)) {
    if (S.catchMode === 'mani') {
      const b = handsTogether();
      if (b) {
        const prev = handPrev.B || b;
        out.push({ id: 'B', x: b.x, y: b.y, px: prev.x, py: prev.y, r: r * 1.3 });
        handPrev.B = b;
      } else handPrev.B = null;
    } else {
      for (const side of ['L', 'R']) {
        const h = handPoint(side);
        if (h) {
          const prev = handPrev[side] || h;
          out.push({ id: side, x: h.x, y: h.y, px: prev.x, py: prev.y, r });
          handPrev[side] = { x: h.x, y: h.y };
        } else handPrev[side] = null;
      }
    }
  } else { handPrev.L = handPrev.R = handPrev.B = null; }
  if (pointer.active) {
    out.push({ id: 'P', x: pointer.x, y: pointer.y, px: pointer.px, py: pointer.py, r });
    pointer.px = pointer.x; pointer.py = pointer.y;
  }
  return out;
}

// ---------- stato di gioco ----------
const G = {
  phase: 'menu', // menu | ready | intro | play | roundEnd | prize
  paused: false, session: 0,
  score: 0, level: 1, levelPts: 0, round: 1, roundTime: 120, elapsed: 0,
  objs: [], parts: [], pops: [],
  spawnT: 0, needT: 0, hold: 0, readyHold: 0, lastTick: -1, frozen: 0,
  word: '', wordEmoji: '', wordIdx: 0, usedWords: [], customUsed: false, wordsDone: 0,
};
const A = () => AGES[S.age];
const levelTarget = () => A().target + 4 * (G.level - 1);
const avoidOn = () => S.mode === 'punti' && S.avoid && G.level >= A().avoidFrom;
function speedMul() {
  const lv = Math.min(3, 1 + 0.17 * (G.level - 1));
  const tm = 1 + 0.6 * Math.min(1, G.elapsed / G.roundTime);
  return lv * tm;
}

// ---------- parole ----------
function nextWord() {
  if (S.mode !== 'parola') return;
  const custom = cleanWord(S.customWord);
  if (S.wordChoice === 'custom' && custom.length >= 2 && !G.customUsed) {
    G.word = custom; G.wordEmoji = '✏️'; G.customUsed = true;
  } else {
    const a = A();
    const maxL = Math.min(8, a.maxLen + Math.floor((G.level - 1) / 2));
    let pool = WORDS.filter(([w]) => w.length >= Math.min(a.minLen, maxL) && w.length <= maxL && !G.usedWords.includes(w));
    if (!pool.length) { G.usedWords = []; pool = WORDS.filter(([w]) => w.length <= maxL); }
    const [w, e] = pick(pool);
    G.word = w; G.wordEmoji = e; G.usedWords.push(w);
  }
  G.wordIdx = 0;
  renderWordBar();
}
function spellText(w) { return w.split('').join(', '); }
function renderWordBar() {
  if (S.mode !== 'parola') { hide('#wordBar'); return; }
  $('#wordEmoji').textContent = G.wordEmoji;
  $('#wordTiles').innerHTML = G.word.split('').map((c, i) => `<div class="tile" data-i="${i}">${c}</div>`).join('');
  updateWordBar();
}
function updateWordBar() {
  document.querySelectorAll('#wordTiles .tile').forEach((t, i) => {
    t.classList.toggle('done', i < G.wordIdx);
    t.classList.toggle('next', i === G.wordIdx);
  });
}

// ---------- oggetti ----------
function spawn(forceNeeded = false) {
  const a = A(), sm = speedMul();
  const sp = a.speed * H * sm;
  let r = a.size * MIN;
  const o = { x: 0, y: 0, vx: 0, vy: 0, g: 0, r, rot: rand(-0.4, 0.4), vr: rand(-1.5, 1.5), bounce: false, entered: false, wob: rand(0, 6), rej: 0, age: 0 };

  if (S.mode === 'parola') {
    const need = G.word[G.wordIdx];
    let letter;
    if (forceNeeded || Math.random() < a.rightProb) letter = need;
    else {
      const pool = (LETTERS + G.word).split('').filter((c) => c !== need);
      letter = pick(pool);
    }
    if (letter === need) G.needT = 0;
    o.letter = letter; o.r = r * 1.08;
    o.color = `hsl(${(letter.charCodeAt(0) * 47) % 360} 85% 58%)`;
    o.vr *= 0.25;
  } else {
    const pAvoid = avoidOn() ? Math.min(0.32, a.avoidProb + 0.02 * (G.level - a.avoidFrom)) : 0;
    const roll = Math.random();
    if (roll < pAvoid) { o.emoji = pick(AVOID); o.avoid = true; o.pts = 0; o.r = r * 1.05; }
    else if (roll < pAvoid + 0.09) { o.emoji = STAR; o.pts = 3; o.r = r * 0.85; o.fast = 1.3; }
    else { o.emoji = pick(ITEMS); o.pts = 1; }
  }
  const f = o.fast || 1;
  const pr = Math.random(), [pFall, pSide] = a.patterns;
  if (pr < pFall) { // cade dall'alto
    o.x = rand(W * 0.1, W * 0.9); o.y = -o.r;
    o.vx = rand(-0.15, 0.15) * sp; o.vy = sp * rand(0.8, 1.15) * f; o.g = sp * 0.15;
  } else if (pr < pFall + pSide) { // vola di lato
    const left = Math.random() < 0.5;
    const asp = clamp(W / H, 0.55, 1.4);
    o.x = left ? -o.r : W + o.r; o.y = rand(H * 0.15, H * 0.5);
    o.vx = (left ? 1 : -1) * sp * rand(0.9, 1.25) * asp * f; o.vy = -sp * rand(0.4, 0.8); o.g = sp * 0.9;
  } else { // rimbalza tra i bordi
    o.x = rand(W * 0.2, W * 0.8); o.y = -o.r; o.bounce = true;
    o.vx = (Math.random() < 0.5 ? -1 : 1) * sp * 0.7 * f; o.vy = sp * 0.7 * f; o.g = sp * 0.25;
  }
  G.objs.push(o);
}

function burst(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(0.2, 0.6) * MIN;
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - MIN * 0.15, g: MIN * 0.9, life: rand(0.5, 0.9), t: 0, size: rand(4, 9) * DPR, color: color || pick(['#ffd23f', '#ff5fa2', '#3ee6b5', '#3fc7ff', '#ff9f2e']), shape: Math.random() < 0.5 ? 'c' : 's' });
  }
}
function confetti(n = 140) {
  for (let i = 0; i < n; i++) {
    G.parts.push({ x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-0.08, 0.08) * MIN, vy: rand(0.1, 0.3) * MIN, g: MIN * 0.15, life: rand(3, 5), t: 0, size: rand(6, 12) * DPR, color: pick(['#ffd23f', '#ff5fa2', '#3ee6b5', '#3fc7ff', '#ff9f2e', '#ffffff']), shape: 'r', rot: rand(0, 6), vr: rand(-6, 6) });
  }
}
function popup(x, y, text, color = '#fff') { G.pops.push({ x, y, text, color, t: 0 }); }

function onCatch(o, c) {
  handPulse[c.id] = 1;
  if (S.mode === 'parola') {
    if (o.letter === G.word[G.wordIdx]) {
      o.dead = true; G.wordIdx++; G.score += 1;
      SFX.catch(); burst(o.x, o.y, o.color); popup(o.x, o.y, o.letter, o.color);
      say(o.letter.toLowerCase(), { rate: 1.05 });
      updateWordBar(); updateHUD(true);
      if (G.wordIdx >= G.word.length) wordComplete();
    } else {
      o.rej = 0.7; o.vy = -Math.abs(o.vy) - H * 0.35; o.vx = -o.vx + rand(-0.1, 0.1) * H;
      SFX.wrong();
      popup(o.x, o.y - o.r, 'Ops! 🙃', '#fff');
    }
    return;
  }
  if (o.avoid) {
    o.dead = true;
    const lost = Math.min(2, G.score);
    G.score -= lost; G.levelPts = Math.max(0, G.levelPts - lost);
    G.frozen = 1.0;
    SFX.ouch(); burst(o.x, o.y, '#9be7ff', 18);
    popup(o.x, o.y, lost ? `Ahi! -${lost}` : 'Ahi!', '#9be7ff');
    updateHUD(true);
    return;
  }
  o.dead = true; G.score += o.pts; G.levelPts += o.pts;
  if (o.pts > 1) { SFX.star(); burst(o.x, o.y, '#ffd23f', 26); popup(o.x, o.y, `+${o.pts} ⭐`, '#ffd23f'); }
  else { SFX.catch(); burst(o.x, o.y); popup(o.x, o.y, '+1'); }
  if (G.levelPts >= levelTarget()) levelUp();
  updateHUD(true);
}

function showBanner(html, ms = 1800) {
  const b = $('#banner'); b.innerHTML = html; show(b);
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(showBanner._t); showBanner._t = setTimeout(() => hide(b), ms);
}
function levelUp() {
  G.level++; G.levelPts = 0;
  SFX.level(); confetti(50);
  const newAvoid = S.mode === 'punti' && S.avoid && G.level === A().avoidFrom && G.level > 1;
  showBanner(newAvoid ? `Livello ${G.level}! 🚀<small>Attenzione: non toccare 🌵 🌧️ 🦔</small>` : `Livello ${G.level}! 🚀<small>Ora si va più veloci!</small>`, newAvoid ? 2600 : 1800);
  if (newAvoid) { say(`Livello ${G.level}! Attenzione: non toccare i cactus, le nuvolette e i ricci!`); return; }
  say(`Livello ${G.level}! Più veloce!`);
}
async function wordComplete() {
  const s = G.session;
  const done = G.word, emo = G.wordEmoji;
  G.wordsDone++; G.score += done.length; G.level++;
  G.objs.forEach((o) => { burst(o.x, o.y, o.color, 6); o.dead = true; });
  G.hold = 4.2;
  SFX.level(); confetti(80);
  showBanner(`${emo} ${done}!<small>Bravissimo! Parola completata</small>`, 2200);
  say(`Bravissimo! ${done.toLowerCase()}!`);
  await sleep(2300); if (s !== G.session || G.phase !== 'play') return;
  nextWord();
  showBanner(`${G.wordEmoji} ${G.word}<small>Nuova parola! Prendi le lettere in ordine</small>`, 2200);
  say(`Ora prendi: ${spellText(G.word)}. ${G.word.toLowerCase()}!`, { rate: 0.85 });
}

// ---------- ciclo di gioco ----------
function update(dt, now) {
  G.elapsed += dt;
  const left = G.roundTime - G.elapsed;
  if (left <= 0) { endRound(); return; }
  const sec = Math.ceil(left);
  if (sec <= 5 && sec !== G.lastTick) { G.lastTick = sec; SFX.tick(); }

  const a = A(), sm = speedMul();
  if (G.frozen > 0) G.frozen -= dt;
  if (G.hold > 0) G.hold -= dt;
  else {
    G.spawnT -= dt; G.needT += dt;
    const maxObj = a.maxObj + Math.floor((G.level - 1) / 2);
    if (S.mode === 'parola' && G.needT > a.needEvery / Math.sqrt(sm) && !G.objs.some((o) => o.letter === G.word[G.wordIdx] && !o.rej)) {
      spawn(true);
    } else if (G.spawnT <= 0 && G.objs.length < maxObj) {
      spawn(); G.spawnT = Math.max(0.35, a.spawn / Math.sqrt(sm)) * rand(0.7, 1.3);
    }
  }

  const catchers = getCatchers(now);
  for (const o of G.objs) {
    o.age += dt;
    o.vy += o.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
    if (o.rej > 0) o.rej -= dt;
    if (o.x > o.r && o.x < W - o.r) o.entered = true;
    if (o.bounce && o.entered) {
      if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); }
      if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx); }
    }
    if (o.rej <= 0) {
      for (const c of catchers) {
        if (distSeg(o.x, o.y, c.px, c.py, c.x, c.y) < o.r + c.r) { onCatch(o, c); break; }
      }
    }
    if (o.y > H + o.r * 2 || (o.entered && (o.x < -o.r * 3 || o.x > W + o.r * 3)) || o.age > 20) o.dead = true;
  }
  G.objs = G.objs.filter((o) => !o.dead);
  updateHUD();
}

function updateEffects(dt) {
  for (const p of G.parts) {
    p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
  }
  G.parts = G.parts.filter((p) => p.t < p.life && p.y < H + 40);
  for (const p of G.pops) p.t += dt;
  G.pops = G.pops.filter((p) => p.t < 0.9);
  for (const k in handPulse) handPulse[k] = Math.max(0, handPulse[k] - dt * 3);
}

// ---------- disegno ----------
// La telecamera vera si vede in un riquadro nell'angolo (Penny invece ha sempre la stessa grandezza)
function drawVideo() {
  if (!S.showCam || !camOn || video.readyState < 2) return;
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const w = MIN * 0.3, h = w * vh / vw, m = 12 * DPR;
  const x = m, y = H - h - m - (innerWidth <= 420 && S.mode === 'parola' ? 70 * DPR : 0);
  ctx.save();
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 14 * DPR) : ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x + w, y); ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  ctx.lineWidth = 3 * DPR; ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 14 * DPR) : ctx.rect(x, y, w, h); ctx.stroke();
}

function seg(a, b, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function chain(ids, color, w) {
  const ok = ids.filter((i) => SP[i].v > 0.4);
  if (ok.length < 2 || SP[ids[0]].v < 0.4) return;
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(SP[ids[0]].x, SP[ids[0]].y);
  for (let k = 1; k < ids.length; k++) { const p = SP[ids[k]]; if (p.v < 0.4) break; ctx.lineTo(p.x, p.y); }
  ctx.stroke();
}

// Penny: un personaggio stilizzato che segue il corpo di chi gioca
function drawPenny(now) {
  if (!personVisible(now)) return;
  const P = SP, ls = P[11], rs = P[12];
  const sw = (ls.v > 0.4 && rs.v > 0.4) ? Math.hypot(ls.x - rs.x, ls.y - rs.y) : MIN * 0.18;
  const lw = clamp(sw * 0.3, 10 * DPR, 70 * DPR);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // gambe
  chain([23, 25, 27], '#5b6cff', lw * 1.05);
  chain([24, 26, 28], '#5b6cff', lw * 1.05);

  // corpo
  if (ls.v > 0.4 && rs.v > 0.4) {
    const lh = P[23].v > 0.4 ? P[23] : { x: ls.x, y: ls.y + sw * 1.3 };
    const rh = P[24].v > 0.4 ? P[24] : { x: rs.x, y: rs.y + sw * 1.3 };
    ctx.fillStyle = '#ff5fa2'; ctx.strokeStyle = '#ff5fa2'; ctx.lineWidth = lw * 0.9;
    ctx.beginPath(); ctx.moveTo(ls.x, ls.y); ctx.lineTo(rs.x, rs.y); ctx.lineTo(rh.x, rh.y); ctx.lineTo(lh.x, lh.y); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // stellina sulla maglietta
    const cx = (ls.x + rs.x + lh.x + rh.x) / 4, cy = (ls.y + rs.y + lh.y + rh.y) / 4;
    const img = emojiImg('⭐', sw * 0.45); ctx.drawImage(img, cx - img.width / 2, cy - img.height / 2);
  }

  // braccia
  chain([11, 13, 15], '#ffb347', lw * 0.85);
  chain([12, 14, 16], '#ffb347', lw * 0.85);

  // testa
  const nose = P[0];
  if (nose.v > 0.4) {
    let hx = nose.x, hy = nose.y, hr = sw * 0.46;
    if (P[7].v > 0.4 && P[8].v > 0.4) {
      hx = (P[7].x + P[8].x) / 2; hy = (P[7].y + P[8].y) / 2;
      hr = Math.max(hr, Math.hypot(P[7].x - P[8].x, P[7].y - P[8].y) * 0.75);
    }
    hr = clamp(hr, 24 * DPR, MIN * 0.25);
    // antenne
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(3 * DPR, hr * 0.09);
    for (const s of [-1, 1]) {
      const bx = hx + s * hr * 0.45, by = hy - hr * 0.8, tx = hx + s * hr * 0.8, ty = hy - hr * 1.55;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(hx + s * hr * 0.4, ty, tx, ty); ctx.stroke();
      ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.arc(tx, ty, hr * 0.16, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
    ctx.lineWidth = hr * 0.08; ctx.strokeStyle = '#e09b00'; ctx.stroke();
    // occhi
    const eyes = [P[2], P[5]];
    eyes.forEach((e, i) => {
      const ex = e.v > 0.4 ? e.x : hx + (i ? 1 : -1) * hr * 0.35;
      const ey = e.v > 0.4 ? e.y : hy - hr * 0.1;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, hr * 0.22, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a1a6e'; ctx.beginPath(); ctx.arc(ex, ey + hr * 0.03, hr * 0.12, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + hr * 0.04, ey - hr * 0.03, hr * 0.04, 0, 7); ctx.fill();
    });
    // guance e sorriso
    ctx.fillStyle = 'rgba(255,95,162,.45)';
    ctx.beginPath(); ctx.arc(hx - hr * 0.55, hy + hr * 0.3, hr * 0.15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + hr * 0.55, hy + hr * 0.3, hr * 0.15, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1a6e'; ctx.lineWidth = hr * 0.09;
    const my = Math.max(hy + hr * 0.3, nose.y + hr * 0.25);
    ctx.beginPath(); ctx.arc(hx, my - hr * 0.15, hr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
}

function drawHands(now) {
  const r = A().catchR * MIN;
  const frozen = G.frozen > 0 && G.phase === 'play';
  const list = [];
  let together = null;
  if (personVisible(now)) {
    const l = handPoint('L'), rr = handPoint('R');
    if (S.catchMode === 'mani') together = handsTogether();
    const dim = S.catchMode === 'mani' && !together; // mani separate: non acchiappano
    if (l) list.push(['L', l, frozen ? '#9be7ff' : '#3fc7ff', dim]);
    if (rr) list.push(['R', rr, frozen ? '#9be7ff' : '#3ee6b5', dim]);
  }
  if (pointer.active) list.push(['P', pointer, '#ffd23f', false]);
  for (const [id, p, col, dim] of list) {
    const k = 1 + handPulse[id] * 0.35;
    ctx.globalAlpha = dim ? 0.45 : 1;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5 * k);
    g.addColorStop(0, col); g.addColorStop(0.55, col + 'aa'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.5 * k, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.globalAlpha *= 0.9;
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55 * k, 0, 7); ctx.fill(); ctx.globalAlpha = dim ? 0.45 : 1;
    const img = emojiImg(frozen ? '🥶' : '✋', r * 0.8 * k); ctx.drawImage(img, p.x - img.width / 2, p.y - img.height / 2);
  }
  ctx.globalAlpha = 1;
  if (together && !frozen) { // mani unite: compare il cestino che acchiappa
    const k = 1 + handPulse.B * 0.35, rb = r * 1.3 * k;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = rb * 0.12;
    ctx.beginPath(); ctx.arc(together.x, together.y, rb, 0, 7); ctx.stroke();
    const img = emojiImg('🧺', rb * 1.2); ctx.drawImage(img, together.x - img.width / 2, together.y - img.height / 2);
  }
}

function drawObjects(now) {
  const helper = A().helper && S.mode === 'parola';
  const need = G.word[G.wordIdx];
  for (const o of G.objs) {
    const wob = Math.sin(now / 300 + o.wob) * o.r * 0.06;
    ctx.save(); ctx.translate(o.x + wob, o.y); ctx.rotate(o.rot);
    if (o.letter) {
      const gray = o.rej > 0;
      if (helper && o.letter === need && !gray) {
        ctx.fillStyle = 'rgba(255,210,63,.35)'; ctx.beginPath(); ctx.arc(0, 0, o.r * (1.35 + 0.1 * Math.sin(now / 150)), 0, 7); ctx.fill();
      }
      ctx.fillStyle = gray ? '#9b93c9' : o.color;
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill();
      ctx.lineWidth = o.r * 0.12; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-o.r * 0.35, -o.r * 0.4, o.r * 0.22, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `800 ${o.r * 1.25}px ${UI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = o.r * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeText(o.letter, 0, o.r * 0.08);
      ctx.fillText(o.letter, 0, o.r * 0.08);
    } else {
      if (o.avoid) {
        ctx.fillStyle = 'rgba(255,60,90,.22)'; ctx.beginPath(); ctx.arc(0, 0, o.r * 1.3, 0, 7); ctx.fill();
        ctx.setLineDash([o.r * 0.25, o.r * 0.18]); ctx.lineWidth = o.r * 0.1; ctx.strokeStyle = '#ff3c5a';
        ctx.beginPath(); ctx.arc(0, 0, o.r * 1.3, now / 400, now / 400 + 6.283); ctx.stroke(); ctx.setLineDash([]);
      }
      if (o.emoji === STAR) { ctx.fillStyle = 'rgba(255,210,63,.3)'; ctx.beginPath(); ctx.arc(0, 0, o.r * 1.4, 0, 7); ctx.fill(); }
      const img = emojiImg(o.emoji, o.r * 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
    }
    ctx.restore();
  }
}

function drawEffects() {
  for (const p of G.parts) {
    ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1) * (p.shape === 'r' ? 1 : 0.95);
    ctx.fillStyle = p.color;
    if (p.shape === 'c') { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill(); }
    else if (p.shape === 'r') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
    else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of G.pops) {
    const k = p.t / 0.9;
    ctx.globalAlpha = 1 - k;
    ctx.font = `800 ${MIN * 0.07 * (1 + k * 0.3)}px ${UI_FONT}`;
    ctx.lineWidth = 6 * DPR; ctx.strokeStyle = 'rgba(42,26,110,.8)';
    ctx.strokeText(p.text, p.x, p.y - k * MIN * 0.12);
    ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y - k * MIN * 0.12);
  }
  ctx.globalAlpha = 1;
}

// ---------- HUD ----------
let hudCache = '';
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function updateHUD(force) {
  const left = G.roundTime - G.elapsed;
  const key = `${G.score}|${G.level}|${G.round}|${Math.ceil(left)}|${G.levelPts}`;
  if (!force && key === hudCache) return; hudCache = key;
  $('#hudScore').textContent = `⭐ ${G.score}`;
  $('#hudLevel').textContent = S.mode === 'parola' ? `Parole: ${G.wordsDone}` : `Livello ${G.level}`;
  $('#hudRound').textContent = `Round ${G.round}/${S.rounds}`;
  const t = $('#hudTime'); t.textContent = fmtTime(left); t.classList.toggle('hurry', left <= 5.5 && G.phase === 'play');
  const bar = $('#levelBar');
  bar.classList.toggle('hidden', S.mode === 'parola');
  bar.firstElementChild.style.width = `${clamp(G.levelPts / levelTarget(), 0, 1) * 100}%`;
}

// ---------- flusso ----------
async function lockScreen() {
  try { if ('wakeLock' in navigator && !lockScreen.l) { lockScreen.l = await navigator.wakeLock.request('screen'); lockScreen.l.addEventListener('release', () => { lockScreen.l = null; }); } } catch (e) { /* ignora */ }
}

let useFinger = false;
async function goReady() {
  audio();
  say('Ciao! Sono Penny! Alza le mani per iniziare!');
  hideScreens(); show('#ready');
  G.phase = 'ready'; G.readyHold = 0; G.session++;
  const s = G.session;
  $('#readyTitle').textContent = 'Alza le mani! 🙌';
  $('#readyMsg').textContent = 'Sto accendendo la telecamera magica… ✨';
  $('#readyFill').style.width = '0%';
  hide('#btnFinger');
  useFinger = false;
  lockScreen();
  try {
    await startCamera();
  } catch (e) {
    if (s !== G.session) return;
    hideScreens(); show('#camError');
    $('#camErrText').textContent = (e && e.name === 'NotAllowedError')
      ? 'Serve il permesso per la fotocamera. Su iPhone: Impostazioni › Safari › Fotocamera › «Consenti», poi ricarica la pagina.'
      : 'Questo dispositivo non mi fa usare la fotocamera frontale. Puoi comunque giocare toccando lo schermo.';
    return;
  }
  if (s !== G.session) return;
  $('#readyMsg').textContent = 'Sto imparando a riconoscerti… 🧠';
  try {
    await loadPose();
    if (s !== G.session) return;
    $('#readyMsg').textContent = 'Fatti vedere tutto: allontanati un po’ 👣';
  } catch (e) {
    if (s !== G.session) return;
    $('#readyMsg').textContent = 'Non riesco a caricare il riconoscimento. Controlla internet, oppure gioca col dito.';
    show('#btnFinger');
  }
}

function checkReady(dt, now) {
  if (!personVisible(now)) {
    G.readyHold = Math.max(0, G.readyHold - dt);
    if (landmarker) $('#readyMsg').textContent = 'Non ti vedo ancora: mettiti davanti al telefono 👀';
  } else {
    const nose = SP[0], l = handPoint('L'), r = handPoint('R');
    const up = l && r && l.y < nose.y && r.y < nose.y;
    if (up) { G.readyHold += dt; $('#readyMsg').textContent = 'Ecco Penny! Tieni su le mani… 🙌'; }
    else { G.readyHold = Math.max(0, G.readyHold - dt * 0.7); $('#readyMsg').textContent = 'Ti vedo! Ora alza tutte e due le mani sopra la testa'; }
  }
  $('#readyFill').style.width = `${clamp(G.readyHold / 0.8, 0, 1) * 100}%`;
  if (G.readyHold >= 0.8) { SFX.go(); startGame(); }
}

function startGame() {
  audio();
  G.session++;
  G.score = 0; G.level = 1; G.levelPts = 0; G.round = 1; G.wordsDone = 0;
  G.usedWords = []; G.customUsed = false; G.word = '';
  G.roundTime = S.minutes * 60;
  if (S.mode === 'parola') nextWord(); else hide('#wordBar');
  startRound();
}

async function startRound() {
  const s = ++G.session;
  G.objs = []; G.elapsed = 0; G.spawnT = 0.8; G.needT = 0; G.hold = 0; G.lastTick = -1; G.paused = false; G.frozen = 0;
  G.phase = 'intro';
  hideScreens(); show('#intro'); show('#hud'); hide('#btnPause');
  if (S.mode === 'parola') show('#wordBar');
  updateHUD(true);
  $('#introRound').textContent = S.rounds > 1 ? `Round ${G.round} di ${S.rounds}` : 'Si gioca!';
  const iw = $('#introWord'), ic = $('#introCount');
  ic.textContent = '';
  if (S.mode === 'parola') {
    iw.innerHTML = `<span class="e">${G.wordEmoji}</span><div class="w">${G.word}</div><div class="l">Prendi le lettere in ordine!</div>`;
    say(`Round ${G.round}. La parola è: ${G.word.toLowerCase()}. Prendi le lettere in ordine: ${spellText(G.word.slice(G.wordIdx))}.`, { rate: 0.85 });
    await sleep(Math.min(9000, 3200 + G.word.length * 650));
  } else {
    const avoidTxt = S.avoid && G.level >= A().avoidFrom;
    const how = S.catchMode === 'mani' ? 'Acchiappa con le due mani unite' : 'Acchiappa tutto quello che vola';
    iw.innerHTML = `<span class="e">🍓⭐🎈</span><div class="l">${how}!<br>Le stelle valgono 3 punti${avoidTxt ? '<br>Ma attenzione: <b>non toccare 🌵 🌧️ 🦔</b>' : ''}</div>`;
    say(`Round ${G.round}! ${how}!${avoidTxt ? ' Ma non toccare i cactus, le nuvolette e i ricci!' : ''}`);
    await sleep(2600);
  }
  for (const n of ['3', '2', '1']) {
    if (s !== G.session) return;
    ic.textContent = n; ic.classList.remove('pop'); void ic.offsetWidth; ic.classList.add('pop');
    SFX.count(); await sleep(800);
  }
  if (s !== G.session) return;
  ic.textContent = 'Via!'; ic.classList.remove('pop'); void ic.offsetWidth; ic.classList.add('pop'); SFX.go();
  await sleep(450);
  if (s !== G.session) return;
  hide('#intro'); show('#btnPause');
  G.phase = 'play';
}

const togo = () => { const n = S.rounds - G.round; return n === 1 ? 'Manca 1 round al premio!' : `Mancano ${n} round al premio!`; };
function endRound() {
  G.phase = 'roundEnd';
  G.objs.forEach((o) => burst(o.x, o.y, o.color, 5)); G.objs = [];
  hide('#btnPause');
  updateHUD(true);
  if (G.round >= S.rounds) { showPrize(); return; }
  SFX.level(); confetti(60);
  $('#reTitle').textContent = `Round ${G.round} finito!`;
  $('#reText').textContent = S.mode === 'parola'
    ? `Hai ${G.score} punti e ${G.wordsDone} ${G.wordsDone === 1 ? 'parola' : 'parole'}. ${togo()}`
    : `Hai ${G.score} punti e sei al livello ${G.level}. ${togo()}`;
  say(`Round finito! Hai ${G.score} punti!`);
  hideScreens(); show('#roundEnd');
}

async function showPrize() {
  const s = ++G.session;
  G.phase = 'prize';
  hideScreens(); show('#prize'); hide('#wordBar');
  const [e, t] = pick(PRIZES);
  const bonus = pick(BONUS);
  const pe = $('#prizeEmoji'), pt = $('#prizeText');
  $('#prizeBonus').textContent = '';
  $('#prizeScore').textContent = `Punti totali: ${G.score}` + (S.mode === 'parola' ? ` · Parole: ${G.wordsDone}` : ` · Livello ${G.level}`);
  pt.textContent = 'Estrazione del premio…';
  say('Hai vinto! Vediamo che premio c’è…');
  for (let i = 0; i < 18; i++) {
    if (s !== G.session) return;
    pe.textContent = pick(PRIZES)[0]; SFX.roll();
    await sleep(70 + i * 9);
  }
  if (s !== G.session) return;
  pe.textContent = e; pt.textContent = t; $('#prizeBonus').textContent = bonus;
  SFX.win(); confetti(220);
  say(`Hai vinto: ${t}! ${bonus.replace('Bonus:', 'E in più:').replace(/[^\p{L}\p{N}\s!,.:'’«»]/gu, '')}`, { rate: 0.92 });
}

function goMenu() {
  G.session++; G.phase = 'menu'; G.paused = false; G.objs = [];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  stopCamera();
  if (lockScreen.l) { lockScreen.l.release().catch(() => {}); lockScreen.l = null; }
  hideScreens(); hide('#hud'); hide('#wordBar'); hide('#banner');
  show('#setup');
}

function pauseGame() {
  if (G.phase !== 'play' || G.paused) return;
  G.paused = true; show('#pause');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function resumeGame() { G.paused = false; hide('#pause'); audio(); }

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  resize();
  updatePose(now);
  if (G.phase === 'play' && !G.paused) update(dt, now);
  else if (G.phase === 'ready') checkReady(dt, now);
  if (!G.paused) updateEffects(dt);

  drawBackground(now);
  if (G.phase !== 'menu') {
    drawVideo();
    drawPenny(now);
    drawObjects(now);
    drawHands(now);
  }
  drawEffects();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- menu: collegamenti ----------
function refreshSetup() {
  document.querySelectorAll('[data-group]').forEach((g) => {
    const key = g.dataset.group;
    g.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.val === S[key]));
  });
  $('#outMinutes').textContent = S.minutes === 0.5 ? '½' : S.minutes;
  $('#outRounds').textContent = S.rounds;
  $('#wordOpts').classList.toggle('hidden', S.mode !== 'parola');
  $('#customWord').classList.toggle('hidden', S.wordChoice !== 'custom');
  $('#customWord').value = S.customWord;
  $('#showCam').checked = !!S.showCam;
  $('#avoid').checked = !!S.avoid;
  $('#avoidRow').classList.toggle('hidden', S.mode !== 'punti');
}
document.querySelectorAll('[data-group]').forEach((g) => {
  g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S[g.dataset.group] = b.dataset.val; saveSettings(); refreshSetup();
    if (g.dataset.group === 'wordChoice' && b.dataset.val === 'custom') $('#customWord').focus();
  });
});
document.querySelectorAll('[data-step]').forEach((st) => {
  st.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const d = +b.dataset.d;
    if (st.dataset.step === 'minutes') {
      let i = MINUTES.indexOf(S.minutes); if (i < 0) i = 2;
      S.minutes = MINUTES[clamp(i + d, 0, MINUTES.length - 1)];
    } else S.rounds = clamp(S.rounds + d, 1, 10);
    saveSettings(); refreshSetup();
  });
});
$('#customWord').addEventListener('input', (e) => {
  const v = cleanWord(e.target.value); S.customWord = v; saveSettings();
  if (e.target.value !== v) e.target.value = v;
});
$('#showCam').addEventListener('change', (e) => { S.showCam = e.target.checked; saveSettings(); });
$('#avoid').addEventListener('change', (e) => { S.avoid = e.target.checked; saveSettings(); });

$('#btnPlay').addEventListener('click', () => {
  if (S.mode === 'parola' && S.wordChoice === 'custom' && cleanWord(S.customWord).length < 2) {
    $('#customWord').focus(); $('#customWord').placeholder = 'Scrivi una parola di almeno 2 lettere'; return;
  }
  goReady();
});
$('#btnStartNow').addEventListener('click', () => { SFX.go(); startGame(); });
const playFinger = () => { useFinger = true; audio(); say('Giochiamo col dito! Tocca gli oggetti!'); startGame(); };
$('#btnFinger').addEventListener('click', playFinger);
$('#btnFinger2').addEventListener('click', playFinger);
$('#btnNextRound').addEventListener('click', () => { audio(); G.round++; startRound(); });
$('#btnAgain').addEventListener('click', () => { audio(); if (camOn || useFinger) startGame(); else goReady(); });
$('#btnPause').addEventListener('click', pauseGame);
$('#btnResume').addEventListener('click', resumeGame);
$('#btnRestart').addEventListener('click', () => { hide('#pause'); startGame(); });
['#btnBack1', '#btnBack2', '#btnBack3', '#btnBack4', '#btnBack5'].forEach((id) => $(id).addEventListener('click', goMenu));
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); else if (G.phase !== 'menu') lockScreen(); });

refreshSetup();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
