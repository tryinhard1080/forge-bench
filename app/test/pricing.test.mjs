import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount, lineTotal, orderTotal } from '../src/pricing.mjs';
import { formatCents } from '../src/money.mjs';

test('no discount leaves the amount unchanged', () => {
  assert.equal(applyDiscount(1234, 0), 1234);
});

test('a whole-number percent comes off the amount', () => {
  assert.equal(applyDiscount(2000, 10), 1800);
  assert.equal(applyDiscount(5000, 25), 3750);
});

test('percent outside 0-100 is rejected', () => {
  assert.throws(() => applyDiscount(100, 101), RangeError);
  assert.throws(() => applyDiscount(100, -1), RangeError);
});

test('line and order totals multiply by quantity and add up', () => {
  const products = new Map([['p1', { priceCents: 1000 }], ['p2', { priceCents: 250 }]]);
  const order = { lines: [{ productId: 'p1', qty: 2, discountPct: 10 }, { productId: 'p2', qty: 4 }] };
  assert.equal(lineTotal(order.lines[0], products.get('p1')), 1800);
  assert.equal(orderTotal(order, products), 2800);
});

test('cents format as dollars', () => {
  assert.equal(formatCents(1796), '$17.96');
  assert.equal(formatCents(5), '$0.05');
  assert.equal(formatCents(-250), '-$2.50');
});
