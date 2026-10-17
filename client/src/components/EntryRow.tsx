import { memo, useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { t } from '../lib/i18n';
import { formattedRupees, rowAmount } from '../lib/types';
import type { Entry, EntryPatch, Language } from '../lib/types';

type Props = {
  entry: Entry;
  index: number;
  lang: Language;
  onUpdate: (id: string, patch: EntryPatch) => void;
  onFlush: (id: string) => Promise<void>;
  onMove: (entry: Entry, next: string) => void;
  onDelete: (entry: Entry) => void;
};

function EntryRow({ entry, index, lang, onUpdate, onFlush, onMove, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
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

  return <article className="entry-card rounded-2xl border border-line bg-white px-3 py-3 shadow-soft sm:px-4 sm:py-3.5">
    <div className="mb-2.5 flex min-w-0 items-center gap-2">
      <span className="flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md bg-paper px-1.5 text-[11px] font-bold tabular-nums text-muted">{String(index+1).padStart(2,'0')}</span>
      <input type="text" maxLength={120} value={entry.title} onChange={e=>onUpdate(entry._id,{title:e.target.value})} onBlur={()=>void onFlush(entry._id)}
        className="min-w-0 flex-1 border-0 bg-transparent py-1 text-[14px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-400 focus:placeholder:text-slate-300 sm:text-[15px]"
        aria-label={t(lang,'titleOptional')} placeholder={t(lang,'titleOptional')}/>
      <label className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-muted" title={t(lang,'complete')}>
        <input type="checkbox" checked={entry.completed} onChange={e=>{onUpdate(entry._id,{completed:e.target.checked});void onFlush(entry._id);}}
          className="h-[18px] w-[18px] accent-brand" aria-label={`${t(lang,'entry')} ${index+1} ${t(lang,'complete')}`}/>
        <span className="hidden min-[420px]:inline">{t(lang,'done')}</span>
      </label>
      <button type="button" className="icon-button !h-8 !w-8" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} aria-label={t(lang,'more')}>
        {expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
      </button>
    </div>

    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(96px,1.2fr)] items-end gap-2 sm:grid-cols-[minmax(130px,1fr)_minmax(130px,1fr)_minmax(150px,1.4fr)] sm:gap-4 max-[359px]:grid-cols-2">
      <label className="block min-w-0"><span className="mb-1 block text-[11px] font-semibold text-muted">{t(lang,'quantity')}</span>
        <input aria-label={`${t(lang,'quantity')} ${index+1}`} type="number" min="0" step="any" inputMode="decimal" value={qty}
          onChange={e=>inputChange('quantity',e.target.value)} onBlur={()=>inputBlur('quantity')}
          className="input-base h-[43px] px-2.5 text-left font-semibold tabular-nums sm:px-3" placeholder="0"/>
      </label>
      <label className="block min-w-0"><span className="mb-1 block text-[11px] font-semibold text-muted">{t(lang,'price')}</span>
        <input aria-label={`${t(lang,'price')} ${index+1}`} type="number" min="0" step="any" inputMode="decimal" value={price}
          onChange={e=>inputChange('price',e.target.value)} onBlur={()=>inputBlur('price')}
          className="input-base h-[43px] px-2.5 text-left font-semibold tabular-nums sm:px-3"/>
      </label>
      <div className="min-w-0 pb-1 text-right max-[359px]:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-muted">{t(lang,'total')}</span>
        <div className="truncate text-[14px] font-bold tabular-nums text-brand sm:text-lg" title={formattedRupees(rowAmount(entry))}>{formattedRupees(rowAmount(entry))}</div>
      </div>
    </div>

    {expanded && <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
      <label className="min-w-0 flex-1"><span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted"><CalendarDays size={14}/>{t(lang,'changeDate')}</span>
        <input type="date" value={entry.date} onChange={e=>e.target.value && onMove(entry,e.target.value)} className="input-base h-10 max-w-[220px] px-2.5" aria-label={t(lang,'changeDate')}/>
      </label>
      <button type="button" onClick={()=>onDelete(entry)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16}/>{t(lang,'removeEntry')}</button>
    </div>}
    {entry.completed && <span className="sr-only"><Check/> {t(lang,'complete')}</span>}
  </article>;
}

export default memo(EntryRow);
