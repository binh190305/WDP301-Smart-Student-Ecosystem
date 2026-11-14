import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-violet-600 via-brand-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800 shadow-md shadow-brand-500/20 active:scale-[0.98]',
  secondary: 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50 hover:border-stone-300 dark:bg-neutral-800 dark:text-stone-200 dark:border-neutral-700 dark:hover:bg-neutral-700 shadow-sm active:scale-[0.98]',
  accent: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 active:scale-[0.98]',
  danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 shadow-md shadow-red-500/20 active:scale-[0.98]',
  ghost: 'bg-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl',
  md: 'px-4.5 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-2xl',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-semibold outline-none transition-all duration-200 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  >
    {loading && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);

export default Button;
