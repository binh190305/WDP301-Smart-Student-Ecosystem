import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_BY_ROLE } from '../../routes/navigation';
import { ROLE_LABELS } from '../../utils/constants';
import { cn } from '../../utils/cn';
import Icon from '../common/Icon';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const sections = NAV_BY_ROLE[user?.role] || [];
  const activePath = sections
    .flatMap((section) => section.items)
    .filter((item) => pathname === item.to || (!item.end && pathname.startsWith(`${item.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-stone-900/40 dark:bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shadow-xs',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header — Warm Academic with Violet gradient */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-stone-100 dark:border-neutral-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 shadow-md shadow-violet-500/25">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-stone-900 dark:text-stone-100 block leading-tight">
              STE
            </span>
            <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-400 block leading-tight">
              Smart Student Ecosystem
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-300 pt-2 pb-1">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = activePath === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-violet-50 text-violet-700 font-bold border-l-[3px] border-violet-600 shadow-2xs dark:bg-violet-900/50 dark:text-violet-200 dark:border-violet-400'
                        : 'text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-violet-700 dark:hover:text-white hover:translate-x-0.5'
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform',
                        isActive ? 'text-violet-600 dark:text-violet-300 scale-105' : 'text-stone-400 dark:text-stone-300'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Role badge card & Theme toggle */}
        <div className="p-3 border-t border-stone-100 dark:border-neutral-800 space-y-2 bg-stone-50/50 dark:bg-neutral-900/60">
          <div className="rounded-xl bg-white dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 p-2.5 shadow-xs">
            <p className="text-[10px] text-stone-400 dark:text-stone-300 font-bold uppercase tracking-wider">
              Đang hoạt động với vai trò
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-100">
                {ROLE_LABELS[user?.role] || user?.role || 'Sinh viên'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 rounded-xl bg-stone-100/90 dark:bg-neutral-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all',
                theme === 'light'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/70 dark:bg-neutral-700 dark:text-stone-100 dark:border-neutral-600'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-300 dark:hover:text-white'
              )}
            >
              <span>☀️</span> Sáng
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all',
                theme === 'dark'
                  ? 'bg-violet-600 text-white shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-300 dark:hover:text-white'
              )}
            >
              <span>🌙</span> Tối
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
