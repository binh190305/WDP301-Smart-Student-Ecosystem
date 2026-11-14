import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api';
import { formatRelative } from '../../utils/format';
import Icon from '../common/Icon';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await notificationApi.list({ limit: 8 });
      setItems(res.data);
      setUnread(res.unreadCount);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async (item) => {
    if (!item.isRead) {
      await notificationApi.markRead(item._id).catch(() => {});
    }
    setOpen(false);
    if (item.link) navigate(`/app${item.link}`);
    load();
  };

  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-xl p-2 text-stone-500 dark:text-stone-400 transition hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700 dark:hover:text-stone-200"
        aria-label="Thông báo"
      >
        <Icon name="bell" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Danh sách thông báo" className="animate-fade-in absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-stone-200/80 dark:border-neutral-700/80 bg-white dark:bg-[#1e1e1e] shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 px-4 py-3">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Thông báo</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-400 dark:text-stone-500">Chưa có thông báo nào</p>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleOpen(item)}
                  className={`flex w-full flex-col items-start gap-1 border-b border-stone-100 dark:border-neutral-800/60 px-4 py-3 text-left transition hover:bg-stone-50 dark:hover:bg-neutral-800/60 ${
                    item.isRead ? '' : 'bg-violet-50/50 dark:bg-violet-950/25'
                  }`}
                >
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.message}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{formatRelative(item.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
