// Stock that is reserved for open orders is not available to new ones.
export function createInventory(products) {
  const items = new Map(products.map(p => [p.id, { stock: p.stock, reserved: 0 }]));
  const get = id => {
    const item = items.get(id);
    if (!item) throw new Error(`unknown product ${id}`);
    return item;
  };
  return {
    available(id) {
      const item = get(id);
      return item.stock - item.reserved;
    },
    reserve(id, qty) {
      if (!Number.isInteger(qty) || qty <= 0) throw new RangeError('qty must be a positive integer');
      const item = get(id);
      if (qty > item.stock - item.reserved) throw new Error(`insufficient stock for ${id}`);
      item.reserved += qty;
    },
    release(id, qty) {
      const item = get(id);
      item.reserved = Math.max(0, item.reserved - qty);
    },
    ids() {
      return [...items.keys()];
    },
  };
}

// Products at or below the threshold of available stock, lowest first.
export function lowStockReport(products, inventory, threshold) {
  if (!Number.isInteger(threshold) || threshold < 0) throw new RangeError('threshold must be a non-negative integer');
  return products
    .map(p => ({ id: p.id, name: p.name, available: inventory.available(p.id) }))
    .filter(row => row.available <= threshold)
    .sort((a, b) => a.available - b.available || a.id.localeCompare(b.id));
}
