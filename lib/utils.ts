export function formatCurrency(value: number | string = 0, locale = 'es-ES', currency = 'EUR'): string {
  const amount = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(amount)) {
    return '0,00 €';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
