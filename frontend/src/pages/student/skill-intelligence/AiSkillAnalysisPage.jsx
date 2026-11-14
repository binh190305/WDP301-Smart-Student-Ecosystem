// Unified Project Skill Analyzer (AI Core 01)
// Integrates Input A (AI Free Text Extraction) & Input B (DB-backed Template Selection) into a single pipeline.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { useToast } from '../../../context/ToastContext';

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Mới bắt đầu (Cấp 1)', level: 1 },
  { value: 'elementary', label: 'Cơ bản (Cấp 2)', level: 2 },
  { value: 'intermediate', label: 'Trung cấp (Cấp 3)', level: 3 },
  { value: 'advanced', label: 'Nâng cao (Cấp 4)', level: 4 },
  { value: 'expert', label: 'Chuyên gia (Cấp 5)', level: 5 },
];

const IMPORTANCE_BADGES = {
  high: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function AiSkillAnalysisPage() {
  const { showToast } = useToast();

  // Active input mode: 'template' | 'text' | 'both'
  const [inputMode, setInputMode] = useState('template');

  // Input states
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [projectText, setProjectText] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [processingPipeline, setProcessingPipeline] = useState(false);

  // Requirements stage (Generated & User-editable)
  const [projectRequirements, setProjectRequirements] = useState(null);
  const [editableSkills, setEditableSkills] = useState([]);

  // Gap Analysis stage
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [gapResult, setGapResult] = useState(null);

  // Quick custom skill adder
  const [newReqName, setNewReqName] = useState('');
  const [newReqLevel, setNewReqLevel] = useState('intermediate');
  const [newReqImportance, setNewReqImportance] = useState('medium');

  // Video embed expanded state: skillName of active player or null
  const [activeVideoSkill, setActiveVideoSkill] = useState(null);

  // Interactive Quiz Evaluations State:
  // { [skillName]: { answers: { [qIdx]: optIdx }, submitted: boolean, score: number, correctCount: number, totalQuestions: number, isPassed: boolean, isSaving: boolean, isSaved: boolean } }
  const [quizEvaluations, setQuizEvaluations] = useState({});

  const handleAnswerQuizQuestion = (skillName, qIdx, optIdx) => {
    setQuizEvaluations((prev) => {
      const current = prev[skillName] || { answers: {}, submitted: false };
      if (current.submitted) return prev; // locked after submit
      return {
        ...prev,
        [skillName]: {
          ...current,
          answers: {
            ...current.answers,
            [qIdx]: optIdx,
          },
        },
      };
    });
  };

  const handleSubmitQuiz = (skillName, questions) => {
    const current = quizEvaluations[skillName] || { answers: {} };
    const answeredCount = Object.keys(current.answers || {}).length;
    if (answeredCount < questions.length) {
      showToast(`Vui lòng chọn đáp án cho toàn bộ ${questions.length} câu hỏi trước khi nộp bài!`, 'warning');
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (current.answers[idx] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const isPassed = score >= 75;

    setQuizEvaluations((prev) => ({
      ...prev,
      [skillName]: {
        ...prev[skillName],
        submitted: true,
        score,
        correctCount,
        totalQuestions: questions.length,
        isPassed,
        isSaving: false,
        isSaved: false,
      },
    }));

    if (isPassed) {
      showToast(`🎉 Xuất sắc! Bạn đạt ${score}% - ĐỦ ĐIỀU KIỆN ĐẢM NHẬN ĐỀ TÀI / DỰ ÁN!`, 'success');
    } else {
      showToast(`⚠️ Bạn đạt ${score}% - Chưa đạt chuẩn tối thiểu 75%. Hãy ôn tập và thử lại nhé!`, 'warning');
    }
  };

  const handleResetQuiz = (skillName) => {
    setQuizEvaluations((prev) => ({
      ...prev,
      [skillName]: {
        answers: {},
        submitted: false,
        score: 0,
        correctCount: 0,
        totalQuestions: 0,
        isPassed: false,
        isSaving: false,
        isSaved: false,
      },
    }));
  };

  const handleSaveQuizToProfile = async (skillName) => {
    const current = quizEvaluations[skillName];
    if (!current || !current.submitted) return;

    try {
      setQuizEvaluations((prev) => ({
        ...prev,
        [skillName]: { ...prev[skillName], isSaving: true },
      }));

      const projectCode = selectedTemplateId || 'SWP391';
      const res = await skillIntelligenceApi.recordQuizAssessment({
        skillName,
        score: current.score,
        correctCount: current.correctCount,
        totalQuestions: current.totalQuestions,
        projectCode,
      });

      setQuizEvaluations((prev) => ({
        ...prev,
        [skillName]: { ...prev[skillName], isSaving: false, isSaved: true },
      }));

      showToast(res?.data?.message || res?.message || `Đã cập nhật chứng thực năng lực "${skillName}" vào Hồ sơ Năng lực của bạn!`, 'success');
    } catch (err) {
      setQuizEvaluations((prev) => ({
        ...prev,
        [skillName]: { ...prev[skillName], isSaving: false },
      }));
      showToast(err?.response?.data?.message || err?.message || 'Không thể lưu chứng thực', 'error');
    }
  };

  // Load Database-backed templates on mount
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await skillIntelligenceApi.getTemplates();
      const payload = res?.data || res;
      const list = Array.isArray(payload) ? payload : (payload?.data || payload?.templates || []);
      setTemplates(list);
      if (list.length > 0) {
        const first = list[0];
        const firstKey = first.code || first.templateId || first._id;
        setSelectedTemplateId(firstKey);
        if (first.sampleProjectText) {
          setProjectText(first.sampleProjectText);
        }
      }
    } catch {
      showToast('Không thể tải danh sách dự án mẫu từ hệ thống', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // When template changes, populate preview text
  const handleTemplateChange = (val) => {
    setSelectedTemplateId(val);
    const tmpl = templates.find((t) => t.code === val || t.templateId === val || t._id === val);
    if (tmpl && tmpl.sampleProjectText) {
      setProjectText(tmpl.sampleProjectText);
    }
  };

  // Quick Demo Preset Loader for Presentation
  const handleLoadDemoPreset = (code) => {
    const tmpl = templates.find((t) => t.code === code || t.templateId === code);
    if (tmpl) {
      const key = tmpl.code || tmpl.templateId || tmpl._id;
      setSelectedTemplateId(key);
      setInputMode('both');
      if (tmpl.sampleProjectText) {
        setProjectText(tmpl.sampleProjectText);
      }
      showToast(`Đã nạp sẵn dữ liệu demo: ${tmpl.title}`, 'info');
    }
  };

  // STEP 1: Unified Project Requirement Engine
  const handleProcessPipeline = async () => {
    if (inputMode === 'text' && projectText.trim().length < 10) {
      showToast('Vui lòng nhập mô tả dự án tối thiểu 10 ký tự', 'warning');
      return;
    }
    if (inputMode === 'template' && !selectedTemplateId) {
      showToast('Vui lòng chọn một Dự án mẫu', 'warning');
      return;
    }

    try {
      setProcessingPipeline(true);
      setGapResult(null);

      const payload = {
        templateId: inputMode !== 'text' ? selectedTemplateId : undefined,
        text: inputMode !== 'template' ? projectText : undefined,
      };

      const res = await skillIntelligenceApi.analyzeProjectRequirements(payload);
      const data = res?.data || res;
      if (res?.success || data?.success || data?.requirements) {
        const result = data.data || data;
        setProjectRequirements(result);
        setEditableSkills(result.requirements || []);
        showToast(
          `Đã trích xuất & chuẩn hoá thành công ${result.totalSkills || result.requirements?.length} kỹ năng yêu cầu`,
          'success'
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi phân tích yêu cầu dự án', 'error');
    } finally {
      setProcessingPipeline(false);
    }
  };

  // User edits on requirement items
  const handleRemoveSkill = (index) => {
    const next = [...editableSkills];
    next.splice(index, 1);
    setEditableSkills(next);
  };

  const handleLevelChange = (index, newLevel) => {
    const next = [...editableSkills];
    next[index].requiredLevel = newLevel;
    const opt = PROFICIENCY_OPTIONS.find((o) => o.value === newLevel);
    next[index].requiredProficiencyNumber = opt ? opt.level : 3;
    setEditableSkills(next);
  };

  const handleImportanceChange = (index, newImp) => {
    const next = [...editableSkills];
    next[index].importance = newImp;
    setEditableSkills(next);
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!newReqName.trim()) return;
    const opt = PROFICIENCY_OPTIONS.find((o) => o.value === newReqLevel);
    const item = {
      name: newReqName.trim(),
      normalizedName: newReqName.trim().toLowerCase(),
      category: 'General',
      requiredLevel: newReqLevel,
      requiredProficiencyNumber: opt ? opt.level : 3,
      importance: newReqImportance,
      requiredCompetencies: [`Kỹ năng thực hành ${newReqName.trim()}`],
      reasoning: 'Kỹ năng do người dùng bổ sung thủ công',
      source: 'user_added',
    };
    setEditableSkills([...editableSkills, item]);
    setNewReqName('');
  };

  // STEP 2: Unified Skill Gap Analysis
  const handleAnalyzeSkillGap = async () => {
    if (editableSkills.length === 0) {
      showToast('Danh sách kỹ năng dự án đang trống', 'warning');
      return;
    }
    try {
      setAnalyzingGap(true);
      const res = await skillIntelligenceApi.analyzeGap({
        targetSkills: editableSkills,
        projectDescription: projectText,
      });
      const data = res?.data || res;
      if (res?.success || data?.success || data?.readinessScore !== undefined) {
        setGapResult(data.data || data);
        showToast('Đã hoàn thành phân tích khoảng cách năng lực dựa trên bằng chứng!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi đo khoảng cách kỹ năng', 'error');
    } finally {
      setAnalyzingGap(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>⚡</span> Phân tích Kỹ năng Dự án (Project Skill Analyzer)
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
          Hợp nhất giữa AI trích xuất tự nhiên và Dự án chuẩn mẫu. Đo lường mức độ sẵn sàng thực tế dựa trên bằng chứng đã kiểm tra.
        </p>
      </div>

      {/* QUICK DEMO PRESETS BAR FOR PRESENTATION */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-base shadow-xs">
              🎯
            </span>
            <div>
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Dữ liệu Mẫu Thuyết trình (Click 1 chạm để Demo ngay)
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Tự động nạp đề tài chuẩn từ bộ môn FPT, kết hợp AI tinh chỉnh và đo khoảng cách năng lực thực tế.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-3 py-1 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold rounded-full border border-amber-200/80 dark:border-amber-800 self-start sm:self-auto shadow-2xs">
            Demo Ready
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('web_fullstack_mern')}
            className="px-3.5 py-2 bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200/80 dark:border-neutral-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-100 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🌐</span> SWP391: Web Fullstack MERN (12 Kỹ năng)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('ai_data_science')}
            className="px-3.5 py-2 bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200/80 dark:border-neutral-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-100 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🤖</span> AIL303m: AI & Hệ thống Gợi ý (Học máy)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('mobile_app_react_native')}
            className="px-3.5 py-2 bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200/80 dark:border-neutral-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-100 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📱</span> Mobile App: Sổ tay Sinh viên (React Native)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('uiux_design')}
            className="px-3.5 py-2 bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200/80 dark:border-neutral-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-100 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🎨</span> UI/UX: Design System & Prototype Figma
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('cloud_devops')}
            className="px-3.5 py-2 bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200/80 dark:border-neutral-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-100 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>☁️</span> Cloud & DevOps: Microservices Docker K8s
          </button>
        </div>
      </div>

      {/* SECTION 1: UNIFIED INPUT CONTROLS */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-stone-200/80 dark:border-neutral-700/80 shadow-sm space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-neutral-800 pb-4">
          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            Bước 1: Lựa chọn Phương thức Đầu vào
          </span>

          <div className="flex items-center gap-2 bg-stone-100 dark:bg-neutral-800/90 p-1 rounded-xl border border-stone-200/60 dark:border-neutral-700">
            <button
              onClick={() => setInputMode('template')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'template' ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              📦 Dự án Mẫu (Database)
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'text' ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              🤖 Dán Mô tả / JD / CV
            </button>
            <button
              onClick={() => setInputMode('both')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'both' ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              ✨ Kết hợp cả hai (Mẫu + Tinh chỉnh)
            </button>
          </div>
        </div>

        {/* INPUT B: Template Selection */}
        {(inputMode === 'template' || inputMode === 'both') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
                Chọn Cấu trúc Dự án Mẫu từ Cơ sở Dữ liệu ({templates.length} mẫu chuẩn)
              </label>
              <button
                type="button"
                onClick={loadTemplates}
                className="text-[11px] text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 font-semibold flex items-center gap-1"
              >
                <span>🔄</span> Tải lại danh mục
              </button>
            </div>
            {loadingTemplates ? (
              <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-400 border border-dashed border-stone-300 dark:border-neutral-700 rounded-xl">
                Đang tải danh mục dự án mẫu từ cơ sở dữ liệu...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                Chưa có cấu trúc dự án mẫu trong hệ thống.
                <button onClick={loadTemplates} className="ml-2 font-bold underline">Thử tải lại</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {templates.map((tmpl) => {
                  const key = tmpl.code || tmpl.templateId || tmpl._id;
                  const isSelected =
                    selectedTemplateId === tmpl.code ||
                    selectedTemplateId === tmpl.templateId ||
                    selectedTemplateId === tmpl._id;
                  return (
                    <div
                      key={key}
                      onClick={() => handleTemplateChange(key)}
                      className={`cursor-pointer p-4 rounded-xl border transition text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/80 dark:bg-violet-950/60 shadow-sm ring-2 ring-violet-500/20'
                          : 'border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 hover:bg-stone-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-200 font-semibold truncate max-w-[120px]">
                            {tmpl.category}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] text-violet-600 dark:text-violet-300 font-bold flex items-center gap-0.5">
                              ✓ Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-2">{tmpl.title}</div>
                        <p className="text-xs text-stone-500 dark:text-stone-300 mt-1 line-clamp-2">{tmpl.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-neutral-700/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>🎯 {tmpl.requiredSkills?.length || 0} kỹ năng chuẩn</span>
                        {tmpl.tags?.[0] && <span className="text-stone-400 dark:text-stone-400 font-mono text-[10px]">#{tmpl.tags[0]}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* INPUT A: Free Text Extraction */}
        {(inputMode === 'text' || inputMode === 'both') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
                {inputMode === 'both' ? 'Bổ sung Mô tả / Yêu cầu Công nghệ để AI Tinh chỉnh' : 'Mô tả Dự án / Đề tài / JD Tuyển dụng'}
              </label>
              <div className="flex items-center gap-3">
                {selectedTemplateId && (
                  <button
                    type="button"
                    onClick={() => {
                      const tmpl = templates.find((t) => t.code === selectedTemplateId || t.templateId === selectedTemplateId || t._id === selectedTemplateId);
                      if (tmpl && tmpl.sampleProjectText) {
                        setProjectText(tmpl.sampleProjectText);
                        showToast('Đã nạp văn bản mô tả của dự án mẫu đang chọn', 'info');
                      }
                    }}
                    className="text-[11px] text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 font-semibold"
                  >
                    📄 Nạp mô tả dự án đang chọn
                  </button>
                )}
                {projectText && (
                  <button
                    type="button"
                    onClick={() => setProjectText('')}
                    className="text-[11px] text-stone-400 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    🧹 Xóa trắng
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={4}
              placeholder="Dán nội dung mô tả đề tài, tài liệu kỹ thuật, danh sách công nghệ cần dùng..."
              value={projectText}
              onChange={(e) => setProjectText(e.target.value)}
              className="w-full p-3 text-sm bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        )}

        {/* Process button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleProcessPipeline}
            disabled={processingPipeline}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {processingPipeline ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang chuẩn hoá và trích xuất kỹ năng...
              </>
            ) : (
              <>
                <span>⚡</span> Khởi chạy Pipeline Chuẩn hoá Yêu cầu
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: PROJECT SKILL REQUIREMENTS MANAGEMENT TABLE */}
      {editableSkills.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-stone-200/80 dark:border-neutral-700/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-100 dark:border-neutral-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>📋</span> Bước 2: Danh sách Kỹ năng Yêu cầu Dự án ({editableSkills.length})
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-300 mt-0.5">
                Đã qua pipeline Chuẩn hoá tên, Khử trùng lặp và Phân loại competency. Bạn có thể điều chỉnh trước khi đo khoảng cách.
              </p>
            </div>

            <button
              onClick={handleAnalyzeSkillGap}
              disabled={analyzingGap}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2 self-start md:self-auto"
            >
              {analyzingGap ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Đang đối chiếu bằng chứng...
                </>
              ) : (
                <>
                  <span>🎯</span> ĐO KHOẢNG CÁCH NĂNG LỰC (ANALYZE SKILL GAP)
                </>
              )}
            </button>
          </div>

          {/* Quick add custom skill */}
          <form onSubmit={handleAddCustomSkill} className="flex flex-wrap gap-2 items-center bg-stone-50 dark:bg-neutral-800/90 p-3 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs">
            <span className="font-semibold text-stone-700 dark:text-stone-200 whitespace-nowrap">Thêm kỹ năng:</span>
            <input
              type="text"
              placeholder="Tên kỹ năng..."
              value={newReqName}
              onChange={(e) => setNewReqName(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-lg flex-1 min-w-[140px]"
            />
            <select
              value={newReqLevel}
              onChange={(e) => setNewReqLevel(e.target.value)}
              className="px-2 py-1.5 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-lg"
            >
              {PROFICIENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100">{o.label}</option>
              ))}
            </select>
            <select
              value={newReqImportance}
              onChange={(e) => setNewReqImportance(e.target.value)}
              className="px-2 py-1.5 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-lg"
            >
              <option value="high" className="bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100">Ưu tiên Cao</option>
              <option value="medium" className="bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100">Ưu tiên Trung bình</option>
              <option value="low" className="bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100">Ưu tiên Thấp</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-900 hover:bg-black dark:bg-violet-600 dark:hover:bg-violet-700 text-white rounded-lg font-semibold transition"
            >
              ➕ Thêm vào yêu cầu
            </button>
          </form>

          {/* Requirements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <thead className="bg-stone-50 dark:bg-neutral-800 text-stone-700 dark:text-stone-200 uppercase font-semibold">
                <tr>
                  <th className="p-3">Kỹ năng</th>
                  <th className="p-3">Lĩnh vực</th>
                  <th className="p-3">Cấp độ yêu cầu</th>
                  <th className="p-3">Độ ưu tiên</th>
                  <th className="p-3">Năng lực (Competencies)</th>
                  <th className="p-3">Lý do yêu cầu</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-neutral-800">
                {editableSkills.map((req, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 dark:hover:bg-neutral-800/60 transition">
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{req.name}</td>
                    <td className="p-3 text-stone-500 dark:text-stone-300">{req.category || 'General'}</td>
                    <td className="p-3">
                      <select
                        value={req.requiredLevel}
                        onChange={(e) => handleLevelChange(idx, e.target.value)}
                        className="px-2 py-1 border border-stone-200 dark:border-neutral-700 rounded text-xs bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
                      >
                        {PROFICIENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} className="bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100">{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={req.importance || 'medium'}
                        onChange={(e) => handleImportanceChange(idx, e.target.value)}
                        className={`px-2 py-1 border rounded text-xs ${IMPORTANCE_BADGES[req.importance || 'medium']}`}
                      >
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                      </select>
                    </td>
                    <td className="p-3 text-stone-600 dark:text-stone-300 max-w-xs">
                      {req.requiredCompetencies?.length > 0 ? (
                        <span className="line-clamp-2">{req.requiredCompetencies.join(', ')}</span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-400 italic">Cơ bản</span>
                      )}
                    </td>
                    <td className="p-3 text-stone-500 dark:text-stone-300 max-w-xs truncate" title={req.reasoning}>
                      {req.reasoning || 'Yêu cầu của dự án'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-bold"
                        title="Xoá kỹ năng này"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: EVIDENCE-BASED SKILL GAP ANALYSIS RESULTS */}
      {gapResult && (
        <div className="space-y-6">
          {/* Readiness Score Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold uppercase tracking-wider">
                Kết quả Đo lường Khoảng cách Thực tế (Evidence-Based Gap Analysis)
              </span>
              <h2 className="text-2xl font-bold">Chỉ số Sẵn sàng cho Dự án (Project Readiness)</h2>
              <p className="text-xs text-indigo-200 max-w-xl">
                Điểm số được tính toán có trọng số dựa trên: Độ quan trọng kỹ năng • Cấp độ thành thạo yêu cầu • Chất lượng bằng chứng thực nghiệm (Verified &gt; Assessed &gt; Self-reported).
              </p>
              <div className="flex items-center gap-4 text-xs text-indigo-200 pt-1">
                <span>Độ bao phủ dữ liệu bằng chứng: <strong className="text-white">{gapResult.dataCoverage}%</strong></span>
                <span>Yêu cầu đáp ứng: <strong className="text-white">{gapResult.matchedCount}/{gapResult.totalRequirements}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 min-w-[140px]">
              <span className="text-4xl font-extrabold text-white">{gapResult.readinessScore}%</span>
              <span className="text-xs text-indigo-200 mt-1 uppercase tracking-wider font-medium">Readiness</span>
            </div>
          </div>

          {/* EXPLAINABLE AI BREAKDOWN: WHY IS READINESS SCORE X%? */}
          <div className="card-bento p-6 bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-sm font-bold">
                    🔍
                  </span>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                    Giải trình Thuật toán AI: Vì sao Điểm Sẵn sàng đạt {gapResult.readinessScore}%?
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-300 mt-1 font-medium">
                  Hệ sinh thái STE áp dụng cơ chế đánh giá năng lực minh bạch theo chuẩn Evidence-Based, không chấp nhận khai báo khống.
                </p>
              </div>

              {/* Formula Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 text-[11px] font-mono text-stone-600 dark:text-stone-300 flex items-center gap-2">
                <span className="text-violet-600 dark:text-violet-300 font-bold">Công thức:</span>
                <span>(∑ Trọng số Kỹ năng × Tỷ lệ Cấp độ × Hệ số Minh chứng) / Tổng trọng số</span>
              </div>
            </div>

            {/* Evidence Factor Legend Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/70 dark:border-violet-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                    <span>🛡️</span> Verified
                  </span>
                  <span className="text-xs font-black text-violet-700 dark:text-violet-300">100% tin cậy</span>
                </div>
                <p className="text-[11px] text-violet-800/80 dark:text-violet-300/80 mt-1 font-medium">
                  Giảng viên phê duyệt hoặc có chứng chỉ đối chiếu (Hệ số ×1.0).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>✅</span> Assessed
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">85% tin cậy</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 font-medium">
                  Đã vượt qua bài kiểm tra Quiz hoặc Lab trên hệ thống STE (Hệ số ×0.85).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>📋</span> Self-reported
                  </span>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300">45% tin cậy</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1 font-medium">
                  Sinh viên tự khai báo, chưa nộp minh chứng (bị phạt -55% điểm).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span>❌</span> Missing
                  </span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-300">0% tin cậy</span>
                </div>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1 font-medium">
                  Chưa khai báo hoặc chưa từng học kỹ năng này (Hệ số ×0.0).
                </p>
              </div>
            </div>

            {/* Detailed Calculation Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-neutral-700">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-neutral-800 border-b border-stone-200/80 dark:border-neutral-700 text-stone-700 dark:text-stone-200 font-bold">
                    <th className="py-2.5 px-3">Kỹ năng yêu cầu</th>
                    <th className="py-2.5 px-3">Cấp độ (Bạn / Cần)</th>
                    <th className="py-2.5 px-3">Phân loại Bằng chứng</th>
                    <th className="py-2.5 px-3 text-center">Hệ số Tin cậy</th>
                    <th className="py-2.5 px-3 text-center">Tỷ lệ Cấp độ</th>
                    <th className="py-2.5 px-3 text-right">Đóng góp Điểm</th>
                    <th className="py-2.5 px-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-neutral-800">
                  {[...(gapResult.matched || []), ...(gapResult.partial || []), ...(gapResult.missing || [])].map((item, idx) => {
                    const isMissing = !item.studentLevel || item.studentLevel === 0;
                    const classification = item.classification || (isMissing ? 'missing' : 'self_reported');
                    const multiplier = classification === 'verified' ? 1.0 : classification === 'assessed' ? 0.85 : classification === 'self_reported' ? 0.45 : 0;
                    const levelRatio = isMissing ? 0 : Math.min(100, Math.round((item.studentLevel / item.requiredLevel) * 100));
                    const weight = item.targetWeight || 1.0;
                    const contribution = item.contributionScore !== undefined ? item.contributionScore : Number((weight * (levelRatio / 100) * multiplier).toFixed(2));
                    const effPercent = item.efficiencyPercent !== undefined ? item.efficiencyPercent : Math.round((contribution / weight) * 100);

                    return (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/50 transition">
                        <td className="py-2.5 px-3 font-bold text-stone-900 dark:text-stone-100">
                          {item.skillName}
                          <span className="ml-1.5 text-[10px] text-stone-400 dark:text-stone-400 font-normal">
                            (Trọng số: {weight})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-700 dark:text-stone-200">
                          {isMissing ? (
                            <span className="text-rose-600 dark:text-rose-400">Chưa có / Cần Lv.{item.requiredLevel}</span>
                          ) : (
                            <span>
                              Lv.{item.studentLevel} <span className="text-stone-400 dark:text-stone-500">/</span> Lv.{item.requiredLevel} ({item.studentLabel})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {classification === 'verified' && (
                            <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-bold text-[10px]">
                              🛡️ Đã xác thực
                            </span>
                          )}
                          {classification === 'assessed' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
                              ✅ Đã kiểm tra qua Quiz
                            </span>
                          )}
                          {classification === 'self_reported' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                              📋 Tự khai báo
                            </span>
                          )}
                          {classification === 'missing' && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-[10px]">
                              ❌ Thiếu hoàn toàn
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-stone-700 dark:text-stone-200">
                          ×{multiplier}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-stone-700 dark:text-stone-200">
                          {levelRatio}%
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-black text-violet-600 dark:text-violet-400">{contribution}</span>
                          <span className="text-stone-400 dark:text-stone-400 font-medium">/{weight} ({effPercent}%)</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {effPercent >= 85 ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Xuất sắc
                            </span>
                          ) : effPercent >= 50 ? (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              Cần minh chứng
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              Khoảng cách lớn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* AI Diagnosis Commentary */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-neutral-800/90 border border-stone-200/80 dark:border-neutral-700 space-y-2">
              <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>💡</span> Nhận định của Trợ lý AI về kết quả đo lường {gapResult.readinessScore}%:
              </h4>
              <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 pl-4 list-disc font-medium leading-relaxed">
                <li>
                  <strong>Khớp danh mục nhưng thiếu độ tin cậy:</strong> Dù bạn khớp {gapResult.matchedCount}/{gapResult.totalRequirements} kỹ năng, các kỹ năng trọng yếu ở trạng thái <em>Tự khai báo</em> chỉ được nhân hệ số tin cậy <strong>45%</strong> để đảm bảo sự nghiêm ngặt trong phân chia đồ án.
                </li>
                <li>
                  <strong>Khoảng cách cấp độ chuyên môn:</strong> Kỹ năng có cấp độ hiện tại thấp hơn yêu cầu của đề tài bị chiết khấu tỷ lệ cấp độ theo công thức chuẩn.
                </li>
                <li>
                  <strong>Hành động đề xuất để nâng điểm lên &gt;75%:</strong> Thực hiện bài kiểm tra Quiz trên hệ thống STE để chuyển trạng thái từ <em>Tự khai báo</em> sang <em>Đã đánh giá (Assessed - 85%)</em>, hoặc nộp link sản phẩm GitHub để nhận xác thực chính thức (100%).
                </li>
              </ul>
            </div>
          </div>

          {/* Evidence Narrative Box */}
          {gapResult.evidenceExplanation && (
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-700/80 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>📝</span> Báo cáo Đối chiếu Bằng chứng Năng lực
              </h3>
              <div className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-neutral-800/90 p-4 rounded-xl border border-stone-100 dark:border-neutral-700">
                {gapResult.evidenceExplanation}
              </div>
            </div>
          )}

          {/* SECTION: STRENGTHS & WEAKNESSES PROFILING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-[#1e1e1e] dark:to-emerald-950/20 p-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-base shadow-xs">
                    💪
                  </span>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Điểm Mạnh Cốt Lõi (Key Strengths)</h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-300">Các năng lực đã được kiểm chứng thực tế và đáp ứng chuẩn đề tài</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-700">
                  {gapResult.strengths?.length || gapResult.matched?.length || 0} Thế mạnh
                </span>
              </div>

              <div className="space-y-3">
                {(!gapResult.strengths || gapResult.strengths.length === 0) && (!gapResult.matched || gapResult.matched.length === 0) ? (
                  <p className="text-xs text-stone-400 dark:text-stone-400 italic py-4 text-center">Chưa ghi nhận thế mạnh đủ điều kiện cho dự án này.</p>
                ) : (
                  (gapResult.strengths || gapResult.matched).map((str, idx) => (
                    <div key={idx} className="p-3.5 bg-white dark:bg-neutral-800/90 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{str.skillName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                            {str.studentLabel}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                          {str.classification === 'verified' ? '🛡️ Đã xác thực' : '✅ Đã kiểm tra'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {str.summary || `Đã chứng minh năng lực đạt cấp độ ${str.studentLabel}, đáp ứng xuất sắc yêu cầu dự án.`}
                      </p>
                      {str.demonstratedCompetencies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {str.demonstratedCompetencies.map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-700 text-stone-700 dark:text-stone-200">
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weaknesses & Gaps Card */}
            <div className="bg-gradient-to-br from-rose-50/80 via-white to-amber-50/30 dark:from-rose-950/40 dark:via-[#1e1e1e] dark:to-amber-950/20 p-6 rounded-2xl border border-rose-200/80 dark:border-rose-800/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-base shadow-xs">
                    ⚠️
                  </span>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Điểm Yếu & Khoảng Cách Cần Khắc Phục</h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-300">Các kỹ năng thiếu hụt có nguy cơ gây rủi ro tiến độ dự án</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold border border-rose-200 dark:border-rose-700">
                  {gapResult.weaknesses?.length || ((gapResult.partial?.length || 0) + (gapResult.missing?.length || 0)) || 0} Khoảng cách
                </span>
              </div>

              <div className="space-y-3">
                {(!gapResult.weaknesses || gapResult.weaknesses.length === 0) && (!gapResult.partial?.length && !gapResult.missing?.length) ? (
                  <p className="text-xs text-stone-400 dark:text-stone-400 italic py-4 text-center">Tuyệt vời! Không phát hiện điểm yếu nào cho đề tài này.</p>
                ) : (
                  (gapResult.weaknesses || [
                    ...(gapResult.partial || []).map((p) => ({ ...p, summary: `Cần nâng cấp thêm ${p.gap} cấp`, risk: 'Cần nâng cấp' })),
                    ...(gapResult.missing || []).map((m) => ({ ...m, summary: 'Hồ sơ chưa có kỹ năng này', risk: 'Thiếu hoàn toàn' })),
                  ]).map((w, idx) => (
                    <div key={idx} className="p-3.5 bg-white dark:bg-neutral-800/90 rounded-xl border border-rose-100 dark:border-rose-900/60 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{w.skillName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              w.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : w.severity === 'high'
                                ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                                : 'bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            {w.risk || (w.gap ? `Thiếu ${w.gap} cấp` : 'Cần bổ sung')}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          {w.studentLevel ? `${w.studentLabel} ➔ ${w.requiredLabel}` : `Cần: ${w.requiredLabel}`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{w.summary}</p>
                      {w.missingCompetencies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {w.missingCompetencies.map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/60">
                              ✕ Thiếu: {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Matched, Partial, Missing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Matched */}
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                  <span>✅</span> Đã đáp ứng ({gapResult.matched?.length || 0})
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đạt chuẩn</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.matched || gapResult.matched.length === 0) ? (
                  <p className="text-xs text-stone-400 dark:text-stone-400 italic">Chưa có kỹ năng nào đạt hoàn toàn.</p>
                ) : (
                  gapResult.matched.map((m, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/50 dark:bg-neutral-800/80 rounded-xl border border-emerald-100 dark:border-neutral-700 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>{m.skillName}</span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{m.studentLabel}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>Nguồn gốc:</span>
                        <span className="font-medium text-violet-700 dark:text-violet-300">
                          {m.classification === 'verified'
                            ? '🛡️ Đã xác thực'
                            : m.classification === 'assessed'
                            ? '✅ Đã kiểm tra'
                            : '📝 Tự khai'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Partial */}
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 pb-2">
                <span className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-1.5">
                  <span>⏳</span> Đang có - Cần nâng cấp ({gapResult.partial?.length || 0})
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Chưa đủ cấp</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.partial || gapResult.partial.length === 0) ? (
                  <p className="text-xs text-stone-400 dark:text-stone-400 italic">Không có kỹ năng nào trong nhóm này.</p>
                ) : (
                  gapResult.partial.map((p, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 dark:bg-neutral-800/80 rounded-xl border border-amber-100 dark:border-neutral-700 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>{p.skillName}</span>
                        <span className="text-amber-700 dark:text-amber-300 font-semibold">Thiếu {p.gap} cấp</span>
                      </div>
                      <div className="text-[11px] text-stone-600 dark:text-stone-300">
                        Hiện tại: <span className="font-medium">{p.studentLabel}</span> ➔ Cần:{' '}
                        <span className="font-medium text-amber-700 dark:text-amber-300">{p.requiredLabel}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Missing */}
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-rose-200/80 dark:border-rose-800/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/50 pb-2">
                <span className="font-bold text-rose-800 dark:text-rose-300 text-sm flex items-center gap-1.5">
                  <span>❌</span> Còn thiếu hoàn toàn ({gapResult.missing?.length || 0})
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Cần học mới</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.missing || gapResult.missing.length === 0) ? (
                  <p className="text-xs text-stone-400 dark:text-stone-400 italic">Không thiếu kỹ năng nào.</p>
                ) : (
                  gapResult.missing.map((ms, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/50 dark:bg-neutral-800/80 rounded-xl border border-rose-100 dark:border-neutral-700 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>{ms.skillName}</span>
                        <span className="text-rose-700 dark:text-rose-300 font-semibold">{ms.requiredLabel}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Ưu tiên học tập: Cấp độ {ms.requiredLevel}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: LEARNING ROADMAP & 4 PILLARS REMEDIATION */}
          {gapResult.learningRoadmap?.length > 0 && (
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-stone-200/80 dark:border-neutral-700/80 shadow-sm space-y-6">
              <div className="border-b border-stone-100 dark:border-neutral-800 pb-4">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>🗺️</span> Lộ trình Cải thiện Năng lực & Tài nguyên Học tập (4 Trụ Cột)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-300 mt-1">
                  Được hệ thống tổng hợp trực tiếp từ: Học phần chuẩn FPT University • Giáo trình slide STE • Video bài giảng thực chiến YouTube • Bộ câu hỏi trắc nghiệm tương tác giúp bù đắp kỹ năng còn thiếu.
                </p>
              </div>

              <div className="space-y-6">
                {gapResult.learningRoadmap.map((item) => (
                  <div
                    key={item.step}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-neutral-700 bg-gradient-to-b from-stone-50/70 to-white dark:from-neutral-800 dark:to-neutral-850 shadow-xs space-y-4"
                  >
                    {/* Header item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-neutral-700 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {item.step}
                        </span>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                            <span>Nâng cao kỹ năng: {item.skillName}</span>
                          </div>
                          <span className="text-[11px] text-stone-500 dark:text-stone-300">
                            {item.gap ? `Khoảng cách cần cải thiện: ${item.gap} cấp độ` : 'Kỹ năng khuyến nghị bổ sung'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-200 font-bold self-start sm:self-auto border border-violet-200 dark:border-violet-700">
                        Ưu tiên #{item.step}
                      </span>
                    </div>

                    {/* 4 Pillars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* PILLAR 1: FPT Course */}
                      <div className="bg-white dark:bg-neutral-800/90 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📚</span> 1. Học phần FPT
                          </span>
                          {item.recommendedCourses?.length === 0 ? (
                            <p className="text-stone-400 dark:text-stone-400 italic text-xs">Chưa có học phần gán.</p>
                          ) : (
                            item.recommendedCourses.map((c, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                  {c.code ? `[${c.code}] ` : ''}{c.title || c.name}
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-stone-300 line-clamp-2">
                                  {c.description || 'Học phần rèn luyện năng lực thực tế.'}
                                </p>
                              </div>
                            ))
                          )}

                          {/* VÌ SAO LẠI LÀ MÔN ĐÓ */}
                          {item.courseRationale && (
                            <div className="p-2.5 bg-blue-50/90 dark:bg-blue-950/60 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed space-y-1">
                              <span className="font-bold flex items-center gap-1 text-blue-800 dark:text-blue-300">
                                <span>💡</span> Vì sao lại là môn học này?
                              </span>
                              <p className="text-[11px] text-blue-850 dark:text-blue-200">{item.courseRationale}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-blue-50 dark:border-blue-900/40 flex items-center justify-between">
                          <span className="text-[10px] text-blue-600 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            Chương trình chính khóa
                          </span>
                        </div>
                      </div>

                      {/* PILLAR 2: Curated Materials & Curriculum */}
                      <div className="bg-white dark:bg-neutral-800/90 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📄</span> 2. Giáo trình & Slide
                          </span>

                          {/* Full Curriculum information */}
                          {item.curriculum ? (
                            <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800 space-y-1.5 text-xs">
                              <div className="font-bold text-stone-900 dark:text-stone-100 leading-snug">
                                📖 {item.curriculum.bookTitle}
                              </div>
                              <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                                NXB: {item.curriculum.publisher}
                              </div>
                              {item.curriculum.coreChapters?.length > 0 && (
                                <div className="space-y-0.5 pt-1 border-t border-amber-200/50 dark:border-amber-800/50">
                                  <span className="text-[10px] font-bold text-stone-700 dark:text-stone-200 uppercase">Chương trọng tâm:</span>
                                  {item.curriculum.coreChapters.map((chap, cIdx) => (
                                    <div key={cIdx} className="text-[10px] text-stone-700 dark:text-stone-200 bg-white/80 dark:bg-neutral-900/80 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/50">
                                      • {chap}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* Additional Slides / Notes */}
                          {item.recommendedMaterials?.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-300 uppercase">Tài liệu / Slide kèm:</span>
                              {item.recommendedMaterials.slice(0, 2).map((m, i) => (
                                <div key={i} className="text-[11px] text-stone-700 dark:text-stone-200 line-clamp-2">
                                  • {m.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-amber-50 dark:border-amber-900/40">
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            Tài liệu STE lưu trữ
                          </span>
                        </div>
                      </div>

                      {/* PILLAR 3: YouTube Video Lecture */}
                      <div className="bg-white dark:bg-neutral-800/90 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="text-rose-600 dark:text-rose-400 font-black">▶</span> 3. Video Bài Giảng
                          </span>
                          {item.youtube ? (
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-2">
                                {item.youtube.title}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-300 flex-wrap">
                                <span className="font-semibold text-rose-700 dark:text-rose-300">{item.youtube.channel}</span>
                                {item.youtube.duration && <span>• {item.youtube.duration}</span>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-stone-400 dark:text-stone-400 italic text-xs">Đang cập nhật video.</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-rose-50 dark:border-rose-900/40 space-y-1.5">
                          {item.youtube && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveVideoSkill(activeVideoSkill === item.skillName ? null : item.skillName)
                              }
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                            >
                              <span>{activeVideoSkill === item.skillName ? '▲ Thu gọn Video' : '▶ Xem Video Trực Tiếp'}</span>
                            </button>
                          )}
                          {item.youtube?.url && (
                            <a
                              href={item.youtube.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-center text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-medium"
                            >
                              Mở trên YouTube ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {/* PILLAR 4: Practice Quiz */}
                      <div className="bg-white dark:bg-neutral-800/90 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📝</span> 4. Bài Quiz Kiểm tra
                          </span>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              Trắc nghiệm Năng lực Chuyên sâu
                            </div>
                            <div className="text-[11px] text-stone-600 dark:text-stone-300">
                              {item.practiceQuestions?.length || 3} câu hỏi tình huống thực tế
                            </div>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400">
                              Đạt &ge; 75% để hệ thống chứng thực đủ năng lực làm đề tài/dự án.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-50 dark:border-emerald-900/40">
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded text-center">
                            Làm bài trực tiếp bên dưới ↓
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EMBEDDED YOUTUBE VIDEO PLAYER (when clicked) */}
                    {activeVideoSkill === item.skillName && (
                      <div className="p-4 bg-stone-900 dark:bg-neutral-900 rounded-2xl text-white space-y-3 shadow-lg border border-stone-700 dark:border-neutral-700 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                            <span>📺</span> Đang phát bài giảng: {item.youtube?.title} ({item.youtube?.channel})
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveVideoSkill(null)}
                            className="text-xs text-stone-300 hover:text-white px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition"
                          >
                            ✕ Thu gọn Video
                          </button>
                        </div>

                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-stone-800 dark:border-neutral-800">
                          {item.youtube?.videoId ? (
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${item.youtube.videoId}?autoplay=1&rel=0`}
                              title={item.youtube.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-300">
                              <p className="text-sm">Video bài giảng đang được tối ưu trình chiếu.</p>
                              <a
                                href={item.youtube?.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold"
                              >
                                Xem bài giảng trên YouTube ↗
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Fallback link if video is not playable */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/10 rounded-xl text-xs text-stone-300">
                          <span>⚠️ Nếu video không phát được do giới hạn mạng hoặc thiết lập trình duyệt:</span>
                          <a
                            href={item.youtube?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1"
                          >
                            <span>Bấm vào đây để mở trực tiếp trên YouTube</span> ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE MULTI-QUESTION QUIZ & PROJECT READINESS EVALUATION */}
                    {item.practiceQuestions?.length > 0 && (() => {
                      const quizEval = quizEvaluations[item.skillName] || {
                        answers: {},
                        submitted: false,
                        score: 0,
                        correctCount: 0,
                        totalQuestions: item.practiceQuestions.length,
                        isPassed: false,
                        isSaving: false,
                        isSaved: false,
                      };
                      const answeredCount = Object.keys(quizEval.answers || {}).length;
                      const totalQuestions = item.practiceQuestions.length;

                      return (
                        <div className="bg-violet-50/50 dark:bg-neutral-850 p-5 rounded-2xl border border-violet-100 dark:border-neutral-700 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-100 dark:border-neutral-700 pb-3">
                            <div>
                              <span className="text-xs font-bold text-violet-900 dark:text-violet-200 flex items-center gap-2 uppercase tracking-wider">
                                <span>✍️</span> BÀI QUIZ ĐÁNH GIÁ NĂNG LỰC DỰ ÁN: {item.skillName}
                              </span>
                              <p className="text-[11px] text-violet-600 dark:text-violet-300 mt-0.5">
                                Hoàn thành đầy đủ bộ câu hỏi để hệ thống đánh giá mức độ sẵn sàng thực tế cho đề tài / dự án.
                              </p>
                            </div>
                            <span className="text-xs text-violet-700 dark:text-violet-200 font-semibold bg-white dark:bg-neutral-800 px-3 py-1 rounded-full border border-violet-200 dark:border-neutral-700 self-start sm:self-auto">
                              Đã làm: <strong>{answeredCount}/{totalQuestions}</strong> câu
                            </span>
                          </div>

                          {/* List of Questions */}
                          <div className="space-y-3.5">
                            {item.practiceQuestions.map((pq, qIdx) => {
                              const selectedOpt = quizEval.answers?.[qIdx];
                              const hasAnswered = selectedOpt !== undefined;
                              const isSubmitted = quizEval.submitted;

                              return (
                                <div key={qIdx} className="bg-white dark:bg-neutral-800/95 p-4 rounded-xl border border-stone-200 dark:border-neutral-700 space-y-3 shadow-2xs">
                                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
                                    Câu {qIdx + 1}: {pq.question}
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {pq.options.map((opt, optIdx) => {
                                      let btnClass = 'border-stone-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-600 bg-stone-50/50 dark:bg-neutral-900/60 text-stone-700 dark:text-stone-200';

                                      if (isSubmitted) {
                                        if (optIdx === pq.answer) {
                                          btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-400';
                                        } else if (optIdx === selectedOpt) {
                                          btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 font-bold';
                                        } else {
                                          btnClass = 'border-stone-100 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-900 text-stone-400 dark:text-stone-500 opacity-60';
                                        }
                                      } else if (hasAnswered && selectedOpt === optIdx) {
                                        btnClass = 'border-violet-600 bg-violet-50 dark:bg-violet-950/80 text-violet-900 dark:text-violet-200 font-bold ring-2 ring-violet-400';
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isSubmitted}
                                          onClick={() => handleAnswerQuizQuestion(item.skillName, qIdx, optIdx)}
                                          className={`px-3 py-2.5 rounded-lg border text-left text-xs transition flex items-center justify-between ${btnClass}`}
                                        >
                                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                          {isSubmitted && optIdx === pq.answer && <span>✅</span>}
                                          {isSubmitted && optIdx === selectedOpt && optIdx !== pq.answer && <span>❌</span>}
                                          {!isSubmitted && selectedOpt === optIdx && <span>🔘</span>}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation when submitted */}
                                  {isSubmitted && (
                                    <div
                                      className={`p-3 rounded-lg text-xs leading-relaxed border ${
                                        selectedOpt === pq.answer
                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                                      }`}
                                    >
                                      <strong>{selectedOpt === pq.answer ? '🎉 Chính xác! ' : '💡 Giải thích: '}</strong>
                                      {pq.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* ACTION BUTTON / EVALUATION RESULT BANNER */}
                          {!quizEval.submitted ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-violet-100 dark:border-neutral-700">
                              <span className="text-xs text-stone-500 dark:text-stone-300">
                                Hãy chọn đáp án cho tất cả câu hỏi trước khi bấm nộp bài đánh giá.
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSubmitQuiz(item.skillName, item.practiceQuestions)}
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                              >
                                <span>🚀</span> Nộp bài & Đánh giá Năng lực Đề tài
                              </button>
                            </div>
                          ) : (
                            /* PROJECT READINESS EVALUATION BANNER */
                            <div className="pt-2 border-t border-violet-100 dark:border-neutral-700 space-y-3">
                              {quizEval.isPassed ? (
                                <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl space-y-3 shadow-xs animate-fadeIn">
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl">🎉</span>
                                    <div>
                                      <div className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-200 uppercase">
                                        ĐÃ ĐÁP ỨNG ĐỦ MỨC ĐỘ NĂNG LỰC ĐỂ LÀM ĐỀ TÀI / DỰ ÁN!
                                      </div>
                                      <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        Kết quả kiểm tra: <strong>{quizEval.correctCount}/{quizEval.totalQuestions} câu đúng ({quizEval.score}%)</strong> - Đạt chuẩn (&ge; 75%)
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-xs text-emerald-850 dark:text-emerald-200 leading-relaxed">
                                    Chúc mừng! Bạn đã nắm vững các nguyên lý thực tế của kỹ năng <strong>{item.skillName}</strong>. Hệ thống đánh giá bạn hoàn toàn đủ khả năng triển khai thành công module này trong đề tài <strong>{selectedTemplateId || 'SWP391'}</strong>.
                                  </p>

                                  <div className="flex flex-wrap items-center gap-3 pt-1">
                                    {!quizEval.isSaved ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveQuizToProfile(item.skillName)}
                                        disabled={quizEval.isSaving}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition hover:scale-[1.01]"
                                      >
                                        {quizEval.isSaving ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                            Đang lưu vào hồ sơ...
                                          </>
                                        ) : (
                                          <>
                                            <span>💾</span> Cập nhật Chứng thực Năng lực vào Hồ sơ Sinh viên
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700">
                                        ✓ Đã cập nhật vào Hồ sơ (Trạng thái: ĐÃ ĐÁNH GIÁ - ASSESSED)
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleResetQuiz(item.skillName)}
                                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium underline px-2 py-1"
                                    >
                                      Làm lại bài Quiz
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-amber-50/90 dark:bg-amber-950/60 border-2 border-amber-500 rounded-2xl space-y-3 shadow-xs animate-fadeIn">
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl">⚠️</span>
                                    <div>
                                      <div className="text-sm sm:text-base font-extrabold text-amber-900 dark:text-amber-200 uppercase">
                                        CHƯA ĐÁP ỨNG ĐỦ MỨC ĐỘ NĂNG LỰC ĐỂ LÀM ĐỀ TÀI / DỰ ÁN
                                      </div>
                                      <div className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                        Kết quả kiểm tra: <strong>{quizEval.correctCount}/{quizEval.totalQuestions} câu đúng ({quizEval.score}%)</strong> - Yêu cầu tối thiểu &ge; 75%
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-xs text-amber-850 dark:text-amber-200 leading-relaxed">
                                    Điểm số hiện tại chưa đạt chuẩn để đảm nhận kỹ năng <strong>{item.skillName}</strong> trong dự án thực tế. Bạn có nguy cơ gặp khó khăn hoặc chậm tiến độ khi code module này. Khuyến nghị xem kỹ video bài giảng YouTube và đọc các chương giáo trình ở trên, sau đó thử sức lại.
                                  </p>

                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleResetQuiz(item.skillName)}
                                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 hover:scale-[1.01]"
                                    >
                                      <span>🔄</span> Làm lại bài Quiz ngay
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
