// Picky Penny — logica di gioco: round, livelli e mondi, combo, poteri, pentolaccia, "Penny dice", sfide lampo.
import { $, rand, pick, clamp, sleep, show, hide, hideScreens, distSeg, canvas, ctx, V, resize } from './core.js';
import { AGES, POWERS, FLASH, SAYS, WORLDS, P2_LOOK, BONUS, STICKERS, LEARN_MODES } from './data.js';
import { S, P, saveProfile, addCoins, stat, onMissionDone, getRecord, setRecord, drawSticker, ensureDaily } from './store.js';
import { audio, SFX, say, stopVoice, cheer, musicStart, musicStop, musicTempo, musicRoot } from './audio.js';
import { cam, players, visible, activePlayers, loadPose, setNumPoses, startCamera, stopCamera, updatePose, handPoint, handsTogether, catchRadius, gesture, hasLandmarker } from './pose.js';
import { setWorld, currentWorld, drawWorld, drawPenny, drawHands, drawPointer, drawObjects, FX, burst, confetti, popup, updateFX, drawFX, drawCamBox } from './draw.js';
import { MODE_IMPL } from './modes.js';
import { initUI, showHome } from './ui.js';

resize(); addEventListener('resize', resize);
const A = () => AGES[S.age];
let M = MODE_IMPL.punti;

const G = {
  phase: 'menu', paused: false, session: 0, finger: false,
  score: 0, level: 1, levelPts: 0, round: 1, roundTime: 120, elapsed: 0, roundStart: 0,
  objs: [], spawnT: 0, needT: 0, hold: 0, readyHold: 0, lastTick: -1, frozen: 0,
  combo: 0, comboBest: 0, powers: { magnet: 0, slow: 0, giant: 0, rain: 0 }, rainT: 0,
  powerT: 15, eventT: 18, event: null, lastPinata: -99, playTime: 0,
  record: 0, recordBeaten: false, coins: 0, catchCount: 0,
  task: null, usedWords: [], customUsed: false, tasksDone: 0,
};
const mult = () => (G.combo >= 12 ? 3 : G.combo >= 5 ? 2 : 1);
const superMode = () => G.combo >= 5 && G.phase === 'play';
const levelTarget = () => Math.round((A().target + 4 * (G.level - 1)) * (S.players > 1 ? 1.5 : 1));
function speedMul() {
  const lv = Math.min(3, 1 + 0.17 * (G.level - 1));
  return lv * (1 + 0.6 * Math.min(1, G.elapsed / G.roundTime));
}

// ---------- tocco (gioco col dito / prova dei genitori) ----------
const pointer = { x: 0, y: 0, px: 0, py: 0, active: false };
canvas.addEventListener('pointerdown', (e) => { pointer.active = true; pointer.x = pointer.px = e.clientX * V.DPR; pointer.y = pointer.py = e.clientY * V.DPR; });
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || pointer.active) { pointer.active = true; pointer.x = e.clientX * V.DPR; pointer.y = e.clientY * V.DPR; } });
const endPointer = (e) => { if (e.pointerType !== 'mouse') pointer.active = false; };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { pointer.active = false; });

// ---------- avvisi (in coda, così non si sovrappongono) ----------
const BQ = []; let bannerBusy = false, bannerTimer = null;
function banner(html, ms = 1800, urgent = false) {
  if (urgent) { BQ.length = 0; clearTimeout(bannerTimer); bannerBusy = false; }
  BQ.push({ html, ms }); if (!bannerBusy) nextBanner();
}
function nextBanner() {
  const b = $('#banner'), it = BQ.shift();
  if (!it) { bannerBusy = false; hide(b); return; }
  bannerBusy = true; b.innerHTML = it.html; show(b);
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  bannerTimer = setTimeout(nextBanner, it.ms);
}
function clearBanners() { BQ.length = 0; clearTimeout(bannerTimer); bannerBusy = false; hide('#banner'); }

onMissionDone((list, all) => {
  if (G.phase === 'menu') return;
  SFX.coin();
  list.forEach(({ def, m }) => banner(`🏅 Sfida del giorno!<small>${def.text(m.target)} · +15 🪙</small>`, 2400));
  if (all) {
    const { st } = drawSticker();
    banner(`🎁 Tutte le sfide di oggi!<small>Figurina in regalo: ${st.e} ${st.n}</small>`, 3000);
    say(`Hai completato tutte le sfide di oggi! Ecco una figurina in regalo!`, { interrupt: false });
  }
});

