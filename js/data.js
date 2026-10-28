// Tutti i contenuti del gioco: difficoltà, mondi, oggetti, modalità, figurine, vestiti, sfide.

export const AGES = {
  // penny = larghezza spalle massima di Penny (frazione del lato corto); avoidFrom = livello da cui compaiono gli oggetti da evitare
  mini:  { speed: 0.15, size: 0.08,  target: 8,  maxObj: 4, spawn: 1.6, catchR: 0.09,  rightProb: 0.6, needEvery: 2.0, minLen: 3, maxLen: 4, helper: true,  patterns: [0.75, 0.25, 0],  avoidFrom: 2, avoidProb: 0.14, sayTime: 9, numMax: 5,  count: [1, 4] },
  small: { speed: 0.21, size: 0.068, target: 12, maxObj: 6, spawn: 1.2, catchR: 0.076, rightProb: 0.5, needEvery: 2.6, minLen: 4, maxLen: 5, helper: false, patterns: [0.6, 0.3, 0.1], avoidFrom: 1, avoidProb: 0.2,  sayTime: 7, numMax: 10, count: [2, 7] },
  big:   { speed: 0.29, size: 0.058, target: 15, maxObj: 8, spawn: 0.9, catchR: 0.064, rightProb: 0.4, needEvery: 3.2, minLen: 5, maxLen: 6, helper: false, patterns: [0.5, 0.3, 0.2], avoidFrom: 1, avoidProb: 0.26, sayTime: 6, numMax: 15, count: [4, 10] },
};
export const MINUTES = [0.5, 1, 2, 3, 4, 5, 7, 10];
export const PENNY_SIZE = { piccola: 0.2, media: 0.28, grande: 0.38 };

export const MODES = [
  { id: 'punti',  e: '🍓', name: 'Acchiappa tutto', desc: 'Punti, mondi e sorprese' },
  { id: 'parola', e: '🔤', name: 'La parola',       desc: 'Lettere in ordine' },
  { id: 'numeri', e: '🔢', name: 'I numeri',        desc: '1, 2, 3… in ordine' },
  { id: 'colori', e: '🎨', name: 'I colori',        desc: 'Solo il colore giusto' },
  { id: 'versi',  e: '🐮', name: 'Chi fa muu?',     desc: 'Trova l’animale' },
  { id: 'conta',  e: '🍎', name: 'Conta!',          desc: 'Prendine quanti dice Penny' },
];
export const LEARN_MODES = ['parola', 'numeri', 'colori', 'versi', 'conta'];

export const STAR = '⭐';

// Un mondo nuovo a ogni livello
export const WORLDS = [
  { id: 'prato',   name: 'Il Prato',            e: '🌼', sky: ['#55c6ff', '#9fe3ff', '#d4f7c9'], hill: '#5cc96e', hill2: '#3fae57', deco: 'clouds',    dark: false,
    items: ['🍎', '🍓', '🍌', '🍒', '🦋', '🐞', '🌼', '🎈', '🐥'], avoid: ['🌵', '🦔', '🐝'], root: 60 },
  { id: 'mare',    name: 'Il Mare',             e: '🌊', sky: ['#0b4fa0', '#1585d6', '#43c9ec'], hill: '#f2d38b', hill2: '#e2b961', deco: 'bubbles',   dark: true,
    items: ['🐟', '🐠', '🐚', '🐙', '🐳', '🦭', '🐬', '🪸'], avoid: ['🦀', '🪼', '🦈'], root: 62 },
  { id: 'giungla', name: 'La Giungla',          e: '🌴', sky: ['#0f5a3a', '#1f8a4c', '#7bd36b'], hill: '#2f7a2f', hill2: '#215f22', deco: 'leaves',    dark: true,
    items: ['🍌', '🥥', '🦜', '🐒', '🍍', '🦋', '🌺', '🐘'], avoid: ['🐍', '🐊', '🌵'], root: 57 },
  { id: 'neve',    name: 'Il Polo Nord',        e: '❄️', sky: ['#7fb8ef', '#bfe0ff', '#f2f8ff'], hill: '#ffffff', hill2: '#dbe9f7', deco: 'snow',      dark: false,
    items: ['⛄', '🧤', '🎁', '🐧', '🍪', '🧣', '🦌', '🛷'], avoid: ['🧊', '🌨️', '🥶'], root: 64 },
  { id: 'dolci',   name: 'Il Paese dei Dolci',  e: '🍭', sky: ['#ff7ac0', '#ffb3dc', '#ffe3f1'], hill: '#ffd1e8', hill2: '#ff9fcb', deco: 'sprinkles', dark: false,
    items: ['🍭', '🍩', '🧁', '🍬', '🍫', '🍪', '🍦', '🎂'], avoid: ['🌶️', '🧅', '🥦'], root: 65 },
  { id: 'spazio',  name: 'Lo Spazio',           e: '🚀', sky: ['#05021a', '#1b0f52', '#3b1f8f'], hill: '#5b4a9e', hill2: '#3e3178', deco: 'stars',     dark: true,
    items: ['🪐', '🚀', '🛸', '🌙', '👽', '🌍', '🛰️', '👩‍🚀'], avoid: ['☄️', '👾', '🌑'], root: 55 },
];

