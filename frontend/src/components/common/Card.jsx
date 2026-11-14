import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border border-stone-200/80 bg-white text-stone-900 shadow-sm transition-all dark:border-neutral-700/80 dark:bg-[#1e1e1e] dark:text-stone-100',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className }) => (
  <div
    className={cn(
      'flex items-start justify-between gap-4 border-b border-stone-100 dark:border-neutral-800 px-5 py-4',
      className
    )}
  >
    <div>
      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs font-medium text-stone-500 dark:text-stone-300">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const CardBody = ({ className, children }) => (
  <div className={cn('p-5 text-stone-800 dark:text-stone-200', className)}>{children}</div>
);
