import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory, lowStockReport } from '../src/inventory.mjs';
import { loadData } from '../src/data.mjs';

const products = [
  { id: 'p3', name: 'Capers', stock: 2 },
  { id: 'p1', name: 'Miso', stock: 9 },
  { id: 'p2', name: 'Ghee', stock: 2 },
  { id: 'p4', name: 'Sumac', stock: 0 },
];

test('lists products at or below the threshold, lowest first, then by id', () => {
  const inv = createInventory(products);
  assert.deepEqual(lowStockReport(products, inv, 2), [
    { id: 'p4', name: 'Sumac', available: 0 },
    { id: 'p2', name: 'Ghee', available: 2 },
    { id: 'p3', name: 'Capers', available: 2 },
  ]);
});

test('reservations count against available stock', () => {
  const inv = createInventory(products);
  inv.reserve('p1', 8);
  assert.deepEqual(lowStockReport(products, inv, 1).map(r => r.id), ['p4', 'p1']);
});

test('a bad threshold is a RangeError', () => {
  const inv = createInventory(products);
  assert.throws(() => lowStockReport(products, inv, -1), RangeError);
  assert.throws(() => lowStockReport(products, inv, 1.5), RangeError);
});

test('the synthetic catalog reports its out-of-stock products', () => {
  const d = loadData();
  const inv = createInventory(d.products);
  const zero = d.products.filter(p => p.stock === 0).map(p => p.id).sort();
  assert.deepEqual(lowStockReport(d.products, inv, 0).map(r => r.id), zero);
});
