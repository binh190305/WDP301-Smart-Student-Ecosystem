import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseApi, lessonApi, materialApi, quizApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Card,
  CardBody,
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  LoadingState,
  EmptyState,
  ConfirmDialog,
} from '../components/common';
import Icon from '../components/common/Icon';
import PageHeader from '../components/layout/PageHeader';
import { downloadProtectedFile } from '../utils/download';

const emptyForm = { title: '', content: '', order: 0, materials: [], quiz: '' };

const MarkdownContent = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
            <pre className="whitespace-pre">{codeBuffer.join('\n')}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-black text-violet-700 dark:text-violet-400 mt-4 mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-600"></span>
          {trimmed.replace('### ', '')}
        </h4>
      );
    } else if (trimmed.startsWith('#### ')) {
      elements.push(
        <h5 key={i} className="text-xs font-bold text-stone-900 dark:text-stone-200 mt-3 mb-1.5">
          {trimmed.replace('#### ', '')}
        </h5>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={i} className="text-xs text-stone-800 dark:text-stone-200 ml-4 list-disc mb-1 leading-relaxed">
          {trimmed.slice(2)}
        </li>
      );
    } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      elements.push(
        <div key={i} className="text-[11px] font-mono text-stone-800 dark:text-stone-300 py-0.5 bg-stone-100/60 dark:bg-neutral-800/60 px-2 rounded">
          {trimmed}
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-xs text-stone-800 dark:text-stone-200 mb-2 leading-relaxed font-normal">
          {trimmed}
        </p>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
};

const CourseLessonsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'lecturer' || user?.role === 'admin';

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [courseMaterials, setCourseMaterials] = useState([]);
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonRes] = await Promise.all([courseApi.get(id), lessonApi.list(id)]);
      setCourse(courseRes.data.course);
      setLessons(lessonRes.data.lessons);
      setCompletedCount(lessonRes.data.completedCount);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!canManage) return;
    materialApi
      .list({ course: id, limit: 100 })
      .then((res) => setCourseMaterials(res.data))
      .catch(() => setCourseMaterials([]));
    quizApi
      .list({ course: id, limit: 100 })
      .then((res) => setCourseQuizzes(res.data))
      .catch(() => setCourseQuizzes([]));
  }, [id, canManage]);

  const toggleComplete = async (lesson) => {
    setBusyId(lesson._id);
    try {
      if (lesson.completed) await lessonApi.uncomplete(lesson._id);
      else await lessonApi.complete(lesson._id);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: lessons.length + 1 });
    setEditorOpen(true);
  };

  const openEdit = (lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      content: lesson.content || '',
      order: lesson.order || 0,
      materials: (lesson.materials || []).map((m) => m._id),
      quiz: lesson.quiz?._id || '',
    });
    setEditorOpen(true);
  };

  const toggleMaterial = (materialId) =>
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.includes(materialId)
        ? prev.materials.filter((mid) => mid !== materialId)
        : [...prev.materials, materialId],
    }));

  const save = async () => {
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề bài học');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        order: Number(form.order) || 0,
        materials: form.materials,
        quiz: form.quiz || null,
      };
      if (editing) {
        await lessonApi.update(editing._id, payload);
        toast.success('Đã cập nhật bài học');
      } else {
        payload.course = id;
        await lessonApi.create(payload);
        toast.success('Đã thêm bài học');
      }
      setEditorOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await lessonApi.remove(toDelete._id);
      toast.success('Đã xóa bài học');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const downloadMaterial = async (material) => {
    setDownloadingId(material._id);
    try {
      await downloadProtectedFile(() => materialApi.download(material._id), material.fileName || material.title || 'material-download');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingState />;

  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={course ? `${course.code} — Nội dung học phần` : 'Nội dung học phần'}
        description={course?.title || ''}
        action={
          <div className="flex gap-2">
            <Link to={isStudent ? '/app/course-catalog' : '/app/courses'}>
              <Button variant="secondary">Quay lại</Button>
            </Link>
            {canManage && (
              <Button onClick={openCreate}>
                <Icon name="plus" className="h-4 w-4" /> Thêm bài học
              </Button>
            )}
          </div>
        }
      />

      {isStudent && lessons.length > 0 && (
        <Card className="mb-5">
          <CardBody>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700 dark:text-stone-300">Tiến độ học tập</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {completedCount}/{lessons.length} bài · {percent}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-700">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </CardBody>
        </Card>
      )}

      {lessons.length === 0 ? (
        <EmptyState
          title="Chưa có bài học"
          description={canManage ? 'Bấm “Thêm bài học” để xây dựng nội dung học phần.' : 'Giảng viên chưa đăng nội dung.'}
        />
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div
              key={lesson._id}
              className="card-bento p-5 border border-stone-200/90 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] transition-all hover:border-violet-300 dark:hover:border-violet-700 shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                {isStudent && (
                  <button
                    type="button"
                    disabled={busyId === lesson._id}
                    onClick={() => toggleComplete(lesson)}
                    className={
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ' +
                      (lesson.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : 'border-stone-300 dark:border-neutral-600 text-transparent hover:border-violet-500')
                    }
                    title={lesson.completed ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === lesson._id ? null : lesson._id)}
                    className="flex w-full items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-xs font-black border border-violet-200/60 dark:border-violet-800">
                        Bài {index + 1}
                      </span>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                        {lesson.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {lesson.completed && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                          ✓ Đã xong
                        </span>
                      )}
                      <span className={`text-xs text-stone-400 dark:text-stone-500 transition-transform duration-200 ${expanded === lesson._id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded Lesson View */}
                  {expanded === lesson._id && (
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-neutral-800 space-y-5 animate-fade-in">
                      {/* 1. Core Learning Content / Theory */}
                      <div className="bg-stone-50/70 dark:bg-neutral-800/40 p-4 rounded-2xl border border-stone-100 dark:border-neutral-800/80">
                        <MarkdownContent content={lesson.content} />
                      </div>

                      {/* 2. Downloadable Materials & Slides */}
                      {lesson.materials?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                            <span>📁</span> Tài liệu & Slide đính kèm ({lesson.materials.length}):
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {lesson.materials.map((material) => (
                              <div
                                key={material._id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 hover:border-violet-400 dark:hover:border-violet-500 transition shadow-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 font-bold text-sm">
                                    📄
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate" title={material.title}>
                                      {material.title}
                                    </p>
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                                      {material.size ? `${(material.size / 1024 / 1024).toFixed(1)} MB` : 'Tài liệu'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => downloadMaterial(material)}
                                  disabled={downloadingId === material._id}
                                  className="ml-2 px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/50 dark:hover:bg-violet-900 text-[11px] font-bold text-violet-700 dark:text-violet-300 shrink-0 transition"
                                >
                                  {downloadingId === material._id ? '⏳ Tải...' : '⬇ Tải về'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Quiz Link Card */}
                      {lesson.quiz && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-amber-50/50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-neutral-900 border border-violet-200/70 dark:border-violet-800/60 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-base shadow-sm">
                              ✍️
                            </span>
                            <div>
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                {lesson.quiz.title}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                Bài trắc nghiệm ôn tập và củng cố kiến thức cuối chương
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/app/quizzes/${lesson.quiz._id}`}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shrink-0 transition shadow-sm flex items-center gap-1.5"
                          >
                            <span>Làm Quiz ngay</span>
                            <span>➔</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(lesson)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(lesson)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Chỉnh sửa bài học' : 'Thêm bài học'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>Hủy</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Lưu' : 'Thêm'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Input label="Tiêu đề bài học" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="w-24">
              <Input label="Thứ tự" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
          </div>
          <Textarea label="Nội dung" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          {courseMaterials.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Tài liệu đính kèm</p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {courseMaterials.map((material) => (
                  <label key={material._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.materials.includes(material._id)}
                      onChange={() => toggleMaterial(material._id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    {material.title}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Select label="Trắc nghiệm đính kèm (tùy chọn)" value={form.quiz} onChange={(e) => setForm({ ...form, quiz: e.target.value })}>
            <option value="">Không gắn</option>
            {courseQuizzes.map((quiz) => (
              <option key={quiz._id} value={quiz._id}>{quiz.title}</option>
            ))}
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Xóa bài học"
        message={`Xóa bài học "${toDelete?.title}"? Tiến độ của sinh viên với bài này cũng bị xóa.`}
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default CourseLessonsPage;