// ---------- HUD ----------
let hudKey = '';
const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function updateHUD(force) {
  const left = G.roundTime - G.elapsed;
  const pw = Object.entries(G.powers).filter(([, v]) => v > 0).map(([k, v]) => `${k}${Math.ceil(v)}`).join(',');
  const key = `${G.score}|${G.level}|${G.round}|${Math.ceil(left)}|${G.levelPts}|${G.combo}|${pw}|${players[0].catches}|${players[1].catches}|${G.phase}`;
  if (!force && key === hudKey) return; hudKey = key;
  $('#hudScore').textContent = `⭐ ${G.score}`;
  const w = currentWorld();
  $('#hudLevel').textContent = `${w.e} Livello ${G.level}`;
  $('#hudRound').textContent = `Round ${G.round}/${S.rounds}`;
  const t = $('#hudTime'); t.textContent = fmtTime(left); t.classList.toggle('hurry', left <= 5.5 && G.phase === 'play');
  const bar = $('#levelBar');
  bar.classList.toggle('hidden', M.learn);
  bar.firstElementChild.style.width = `${clamp(G.levelPts / levelTarget(), 0, 1) * 100}%`;
  const cb = $('#hudCombo');
  cb.classList.toggle('hidden', G.combo < 3);
  cb.textContent = `🔥 ${G.combo}${mult() > 1 ? ` · ×${mult()}` : ''}`;
  cb.classList.toggle('super', mult() > 1);
  $('#hudPowers').innerHTML = Object.entries(G.powers).filter(([, v]) => v > 0)
    .map(([k, v]) => `<div class="pill power">${POWERS[k].e} ${Math.ceil(v)}</div>`).join('');
  const h2 = $('#hud2p');
  h2.classList.toggle('hidden', S.players < 2);
  h2.innerHTML = `<span class="p1">● ${players[0].catches}</span> <span class="p2">● ${players[1].catches}</span>`;
}
function renderTaskBar() {
  const tb = $('#taskBar');
  if (!M.learn || !G.task) { hide(tb); return; }
  tb.innerHTML = M.bar(G); show(tb);
}
$('#taskBar').addEventListener('click', (e) => {
  if (e.target.closest('[data-repeat]') && M.repeat) say(M.repeat(G));
});

// ---------- oggetti ----------
function makeObj(sizeMul = 1, speedF = 1) {
  const a = A(), sm = speedMul(), { W, H, MIN } = V;
  const sp = a.speed * H * sm * speedF;
  const o = { kind: 'item', x: 0, y: 0, vx: 0, vy: 0, g: 0, r: a.size * MIN * sizeMul, rot: rand(-0.4, 0.4), vr: rand(-1.5, 1.5), bounce: false, entered: false, wob: rand(0, 6), rej: 0, age: 0 };
  o.sp = sp;
  return o;
}
function launch(o) {
  const a = A(), { W, H, MIN } = V;
  const sp = o.sp * (o.fast || 1);
  const pr = Math.random(), [pFall, pSide] = a.patterns;
  if (pr < pFall) {
    const pc = pennyCenter();
    o.x = pc != null && Math.random() < 0.5 ? clamp(pc + rand(-0.3, 0.3) * MIN, W * 0.08, W * 0.92) : rand(W * 0.1, W * 0.9);
    o.y = -o.r; o.vx = rand(-0.15, 0.15) * sp; o.vy = sp * rand(0.8, 1.15); o.g = sp * 0.15;
  } else if (pr < pFall + pSide) {
    const left = Math.random() < 0.5, asp = clamp(W / H, 0.55, 1.4);
    o.x = left ? -o.r : W + o.r; o.y = rand(H * 0.15, H * 0.5);
    o.vx = (left ? 1 : -1) * sp * rand(0.9, 1.25) * asp; o.vy = -sp * rand(0.4, 0.8); o.g = sp * 0.9;
  } else {
    o.x = rand(W * 0.2, W * 0.8); o.y = -o.r; o.bounce = true;
    o.vx = (Math.random() < 0.5 ? -1 : 1) * sp * 0.7; o.vy = sp * 0.7; o.g = sp * 0.25;
  }
  G.objs.push(o);
  return o;
}
function pennyCenter() {
  const act = activePlayers(performance.now());
  if (!act.length) return null;
  const p = pick(act), a = p.SP[11], b = p.SP[12];
  return (a.v > 0.4 && b.v > 0.4) ? (a.x + b.x) / 2 : p.SP[0].x;
}
function spawn(force = false) {
  const o = makeObj();
  if (M.learn) { const good = M.spawn(o, G, force); if (good) G.needT = 0; }
  else M.spawn(o, G, force, currentWorld());
  launch(o);
}
function spawnPower() {
  const allowed = M.learn ? ['slow', 'giant'] : Object.keys(POWERS);
  const id = pick(allowed);
  const o = makeObj(1.15, 0.7);
  o.kind = 'power'; o.power = id; o.emoji = POWERS[id].e;
  o.vr = 0;
  launch(o);
}
function spawnStar(x, y, vy) {
  const o = makeObj(0.85, 1);
  o.emoji = '⭐'; o.star = true; o.pts = 3;
  o.x = x ?? rand(V.W * 0.08, V.W * 0.92); o.y = y ?? -o.r; o.vx = rand(-0.1, 0.1) * o.sp; o.vy = vy ?? o.sp * rand(0.7, 1); o.g = o.sp * 0.1;
  G.objs.push(o);
}
function rewardRain(emojis, n = 8, pts = 1) {
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      if (G.phase !== 'play') return;
      const o = makeObj(1, 0.7);
      o.emoji = pick(emojis); o.pts = pts; o.bonus = true;
      const pc = pennyCenter();
      o.x = clamp((pc ?? V.W / 2) + rand(-0.35, 0.35) * V.MIN, V.W * 0.08, V.W * 0.92); o.y = -o.r;
      o.vy = o.sp * 0.6; o.g = o.sp * 0.1;
      G.objs.push(o);
    }, i * 160);
  }
}

