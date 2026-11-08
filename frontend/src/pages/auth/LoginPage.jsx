import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/common';
import AuthShell from './AuthShell';
import GoogleLoginButton from './GoogleLoginButton';

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Đăng nhập thành công');
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async (credential) => {
    try {
      const { isNew } = await loginWithGoogle(credential);
      if (isNew) {
        toast.success('Tạo tài khoản bằng Google thành công! Hãy cập nhật hồ sơ của bạn');
        navigate('/app/profile', { replace: true });
      } else {
        toast.success('Đăng nhập thành công');
        navigate(location.state?.from?.pathname || '/app', { replace: true });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn trở lại với hệ sinh thái học tập STE">
      <form onSubmit={submit} className="space-y-4">
        <Input
          id="email"
          label="Email trường"
          type="email"
          placeholder="tenban@fpt.edu.vn"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">Quên mật khẩu?</Link></div>
        <Input
          id="password"
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Đăng nhập
        </Button>
      </form>

      <GoogleLoginButton onCredential={submitGoogle} />

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
};

export default LoginPage;
