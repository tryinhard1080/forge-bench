// Deterministic synthetic data for Larder. Same seed, same bytes: `npm run data` must not change git status.
// Edge cases are planted on purpose: names with commas and quotes, prices ending in 5 (half-cent discounts),
// and orders in the first hours of a month in UTC (local-time month boundaries).
import { writeFileSync } from 'node:fs';

const SEED = 20261108;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generate(seed = SEED) {
  const rand = mulberry32(seed);
  const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const pick = list => list[Math.floor(rand() * list.length)];
  const pad = (n, w) => String(n).padStart(w, '0');

  const first = ['Ava', 'Ben', 'Chloe', 'Dev', 'Elena', 'Femi', 'Grace', 'Hiro', 'Ines', 'Jonah', 'Kai', 'Lena', 'Mateo', 'Nora', 'Omar', 'Priya'];
  const last = ['Alvarez', 'Brooks', 'Chen', "D'Souza", 'Evans', 'Fischer', 'Garcia', 'Huang', 'Ibarra', 'Jensen', 'Kowalski', 'Lopez'];
  const customers = Array.from({ length: 40 }, (_, i) => {
    const f = pick(first);
    const l = pick(last);
    const style = i % 10;
    const name = style === 3 ? `${l}, ${f}` : style === 7 ? `${f} "${f.slice(0, 2)}" ${l}` : `${f} ${l}`;
    const email = `${f}.${l}.${i + 1}`.toLowerCase().replace(/[^a-z0-9.]/g, '') + '@example.test';
    return { id: `c${pad(i + 1, 3)}`, name, email };
  });

  const nouns = ['Oat Flour', 'Rye Berries', 'Smoked Salt', 'Maple Syrup', 'Dried Figs', 'Black Tea', 'Olive Oil', 'Honey', 'Chili Crisp', 'Rice Vinegar', 'Cocoa Nibs', 'Sumac', 'Miso', 'Tahini', 'Saffron', 'Polenta', 'Capers', 'Dates', 'Barley', 'Pecans', 'Sea Kelp', 'Ghee', 'Za\'atar', 'Molasses', 'Farro'];
  const products = nouns.map((name, i) => ({
    id: `p${pad(i + 1, 3)}`,
    name,
    priceCents: int(3, 60) * 100 - pick([5, 1, 0, 5, 51]),
    stock: int(0, 40),
  }));

  const orders = Array.from({ length: 300 }, (_, i) => {
    const month = int(1, 6);
    const boundary = i % 9 === 0;
    const day = boundary ? 1 : int(1, 28);
    const hour = boundary ? int(0, 5) : int(0, 23);
    const createdAt = `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour, 2)}:${pad(int(0, 59), 2)}:00Z`;
    const lineCount = int(1, 4);
    const used = new Set();
    const lines = [];
    while (lines.length < lineCount) {
      const product = pick(products);
      if (used.has(product.id)) continue;
      used.add(product.id);
      lines.push({ productId: product.id, qty: int(1, 5), discountPct: pick([0, 0, 0, 5, 10, 15, 25]) });
    }
    return { id: `o${pad(i + 1, 4)}`, customerId: pick(customers).id, createdAt, lines };
  });
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

  return { customers, products, orders };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href || process.argv[1]?.endsWith('generate.mjs')) {
  const data = generate();
  for (const [name, rows] of Object.entries(data)) {
    writeFileSync(new URL(`./${name}.json`, import.meta.url), JSON.stringify(rows, null, 2) + '\n');
  }
}
