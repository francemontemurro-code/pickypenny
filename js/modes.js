// Le modalità di gioco. Ognuna decide cosa cade, cosa è "giusto" e cosa mostrare nella barra in alto.
import { pick, shuffle, cleanWord, rand } from './core.js';
import { AGES, WORLDS, STAR, WORDS, LETTERS, COLORS, ANIMALS, COUNT_ITEMS, NUM_WORDS } from './data.js';
import { S } from './store.js';

const A = () => AGES[S.age];
const tokenColor = (s) => `hsl(${(s.charCodeAt(0) * 47 + s.length * 90) % 360} 85% 55%)`;
function tiles(seq, idx) {
  const MAX = 8; // con tanti numeri mostro solo una finestra attorno a quello da prendere
  const start = seq.length > MAX ? clampN(idx - 2, 0, seq.length - MAX) : 0;
  const end = seq.length > MAX ? start + MAX : seq.length;
  let h = start > 0 ? '<div class="tile more">…</div>' : '';
  for (let i = start; i < end; i++) h += `<div class="tile${i < idx ? ' done' : i === idx ? ' next' : ''}">${seq[i]}</div>`;
  if (end < seq.length) h += '<div class="tile more">…</div>';
  return h;
}
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const dots = (n, k, e) => Array.from({ length: n }, (_, i) => `<span class="dot${i < k ? ' on' : ''}">${i < k ? e : ''}</span>`).join('');
export function countPhrase(n, it) { return n === 1 ? `${it.f ? 'una' : 'un'} ${it.s}` : `${NUM_WORDS[n] || n} ${it.p}`; }

// ---------- Acchiappa tutto ----------
const punti = {
  learn: false,
  spawn(o, G, force, world) {
    const a = A();
    const flash = G.event && G.event.type === 'flash' ? G.event.def.id : '';
    let pAvoid = S.avoid && G.level >= a.avoidFrom ? Math.min(0.32, a.avoidProb + 0.02 * (G.level - a.avoidFrom)) : 0;
    if (flash === 'dodge') pAvoid = Math.max(pAvoid, 0.35);
    const pStar = flash === 'stars' ? 0.35 : 0.09;
    const roll = Math.random();
    if (roll < pAvoid) { o.emoji = pick(world.avoid); o.avoid = true; o.pts = 0; o.r *= 1.05; }
    else if (roll < pAvoid + pStar) { o.emoji = STAR; o.star = true; o.pts = 3; o.r *= 0.85; o.fast = 1.25; }
    else { o.emoji = pick(world.items); o.pts = 1; }
  },
};

// ---------- sequenze: parola e numeri ----------
function seqMode(kind) {
  return {
    learn: true, seq: true,
    newTask(G) {
      const a = A();
      if (kind === 'parola') {
        const custom = cleanWord(S.customWord);
        let w, e;
        if (S.wordChoice === 'custom' && custom.length >= 2 && !G.customUsed) { w = custom; e = '✏️'; G.customUsed = true; }
        else {
          const maxL = Math.min(8, a.maxLen + Math.floor((G.level - 1) / 2));
          let pool = WORDS.filter(([x]) => x.length >= Math.min(a.minLen, maxL) && x.length <= maxL && !G.usedWords.includes(x));
          if (!pool.length) { G.usedWords = []; pool = WORDS.filter(([x]) => x.length <= maxL); }
          [w, e] = pick(pool); G.usedWords.push(w);
        }
        G.task = { seq: w.split(''), idx: 0, title: w, emoji: e };
      } else {
        const base = { mini: 3, small: 5, big: 6 }[S.age] || 3;
        const n = Math.min(a.numMax, base + (G.level - 1));
        G.task = { seq: Array.from({ length: n }, (_, i) => String(i + 1)), idx: 0, title: `1 → ${n}`, emoji: '🔢' };
      }
    },
    announce(G, intro) {
      const t = G.task;
      if (kind === 'parola') {
        const rest = t.seq.slice(t.idx).join(', ');
        return { html: `<span class="e">${t.emoji}</span><div class="w${t.title.length > 7 ? ' long' : ''}">${t.title}</div><div class="l">Prendi le lettere in ordine!</div>`,
          banner: `${t.emoji} ${t.title}<small>Prendi le lettere in ordine</small>`,
          say: `${intro ? 'La parola è' : 'Ora prendi'}: ${t.title.toLowerCase()}. Le lettere sono: ${rest}.` };
      }
      const n = t.seq.length;
      return { html: `<span class="e">🔢</span><div class="w">1 … ${n}</div><div class="l">Prendi i numeri in ordine!</div>`,
        banner: `🔢 Da 1 a ${n}<small>Prendi i numeri in ordine</small>`,
        say: `Prendi i numeri in ordine, da uno a ${NUM_WORDS[n] || n}!` };
    },
    bar(G) { return `<span class="tb-emoji">${G.task.emoji}</span><div class="tiles">${tiles(G.task.seq, G.task.idx)}</div>`; },
    isGood(o, G) { return o.kind === 'token' && o.label === G.task.seq[G.task.idx]; },
    spawn(o, G, force) {
      const t = G.task, need = t.seq[t.idx];
      let label = need;
      if (!force && Math.random() > A().rightProb) {
        const pool = kind === 'parola'
          ? (LETTERS + t.seq.join('')).split('').filter((c) => c !== need)
          : t.seq.concat([String(t.seq.length + 1)]).filter((c) => c !== need);
        label = pick(pool);
      }
      o.kind = 'token'; o.label = label; o.color = tokenColor(label); o.r *= 1.08; o.rot = rand(-0.12, 0.12); o.vr = 0; // dritti: 6 e 9 non si confondono
      return label === need;
    },
    onGood(o, G) {
      G.task.idx++;
      return { say: kind === 'parola' ? o.label.toLowerCase() : (NUM_WORDS[+o.label] || o.label), done: G.task.idx >= G.task.seq.length,
        doneSay: kind === 'parola' ? `Bravissimo! ${G.task.title.toLowerCase()}!` : 'Bravissimo! Tutti i numeri!',
        doneBanner: kind === 'parola' ? `${G.task.emoji} ${G.task.title}!<small>Parola completata!</small>` : '🔢 Fatto!<small>Tutti i numeri in ordine!</small>' };
    },
  };
}

