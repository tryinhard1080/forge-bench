import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount, orderTotal } from '../src/pricing.mjs';

test('half a cent rounds up', () => {
  assert.equal(applyDiscount(1995, 10), 1796);
  assert.equal(applyDiscount(1005, 50), 503);
});

test('below half a cent rounds down', () => {
  assert.equal(applyDiscount(999, 5), 949);
});

test('exact amounts are unchanged by rounding', () => {
  assert.equal(applyDiscount(2000, 10), 1800);
  assert.equal(applyDiscount(1995, 0), 1995);
  assert.equal(applyDiscount(1995, 100), 0);
});

test('order totals use the rounded line totals', () => {
  const products = new Map([['p1', { priceCents: 1995 }], ['p2', { priceCents: 1005 }]]);
  const order = { lines: [{ productId: 'p1', qty: 1, discountPct: 10 }, { productId: 'p2', qty: 1, discountPct: 50 }] };
  assert.equal(orderTotal(order, products), 1796 + 503);
});
