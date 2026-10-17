import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { t } from '../lib/i18n';
import { formattedRupees, rowAmount } from '../lib/types';
import type { Entry, Language } from '../lib/types';

type Props = {
  entry: Entry;
  index: number;
  lang: Language;
  toggling: boolean;
  onToggle: (entry: Entry, next: boolean) => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

function EntryRow({ entry, index, lang, toggling, onToggle, onEdit, onDelete }: Props) {
  const check = <label className="inline-flex min-h-10 items-center justify-center gap-1.5 text-xs font-semibold text-muted">
    <input type="checkbox" disabled={toggling} checked={entry.completed}
      onChange={e=>onToggle(entry,e.target.checked)} className="h-5 w-5 accent-brand"
      aria-label={`${t(lang,'entry')} ${index+1} ${t(lang,'complete')}`}/>
    <span className="sr-only">{t(lang,'done')}</span>
  </label>;
  const actions = <div className="flex shrink-0 justify-end gap-1">
    <button type="button" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand hover:bg-paper"
      onClick={()=>onEdit(entry)} aria-label={`${t(lang,'edit')}: ${entry.title || t(lang,'entry')}`}>
      <Pencil size={15}/>{t(lang,'edit')}
    </button>
    <button type="button" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      onClick={()=>onDelete(entry)} aria-label={`${t(lang,'removeEntry')}: ${entry.title || t(lang,'entry')}`}>
      <Trash2 size={15}/>{t(lang,'deleteShort')}
    </button>
  </div>;
  return <article className="entry-card min-w-0 rounded-xl border border-line bg-white px-3 py-2 shadow-soft sm:px-4">
    <div className="lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-paper text-[11px] font-bold text-muted">{index+1}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink" title={entry.title}>{entry.title || t(lang,'entry')}</span>
        {check}
      </div>
      <div className="ml-9 text-[11px] font-medium tabular-nums text-muted">{entry.date}</div>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_minmax(0,.85fr)_minmax(0,1.35fr)] gap-2 rounded-lg bg-paper px-2.5 py-2">
        <div className="min-w-0"><div className="text-[10px] font-semibold text-muted">{t(lang,'quantity')}</div><div className="truncate text-sm font-semibold tabular-nums text-ink">{entry.quantity}</div></div>
        <div className="min-w-0"><div className="text-[10px] font-semibold text-muted">{t(lang,'price')}</div><div className="truncate text-sm font-semibold tabular-nums text-ink">₹{entry.price}</div></div>
        <div className="min-w-0 text-right"><div className="text-[10px] font-semibold text-muted">{t(lang,'total')}</div><div className="truncate text-sm font-bold tabular-nums text-brand" title={formattedRupees(rowAmount(entry))}>{formattedRupees(rowAmount(entry))}</div></div>
      </div>
      <div className="mt-1 flex justify-end">{actions}</div>
    </div>
    <div className="hidden lg:grid lg:grid-cols-[30px_minmax(110px,1fr)_105px_86px_76px_112px_50px_144px] lg:items-center lg:gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper text-[11px] font-bold text-muted">{index+1}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-ink" title={entry.title}>{entry.title || t(lang,'entry')}</span>
      <span className="truncate text-xs font-medium tabular-nums text-muted">{entry.date}</span>
      <span className="truncate text-sm font-medium tabular-nums">{entry.quantity}</span>
      <span className="truncate text-sm font-medium tabular-nums">₹{entry.price}</span>
      <span className="truncate text-sm font-bold tabular-nums text-brand">{formattedRupees(rowAmount(entry))}</span>
      {check}
      {actions}
    </div>
  </article>;
}
export default memo(EntryRow);
