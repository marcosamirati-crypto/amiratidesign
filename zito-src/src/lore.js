// Motor de regras de Survival or Dice. Cada constante cita a fonte da
// ZITO_UNIVERSE_BIBLE.md. Nada aqui é inventado: o que não existe nos
// documentos aparece como LACUNA para a interface tratar.

export const SRC = {
  RS: 'Regras do Sistema – RPG do Zito',
  RF: 'Survival or Dice – Regras Fechadas',
  RC: 'Survival or Dice – Resumo Compactado',
  SD: 'Survival or Dice (3)',
};

// §2.1 Atributos [SD p.1]
export const ATTRS = [
  { k: 'agi', name: 'Agilidade', short: 'Agi', covers: 'velocidade, destreza, flexibilidade' },
  { k: 'car', name: 'Carisma', short: 'Car', covers: 'lábia, intimidação, aparência' },
  { k: 'for', name: 'Força', short: 'For', covers: 'levantar, carregar, esmagar' },
  { k: 'fm', name: 'Força Mental', short: 'FM', covers: 'resiliência, vontade, perseverança' },
  { k: 'int', name: 'Inteligência', short: 'Int', covers: 'sabedoria, intuição, mentalidade' },
  { k: 'per', name: 'Percepção', short: 'Per', covers: 'sentidos, nuances, reação' },
  { k: 'res', name: 'Resistência', short: 'Res', covers: 'vigor, constituição, fundação' },
];
export const ATTR_NAME = Object.fromEntries(ATTRS.map(a => [a.k, a.name]));

// §2.1 Distribuição fixa e travada [RS p.1]
export const BASE_SPREAD = [9, 7, 5, 5, 5, 5, 3];
export const POINTS_PER_LEVEL = 8; // [RS p.1, RF p.1]
export const totalPoints = level => 39 + POINTS_PER_LEVEL * level;

// §2.2 Derivados [RS p.1, SD p.1]
export function derive(a, opts = {}) {
  const creature = !!opts.creature;
  const r = {
    ataque: a.agi + a.for,
    mira: a.int + a.per,
    esquiva: creature ? a.agi + a.res : a.agi + a.per,
    bloqueio: a.res + a.for,
    contra: a.res,
    bemEstar: a.res + a.fm,
    vida: (creature ? 3 : 2) * a.res,
    sanidade: 2 * a.fm,
  };
  return r;
}
export const DERIVED = [
  { k: 'ataque', name: 'Ataque', f: 'Agi + For', note: 'corpo a corpo' },
  { k: 'mira', name: 'Mira', f: 'Int + Per', note: 'à distância' },
  { k: 'esquiva', name: 'Esquiva', f: 'Agi + Per', note: 'evita e move 1 quadrado' },
  { k: 'bloqueio', name: 'Bloqueio', f: 'Res + For', note: 'fica no quadrado' },
  { k: 'contra', name: 'Contra-Ataque', f: 'Res', note: 'se o oponente errar, ataca com vantagem' },
];

// §2.3 Carga confortável [RS p.1]
export const carga = forca => 20 + 2 * (forca - 5);

// §7 Deslocamento [RF p.3]
export const RACE_BASE = { Humano: 5 };
export function deslocamento(agi, base = 5) {
  const extra = agi > 5 ? Math.floor((agi - 5) / 2) : 0;
  return base + extra;
}
export const TERRAIN = [
  { k: 'normal', name: 'Normal', cost: 1 },
  { k: 'dificil', name: 'Difícil', cost: 1.5 },
  { k: 'muito', name: 'Muito difícil', cost: 2 },
  { k: 'extremo', name: 'Extremamente difícil', cost: 3 },
];
// Correr dobra; em terreno difícil soma só metade [RF p.4]
export function moveBudget(desloc, terrainKey, running) {
  const t = TERRAIN.find(x => x.k === terrainKey) || TERRAIN[0];
  let pts = desloc;
  if (running) pts = t.k === 'normal' ? desloc * 2 : desloc * 1.5;
  return { pts, squares: Math.floor(pts / t.cost), cost: t.cost };
}

