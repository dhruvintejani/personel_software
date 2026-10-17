import test from 'node:test';
import assert from 'node:assert/strict';
import { amount, isValidDateString } from '../src/math.js';

test('Buta calculation is quantity times price', () => {
  assert.equal(amount(500, .16), 80);
  assert.equal(amount(200, .16), 32);
});
test('Top calculation is quantity times price', () => {
  assert.equal(amount(500, .4), 200);
});
test('money rounds to paise', () => {
  assert.equal(amount(3, .165), .50);
});
test('reject malformed and impossible dates', () => {
  assert.equal(isValidDateString('2026-10-17'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('17/10/2026'), false);
});
