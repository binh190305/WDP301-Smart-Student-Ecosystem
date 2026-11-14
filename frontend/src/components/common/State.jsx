import { cn } from '../../utils/cn';

export const Spinner = ({ className }) => (
  <span
    className={cn('inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent', className)}
  />
);

export const LoadingState = ({ label = 'Đang tải dữ liệu...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500 dark:text-stone-400">
    <Spinner />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState = ({ title = 'Chưa có dữ liệu', description, icon, action }) => (
  <div className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-stone-200/90 dark:border-neutral-700 bg-stone-50/40 dark:bg-neutral-800/30 p-12 text-center transition hover:border-violet-200 dark:hover:border-violet-800">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100/60 dark:border-violet-900/60">
      {icon || (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )}
    </div>
    <div className="space-y-1">
      <p className="font-bold text-stone-800 dark:text-stone-200 text-sm tracking-tight">{title}</p>
      {description && <p className="max-w-md text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>}
    </div>
    {action && <div className="pt-1">{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Đã xảy ra lỗi', onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
        Thử lại
      </button>
    )}
  </div>
);