// §3 Dados. Tiers da reserva [SD p.1]
export const TIERS = ['d6', 'd8', 'd10', 'd12', 'd20'];
export const SIDES = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };
// Reserva total por level: 5D6 no L1, +1 dado por level, grupos de 5 [RS p.1, SD p.1]
export function reserveFor(level) {
  const total = 5 + Math.max(0, level - 1);
  const out = {};
  let left = total;
  for (const t of TIERS) {
    if (left <= 0) break;
    const n = Math.min(5, left);
    out[t] = n;
    left -= n;
  }
  return out; // ex.: L3 -> {d6:5, d8:2}
}
// DA = grupo mais alto que o personagem tem [RF p.1]
export function daFor(level) {
  const r = reserveFor(level);
  const owned = TIERS.filter(t => r[t] > 0);
  return owned[owned.length - 1];
}
export const AVG2 = { d4: 5, d6: 7, d8: 9, d10: 11, d12: 13, d20: 21 }; // [RS p.2]

// §4 Dificuldade [RF p.1]
export const DIFF_BASE = { 1: 14, 2: 17, 3: 18, 4: 19, 5: 20, 6: 21, 7: 25 };
export const DIFF_STEPS = [
  { k: 0, name: 'Rotina' },
  { k: 1, name: 'Apertado' },
  { k: 2, name: 'Difícil' },
  { k: 3, name: 'Extremo' },
  { k: 4, name: 'Quase impossível' },
];
export function difficulty(level, step) {
  const base = DIFF_BASE[level];
  if (base == null) return null; // LACUNA acima do level 7
  return base + 4 * step; // "cerca de 4 por degrau"
}

// §6 XP acumulado [RF p.3]
export const XP_TABLE = { 1: 0, 2: 100, 3: 250, 4: 450, 5: 700, 6: 1000, 7: 1350, 8: 1750, 9: 2200, 10: 3100, 11: 4900, 12: 8500, 13: 15700, 14: 30100 };
export function levelForXp(xp) {
  let lv = 1;
  for (const [l, v] of Object.entries(XP_TABLE)) if (xp >= v) lv = +l;
  return lv;
}
export function xpProgress(xp) {
  const lv = levelForXp(xp);
  const cur = XP_TABLE[lv];
  const next = XP_TABLE[lv + 1];
  return { lv, cur, next, pct: next == null ? 1 : (xp - cur) / (next - cur) };
}

// §8 Perícias [RS p.2]
export const PERICIA_BONUS = { 1: 5, 2: 10, 3: 15 };
export const PERICIA_EXAMPLES = [
  { name: 'Boxe', note: 'tira a penalidade de lutar de mãos vazias; o soco vai de D4 para D6' },
  { name: 'Nadar', note: 'evita o afogamento' },
  { name: 'Usar machado', note: 'perícia de profissão' },
  { name: 'Trespassar', note: 'limitante: um aprimoramento a cada 5 levels', limit: true },
];
// Habilidades: 2 por level ímpar; L1 = 1 passiva + 1 ativa (3 a 5 usos/dia) [RS p.3]
export const habilidadesAte = level => 2 * Math.ceil(level / 2);

// §5 Sorte [RF p.2-3]
export function luck(sorte, roll) {
  if (roll === 1) return { kind: 'critica', good: true, margin: sorte - 1, label: 'Sorte crítica', effect: 'Evento extraordinário. O Mestre dá vantagem 2, 3 ou algo além.' };
  if (roll === 100 && sorte !== 100) return { kind: 'critica', good: false, margin: 100 - sorte, label: 'Azar crítico', effect: 'Evento extraordinário contra você.' };
  const margin = Math.abs(sorte - roll);
  const good = roll < sorte;
  if (margin === 0) return { kind: 'lacuna', good: null, margin, label: 'Exatamente a Sorte', effect: 'A regra não define margem zero. Decisão do Mestre.' };
  let tier;
  if (margin < 20) tier = good ? 'Bônus fixo pequeno (+2 ou +3)' : 'Penalidade pequena (−2 ou −3)';
  else if (margin < 40) tier = good ? 'Vantagem 1: um dado extra da reserva, grátis' : 'Perde um dado da reserva';
  else if (margin < 60) tier = good ? 'Vantagem 2: rola duas vezes e fica com o melhor' : 'Rola duas vezes e fica com o pior';
  else tier = good ? 'Vantagem 3: rola duas vezes e ganha o dado grátis' : 'Azar 3: rola duas vezes, fica com o pior e perde um dado';
  return { kind: 'normal', good, margin, label: good ? 'Sorte' : 'Azar', effect: tier };
}