export const POWERS = {
  magnet: { e: '🧲', name: 'Calamita',          dur: 6, say: 'Calamita! Gli oggetti vengono da te!' },
  slow:   { e: '🐢', name: 'Rallentatore',      dur: 6, say: 'Rallentatore! Tutto va pianissimo!' },
  giant:  { e: '🦍', name: 'Mani giganti',      dur: 7, say: 'Mani giganti!' },
  rain:   { e: '🌈', name: 'Pioggia di stelle', dur: 4, say: 'Pioggia di stelle!' },
};

export const COLORS = [
  { id: 'rosso',     name: 'ROSSE',     hex: '#ff3b3b', items: ['🍎', '🍓', '🍒', '🌹', '🚗', '🎈', '🍅', '❤️'] },
  { id: 'giallo',    name: 'GIALLE',    hex: '#ffd000', items: ['🍌', '🌻', '🐥', '🧀', '🌕', '🍋', '🚕', '💛'] },
  { id: 'verde',     name: 'VERDI',     hex: '#2ecc55', items: ['🍏', '🥦', '🐸', '🍀', '🥒', '🦖', '🌲', '💚'] },
  { id: 'blu',       name: 'BLU',       hex: '#2f7bff', items: ['🫐', '🐳', '🧢', '💙', '🚙', '🐋', '🦋', '👖'] },
  { id: 'arancione', name: 'ARANCIONI', hex: '#ff8c1a', items: ['🍊', '🥕', '🎃', '🦊', '🏀', '🍑', '🧡', '🦁'] },
  { id: 'viola',     name: 'VIOLA',     hex: '#9b4dff', items: ['🍇', '🍆', '🔮', '💜', '☂️', '👾', '🟣', '🪻'] },
];

export const ANIMALS = [
  { e: '🐮', n: 'la mucca',     v: 'muuu' },
  { e: '🐶', n: 'il cane',      v: 'bau bau' },
  { e: '🐱', n: 'il gatto',     v: 'miao' },
  { e: '🐑', n: 'la pecora',    v: 'beee' },
  { e: '🐓', n: 'il gallo',     v: 'chicchirichì' },
  { e: '🦆', n: 'la papera',    v: 'qua qua' },
  { e: '🐷', n: 'il maiale',    v: 'oinc oinc' },
  { e: '🦁', n: 'il leone',     v: 'roaar' },
  { e: '🐸', n: 'la rana',      v: 'cra cra' },
  { e: '🐴', n: 'il cavallo',   v: 'iiih' },
  { e: '🐝', n: "l'ape",        v: 'bzzz' },
  { e: '🐦', n: "l'uccellino",  v: 'cip cip' },
  { e: '🐺', n: 'il lupo',      v: 'auuuu' },
  { e: '🐍', n: 'il serpente',  v: 'sssss' },
];

export const COUNT_ITEMS = [
  { e: '🍎', s: 'mela',        p: 'mele',        f: true },
  { e: '🍌', s: 'banana',      p: 'banane',      f: true },
  { e: '🍓', s: 'fragola',     p: 'fragole',     f: true },
  { e: '🎈', s: 'palloncino',  p: 'palloncini',  f: false },
  { e: '🐟', s: 'pesciolino',  p: 'pesciolini',  f: false },
  { e: '🍪', s: 'biscotto',    p: 'biscotti',    f: false },
  { e: '🐥', s: 'pulcino',     p: 'pulcini',     f: false },
  { e: '🧁', s: 'tortina',     p: 'tortine',     f: true },
];
export const NUM_WORDS = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'];

