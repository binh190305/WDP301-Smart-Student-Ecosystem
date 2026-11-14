import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-stone-100 text-stone-700 border border-stone-200/60 dark:bg-neutral-800 dark:text-stone-100 dark:border-neutral-700',
  brand: 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border border-violet-200/60 dark:from-violet-950/70 dark:to-purple-950/70 dark:text-violet-200 dark:border-violet-700 font-semibold',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700 font-semibold',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 font-semibold',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700 font-semibold',
  accent: 'bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-700 font-semibold',
  ai: 'bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 text-violet-700 border border-violet-200/60 dark:from-violet-900/50 dark:via-purple-900/50 dark:to-fuchsia-900/50 dark:text-violet-200 dark:border-violet-600 font-bold',
  violet: 'bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-700 font-semibold',
  cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60 dark:bg-cyan-950/70 dark:text-cyan-200 dark:border-cyan-700 font-semibold',
};

const Badge = ({ tone = 'neutral', className, children }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      TONES[tone],
      className
    )}
  >
    {children}
  </span>
);

export default Badge;
