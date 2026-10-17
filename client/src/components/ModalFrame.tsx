import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type Props = {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
  maxWidth?: string;
};

/** Shared keyboard-accessible dialog shell for both name and entry forms. */
export default function ModalFrame({ title, onClose, busy = false, children, maxWidth = 'max-w-[480px]' }: Props) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focus = containerRef.current?.querySelector<HTMLElement>('[data-autofocus], input, button:not([disabled])');
    focus?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) onCloseRef.current();
      }
      if (event.key === 'Tab') {
        const controls = Array.from(containerRef.current?.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), button:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        ) ?? []);
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={`w-full ${maxWidth} max-h-[min(92dvh,800px)] overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" disabled={busy} onClick={onClose} className="icon-button" aria-label="Close"><X size={19}/></button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}