// ---------- prese ----------
function getCatchers(now) {
  const out = [];
  if (G.frozen > 0) { players.forEach((p) => { p.prev = { L: null, R: null, B: null }; }); return out; }
  const base = catchRadius(), giant = G.powers.giant > 0 ? 1.8 : 1, r = base * giant;
  for (const p of activePlayers(now)) {
    if (S.catchMode === 'mani') {
      const b = handsTogether(p, base);
      if (b) { const pr = p.prev.B || b; out.push({ id: 'B', pi: p.i, x: b.x, y: b.y, px: pr.x, py: pr.y, r: r * 1.3 }); p.prev.B = b; }
      else p.prev.B = null;
    } else {
      for (const side of ['L', 'R']) {
        const h = handPoint(p, side);
        if (h) { const pr = p.prev[side] || h; out.push({ id: side, pi: p.i, x: h.x, y: h.y, px: pr.x, py: pr.y, r }); p.prev[side] = { x: h.x, y: h.y }; }
        else p.prev[side] = null;
      }
    }
  }
  if (pointer.active) {
    out.push({ id: 'P', pi: 0, x: pointer.x, y: pointer.y, px: pointer.px, py: pointer.py, r });
    pointer.px = pointer.x; pointer.py = pointer.y;
  }
  return out;
}
function setExpr(pi, type, dur = 0.7) { const p = players[pi]; if (p) { p.expr.type = type; p.expr.t = dur; } }

function addPoints(n, x, y, color = '#fff', label) {
  const pts = n * mult();
  G.score += pts;
  if (!M.learn) G.levelPts += n; // il livello sale coi punti "veri", non con il moltiplicatore
  popup(x, y, label || `+${pts}`, color, pts > 2 ? 1.2 : 1);
  if (G.record > 0 && !G.recordBeaten && G.score > G.record) {
    G.recordBeaten = true; SFX.win(); confetti(60);
    banner('🏆 Nuovo record!<small>Hai battuto il tuo punteggio migliore</small>', 2200);
    say('Nuovo record!', { interrupt: false });
  }
}
function comboUp() {
  G.combo++; G.comboBest = Math.max(G.comboBest, G.combo);
  stat('comboMax', G.combo, true);
  if (G.combo === 5) { SFX.combo(); banner('⚡ Super Penny!<small>Punti ×2 finché non sbagli</small>', 1800); cheer(true); }
  else if (G.combo === 12) { SFX.combo(); confetti(50); banner('🌟 Mega Penny!<small>Punti ×3!</small>', 1800); say('Mega Penny!'); }
  else if (G.combo > 5 && G.combo % 10 === 0) cheer(true);
}
function comboBreak(x, y) {
  if (G.combo >= 5) popup(x, y - V.MIN * 0.08, 'Combo persa', '#ffb3c7', 0.8);
  G.combo = 0;
}

function onCatch(o, c) {
  const p = players[c.pi];
  if (p) p.pulse[c.id] = 1;
  if (o.kind === 'power') return activatePower(o, c);
  if (o.kind === 'pinata') return hitPinata(o, c);
  if (o.avoid) {
    o.dead = true;
    const lost = Math.min(2, G.score);
    G.score -= lost; G.levelPts = Math.max(0, G.levelPts - lost);
    G.frozen = 1.0; FX.shake = 0.5;
    SFX.ouch(); burst(o.x, o.y, '#9be7ff', 18);
    popup(o.x, o.y, lost ? `Ahi! -${lost}` : 'Ahi!', '#9be7ff');
    setExpr(c.pi, 'ouch', 1); comboBreak(o.x, o.y);
    if (G.event && G.event.type === 'flash' && G.event.def.id === 'dodge') G.event.failed = true;
    return updateHUD(true);
  }
  if (M.learn && !o.bonus) {
    if (!M.isGood(o, G)) { // sbagliato: rimbalza via
      o.rej = 0.7; o.vy = -Math.abs(o.vy) - V.H * 0.35; o.vx = -o.vx + rand(-0.1, 0.1) * V.H;
      SFX.wrong(); popup(o.x, o.y - o.r, 'Ops! 🙃'); comboBreak(o.x, o.y); setExpr(c.pi, 'wow', 0.5);
      return;
    }
    o.dead = true; if (p) p.catches++;
    const res = M.onGood(o, G);
    comboUp();
    SFX.catch(G.combo); burst(o.x, o.y, o.color);
    addPoints(1, o.x, o.y, o.color || '#fff', o.label ? `${o.label}` : undefined);
    setExpr(c.pi, 'happy');
    stat('learnWin');
    if (res.say) say(res.say, { rate: 1.05 });
    renderTaskBar(); updateHUD(true);
    if (res.done) taskDone(res);
    return;
  }
  // Acchiappa tutto (e premi bonus)
  o.dead = true; if (p) p.catches++;
  G.catchCount++;
  comboUp();
  if (o.star) { SFX.star(); burst(o.x, o.y, '#ffd23f', 26); addPoints(o.pts, o.x, o.y, '#ffd23f', `+${o.pts * mult()} ⭐`); stat('stars'); }
  else { SFX.catch(G.combo); burst(o.x, o.y); addPoints(o.pts || 1, o.x, o.y); }
  stat('catch');
  setExpr(c.pi, 'happy', 0.5);
  if (G.catchCount % 7 === 0) cheer();
  const ev = G.event;
  if (ev && ev.type === 'flash') {
    if (ev.def.id === 'any' || (ev.def.id === 'stars' && o.star)) { ev.prog++; updateEventCard(); }
  }
  if (!M.learn && G.levelPts >= levelTarget()) levelUp();
  updateHUD(true);
}