export const WORDS = [
  ['SOLE', '☀️'], ['MELA', '🍎'], ['CANE', '🐶'], ['ORSO', '🐻'], ['LUNA', '🌙'], ['CASA', '🏠'],
  ['NAVE', '⛵'], ['TOPO', '🐭'], ['RANA', '🐸'], ['UOVO', '🥚'], ['FATA', '🧚'], ['MARE', '🌊'],
  ['PERA', '🍐'], ['APE', '🐝'], ['RE', '👑'], ['BUS', '🚌'],
  ['GATTO', '🐱'], ['FIORE', '🌸'], ['PESCE', '🐟'], ['PALLA', '⚽'], ['TRENO', '🚂'], ['TORTA', '🎂'],
  ['LEONE', '🦁'], ['MUCCA', '🐮'], ['PIZZA', '🍕'], ['RAZZO', '🚀'], ['ZEBRA', '🦓'], ['BIMBA', '👧'],
  ['STELLA', '⭐'], ['BANANA', '🍌'], ['GELATO', '🍦'], ['MAIALE', '🐷'], ['PANDA', '🐼'], ['NUVOLA', '☁️'],
  ['CAVALLO', '🐴'], ['CONIGLIO', '🐰'], ['PINGUINO', '🐧'], ['FARFALLA', '🦋'], ['ELEFANTE', '🐘'],
];
export const LETTERS = 'ABCDEFGILMNOPRSTUVZ';

// Figurine da collezionare: sono i premi
export const STICKERS = [
  { id: 'calzino',  e: '🧦', n: "Calzino d'Oro",       t: "Il Calzino d'Oro del Campione Acchiappatutto" },
  { id: 'banana',   e: '🍌', n: 'Banana Volante',      t: 'La Medaglia della Banana Volante' },
  { id: 'corona',   e: '👑', n: 'Re delle Pernacchie', t: 'La Corona del Re (o della Regina) delle Pernacchie' },
  { id: 'dino',     e: '🦖', n: 'Patente Dinosauro',   t: 'La patente ufficiale per guidare un dinosauro' },
  { id: 'pinguini', e: '🐧', n: 'Capo dei Pinguini',   t: 'Il titolo di Gran Capo dei Pinguini Ballerini' },
  { id: 'spaghetti',e: '🍝', n: 'Coppa Spaghettosa',   t: 'La Coppa Spaghettosa del Super Riflesso' },
  { id: 'luna',     e: '🚀', n: 'Biglietto Luna',      t: 'Un biglietto per la Luna (ritorno per cena incluso)' },
  { id: 'ninja',    e: '🥋', n: 'Ninja Polpetta',      t: 'Il Diploma di Ninja delle Polpette' },
  { id: 'unicorno', e: '🦄', n: 'Unicorno tascabile',  t: 'Un unicorno invisibile da tenere in tasca' },
  { id: 'cupcake',  e: '🧁', n: 'Cupcake Saltellante', t: 'Il Trofeo del Cupcake Saltellante' },
  { id: 'rana',     e: '🐸', n: 'Abbraccio Ranocchio', t: 'Un abbraccio speciale della Rana Ranocchia' },
  { id: 'cappello', e: '🎩', n: 'Cappello Magico',     t: 'Il cappello magico che fa sparire i broccoli (forse)' },
  { id: 'mantello', e: '🦸', n: 'Super Mantello',      t: 'Il mantello da Super Acchiappatore' },
  { id: 'lumaca',   e: '🐌', n: 'Lumaca da corsa',     t: 'Una lumaca da corsa super veloce' },
  { id: 'pozzanghera', e: '🥇', n: 'Re della Pozzanghera', t: 'La Medaglia di Campione del Mondo del Salto della Pozzanghera' },
  { id: 'pizza',    e: '🍕', n: 'Pizza Gigante',       t: 'La pizza immaginaria più grande dell’universo' },
  { id: 'drago',    e: '🐉', n: 'Drago delle Bolle',   t: 'Un drago cucciolo che fa le bolle di sapone' },
  { id: 'polpo',    e: '🐙', n: 'Polpo Abbracciatutto',t: 'Un polpo che dà otto abbracci contemporaneamente' },
  { id: 'razzo',    e: '🛸', n: 'Disco Volante',       t: 'Un disco volante per andare all’asilo' },
  { id: 'gelato',   e: '🍦', n: 'Gelato Infinito',     t: 'Il gelato che non finisce mai (e non cola)' },
  { id: 'tromba',   e: '🎺', n: 'Tromba del Risveglio',t: 'La tromba per svegliare i papà la domenica' },
  { id: 'scarpe',   e: '👟', n: 'Scarpe a Molla',      t: 'Le scarpe a molla per saltare fino al soffitto' },
  { id: 'arcobaleno', e: '🌈', n: 'Arcobaleno',        t: 'Un arcobaleno arrotolato da srotolare quando piove' },
  { id: 'tesoro',   e: '💎', n: 'Tesoro del Pirata',   t: 'Il tesoro segreto del Pirata Barbabanana' },
];
export const BONUS = [
  'Bonus: 10 secondi di solletico da chi ti guarda! 🤗',
  'Bonus: un balletto della vittoria tutti insieme! 💃',
  'Bonus: la prossima volta scegli tu il gioco! 🎲',
  'Bonus: un super batti cinque! ✋',
  'Bonus: fai la faccia più buffa che sai! 🤪',
  'Bonus: un bacio sul naso! 😘',
  'Bonus: urla «SONO UN CAMPIONE!» 📣',
  'Bonus: un abbraccio stritolone! 🫂',
];

