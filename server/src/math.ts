/** Round each monetary row to paise so totals match what is displayed. */
export function amount(quantity: number, price: number): number {
  return Math.round((quantity * price + Number.EPSILON) * 100) / 100;
}

/** Browser-local date without accidentally shifting to UTC. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