// Rolagem com dados de verdade (crypto)
export function d(sides) {
  const a = new Uint32Array(1);
  const lim = Math.floor(0xffffffff / sides) * sides;
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return (a[0] % sides) + 1;
}

// §4.1 Teste: 2 DA + valor + bônus + dados da reserva, com crítico [RF p.2, SD p.2]
export function rollTest({ da, value = 0, bonus = 0, extra = [] }) {
  const s = SIDES[da];
  const base = [d(s), d(s)];
  const chain = [];
  let critKind = null;
  let critSum = 0;
  if (base[0] === s && base[1] === s) {
    critKind = 'critico';
    let pair;
    do { // encadeia enquanto cair máximo
      pair = [d(s), d(s)];
      chain.push(pair);
      critSum += pair[0] + pair[1];
    } while (pair[0] === s && pair[1] === s && chain.length < 12);
  } else if (base[0] === 1 && base[1] === 1) {
    critKind = 'erro';
    const pair = [d(s), d(s)];
    chain.push(pair);
    critSum = -(pair[0] + pair[1]); // não encadeia
  }
  const extraRolls = extra.map(t => ({ t, v: d(SIDES[t]) }));
  const extraSum = extraRolls.reduce((n, x) => n + x.v, 0);
  const total = base[0] + base[1] + critSum + value + bonus + extraSum;
  return { da, base, chain, critKind, value, bonus, extraRolls, total, seriousHarm: critKind === 'erro' && total < 0 };
}

// Insuficiência existencial [SD p.1]
export const zeroAttrs = a => ATTRS.filter(x => (a[x.k] ?? 1) <= 0).map(x => x.name);

// Alertas de min-max [RF p.1] — o texto é o do documento
export function minMaxNotes(a) {
  const n = [];
  if (a.res - a.fm >= 4) n.push('Resistência alta com Força Mental baixa derruba a Sanidade.');
  if (a.fm - a.res >= 4) n.push('Força Mental alta com Resistência baixa derruba a Vida.');
  return n;
}

// Bruma / Caos [RS p.3, SD p.4]
export const CHAOS = {
  bruma: { name: 'Bruma caótica', text: 'Névoa roxa e meio esbranquiçada. Corrupção leve e demorada. Só é vista de fora.' },
  zona: { name: 'Zona volátil', text: 'Dentro da Bruma, perto da Bateria. Partículas visíveis mas difíceis de notar. Corrupção moderada e lenta.' },
  bateria: { name: 'Bateria de caos', text: 'Material ou criatura que exala energia caótica, bruma e zona.' },
  inside: 'Algo na natureza parece corrompido.',
};

// Textos canônicos curtos para a entrada (não revelam segredos de mesa)
export const INTRO = [
  'Os testes aqui são difíceis. Foram feitos assim.',
  'O que separa você de uma pessoa comum é a reserva de dados que acorda com você todo dia.',
  'Existe uma energia no mundo que corrompe tudo o que toca. A matéria, a vida e a mente que ela alcança continuam existindo, só que corrompidas.',
  'Quem olha de longe vê uma névoa roxa e esbranquiçada. Quem está dentro dela não vê nada. Sente só que a natureza está errada.',
  'Sobreviva. Ou role os dados.',
];
export const SIGN = '— Zito';
