import { cn } from '../../utils/cn';

const toneForScore = (score) => {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700';
  if (score >= 45) return 'text-amber-700 bg-amber-50 border border-amber-200/60 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700';
  return 'text-stone-700 bg-stone-100 border border-stone-200/60 dark:bg-neutral-800 dark:text-stone-200 dark:border-neutral-600';
};

export const MatchScoreBadge = ({ score }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm', toneForScore(score))}>
    <span className="text-base leading-none">◆</span>
    {score}% phù hợp
  </span>
);

const LABELS = {
  gpa: 'GPA',
  skills: 'Kỹ năng',
  interests: 'Sở thích',
  major: 'Ngành học',
  description: 'Mô tả',
};

export const MatchBreakdown = ({ breakdown }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
    {Object.entries(breakdown).map(([key, value]) => (
      <div key={key}>
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-stone-600 dark:text-stone-300">
          <span>{LABELS[key] || key}</span>
          <span className="font-bold text-stone-800 dark:text-stone-100">{Math.round(value * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-700">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600" style={{ width: `${Math.round(value * 100)}%` }} />
        </div>
      </div>
    ))}
  </div>
);
