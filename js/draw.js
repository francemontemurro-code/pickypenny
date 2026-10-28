// Disegno: mondi, Penny (con vestiti e facce), oggetti, mani, effetti.
import { V, ctx, rand, pick, clamp, drawEmoji, UI_FONT } from './core.js';
import { WORLDS, OUTFIT } from './data.js';
import { handPoint, handsTogether, video } from './pose.js';

// ---------- mondi ----------
const W_ = { cur: 0, prev: -1, fade: 1, grads: {}, gen: -1, deco: [] };
export function setWorld(i, instant = false) {
  i = ((i % WORLDS.length) + WORLDS.length) % WORLDS.length;
  if (i === W_.cur) return;
  W_.prev = instant ? -1 : W_.cur; W_.cur = i; W_.fade = instant ? 1 : 0;
  W_.deco = [];
}
export const currentWorld = () => WORLDS[W_.cur];

function grad(i) {
  if (W_.gen !== V.gen) { W_.grads = {}; W_.gen = V.gen; }
  if (!W_.grads[i]) {
    const w = WORLDS[i], g = ctx.createLinearGradient(0, 0, 0, V.H);
    g.addColorStop(0, w.sky[0]); g.addColorStop(0.55, w.sky[1]); g.addColorStop(1, w.sky[2]);
    W_.grads[i] = g;
  }
  return W_.grads[i];
}
function hills(w, t) {
  const { W, H } = V;
  ctx.fillStyle = w.hill2;
  ctx.beginPath(); ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.2, H * 0.84, W * 0.45, H * 0.9);
  ctx.quadraticCurveTo(W * 0.75, H * 0.96, W, H * 0.86); ctx.lineTo(W, H); ctx.fill();
  ctx.fillStyle = w.hill;
  ctx.beginPath(); ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.3, H * 0.9, W * 0.6, H * 0.95);
  ctx.quadraticCurveTo(W * 0.85, H * 0.99, W, H * 0.93); ctx.lineTo(W, H); ctx.fill();
}
function newDeco(kind, initial) {
  const { W, H, DPR } = V;
  const d = { x: rand(0, W), y: initial ? rand(0, H) : 0, s: rand(0.6, 1.4), ph: rand(0, 6), r: rand(0, 6) };
  if (kind === 'clouds') { d.y = rand(H * 0.05, H * 0.45); d.x = initial ? rand(0, W) : -200 * DPR; d.v = rand(8, 20) * DPR; }
  else if (kind === 'bubbles') { d.y = initial ? rand(0, H) : H + 20; d.v = rand(25, 60) * DPR; }
  else if (kind === 'stars') { d.v = 0; d.y = rand(0, H * 0.85); }
  else { d.y = initial ? rand(0, H) : -20; d.v = rand(20, 55) * DPR; }
  return d;
}
const DECO_N = { clouds: 6, bubbles: 22, leaves: 14, snow: 45, sprinkles: 30, stars: 60 };
function decoLayer(w, t, dt) {
  const { W, H, DPR } = V, kind = w.deco, n = DECO_N[kind] || 0;
  while (W_.deco.length < n) W_.deco.push(newDeco(kind, true));
  for (let i = 0; i < W_.deco.length; i++) {
    const d = W_.deco[i];
    if (kind === 'clouds') {
      d.x += d.v * dt; if (d.x > W + 220 * DPR) W_.deco[i] = newDeco(kind, false);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      const r = 28 * DPR * d.s;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 7); ctx.arc(d.x + r, d.y - r * 0.4, r * 1.2, 0, 7); ctx.arc(d.x + r * 2.1, d.y, r * 0.9, 0, 7); ctx.fill();
    } else if (kind === 'bubbles') {
      d.y -= d.v * dt; d.x += Math.sin(t / 600 + d.ph) * 0.4 * DPR; if (d.y < -20) W_.deco[i] = newDeco(kind, false);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5 * DPR;
      ctx.beginPath(); ctx.arc(d.x, d.y, 6 * DPR * d.s, 0, 7); ctx.stroke();
    } else if (kind === 'stars') {
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t / 700 + d.ph));
      ctx.beginPath(); ctx.arc(d.x, d.y, 1.6 * DPR * d.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      d.y += d.v * dt; d.x += Math.sin(t / 500 + d.ph) * 0.6 * DPR; d.r += dt * 2;
      if (d.y > H + 20) W_.deco[i] = newDeco(kind, false);
      if (kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(d.x, d.y, 3 * DPR * d.s, 0, 7); ctx.fill(); }
      else if (kind === 'leaves') { drawEmoji(ctx, '🍃', d.x, d.y, 18 * DPR * d.s, d.r); }
      else { ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.r); ctx.fillStyle = ['#ff5fa2', '#ffd23f', '#3fc7ff', '#3ee6b5', '#fff'][i % 5]; ctx.fillRect(-5 * DPR, -1.5 * DPR, 10 * DPR, 3 * DPR); ctx.restore(); }
    }
  }
  if (kind === 'stars' && Math.sin(t / 3000) > 0.995) { // stella cadente
    const x = (t / 3) % W; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.moveTo(x, H * 0.2); ctx.lineTo(x - 60 * DPR, H * 0.2 - 20 * DPR); ctx.stroke();
  }
}
export function drawWorld(t, dt, inMenu = false) {
  if (inMenu) { ctx.fillStyle = '#1b0f52'; ctx.fillRect(0, 0, V.W, V.H); return; }
  W_.fade = Math.min(1, W_.fade + dt * 1.2);
  if (W_.prev >= 0 && W_.fade < 1) { ctx.fillStyle = grad(W_.prev); ctx.fillRect(0, 0, V.W, V.H); ctx.globalAlpha = W_.fade; }
  ctx.fillStyle = grad(W_.cur); ctx.fillRect(0, 0, V.W, V.H);
  ctx.globalAlpha = 1;
  const w = WORLDS[W_.cur];
  decoLayer(w, t, dt);
  hills(w, t);
}

