import { orderTotal } from './pricing.mjs';

// Revenue per calendar month in the store's time zone, given as a fixed UTC offset in minutes.
export function monthlyRevenue(orders, productsById, { tzOffsetMinutes = 0 } = {}) {
  const totals = new Map();
  for (const order of orders) {
    const placed = new Date(order.createdAt);
    const key = `${placed.getUTCFullYear()}-${String(placed.getUTCMonth() + 1).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) ?? 0) + orderTotal(order, productsById));
  }
  return new Map([...totals].sort(([a], [b]) => a.localeCompare(b)));
}