// ---------- colori ----------
const colori = {
  learn: true,
  newTask(G) {
    const prev = G.task && G.task.color;
    const c = pick(COLORS.filter((x) => x !== prev));
    G.task = { color: c, got: 0, need: { mini: 4, small: 6, big: 8 }[S.age] || 5 };
  },
  announce(G) {
    const c = G.task.color;
    return { html: `<span class="swatch big" style="background:${c.hex}"></span><div class="w" style="color:${c.hex}">${c.name}</div><div class="l">Prendi solo le cose ${c.name.toLowerCase()}!</div>`,
      banner: `<span class="swatch" style="background:${c.hex}"></span> Cose ${c.name}<small>Prendi solo questo colore</small>`,
      say: `Prendi solo le cose ${c.name.toLowerCase()}!` };
  },
  bar(G) { const c = G.task.color; return `<span class="swatch" style="background:${c.hex}"></span><b class="tb-text">${c.name}</b><div class="dots">${dots(G.task.need, G.task.got, '✓')}</div>`; },
  isGood(o, G) { return G.task.color.items.includes(o.emoji); },
  spawn(o, G, force) {
    const good = force || Math.random() < A().rightProb;
    o.emoji = good ? pick(G.task.color.items) : pick(pick(COLORS.filter((x) => x !== G.task.color)).items);
    return good;
  },
  onGood(o, G) {
    G.task.got++;
    return { say: '', done: G.task.got >= G.task.need, doneSay: `Bravissimo! Tutte le cose ${G.task.color.name.toLowerCase()}!`,
      doneBanner: `<span class="swatch" style="background:${G.task.color.hex}"></span> Bravo!<small>Colore completato</small>` };
  },
};

// ---------- versi degli animali ----------
const versi = {
  learn: true, levelEvery: 2,
  newTask(G) {
    const prev = G.task && G.task.animal;
    const pool = ANIMALS.slice(0, { mini: 8, small: 11, big: 14 }[S.age] || 8);
    G.task = { animal: pick(pool.filter((x) => x !== prev)), pool };
  },
  announce(G) {
    const an = G.task.animal;
    return { html: `<span class="e">🔊</span><div class="w${an.v.length > 7 ? ' long' : ''}">«${an.v}»</div><div class="l">Chi fa questo verso? Prendilo!</div>`,
      banner: `🔊 «${an.v}»<small>Chi fa questo verso?</small>`,
      say: `Chi fa ${an.v}?` };
  },
  bar(G) { return `<button class="tb-say" data-repeat="1">🔊</button><b class="tb-text">Chi fa «${G.task.animal.v}»?</b>`; },
  repeat(G) { return `Chi fa ${G.task.animal.v}?`; },
  isGood(o, G) { return o.emoji === G.task.animal.e; },
  spawn(o, G, force) {
    const good = force || Math.random() < A().rightProb * 0.8;
    o.emoji = good ? G.task.animal.e : pick(G.task.pool.filter((x) => x !== G.task.animal)).e;
    o.r *= 1.1;
    return good;
  },
  onGood(o, G) {
    const an = G.task.animal;
    return { say: '', done: true, doneSay: `Sì! È ${an.n}! ${an.v}!`, doneBanner: `${an.e} Sì!<small>È ${an.n}!</small>` };
  },
};

// ---------- conta ----------
const conta = {
  learn: true,
  newTask(G) {
    const [lo, hi] = A().count;
    const n = Math.min(hi, lo + Math.floor(Math.random() * (hi - lo + 1)) + Math.floor((G.level - 1) / 3));
    const prev = G.task && G.task.item;
    G.task = { item: pick(COUNT_ITEMS.filter((x) => x !== prev)), n, got: 0 };
  },
  announce(G) {
    const t = G.task;
    return { html: `<span class="e">${t.item.e}</span><div class="w">${t.n}</div><div class="l">Prendi ${countPhrase(t.n, t.item)}!</div>`,
      banner: `${t.item.e} × ${t.n}<small>Prendi ${countPhrase(t.n, t.item)}</small>`,
      say: `Prendi ${countPhrase(t.n, t.item)}!` };
  },
  bar(G) { const t = G.task; return `<span class="tb-emoji">${t.item.e}</span><div class="dots">${dots(t.n, t.got, t.item.e)}</div>`; },
  isGood(o, G) { return o.emoji === G.task.item.e; },
  spawn(o, G, force) {
    const good = force || Math.random() < A().rightProb;
    o.emoji = good ? G.task.item.e : pick(COUNT_ITEMS.filter((x) => x !== G.task.item)).e;
    return good;
  },
  onGood(o, G) {
    const t = G.task; t.got++;
    return { say: NUM_WORDS[t.got] || String(t.got), done: t.got >= t.n,
      doneSay: `Bravissimo! ${countPhrase(t.n, t.item)}!`, doneBanner: `${t.item.e} × ${t.n}<small>Contato giusto!</small>` };
  },
};

export const MODE_IMPL = { punti, parola: seqMode('parola'), numeri: seqMode('numeri'), colori, versi, conta };
export const worldFor = (level) => WORLDS[(level - 1) % WORLDS.length];
export { rand };
