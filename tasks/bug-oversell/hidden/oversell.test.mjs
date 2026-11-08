import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory } from '../src/inventory.mjs';
import { createOrder } from '../src/orders.mjs';

const products = [{ id: 'p1', priceCents: 500, stock: 5 }];

test('a second reservation cannot take stock the first one holds', () => {
  const inv = createInventory(products);
  inv.reserve('p1', 3);
  assert.throws(() => inv.reserve('p1', 3), /insufficient stock/);
  assert.equal(inv.available('p1'), 2);
});

test('reserving exactly what is left succeeds', () => {
  const inv = createInventory(products);
  inv.reserve('p1', 3);
  inv.reserve('p1', 2);
  assert.equal(inv.available('p1'), 0);
});

test('released stock can be reserved again', () => {
  const inv = createInventory(products);
  inv.reserve('p1', 5);
  inv.release('p1', 2);
  inv.reserve('p1', 2);
  assert.equal(inv.available('p1'), 0);
});

test('orders cannot oversell across orders', () => {
  const ctx = {
    inventory: createInventory(products),
    productsById: new Map(products.map(p => [p.id, p])),
    customersById: new Map([['c1', { id: 'c1' }]]),
  };
  createOrder({ id: 'o1', customerId: 'c1', lines: [{ productId: 'p1', qty: 3 }] }, ctx);
  assert.throws(() => createOrder({ id: 'o2', customerId: 'c1', lines: [{ productId: 'p1', qty: 3 }] }, ctx), /insufficient stock/);
  assert.ok(ctx.inventory.available('p1') >= 0);
});
