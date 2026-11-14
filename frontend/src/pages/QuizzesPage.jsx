import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseApi, quizApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardBody, Badge, Button, Select, LoadingState, EmptyState, ConfirmDialog } from '../components/common';
import Icon from '../components/common/Icon';
import PageHeader from '../components/layout/PageHeader';
import { formatRelative } from '../utils/format';
import QuizBuilderModal from './lecturer/QuizBuilderModal';
import QuizImportModal from './lecturer/QuizImportModal';
import QuizAiGeneratorModal from './lecturer/QuizAiGeneratorModal';
import QuizAnalyticsModal from './lecturer/QuizAnalyticsModal';

const QuizzesPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ['lecturer', 'admin'].includes(user?.role);
  const isStudent = user?.role === 'student';

  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [analyticsQuizId, setAnalyticsQuizId] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (courseFilter) params.course = courseFilter;
      const [quizRes, courseRes] = await Promise.all([quizApi.list(params), courseApi.list({ limit: 100 })]);
      setQuizzes(quizRes.data);
      setCourses(courseRes.data);
      if (isStudent) {
        const attemptRes = await quizApi.myAttempts({ limit: 100 });
        setAttempts(attemptRes.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseFilter]);

  const getMyAttemptsForQuiz = (quizId) => {
    return attempts.filter((a) => a.quiz?._id === quizId);
  };

  const bestScore = (quizId) => {
    const related = getMyAttemptsForQuiz(quizId);
    if (!related.length) return null;
    return related.reduce((best, a) => Math.max(best, a.score / a.totalQuestions), 0);
  };

  const confirmDelete = async () => {
    try {
      await quizApi.remove(toDelete._id);
      toast.success('Đã xóa bộ câu hỏi');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreate = () => {
    setEditingQuiz(null);
    setBuilderOpen(true);
  };

  const openEdit = (quiz) => {
    setEditingQuiz(quiz);
    setBuilderOpen(true);
  };

  const togglePublish = async (quiz) => {
    try {
      await quizApi.update(quiz._id, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? 'Đã chuyển về nháp' : 'Đã công bố cho sinh viên');
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
              ⚡
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              {isStudent ? 'Ôn tập & Kiểm tra' : 'Quản lý Bộ câu hỏi'}
            </h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-300 mt-1">
            {isStudent
              ? 'Luyện tập câu hỏi trắc nghiệm theo từng học phần để rèn luyện kỹ năng và tự động ghi nhận điểm số.'
              : 'Soạn đề, quản lý ngân hàng câu hỏi trắc nghiệm và theo dõi kết quả làm bài của sinh viên.'}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAiModalOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm text-xs font-bold">
              <Icon name="sparkles" className="mr-1.5 h-4 w-4" /> Tạo bằng AI ✨
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)} className="text-xs font-bold">
              <Icon name="upload" className="mr-1 h-3.5 w-3.5" /> Nhập Excel
            </Button>
            <Button variant="secondary" onClick={openCreate} className="text-xs font-bold">
              <Icon name="plus" className="mr-1 h-3.5 w-3.5" /> Tạo thủ công
            </Button>
          </div>
        )}
      </div>

      {/* Filter by course */}
      <div className="card-bento p-4 bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Học phần:</span>
          <Select className="w-full sm:w-72" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Tất cả học phần</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.code} — {course.title}</option>
            ))}
          </Select>
        </div>
        <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          Tổng số: <strong className="text-stone-900 dark:text-stone-100">{quizzes.length}</strong> bộ câu hỏi
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : quizzes.length === 0 ? (
        <EmptyState
          title="Chưa có bộ câu hỏi"
          description={
            canManage
              ? 'Bấm "Tạo bằng AI ✨" hoặc "Tạo thủ công" để soạn đề câu hỏi trắc nghiệm cho sinh viên.'
              : 'Hiện chưa có bộ câu hỏi nào được công bố. Vui lòng quay lại sau.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const best = isStudent ? bestScore(quiz._id) : null;
            const studentAttempts = isStudent ? getMyAttemptsForQuiz(quiz._id) : [];
            const isExhausted = isStudent && quiz.maxAttempts > 0 && studentAttempts.length >= quiz.maxAttempts;

            return (
              <Card key={quiz._id} className="flex h-full flex-col hover:border-violet-300 dark:hover:border-violet-700 transition shadow-sm">
                <CardBody className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">
                      <Icon name="quiz" className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <Badge tone={quiz.isPublished ? 'success' : 'neutral'}>
                          {quiz.isPublished ? 'Công bố' : 'Nháp'}
                        </Badge>
                      )}
                      {quiz.timeLimitMinutes > 0 ? (
                        <Badge variant="warning">{quiz.timeLimitMinutes}p</Badge>
                      ) : (
                        <Badge variant="secondary">Tự do</Badge>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 font-semibold text-stone-900 dark:text-stone-100 line-clamp-2">{quiz.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {quiz.course?.code ? `${quiz.course.code} · ` : ''}
                    {quiz.questionCount} câu hỏi · {formatRelative(quiz.createdAt)}
                  </p>

                  {/* Metadata tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-stone-600 dark:text-stone-300">
                    <span className="rounded bg-stone-100 dark:bg-neutral-800 border border-stone-200/50 dark:border-neutral-700 px-2 py-0.5">
                      Đạt: ≥ {quiz.passingPercentage || 50}%
                    </span>
                    {quiz.maxAttempts > 0 ? (
                      <span className="rounded bg-stone-100 dark:bg-neutral-800 border border-stone-200/50 dark:border-neutral-700 px-2 py-0.5">
                        Tối đa: {quiz.maxAttempts} lần
                      </span>
                    ) : (
                      <span className="rounded bg-stone-100 dark:bg-neutral-800 border border-stone-200/50 dark:border-neutral-700 px-2 py-0.5">Làm lại tự do</span>
                    )}
                  </div>

                  {/* Student score preview */}
                  {isStudent && (
                    <div className="mt-3 rounded-lg bg-stone-50 dark:bg-neutral-800/80 p-2 text-xs border border-stone-200/50 dark:border-neutral-700">
                      {studentAttempts.length > 0 ? (
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500 dark:text-stone-300">Đã làm: {studentAttempts.length}{quiz.maxAttempts > 0 ? `/${quiz.maxAttempts}` : ''} lần</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">Cao nhất: {Math.round((best || 0) * 100)}%</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-400">Chưa làm lần nào</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Link to={`/app/quizzes/${quiz._id}`} className="flex-1">
                      <Button size="sm" className="w-full" variant={isExhausted ? 'secondary' : 'primary'}>
                        {isStudent ? (isExhausted ? 'Xem bài đã làm' : 'Làm bài thi') : 'Xem trước'}
                      </Button>
                    </Link>

                    {canManage && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAnalyticsQuizId(quiz._id)}
                          title="Xem thống kê và bảng điểm sinh viên"
                        >
                          <Icon name="chart" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(quiz)}
                          title="Chỉnh sửa câu hỏi & cài đặt"
                        >
                          <Icon name="edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => togglePublish(quiz)}
                          title={quiz.isPublished ? 'Ẩn bộ câu hỏi' : 'Công bố bộ câu hỏi'}
                        >
                          {quiz.isPublished ? 'Ẩn' : 'Hiện'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setToDelete(quiz)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Xóa bộ câu hỏi"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal tạo AI */}
      <QuizAiGeneratorModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        courses={courses}
        onQuizCreated={load}
      />

      {/* Modal thống kê Analytics */}
      <QuizAnalyticsModal
        open={Boolean(analyticsQuizId)}
        onClose={() => setAnalyticsQuizId(null)}
        quizId={analyticsQuizId}
      />

      {/* Modal tạo thủ công / sửa */}
      <QuizBuilderModal
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingQuiz(null);
        }}
        onSaved={load}
        courses={courses}
        quiz={editingQuiz}
      />

      {/* Modal nhập Excel */}
      <QuizImportModal open={importOpen} onClose={() => setImportOpen(false)} onSaved={load} courses={courses} />

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Xóa bộ câu hỏi"
        message={`Xóa "${toDelete?.title}" và toàn bộ kết quả liên quan? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default QuizzesPage;
