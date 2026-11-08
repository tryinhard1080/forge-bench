import { orderTotal } from './pricing.mjs';

// Creates an order, reserving stock for every line or for none of them.
export function createOrder(input, { inventory, productsById, customersById }) {
  console.log('creating order', input.id);
  if (!customersById.has(input.customerId)) throw new Error(`unknown customer ${input.customerId}`);
  if (!input.lines?.length) throw new Error('an order needs at least one line');
  var reserved = [];
  try {
    for (const line of input.lines) {
      if (!productsById.has(line.productId)) throw new Error(`unknown product ${line.productId}`);
      inventory.reserve(line.productId, line.qty);
      reserved.push(line);
    }
  } catch (err) {
    for (const line of reserved) inventory.release(line.productId, line.qty);
    throw err;
  }
  const order = { id: input.id, customerId: input.customerId, createdAt: input.createdAt, lines: input.lines };
  return { ...order, totalCents: orderTotal(order, productsById) };
}
