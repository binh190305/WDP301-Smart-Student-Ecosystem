import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { quizApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { Card, CardBody, Button, Badge, LoadingState, ErrorState, ConfirmDialog } from '../components/common';
import Icon from '../components/common/Icon';
import PageHeader from '../components/layout/PageHeader';
import { cn } from '../utils/cn';

const QuizTakePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === 'student';
  const { data, loading, error, run } = useAsync(() => quizApi.get(id), [id]);

  const quiz = data?.data?.quiz;
  const questions = quiz?.questions || [];

  // Quiz taking state
  const [started, setStarted] = useState(!isStudent); // Giảng viên xem trước thì started = true ngay
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Timer state (seconds)
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // Khởi tạo thời gian khi bắt đầu
  useEffect(() => {
    if (!quiz) return;
    const durationSec = (Number(quiz.timeLimitMinutes) || 0) * 60;
    setTimeLeft(durationSec);
    setTimeSpent(0);
  }, [quiz]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (!started || result || !isStudent) return;

    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);

      if (quiz?.timeLimitMinutes > 0) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Tự động nộp bài khi hết giờ
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, result, isStudent, quiz?.timeLimitMinutes]);

  const autoSubmit = async () => {
    toast.error('Hết giờ làm bài! Hệ thống đang tự động nộp bài của bạn.');
    handleFinalSubmit();
  };

  const answeredCount = questions.filter((_, index) => (answers[index]?.length ?? 0) > 0).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSelectOption = (qIndex, oIndex, isMultiple) => {
    if (result || !isStudent) return;

    setAnswers((prev) => {
      const current = prev[qIndex] ?? [];
      if (isMultiple) {
        // Hỗ trợ chọn nhiều đáp án
        const next = current.includes(oIndex)
          ? current.filter((idx) => idx !== oIndex)
          : [...current, oIndex].sort((a, b) => a - b);
        return { ...prev, [qIndex]: next };
      } else {
        // Trắc nghiệm 1 đáp án (Radio)
        return { ...prev, [qIndex]: [oIndex] };
      }
    });
  };

  const toggleFlag = (qIndex) => {
    setFlagged((prev) => ({ ...prev, [qIndex]: !prev[qIndex] }));
  };

  const scrollToQuestion = (qIndex) => {
    const el = document.getElementById(`question-card-${qIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setConfirmSubmitOpen(false);
    try {
      const ordered = questions.map((_, index) => answers[index] ?? []);
      const payload = {
        answers: ordered,
        timeSpentSeconds: timeSpent,
      };
      const res = await quizApi.submit(id, payload);
      setResult(res.data?.data || res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Đã nộp bài thành công!');
    } catch (err) {
      toast.error(err.message || 'Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatSecondsToMinutes = (sec) => {
    if (!sec || sec < 1) return '< 1 phút';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} giây`;
    return `${m} phút ${s} giây`;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={run} />;

  const percent = result
    ? result.percentage ?? Math.round((result.score / result.totalQuestions) * 100)
    : 0;
  const isPassed = result ? result.passed ?? percent >= (quiz.passingPercentage || 50) : false;

  return (
    <div className="mx-auto max-w-6xl pb-16">
      {/* 1. MÀN HÌNH CHỜ BẮT ĐẦU (START SCREEN) */}
      {!started && !result && isStudent && (
        <div className="mx-auto max-w-2xl py-8">
          <Card className="border-slate-200 shadow-md">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon name="quiz" className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
                  <p className="text-xs text-slate-500">
                    {quiz.course?.code ? `${quiz.course.code} — ${quiz.course.title}` : 'Bài tập tự do'}
                  </p>
                </div>
              </div>

              <div className="my-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Quy chế làm bài:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">⏱️ Thời gian:</span>
                    <span className="font-semibold">
                      {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} phút` : 'Không giới hạn'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">📝 Số câu hỏi:</span>
                    <span className="font-semibold">{questions.length} câu</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">🎯 Điểm đạt:</span>
                    <span className="font-semibold">≥ {quiz.passingPercentage || 50}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">🔄 Số lần làm:</span>
                    <span className="font-semibold">
                      {quiz.maxAttempts > 0
                        ? `${quiz.previousAttemptsCount || 0}/${quiz.maxAttempts} lần`
                        : 'Làm lại tự do'}
                    </span>
                  </div>
                </div>

                {quiz.timeLimitMinutes > 0 && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                    ⚠️ Lưu ý: Khi bấm bắt đầu, đồng hồ sẽ đếm ngược liên tục. Khi hết thời gian, hệ thống sẽ tự động nộp bài.
                  </p>
                )}
              </div>

              {quiz.canAttempt === false ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <p className="text-sm font-semibold text-rose-800">
                    Bạn đã sử dụng hết số lần làm bài cho phép ({quiz.maxAttempts}/{quiz.maxAttempts} lần).
                  </p>
                  <p className="mt-1 text-xs text-rose-600">Vui lòng quay lại danh sách để ôn tập bài khác.</p>
                  <div className="mt-4 flex justify-center">
                    <Link to="/app/quizzes">
                      <Button variant="secondary">Quay lại danh sách</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link to="/app/quizzes">
                    <Button variant="secondary">Quay lại</Button>
                  </Link>
                  <Button onClick={() => setStarted(true)} size="lg" className="px-6 shadow-sm">
                    Bắt đầu làm bài thi →
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* 2. MÀN HÌNH KẾT QUẢ SAU KHI NỘP BÀI (RESULT SCREEN) */}
      {result && (
        <div className="space-y-6">
          <PageHeader
            title={quiz.title}
            description={`Kết quả làm bài trắc nghiệm · ${new Date().toLocaleDateString('vi-VN')}`}
            action={
              <Link to="/app/quizzes">
                <Button variant="secondary">Quay về danh sách</Button>
              </Link>
            }
          />

          <Card className={cn('border-2', isPassed ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40')}>
            <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    'flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black shadow-sm',
                    isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  )}
                >
                  {percent}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Đúng {result.score}/{result.totalQuestions} câu hỏi
                    </h2>
                    <Badge variant={isPassed ? 'success' : 'danger'}>
                      {isPassed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Thời gian hoàn thành: <span className="font-semibold">{formatSecondsToMinutes(result.timeSpentSeconds || timeSpent)}</span>
                    {' · '}Điểm đạt: ≥ {quiz.passingPercentage || 50}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isStudent && (quiz.maxAttempts === 0 || (quiz.previousAttemptsCount + 1) < quiz.maxAttempts) && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                      setFlagged({});
                      setStarted(false);
                    }}
                  >
                    Làm lại bài thi
                  </Button>
                )}
                <Link to="/app/quizzes">
                  <Button>Hoàn tất</Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Danh sách câu hỏi kèm lời giải chi tiết */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">Chi tiết bài làm & Lời giải:</h3>
            {questions.map((question, index) => {
              const reviewItem = result?.review?.[index];
              const isCorrectQuestion = reviewItem?.isCorrect;

              return (
                <Card key={index} className={cn('border', isCorrectQuestion ? 'border-emerald-200' : 'border-rose-200')}>
                  <CardBody>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm">
                        <span className="mr-2 text-brand-600">Câu {index + 1}.</span>
                        {question.questionText}
                      </p>
                      <Badge variant={isCorrectQuestion ? 'success' : 'danger'}>
                        {isCorrectQuestion ? 'Đúng' : 'Sai'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const isStudentPick = reviewItem?.selectedIndexes?.includes(oIndex);
                        const isKeyCorrect = reviewItem?.correctIndexes?.includes(oIndex);

                        return (
                          <div
                            key={oIndex}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition',
                              isKeyCorrect
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-medium'
                                : isStudentPick
                                ? 'border-rose-300 bg-rose-50 text-rose-800'
                                : 'border-slate-200 bg-white text-slate-600'
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                                isKeyCorrect
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : isStudentPick
                                  ? 'border-rose-400 bg-rose-400 text-white'
                                  : 'border-slate-300 text-slate-500'
                              )}
                            >
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <span>{option}</span>

                            {isKeyCorrect && (
                              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <Icon name="check" className="h-4 w-4 text-emerald-600" /> Đáp án đúng
                              </span>
                            )}
                            {!isKeyCorrect && isStudentPick && (
                              <span className="ml-auto text-xs font-semibold text-rose-600">
                                Bạn đã chọn câu này
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Lời giải thích */}
                    {reviewItem?.explanation && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <p className="font-bold text-slate-900 mb-0.5">💡 Lời giải chi tiết:</p>
                        <p>{reviewItem.explanation}</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MÀN HÌNH LÀM BÀI 2 CỘT HIỆN ĐẠI (EXAM TAKING VIEW) */}
      {started && !result && (
        <div>
          <PageHeader
            title={quiz.title}
            description={`${questions.length} câu hỏi · ${quiz.course?.code || 'Khóa học'}`}
            action={
              <Link to="/app/quizzes">
                <Button variant="secondary">Thoát</Button>
              </Link>
            }
          />

          {!isStudent && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Chế độ xem trước dành cho Giảng viên — đáp án đúng được đánh dấu màu xanh.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột chính: Danh sách câu hỏi */}
            <div className="lg:col-span-8 space-y-4">
              {questions.map((question, index) => {
                const isMultiple = Boolean(question.isMultipleChoice || (question.correctIndexes?.length > 1));
                const selectedOptions = answers[index] ?? [];
                const isFlagged = Boolean(flagged[index]);
                const previewCorrect = !isStudent ? question.correctIndexes || [] : null;

                return (
                  <Card key={index} id={`question-card-${index}`} className="transition shadow-sm">
                    <CardBody>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                            {index + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {isMultiple ? 'Nhiều lựa chọn' : 'Một lựa chọn duy nhất'}
                          </span>
                        </div>

                        {isStudent && (
                          <button
                            type="button"
                            onClick={() => toggleFlag(index)}
                            className={cn(
                              'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                              isFlagged
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                          >
                            <span>🚩</span>
                            <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                          </button>
                        )}
                      </div>

                      <p className="mb-4 text-sm font-semibold text-slate-800 leading-relaxed">
                        {question.questionText}
                      </p>

                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => {
                          const isSelected = selectedOptions.includes(oIndex);
                          const isKeyPreview = previewCorrect?.includes(oIndex);

                          return (
                            <button
                              key={oIndex}
                              type="button"
                              disabled={!isStudent}
                              onClick={() => handleSelectOption(index, oIndex, isMultiple)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition',
                                isSelected
                                  ? 'border-brand-500 bg-brand-50/70 text-slate-900 font-medium'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
                                isKeyPreview && 'border-emerald-400 bg-emerald-50 text-emerald-900'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-6 w-6 shrink-0 items-center justify-center text-xs font-bold transition',
                                  isMultiple ? 'rounded-md' : 'rounded-full',
                                  isSelected
                                    ? 'bg-brand-600 text-white'
                                    : 'border border-slate-300 text-slate-500 bg-slate-50',
                                  isKeyPreview && 'bg-emerald-600 text-white'
                                )}
                              >
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {isKeyPreview && <Icon name="check" className="h-4 w-4 text-emerald-600 ml-auto" />}
                            </button>
                          );
                        })}
                      </div>

                      {!isStudent && question.explanation && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200">
                          <span className="font-semibold text-slate-800">Giải thích: </span>
                          {question.explanation}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {/* Cột phụ: Sticky Sidebar với Đồng hồ đếm ngược & Question Palette */}
            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-4">
                {/* 1. Timer Card */}
                {isStudent && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {quiz.timeLimitMinutes > 0 ? 'Thời gian còn lại' : 'Thời gian đã làm'}
                        </span>
                        {quiz.timeLimitMinutes > 0 && timeLeft <= 60 && (
                          <span className="animate-pulse text-xs font-bold text-rose-600">Sắp hết giờ!</span>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex items-center justify-center rounded-xl py-3 text-3xl font-black tracking-widest font-mono shadow-inner transition',
                          quiz.timeLimitMinutes > 0 && timeLeft <= 60
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : quiz.timeLimitMinutes > 0 && timeLeft <= 300
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        )}
                      >
                        {quiz.timeLimitMinutes > 0 ? formatTime(timeLeft) : formatTime(timeSpent)}
                      </div>

                      {/* Tiến độ làm bài */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Tiến độ hoàn thành</span>
                          <span className="font-semibold text-brand-600">
                            {answeredCount}/{questions.length} câu
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all duration-300"
                            style={{
                              width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* 2. Question Palette Card */}
                <Card className="border-slate-200 shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Bảng câu hỏi ({questions.length})
                      </span>
                      <span className="text-xs text-slate-400">Click để chuyển câu</span>
                    </div>

                    {/* Chú thích màu */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3 pb-2 border-b border-slate-100">
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-brand-600" /> Đã chọn
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-amber-400" /> Cờ 🚩
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-slate-200" /> Chưa làm
                      </span>
                    </div>

                    {/* Lưới câu hỏi */}
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, idx) => {
                        const isDone = (answers[idx]?.length ?? 0) > 0;
                        const isFlag = Boolean(flagged[idx]);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => scrollToQuestion(idx)}
                            className={cn(
                              'flex h-9 items-center justify-center rounded-lg text-xs font-bold transition',
                              isFlag
                                ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300'
                                : isDone
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Nút nộp bài */}
                    {isStudent && (
                      <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                        {unansweredCount > 0 && (
                          <p className="text-center text-xs text-amber-600 font-medium">
                            Còn {unansweredCount} câu hỏi chưa trả lời!
                          </p>
                        )}
                        <Button
                          onClick={() => setConfirmSubmitOpen(true)}
                          loading={submitting}
                          className="w-full justify-center py-2.5 shadow-sm"
                        >
                          Nộp bài thi
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận nộp bài */}
      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Xác nhận nộp bài thi"
        message={
          unansweredCount > 0
            ? `Bạn vẫn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`
            : 'Bạn đã trả lời tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài thi không?'
        }
        confirmLabel="Nộp bài ngay"
        onConfirm={handleFinalSubmit}
        onClose={() => setConfirmSubmitOpen(false)}
      />
    </div>
  );
};

export default QuizTakePage;