// Guardaroba di Penny (prezzi in monetine 🪙)
export const OUTFIT = {
  hat: { label: 'Cappelli', items: [
    { id: 'none', e: '🚫', n: 'Niente', price: 0 },
    { id: 'fiocco', e: '🎀', n: 'Fiocco', price: 10 },
    { id: 'cappellino', e: '🧢', n: 'Cappellino', price: 15 },
    { id: 'paglia', e: '👒', n: 'Cappello di paglia', price: 20 },
    { id: 'elmetto', e: '⛑️', n: 'Elmetto', price: 20 },
    { id: 'cilindro', e: '🎩', n: 'Cilindro', price: 25 },
    { id: 'laurea', e: '🎓', n: 'Tocco da dottore', price: 30 },
    { id: 'corona', e: '👑', n: 'Corona', price: 45 },
  ] },
  glasses: { label: 'Occhiali', items: [
    { id: 'none', e: '🚫', n: 'Niente', price: 0 },
    { id: 'vista', e: '👓', n: 'Occhiali', price: 10 },
    { id: 'sole', e: '🕶️', n: 'Occhiali da sole', price: 15 },
    { id: 'maschera', e: '🥽', n: 'Maschera', price: 20 },
  ] },
  shirt: { label: 'Maglietta', items: [
    { id: 'rosa', c: '#ff5fa2', n: 'Rosa', price: 0 },
    { id: 'azzurro', c: '#3fc7ff', n: 'Azzurra', price: 10 },
    { id: 'verde', c: '#33d69f', n: 'Verde', price: 10 },
    { id: 'viola', c: '#9b5cff', n: 'Viola', price: 15 },
    { id: 'arancio', c: '#ff9f2e', n: 'Arancione', price: 15 },
    { id: 'rosso', c: '#ff4b4b', n: 'Rossa', price: 15 },
    { id: 'arcobaleno', c: 'rainbow', n: 'Arcobaleno', price: 50 },
  ] },
  cape: { label: 'Mantello', items: [
    { id: 'none', c: '', n: 'Niente', price: 0 },
    { id: 'rosso', c: '#e8344e', n: 'Rosso', price: 25 },
    { id: 'blu', c: '#3b6cff', n: 'Blu', price: 25 },
    { id: 'oro', c: '#ffc400', n: 'Oro', price: 45 },
    { id: 'galassia', c: 'galaxy', n: 'Galassia', price: 60 },
  ] },
  face: { label: 'Faccia', items: [
    { id: 'giallo', c: '#ffd23f', n: 'Gialla', price: 0 },
    { id: 'alieno', c: '#9be36b', n: 'Alieno verde', price: 20 },
    { id: 'cielo', c: '#8fd8ff', n: 'Azzurra', price: 20 },
    { id: 'confetto', c: '#ffb3d1', n: 'Rosa confetto', price: 20 },
    { id: 'lilla', c: '#c9a8ff', n: 'Lilla', price: 20 },
  ] },
};
export const DEFAULT_LOOK = { hat: 'none', glasses: 'none', shirt: 'rosa', cape: 'none', face: 'giallo' };
export const P2_LOOK = { hat: 'cappellino', glasses: 'none', shirt: 'arancio', cape: 'none', face: 'cielo' };

