import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory } from '../src/inventory.mjs';
import { createOrder } from '../src/orders.mjs';

const products = [{ id: 'p1', priceCents: 500, stock: 5 }, { id: 'p2', priceCents: 300, stock: 1 }];
const ctx = () => ({
  inventory: createInventory(products),
  productsById: new Map(products.map(p => [p.id, p])),
  customersById: new Map([['c1', { id: 'c1' }]]),
});

test('a reservation reduces available stock', () => {
  const inv = createInventory(products);
  inv.reserve('p1', 3);
  assert.equal(inv.available('p1'), 2);
});

test('reserving more than the stock fails', () => {
  const inv = createInventory(products);
  assert.throws(() => inv.reserve('p2', 2), /insufficient stock/);
});

test('an order reserves its lines and carries its total', () => {
  const c = ctx();
  const order = createOrder({ id: 'o1', customerId: 'c1', createdAt: '2026-01-02T10:00:00Z', lines: [{ productId: 'p1', qty: 2 }] }, c);
  assert.equal(order.totalCents, 1000);
  assert.equal(c.inventory.available('p1'), 3);
});

test('a failed order releases what it reserved', () => {
  const c = ctx();
  assert.throws(() => createOrder({ id: 'o2', customerId: 'c1', lines: [{ productId: 'p1', qty: 2 }, { productId: 'p2', qty: 9 }] }, c));
  assert.equal(c.inventory.available('p1'), 5);
});

test('unknown customers are rejected', () => {
  assert.throws(() => createOrder({ id: 'o3', customerId: 'nope', lines: [{ productId: 'p1', qty: 1 }] }, ctx()), /unknown customer/);
});
