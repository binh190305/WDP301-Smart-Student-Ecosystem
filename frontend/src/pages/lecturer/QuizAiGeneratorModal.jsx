import { useState } from 'react';
import { quizApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Modal, Button, Input, Textarea, Select, Badge, Spinner } from '../../components/common';
import Icon from '../../components/common/Icon';
import { cn } from '../../utils/cn';

const QuizAiGeneratorModal = ({ open, onClose, courses = [], onQuizCreated }) => {
  const toast = useToast();

  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'text' | 'file'
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [course, setCourse] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');

  // AI API Key config
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_quiz_api_key') || '');
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_quiz_provider') || 'gemini');
  const [showKeyConfig, setShowKeyConfig] = useState(() => !localStorage.getItem('ai_quiz_api_key'));

  // Quiz settings
  const [title, setTitle] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // AI state & generated results
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPrompt('');
    setText('');
    setCourse('');
    setQuestionCount(5);
    setDifficulty('medium');
    setTitle('');
    setTimeLimitMinutes(15);
    setMaxAttempts(0);
    setPassingPercentage(50);
    setShuffleQuestions(false);
    setIsPublished(true);
    setGeneratedQuestions(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Kích thước file tối đa 2MB');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
        if (!title) {
          setTitle(`Quiz: ${file.name.replace(/\.[^/.]+$/, '')}`);
        }
        toast.success(`Đã đọc nội dung từ file ${file.name}`);
      }
    };
    reader.onerror = () => toast.error('Không thể đọc file đã chọn');
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (inputMode === 'prompt' && !prompt.trim()) {
      return toast.error('Vui lòng nhập chủ đề hoặc từ khóa cần tạo Quiz');
    }
    if ((inputMode === 'text' || inputMode === 'file') && !text.trim()) {
      return toast.error('Vui lòng nhập hoặc tải lên nội dung tài liệu bài giảng');
    }

    setGenerating(true);
    try {
      const payload = {
        prompt: inputMode === 'prompt' ? prompt.trim() : '',
        text: inputMode !== 'prompt' ? text.trim() : '',
        course: course || null,
        questionCount: Number(questionCount) || 5,
        difficulty,
        apiKey: apiKey.trim(),
        provider,
      };

      const res = await quizApi.generateAi(payload);
      const questions = res.data?.data?.questions || res.data?.questions || [];
      if (!questions.length) {
        throw new Error('AI không thể tạo câu hỏi từ nội dung này. Vui lòng thử lại.');
      }

      setGeneratedQuestions(questions);
      if (!title) {
        const defaultTitle = prompt.trim()
          ? `Trắc nghiệm: ${prompt.trim().slice(0, 60)}`
          : 'Bộ câu hỏi trắc nghiệm ôn tập AI';
        setTitle(defaultTitle);
      }
      toast.success(`AI đã tạo thành công ${questions.length} câu hỏi thực tế!`);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo câu hỏi với AI');
      // Nếu lỗi do thiếu key, tự động mở khung cấu hình key
      if (err.message && err.message.includes('API Key')) {
        setShowKeyConfig(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestionText = (qIdx, value) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, questionText: value } : q))
    );
  };

  const updateOptionText = (qIdx, oIdx, value) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((opt, j) => (j === oIdx ? value : opt)) }
          : q
      )
    );
  };

  const toggleCorrectIndex = (qIdx, oIdx) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const exists = q.correctIndexes.includes(oIdx);
        const correctIndexes = exists
          ? q.correctIndexes.filter((idx) => idx !== oIdx)
          : [...q.correctIndexes, oIdx].sort((a, b) => a - b);
        return { ...q, correctIndexes: correctIndexes.length ? correctIndexes : [0] };
      })
    );
  };

  const updateExplanation = (qIdx, value) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, explanation: value } : q))
    );
  };

  const removeQuestion = (qIdx) => {
    if (generatedQuestions.length <= 1) {
      return toast.error('Bộ câu hỏi cần có ít nhất 1 câu');
    }
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) return toast.error('Vui lòng nhập tiêu đề cho bộ câu hỏi');
    if (!generatedQuestions || generatedQuestions.length === 0) {
      return toast.error('Chưa có câu hỏi nào được tạo');
    }

    // Kiểm tra tính hợp lệ sơ bộ của từng câu hỏi
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return toast.error(`Câu hỏi ${i + 1} chưa có nội dung câu hỏi`);
      }
      const validOptions = (q.options || []).map((o) => (o || '').trim()).filter(Boolean);
      if (validOptions.length < 2) {
        return toast.error(`Câu hỏi ${i + 1} phải có ít nhất 2 đáp án lựa chọn`);
      }
      if (!q.correctIndexes || q.correctIndexes.length === 0) {
        return toast.error(`Câu hỏi ${i + 1} chưa chọn đáp án đúng`);
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        course: course ? course : null,
        isPublished,
        timeLimitMinutes: Number(timeLimitMinutes) || 0,
        maxAttempts: Number(maxAttempts) || 0,
        passingPercentage: Number(passingPercentage) || 50,
        shuffleQuestions: Boolean(shuffleQuestions),
        questions: generatedQuestions.map((q) => {
          const options = q.options.map((o) => (o || '').trim()).filter(Boolean);
          let correct = (q.correctIndexes || [])
            .map(Number)
            .filter((idx) => !isNaN(idx) && idx >= 0 && idx < options.length);
          if (correct.length === 0) correct = [0];
          return {
            questionText: q.questionText.trim(),
            options,
            correctIndexes: Array.from(new Set(correct)),
            explanation: (q.explanation || '').trim(),
          };
        }),
      };

      const res = await quizApi.create(payload);
      toast.success('Đã lưu thành công bộ câu hỏi AI!');
      onQuizCreated?.(res.data?.data?.quiz || res.data?.quiz);
      handleClose();
    } catch (err) {
      const detailMsg = Array.isArray(err.details) && err.details.length > 0 ? err.details.join(', ') : '';
      toast.error(detailMsg ? `Lỗi dữ liệu: ${detailMsg}` : (err.message || 'Không thể lưu bộ câu hỏi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tạo bộ câu hỏi bằng Trí tuệ Nhân tạo (AI ✨)"
      size="xl"
      footer={
        generatedQuestions ? (
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={() => setGeneratedQuestions(null)}>
              ← Chỉnh lại yêu cầu AI
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button onClick={handleSaveQuiz} loading={saving}>
                Lưu vào hệ thống ({generatedQuestions.length} câu)
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Đóng
            </Button>
            <Button onClick={handleGenerate} loading={generating}>
              <Icon name="sparkles" className="mr-1.5 h-4 w-4" /> Bắt đầu tạo với AI
            </Button>
          </>
        )
      }
    >
      {!generatedQuestions ? (
        <div className="space-y-5">
          {/* Cấu hình API Key AI */}
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Icon name="sparkles" className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-violet-900 uppercase tracking-wide">
                  Cấu hình kết nối AI ({provider === 'gemini' ? 'Google Gemini' : 'OpenAI'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline"
              >
                {showKeyConfig ? 'Thu gọn ▲' : apiKey ? 'Đã nhập Key ✓' : 'Nhập API Key ▼'}
              </button>
            </div>

            {showKeyConfig && (
              <div className="mt-3 space-y-2 pt-2 border-t border-violet-100">
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select
                    label="Dịch vụ AI"
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      localStorage.setItem('ai_quiz_provider', e.target.value);
                    }}
                  >
                    <option value="gemini">Google Gemini (Miễn phí)</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                  </Select>
                  <div className="sm:col-span-2">
                    <Input
                      label="API Key"
                      type="password"
                      placeholder={provider === 'gemini' ? 'Dán mã AIzaSy... từ Google AI Studio' : 'Dán mã sk-... từ OpenAI'}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('ai_quiz_api_key', e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-violet-700">
                  <span>* Key được lưu trực tiếp trong trình duyệt của bạn để dùng cho các lần sau.</span>
                  {provider === 'gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline text-violet-800 hover:text-violet-950"
                    >
                      Nhận API Key Gemini miễn phí tại aistudio.google.com ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nguồn đầu vào tabs */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Chọn nguồn cung cấp dữ liệu cho AI
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setInputMode('prompt')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 transition',
                  inputMode === 'prompt'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Icon name="sparkles" className="h-4 w-4" /> Theo chủ đề / Prompt
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 transition',
                  inputMode === 'text'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Icon name="edit" className="h-4 w-4" /> Dán tài liệu / Bài giảng
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 transition',
                  inputMode === 'file'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Icon name="upload" className="h-4 w-4" /> Tải file văn bản
              </button>
            </div>
          </div>

          {/* Form nhập dữ liệu theo từng tab */}
          {inputMode === 'prompt' && (
            <div>
              <Input
                label="Chủ đề bài học hoặc từ khóa cần ra đề"
                placeholder="Ví dụ: Nguyên lí thiết kế đồ họa, Lập trình JavaScript Async Await..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                AI sẽ phân tích kiến thức chuyên sâu xoay quanh chủ đề này và biên soạn câu hỏi trắc nghiệm tương ứng.
              </p>
            </div>
          )}

          {inputMode === 'text' && (
            <div>
              <Textarea
                label="Nội dung văn bản / Tóm tắt bài giảng"
                placeholder="Dán nội dung giáo trình, tài liệu slide, đề cương hoặc ghi chú bài học vào đây..."
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                AI sẽ bám sát tuyệt đối vào dữ liệu văn bản bạn dán vào để ra các câu hỏi trắc nghiệm kiểm tra độ hiểu bài.
              </p>
            </div>
          )}

          {inputMode === 'file' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Tải tệp tài liệu (.txt, .md, .json)</label>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:bg-slate-50">
                <Icon name="upload" className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600">Chọn hoặc kéo thả tệp tài liệu bài giảng vào đây</p>
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  className="mt-3 cursor-pointer text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700"
                />
              </div>
              {text && (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Xem trước văn bản đã nạp ({text.length} ký tự):</p>
                  <p className="line-clamp-3 mt-1 italic">{text}</p>
                </div>
              )}
            </div>
          )}

          {/* Cấu hình nâng cao */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Học phần liên kết"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">Không gắn học phần</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </Select>

            <Select
              label="Số lượng câu hỏi"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            >
              <option value={3}>3 câu hỏi nhanh</option>
              <option value={5}>5 câu hỏi tiêu chuẩn</option>
              <option value={10}>10 câu hỏi kiểm tra</option>
              <option value={15}>15 câu hỏi thi thử</option>
              <option value={20}>20 câu hỏi toàn diện</option>
            </Select>

            <Select
              label="Mức độ khó"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Dễ (Nhận biết & Khái niệm)</option>
              <option value="medium">Trung bình (Hiểu & Áp dụng)</option>
              <option value="hard">Nâng cao (Phân tích & Tình huống)</option>
            </Select>
          </div>

          {/* Cài đặt phòng thi mặc định */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Cài đặt quy chế làm bài của bộ câu hỏi</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Thời gian (phút)"
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
                label="Điểm đỗ (%)"
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
                Đảo ngẫu nhiên thứ tự câu hỏi khi làm bài
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                Công bố ngay cho sinh viên (bỏ chọn để lưu nháp)
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Màn hình xem trước & tinh chỉnh câu hỏi AI */
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <Icon name="check" className="h-5 w-5 text-emerald-600" />
                AI đã soạn xong {generatedQuestions.length} câu hỏi. Bạn có thể kiểm tra, sửa nội dung hoặc thêm bớt đáp án bên dưới:
              </div>
              <Badge variant="success">{difficulty.toUpperCase()}</Badge>
            </div>
          </div>

          <Input
            label="Tiêu đề bộ câu hỏi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề hiển thị..."
          />

          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
            {generatedQuestions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-600">Câu hỏi {qIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" /> Xóa câu này
                  </button>
                </div>

                <Textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="Nội dung câu hỏi..."
                  className="mb-3 text-sm font-medium"
                />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Danh sách lựa chọn (Click vào ô chữ cái để đánh dấu đáp án đúng):
                  </p>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctIndexes.includes(oIdx);
                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCorrectIndex(qIdx, oIdx)}
                          title="Click để chuyển đổi đáp án đúng"
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition',
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                              : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                          className={cn(
                            'w-full rounded-lg border px-3 py-1.5 text-sm transition',
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50 font-medium text-emerald-900'
                              : 'border-slate-200 text-slate-800'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    💡 Lời giải thích chi tiết cho sinh viên sau khi nộp bài:
                  </label>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => updateExplanation(qIdx, e.target.value)}
                    placeholder="Giải thích vì sao đáp án đúng..."
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuizAiGeneratorModal;
