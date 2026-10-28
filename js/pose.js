// Telecamera + riconoscimento del corpo (MediaPipe Pose Landmarker), fino a 2 giocatori.
import { V, clamp } from './core.js';
import { S } from './store.js';
import { AGES, PENNY_SIZE } from './data.js';

const MP_VER = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const video = document.querySelector('#cam');
export const cam = { on: false, numPoses: 1 };
let stream = null, landmarker = null, loading = null, lastVideoTime = -1;

function mkPlayer(i) {
  return {
    i, SP: null, R: null, sw: 0, cx: 0, cy: 0, last: -1e9,
    NB: { k: 1, baseY: 0, last: -1e9 },
    prev: { L: null, R: null, B: null }, pulse: { L: 0, R: 0, B: 0, P: 0 },
    expr: { type: '', t: 0 }, blink: 0, nextBlink: 3, catches: 0, trail: [],
  };
}
export const players = [mkPlayer(0), mkPlayer(1)];
export const visible = (p, now) => !!p.SP && now - p.last < 500;
export const activePlayers = (now) => players.filter((p, i) => i < S.players && visible(p, now));
export const hasLandmarker = () => !!landmarker;

export async function loadPose() {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    const vision = await import(`${MP_BASE}/vision_bundle.mjs`);
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO', numPoses: 2,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    try { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch (e) { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
    cam.numPoses = 2;
    return landmarker;
  })();
  try { return await loading; } catch (e) { loading = null; throw e; }
}
export async function setNumPoses(n) {
  if (!landmarker || cam.numPoses === n) return;
  try { await landmarker.setOptions({ numPoses: n }); cam.numPoses = n; } catch (e) { /* lascia com'è */ }
}

export async function startCamera() {
  if (cam.on) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  cam.on = true;
}
export function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null; cam.on = false;
  players.forEach((p) => { p.SP = null; p.R = null; p.last = -1e9; });
}

function videoRect() {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const s = Math.max(V.W / vw, V.H / vh);
  return { vw, vh, s, ox: (V.W - vw * s) / 2, oy: (V.H - vh * s) / 2 };
}

function bodyFrame(raw) {
  const ls = raw[11], rs = raw[12];
  if (ls.v > 0.4 && rs.v > 0.4) return { cx: (ls.x + rs.x) / 2, cy: (ls.y + rs.y) / 2, sw: Math.hypot(ls.x - rs.x, ls.y - rs.y) };
  if (raw[7].v > 0.4 && raw[8].v > 0.4) {
    const ew = Math.hypot(raw[7].x - raw[8].x, raw[7].y - raw[8].y);
    return { cx: (raw[7].x + raw[8].x) / 2, cy: (raw[7].y + raw[8].y) / 2 + ew * 1.4, sw: ew * 2.3 };
  }
  return null;
}

export function updatePose(now) {
  if (!landmarker || !cam.on || video.readyState < 2) return;
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  let res;
  try { res = landmarker.detectForVideo(video, now); } catch (e) { return; }
  const list = (res && res.landmarks) || [];
  const r = videoRect();
  let bodies = list.map((lm) => {
    const raw = lm.map((p) => ({
      x: V.W - (r.ox + p.x * r.vw * r.s), // specchio
      y: r.oy + p.y * r.vh * r.s,
      v: p.visibility == null ? 1 : p.visibility,
    }));
    const f = bodyFrame(raw);
    return f && f.sw > 4 ? { raw, ...f } : null;
  }).filter(Boolean);
  if (!bodies.length) return;

  if (S.players < 2) bodies = [bodies.sort((a, b) => b.sw - a.sw)[0]]; // il più vicino
  else {
    bodies = bodies.slice(0, 2);
    const p0 = players[0], p1 = players[1];
    if (bodies.length === 2) {
      const known = visible(p0, now) && visible(p1, now);
      if (known) {
        const keep = Math.abs(bodies[0].cx - p0.cx) + Math.abs(bodies[1].cx - p1.cx);
        const swap = Math.abs(bodies[1].cx - p0.cx) + Math.abs(bodies[0].cx - p1.cx);
        if (swap < keep) bodies.reverse();
      } else bodies.sort((a, b) => a.cx - b.cx); // sinistra = giocatore 1
    } else if (bodies.length === 1) {
      const b = bodies[0];
      const d0 = visible(p0, now) ? Math.abs(b.cx - p0.cx) : 1e9, d1 = visible(p1, now) ? Math.abs(b.cx - p1.cx) : 1e9;
      if (d1 < d0) bodies = [null, b];
    }
  }
  bodies.forEach((b, i) => { if (b) updatePlayer(players[i], b, now); });
}

