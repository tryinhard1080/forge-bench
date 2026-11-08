import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordersToCsv } from '../src/export.mjs';
import { loadData } from '../src/data.mjs';

const customersById = new Map([
  ['c1', { id: 'c1', name: 'Ava Lopez', email: 'ava@example.test' }],
  ['c2', { id: 'c2', name: 'Lopez, Ava', email: 'lopez@example.test' }],
  ['c3', { id: 'c3', name: 'Ava "Av" Lopez', email: 'av@example.test' }],
]);
const productsById = new Map([['p1', { priceCents: 1995 }]]);
const order = (id, customerId) => ({ id, customerId, createdAt: '2026-01-02T03:04:00Z', lines: [{ productId: 'p1', qty: 1, discountPct: 10 }] });

test('header row, then one row per order with the total in dollars', () => {
  const csv = ordersToCsv([order('o1', 'c1')], { customersById, productsById });
  assert.equal(csv, 'order_id,created_at,customer_name,customer_email,total\no1,2026-01-02T03:04:00Z,Ava Lopez,ava@example.test,17.96\n');
});

test('fields with commas are quoted', () => {
  const csv = ordersToCsv([order('o2', 'c2')], { customersById, productsById });
  assert.match(csv.split('\n')[1], /^o2,2026-01-02T03:04:00Z,"Lopez, Ava",lopez@example\.test,17\.96$/);
});

test('inner double quotes are doubled inside a quoted field', () => {
  const csv = ordersToCsv([order('o3', 'c3')], { customersById, productsById });
  assert.ok(csv.includes(',"Ava ""Av"" Lopez",'), csv);
});

test('rows keep the order given and the file ends with one newline', () => {
  const csv = ordersToCsv([order('o9', 'c1'), order('o1', 'c1')], { customersById, productsById });
  const lines = csv.split('\n');
  assert.equal(lines[1].split(',')[0], 'o9');
  assert.equal(lines[2].split(',')[0], 'o1');
  assert.ok(csv.endsWith('\n') && !csv.endsWith('\n\n'));
});

test('the whole synthetic data set exports one row per order', () => {
  const d = loadData();
  const csv = ordersToCsv(d.orders, d);
  assert.equal(csv.trimEnd().split('\n').length, d.orders.length + 1);
  assert.ok(!/\$/.test(csv), 'no currency symbols');
});