// ---------- livelli e mondi ----------
function enterWorld() {
  const w = WORLDS[(G.level - 1) % WORLDS.length];
  setWorld(G.level - 1);
  musicRoot(w.root);
  stat('worldMax', G.level, true);
  return w;
}
function levelUp() {
  G.level++; G.levelPts = 0;
  const w = enterWorld();
  SFX.level(); confetti(70);
  const newAvoid = S.avoid && G.level === A().avoidFrom && G.level > 1;
  banner(`${w.e} ${w.name}!<small>Livello ${G.level} · ${newAvoid ? 'non toccare quelli col cerchio rosso!' : 'più veloce!'}</small>`, 2400);
  say(newAvoid ? `Livello ${G.level}! ${w.name}! Attenzione: non toccare quelli col cerchio rosso!` : `Livello ${G.level}! ${w.name}!`);
}
async function taskDone(res) {
  const s = G.session;
  G.tasksDone++;
  G.objs.forEach((o) => { if (o.kind !== 'power') { burst(o.x, o.y, o.color, 5); o.dead = true; } });
  G.hold = 4.2;
  G.score += 3 * mult();
  const lv = !M.levelEvery || G.tasksDone % M.levelEvery === 0;
  SFX.level(); confetti(80);
  banner(res.doneBanner, 2200, true);
  say(res.doneSay);
  if (lv) { G.level++; enterWorld(); }
  await sleep(2400); if (s !== G.session || G.phase !== 'play') return;
  M.newTask(G);
  const an = M.announce(G, false);
  renderTaskBar();
  banner(an.banner, 2200);
  say(an.say, { rate: 0.88 });
}

// ---------- poteri ----------
function activatePower(o, c) {
  o.dead = true;
  const def = POWERS[o.power];
  G.powers[o.power] = def.dur;
  SFX.power(); burst(o.x, o.y, '#ffffff', 24);
  popup(o.x, o.y, `${def.e} ${def.name}!`, '#fff', 1.1);
  setExpr(c.pi, 'wow', 1);
  say(def.say, { rate: 1.05 });
  stat('power');
  updateHUD(true);
}
function updatePowers(dt) {
  for (const k in G.powers) if (G.powers[k] > 0) G.powers[k] = Math.max(0, G.powers[k] - dt);
  if (G.powers.rain > 0) { G.rainT -= dt; if (G.rainT <= 0) { G.rainT = 0.18; spawnStar(); } }
}

// ---------- eventi: Penny dice, sfida lampo, pentolaccia ----------
function updateEventCard() {
  const ev = G.event, card = $('#eventCard');
  if (!ev) { hide(card); return; }
  show(card);
  let emoji = '', text = '', prog = '', frac = 0;
  if (ev.type === 'says') {
    emoji = ev.def.e; text = ev.def.text; frac = 1 - ev.t / ev.dur;
    const act = Object.values(ev.st);
    if (ev.def.id === 'clap') prog = act.map((s) => '👏'.repeat(Math.min(3, s.clap.n)) + '·'.repeat(Math.max(0, 3 - s.clap.n))).join('  ');
    if (S.players > 1) prog += '  ' + [0, 1].map((i) => (ev.st[i] && ev.st[i].done ? '✅' : '⬜')).join(' ');
  } else if (ev.type === 'flash') {
    emoji = ev.def.e; text = ev.def.text.replace('🌵', currentWorld().avoid[0]); frac = 1 - ev.t / ev.def.time;
    if (ev.def.n) prog = `${Math.min(ev.prog, ev.def.n)} / ${ev.def.n}`;
  } else if (ev.type === 'pinata') {
    emoji = '🪅'; text = 'Rompi la pentolaccia!'; frac = 1 - ev.t / ev.dur;
    prog = ev.obj ? '💖'.repeat(ev.obj.hp) + '🤍'.repeat(ev.obj.hpMax - ev.obj.hp) : '';
  }
  $('#evEmoji').textContent = emoji; $('#evText').textContent = text; $('#evProg').textContent = prog;
  $('#evBar').style.width = `${clamp(frac, 0, 1) * 100}%`;
}
function startEvent(now) {
  const opts = [];
  if (!G.finger && hasLandmarker() && activePlayers(now).length) opts.push('says', 'says');
  if (!M.learn) {
    opts.push('flash');
    if (G.playTime - G.lastPinata > 30) opts.push('pinata', 'pinata');
  }
  if (!opts.length) { G.eventT = 10; return; }
  const type = pick(opts);
  if (type === 'says') startSays(now);
  else if (type === 'flash') startFlash();
  else startPinata();
}
function endEvent() {
  G.event = null; G.eventT = rand(18, 26); hide('#eventCard');
  players.forEach((p) => { p.NB.freeze = false; });
}

