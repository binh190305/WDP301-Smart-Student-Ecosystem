import { useEffect, useState } from 'react';
import { announcementApi, courseApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, LoadingState, EmptyState, ConfirmDialog } from '../../components/common';
import Icon from '../../components/common/Icon';
import PageHeader from '../../components/layout/PageHeader';
import { formatRelative } from '../../utils/format';

const AUDIENCE_LABELS = { all: 'Tất cả', students: 'Sinh viên', lecturers: 'Giảng viên' };

const emptyForm = { title: '', content: '', scope: 'global', course: '', audience: 'all', broadcast: false };

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [annRes, courseRes] = await Promise.all([
        announcementApi.list({ limit: 50, search: search.trim().length >= 2 ? search.trim() : undefined }),
        isAdmin ? Promise.resolve({ data: [] }) : courseApi.list({ mine: 'true', limit: 100 }),
      ]);
      setItems(annRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin, search]);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        scope: form.scope,
        audience: form.audience,
        course: form.scope === 'course' ? form.course : null,
      };
      if (isAdmin && form.broadcast) {
        await announcementApi.broadcast(payload);
      } else {
        await announcementApi.create(payload);
      }
      toast.success('Đã đăng thông báo');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (item) => {
    try {
      await announcementApi.update(item._id, { status: item.status === 'published' ? 'hidden' : 'published' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await announcementApi.remove(toDelete._id);
      toast.success('Đã xóa thông báo');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Thông báo hệ thống' : 'Thông báo học phần'}
        description={isAdmin ? 'Phát thông báo toàn hệ thống hoặc tới từng nhóm đối tượng.' : 'Gửi thông báo tới sinh viên trong các học phần bạn phụ trách.'}
        action={
          <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
            <Icon name="plus" className="h-4 w-4" /> Tạo thông báo
          </Button>
        }
      />

      <div className="mb-5 max-w-md">
        <Input id="managed-announcement-search" label="Tìm thông báo" placeholder="Tìm theo tiêu đề hoặc nội dung" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có thông báo" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item._id} className="hover:border-stone-300 dark:hover:border-neutral-600 transition">
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{item.title}</p>
                      {item.isBroadcast && <Badge tone="accent">Toàn hệ thống</Badge>}
                      {item.scope === 'course' && item.course && <Badge tone="brand">{item.course.code}</Badge>}
                      <Badge tone="neutral">{AUDIENCE_LABELS[item.audience]}</Badge>
                      {item.status === 'hidden' && <Badge tone="danger">Đã ẩn</Badge>}
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{item.content}</p>
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">{item.author?.name} · {formatRelative(item.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(item)}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 transition bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    >
                      {item.status === 'published' ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(item)}
                      className="rounded-lg p-1.5 text-stone-400 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tạo thông báo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={submit} loading={saving}>Đăng</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Nội dung" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
          <div className="grid gap-4 sm:grid-cols-2">
            {!isAdmin && (
              <Select label="Phạm vi" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="global">Chung</option>
                <option value="course">Theo học phần</option>
              </Select>
            )}
            <Select label="Đối tượng" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Tất cả</option>
              <option value="students">Sinh viên</option>
              <option value="lecturers">Giảng viên</option>
            </Select>
          </div>
          {!isAdmin && form.scope === 'course' && (
            <Select label="Học phần" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">-- Chọn học phần --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
              ))}
            </Select>
          )}
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.broadcast} onChange={(e) => setForm({ ...form, broadcast: e.target.checked })} />
              Đánh dấu là thông báo phát toàn hệ thống
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Xóa thông báo"
        message={`Xóa thông báo "${toDelete?.title}"?`}
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default AnnouncementsPage;
