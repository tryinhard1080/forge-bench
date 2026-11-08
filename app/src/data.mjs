import { readFileSync } from 'node:fs';

const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));

export function loadData() {
  const customers = load('customers');
  const products = load('products');
  const orders = load('orders');
  return {
    customers,
    products,
    orders,
    customersById: new Map(customers.map(c => [c.id, c])),
    productsById: new Map(products.map(p => [p.id, p])),
  };
}