export const CHEERS = ['Wow!', 'Che riflessi!', 'Bravissimo!', 'Grande!', 'Fantastico!', 'Sei un fulmine!', 'Evvai!', 'Super!', 'Incredibile!', 'Che campione!'];

// "Penny dice": mini sfide di movimento controllate dalla telecamera
export const SAYS = [
  { id: 'salta', text: 'Salta!',                 e: '🦘', say: 'Penny dice: salta in alto!' },
  { id: 'giu',   text: 'Accucciati!',            e: '🐸', say: 'Penny dice: accucciati come una rana!' },
  { id: 'su',    text: 'Mani in alto!',          e: '🙌', say: 'Penny dice: mani in alto!' },
  { id: 'clap',  text: 'Batti le mani 3 volte!', e: '👏', say: 'Penny dice: batti le mani tre volte!' },
  { id: 'aereo', text: 'Fai l’aeroplano!',       e: '✈️', say: 'Penny dice: apri le braccia come un aeroplano!' },
  { id: 'testa', text: 'Mani sulla testa!',      e: '🙆', say: 'Penny dice: mani sulla testa!' },
];

// Sfide lampo durante "Acchiappa tutto"
export const FLASH = [
  { id: 'stars', text: 'Prendi 3 stelle!',            n: 3, time: 12, e: '⭐' },
  { id: 'any',   text: 'Prendi 8 cose in 10 secondi!',n: 8, time: 10, e: '⚡' },
  { id: 'dodge', text: 'Non toccare 🌵 per 10 secondi!', n: 0, time: 10, e: '🛡️', needAvoid: true },
];

// Sfide del giorno: 3 al giorno, scelte in base alla data
export const MISSIONS = [
  { id: 'catch',  stat: 'catch',     n: [30, 50, 70], text: (n) => `Acchiappa ${n} oggetti`,              e: '🍓' },
  { id: 'stars',  stat: 'stars',     n: [6, 10, 14],  text: (n) => `Prendi ${n} stelle`,                  e: '⭐' },
  { id: 'combo',  stat: 'comboMax',  n: [6, 10, 15],  text: (n) => `Fai una combo da ${n}`,               e: '🔥', max: true },
  { id: 'pinata', stat: 'pinata',    n: [1, 2, 3],    text: (n) => `Rompi ${n} pentolacc${n > 1 ? 'e' : 'a'}`, e: '🪅' },
  { id: 'power',  stat: 'power',     n: [2, 3, 4],    text: (n) => `Usa ${n} poteri speciali`,            e: '🧲' },
  { id: 'says',   stat: 'says',      n: [2, 3, 5],    text: (n) => `Fai ${n} volte quello che dice Penny`, e: '🙌' },
  { id: 'words',  stat: 'learnWin',  n: [3, 5, 8],    text: (n) => `Fai ${n} giusti nei giochi per imparare`, e: '🧠' },
  { id: 'world',  stat: 'worldMax',  n: [2, 3, 4],    text: (n) => `Arriva al ${n}° mondo`,                e: '🗺️', max: true },
  { id: 'rounds', stat: 'rounds',    n: [2, 3, 4],    text: (n) => `Gioca ${n} round`,                     e: '⏱️' },
  { id: 'flash',  stat: 'flash',     n: [1, 2, 3],    text: (n) => `Vinci ${n} sfid${n > 1 ? 'e' : 'a'} lampo`, e: '⚡' },
];
export const MISSION_REWARD = 15;
