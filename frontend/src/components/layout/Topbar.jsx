import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import NotificationBell from './NotificationBell';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Mở menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-800">Xin chào, {user?.name?.split(' ').slice(-1)[0]} 👋</p>
          <p className="text-xs text-slate-400">Chúc bạn một ngày học tập hiệu quả</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          {/* Clickable Profile Pill */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3 transition-all duration-200 hover:bg-slate-100 border border-transparent hover:border-slate-200 focus:outline-none"
            title="Nhấp để xem hồ sơ & tùy chọn"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">{user?.name}</span>
              <span className="block text-[10px] text-brand-600 font-medium leading-tight">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
            <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* SaaS 2026 Glassmorphic Dropdown */}
          {menuOpen && (
            <div className="animate-fadeIn absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl z-50">
              {/* Profile Card Header - Clickable to open Profile */}
              <div
                onClick={handleProfileClick}
                className="group cursor-pointer rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 p-3 border border-indigo-100/60 transition hover:border-indigo-300 hover:shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-indigo-100/70 text-indigo-700 px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[user?.role] || user?.role}
                    </span>
                  </div>
                  <span className="text-slate-400 group-hover:text-indigo-600 transition text-sm">→</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="mt-2 space-y-1">
                <Link
                  to="/app/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-600"
                >
                  <span className="text-sm">👤</span>
                  <span>Xem & Chỉnh sửa Hồ sơ</span>
                </Link>

                {user?.role === 'student' && (
                  <Link
                    to="/app/skill-intelligence/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <span className="text-sm">✨</span>
                    <span>Hồ sơ kỹ năng AI</span>
                  </Link>
                )}

                <Link
                  to="/app/profile/change-password"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="text-sm">🔒</span>
                  <span>Đổi mật khẩu</span>
                </Link>
              </div>

              <div className="my-1.5 border-t border-slate-100" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Icon name="logout" className="h-4 w-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
