// Impostazioni e profilo salvati sul telefono (monetine, figurine, vestiti, record, sfide del giorno).
import { MISSIONS, MISSION_REWARD, STICKERS, DEFAULT_LOOK, OUTFIT } from './data.js';
import { hashStr, seeded, todayKey, pick } from './core.js';

const SKEY = 'pickypenny.settings';
const PKEY = 'pickypenny.profile';
function load(key, def) {
  try { return { ...def, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch (e) { return { ...def }; }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ } }

export const DEFAULTS = {
  mode: 'punti', age: 'mini', minutes: 2, rounds: 3, wordChoice: 'random', customWord: '',
  showCam: true, catchMode: 'mano', avoid: true, pennySize: 'media', players: 1, music: true,
};
export const S = load(SKEY, DEFAULTS);
export const saveSettings = () => save(SKEY, S);

const PDEF = {
  coins: 0, stickers: {}, owned: [], look: { ...DEFAULT_LOOK },
  records: {}, daily: null, streak: { last: '', days: 0 }, games: 0,
};
export const P = load(PKEY, PDEF);
P.look = { ...DEFAULT_LOOK, ...(P.look || {}) };
P.stickers = P.stickers || {}; P.owned = P.owned || []; P.records = P.records || {};
export const saveProfile = () => save(PKEY, P);

// ---------- monetine ----------
export function addCoins(n) { P.coins = Math.max(0, P.coins + n); saveProfile(); }

// ---------- vestiti ----------
export function isOwned(slot, id) {
  const it = OUTFIT[slot].items.find((x) => x.id === id);
  return !!it && (it.price === 0 || P.owned.includes(`${slot}:${id}`));
}
export function buy(slot, id) {
  const it = OUTFIT[slot].items.find((x) => x.id === id);
  if (!it || isOwned(slot, id) || P.coins < it.price) return false;
  P.coins -= it.price; P.owned.push(`${slot}:${id}`); P.look[slot] = id; saveProfile(); return true;
}
export function wear(slot, id) { if (isOwned(slot, id)) { P.look[slot] = id; saveProfile(); } }

// ---------- figurine ----------
export function stickerCount() { return STICKERS.filter((s) => P.stickers[s.id]).length; }
// Estrae una figurina: di solito una che manca ancora
export function drawSticker() {
  const missing = STICKERS.filter((s) => !P.stickers[s.id]);
  const st = missing.length && Math.random() < 0.75 ? pick(missing) : pick(STICKERS);
  const isNew = !P.stickers[st.id];
  P.stickers[st.id] = (P.stickers[st.id] || 0) + 1;
  saveProfile();
  return { st, isNew };
}

// ---------- record ----------
export function recordKey() { return `${S.mode}|${S.age}|${S.players}`; }
export function getRecord() { return P.records[recordKey()] || 0; }
export function setRecord(score) { if (score > getRecord()) { P.records[recordKey()] = score; saveProfile(); return true; } return false; }

// ---------- sfide del giorno ----------
const ageIdx = () => ({ mini: 0, small: 1, big: 2 }[S.age] ?? 0);
export function ensureDaily() {
  const day = todayKey();
  if (P.daily && P.daily.day === day) return P.daily;
  const rnd = seeded(hashStr(day));
  const pool = MISSIONS.slice();
  const list = [];
  while (list.length < 3 && pool.length) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  P.daily = {
    day, bonus: false,
    missions: list.map((m) => ({ id: m.id, target: m.n[ageIdx()], progress: 0, done: false })),
  };
  saveProfile();
  return P.daily;
}
export function missionDef(id) { return MISSIONS.find((m) => m.id === id); }

// Aggiorna una statistica; ritorna le sfide appena completate
const listeners = [];
export function onMissionDone(fn) { listeners.push(fn); }
export function stat(key, amount = 1, isMax = false) {
  const d = ensureDaily();
  const completed = [];
  for (const m of d.missions) {
    const def = missionDef(m.id);
    if (m.done || def.stat !== key) continue;
    m.progress = def.max || isMax ? Math.max(m.progress, amount) : m.progress + amount;
    if (m.progress >= m.target) {
      m.progress = m.target; m.done = true; completed.push({ m, def });
      P.coins += MISSION_REWARD;
    }
  }
  let allDone = false;
  if (completed.length && d.missions.every((m) => m.done) && !d.bonus) {
    d.bonus = true; allDone = true;
    const day = d.day;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    P.streak.days = P.streak.last === yk ? P.streak.days + 1 : P.streak.last === day ? P.streak.days : 1;
    P.streak.last = day;
  }
  if (completed.length) { saveProfile(); listeners.forEach((fn) => fn(completed, allDone)); }
  return completed;
}
export function streakDays() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  const yk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (P.streak.last === todayKey() || P.streak.last === yk) ? P.streak.days : 0;
}
