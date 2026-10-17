import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { t } from '../lib/i18n';
import { formattedRupees, rowAmount } from '../lib/types';
import type { Entry, Language, Person, Section } from '../lib/types';
import EntryRow from './EntryRow';
import EntryFormModal, { type EntryFormValues } from './EntryFormModal';
import ConfirmDialog from './ConfirmDialog';

type Props = { lang: Language; section: Section; person: Person; notify: (message: string) => void };

export default function NameLedger({ lang, section, person, notify }: Props) {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; entry: Entry } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Keep checkbox saves isolated by entry ID. A network request for one row must
  // never disable, remount or update the other rows.
  const pendingCheckbox = useRef(new Map<string, boolean>());
  const confirmedCheckbox = useRef(new Map<string, boolean>());
  const writingCheckbox = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void api.getEntries(person._id)
      .then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError(t(lang,'loadError')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // Fetch only when a different person is selected.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person._id]);

  const total = useMemo(() => rows.reduce((sum,row)=>sum+rowAmount(row),0),[rows]);

  const saveEntry = async (data: EntryFormValues) => {
    if (form?.mode === 'edit') {
      const result = await api.patchEntry(form.entry._id, data);
      setRows(old=>old.map(row=>row._id===result._id?result:row));
      notify(t(lang,'entryUpdated'));
    } else {
      const created = await api.addEntry(person._id, data);
      setRows(old=>[created,...old]);
      notify(t(lang,'entryAdded'));
    }
    setForm(null);
    setError('');
  };

  const saveCheckbox = useCallback(async (id: string) => {
    if (writingCheckbox.current.has(id)) return;
    writingCheckbox.current.add(id);
    let savedAtLeastOnce = false;
    try {
      // Serial requests prevent a slower response from overwriting a newer click.
      while (pendingCheckbox.current.has(id)) {
        const next = pendingCheckbox.current.get(id)!;
        pendingCheckbox.current.delete(id);
        await api.patchEntry(id, { completed: next });
        confirmedCheckbox.current.set(id, next);
        savedAtLeastOnce = true;
      }
      // Keep the optimistic UI as-is. Replacing the complete MongoDB document
      // here caused a second render/flicker every time a checkbox was clicked.
      if (savedAtLeastOnce) notify(t(lang, 'entryUpdated'));
    } catch {
      pendingCheckbox.current.delete(id);
      const lastSaved = confirmedCheckbox.current.get(id);
      if (lastSaved !== undefined) {
        setRows(old => old.map(row => row._id === id && row.completed !== lastSaved
          ? { ...row, completed: lastSaved } : row));
      }
      setError(t(lang, 'saveError'));
    } finally {
      writingCheckbox.current.delete(id);
      if (pendingCheckbox.current.has(id)) void saveCheckbox(id);
    }
  }, [lang, notify]);

  const toggleDone = useCallback((entry: Entry, value: boolean) => {
    if (!confirmedCheckbox.current.has(entry._id)) {
      confirmedCheckbox.current.set(entry._id, entry.completed);
    }
    pendingCheckbox.current.set(entry._id, value);
    // Preserve the identity of every unrelated entry so React.memo skips them.
    setRows(old => old.map(row => row._id === entry._id && row.completed !== value
      ? { ...row, completed: value } : row));
    void saveCheckbox(entry._id);
  }, [saveCheckbox]);

  const editRow = useCallback((entry: Entry) => setForm({ mode: 'edit', entry }), []);
  const requestDelete = useCallback((entry: Entry) => setDeleteTarget(entry), []);

  const deleteEntry = async () => {
    const entry = deleteTarget;
    if (!entry || deleting) return;
    setDeleting(true);
    try {
      await api.deleteEntry(entry._id);
      setRows(old=>old.filter(r=>r._id!==entry._id));
      setDeleteTarget(null);
      notify(t(lang,'entryDeleted'));
    } catch { setError(t(lang,'genericError')); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  return <div className="pb-[96px] md:pb-3">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted">
        <ClipboardList size={15}/>{section === 'buta' ? t(lang,'buta') : t(lang,'top')} · {rows.length} {t(lang,'itemCount')}
      </div>
      <button className="btn-primary shrink-0" disabled={loading} onClick={()=>setForm({mode:'add'})}>
        <Plus size={18}/>{t(lang,'addEntry')}
      </button>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-muted">{t(lang,'loading')}</div>
      : rows.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-14 text-center">
        <ClipboardList size={32} className="mx-auto mb-3 text-slate-300"/>
        <p className="font-semibold">{t(lang,'noEntries')}</p>
        <p className="mt-1 text-sm text-muted">{t(lang,'noEntriesHint')}</p>
      </div> : <div className="space-y-2.5">
        <div className="hidden lg:grid lg:grid-cols-[30px_minmax(110px,1fr)_105px_86px_76px_112px_50px_144px] lg:gap-2 lg:px-4 lg:text-[11px] lg:font-semibold lg:text-muted">
          <span>#</span><span>{t(lang,'titleOptional')}</span><span>{t(lang,'date')}</span><span>{t(lang,'quantity')}</span>
          <span>{t(lang,'price')}</span><span>{t(lang,'total')}</span><span>{t(lang,'done')}</span><span>{t(lang,'actions')}</span>
        </div>
        {rows.map((row,index)=><EntryRow key={row._id} entry={row} index={index} lang={lang}
          onToggle={toggleDone} onEdit={editRow} onDelete={requestDelete}/>)}
      </div>}
    {rows.length>0 && <button type="button" className="btn-secondary mt-4 w-full border-dashed" onClick={()=>setForm({mode:'add'})}>
      <Plus size={18}/>{t(lang,'addEntry')}
    </button>}
    <div className="safe-bottom fixed bottom-[calc(69px+env(safe-area-inset-bottom))] left-0 right-0 z-20 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-3px_15px_rgba(22,37,55,.05)] backdrop-blur-sm md:sticky md:bottom-0 md:mt-5 md:rounded-2xl md:border md:shadow-soft">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-2">
        <div className="min-w-0"><p className="text-xs font-semibold text-muted">{t(lang,'grandTotal')}</p>
          <p className="text-xs text-muted">{rows.length} {t(lang,'itemCount')}</p></div>
        <div className="truncate text-right text-xl font-bold tabular-nums text-brand sm:text-2xl">{formattedRupees(total)}</div>
      </div>
    </div>
    {form && <EntryFormModal key={form.mode==='add'?'new':form.entry._id} lang={lang} section={section}
      entry={form.mode==='edit'?form.entry:undefined} onSave={saveEntry} onClose={()=>setForm(null)}/>}
    {deleteTarget && <ConfirmDialog title={t(lang,'removeEntry')} message={t(lang,'confirmDeleteEntry')}
      confirmLabel={t(lang,'deleteShort')} cancelLabel={t(lang,'cancel')} busy={deleting}
      onConfirm={()=>void deleteEntry()} onCancel={()=>setDeleteTarget(null)}/>}
  </div>;
}
