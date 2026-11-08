import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../api';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise = null;

// Nạp script Google Identity Services một lần cho cả ứng dụng
const loadGis = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        gisPromise = null;
        reject(new Error('Không tải được Google Sign-In'));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
};

/**
 * Nút "Đăng nhập với Google". onCredential nhận ID token (JWT) Google trả về.
 * Ẩn hoàn toàn khi backend chưa cấu hình GOOGLE_CLIENT_ID.
 */
const GoogleLoginButton = ({ onCredential, text = 'signin_with' }) => {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  // undefined = đang tải / lỗi; null = backend chưa cấu hình
  const [clientId, setClientId] = useState(undefined);
  const [failed, setFailed] = useState(false);

  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    authApi
      .googleConfig()
      .then((res) => !cancelled && setClientId(res.data.clientId))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          locale: 'vi',
          width: containerRef.current.offsetWidth || 320,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  const divider = (
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      hoặc
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );

  // Chưa cấu hình: bản production ẩn nút; khi dev thì hiện nút mờ kèm hướng dẫn
  if (!clientId) {
    if (!import.meta.env.DEV || clientId === undefined) return null;
    return (
      <div>
        {divider}
        <button
          type="button"
          disabled
          className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-500 opacity-70"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Đăng nhập với Google
        </button>
        <p className="mt-2 text-center text-xs text-amber-600">
          Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env (chỉ hiện khi chạy dev).
        </p>
      </div>
    );
  }

  return (
    <div>
      {divider}
      {failed ? (
        <p className="text-center text-sm text-slate-500">Không tải được nút đăng nhập Google, vui lòng tải lại trang.</p>
      ) : (
        <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
      )}
    </div>
  );
};

export default GoogleLoginButton;
