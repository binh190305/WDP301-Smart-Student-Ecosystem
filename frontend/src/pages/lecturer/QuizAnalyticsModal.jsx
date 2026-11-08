import { useEffect, useState } from 'react';
import { quizApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Modal, Button, Badge, LoadingState, ErrorState } from '../../components/common';
import Icon from '../../components/common/Icon';
import { cn } from '../../utils/cn';

const QuizAnalyticsModal = ({ open, onClose, quizId }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'questions'

  useEffect(() => {
    if (!open || !quizId) return;
    setLoading(true);
    setError(null);
    quizApi
      .analytics(quizId)
      .then((res) => {
        setData(res.data?.data || res.data);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải thống kê');
        toast.error(err.message || 'Lỗi tải dữ liệu thống kê');
      })
      .finally(() => setLoading(false));
  }, [open, quizId]);

  const quiz = data?.quiz;
  const summary = data?.summary;
  const attempts = data?.attempts || [];
  const questionStats = data?.questionStats || [];

  const formatSeconds = (sec) => {
    if (!sec || sec < 1) return '< 1 phút';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} giây`;
    return `${m}p ${s}s`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thống kê & Báo cáo kết quả Quiz 📊"
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Header info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-base font-bold text-slate-800">{quiz?.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {quiz?.course ? `${quiz.course.code} — ${quiz.course.title}` : 'Không gắn học phần'} ·{' '}
              {quiz?.totalQuestions} câu hỏi · Thời gian:{' '}
              {quiz?.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} phút` : 'Không giới hạn'} · Điểm đỗ:{' '}
              {quiz?.passingPercentage || 50}%
            </p>
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Lượt làm bài
              </span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.totalAttempts || 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Tổng số lần nộp</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sinh viên
              </span>
              <p className="mt-1 text-2xl font-bold text-brand-600">{summary?.uniqueStudentsCount || 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Người đã tham gia</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Điểm trung bình
              </span>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {summary?.averageScore || 0}/{quiz?.totalQuestions || 0}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{summary?.averagePercentage || 0}% toàn lớp</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Tỷ lệ đạt
              </span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{summary?.passRate || 0}%</p>
              <p className="text-xs text-slate-400 mt-0.5">≥ {quiz?.passingPercentage || 50}% điểm</p>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={cn(
                  'border-b-2 py-2.5 px-4 text-sm font-semibold transition',
                  activeTab === 'students'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Danh sách bài làm ({attempts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={cn(
                  'border-b-2 py-2.5 px-4 text-sm font-semibold transition',
                  activeTab === 'questions'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Phân tích tỷ lệ đúng từng câu ({questionStats.length})
              </button>
            </div>

            {/* Tab 1: Danh sách bài làm */}
            {activeTab === 'students' && (
              <div className="mt-4 overflow-x-auto">
                {attempts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Chưa có sinh viên nào làm bộ câu hỏi này.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Sinh viên</th>
                        <th className="py-2.5 px-3">Điểm số</th>
                        <th className="py-2.5 px-3">Tỷ lệ</th>
                        <th className="py-2.5 px-3">Kết quả</th>
                        <th className="py-2.5 px-3">Thời gian làm</th>
                        <th className="py-2.5 px-3">Lần thứ</th>
                        <th className="py-2.5 px-3">Thời điểm nộp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attempts.map((att) => (
                        <tr key={att._id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900">{att.student?.name || 'Vô danh'}</p>
                            <p className="text-xs text-slate-400">{att.student?.studentCode || att.student?.email}</p>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {att.score}/{att.totalQuestions}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-600">{att.percentage}%</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={att.passed ? 'success' : 'danger'}>
                              {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{formatSeconds(att.timeSpentSeconds)}</td>
                          <td className="py-2.5 px-3 text-slate-500">#{att.attemptNumber}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-400">
                            {new Date(att.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 2: Phân tích tỷ lệ đúng từng câu */}
            {activeTab === 'questions' && (
              <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {questionStats.map((qs, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        <span className="mr-1.5 text-brand-600">Câu {idx + 1}.</span>
                        {qs.questionText}
                      </p>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0',
                          qs.accuracyRate >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : qs.accuracyRate >= 40
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {qs.accuracyRate}% đúng
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Số lượt trả lời đúng: {qs.correctCount}/{qs.totalAnswered}</span>
                        <span>Độ khó thực tế: {qs.accuracyRate < 40 ? 'Khó' : qs.accuracyRate <= 75 ? 'Vừa sức' : 'Dễ'}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            qs.accuracyRate >= 70
                              ? 'bg-emerald-500'
                              : qs.accuracyRate >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                          style={{ width: `${qs.accuracyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuizAnalyticsModal;

