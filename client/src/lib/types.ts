export type Section = 'buta' | 'top';
export type Language = 'gu' | 'en';
export type Person = {
  _id: string;
  name: string;
  section: Section;
  createdAt: string;
};
export type Entry = {
  _id: string;
  nameId: string;
  date: string;
  title: string;
  quantity: number;
  price: number;
  completed: boolean;
  createdAt: string;
};
export type EntryPatch = Partial<Pick<Entry, 'date' | 'title' | 'quantity' | 'price' | 'completed'>>;

export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function rowAmount(row: Pick<Entry, 'quantity' | 'price'>): number {
  return Math.round((row.quantity * row.price + Number.EPSILON) * 100) / 100;
}
export function formattedRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
