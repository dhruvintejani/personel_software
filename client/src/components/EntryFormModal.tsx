import { useState, type FormEvent } from 'react';
import { t } from '../lib/i18n';
import { formattedRupees, localToday, rowAmount } from '../lib/types';
import type { Entry, Language, Section } from '../lib/types';
import ModalFrame from './ModalFrame';

export type EntryFormValues = Pick<Entry, 'date' | 'title' | 'quantity' | 'price' | 'completed'>;

type Props = {
  lang: Language;
  section: Section;
  entry?: Entry;
  onClose: () => void;
  onSave: (value: EntryFormValues) => Promise<void>;
};

export default function EntryFormModal({ lang, section, entry, onClose, onSave }: Props) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [date, setDate] = useState(entry?.date ?? localToday());
  const [quantity, setQuantity] = useState(entry ? String(entry.quantity) : '');
  const [price, setPrice] = useState(entry ? String(entry.price) : section === 'buta' ? '0.16' : '0.40');
  const [completed, setCompleted] = useState(entry?.completed ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const qtyNumber = Number(quantity), priceNumber = Number(price);
  const valid = quantity.trim() !== '' && price.trim() !== '' && Number.isFinite(qtyNumber) &&
    Number.isFinite(priceNumber) && qtyNumber >= 0 && qtyNumber <= 1_000_000_000 &&
    priceNumber >= 0 && priceNumber <= 1_000_000 && Boolean(date);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !valid) return;
    setBusy(true); setError('');
    try {
      await onSave({ title: title.trim(), date, quantity: qtyNumber, price: priceNumber, completed });
    } catch {
      setError(t(lang,'genericError'));
      setBusy(false);
    }
  };

  return <ModalFrame title={entry ? t(lang,'editEntry') : t(lang,'addEntry')} busy={busy} onClose={onClose}>
    <form onSubmit={e=>void save(e)} className="space-y-4 px-5 py-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">{t(lang,'titleOptional')}</span>
        <input data-autofocus type="text" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}
          className="input-base h-11 px-3" placeholder={t(lang,'titleOptional')}/>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">{t(lang,'date')}</span>
        <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-base h-11 px-3"/>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-muted">{t(lang,'quantity')}</span>
          <input required type="number" inputMode="decimal" step="any" min="0" max="1000000000" value={quantity}
            onChange={e=>setQuantity(e.target.value)} className="input-base h-11 px-3 tabular-nums" placeholder="0"/>
        </label>
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-muted">{t(lang,'price')} (₹)</span>
          <input required type="number" inputMode="decimal" step="any" min="0" max="1000000" value={price}
            onChange={e=>setPrice(e.target.value)} className="input-base h-11 px-3 tabular-nums"/>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-3">
        <span className="text-sm font-semibold text-muted">{t(lang,'total')}</span>
        <span className="text-lg font-bold tabular-nums text-brand">{formattedRupees(valid ? rowAmount({quantity:qtyNumber,price:priceNumber}) : 0)}</span>
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-ink">
        <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} className="h-5 w-5 accent-brand"/>
        {t(lang,'complete')}
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
        <button type="button" disabled={busy} onClick={onClose} className="btn-secondary">{t(lang,'cancel')}</button>
        <button type="submit" disabled={!valid || busy} className="btn-primary">{busy ? '…' : t(lang,'save')}</button>
      </div>
    </form>
  </ModalFrame>;
}
