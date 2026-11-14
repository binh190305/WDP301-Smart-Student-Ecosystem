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

  // Interactive quiz practice answers state: { [`${skillName}_${qIdx}`]: optIdx }
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});

  const handleSelectQuizAnswer = (skillName, qIdx, optIdx) => {
    setSelectedQuizAnswers((prev) => ({
      ...prev,
      [`${skillName}_${qIdx}`]: optIdx,
    }));
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
        <p className="text-sm text-gray-600 mt-1">
          Hợp nhất giữa AI trích xuất tự nhiên và Dự án chuẩn mẫu. Đo lường mức độ sẵn sàng thực tế dựa trên bằng chứng đã kiểm tra.
        </p>
      </div>

      {/* QUICK DEMO PRESETS BAR FOR PRESENTATION */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm shadow-xs">
              🎯
            </span>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Dữ liệu Mẫu Thuyết trình (Click 1 chạm để Demo ngay)
              </h3>
              <p className="text-[11px] text-gray-600">
                Tự động nạp đề tài chuẩn từ bộ môn FPT, kết hợp AI tinh chỉnh và đo khoảng cách năng lực thực tế.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-white text-amber-800 font-semibold rounded-full border border-amber-200 self-start sm:self-auto shadow-2xs">
            Demo Ready
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('web_fullstack_mern')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🌐</span> SWP391: Web Fullstack MERN (12 Kỹ năng)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('ai_data_science')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🤖</span> AIL303m: AI & Hệ thống Gợi ý (Học máy)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('mobile_app_react_native')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📱</span> Mobile App: Sổ tay Sinh viên (React Native)
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('uiux_design')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🎨</span> UI/UX: Design System & Prototype Figma
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoPreset('cloud_devops')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>☁️</span> Cloud & DevOps: Microservices Docker K8s
          </button>
        </div>
      </div>

      {/* SECTION 1: UNIFIED INPUT CONTROLS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Bước 1: Lựa chọn Phương thức Đầu vào
          </span>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setInputMode('template')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'template' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Dự án Mẫu (Database)
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🤖 Dán Mô tả / JD / CV
            </button>
            <button
              onClick={() => setInputMode('both')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'both' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Chọn Cấu trúc Dự án Mẫu từ Cơ sở Dữ liệu ({templates.length} mẫu chuẩn)
              </label>
              <button
                type="button"
                onClick={loadTemplates}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <span>🔄</span> Tải lại danh mục
              </button>
            </div>
            {loadingTemplates ? (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-xl">
                Đang tải danh mục dự án mẫu từ cơ sở dữ liệu...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
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
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold truncate max-w-[120px]">
                            {tmpl.category}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-0.5">
                              ✓ Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-sm text-gray-900 mt-2">{tmpl.title}</div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>🎯 {tmpl.requiredSkills?.length || 0} kỹ năng chuẩn</span>
                        {tmpl.tags?.[0] && <span className="text-gray-400 font-mono text-[10px]">#{tmpl.tags[0]}</span>}
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    📄 Nạp mô tả dự án đang chọn
                  </button>
                )}
                {projectText && (
                  <button
                    type="button"
                    onClick={() => setProjectText('')}
                    className="text-[11px] text-gray-400 hover:text-rose-600"
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
              className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Process button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleProcessPipeline}
            disabled={processingPipeline}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
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
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Bước 2: Danh sách Kỹ năng Yêu cầu Dự án ({editableSkills.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
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
          <form onSubmit={handleAddCustomSkill} className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
            <span className="font-semibold text-gray-700 whitespace-nowrap">Thêm kỹ năng:</span>
            <input
              type="text"
              placeholder="Tên kỹ năng..."
              value={newReqName}
              onChange={(e) => setNewReqName(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg flex-1 min-w-[140px]"
            />
            <select
              value={newReqLevel}
              onChange={(e) => setNewReqLevel(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg"
            >
              {PROFICIENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={newReqImportance}
              onChange={(e) => setNewReqImportance(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg"
            >
              <option value="high">Ưu tiên Cao</option>
              <option value="medium">Ưu tiên Trung bình</option>
              <option value="low">Ưu tiên Thấp</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium"
            >
              ➕ Thêm vào yêu cầu
            </button>
          </form>

          {/* Requirements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
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
              <tbody className="divide-y divide-gray-100">
                {editableSkills.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition">
                    <td className="p-3 font-bold text-gray-900">{req.name}</td>
                    <td className="p-3 text-gray-500">{req.category || 'General'}</td>
                    <td className="p-3">
                      <select
                        value={req.requiredLevel}
                        onChange={(e) => handleLevelChange(idx, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-xs bg-white"
                      >
                        {PROFICIENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
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
                    <td className="p-3 text-gray-600 max-w-xs">
                      {req.requiredCompetencies?.length > 0 ? (
                        <span className="line-clamp-2">{req.requiredCompetencies.join(', ')}</span>
                      ) : (
                        <span className="text-gray-400 italic">Cơ bản</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 max-w-xs truncate" title={req.reasoning}>
                      {req.reasoning || 'Yêu cầu của dự án'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-gray-400 hover:text-rose-600 text-sm"
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

          {/* Evidence Narrative Box */}
          {gapResult.evidenceExplanation && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Báo cáo Đối chiếu Bằng chứng Năng lực
              </h3>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
                {gapResult.evidenceExplanation}
              </div>
            </div>
          )}

          {/* SECTION: STRENGTHS & WEAKNESSES PROFILING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-base shadow-xs">
                    💪
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Điểm Mạnh Cốt Lõi (Key Strengths)</h3>
                    <p className="text-[11px] text-gray-500">Các năng lực đã được kiểm chứng thực tế và đáp ứng chuẩn đề tài</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {gapResult.strengths?.length || gapResult.matched?.length || 0} Thế mạnh
                </span>
              </div>

              <div className="space-y-3">
                {(!gapResult.strengths || gapResult.strengths.length === 0) && (!gapResult.matched || gapResult.matched.length === 0) ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">Chưa ghi nhận thế mạnh đủ điều kiện cho dự án này.</p>
                ) : (
                  (gapResult.strengths || gapResult.matched).map((str, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{str.skillName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            {str.studentLabel}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                          {str.classification === 'verified' ? '🛡️ Đã xác thực' : '✅ Đã kiểm tra'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {str.summary || `Đã chứng minh năng lực đạt cấp độ ${str.studentLabel}, đáp ứng xuất sắc yêu cầu dự án.`}
                      </p>
                      {str.demonstratedCompetencies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {str.demonstratedCompetencies.map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
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
            <div className="bg-gradient-to-br from-rose-50/80 via-white to-amber-50/30 p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-base shadow-xs">
                    ⚠️
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Điểm Yếu & Khoảng Cách Cần Khắc Phục</h3>
                    <p className="text-[11px] text-gray-500">Các kỹ năng thiếu hụt có nguy cơ gây rủi ro tiến độ dự án</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  {gapResult.weaknesses?.length || ((gapResult.partial?.length || 0) + (gapResult.missing?.length || 0)) || 0} Khoảng cách
                </span>
              </div>

              <div className="space-y-3">
                {(!gapResult.weaknesses || gapResult.weaknesses.length === 0) && (!gapResult.partial?.length && !gapResult.missing?.length) ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">Tuyệt vời! Không phát hiện điểm yếu nào cho đề tài này.</p>
                ) : (
                  (gapResult.weaknesses || [
                    ...(gapResult.partial || []).map((p) => ({ ...p, summary: `Cần nâng cấp thêm ${p.gap} cấp`, risk: 'Cần nâng cấp' })),
                    ...(gapResult.missing || []).map((m) => ({ ...m, summary: 'Hồ sơ chưa có kỹ năng này', risk: 'Thiếu hoàn toàn' })),
                  ]).map((w, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-rose-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{w.skillName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              w.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : w.severity === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {w.risk || (w.gap ? `Thiếu ${w.gap} cấp` : 'Cần bổ sung')}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {w.studentLevel ? `${w.studentLabel} ➔ ${w.requiredLabel}` : `Cần: ${w.requiredLabel}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{w.summary}</p>
                      {w.missingCompetencies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {w.missingCompetencies.map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
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
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                  <span>✅</span> Đã đáp ứng ({gapResult.matched?.length || 0})
                </span>
                <span className="text-xs text-emerald-600 font-medium">Đạt chuẩn</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.matched || gapResult.matched.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">Chưa có kỹ năng nào đạt hoàn toàn.</p>
                ) : (
                  gapResult.matched.map((m, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{m.skillName}</span>
                        <span className="text-emerald-700 font-semibold">{m.studentLabel}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Nguồn gốc:</span>
                        <span className="font-medium text-purple-700">
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
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
                  <span>⏳</span> Đang có - Cần nâng cấp ({gapResult.partial?.length || 0})
                </span>
                <span className="text-xs text-amber-600 font-medium">Chưa đủ cấp</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.partial || gapResult.partial.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">Không có kỹ năng nào trong nhóm này.</p>
                ) : (
                  gapResult.partial.map((p, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{p.skillName}</span>
                        <span className="text-amber-700 font-semibold">Thiếu {p.gap} cấp</span>
                      </div>
                      <div className="text-[11px] text-gray-600">
                        Hiện tại: <span className="font-medium">{p.studentLabel}</span> ➔ Cần:{' '}
                        <span className="font-medium">{p.requiredLabel}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Missing */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                <span className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                  <span>❌</span> Còn thiếu hoàn toàn ({gapResult.missing?.length || 0})
                </span>
                <span className="text-xs text-rose-600 font-medium">Cần học mới</span>
              </div>
              <div className="space-y-2">
                {(!gapResult.missing || gapResult.missing.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">Không thiếu kỹ năng nào.</p>
                ) : (
                  gapResult.missing.map((ms, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{ms.skillName}</span>
                        <span className="text-rose-700 font-semibold">{ms.requiredLabel}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">Ưu tiên học tập: Cấp độ {ms.requiredLevel}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: LEARNING ROADMAP & 4 PILLARS REMEDIATION */}
          {gapResult.learningRoadmap?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> Lộ trình Cải thiện Năng lực & Tài nguyên Học tập (4 Trụ Cột)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Được hệ thống tổng hợp trực tiếp từ: Học phần chuẩn FPT University • Giáo trình slide STE • Video bài giảng thực chiến YouTube • Bộ câu hỏi trắc nghiệm tương tác giúp bù đắp kỹ năng còn thiếu.
                </p>
              </div>

              <div className="space-y-6">
                {gapResult.learningRoadmap.map((item) => (
                  <div
                    key={item.step}
                    className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50/70 to-white shadow-xs space-y-4"
                  >
                    {/* Header item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {item.step}
                        </span>
                        <div>
                          <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <span>Nâng cao kỹ năng: {item.skillName}</span>
                          </div>
                          <span className="text-[11px] text-gray-500">
                            {item.gap ? `Khoảng cách cần cải thiện: ${item.gap} cấp độ` : 'Kỹ năng khuyến nghị bổ sung'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold self-start sm:self-auto border border-indigo-200">
                        Ưu tiên #{item.step}
                      </span>
                    </div>

                    {/* 4 Pillars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* PILLAR 1: FPT Course */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📚</span> 1. Học phần FPT
                          </span>
                          {item.recommendedCourses?.length === 0 ? (
                            <p className="text-gray-400 italic text-xs">Chưa có học phần gán.</p>
                          ) : (
                            item.recommendedCourses.map((c, i) => (
                              <div key={i} className="space-y-1">
                                <div className="text-xs font-bold text-blue-700">
                                  {c.code ? `[${c.code}] ` : ''}{c.title || c.name}
                                </div>
                                <p className="text-[11px] text-gray-500 line-clamp-2">
                                  {c.description || 'Học phần rèn luyện năng lực thực tế.'}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                            Chương trình chính khóa
                          </span>
                        </div>
                      </div>

                      {/* PILLAR 2: Curated Materials */}
                      <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📄</span> 2. Giáo trình & Slide
                          </span>
                          {item.recommendedMaterials?.length === 0 ? (
                            <p className="text-gray-400 italic text-xs">Tài liệu đang cập nhật.</p>
                          ) : (
                            item.recommendedMaterials.slice(0, 2).map((m, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="text-xs font-medium text-gray-800 line-clamp-2">
                                  • {m.title}
                                </div>
                                {m.desc && <p className="text-[10px] text-gray-500 line-clamp-1">{m.desc}</p>}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                            Tài liệu STE lưu trữ
                          </span>
                        </div>
                      </div>

                      {/* PILLAR 3: YouTube Video Lecture */}
                      <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="text-rose-600 font-black">▶</span> 3. Video Bài Giảng
                          </span>
                          {item.youtube ? (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-900 line-clamp-2">
                                {item.youtube.title}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span className="font-semibold text-rose-700">{item.youtube.channel}</span>
                                {item.youtube.duration && <span>• {item.youtube.duration}</span>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 italic text-xs">Đang cập nhật video.</p>
                          )}
                        </div>
                        {item.youtube?.url && (
                          <div className="pt-2">
                            <a
                              href={item.youtube.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                            >
                              <span>▶</span> Xem trên YouTube
                            </a>
                          </div>
                        )}
                      </div>

                      {/* PILLAR 4: Practice Quiz */}
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📝</span> 4. Bài Quiz Kiểm tra
                          </span>
                          {item.recommendedQuizzes?.length === 0 ? (
                            <p className="text-gray-400 italic text-xs">Chưa có bài quiz tương ứng.</p>
                          ) : (
                            item.recommendedQuizzes.map((q, i) => (
                              <div key={i} className="space-y-1">
                                <div className="text-xs font-bold text-emerald-800 line-clamp-2">
                                  {q.title}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {q.questionCount || 4} câu hỏi trắc nghiệm
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="pt-2">
                          <Link
                            to="/quizzes"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                          >
                            <span>✍️</span> Làm bài Quiz ngay
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Practice Questions (Luyện tập tại chỗ) */}
                    {item.practiceQuestions?.length > 0 && (
                      <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>💡</span> Câu hỏi Ôn tập Thực tế (Tương tác nhanh tại chỗ):
                          </span>
                          <span className="text-[10px] text-indigo-600 font-medium">Click đáp án để kiểm tra kết quả</span>
                        </div>

                        {item.practiceQuestions.map((pq, qIdx) => {
                          const stateKey = `${item.skillName}_${qIdx}`;
                          const selectedOpt = selectedQuizAnswers[stateKey];
                          const hasAnswered = selectedOpt !== undefined;
                          const isCorrect = selectedOpt === pq.answer;

                          return (
                            <div key={qIdx} className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                              <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                                {qIdx + 1}. {pq.question}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {pq.options.map((opt, optIdx) => {
                                  let btnClass = 'border-gray-200 hover:border-gray-300 bg-gray-50/50 text-gray-700';
                                  if (hasAnswered) {
                                    if (optIdx === pq.answer) {
                                      btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-400';
                                    } else if (optIdx === selectedOpt) {
                                      btnClass = 'border-rose-500 bg-rose-50 text-rose-800 font-bold';
                                    } else {
                                      btnClass = 'border-gray-100 bg-gray-50 text-gray-400 opacity-60';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      disabled={hasAnswered}
                                      onClick={() => handleSelectQuizAnswer(item.skillName, qIdx, optIdx)}
                                      className={`px-3 py-2 rounded-lg border text-left text-xs transition flex items-center justify-between ${btnClass}`}
                                    >
                                      <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                      {hasAnswered && optIdx === pq.answer && <span>✅</span>}
                                      {hasAnswered && optIdx === selectedOpt && optIdx !== pq.answer && <span>❌</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div
                                  className={`p-2.5 rounded-lg text-[11px] leading-relaxed border ${
                                    isCorrect
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  <strong>{isCorrect ? '🎉 Chính xác! ' : '💡 Giải thích: '}</strong>
                                  {pq.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
