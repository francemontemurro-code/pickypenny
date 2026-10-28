// Menu: home, impostazioni della partita, album delle figurine, guardaroba di Penny, sfide del giorno e record.
import { $, show, hide, hideScreens, cleanWord, clamp } from './core.js';
import { MODES, MINUTES, STICKERS, OUTFIT, MISSION_REWARD, AGES } from './data.js';
import { S, P, saveSettings, isOwned, buy, wear, stickerCount, ensureDaily, missionDef, streakDays } from './store.js';
import { audio, SFX, say } from './audio.js';
import { drawPenny, demoPose } from './draw.js';

let onPlay = () => {};
let current = 'home';

// ---------- anteprime di Penny ----------
const previews = [];
function previewLoop(t) {
  for (const pv of previews) {
    if (pv.el.offsetParent === null) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = pv.el.clientWidth, h = pv.el.clientHeight;
    if (pv.el.width !== Math.round(w * dpr)) { pv.el.width = Math.round(w * dpr); pv.el.height = Math.round(h * dpr); }
    const c = pv.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const pts = demoPose(w, h * 0.95, t);
    drawPenny(c, pts, P.look, { t, dpr: 1, min: Math.min(w, h), noShadow: false, expr: pv.expr && pv.expr > t ? 'happy' : '', blink: (t % 4000) < 130 });
  }
  requestAnimationFrame(previewLoop);
}
function addPreview(sel) { const el = $(sel); previews.push({ el, ctx: el.getContext('2d'), expr: 0 }); }

function open(screen) {
  current = screen;
  hideScreens(); show(`#${screen}`);
  if (screen === 'home') renderHome();
  if (screen === 'setup') refreshSetup();
  if (screen === 'album') renderAlbum();
  if (screen === 'wardrobe') renderWardrobe();
  if (screen === 'challenges') renderChallenges();
  const sc = $(`#${screen}`); if (sc) sc.scrollTop = 0;
}
export function showHome() { open('home'); }

// ---------- home ----------
function renderHome() {
  const d = ensureDaily();
  document.querySelectorAll('.coins').forEach((el) => { el.textContent = `🪙 ${P.coins}`; });
  const st = streakDays();
  $('#homeStreak').textContent = `🔥 ${st} ${st === 1 ? 'giorno' : 'giorni'}`;
  $('#homeStreak').classList.toggle('hidden', st === 0);
  $('#homeAlbumCount').textContent = `${stickerCount()}/${STICKERS.length}`;
  const done = d.missions.filter((m) => m.done).length;
  $('#homeChallCount').textContent = `${done}/3`;
  $('#homeChallBtn').classList.toggle('glow', done < 3);
}

// ---------- impostazioni partita ----------
function refreshSetup() {
  $('#modeGrid').innerHTML = MODES.map((m) => `<button data-val="${m.id}" class="mode${S.mode === m.id ? ' on' : ''}"><span class="big">${m.e}</span><b>${m.name}</b><small>${m.desc}</small></button>`).join('');
  document.querySelectorAll('#setup [data-group]').forEach((g) => {
    const key = g.dataset.group;
    g.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(b.dataset.val) === String(S[key])));
  });
  $('#outMinutes').textContent = S.minutes === 0.5 ? '½' : S.minutes;
  $('#outRounds').textContent = S.rounds;
  $('#wordOpts').classList.toggle('hidden', S.mode !== 'parola');
  $('#customWord').classList.toggle('hidden', S.wordChoice !== 'custom');
  $('#customWord').value = S.customWord;
  $('#showCam').checked = !!S.showCam;
  $('#avoid').checked = !!S.avoid;
  $('#music').checked = !!S.music;
  $('#avoidRow').classList.toggle('hidden', S.mode !== 'punti');
}

// ---------- album ----------
function renderAlbum() {
  const n = stickerCount();
  $('#albumCount').textContent = `${n} / ${STICKERS.length}`;
  $('#albumBar').style.width = `${(n / STICKERS.length) * 100}%`;
  $('#albumGrid').innerHTML = STICKERS.map((s) => {
    const k = P.stickers[s.id] || 0;
    return `<div class="sticker${k ? '' : ' missing'}" title="${k ? s.t : '???'}">
      <div class="st-e">${s.e}</div><div class="st-n">${k ? s.n : '???'}</div>${k > 1 ? `<div class="st-x">×${k}</div>` : ''}</div>`;
  }).join('');
  $('#albumHint').textContent = n === STICKERS.length ? '🏆 Album completo! Sei un campione!' : 'Vinci le partite per trovare le figurine che mancano!';
}
$('#albumGrid').addEventListener('click', (e) => {
  const s = e.target.closest('.sticker'); if (!s || s.classList.contains('missing')) return;
  audio(); say(s.title);
});

