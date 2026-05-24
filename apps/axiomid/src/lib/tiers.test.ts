import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTier, getLevelProgress, getNextLevelXP, TIERS } from './tiers.ts';

test('Tiers Utility', async (t) => {
  await t.test('calculateTier', (t) => {
    assert.strictEqual(calculateTier(0), 'Registered');
    assert.strictEqual(calculateTier(50), 'Registered');
    assert.strictEqual(calculateTier(99), 'Registered');

    assert.strictEqual(calculateTier(100), 'Verified');
    assert.strictEqual(calculateTier(300), 'Verified');
    assert.strictEqual(calculateTier(499), 'Verified');

    assert.strictEqual(calculateTier(500), 'Trusted');
    assert.strictEqual(calculateTier(750), 'Trusted');
    assert.strictEqual(calculateTier(999), 'Trusted');

    assert.strictEqual(calculateTier(1000), 'Sovereign');
    assert.strictEqual(calculateTier(1500), 'Sovereign');

    assert.strictEqual(calculateTier(-10), 'Registered');
  });

  await t.test('getLevelProgress', (t) => {
    // Registered tier (0-100 XP)
    assert.strictEqual(getLevelProgress(0, 'Registered'), 0);
    assert.strictEqual(getLevelProgress(50, 'Registered'), 50);
    assert.strictEqual(getLevelProgress(100, 'Registered'), 100);

    // Verified tier (100-500 XP)
    assert.strictEqual(getLevelProgress(100, 'Verified'), 0);
    assert.strictEqual(getLevelProgress(300, 'Verified'), 50);
    assert.strictEqual(getLevelProgress(500, 'Verified'), 100);

    // Trusted tier (500-1000 XP)
    assert.strictEqual(getLevelProgress(500, 'Trusted'), 0);
    assert.strictEqual(getLevelProgress(750, 'Trusted'), 50);
    assert.strictEqual(getLevelProgress(1000, 'Trusted'), 100);

    // Sovereign tier
    assert.strictEqual(getLevelProgress(1000, 'Sovereign'), 100);
    assert.strictEqual(getLevelProgress(1500, 'Sovereign'), 100);

    // Clamping
    assert.strictEqual(getLevelProgress(-10, 'Registered'), 0);
    assert.strictEqual(getLevelProgress(150, 'Registered'), 100);
    assert.strictEqual(getLevelProgress(50, 'Verified'), 0);
    assert.strictEqual(getLevelProgress(600, 'Verified'), 100);
  });

  await t.test('getNextLevelXP', (t) => {
    assert.strictEqual(getNextLevelXP('Registered'), TIERS.Verified);
    assert.strictEqual(getNextLevelXP('Verified'), TIERS.Trusted);
    assert.strictEqual(getNextLevelXP('Trusted'), TIERS.Sovereign);
    assert.strictEqual(getNextLevelXP('Sovereign'), null);
  });
});