function startSays(now) {
  const def = pick(SAYS);
  const ev = { type: 'says', def, t: 0, dur: A().sayTime, st: {} };
  for (const p of activePlayers(now)) {
    p.NB.freeze = true;
    ev.st[p.i] = { base: { cy: p.cy, sw: p.sw }, hold: 0, done: false, clap: { open: true, n: 0 } };
  }
  G.event = ev;
  G.objs.forEach((o) => { if (o.kind !== 'pinata') o.dying = 0.0001; });
  G.hold = 99;
  SFX.whoosh(); say(def.say);
  updateEventCard();
}
function updateSays(dt, now) {
  const ev = G.event; ev.t += dt;
  const act = activePlayers(now);
  for (const p of act) {
    let st = ev.st[p.i];
    if (!st) st = ev.st[p.i] = { base: { cy: p.cy, sw: p.sw }, hold: 0, done: false, clap: { open: true, n: 0 } };
    if (st.done) continue;
    const g = gesture(p); if (!g) continue;
    let cond = false, need = 0.35;
    switch (ev.def.id) {
      case 'su': cond = g.up; break;
      case 'testa': cond = g.head; need = 0.45; break;
      case 'aereo': cond = g.plane; need = 0.45; break;
      case 'salta': cond = (st.base.cy - p.cy) / st.base.sw > 0.3; need = 0; break;
      case 'giu': cond = (p.cy - st.base.cy) / st.base.sw > 0.55; need = 0.2; break;
      case 'clap':
        if (st.clap.open && g.handDist < 0.7) { st.clap.open = false; st.clap.n++; SFX.hit(); const h = handPoint(p, 'L'); if (h) popup(h.x, h.y, '👏'); }
        else if (!st.clap.open && g.handDist > 1.2) st.clap.open = true;
        cond = st.clap.n >= 3; need = 0; break;
    }
    st.hold = cond ? st.hold + dt : 0;
    if (st.hold >= need && cond) {
      st.done = true; setExpr(p.i, 'happy', 1.2); SFX.catch(8);
      const h = p.SP[0]; burst(h.x, h.y, '#ffd23f', 20);
    }
  }
  updateEventCard();
  const sts = Object.values(ev.st);
  const doneN = sts.filter((s) => s.done).length;
  const allDone = act.length > 0 && act.every((p) => ev.st[p.i] && ev.st[p.i].done);
  if (allDone) endSays(true, doneN);
  else if (ev.t >= ev.dur) endSays(doneN > 0, doneN);
}
function endSays(ok, n) {
  endEvent(); G.hold = 0.6;
  if (ok) {
    SFX.win(); confetti(90);
    addCoins(2 * n); G.coins += 2 * n;
    stat('says');
    G.score += 3 * mult();
    banner(`🎉 Bravissimo!<small>Hai fatto quello che dice Penny · +${2 * n} 🪙</small>`, 2000, true);
    say('Bravissimo! Ecco una pioggia di premi!');
    if (!M.learn) rewardRain(currentWorld().items, 9, 1);
  } else {
    banner('😄 Quasi!<small>La prossima volta ce la fai</small>', 1600, true);
    say('Quasi! La prossima volta!');
  }
  updateHUD(true);
}

function startFlash() {
  const pool = FLASH.filter((f) => !f.needAvoid || (S.avoid && G.level >= A().avoidFrom));
  const def = pick(pool);
  G.event = { type: 'flash', def, t: 0, prog: 0, failed: false };
  SFX.whoosh();
  say(`Sfida lampo! ${def.text.replace('🌵', 'quelli col cerchio rosso')}`);
  updateEventCard();
}
function updateFlash(dt) {
  const ev = G.event; ev.t += dt;
  const d = ev.def;
  if (d.id === 'dodge') {
    if (ev.failed) return endFlash(false);
    if (ev.t >= d.time) return endFlash(true);
  } else {
    if (ev.prog >= d.n) return endFlash(true);
    if (ev.t >= d.time) return endFlash(false);
  }
  updateEventCard();
}
function endFlash(ok) {
  endEvent();
  if (ok) {
    SFX.win(); confetti(60);
    addCoins(3); G.coins += 3; stat('flash');
    G.score += 5 * mult();
    banner('⚡ Sfida lampo vinta!<small>+5 punti · +3 🪙</small>', 1900);
    cheer(true);
  } else banner('⏱️ Tempo scaduto!<small>Riprova alla prossima sfida</small>', 1500);
  updateHUD(true);
}

function startPinata() {
  const r = V.MIN * 0.11, hp = { mini: 4, small: 5, big: 6 }[S.age] || 5;
  const o = { kind: 'pinata', x: V.W / 2, y: -r * 2, vx: 0, vy: 0, g: 0, r, rot: 0, vr: 0, hp, hpMax: hp, shake: 0, cd: {}, t: 0, age: 0, wob: 0, rej: 0, custom: true };
  G.objs.push(o);
  G.event = { type: 'pinata', obj: o, t: 0, dur: 14 };
  G.lastPinata = G.playTime;
  SFX.whoosh(); say('Arriva la pentolaccia! Colpiscila!');
  updateEventCard();
}
function updatePinata(dt) {
  const ev = G.event, o = ev.obj; ev.t += dt;
  if (o && !o.dead) {
    o.t += dt;
    const ty = ev.t > ev.dur ? -o.r * 4 : V.H * 0.37;
    o.y += (ty - o.y) * Math.min(1, dt * 2);
    o.x = V.W / 2 + Math.sin(o.t * 0.8) * V.W * 0.28;
    o.shake = Math.max(0, o.shake - dt * 3);
    for (const k in o.cd) o.cd[k] -= dt;
    if (ev.t > ev.dur && o.y < -o.r * 2) { o.dead = true; endEvent(); banner('🎈 La pentolaccia è volata via!<small>La prossima volta colpiscila più forte</small>', 1700); return; }
  }
  updateEventCard();
}
function hitPinata(o, c) {
  const key = `${c.pi}${c.id}`;
  if (o.cd[key] > 0) return;
  o.cd[key] = 0.4;
  o.hp--; o.shake = 1; FX.shake = 0.25;
  SFX.hit(); burst(o.x, o.y, null, 10); setExpr(c.pi, 'wow', 0.6);
  popup(o.x, o.y - o.r, 'Pam!', '#fff');
  if (o.hp <= 0) {
    o.dead = true;
    SFX.boom(); confetti(140); FX.shake = 0.6;
    for (let i = 0; i < 14; i++) {
      const it = makeObj(1, 0.6);
      it.emoji = pick(['🍬', '🍭', '🍫', '🍩', '🧁', '🍪']); it.pts = 2; it.bonus = true;
      it.x = o.x; it.y = o.y; const a = rand(-Math.PI * 0.9, -Math.PI * 0.1);
      it.vx = Math.cos(a) * it.sp * 1.4; it.vy = Math.sin(a) * it.sp * 1.6; it.g = it.sp * 1.1;
      G.objs.push(it);
    }
    addCoins(3); G.coins += 3; stat('pinata');
    endEvent();
    banner('🪅 Pentolaccia rotta!<small>Prendi tutti i dolcetti! · +3 🪙</small>', 2000, true);
    say('Evviva! Prendi i dolcetti!');
  }
  updateEventCard();
}