// ---------- Penny ----------
const findItem = (slot, id) => OUTFIT[slot].items.find((x) => x.id === id) || OUTFIT[slot].items[0];
function chain(c, P, ids, color, w) {
  if (P[ids[0]].v < 0.4 || P[ids[1]].v < 0.4) return;
  c.strokeStyle = color; c.lineWidth = w;
  c.beginPath(); c.moveTo(P[ids[0]].x, P[ids[0]].y);
  for (let k = 1; k < ids.length; k++) { const p = P[ids[k]]; if (p.v < 0.4) break; c.lineTo(p.x, p.y); }
  c.stroke();
}
function fillFor(c, kind, x0, y0, x1, y1, t) {
  if (kind === 'rainbow') {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    ['#ff4b4b', '#ff9f2e', '#ffd23f', '#3ee6b5', '#3fc7ff', '#9b5cff'].forEach((col, i) => g.addColorStop(i / 5, col));
    return g;
  }
  if (kind === 'galaxy') {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#2a0f6e'); g.addColorStop(0.5, '#6b2bd9'); g.addColorStop(1, '#ff5fa2');
    return g;
  }
  return kind;
}

// P = punti a schermo; look = vestiti; o = { t, expr, blink, superMode, ring }
export function drawPenny(c, P, look, o = {}) {
  const t = o.t || 0, DPR = o.dpr || V.DPR, MIN = o.min || V.MIN;
  const ls = P[11], rs = P[12];
  const sw = (ls.v > 0.4 && rs.v > 0.4) ? Math.hypot(ls.x - rs.x, ls.y - rs.y) : MIN * 0.18;
  const lw = clamp(sw * 0.3, 8 * DPR, 70 * DPR);
  const shirt = findItem('shirt', look.shirt).c, face = findItem('face', look.face).c;
  const cape = findItem('cape', look.cape).c;
  const hat = findItem('hat', look.hat), glasses = findItem('glasses', look.glasses);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const torsoOk = ls.v > 0.4 && rs.v > 0.4;
  const lh = P[23].v > 0.4 ? P[23] : { x: ls.x, y: ls.y + sw * 1.3 };
  const rh = P[24].v > 0.4 ? P[24] : { x: rs.x, y: rs.y + sw * 1.3 };

  // ombra
  if (torsoOk && !o.noShadow) {
    const fy = Math.max(lh.y, rh.y, ...[27, 28].filter((i) => P[i].v > 0.4).map((i) => P[i].y)) + sw * 0.15;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse((lh.x + rh.x) / 2, Math.min(fy, V.H * 0.97), sw * 0.9, sw * 0.18, 0, 0, 7); c.fill();
  }
  // mantello (dietro)
  if (cape && torsoOk) {
    const wave = Math.sin(t / 250) * sw * 0.12;
    const bx = (lh.x + rh.x) / 2, by = Math.max(lh.y, rh.y) + sw * 0.5;
    c.fillStyle = fillFor(c, cape, ls.x, ls.y, bx, by, t);
    c.beginPath(); c.moveTo(ls.x, ls.y);
    c.lineTo(rs.x, rs.y);
    const dir = rs.x >= ls.x ? 1 : -1; // con l'effetto specchio la spalla sinistra è a destra
    c.quadraticCurveTo(rs.x + dir * (sw * 0.5 + wave), (rs.y + by) / 2, rh.x + dir * (sw * 0.55 + wave), by);
    c.lineTo(lh.x - dir * (sw * 0.55 + wave), by);
    c.quadraticCurveTo(ls.x - dir * (sw * 0.5 + wave), (ls.y + by) / 2, ls.x, ls.y);
    c.fill();
    if (cape === 'galaxy') { c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(bx + Math.sin(i * 2.1) * sw * 0.6, ls.y + (by - ls.y) * ((i * 0.37) % 1), 1.6 * DPR, 0, 7); c.fill(); } }
  }
  // gambe
  chain(c, P, [23, 25, 27], '#5b6cff', lw * 1.05);
  chain(c, P, [24, 26, 28], '#5b6cff', lw * 1.05);
  // corpo
  if (torsoOk) {
    const f = fillFor(c, shirt, ls.x, ls.y, rh.x, rh.y, t);
    c.fillStyle = f; c.strokeStyle = f; c.lineWidth = lw * 0.9;
    c.beginPath(); c.moveTo(ls.x, ls.y); c.lineTo(rs.x, rs.y); c.lineTo(rh.x, rh.y); c.lineTo(lh.x, lh.y); c.closePath();
    c.fill(); c.stroke();
    const cx = (ls.x + rs.x + lh.x + rh.x) / 4, cy = (ls.y + rs.y + lh.y + rh.y) / 4;
    drawEmoji(c, o.superMode ? '⚡' : '⭐', cx, cy, sw * 0.45);
  }
  // braccia
  chain(c, P, [11, 13, 15], '#ffb347', lw * 0.85);
  chain(c, P, [12, 14, 16], '#ffb347', lw * 0.85);

  // testa
  const nose = P[0];
  if (nose.v < 0.4) return;
  let hx = nose.x, hy = nose.y, hr = sw * 0.46, tilt = 0;
  if (P[7].v > 0.4 && P[8].v > 0.4) {
    hx = (P[7].x + P[8].x) / 2; hy = (P[7].y + P[8].y) / 2;
    hr = Math.max(hr, Math.hypot(P[7].x - P[8].x, P[7].y - P[8].y) * 0.75);
    tilt = Math.atan2(P[8].y - P[7].y, P[8].x - P[7].x);
    if (tilt > Math.PI / 2) tilt -= Math.PI; if (tilt < -Math.PI / 2) tilt += Math.PI;
  }
  hr = clamp(hr, 18 * DPR, MIN * 0.25);
  // antenne che molleggiano
  if (look.hat === 'none' || !hat.e || hat.id === 'fiocco') {
    c.strokeStyle = face; c.lineWidth = Math.max(3 * DPR, hr * 0.09);
    for (const s of [-1, 1]) {
      const bob = Math.sin(t / 180 + s) * hr * 0.08;
      const bx = hx + s * hr * 0.45, by = hy - hr * 0.8, tx = hx + s * hr * 0.8, ty = hy - hr * 1.55 + bob;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(hx + s * hr * 0.4, ty, tx, ty); c.stroke();
      c.fillStyle = o.ring || '#ff5fa2'; c.beginPath(); c.arc(tx, ty, hr * 0.16, 0, 7); c.fill();
    }
  }
  c.fillStyle = face; c.beginPath(); c.arc(hx, hy, hr, 0, 7); c.fill();
  c.lineWidth = hr * 0.08; c.strokeStyle = 'rgba(0,0,0,.15)'; c.stroke();
  if (o.ring) { c.lineWidth = hr * 0.12; c.strokeStyle = o.ring; c.beginPath(); c.arc(hx, hy, hr * 1.08, 0, 7); c.stroke(); }

  const expr = o.expr || '';
  // occhi
  const eyes = [P[2], P[5]].map((e, i) => ({
    x: e.v > 0.4 ? e.x : hx + (i ? 1 : -1) * hr * 0.35,
    y: e.v > 0.4 ? e.y : hy - hr * 0.1,
  }));
  eyes.forEach((e) => {
    if (o.superMode) { drawEmoji(c, '⭐', e.x, e.y, hr * 0.5); return; }
    if (expr === 'ouch') { // occhi a X
      c.strokeStyle = '#2a1a6e'; c.lineWidth = hr * 0.08; const s = hr * 0.12;
      c.beginPath(); c.moveTo(e.x - s, e.y - s); c.lineTo(e.x + s, e.y + s); c.moveTo(e.x + s, e.y - s); c.lineTo(e.x - s, e.y + s); c.stroke(); return;
    }
    if (o.blink || expr === 'happy') { // occhi chiusi felici
      c.strokeStyle = '#2a1a6e'; c.lineWidth = hr * 0.08;
      c.beginPath(); c.arc(e.x, e.y + hr * 0.05, hr * 0.13, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return;
    }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, hr * 0.22, 0, 7); c.fill();
    const big = expr === 'wow' ? 0.16 : 0.12;
    c.fillStyle = '#2a1a6e'; c.beginPath(); c.arc(e.x, e.y + hr * 0.03, hr * big, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x + hr * 0.04, e.y - hr * 0.03, hr * 0.04, 0, 7); c.fill();
  });
  // guance
  c.fillStyle = 'rgba(255,95,162,.45)';
  c.beginPath(); c.arc(hx - hr * 0.55, hy + hr * 0.3, hr * 0.15, 0, 7); c.fill();
  c.beginPath(); c.arc(hx + hr * 0.55, hy + hr * 0.3, hr * 0.15, 0, 7); c.fill();
  // bocca
  const my = Math.max(hy + hr * 0.3, nose.y + hr * 0.25);
  c.strokeStyle = '#2a1a6e'; c.lineWidth = hr * 0.09;
  if (expr === 'happy' || o.superMode) {
    c.fillStyle = '#c2185b'; c.beginPath(); c.arc(hx, my - hr * 0.1, hr * 0.3, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
  } else if (expr === 'wow') {
    c.fillStyle = '#c2185b'; c.beginPath(); c.ellipse(hx, my, hr * 0.13, hr * 0.17, 0, 0, 7); c.fill();
  } else if (expr === 'ouch') {
    c.beginPath(); c.moveTo(hx - hr * 0.25, my); for (let i = 1; i <= 4; i++) c.lineTo(hx - hr * 0.25 + i * hr * 0.125, my + (i % 2 ? -1 : 1) * hr * 0.06); c.stroke();
  } else {
    c.beginPath(); c.arc(hx, my - hr * 0.15, hr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
  // occhiali e cappello
  if (glasses.id !== 'none') drawEmoji(c, glasses.e, (eyes[0].x + eyes[1].x) / 2, (eyes[0].y + eyes[1].y) / 2, hr * 1.25, tilt);
  if (hat.id !== 'none') {
    const up = hat.id === 'fiocco' ? 0.75 : 0.95;
    drawEmoji(c, hat.e, hx + Math.sin(tilt) * hr * up, hy - Math.cos(tilt) * hr * up, hr * (hat.id === 'fiocco' ? 0.9 : 1.55), tilt);
  }
}

// ---------- mani ----------
const HAND_COLORS = [['#3fc7ff', '#3ee6b5'], ['#ff9f2e', '#ffd23f']];
export function drawHands(list, o) {
  const { r, frozen, mode2, superMode, t } = o;
  for (const p of list) {
    const cols = HAND_COLORS[p.i];
    const together = mode2 ? handsTogether(p, r) : null;
    // scia arcobaleno in Super Penny
    if (superMode) {
      for (const side of ['L', 'R']) {
        const h = handPoint(p, side); if (!h) continue;
        const tr = (p.trail[side] = p.trail[side] || []); tr.push({ x: h.x, y: h.y }); if (tr.length > 10) tr.shift();
        for (let i = 0; i < tr.length; i++) {
          ctx.globalAlpha = i / tr.length * 0.6;
          ctx.fillStyle = `hsl(${(t / 3 + i * 30) % 360} 90% 60%)`;
          ctx.beginPath(); ctx.arc(tr[i].x, tr[i].y, r * (0.3 + i / tr.length * 0.6), 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else p.trail = [];
    ['L', 'R'].forEach((side, si) => {
      const h = handPoint(p, side); if (!h) return;
      const dim = mode2 && !together;
      const col = frozen ? '#9be7ff' : cols[si];
      const k = 1 + (p.pulse[side] || 0) * 0.35;
      ctx.globalAlpha = dim ? 0.45 : 1;
      const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, r * 1.5 * k);
      g.addColorStop(0, col); g.addColorStop(0.55, col + 'aa'); g.addColorStop(1, col + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, r * 1.5 * k, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.globalAlpha *= 0.9;
      ctx.beginPath(); ctx.arc(h.x, h.y, r * 0.55 * k, 0, 7); ctx.fill();
      ctx.globalAlpha = dim ? 0.45 : 1;
      drawEmoji(ctx, frozen ? '🥶' : '✋', h.x, h.y, r * 0.8 * k);
      ctx.globalAlpha = 1;
    });
    if (together && !frozen) {
      const k = 1 + (p.pulse.B || 0) * 0.35, rb = r * 1.3 * k;
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = rb * 0.12;
      ctx.beginPath(); ctx.arc(together.x, together.y, rb, 0, 7); ctx.stroke();
      drawEmoji(ctx, '🧺', together.x, together.y, rb * 1.2);
    }
  }
}
export function drawPointer(pointer, r) {
  const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, r * 1.4);
  g.addColorStop(0, '#ffd23f'); g.addColorStop(1, '#ffd23f00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, r * 1.4, 0, 7); ctx.fill();
  drawEmoji(ctx, '👆', pointer.x, pointer.y, r * 0.9);
}

// ---------- oggetti ----------
export function drawObjects(objs, t, helperFn) {
  for (const o of objs) {
    const wob = o.kind === 'pinata' ? 0 : Math.sin(t / 300 + o.wob) * o.r * 0.06;
    ctx.save(); ctx.translate(o.x + wob, o.y); ctx.rotate(o.rot);
    const fade = o.dying ? Math.max(0, 1 - o.dying * 3) : 1;
    ctx.globalAlpha = fade;
    if (helperFn && helperFn(o) && !(o.rej > 0)) {
      ctx.fillStyle = 'rgba(255,210,63,.4)'; ctx.beginPath(); ctx.arc(0, 0, o.r * (1.35 + 0.1 * Math.sin(t / 150)), 0, 7); ctx.fill();
    }
    if (o.kind === 'token') {
      const gray = o.rej > 0;
      ctx.fillStyle = gray ? '#9b93c9' : o.color;
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill();
      ctx.lineWidth = o.r * 0.12; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-o.r * 0.35, -o.r * 0.4, o.r * 0.22, 0, 7); ctx.fill();
      const fs = o.label.length > 1 ? 1.0 : 1.25;
      ctx.fillStyle = '#fff'; ctx.font = `800 ${o.r * fs}px ${UI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = o.r * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeText(o.label, 0, o.r * 0.08);
      ctx.fillText(o.label, 0, o.r * 0.08);
    } else if (o.kind === 'power') {
      ctx.rotate(-o.rot);
      const g = ctx.createRadialGradient(0, 0, o.r * 0.2, 0, 0, o.r * 1.4);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.6, 'rgba(160,220,255,.55)'); g.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, o.r * 1.4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = o.r * 0.08; ctx.setLineDash([o.r * 0.2, o.r * 0.15]);
      ctx.beginPath(); ctx.arc(0, 0, o.r * 1.15, t / 300, t / 300 + 6.283); ctx.stroke(); ctx.setLineDash([]);
      drawEmoji(ctx, o.emoji, 0, 0, o.r * 1.5);
    } else if (o.kind === 'pinata') {
      const sh = o.shake > 0 ? Math.sin(t / 25) * o.r * 0.08 * o.shake : 0;
      ctx.translate(sh, 0); ctx.rotate(Math.sin(t / 500) * 0.15);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * V.DPR;
      ctx.beginPath(); ctx.moveTo(0, -o.r * 0.9); ctx.lineTo(0, -o.r * 3); ctx.stroke();
      drawEmoji(ctx, '🪅', 0, 0, o.r * 2);
      for (let i = 0; i < o.hpMax; i++) { // cuoricini dei colpi
        drawEmoji(ctx, i < o.hp ? '💖' : '🤍', (i - (o.hpMax - 1) / 2) * o.r * 0.45, o.r * 1.15, o.r * 0.38);
      }
    } else {
      if (o.avoid) {
        ctx.fillStyle = 'rgba(255,60,90,.22)'; ctx.beginPath(); ctx.arc(0, 0, o.r * 1.3, 0, 7); ctx.fill();
        ctx.setLineDash([o.r * 0.25, o.r * 0.18]); ctx.lineWidth = o.r * 0.1; ctx.strokeStyle = '#ff3c5a';
        ctx.beginPath(); ctx.arc(0, 0, o.r * 1.3, t / 400, t / 400 + 6.283); ctx.stroke(); ctx.setLineDash([]);
      }
      if (o.star) { ctx.fillStyle = 'rgba(255,210,63,.3)'; ctx.beginPath(); ctx.arc(0, 0, o.r * 1.4, 0, 7); ctx.fill(); }
      if (o.rej > 0) ctx.globalAlpha = 0.45 * fade;
      drawEmoji(ctx, o.emoji, 0, 0, o.r * 2);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- effetti ----------
export const FX = { parts: [], pops: [], shake: 0 };
export function burst(x, y, color, n = 14) {
  const { MIN, DPR } = V;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(0.2, 0.6) * MIN;
    FX.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - MIN * 0.15, g: MIN * 0.9, life: rand(0.5, 0.9), t: 0, size: rand(4, 9) * DPR, color: color || pick(['#ffd23f', '#ff5fa2', '#3ee6b5', '#3fc7ff', '#ff9f2e']), shape: Math.random() < 0.5 ? 'c' : 's' });
  }
}
export function confetti(n = 140) {
  const { W, H, MIN, DPR } = V;
  for (let i = 0; i < n; i++) {
    FX.parts.push({ x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-0.08, 0.08) * MIN, vy: rand(0.1, 0.3) * MIN, g: MIN * 0.15, life: rand(3, 5), t: 0, size: rand(6, 12) * DPR, color: pick(['#ffd23f', '#ff5fa2', '#3ee6b5', '#3fc7ff', '#ff9f2e', '#ffffff']), shape: 'r', rot: rand(0, 6), vr: rand(-6, 6) });
  }
}
export function popup(x, y, text, color = '#fff', big = 1) { FX.pops.push({ x, y, text, color, t: 0, big }); }
export function updateFX(dt) {
  for (const p of FX.parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt; }
  FX.parts = FX.parts.filter((p) => p.t < p.life && p.y < V.H + 40);
  if (FX.parts.length > 600) FX.parts.splice(0, FX.parts.length - 600);
  for (const p of FX.pops) p.t += dt;
  FX.pops = FX.pops.filter((p) => p.t < 0.9);
  FX.shake = Math.max(0, FX.shake - dt * 3);
}
export function drawFX() {
  const { MIN, DPR } = V;
  for (const p of FX.parts) {
    ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1);
    ctx.fillStyle = p.color;
    if (p.shape === 'c') { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill(); }
    else if (p.shape === 'r') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
    else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of FX.pops) {
    const k = p.t / 0.9;
    ctx.globalAlpha = 1 - k;
    ctx.font = `800 ${MIN * 0.07 * p.big * (1 + k * 0.3)}px ${UI_FONT}`;
    ctx.lineWidth = 6 * DPR; ctx.strokeStyle = 'rgba(42,26,110,.8)';
    ctx.strokeText(p.text, p.x, p.y - k * MIN * 0.12);
    ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y - k * MIN * 0.12);
  }
  ctx.globalAlpha = 1;
}

// ---------- riquadro telecamera ----------
export function drawCamBox(bottomOffset = 0) {
  if (video.readyState < 2) return;
  const { MIN, H, DPR } = V;
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const w = MIN * 0.28, h = w * vh / vw, m = 12 * DPR;
  const x = m, y = H - h - m - bottomOffset;
  const rr = (c) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, 14 * DPR); else c.rect(x, y, w, h); };
  ctx.save(); rr(ctx); ctx.clip();
  ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  ctx.lineWidth = 3 * DPR; ctx.strokeStyle = 'rgba(255,255,255,.8)'; rr(ctx); ctx.stroke();
}

// Posa finta di Penny per l'anteprima del guardaroba
export function demoPose(w, h, t) {
  const cx = w / 2, sh = h * 0.48, sw = Math.min(w * 0.3, h * 0.21), wave = Math.sin(t / 400) * 0.15;
  const P = Array.from({ length: 33 }, () => ({ x: cx, y: sh, v: 0 }));
  const set = (i, x, y) => { P[i] = { x, y, v: 1 }; };
  set(0, cx, sh - sw * 0.75); set(2, cx - sw * 0.17, sh - sw * 0.85); set(5, cx + sw * 0.17, sh - sw * 0.85);
  set(7, cx - sw * 0.33, sh - sw * 0.8); set(8, cx + sw * 0.33, sh - sw * 0.8);
  set(11, cx - sw / 2, sh); set(12, cx + sw / 2, sh); set(23, cx - sw * 0.38, sh + sw * 1.2); set(24, cx + sw * 0.38, sh + sw * 1.2);
  set(25, cx - sw * 0.42, sh + sw * 1.75); set(26, cx + sw * 0.42, sh + sw * 1.75); set(27, cx - sw * 0.45, sh + sw * 2.3); set(28, cx + sw * 0.45, sh + sw * 2.3);
  set(13, cx - sw * 1.0, sh - sw * (0.3 + wave)); set(14, cx + sw * 1.0, sh - sw * (0.3 - wave));
  set(15, cx - sw * 1.25, sh - sw * (0.95 + wave)); set(16, cx + sw * 1.25, sh - sw * (0.95 - wave));
  return P;
}
