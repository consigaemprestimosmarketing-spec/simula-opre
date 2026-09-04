import assert from 'node:assert/strict';

import {
  calculateSimulation,
  productivityDays,
  tiers
} from '../lib/simulator-rules.mjs';

for (const tier of tiers) {
  const onlyNew = calculateSimulation(0, tier.total);
  assert.equal(onlyNew.tier.faixa, tier.faixa);
  assert.equal(onlyNew.allNewMaximum, true);
  assert.equal(onlyNew.refinAward, 0);
  assert.equal(onlyNew.novoAward, tier.max);
  assert.equal(onlyNew.award, tier.max);
}

const mixedProduction = calculateSimulation(1, 4);
assert.equal(mixedProduction.allNewMaximum, false);
assert.equal(mixedProduction.award, 80);

const belowFirstTier = calculateSimulation(0, 4);
assert.equal(belowFirstTier.tier, null);
assert.equal(belowFirstTier.award, 0);

assert.equal(productivityDays(new Date('2026-09-15T02:59:59.999Z')), 4);
assert.equal(productivityDays(new Date('2026-09-15T03:00:00.000Z')), 5);

console.log('Regras do simulador validadas.');
