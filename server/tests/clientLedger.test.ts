import test from 'node:test';
import assert from 'node:assert/strict';
import { amount } from '../src/math.js';
import { formattedRupees, rowAmount, localToday } from '../../client/src/lib/types.js';

test('frontend row totals match backend math for Buta, Top and edited rates', () => {
  const examples = [
    [500, 0.16, 80],
    [500, 0.4, 200],
    [200, 0.16, 32],
    [3, 0.165, 0.5],
    [0, 0.16, 0],
    [1234.5, 0.35, 432.08],
  ] as const;
  for (const [quantity, price, expected] of examples) {
    assert.equal(amount(quantity, price), expected);
    assert.equal(rowAmount({ quantity, price }), expected);
  }
});

test('grand totals are sums of individually rounded entry amounts', () => {
  const entries = [
    { quantity: 3, price: 0.165 },
    { quantity: 10, price: 0.16 },
    { quantity: 25, price: 0.4 },
  ];
  const sum = entries.reduce((total, entry) => total + rowAmount(entry), 0);
  assert.equal(sum, 12.1);
  assert.match(formattedRupees(sum), /12\.10/);
});

test('new entry dates use the device-local YYYY-MM-DD format', () => {
  assert.match(localToday(), /^\d{4}-\d{2}-\d{2}$/);
});