const REACH = 1.3;
const ARMS = [[11, [13, 15, 17, 19, 21]], [12, [14, 16, 18, 20, 22]]];
function updatePlayer(p, b, now) {
  const { raw, cx, cy, sw } = b;
  const fresh = now - p.last > 600;
  // punti "veri" smussati poco: servono per riconoscere i gesti
  if (fresh || !p.R) { p.R = raw.map((q) => ({ ...q })); p.sw = sw; p.cx = cx; p.cy = cy; }
  else {
    for (let i = 0; i < raw.length; i++) { const a = p.R[i], q = raw[i]; a.x += (q.x - a.x) * 0.6; a.y += (q.y - a.y) * 0.6; a.v += (q.v - a.v) * 0.5; }
    p.sw += (sw - p.sw) * 0.3; p.cx += (cx - p.cx) * 0.6; p.cy += (cy - p.cy) * 0.6;
  }
  const pts = normalize(p, raw, cx, cy, sw, now);
  if (fresh || !p.SP) p.SP = pts;
  else {
    for (let i = 0; i < pts.length; i++) {
      const a = p.SP[i], q = pts[i];
      const d = Math.hypot(q.x - a.x, q.y - a.y);
      const k = clamp(d / (V.MIN * 0.03), 0.55, 0.95);
      a.x += (q.x - a.x) * k; a.y += (q.y - a.y) * k; a.v += (q.v - a.v) * 0.5;
    }
  }
  p.last = now;
}

// Penny segue il corpo; se chi gioca è troppo vicino viene rimpicciolita (mai ingrandita)
// e il movimento laterale viene amplificato. Braccia un po' elastiche.
function normalize(p, raw, cx, cy, sw, now) {
  const NB = p.NB;
  const target = V.MIN * (PENNY_SIZE[S.pennySize] || PENNY_SIZE.media) * (S.players > 1 ? 0.72 : 1);
  const k = Math.min(1, target / sw);
  if (now - NB.last > 800) { NB.k = k; NB.baseY = cy; }
  else { NB.k += (k - NB.k) * 0.08; if (!NB.freeze) NB.baseY += (cy - NB.baseY) * 0.02; }
  NB.last = now;
  const z = NB.k, shrink = 1 - z;
  const gain = clamp(1 + (1 / z - 1) * 0.45, 1, 2);
  const ax = V.W / 2 + (cx - V.W / 2) * gain;
  const ay = cy * z + (V.H * 0.5 + (cy - NB.baseY) * 1.3) * shrink;
  const out = raw.map((q) => ({ x: ax + (q.x - cx) * z, y: ay + (q.y - cy) * z, v: q.v }));
  for (const [sh, ids] of ARMS) {
    const o = out[sh];
    for (const i of ids) { out[i].x = o.x + (out[i].x - o.x) * REACH; out[i].y = o.y + (out[i].y - o.y) * REACH; }
  }
  const xs = out.filter((q) => q.v > 0.4).map((q) => q.x);
  if (xs.length) {
    const lo = Math.min(...xs), hi = Math.max(...xs), m = V.MIN * 0.03;
    const dx = lo < m ? m - lo : hi > V.W - m ? (V.W - m) - hi : 0;
    if (dx && hi - lo < V.W - 2 * m) out.forEach((q) => { q.x += dx; });
  }
  return out;
}

export function handPoint(p, side) {
  if (!p.SP) return null;
  const [w, i, k] = side === 'L' ? [15, 19, 17] : [16, 20, 18];
  const Wr = p.SP[w];
  if (Wr.v < 0.35) return null;
  const I = p.SP[i], K = p.SP[k];
  if (I.v > 0.25 && K.v > 0.25) {
    const mx = (I.x + K.x) / 2, my = (I.y + K.y) / 2;
    return { x: Wr.x + (mx - Wr.x) * 0.9, y: Wr.y + (my - Wr.y) * 0.9 };
  }
  return { x: Wr.x, y: Wr.y };
}
export function catchRadius() { return AGES[S.age].catchR * V.MIN * (S.players > 1 ? 0.9 : 1); }
export function handsTogether(p, rad) {
  const l = handPoint(p, 'L'), r = handPoint(p, 'R');
  if (!l || !r) return null;
  return Math.hypot(l.x - r.x, l.y - r.y) < rad * 2.6 ? { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 } : null;
}

// ---------- gesti (sui punti veri, in proporzione alla larghezza delle spalle) ----------
export function gesture(p) {
  const R = p.R; if (!R) return null;
  const sw = p.sw, ok = (i) => R[i].v > 0.4;
  const nose = R[0], lw = R[15], rw = R[16], ls = R[11], rs = R[12];
  const head = ok(7) && ok(8) ? { x: (R[7].x + R[8].x) / 2, y: (R[7].y + R[8].y) / 2 } : nose;
  const handsOk = ok(15) && ok(16);
  const handDist = handsOk ? Math.hypot(lw.x - rw.x, lw.y - rw.y) / sw : 9;
  return {
    sw, cy: p.cy,
    up: handsOk && ok(0) && lw.y < nose.y - 0.2 * sw && rw.y < nose.y - 0.2 * sw,
    head: handsOk && Math.hypot(lw.x - head.x, lw.y - head.y) < 1.0 * sw && Math.hypot(rw.x - head.x, rw.y - head.y) < 1.0 * sw && lw.y < ls.y && rw.y < rs.y,
    plane: handsOk && ok(11) && ok(12) && Math.abs(lw.y - ls.y) < 0.6 * sw && Math.abs(rw.y - rs.y) < 0.6 * sw && Math.abs(lw.x - rw.x) > 2.4 * sw,
    handDist,
  };
}
