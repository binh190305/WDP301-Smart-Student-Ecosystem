import { cn } from '../../utils/cn';
import Icon from './Icon';

const TONES = {
  brand: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-600 border border-violet-200/50 dark:from-violet-500/20 dark:to-purple-500/20 dark:text-violet-400 dark:border-violet-800/50',
  accent: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-200/50 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-400 dark:border-amber-800/50',
  success: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 border border-emerald-200/50 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-400 dark:border-emerald-800/50',
  violet: 'bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 text-purple-600 border border-purple-200/50 dark:from-purple-500/20 dark:to-fuchsia-500/20 dark:text-purple-400 dark:border-purple-800/50',
};

const StatCard = ({ label, value, icon, tone = 'brand', hint }) => (
  <div className="card-bento flex items-center gap-4">
    <span className={cn('flex h-13 w-13 items-center justify-center rounded-2xl shadow-sm', TONES[tone])}>
      <Icon name={icon} className="h-6 w-6" />
    </span>
    <div>
      <p className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      {hint && <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{hint}</p>}
    </div>
  </div>
);

export default StatCard;
