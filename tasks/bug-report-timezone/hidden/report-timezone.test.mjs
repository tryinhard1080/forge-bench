import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRevenue } from '../src/reports.mjs';
import { loadData } from '../src/data.mjs';

const products = new Map([['p1', { priceCents: 1000 }]]);
const at = createdAt => ({ createdAt, lines: [{ productId: 'p1', qty: 1 }] });

test('an evening order in Chicago belongs to the local month', () => {
  const r = monthlyRevenue([at('2026-03-01T03:00:00Z')], products, { tzOffsetMinutes: -360 });
  assert.deepEqual([...r], [['2026-02', 1000]]);
});

test('a positive offset can move an order into the next month', () => {
  const r = monthlyRevenue([at('2026-01-31T20:00:00Z')], products, { tzOffsetMinutes: 330 });
  assert.deepEqual([...r], [['2026-02', 1000]]);
});

test('offset zero still groups by UTC month', () => {
  const r = monthlyRevenue([at('2026-03-01T03:00:00Z')], products);
  assert.deepEqual([...r], [['2026-03', 1000]]);
});

test('shifting the time zone moves revenue between months but never loses any', () => {
  const d = loadData();
  const sum = m => [...m.values()].reduce((a, b) => a + b, 0);
  const utc = monthlyRevenue(d.orders, d.productsById);
  const chicago = monthlyRevenue(d.orders, d.productsById, { tzOffsetMinutes: -360 });
  assert.equal(sum(chicago), sum(utc));
  assert.notDeepEqual([...chicago], [...utc], 'the data set has orders near month boundaries');
});
