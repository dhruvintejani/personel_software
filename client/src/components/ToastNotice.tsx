import { createPortal } from 'react-dom';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';

export type ToastData = { id: number; message: string; kind: 'success' | 'error' };

export default function ToastNotice({ notice, onDismiss }: { notice: ToastData | null; onDismiss: () => void }) {
  if (!notice) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 top-[max(16px,env(safe-area-inset-top))] z-[120] flex justify-center sm:inset-x-auto sm:right-5 sm:justify-end"
      role="status" aria-live="polite">
      <div key={notice.id} className={`pointer-events-auto flex w-full max-w-[360px] items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-xl ${notice.kind === 'error' ? 'border-red-200' : 'border-emerald-200'}`}>
        {notice.kind === 'error' ? <CircleAlert size={19} className="shrink-0 text-red-600"/> : <CheckCircle2 size={19} className="shrink-0 text-emerald-600"/>}
        <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{notice.message}</span>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-paper"><X size={16}/></button>
      </div>
    </div>, document.body
  );
}
