// Discounts are whole-number percents, rounded half up to the cent.
export function applyDiscount(cents, percent) {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new RangeError('percent must be an integer from 0 to 100');
  return Math.floor((cents * (100 - percent)) / 100);
}

export function lineTotal(line, product) {
  return applyDiscount(product.priceCents * line.qty, line.discountPct ?? 0);
}

export function orderTotal(order, productsById) {
  return order.lines.reduce((sum, line) => sum + lineTotal(line, productsById.get(line.productId)), 0);
}
