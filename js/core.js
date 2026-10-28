// Utilità comuni, canvas e emoji pre-renderizzate.

export const $ = (s) => document.querySelector(s);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const show = (el) => (typeof el === 'string' ? $(el) : el).classList.remove('hidden');
export const hide = (el) => (typeof el === 'string' ? $(el) : el).classList.add('hidden');
export function hideScreens() { document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden')); }
export function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
export function cleanWord(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
}
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function seeded(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
export const UI_FONT = '"Baloo 2","Arial Rounded MT Bold",system-ui,sans-serif';

// ---------- canvas principale ----------
export const canvas = $('#stage');
export const ctx = canvas.getContext('2d');
export const V = { W: 0, H: 0, DPR: 1, MIN: 1, gen: 0 };
export function resize() {
  V.DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(innerWidth * V.DPR), h = Math.round(innerHeight * V.DPR);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; V.gen++; }
  V.W = canvas.width; V.H = canvas.height; V.MIN = Math.min(V.W, V.H);
}

// ---------- emoji pre-renderizzate (molto più veloci da disegnare) ----------
const emojiCache = new Map();
export function emojiImg(e, size) {
  size = Math.max(8, Math.round(size / 4) * 4);
  const key = e + '|' + size;
  let c = emojiCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    const s = Math.ceil(size * 1.3); c.width = c.height = s;
    const x = c.getContext('2d');
    x.font = `${size}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(e, s / 2, s / 2 + size * 0.06);
    emojiCache.set(key, c);
    if (emojiCache.size > 260) emojiCache.delete(emojiCache.keys().next().value);
  }
  return c;
}
export function drawEmoji(c, e, x, y, size, rot = 0) {
  const img = emojiImg(e, size);
  if (rot) { c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(img, -img.width / 2, -img.height / 2); c.restore(); }
  else c.drawImage(img, x - img.width / 2, y - img.height / 2);
}
