import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => {
      const showToast = (message, tone = 'info') => {
        if (tone === 'warning') tone = 'info';
        push(message, tone);
      };
      return {
        showToast,
        push,
        success: (message) => push(message, 'success'),
        error: (message) => push(message, 'error'),
        info: (message) => push(message, 'info'),
        warning: (message) => push(message, 'info'),
      };
    },
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'animate-fade-in rounded-xl border px-4 py-3 text-sm font-medium shadow-float',
              TONE_STYLES[toast.tone]
            )}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong ToastProvider');
  return ctx;
};
