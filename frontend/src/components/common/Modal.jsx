import { useEffect } from 'react';
import { cn } from '../../utils/cn';

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const titleId = `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/25 dark:bg-black/40 backdrop-blur-sm transition-all" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn('animate-fade-in relative z-10 w-full rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-stone-100 dark:border-neutral-800 overflow-hidden', sizes[size])}>
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-800/50 px-6 py-4.5">
          <h3 id={titleId} className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-200/60 dark:hover:bg-neutral-700 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-stone-100 dark:border-neutral-800 bg-stone-50/40 dark:bg-neutral-800/40 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
