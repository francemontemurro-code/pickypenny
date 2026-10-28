// Suoni, musichetta e voce di Penny (tutto generato sul telefono, nessun file audio).
import { rand, pick } from './core.js';
import { CHEERS } from './data.js';

let AC = null, master = null, musicGain = null;
export function audio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
      musicGain = AC.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
  return AC;
}
function tone(freq, dur, type = 'sine', vol = 0.18, when = 0, slideTo = 0) {
  if (!AC) return;
  toneAt(AC.currentTime + when, freq, dur, type, vol, slideTo, master);
}
function toneAt(t0, freq, dur, type, vol, slideTo, out) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + 0.03);
}
export const SFX = {
  catch(combo = 0) { const up = Math.min(combo, 12) * 18; tone(620 + up, 0.07, 'triangle'); tone(930 + up, 0.12, 'triangle', 0.16, 0.06); },
  star() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.1, 'square', 0.07, i * 0.06)); },
  wrong() { tone(320, 0.28, 'sine', 0.22, 0, 110); },
  ouch() { tone(520, 0.12, 'sawtooth', 0.12, 0, 260); tone(260, 0.3, 'sine', 0.18, 0.1, 140); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, i * 0.12)); },
  tick() { tone(1250, 0.05, 'square', 0.05); },
  count() { tone(700, 0.14, 'triangle', 0.18); },
  go() { tone(1050, 0.32, 'triangle', 0.22); },
  win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.13)); },
  roll() { tone(rand(500, 900), 0.05, 'square', 0.04); },
  power() { [400, 600, 800, 1000, 1200].forEach((f, i) => tone(f, 0.09, 'sine', 0.15, i * 0.04)); },
  hit() { tone(180, 0.12, 'square', 0.16, 0, 90); tone(900, 0.05, 'triangle', 0.1); },
  boom() { tone(120, 0.5, 'sawtooth', 0.2, 0, 40); [880, 1100, 1320, 1760].forEach((f, i) => tone(f, 0.15, 'triangle', 0.1, 0.1 + i * 0.05)); },
  coin() { tone(988, 0.06, 'square', 0.08); tone(1318, 0.14, 'square', 0.08, 0.06); },
  combo() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.14, i * 0.05)); },
  whoosh() { tone(300, 0.3, 'sine', 0.1, 0, 1200); },
  buy() { [659, 784, 988, 1318].forEach((f, i) => tone(f, 0.1, 'triangle', 0.15, i * 0.07)); },
};

// ---------- musichetta ----------
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // pentatonica maggiore
const PATTERNS = [
  [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 7, 5, 4, 2],
  [4, 2, 0, 2, 4, 4, 4, -1, 2, 2, 2, -1, 4, 6, 6, -1],
  [0, 4, 2, 5, 4, 7, 5, 4, 2, 4, 0, 2, 1, 2, 0, -1],
];
const M = { on: false, step: 0, next: 0, timer: null, tempo: 1, root: 60, pat: 0 };
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
function schedule() {
  if (!AC || !M.on) return;
  const spb = 60 / (112 * M.tempo) / 2; // ottavi
  while (M.next < AC.currentTime + 0.25) {
    const s = M.step % 16, pat = PATTERNS[M.pat];
    if (s % 4 === 0) toneAt(M.next, midi(M.root - 24 + (s % 8 === 0 ? 0 : 7)), spb * 1.8, 'triangle', 0.32, 0, musicGain);
    if (s % 2 === 1) toneAt(M.next, 5000, 0.02, 'square', 0.03, 0, musicGain);
    const n = pat[s];
    if (n >= 0) toneAt(M.next, midi(M.root + SCALE[n]), spb * 0.9, 'square', 0.12, 0, musicGain);
    M.next += spb; M.step++;
  }
}
export function musicStart(root = 60) {
  if (!audio()) return;
  M.root = root; M.pat = Math.floor(Math.random() * PATTERNS.length);
  if (!M.on) { M.on = true; M.next = AC.currentTime + 0.05; M.timer = setInterval(schedule, 60); }
  musicGain.gain.cancelScheduledValues(AC.currentTime);
  musicGain.gain.setTargetAtTime(0.2, AC.currentTime, 0.3);
}
export function musicStop() {
  if (!M.on || !AC) return;
  M.on = false; clearInterval(M.timer);
  musicGain.gain.setTargetAtTime(0, AC.currentTime, 0.1);
}
export function musicTempo(t) { M.tempo = Math.min(1.6, t); }
export function musicRoot(r) { M.root = r; }

// ---------- voce ----------
let itVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  itVoice = v.find((x) => /^it[-_]IT/i.test(x.lang) && /alice|federica|elsa|paola/i.test(x.name))
    || v.find((x) => /^it[-_]IT/i.test(x.lang)) || v.find((x) => /^it/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
// Una sola voce alla volta: prio 2 = istruzioni importanti, 1 = normale, 0 = piccoli commenti.
// Un commento non interrompe mai un'istruzione: se Penny sta parlando, viene saltato.
let lastSay = 0;
const cur = { prio: -1, until: 0 };
export function say(text, { rate = 0.95, pitch = 1.15, prio = 1 } = {}) {
  if (!('speechSynthesis' in window)) return;
  const now = performance.now();
  const busy = now < cur.until;
  if (busy && (prio === 0 || prio < cur.prio)) return;
  try {
    speechSynthesis.cancel();
    const clean = text.replace(/[^\p{L}\p{N}\s!?,.:;'’«»-]/gu, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'it-IT'; if (itVoice) u.voice = itVoice; u.rate = rate; u.pitch = pitch;
    u.onend = () => { cur.until = 0; };
    cur.prio = prio; cur.until = now + (500 + clean.length * 75) / rate;
    speechSynthesis.speak(u); lastSay = now;
  } catch (e) { /* voce non disponibile */ }
}
export function stopVoice() { cur.until = 0; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
// Tifo: raro, e solo quando Penny è in silenzio da un po'
export function cheer() {
  if (performance.now() - lastSay < 9000) return;
  if (Math.random() < 0.5) say(pick(CHEERS), { rate: 1.05, pitch: 1.25, prio: 0 });
}