// ---------- guardaroba ----------
let tab = 'hat';
function renderWardrobe() {
  document.querySelectorAll('.coins').forEach((el) => { el.textContent = `🪙 ${P.coins}`; });
  $('#wardTabs').innerHTML = Object.entries(OUTFIT).map(([k, v]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${v.label}</button>`).join('');
  $('#wardItems').innerHTML = OUTFIT[tab].items.map((it) => {
    const own = isOwned(tab, it.id), on = P.look[tab] === it.id;
    const sw = it.c ? `<span class="ward-sw" style="background:${it.c === 'rainbow' ? 'linear-gradient(90deg,#ff4b4b,#ffd23f,#3ee6b5,#3fc7ff,#9b5cff)' : it.c === 'galaxy' ? 'linear-gradient(135deg,#2a0f6e,#6b2bd9,#ff5fa2)' : it.c || 'transparent'}">${it.c ? '' : '🚫'}</span>` : `<span class="ward-e">${it.e}</span>`;
    const tag = on ? '<em class="worn">Indossato</em>' : own ? '<em>Indossa</em>' : `<em class="price${P.coins >= it.price ? '' : ' poor'}">🪙 ${it.price}</em>`;
    return `<button class="ward-item${on ? ' on' : ''}${own ? '' : ' locked'}" data-id="${it.id}">${sw}<b>${it.n}</b>${tag}</button>`;
  }).join('');
}
$('#wardTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; renderWardrobe(); });
$('#wardItems').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  audio();
  const id = b.dataset.id;
  if (isOwned(tab, id)) { wear(tab, id); SFX.catch(); previews.forEach((p) => { p.expr = performance.now() + 900; }); }
  else {
    const it = OUTFIT[tab].items.find((x) => x.id === id);
    if (buy(tab, id)) { SFX.buy(); say(`Evviva! ${it.n}!`); previews.forEach((p) => { p.expr = performance.now() + 1500; }); }
    else { SFX.wrong(); say(`Servono ${it.price} monetine. Gioca per guadagnarne altre!`); }
  }
  renderWardrobe();
});

// ---------- sfide e record ----------
function renderChallenges() {
  const d = ensureDaily();
  const st = streakDays();
  $('#challStreak').innerHTML = st ? `🔥 <b>${st}</b> ${st === 1 ? 'giorno' : 'giorni'} di fila con tutte le sfide!` : 'Completa le 3 sfide di oggi per iniziare una serie di giorni 🔥';
  $('#challList').innerHTML = d.missions.map((m) => {
    const def = missionDef(m.id);
    const pct = clamp(m.progress / m.target, 0, 1) * 100;
    return `<div class="mission${m.done ? ' done' : ''}">
      <div class="m-e">${m.done ? '✅' : def.e}</div>
      <div class="m-body"><b>${def.text(m.target)}</b>
        <div class="m-bar"><i style="width:${pct}%"></i></div>
        <small>${m.done ? 'Fatto!' : `${m.progress} / ${m.target}`}</small></div>
      <div class="m-r">+${MISSION_REWARD}<br>🪙</div></div>`;
  }).join('');
  $('#challBonus').textContent = d.bonus ? '🎁 Hai già preso la figurina regalo di oggi! Torna domani per nuove sfide.' : '🎁 Completa tutte e 3 le sfide: figurina in regalo!';
  const modeName = Object.fromEntries(MODES.map((m) => [m.id, `${m.e} ${m.name}`]));
  const ageName = { mini: '3–4', small: '5–6', big: '7+' };
  const recs = Object.entries(P.records).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#recList').innerHTML = recs.length ? recs.map(([k, v]) => {
    const [mode, age, pl] = k.split('|');
    return `<div class="rec"><span>${modeName[mode] || mode}<small> · ${ageName[age] || age} anni${pl === '2' ? ' · 👥' : ''}</small></span><b>🏆 ${v}</b></div>`;
  }).join('') : '<p class="muted">Ancora nessun record: gioca una partita!</p>';
}

// ---------- collegamenti ----------
export function initUI(opts) {
  onPlay = opts.onPlay;
  addPreview('#homePenny'); addPreview('#wardPenny');
  requestAnimationFrame(previewLoop);
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { audio(); open(b.dataset.open); }));
  $('#modeGrid').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.mode = b.dataset.val; saveSettings(); refreshSetup();
  });
  document.querySelectorAll('#setup [data-group]').forEach((g) => {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const key = g.dataset.group;
      S[key] = key === 'players' ? +b.dataset.val : b.dataset.val; saveSettings(); refreshSetup();
      if (key === 'wordChoice' && b.dataset.val === 'custom') $('#customWord').focus();
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
  [['#showCam', 'showCam'], ['#avoid', 'avoid'], ['#music', 'music']].forEach(([sel, key]) => {
    $(sel).addEventListener('change', (e) => { S[key] = e.target.checked; saveSettings(); });
  });
  $('#btnPlay').addEventListener('click', () => {
    if (S.mode === 'parola' && S.wordChoice === 'custom' && cleanWord(S.customWord).length < 2) {
      $('#customWord').focus(); $('#customWord').placeholder = 'Scrivi una parola di almeno 2 lettere'; return;
    }
    onPlay();
  });
  $('#homePenny').addEventListener('click', () => { audio(); SFX.catch(); say('Ciao! Sono Penny! Giochiamo?'); previews.forEach((p) => { p.expr = performance.now() + 1200; }); });
}
export { AGES };
