import assert from 'node:assert/strict';

import {
  calculateSimulation,
  fiveDayTiers,
  fourDayTiers,
  productivityDays,
  tiersForDays
} from '../lib/simulator-rules.mjs';

for (const tier of fiveDayTiers) {
  const onlyNew = calculateSimulation(0, tier.total, 5);
  assert.equal(onlyNew.tier.faixa, tier.faixa);
  assert.equal(onlyNew.allNewMaximum, true);
  assert.equal(onlyNew.refinAward, 0);
  assert.equal(onlyNew.novoAward, tier.max);
  assert.equal(onlyNew.award, tier.max);
}

assert.deepEqual(
  fourDayTiers.map(({ faixa, prod, total, max }) => ({ faixa, prod, total, max })),
  [
    { faixa: 1, prod: 1, total: 4, max: 80 },
    { faixa: 2, prod: 1.2, total: 5, max: 160 },
    { faixa: 3, prod: 1.4, total: 6, max: 240 },
    { faixa: 4, prod: 1.6, total: 6, max: 320 },
    { faixa: 5, prod: 1.8, total: 7, max: 520 },
    { faixa: 6, prod: 2, total: 8, max: 600 },
    { faixa: 7, prod: 2.2, total: 9, max: 720 },
    { faixa: 8, prod: 2.4, total: 10, max: 800 },
    { faixa: 9, prod: 2.6, total: 10, max: 960 }
  ]
);

assert.equal(tiersForDays(4), fourDayTiers);
assert.equal(tiersForDays(5), fiveDayTiers);

for (const [total, faixa, max] of [
  [4, 1, 80],
  [5, 2, 160],
  [6, 4, 320],
  [7, 5, 520],
  [8, 6, 600],
  [9, 7, 720],
  [10, 9, 960]
]) {
  const onlyNew = calculateSimulation(0, total, 4);
  assert.equal(onlyNew.tier.faixa, faixa);
  assert.equal(onlyNew.award, max);
}

const mixedProduction = calculateSimulation(1, 4, 5);
assert.equal(mixedProduction.allNewMaximum, false);
assert.equal(mixedProduction.award, 80);

const belowFirstTier = calculateSimulation(0, 3, 4);
assert.equal(belowFirstTier.tier, null);
assert.equal(belowFirstTier.award, 0);

assert.equal(productivityDays(new Date('2026-09-15T02:59:59.999Z')), 4);
assert.equal(productivityDays(new Date('2026-09-15T03:00:00.000Z')), 5);

console.log('Regras do simulador validadas.');