// ---------- aggiornamento ----------
function update(dt, now) {
  const saysOn = G.event && G.event.type === 'says';
  if (!saysOn) { G.elapsed += dt; G.playTime += dt; }
  const left = G.roundTime - G.elapsed;
  if (left <= 0) { endRound(); return; }
  const sec = Math.ceil(left);
  if (sec <= 5 && sec !== G.lastTick) { G.lastTick = sec; SFX.tick(); }

  const a = A(), sm = speedMul();
  musicTempo(1 + (sm - 1) * 0.35);
  if (G.frozen > 0) G.frozen -= dt;
  updatePowers(dt);
  for (const p of players) { if (p.expr.t > 0) p.expr.t -= dt; p.nextBlink -= dt; if (p.nextBlink <= 0) { p.blink = 0.13; p.nextBlink = rand(2.5, 5); } if (p.blink > 0) p.blink -= dt; for (const k in p.pulse) p.pulse[k] = Math.max(0, p.pulse[k] - dt * 3); }

  // eventi
  if (G.event) {
    if (G.event.type === 'says') updateSays(dt, now);
    else if (G.event.type === 'flash') updateFlash(dt);
    else if (G.event.type === 'pinata') updatePinata(dt);
  } else if (G.hold <= 0) {
    G.eventT -= dt;
    if (G.eventT <= 0) startEvent(now);
  }

  // nascita oggetti
  if (G.hold > 0) { if (!saysOn) G.hold -= dt; }
  else {
    G.spawnT -= dt; G.needT += dt;
    let maxObj = a.maxObj + Math.floor((G.level - 1) / 2);
    if (G.event && G.event.type === 'pinata') maxObj = Math.ceil(maxObj / 2);
    const hasGood = M.learn && G.objs.some((o) => !o.rej && !o.dying && o.kind !== 'power' && M.isGood(o, G));
    if (M.learn && G.task && !hasGood && G.needT > a.needEvery / Math.sqrt(sm)) spawn(true);
    else if (G.spawnT <= 0 && G.objs.filter((o) => o.kind !== 'pinata').length < maxObj) {
      spawn(); G.spawnT = Math.max(0.35, a.spawn / Math.sqrt(sm)) * rand(0.7, 1.3);
    }
    G.powerT -= dt;
    if (G.powerT <= 0) { spawnPower(); G.powerT = rand(14, 22); }
  }

  // movimento + prese
  const catchers = getCatchers(now);
  const odt = dt * (G.powers.slow > 0 ? 0.45 : 1);
  const magnet = G.powers.magnet > 0;
  for (const o of G.objs) {
    o.age += dt;
    if (o.dying) { o.dying += dt; o.y -= V.H * 0.2 * dt; if (o.dying > 0.35) o.dead = true; continue; }
    if (!o.custom) {
      if (magnet && catchers.length && o.kind === 'item' && !o.avoid && (!M.learn || o.bonus || M.isGood(o, G))) {
        let best = null, bd = V.MIN * 0.55;
        for (const c of catchers) { const d = Math.hypot(c.x - o.x, c.y - o.y); if (d < bd) { bd = d; best = c; } }
        if (best) { const k = V.MIN * 4 * odt / Math.max(bd, 1); o.vx += (best.x - o.x) * k; o.vy += (best.y - o.y) * k; o.vx *= 0.96; o.vy *= 0.96; }
      }
      o.vy += o.g * odt; o.x += o.vx * odt; o.y += o.vy * odt; o.rot += o.vr * odt;
    }
    if (o.rej > 0) o.rej -= dt;
    if (o.x > o.r && o.x < V.W - o.r) o.entered = true;
    if (o.bounce && o.entered) {
      if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); }
      if (o.x > V.W - o.r) { o.x = V.W - o.r; o.vx = -Math.abs(o.vx); }
    }
    if (o.rej <= 0 && !o.dead) {
      for (const c of catchers) {
        if (distSeg(o.x, o.y, c.px, c.py, c.x, c.y) < o.r + c.r) { onCatch(o, c); break; }
      }
    }
    if (!o.custom && (o.y > V.H + o.r * 2 || (o.entered && (o.x < -o.r * 3 || o.x > V.W + o.r * 3)) || o.age > 20)) o.dead = true;
  }
  G.objs = G.objs.filter((o) => !o.dead);
  updateHUD();
}

