import { memo, useEffect, useState } from 'react';
import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react';
import { t } from '../lib/i18n';
import { formattedRupees, rowAmount } from '../lib/types';
import type { Entry, EntryPatch, Language } from '../lib/types';

type Props = {
  entry: Entry;
  index: number;
  lang: Language;
  editing: boolean;
  onToggleEdit: (id: string) => void;
  onUpdate: (id: string, patch: EntryPatch) => void;
  onFlush: (id: string) => Promise<void>;
  onMove: (entry: Entry, next: string) => void;
  onDelete: (entry: Entry) => void;
};

function EntryRow({ entry, index, lang, editing, onToggleEdit, onUpdate, onFlush, onMove, onDelete }: Props) {
  const [qty, setQty] = useState(entry.quantity ? String(entry.quantity) : '');
  const [price, setPrice] = useState(String(entry.price));

  useEffect(() => { setQty(entry.quantity ? String(entry.quantity) : ''); }, [entry._id]);
  useEffect(() => { setPrice(String(entry.price)); }, [entry._id]);

  const inputChange = (field: 'quantity' | 'price', value: string) => {
    if (field === 'quantity') setQty(value); else setPrice(value);
    const number = value === '' ? 0 : Number(value);
    if (Number.isFinite(number) && number >= 0) onUpdate(entry._id, { [field]: number });
  };
  const inputBlur = (field: 'quantity' | 'price') => {
    if (field === 'quantity') setQty(entry.quantity ? String(entry.quantity) : '');
    else setPrice(String(entry.price));
    void onFlush(entry._id);
  };
  const toggle = () => {
    if (editing) void onFlush(entry._id);
    onToggleEdit(entry._id);
  };
  const checkbox = (
    <label className="inline-flex min-h-10 items-center justify-center gap-1.5 text-xs font-semibold text-muted">
      <input type="checkbox" checked={entry.completed} onChange={e => {
        onUpdate(entry._id, { completed: e.target.checked });
        void onFlush(entry._id);
      }} className="h-5 w-5 accent-brand" aria-label={`${t(lang,'entry')} ${index+1}: ${t(lang,'complete')}`}/>
      <span className="sr-only">{t(lang, 'done')}</span>
    </label>
  );
  const actionButtons = (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <button type="button" onClick={toggle} aria-expanded={editing} aria-label={`${t(lang,'edit')}: ${entry.title || t(lang,'entry')}`}
        className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors ${editing ? 'bg-accent text-brand' : 'text-brand hover:bg-paper'}`}>
        <Pencil size={16}/><span>{editing ? t(lang,'done') : t(lang,'edit')}</span>
      </button>
      <button type="button" onClick={() => onDelete(entry)} aria-label={`${t(lang,'removeEntry')}: ${entry.title || t(lang,'entry')}`}
        className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50">
        <Trash2 size={16}/><span>{t(lang,'deleteShort')}</span>
      </button>
    </div>
  );

  return <article className="entry-card min-w-0 rounded-xl border border-line bg-white px-3 py-2.5 shadow-soft sm:px-4">
    {/* Small screens: only two short information lines plus permanent action buttons. */}
    <div className="lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-paper px-1.5 text-[11px] font-bold tabular-nums text-muted">{index+1}</span>
        <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${entry.title ? 'text-ink' : 'text-slate-400'}`}>{entry.title || t(lang,'titleOptional')}</span>
        {checkbox}
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1.3fr)] gap-2 rounded-lg bg-paper px-2.5 py-2">
        <div className="min-w-0"><div className="text-[10px] font-semibold text-muted">{t(lang,'quantity')}</div><div className="truncate text-[14px] font-semibold tabular-nums text-ink">{entry.quantity}</div></div>
        <div className="min-w-0"><div className="text-[10px] font-semibold text-muted">{t(lang,'price')}</div><div className="truncate text-[14px] font-semibold tabular-nums text-ink">₹{entry.price}</div></div>
        <div className="min-w-0 text-right"><div className="text-[10px] font-semibold text-muted">{t(lang,'total')}</div><div className="truncate text-[14px] font-bold tabular-nums text-brand" title={formattedRupees(rowAmount(entry))}>{formattedRupees(rowAmount(entry))}</div></div>
      </div>
      <div className="mt-1 flex justify-end">{actionButtons}</div>
    </div>

    {/* Desktop: one entry per full-width horizontal row; rows never stretch each other. */}
    <div className="hidden lg:grid lg:grid-cols-[30px_minmax(80px,1fr)_70px_72px_108px_52px_152px] lg:items-center lg:gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper text-[11px] font-bold tabular-nums text-muted">{index+1}</span>
      <span className={`min-w-0 truncate text-sm font-semibold ${entry.title ? 'text-ink' : 'text-slate-400'}`} title={entry.title}>{entry.title || t(lang,'titleOptional')}</span>
      <span className="truncate text-sm font-medium tabular-nums text-ink" title={String(entry.quantity)}>{entry.quantity}</span>
      <span className="truncate text-sm font-medium tabular-nums text-ink" title={String(entry.price)}>₹{entry.price}</span>
      <span className="truncate text-sm font-bold tabular-nums text-brand" title={formattedRupees(rowAmount(entry))}>{formattedRupees(rowAmount(entry))}</span>
      {checkbox}
      {actionButtons}
    </div>

    {editing && <div className="mt-3 border-t border-line pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,.8fr)_minmax(0,.8fr)]">
        <label className="min-w-0"><span className="mb-1 block text-xs font-semibold text-muted">{t(lang,'titleOptional')}</span>
          <input autoFocus type="text" maxLength={120} value={entry.title} onChange={e=>onUpdate(entry._id,{title:e.target.value})}
            onBlur={()=>void onFlush(entry._id)} className="input-base h-11 px-3" placeholder={t(lang,'titleOptional')}/>
        </label>
        <label className="min-w-0"><span className="mb-1 block text-xs font-semibold text-muted">{t(lang,'quantity')}</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={qty}
            onChange={e=>inputChange('quantity',e.target.value)} onBlur={()=>inputBlur('quantity')}
            className="input-base h-11 px-3 font-semibold tabular-nums" />
        </label>
        <label className="min-w-0"><span className="mb-1 block text-xs font-semibold text-muted">{t(lang,'price')}</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={price}
            onChange={e=>inputChange('price',e.target.value)} onBlur={()=>inputBlur('price')}
            className="input-base h-11 px-3 font-semibold tabular-nums" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-0"><span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><CalendarDays size={14}/>{t(lang,'changeDate')}</span>
          <input type="date" value={entry.date} onChange={e=>e.target.value && onMove(entry,e.target.value)}
            className="input-base h-10 max-w-[220px] px-3" aria-label={t(lang,'changeDate')}/>
        </label>
        <button type="button" className="btn-secondary" onClick={toggle}><Check size={17}/>{t(lang,'done')}</button>
      </div>
    </div>}
  </article>;
}

export default memo(EntryRow);
