import { orderTotal } from './pricing.mjs';
import { centsToDecimal } from './money.mjs';

const HEADER = ['order_id', 'created_at', 'customer_name', 'customer_email', 'total'];

function field(value) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ordersToCsv(orders, { customersById, productsById }) {
  const rows = orders.map(order => {
    const customer = customersById.get(order.customerId);
    return [order.id, order.createdAt, customer.name, customer.email, centsToDecimal(orderTotal(order, productsById))];
  });
  return [HEADER, ...rows].map(row => row.map(field).join(',')).join('\n') + '\n';
}
