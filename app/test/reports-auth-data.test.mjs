import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRevenue } from '../src/reports.mjs';
import { createSession, isValid } from '../src/auth/session.mjs';
import { loadData } from '../src/data.mjs';

test('revenue is grouped by month', () => {
  const products = new Map([['p1', { priceCents: 1000 }]]);
  const orders = [
    { createdAt: '2026-01-10T12:00:00Z', lines: [{ productId: 'p1', qty: 1 }] },
    { createdAt: '2026-01-20T12:00:00Z', lines: [{ productId: 'p1', qty: 2 }] },
    { createdAt: '2026-02-03T12:00:00Z', lines: [{ productId: 'p1', qty: 1 }] },
  ];
  assert.deepEqual([...monthlyRevenue(orders, products)], [['2026-01', 3000], ['2026-02', 1000]]);
});

test('a new session is valid and has a token', () => {
  const s = createSession('u1', 1_000_000);
  assert.equal(s.token.length, 64);
  assert.ok(isValid(s, 1_000_001));
});

test('the synthetic data set is internally consistent', () => {
  const d = loadData();
  assert.equal(d.customers.length, 40);
  assert.equal(d.products.length, 25);
  assert.equal(d.orders.length, 300);
  for (const o of d.orders) {
    assert.ok(d.customersById.has(o.customerId), o.id);
    for (const l of o.lines) assert.ok(d.productsById.has(l.productId), o.id);
  }
});
