import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_LABELS } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import NotificationBell from './NotificationBell';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate('/app/profile');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200/80 dark:border-neutral-800 bg-white/95 dark:bg-[#1a1a1a]/95 px-4 py-3 backdrop-blur-xl lg:px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition lg:hidden"
          aria-label="Mở menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Chào buổi sáng, {user?.name || 'Bạn'} 👋
            </p>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-300">Cùng STE phát triển kỹ năng và kết nối cộng đồng học thuật.</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Theme Toggle Button in Topbar */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200/80 bg-stone-50 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-stone-200 dark:hover:bg-neutral-700 dark:hover:text-white"
        >
          {theme === 'dark' ? (
            <span className="text-sm">☀️</span>
          ) : (
            <span className="text-sm">🌙</span>
          )}
        </button>

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          {/* Clickable Profile Pill */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-neutral-800 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 focus:outline-none"
            title="Nhấp để xem hồ sơ & tùy chọn"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight">{user?.name}</span>
              <span className="block text-[10px] text-brand-600 dark:text-brand-300 font-medium leading-tight">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
            <svg className={`h-4 w-4 text-stone-400 dark:text-stone-300 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="animate-fadeIn absolute right-0 mt-2.5 w-64 rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
              {/* Profile Card Header */}
              <div
                onClick={handleProfileClick}
                className="group cursor-pointer rounded-xl bg-gradient-to-br from-violet-50/70 via-purple-50/50 to-stone-50 dark:from-neutral-800 dark:via-violet-950/40 dark:to-neutral-800 p-3 border border-violet-100/60 dark:border-neutral-700 transition hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{user?.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-300 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-violet-100/70 dark:bg-violet-900/60 text-violet-700 dark:text-violet-200 px-2 py-0.5 rounded-full border border-violet-200/50 dark:border-violet-700">
                      {ROLE_LABELS[user?.role] || user?.role}
                    </span>
                  </div>
                  <span className="text-stone-400 dark:text-stone-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition text-sm">→</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="mt-2 space-y-1">
                <Link
                  to="/app/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition"
                >
                  <Icon name="user" className="h-4 w-4 text-stone-400 dark:text-stone-300" />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  to="/app/skill-intelligence/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition"
                >
                  <Icon name="sparkles" className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                  <span>Hồ sơ năng lực & AI</span>
                </Link>

                <Link
                  to="/app/profile/change-password"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition"
                >
                  <Icon name="lock" className="h-4 w-4 text-stone-400 dark:text-stone-300" />
                  <span>Đổi mật khẩu</span>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="mt-2 pt-2 border-t border-stone-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