// ---------- disegno ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  resize();
  updatePose(now);
  if (G.phase === 'play' && !G.paused) update(dt, now);
  else if (G.phase === 'ready') checkReady(dt, now);
  if (!G.paused) updateFX(dt);

  const inMenu = G.phase === 'menu';
  drawWorld(now, G.paused ? 0 : dt, inMenu);
  if (!inMenu) {
    ctx.save();
    if (FX.shake > 0) ctx.translate(rand(-1, 1) * FX.shake * 10 * V.DPR, rand(-1, 1) * FX.shake * 10 * V.DPR);
    if (S.showCam && cam.on) drawCamBox(innerWidth <= 420 && M.learn && G.phase !== 'ready' ? 80 * V.DPR : 0);
    const act = activePlayers(now);
    act.forEach((p) => drawPenny(ctx, p.SP, p.i === 0 ? P.look : P2_LOOK, {
      t: now, expr: p.expr.t > 0 ? p.expr.type : '', blink: p.blink > 0, superMode: superMode(),
      ring: S.players > 1 ? (p.i === 0 ? '#3fc7ff' : '#ff9f2e') : null,
    }));
    const helper = A().helper && M.learn && G.task ? (o) => o.kind !== 'power' && o.kind !== 'pinata' && !o.bonus && M.isGood(o, G) : null;
    drawObjects(G.objs, now, helper);
    const base = catchRadius() * (G.powers.giant > 0 ? 1.8 : 1);
    drawHands(act, { r: base, frozen: G.frozen > 0 && G.phase === 'play', mode2: S.catchMode === 'mani', superMode: superMode(), t: now });
    if (pointer.active && G.phase !== 'ready') drawPointer(pointer, base);
    ctx.restore();
  }
  drawFX();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- flusso ----------
async function lockScreen() {
  try { if ('wakeLock' in navigator && !lockScreen.l) { lockScreen.l = await navigator.wakeLock.request('screen'); lockScreen.l.addEventListener('release', () => { lockScreen.l = null; }); } } catch (e) { /* ignora */ }
}

async function goReady() {
  audio();
  M = MODE_IMPL[S.mode] || MODE_IMPL.punti;
  say(S.players > 1 ? 'Ciao! Sono Penny! Mettetevi uno accanto all’altro e alzate le mani!' : 'Ciao! Sono Penny! Alza le mani per iniziare!');
  hideScreens(); show('#ready');
  G.phase = 'ready'; G.readyHold = 0; G.session++; G.finger = false;
  setWorld(0, true);
  const s = G.session;
  $('#readyTitle').textContent = S.players > 1 ? 'Alzate le mani! 🙌' : 'Alza le mani! 🙌';
  $('#readyMsg').textContent = 'Sto accendendo la telecamera magica… ✨';
  $('#readyFill').style.width = '0%';
  hide('#btnFinger');
  lockScreen();
  try { await startCamera(); }
  catch (e) {
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
    await setNumPoses(S.players);
    if (s !== G.session) return;
    $('#readyMsg').textContent = 'Fatti vedere: mettiti davanti al telefono 👣';
  } catch (e) {
    if (s !== G.session) return;
    $('#readyMsg').textContent = 'Non riesco a caricare il riconoscimento. Controlla internet, oppure gioca col dito.';
    show('#btnFinger');
  }
}
function checkReady(dt, now) {
  const act = activePlayers(now);
  if (!act.length) {
    G.readyHold = Math.max(0, G.readyHold - dt);
    if (hasLandmarker()) $('#readyMsg').textContent = 'Non ti vedo ancora: mettiti davanti al telefono 👀';
  } else {
    const up = act.some((p) => { const g = gesture(p); return g && g.up; });
    const who = S.players > 1 ? `Vedo ${act.length} giocator${act.length > 1 ? 'i' : 'e'}! ` : 'Ti vedo! ';
    if (up) { G.readyHold += dt; $('#readyMsg').textContent = `${who}Tieni su le mani… 🙌`; }
    else { G.readyHold = Math.max(0, G.readyHold - dt * 0.7); $('#readyMsg').textContent = `${who}Ora alza tutte e due le mani sopra la testa`; }
  }
  $('#readyFill').style.width = `${clamp(G.readyHold / 0.8, 0, 1) * 100}%`;
  if (G.readyHold >= 0.8) { SFX.go(); startGame(); }
}

function startGame() {
  audio();
  M = MODE_IMPL[S.mode] || MODE_IMPL.punti;
  G.session++;
  Object.assign(G, {
    score: 0, level: 1, levelPts: 0, round: 1, combo: 0, comboBest: 0, coins: 0, catchCount: 0,
    usedWords: [], customUsed: false, tasksDone: 0, task: null, playTime: 0, lastPinata: -99,
    record: getRecord(), recordBeaten: false,
  });
  players.forEach((p) => { p.catches = 0; });
  G.roundTime = S.minutes * 60;
  ensureDaily();
  setWorld(0, true); musicRoot(WORLDS[0].root);
  if (M.learn) M.newTask(G);
  P.games = (P.games || 0) + 1; saveProfile();
  startRound();
}

