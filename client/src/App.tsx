import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ChevronRight, Edit3, Flower2, Layers3, Plus, Search, Trash2, UserRound, Wallet, X } from 'lucide-react';
import { api, ApiError } from './lib/api';
import { sectionLabel, t } from './lib/i18n';
import type { Language, Person, Section } from './lib/types';
import NameLedger from './components/NameLedger';
import ConfirmDialog from './components/ConfirmDialog';
import ModalFrame from './components/ModalFrame';
import ToastNotice, { type ToastData } from './components/ToastNotice';

function SectionIcon({ section, size = 19 }: { section: Section, size?: number }) {
  return section === 'buta' ? <Flower2 size={size} strokeWidth={1.9}/> : <Layers3 size={size} strokeWidth={1.9}/>;
}

export default function App() {
  const [section, setSection] = useState<Section>('buta');
  const [lang, setLang] = useState<Language>(() => localStorage.getItem('ledger-language') === 'en' ? 'en' : 'gu');
  const [selected, setSelected] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const toastCounter = useRef(0);

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({id:++toastCounter.current,message,kind:'success'});
    toastTimer.current = window.setTimeout(()=>setToast(null),1800);
  },[]);
  useEffect(()=>()=>window.clearTimeout(toastTimer.current),[]);

  useEffect(() => { localStorage.setItem('ledger-language', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    void api.getNames(section).then(list => { if (live) setPeople(list); })
      .catch(() => { if (live) setError(t(lang, 'loadError')); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
    // Do not refetch when changing language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, reloadKey]);

  const switchSection = (next: Section) => {
    if (next === section) { setSelected(null); return; }
    setSection(next); setSelected(null); setSearch(''); setForm(null); setPeople([]);
  };
  const filtered = useMemo(() => people.filter(p => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim())), [people, search]);

  const showForm = (mode: 'add' | 'edit', person?: Person) => {
    setForm({ mode, id: person?._id }); setNameValue(person?.name ?? ''); setFormError('');
  };
  const submitName = async (event: FormEvent) => {
    event.preventDefault();
    const value = nameValue.trim();
    if (!value || busy) return;
    setBusy(true); setFormError('');
    try {
      if (form?.mode === 'edit' && form.id) {
        const changed = await api.renameName(form.id, value);
        setPeople(old => old.map(p => p._id === changed._id ? changed : p));
        setSelected(s => s?._id === changed._id ? changed : s);
        notify(t(lang,'nameUpdated'));
      } else {
        const added = await api.addName(value, section);
        setPeople(old => [added, ...old]);
        setSearch('');
        notify(t(lang,'nameAdded'));
      }
      setForm(null); setNameValue('');
    } catch (cause) {
      setFormError(cause instanceof ApiError && cause.status === 409 ? t(lang, 'duplicate') : t(lang, 'genericError'));
    } finally { setBusy(false); }
  };
  const removePerson = async (person: Person) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api.deleteName(person._id);
      setPeople(old => old.filter(p => p._id !== person._id));
      if (selected?._id === person._id) setSelected(null);
      setDeleteTarget(null);
      notify(t(lang,'nameDeleted'));
    } catch { setError(t(lang, 'genericError')); setDeleteTarget(null); }
    finally { setBusy(false); }
  };

  const nav = (item: Section, mobile = false) => (
    <button key={item} type="button" onClick={() => switchSection(item)}
      aria-current={section === item ? 'page' : undefined}
      className={mobile
        ? `flex min-h-[55px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold ${section === item ? 'text-brand bg-accent/50' : 'text-muted'}`
        : `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors ${section === item ? 'bg-accent text-brand' : 'text-muted hover:bg-slate-100 hover:text-ink'}`}>
      <SectionIcon section={item} size={mobile ? 21 : 19} />
      {sectionLabel(lang, item)}
    </button>
  );

  return <div className="min-h-dvh bg-paper">
    <div className="mx-auto flex min-h-dvh max-w-[1440px]">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 self-start overflow-y-auto border-r border-line bg-white px-5 py-7 md:flex md:flex-col">
        <div className="mb-11 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white"><Wallet size={23}/></div>
          <div><div className="text-[17px] font-bold leading-tight text-ink">{t(lang,'app')}</div><div className="mt-1 text-xs text-muted">{t(lang,'subtitle')}</div></div>
        </div>
        <div className="mb-3 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t(lang,'names')}</div>
        <nav className="space-y-2">{nav('buta')}{nav('top')}</nav>
        <div className="mt-auto rounded-xl bg-paper p-4 text-xs leading-relaxed text-muted">{lang === 'gu' ? 'સરળ • ઝડપી • વ્યક્તિગત' : 'Simple • Fast • Personal'}</div>
      </aside>

      <div className="min-w-0 flex-1 pb-[84px] md:pb-0">
        <header className="sticky top-0 z-30 border-b border-line/90 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-[64px] max-w-[1100px] items-center justify-between gap-2 px-4 sm:px-7 md:h-[76px]">
            <div className="flex min-w-0 items-center gap-2.5">
              {selected && <button className="icon-button -ml-2" onClick={() => setSelected(null)} aria-label={t(lang,'back')}><ArrowLeft size={21}/></button>}
              <div className="min-w-0">
                <div className="truncate text-lg font-bold text-ink sm:text-xl">{selected ? selected.name : sectionLabel(lang, section)}</div>
                <div className="text-[11px] font-medium text-muted">{selected ? sectionLabel(lang,section) : t(lang,'subtitle')}</div>
              </div>
            </div>
            <button type="button" onClick={() => setLang(old => old === 'gu' ? 'en' : 'gu')}
              className="shrink-0 rounded-xl border border-line bg-paper px-3 py-2 text-[13px] font-semibold text-ink" aria-label="Switch language">
              {lang === 'gu' ? 'EN' : 'ગુજ'}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1100px] px-3 pb-9 pt-5 sm:px-7 sm:pt-7 md:pt-10">
          {error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span><div className="flex shrink-0 items-center gap-1"><button className="rounded-lg px-2 py-1 text-xs font-semibold underline" onClick={()=>setReloadKey(old=>old+1)}>{t(lang,'retry')}</button><button aria-label={t(lang,'close')} onClick={()=>setError('')}><X size={18}/></button></div>
          </div>}
          {selected ? <NameLedger key={selected._id} lang={lang} section={section} person={selected} notify={notify}/> : <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><h1 className="text-xl font-bold tracking-tight text-ink sm:text-[26px]">{t(lang,'names')}</h1>
                <p className="mt-1 text-xs text-muted sm:text-sm">{sectionLabel(lang,section)} · {people.length}</p></div>
              <button className="btn-primary shrink-0" onClick={() => showForm('add')}><Plus size={18}/>{t(lang,'addName')}</button>
            </div>
            <div className="relative mb-5">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={19}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t(lang,'searchNames')} aria-label={t(lang,'searchNames')} className="input-base h-[47px] pl-11 pr-10"/>
              {search && <button className="absolute right-2 top-1.5 icon-button" onClick={()=>setSearch('')} aria-label={t(lang,'close')}><X size={17}/></button>}
            </div>
            {loading ? <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">{t(lang,'loading')}</div>
              : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-14 text-center">
                <UserRound className="mx-auto mb-3 text-slate-300" size={35}/>
                <p className="font-semibold">{search ? t(lang,'noResults') : t(lang,'noNames')}</p>
                {!search && <p className="mt-1 text-sm text-muted">{t(lang,'noNamesHint')}</p>}
              </div> : <div className="space-y-2.5">
                {filtered.map(person => <div key={person._id} className="group flex min-w-0 items-center rounded-2xl border border-line bg-white p-1.5 shadow-soft transition-shadow hover:shadow-md">
                  <button className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left hover:bg-paper"
                    onClick={() => { setSelected(person); setForm(null); }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-brand"><UserRound size={19}/></span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{person.name}</span>
                    <ChevronRight size={18} className="shrink-0 text-slate-400"/>
                  </button>
                  <button className="icon-button h-9 w-9" title={t(lang,'rename')} aria-label={`${t(lang,'rename')}: ${person.name}`} onClick={()=>showForm('edit',person)}><Edit3 size={16}/></button>
                  <button className="icon-button h-9 w-9 hover:text-red-600" title={t(lang,'deleteName')} aria-label={`${t(lang,'deleteName')}: ${person.name}`} disabled={busy} onClick={()=>setDeleteTarget(person)}><Trash2 size={16}/></button>
                </div>)}
              </div>}
          </>}
        </main>
      </div>
    </div>
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-line bg-white px-4 pt-2 md:hidden" aria-label="Sections">
      {nav('buta',true)}{nav('top',true)}
    </nav>
    {form && <ModalFrame title={form.mode==='edit'?t(lang,'rename'):t(lang,'addName')} busy={busy} onClose={()=>setForm(null)}>
      <form onSubmit={e=>void submitName(e)} className="space-y-4 px-5 py-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">{t(lang,'name')}</span>
          <input data-autofocus required maxLength={80} value={nameValue} onChange={e=>setNameValue(e.target.value)}
            className="input-base h-11 px-3" placeholder={t(lang,'name')}/>
        </label>
        {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</div>}
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
          <button type="button" className="btn-secondary" disabled={busy} onClick={()=>setForm(null)}>{t(lang,'cancel')}</button>
          <button type="submit" className="btn-primary" disabled={busy || !nameValue.trim()}>{busy?'…':t(lang,'save')}</button>
        </div>
      </form>
    </ModalFrame>}
    {deleteTarget && <ConfirmDialog title={t(lang,'deleteName')} message={t(lang,'confirmDeleteName')}
      confirmLabel={t(lang,'deleteShort')} cancelLabel={t(lang,'cancel')} busy={busy}
      onConfirm={()=>void removePerson(deleteTarget)} onCancel={()=>setDeleteTarget(null)} />}
    <ToastNotice notice={toast} onDismiss={()=>{window.clearTimeout(toastTimer.current);setToast(null);}}/>
  </div>;
}
