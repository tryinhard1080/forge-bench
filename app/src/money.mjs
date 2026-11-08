// All money is integer cents. Formatting is the only place dollars appear.
export function formatCents(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function centsToDecimal(cents) {
  return formatCents(cents).replace('$', '');
}
