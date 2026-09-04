export const tiers = [
  { faixa: 1, total: 5, refin: 2, refinPrize: 40, novo: 3, novoPrize: 60, max: 100 },
  { faixa: 2, total: 6, refin: 2, refinPrize: 80, novo: 4, novoPrize: 120, max: 200 },
  { faixa: 3, total: 7, refin: 3, refinPrize: 120, novo: 4, novoPrize: 180, max: 300 },
  { faixa: 4, total: 8, refin: 3, refinPrize: 160, novo: 5, novoPrize: 240, max: 400 },
  { faixa: 5, total: 9, refin: 4, refinPrize: 240, novo: 5, novoPrize: 360, max: 600 },
  { faixa: 6, total: 10, refin: 4, refinPrize: 300, novo: 6, novoPrize: 450, max: 750 },
  { faixa: 7, total: 11, refin: 4, refinPrize: 360, novo: 7, novoPrize: 540, max: 900 },
  { faixa: 8, total: 12, refin: 5, refinPrize: 400, novo: 7, novoPrize: 600, max: 1000 },
  { faixa: 9, total: 13, refin: 5, refinPrize: 480, novo: 8, novoPrize: 720, max: 1200 }
];

export const FIVE_DAY_PRODUCTIVITY_START = '2026-09-15';

export function integer(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function totalTier(total) {
  let found = null;
  for (const tier of tiers) {
    if (total >= tier.total) found = tier;
  }
  return found;
}

export function productivityDays(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value;
  const localDate = `${part('year')}-${part('month')}-${part('day')}`;

  return localDate >= FIVE_DAY_PRODUCTIVITY_START ? 5 : 4;
}

export function calculateSimulation(refinValue, novoValue) {
  const refin = integer(refinValue);
  const novo = integer(novoValue);
  const total = refin + novo;
  const tier = totalTier(total);
  const refinUnit = tier ? tier.refinPrize / tier.refin : 0;
  const novoUnit = tier ? tier.novoPrize / tier.novo : 0;
  const paidRefin = tier ? Math.min(refin, tier.refin) : 0;
  const paidNovo = tier ? Math.min(novo, tier.novo) : 0;
  const allNewMaximum = Boolean(tier && refin === 0 && novo >= tier.total);
  const refinAward = paidRefin * refinUnit;
  const novoAward = allNewMaximum ? tier.max : paidNovo * novoUnit;
  const nextTier = tiers.find(item => item.total > total) || null;

  return {
    refin,
    novo,
    total,
    tier,
    refinUnit,
    novoUnit,
    paidRefin,
    paidNovo,
    allNewMaximum,
    refinAward,
    novoAward,
    award: refinAward + novoAward,
    nextTier
  };
}
