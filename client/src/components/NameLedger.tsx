import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, CircleAlert, ClipboardList, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { t } from '../lib/i18n';
import type { Entry, EntryPatch, Language, Person, Section } from '../lib/types';
import { formattedRupees, localToday, rowAmount } from '../lib/types';
import EntryRow from './EntryRow';
import ConfirmDialog from './ConfirmDialog';

type Props = { lang: Language; section: Section; person: Person };
type SaveState = 'saved' | 'saving' | 'error';
type Filter = 'all' | 'pending' | 'done';

export default function NameLedger({ lang, section, person }: Props) {
  const [date, setDate] = useState(localToday);
  const activeDate = useRef(date);
  activeDate.current = date;
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pending = useRef<Record<string, EntryPatch>>({});
  const timers = useRef<Record<string, number>>({});
  const inFlight = useRef(new Set<string>());
  const deleted = useRef(new Set<string>());

  const flush = useCallback(async (id: string) => {
    if (inFlight.current.has(id) || deleted.current.has(id)) return;
    const patch = pending.current[id];
    if (!patch) return;
    delete pending.current[id];
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    inFlight.current.add(id);
    let failed = false;
    try {
      await api.patchEntry(id, patch);
      if (!deleted.current.has(id)) setError('');
    } catch {
      if (!deleted.current.has(id)) {
        pending.current[id] = { ...patch, ...pending.current[id] };
        setError(t(lang, 'saveError'));
        setSaveState('error');
        failed = true;
      }
    } finally {
      inFlight.current.delete(id);
      if (!failed && pending.current[id]) {
        timers.current[id] = window.setTimeout(() => void flush(id), 200);
      } else if (!failed && Object.keys(pending.current).length === 0 && inFlight.current.size === 0) {
        setSaveState('saved');
      }
    }
  }, [lang]);

  const updateRow = useCallback((id: string, patch: EntryPatch) => {
    setRows(old => old.map(row => row._id === id ? { ...row, ...patch } : row));
    pending.current[id] = { ...pending.current[id], ...patch };
    setSaveState('saving'); setError('');
    clearTimeout(timers.current[id]);
    timers.current[id] = window.setTimeout(() => void flush(id), 650);
  }, [flush]);

  useEffect(() => {
    let active = true;
    setLoading(true); setRows([]); setError(''); setSearch(''); setFilter('all'); setEditingId(null);
    void api.getEntries(person._id, date)
      .then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError(t(lang, 'loadError')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // Dates and people change the dataset. Language changes do not need a refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person._id, date]);

  // Unmount safeguard: send any last unsent keystrokes when switching person/page.
  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
    Object.entries(pending.current).forEach(([id, patch]) => {
      if (!deleted.current.has(id)) void api.patchEntry(id, patch, true).catch(() => {});
    });
  }, []);

  const changeDate = (next: string) => {
    if (!next || next === date) return;
    Object.keys(pending.current).forEach(id => void flush(id));
    setDate(next);
  };
  const addEntry = async () => {
    if (creating) return;
    setCreating(true); setError('');
    try {
      const entryDate = date;
      const created = await api.addEntry(person._id, {
        date: entryDate, title: '', quantity: 0, price: section === 'buta' ? 0.16 : 0.40, completed: false,
      });
      // A slow save must not add an old-date entry to a newly selected day.
      if (activeDate.current === entryDate) {
        setRows(old => [created, ...old]);
        setEditingId(created._id);
        setFilter('all'); setSearch('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch { setError(t(lang, 'genericError')); }
    finally { setCreating(false); }
  };
  const removeEntry = async (entry: Entry) => {
    if (deleting) return;
    setDeleting(true);
    deleted.current.add(entry._id);
    delete pending.current[entry._id];
    clearTimeout(timers.current[entry._id]);
    setRows(old => old.filter(row => row._id !== entry._id));
    try {
      await api.deleteEntry(entry._id);
      if (editingId === entry._id) setEditingId(null);
      setDeleteTarget(null);
    } catch {
      deleted.current.delete(entry._id);
      setRows(old => [...old, entry].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(t(lang, 'genericError'));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };
  const moveEntry = (entry: Entry, next: string) => {
    if (entry.date === next) return;
    updateRow(entry._id, { date: next });
    setRows(old => old.filter(row => row._id !== entry._id));
    // Important: moving keeps every other pending field in the same PATCH.
    void flush(entry._id);
  };
  const total = useMemo(() => rows.reduce((sum, row) => sum + rowAmount(row), 0), [rows]);
  const visible = useMemo(() => rows.filter(row => {
    if (filter === 'pending' && row.completed) return false;
    if (filter === 'done' && !row.completed) return false;
    const q = search.trim().toLocaleLowerCase();
    return !q || row.title.toLocaleLowerCase().includes(q) || String(row.quantity).includes(q) || String(row.price).includes(q) || rowAmount(row).toFixed(2).includes(q);
  }), [rows, search, filter]);
  const trySaving = () => Object.keys(pending.current).forEach(id => void flush(id));

  return <div className="pb-[94px] md:pb-2">
    <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted"><ClipboardList size={14}/>{section === 'buta' ? t(lang,'buta') : t(lang,'top')} · {rows.length} {t(lang,'itemCount')}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button className="icon-button" type="button" aria-label={t(lang,'searchEntries')} aria-expanded={showSearch} onClick={()=>{setShowSearch(v=>!v);if(showSearch){setSearch('');setFilter('all');}}}><Search size={20}/></button>
        <div className="flex flex-col items-end gap-1">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${saveState==='error'?'text-red-600':'text-muted'}`} aria-live="polite">
          {saveState==='error'?<CircleAlert size={13}/>:<Check size={13}/>}
          {saveState==='error' ? (lang === 'gu' ? 'સચવાયું નથી' : 'Not saved') : t(lang,saveState==='saving'?'saving':'saved')}
        </span>
        {saveState==='error' && <button onClick={trySaving} className="text-xs font-semibold text-brand underline">{t(lang,'retry')}</button>}
        </div>
      </div>
    </div>

    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:mb-4">
      <label className="min-w-0">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted"><CalendarDays size={14}/>{t(lang,'date')}</span>
        <input aria-label={t(lang,'date')} type="date" value={date} onChange={e=>changeDate(e.target.value)} className="input-base h-[46px] px-3"/>
      </label>
      <button onClick={()=>void addEntry()} disabled={creating || loading} className="btn-primary h-[46px] whitespace-nowrap px-3 sm:px-5"><Plus size={18}/>{t(lang,'addEntry')}</button>
    </div>

    {showSearch && <div className="mb-3 flex gap-2 sm:mb-5">
      <div className="relative min-w-0 flex-1">
        <Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/>
        <input type="search" className="input-base h-11 pl-9 pr-2" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t(lang,'searchEntries')} aria-label={t(lang,'searchEntries')}/>
      </div>
      <select value={filter} onChange={e=>setFilter(e.target.value as Filter)} aria-label={t(lang,'all')} className="h-11 w-[100px] rounded-xl border border-line bg-white px-2 text-sm font-medium text-ink outline-none sm:w-[125px]">
        <option value="all">{t(lang,'all')}</option><option value="pending">{t(lang,'pending')}</option><option value="done">{t(lang,'done')}</option>
      </select>
    </div>}

    {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"><CircleAlert size={17} className="mt-0.5 shrink-0"/>{error}</div>}
    {loading ? <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-muted">Loading...</div>
      : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-14 text-center">
        <ClipboardList size={32} className="mx-auto mb-3 text-slate-300"/>
        <p className="font-semibold">{search || filter!=='all' ? t(lang,'noResults') : t(lang,'noEntries')}</p>
        {!search && filter==='all' && <p className="mt-1 text-sm text-muted">{t(lang,'noEntriesHint')}</p>}
      </div> : <div className="space-y-2.5">
        <div className="hidden lg:grid lg:grid-cols-[30px_minmax(80px,1fr)_70px_72px_108px_52px_152px] lg:gap-2 lg:px-4 lg:text-[11px] lg:font-semibold lg:text-muted">
          <span>#</span><span>{t(lang,'titleOptional')}</span><span>{t(lang,'quantity')}</span><span>{t(lang,'price')}</span><span>{t(lang,'total')}</span><span>{t(lang,'done')}</span><span>{t(lang,'actions')}</span>
        </div>
        {visible.map((row, idx) => <EntryRow key={row._id} index={idx} entry={row} lang={lang}
          editing={editingId===row._id} onToggleEdit={id=>setEditingId(old=>old===id?null:id)}
          onUpdate={updateRow} onFlush={flush} onMove={moveEntry} onDelete={setDeleteTarget}/>)}
      </div>}

    {rows.length>0 && <button onClick={()=>void addEntry()} disabled={creating} className="btn-secondary mt-4 w-full border-dashed"><Plus size={18}/>{t(lang,'addEntry')}</button>}

    <div className="safe-bottom fixed bottom-[calc(69px+env(safe-area-inset-bottom))] left-0 right-0 z-20 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-3px_15px_rgba(22,37,55,.05)] backdrop-blur-sm md:sticky md:bottom-0 md:mt-5 md:rounded-2xl md:border md:shadow-soft">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-2">
        <div className="min-w-0"><p className="text-[11px] font-semibold text-muted">{t(lang,'grandTotal')} · {t(lang,'daily')}</p><p className="mt-0.5 text-xs text-muted">{rows.length} {t(lang,'itemCount')}</p></div>
        <div className="truncate text-right text-xl font-bold tabular-nums text-brand sm:text-2xl">{formattedRupees(total)}</div>
      </div>
    </div>
    {deleteTarget && <ConfirmDialog title={t(lang,'removeEntry')} message={t(lang,'confirmDeleteEntry')}
      confirmLabel={t(lang,'deleteShort')} cancelLabel={t(lang,'cancel')}
      busy={deleting} onConfirm={()=>void removeEntry(deleteTarget)} onCancel={()=>setDeleteTarget(null)} />}
  </div>;
}
