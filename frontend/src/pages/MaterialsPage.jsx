import { useEffect, useState } from 'react';
import { courseApi, materialApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Modal,
  LoadingState,
  EmptyState,
  ConfirmDialog,
  Badge,
} from '../components/common';
import Icon from '../components/common/Icon';
import PageHeader from '../components/layout/PageHeader';
import { formatFileSize, formatRelative } from '../utils/format';
import { downloadProtectedFile } from '../utils/download';

const MaterialsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ['lecturer', 'admin'].includes(user?.role);

  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ course: '', title: '', description: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ course: '', title: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadCourses = async () => {
    try {
      const res = await courseApi.list({ limit: 100 });
      setCourses(res.data);
    } catch {
      setCourses([]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (courseFilter) params.course = courseFilter;
      if (search) params.search = search;
      const res = await materialApi.list(params);
      setMaterials(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    load();
  }, [courseFilter]);

  const download = async (material) => {
    setDownloadingId(material._id);
    try {
      await downloadProtectedFile(() => materialApi.download(material._id), material.fileName || material.title || 'material-download');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const submitUpload = async () => {
    if (!uploadForm.file || !uploadForm.course || !uploadForm.title) {
      toast.error('Vui lòng chọn học phần, nhập tiêu đề và chọn tệp');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('course', uploadForm.course);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      await materialApi.upload(formData);
      toast.success('Đã tải tài liệu lên');
      setUploadOpen(false);
      setUploadForm({ course: '', title: '', description: '', file: null });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (material) => {
    setEditing(material);
    setEditForm({
      course: material.course?._id || '',
      title: material.title,
      description: material.description || '',
    });
  };

  const submitEdit = async () => {
    if (!editForm.title || !editForm.course) {
      toast.error('Vui lòng chọn học phần và nhập tiêu đề');
      return;
    }
    setSavingEdit(true);
    try {
      await materialApi.update(editing._id, editForm);
      toast.success('Đã cập nhật tài liệu');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await materialApi.remove(toDelete._id);
      toast.success('Đã xóa tài liệu');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-sm font-bold">
              📚
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              {canManage ? 'Tài liệu giảng dạy' : 'Tài liệu học tập'}
            </h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-300 mt-1">
            Kho tài liệu, giáo trình và bài giảng chính quy do giảng viên biên soạn và cập nhật.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setUploadOpen(true)} className="shadow-md shadow-violet-500/20">
            <Icon name="upload" className="h-4 w-4" /> Tải tài liệu lên
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card-bento p-4 bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Select className="w-full sm:w-72" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">Tất cả học phần</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.code} — {course.title}
            </option>
          ))}
        </Select>

        <form
          className="flex gap-2 w-full sm:flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-neutral-700 rounded-xl bg-stone-50/70 dark:bg-neutral-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-neutral-750 dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-xs text-stone-400">🔍</span>
          </div>
          <Button type="submit" variant="secondary" className="text-xs font-bold">
            Tìm
          </Button>
        </form>
      </div>

      {loading ? (
        <LoadingState />
      ) : materials.length === 0 ? (
        <EmptyState title="Chưa có tài liệu" description="Chưa có tài liệu nào cho bộ lọc hiện tại." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material._id} className="flex h-full flex-col">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">
                    <Icon name="materials" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{material.title}</p>
                    <Badge tone="neutral" className="mt-1">{material.course?.code}</Badge>
                  </div>
                </div>
                {material.description && <p className="mt-2 line-clamp-2 text-sm text-stone-500 dark:text-stone-300">{material.description}</p>}
                <p className="mt-2 text-xs text-stone-400 dark:text-stone-400">
                  {formatFileSize(material.size)} · {material.downloadCount} lượt tải · {formatRelative(material.createdAt)}
                </p>

                <div className="mt-auto flex gap-2 pt-4">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => download(material)} loading={downloadingId === material._id}>
                    <Icon name="download" className="h-4 w-4" /> Tải xuống
                  </Button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(material)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(material)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Tải tài liệu lên"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>Hủy</Button>
            <Button onClick={submitUpload} loading={uploading}>Tải lên</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Học phần" value={uploadForm.course} onChange={(e) => setUploadForm({ ...uploadForm, course: e.target.value })}>
            <option value="">-- Chọn học phần --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} — {course.title}
              </option>
            ))}
          </Select>
          <Input label="Tiêu đề tài liệu" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} />
          <Input label="Mô tả" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
          <div>
            <label className="label-base">Tệp tài liệu (PDF, DOCX, PPTX, TXT...)</label>
            <input
              type="file"
              className="input-base"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
            />
            <p className="mt-1 text-xs text-slate-400">Hỗ trợ PDF, DOCX, PPTX, TXT... tối đa theo giới hạn hệ thống.</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Chỉnh sửa tài liệu"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={submitEdit} loading={savingEdit}>Lưu thay đổi</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Học phần" value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}>
            <option value="">-- Chọn học phần --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} — {course.title}
              </option>
            ))}
          </Select>
          <Input label="Tiêu đề tài liệu" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Input label="Mô tả" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Xóa tài liệu"
        message={`Xóa tài liệu "${toDelete?.title}"?`}
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default MaterialsPage;