async function startRound() {
  const s = ++G.session;
  Object.assign(G, { objs: [], elapsed: 0, spawnT: 0.8, needT: 0, hold: 0, lastTick: -1, paused: false, frozen: 0,
    event: null, eventT: rand(16, 22), powerT: rand(10, 16), roundStart: G.score, powers: { magnet: 0, slow: 0, giant: 0, rain: 0 } });
  hide('#eventCard');
  G.phase = 'intro';
  hideScreens(); show('#intro'); show('#hud'); hide('#btnPause');
  renderTaskBar(); updateHUD(true);
  if (S.music) musicStart(currentWorld().root);
  $('#introRound').textContent = S.rounds > 1 ? `Round ${G.round} di ${S.rounds}` : 'Si gioca!';
  const iw = $('#introWord'), ic = $('#introCount');
  ic.textContent = '';
  if (M.learn) {
    const an = M.announce(G, true);
    iw.innerHTML = an.html;
    say(`Round ${G.round}! ${an.say}`, { rate: 0.88 });
    await sleep(S.mode === 'parola' ? Math.min(9000, 3400 + G.task.seq.length * 600) : 3600);
  } else {
    const w = currentWorld();
    const how = S.catchMode === 'mani' ? 'Acchiappa con le due mani unite' : 'Acchiappa tutto quello che vola';
    const av = S.avoid && G.level >= A().avoidFrom;
    iw.innerHTML = `<span class="e">${w.e}</span><div class="w small">${w.name}</div><div class="l">${how}!<br>⭐ = 3 punti · 🧲🐢🦍🌈 = poteri${av ? `<br>Non toccare quelli col <b class="red">cerchio rosso</b>` : ''}</div>`;
    say(`Round ${G.round}! ${how}!${av ? ' Ma non toccare quelli col cerchio rosso!' : ''}`);
    await sleep(av ? 3400 : 2700);
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

function endRound() {
  G.phase = 'roundEnd';
  if (G.event) { endEvent(); }
  G.objs.forEach((o) => burst(o.x, o.y, o.color, 5)); G.objs = [];
  hide('#btnPause'); musicStop();
  const earned = Math.floor((G.score - G.roundStart) / 8);
  if (earned) { addCoins(earned); G.coins += earned; }
  stat('rounds');
  updateHUD(true);
  if (G.round >= S.rounds) { showPrize(); return; }
  SFX.level(); confetti(60);
  const n = S.rounds - G.round;
  $('#reTitle').textContent = `Round ${G.round} finito!`;
  $('#reText').innerHTML = `⭐ <b>${G.score}</b> punti · 🪙 +${earned}<br>${G.comboBest >= 5 ? `🔥 Combo migliore: ${G.comboBest}<br>` : ''}${n === 1 ? 'Manca 1 round al premio!' : `Mancano ${n} round al premio!`}`;
  say(`Round finito! Hai ${G.score} punti!`);
  hideScreens(); show('#roundEnd');
}

async function showPrize() {
  const s = ++G.session;
  G.phase = 'prize';
  hideScreens(); show('#prize'); hide('#taskBar'); hide('#eventCard');
  const { st, isNew } = drawSticker();
  const bonus = pick(BONUS);
  const rec = setRecord(G.score);
  if (!isNew) { addCoins(5); G.coins += 5; }
  const pe = $('#prizeEmoji'), pt = $('#prizeText');
  $('#prizeTop').textContent = 'HAI VINTO!';
  $('#prizeBonus').textContent = ''; $('#prizeNew').textContent = '';
  const two = S.players > 1 ? `<br><span class="p1">● Penny azzurra: ${players[0].catches}</span> · <span class="p2">● Penny arancione: ${players[1].catches}</span>` : '';
  $('#prizeScore').innerHTML = `⭐ ${G.score} punti · 🪙 +${G.coins}${rec ? '<br>🏆 Nuovo record!' : ''}${two}`;
  pt.textContent = 'Estrazione della figurina…';
  say('Hai vinto! Vediamo che figurina c’è…');
  for (let i = 0; i < 18; i++) {
    if (s !== G.session) return;
    pe.textContent = pick(STICKERS).e; SFX.roll();
    await sleep(70 + i * 9);
  }
  if (s !== G.session) return;
  pe.textContent = st.e; pt.textContent = st.t; $('#prizeBonus').textContent = bonus;
  $('#prizeNew').textContent = isNew ? '✨ Nuova figurina per l’album!' : 'Ce l’avevi già: +5 🪙';
  SFX.win(); confetti(220);
  say(`Hai vinto: ${st.t}! ${isNew ? 'È una figurina nuova!' : ''} ${bonus.replace('Bonus:', 'E in più:')}`, { rate: 0.92 });
}

function goMenu() {
  G.session++; G.phase = 'menu'; G.paused = false; G.objs = []; G.event = null;
  stopVoice(); musicStop(); clearBanners();
  stopCamera();
  if (lockScreen.l) { lockScreen.l.release().catch(() => {}); lockScreen.l = null; }
  hideScreens(); hide('#hud'); hide('#taskBar'); hide('#eventCard');
  showHome();
}
function pauseGame() {
  if (G.phase !== 'play' || G.paused) return;
  G.paused = true; show('#pause'); stopVoice(); musicStop();
}
function resumeGame() { G.paused = false; hide('#pause'); audio(); if (S.music) musicStart(currentWorld().root); }

// ---------- pulsanti ----------
const playFinger = () => { G.finger = true; audio(); say('Giochiamo col dito! Tocca gli oggetti!'); startGame(); G.finger = true; };
$('#btnStartNow').addEventListener('click', () => { SFX.go(); startGame(); });
$('#btnFinger').addEventListener('click', playFinger);
$('#btnFinger2').addEventListener('click', playFinger);
$('#btnNextRound').addEventListener('click', () => { audio(); G.round++; startRound(); });
$('#btnAgain').addEventListener('click', () => { audio(); if (cam.on || G.finger) { const f = G.finger; startGame(); G.finger = f; } else goReady(); });
$('#btnPrizeAlbum').addEventListener('click', () => { goMenu(); document.querySelector('[data-open="album"]').click(); });
$('#btnPause').addEventListener('click', pauseGame);
$('#btnResume').addEventListener('click', resumeGame);
$('#btnRestart').addEventListener('click', () => { hide('#pause'); const f = G.finger; startGame(); G.finger = f; });
document.querySelectorAll('[data-menu]').forEach((b) => b.addEventListener('click', goMenu));
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); else if (G.phase !== 'menu') lockScreen(); });

initUI({ onPlay: goReady });
showHome();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
export { LEARN_MODES };
