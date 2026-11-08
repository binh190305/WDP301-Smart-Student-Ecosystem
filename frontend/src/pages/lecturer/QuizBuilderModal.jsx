import { useEffect, useState } from 'react';
import { quizApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Modal, Button, Input, Select } from '../../components/common';
import Icon from '../../components/common/Icon';

const emptyQuestion = () => ({
  questionText: '',
  options: ['', ''],
  correctIndexes: [0],
  explanation: '',
});

const QuizBuilderModal = ({ open, onClose, onSaved, courses, quiz }) => {
  const toast = useToast();
  const isEditing = Boolean(quiz);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!quiz) {
      setTitle('');
      setCourse('');
      setIsPublished(true);
      setTimeLimitMinutes(0);
      setMaxAttempts(0);
      setPassingPercentage(50);
      setShuffleQuestions(false);
      setQuestions([emptyQuestion()]);
      return;
    }
    setLoading(true);
    quizApi
      .get(quiz._id)
      .then((res) => {
        const full = res.data.quiz;
        setTitle(full.title);
        setCourse(full.course?._id || '');
        setIsPublished(full.isPublished !== false);
        setTimeLimitMinutes(full.timeLimitMinutes || 0);
        setMaxAttempts(full.maxAttempts || 0);
        setPassingPercentage(full.passingPercentage || 50);
        setShuffleQuestions(Boolean(full.shuffleQuestions));
        setQuestions(
          full.questions.map((q) => ({
            questionText: q.questionText,
            options: [...q.options],
            correctIndexes: q.correctIndexes?.length ? [...q.correctIndexes] : [0],
            explanation: q.explanation || '',
          }))
        );
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, quiz]);

  const updateQuestion = (index, patch) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const updateOption = (qIndex, oIndex, value) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q))
    );

  const addOption = (qIndex) =>
    setQuestions((prev) => prev.map((q, i) => (i === qIndex && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q)));

  const toggleCorrect = (qIndex, oIndex) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const has = q.correctIndexes.includes(oIndex);
        const correctIndexes = has
          ? q.correctIndexes.filter((idx) => idx !== oIndex)
          : [...q.correctIndexes, oIndex].sort((a, b) => a - b);
        return { ...q, correctIndexes };
      })
    );

  const removeOption = (qIndex, oIndex) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oIndex);
        const correctIndexes = q.correctIndexes
          .filter((idx) => idx !== oIndex)
          .map((idx) => (idx > oIndex ? idx - 1 : idx));
        return { ...q, options, correctIndexes: correctIndexes.length ? correctIndexes : [0] };
      })
    );

  const submit = async () => {
    const cleaned = questions.map((q) => ({
      questionText: q.questionText.trim(),
      options: q.options.map((o) => o.trim()).filter(Boolean),
      correctIndexes: q.correctIndexes,
      explanation: (q.explanation || '').trim(),
    }));
    if (!title.trim()) return toast.error('Vui lòng nhập tiêu đề');
    if (cleaned.some((q) => !q.questionText || q.options.length < 2)) {
      return toast.error('Mỗi câu hỏi cần nội dung và ít nhất 2 lựa chọn');
    }
    if (cleaned.some((q) => q.correctIndexes.length === 0 || q.correctIndexes.some((idx) => idx >= q.options.length))) {
      return toast.error('Vui lòng chọn ít nhất một đáp án đúng hợp lệ cho mỗi câu hỏi');
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        course: course || null,
        questions: cleaned,
        isPublished,
        timeLimitMinutes: Number(timeLimitMinutes) || 0,
        maxAttempts: Number(maxAttempts) || 0,
        passingPercentage: Number(passingPercentage) || 50,
        shuffleQuestions: Boolean(shuffleQuestions),
      };
      const res = isEditing ? await quizApi.update(quiz._id, payload) : await quizApi.create(payload);
      toast.success(isEditing ? 'Đã cập nhật bộ câu hỏi' : 'Đã tạo bộ câu hỏi');
      onSaved?.(res.data.quiz);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa bộ câu hỏi' : 'Tạo bộ câu hỏi thủ công'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} loading={saving} disabled={loading}>
            {isEditing ? 'Lưu thay đổi' : 'Lưu bộ câu hỏi'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select label="Học phần (tùy chọn)" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="">Không gắn học phần</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
            ))}
          </Select>
        </div>

        {/* Cài đặt phòng thi */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Cài đặt quy chế bài thi</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Thời gian làm (phút)"
              type="number"
              min="0"
              max="300"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)}
              placeholder="0 = Không giới hạn"
            />
            <Input
              label="Số lần làm tối đa"
              type="number"
              min="0"
              max="50"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              placeholder="0 = Không giới hạn"
            />
            <Input
              label="Điểm đạt (%)"
              type="number"
              min="0"
              max="100"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Đảo ngẫu nhiên câu hỏi khi sinh viên làm bài
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Công bố cho sinh viên (bỏ chọn để lưu nháp)
            </label>
          </div>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Câu hỏi {qIndex + 1}</p>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Xóa câu hỏi
                </button>
              )}
            </div>
            <Input
              placeholder="Nội dung câu hỏi"
              value={question.questionText}
              onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
            />
            <p className="mt-3 text-xs text-slate-400">Tích chọn một hoặc nhiều đáp án đúng</p>
            <div className="mt-2 space-y-2">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={question.correctIndexes.includes(oIndex)}
                    onChange={() => toggleCorrect(qIndex, oIndex)}
                    className="h-4 w-4 rounded text-brand-600 cursor-pointer"
                    title="Đánh dấu đáp án đúng"
                  />
                  <input
                    className="input-base flex-1"
                    placeholder={`Lựa chọn ${oIndex + 1}`}
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {question.options.length < 6 && (
              <button
                type="button"
                onClick={() => addOption(qIndex)}
                className="mt-2 text-sm font-medium text-brand-600 hover:underline"
              >
                + Thêm lựa chọn
              </button>
            )}

            <div className="mt-3 border-t border-slate-100 pt-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                💡 Lời giải thích chi tiết cho sinh viên:
              </label>
              <input
                type="text"
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                placeholder="Giải thích vì sao đáp án này đúng (tùy chọn)..."
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>
        ))}

        <Button variant="secondary" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
          <Icon name="plus" className="h-4 w-4" /> Thêm câu hỏi
        </Button>
      </div>
    </Modal>
  );
};

export default QuizBuilderModal;
