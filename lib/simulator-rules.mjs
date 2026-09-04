export const fourDayTiers = [
  { faixa: 1, prod: 1, total: 4, refin: 2, refinPrize: 32, novo: 3, novoPrize: 48, max: 80 },
  { faixa: 2, prod: 1.2, total: 5, refin: 2, refinPrize: 64, novo: 4, novoPrize: 96, max: 160 },
  { faixa: 3, prod: 1.4, total: 6, refin: 3, refinPrize: 96, novo: 4, novoPrize: 144, max: 240 },
  { faixa: 4, prod: 1.6, total: 6, refin: 3, refinPrize: 128, novo: 5, novoPrize: 192, max: 320 },
  { faixa: 5, prod: 1.8, total: 7, refin: 4, refinPrize: 208, novo: 5, novoPrize: 312, max: 520 },
  { faixa: 6, prod: 2, total: 8, refin: 4, refinPrize: 240, novo: 6, novoPrize: 360, max: 600 },
  { faixa: 7, prod: 2.2, total: 9, refin: 4, refinPrize: 288, novo: 7, novoPrize: 432, max: 720 },
  { faixa: 8, prod: 2.4, total: 10, refin: 5, refinPrize: 320, novo: 7, novoPrize: 480, max: 800 },
  { faixa: 9, prod: 2.6, total: 10, refin: 5, refinPrize: 384, novo: 8, novoPrize: 576, max: 960 }
];

export const fiveDayTiers = [
  { faixa: 1, prod: 1, total: 5, refin: 2, refinPrize: 40, novo: 3, novoPrize: 60, max: 100 },
  { faixa: 2, prod: 1.2, total: 6, refin: 2, refinPrize: 80, novo: 4, novoPrize: 120, max: 200 },
  { faixa: 3, prod: 1.4, total: 7, refin: 3, refinPrize: 120, novo: 4, novoPrize: 180, max: 300 },
  { faixa: 4, prod: 1.6, total: 8, refin: 3, refinPrize: 160, novo: 5, novoPrize: 240, max: 400 },
  { faixa: 5, prod: 1.8, total: 9, refin: 4, refinPrize: 240, novo: 5, novoPrize: 360, max: 600 },
  { faixa: 6, prod: 2, total: 10, refin: 4, refinPrize: 300, novo: 6, novoPrize: 450, max: 750 },
  { faixa: 7, prod: 2.2, total: 11, refin: 4, refinPrize: 360, novo: 7, novoPrize: 540, max: 900 },
  { faixa: 8, prod: 2.4, total: 12, refin: 5, refinPrize: 400, novo: 7, novoPrize: 600, max: 1000 },
  { faixa: 9, prod: 2.6, total: 13, refin: 5, refinPrize: 480, novo: 8, novoPrize: 720, max: 1200 }
];

export const tiers = fiveDayTiers;

export const FIVE_DAY_PRODUCTIVITY_START = '2026-09-15';

export function integer(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function tiersForDays(days) {
  return Number(days) === 4 ? fourDayTiers : fiveDayTiers;
}

export function totalTier(total, days = 5) {
  let found = null;
  for (const tier of tiersForDays(days)) {
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

export function calculateSimulation(refinValue, novoValue, days = 5) {
  const refin = integer(refinValue);
  const novo = integer(novoValue);
  const total = refin + novo;
  const activeTiers = tiersForDays(days);
  const tier = totalTier(total, days);
  const refinUnit = tier ? tier.refinPrize / tier.refin : 0;
  const novoUnit = tier ? tier.novoPrize / tier.novo : 0;
  const paidRefin = tier ? Math.min(refin, tier.refin) : 0;
  const paidNovo = tier ? Math.min(novo, tier.novo) : 0;
  const allNewMaximum = Boolean(tier && refin === 0 && novo >= tier.total);
  const refinAward = paidRefin * refinUnit;
  const novoAward = allNewMaximum ? tier.max : paidNovo * novoUnit;
  const nextTier = activeTiers.find(item => item.total > total) || null;

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
