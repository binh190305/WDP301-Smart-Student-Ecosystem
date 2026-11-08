import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/common';
import AuthShell from './AuthShell';
import GoogleLoginButton from './GoogleLoginButton';

const RegisterPage = () => {
  const { register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', major: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Tạo tài khoản thành công. Chào mừng bạn đến với STE!');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async (credential) => {
    try {
      const { isNew } = await loginWithGoogle(credential);
      toast.success(isNew ? 'Tạo tài khoản bằng Google thành công! Hãy cập nhật hồ sơ của bạn' : 'Email này đã có tài khoản, bạn đã được đăng nhập');
      navigate(isNew ? '/app/profile' : '/app', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell title="Đăng ký sinh viên" subtitle="Tạo tài khoản để bắt đầu tìm nhóm và ôn tập cùng STE">
      <form onSubmit={submit} className="space-y-4">
        <Input
          id="name"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          id="email"
          label="Email trường"
          type="email"
          placeholder="tenban@fpt.edu.vn"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          id="major"
          label="Chuyên ngành"
          placeholder="Kỹ thuật phần mềm"
          value={form.major}
          onChange={(e) => setForm({ ...form, major: e.target.value })}
        />
        <Input
          id="password"
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Đăng ký
        </Button>
      </form>

      <GoogleLoginButton onCredential={submitGoogle} text="signup_with" />

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
