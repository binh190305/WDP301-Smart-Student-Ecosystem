import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api';
import { Card, CardBody, Button, Input, Textarea, TagInput, Badge } from '../components/common';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/layout/PageHeader';
import { ROLE_LABELS } from '../utils/constants';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === 'student';
  const [form, setForm] = useState({
    name: user?.name || '',
    major: user?.major || '',
    gpa: user?.gpa ?? '',
    description: user?.description || '',
    avatarUrl: user?.avatarUrl || '',
    skills: user?.skills || [],
    interests: user?.interests || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        major: form.major,
        description: form.description,
        avatarUrl: form.avatarUrl,
        skills: form.skills,
        interests: form.interests,
      };
      if (isStudent) payload.gpa = form.gpa === '' ? null : Number(form.gpa);
      const res = await userApi.updateProfile(payload);
      const updatedUser = res.data?.user || res.data;
      if (updatedUser) {
        setUser((prev) => ({ ...prev, ...updatedUser }));
        setForm((prev) => ({
          ...prev,
          name: updatedUser.name ?? prev.name,
          major: updatedUser.major ?? prev.major,
          gpa: updatedUser.gpa ?? prev.gpa,
          description: updatedUser.description ?? prev.description,
          avatarUrl: updatedUser.avatarUrl ?? prev.avatarUrl,
          skills: updatedUser.skills ?? prev.skills,
          interests: updatedUser.interests ?? prev.interests,
        }));
      }
      toast.success('Đã cập nhật hồ sơ');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await userApi.uploadAvatar(formData);
      setUser((prev) => ({ ...prev, ...res.data.user }));
      update({ avatarUrl: res.data.user.avatarUrl });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <PageHeader title="Hồ sơ cá nhân" description="Thông tin của bạn giúp hệ thống gợi ý ghép nhóm chính xác hơn." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={form.name} src={form.avatarUrl} size="lg" />
            <p className="mt-3 text-lg font-semibold text-slate-900">{form.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge tone="brand" className="mt-2">{ROLE_LABELS[user?.role]}</Badge>
            <label htmlFor="avatar-upload" className="mt-4 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700">{uploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh đại diện'}</label>
            <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploadingAvatar} className="sr-only" />
            {isStudent && (
              <div className="mt-4 w-full rounded-xl bg-slate-50 p-3 text-left">
                <p className="text-xs text-slate-400">GPA hiện tại</p>
                <p className="text-2xl font-bold text-brand-700">{form.gpa || '—'}</p>
              </div>
            )}
            <div className="mt-4 flex w-full flex-wrap gap-1.5">
              {form.skills.map((skill) => (
                <Badge key={skill} tone="neutral">{skill}</Badge>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="profile-name" label="Họ và tên" value={form.name} onChange={(e) => update({ name: e.target.value })} required />
                <Input id="profile-major" label="Chuyên ngành" value={form.major} onChange={(e) => update({ major: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {isStudent && (
                  <Input
                    label="GPA (0 - 4)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={form.gpa}
                    onChange={(e) => update({ gpa: e.target.value })}
                  />
                )}
                <Input
                  id="profile-avatar-url" label="Ảnh đại diện (URL)"
                  placeholder="https://..."
                  value={form.avatarUrl}
                  onChange={(e) => update({ avatarUrl: e.target.value })}
                />
              </div>

              <Textarea
                label="Giới thiệu bản thân"
                placeholder="Mô tả kinh nghiệm, định hướng và mong muốn khi tham gia nhóm..."
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={4}
              />

              <TagInput
                label="Kỹ năng"
                value={form.skills}
                onChange={(skills) => update({ skills })}
                hint="Ví dụ: React, Java, UI/UX, Machine Learning"
              />

              {isStudent && (
                <TagInput
                  label="Lĩnh vực quan tâm"
                  value={form.interests}
                  onChange={(interests) => update({ interests })}
                  hint="Ví dụ: Y tế số, Fintech, Startup"
                />
              )}

              <div className="flex justify-end">
                <Button type="submit" loading={saving}>Lưu thay đổi</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
