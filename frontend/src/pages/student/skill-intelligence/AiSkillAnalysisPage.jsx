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

  // Load Database-backed templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await skillIntelligenceApi.getTemplates();
        if (res.data?.success) {
          const list = res.data.data || [];
          setTemplates(list);
          if (list.length > 0) {
            setSelectedTemplateId(list[0].code || list[0]._id);
          }
        }
      } catch {
        showToast('Không thể tải danh sách dự án mẫu từ hệ thống', 'error');
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // When template changes, populate preview text
  const handleTemplateChange = (val) => {
    setSelectedTemplateId(val);
    const tmpl = templates.find((t) => t.code === val || t._id === val);
    if (tmpl && tmpl.sampleProjectText && !projectText) {
      setProjectText(tmpl.sampleProjectText);
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
      if (res.data?.success) {
        setProjectRequirements(res.data.data);
        setEditableSkills(res.data.data.requirements || []);
        showToast(
          `Đã trích xuất & chuẩn hoá thành công ${res.data.data.totalSkills} kỹ năng yêu cầu`,
          'success'
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi phân tích yêu cầu dự án', 'error');
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
      if (res.data?.success) {
        setGapResult(res.data.data);
        showToast('Đã hoàn thành phân tích khoảng cách năng lực dựa trên bằng chứng!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi đo khoảng cách kỹ năng', 'error');
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
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Chọn Cấu trúc Dự án Mẫu từ Cơ sở Dữ liệu
            </label>
            {loadingTemplates ? (
              <div className="text-xs text-gray-400">Đang tải danh mục dự án mẫu...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.code || selectedTemplateId === tmpl._id;
                  return (
                    <div
                      key={tmpl.code || tmpl._id}
                      onClick={() => handleTemplateChange(tmpl.code || tmpl._id)}
                      className={`cursor-pointer p-4 rounded-xl border transition text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900">{tmpl.title}</div>
                        <span className="text-[11px] text-indigo-600 font-medium">{tmpl.category}</span>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.description}</p>
                      </div>
                      <div className="mt-3 text-[11px] text-gray-400">
                        {tmpl.requiredSkills?.length || 0} kỹ năng chuẩn
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
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {inputMode === 'both' ? 'Bổ sung Mô tả / Yêu cầu Công nghệ để AI Tinh chỉnh' : 'Mô tả Dự án / Đề tài / JD Tuyển dụng'}
            </label>
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
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
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

          {/* SECTION 4: LEARNING ROADMAP & REAL DATABASE REMEDIATION */}
          {gapResult.learningRoadmap?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🗺️</span> Lộ trình Học tập & Nguồn lực Đề xuất từ Hệ thống (Learning Roadmap)
              </h3>
              <p className="text-xs text-gray-500">
                Các học phần, tài liệu và bài Quiz được tự động truy xuất trực tiếp từ cơ sở dữ liệu AACS tương ứng với các kỹ năng còn thiếu.
              </p>

              <div className="space-y-4 pt-2">
                {gapResult.learningRoadmap.map((item) => (
                  <div key={item.step} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {item.step}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">Nâng cao kỹ năng: {item.skillName}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        Ưu tiên #{item.step}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* Recommended Courses */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <span>📚</span> Khóa học liên quan:
                        </span>
                        {item.recommendedCourses?.length === 0 ? (
                          <p className="text-gray-400 italic text-[11px]">Chưa có khóa học gán trực tiếp.</p>
                        ) : (
                          item.recommendedCourses.map((c, i) => (
                            <div key={i} className="text-[11px] text-indigo-600 font-medium truncate">
                              • {c.name || c.title || c.code}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Recommended Materials */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <span>📄</span> Tài liệu ôn tập:
                        </span>
                        {item.recommendedMaterials?.length === 0 ? (
                          <p className="text-gray-400 italic text-[11px]">Tài liệu đang cập nhật.</p>
                        ) : (
                          item.recommendedMaterials.map((m, i) => (
                            <div key={i} className="text-[11px] text-gray-700 truncate">
                              • {m.title}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Recommended Quizzes */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <span>📝</span> Quiz kiểm tra năng lực:
                        </span>
                        {item.recommendedQuizzes?.length === 0 ? (
                          <p className="text-gray-400 italic text-[11px]">Chưa có bài quiz tương ứng.</p>
                        ) : (
                          item.recommendedQuizzes.map((q, i) => (
                            <div key={i} className="text-[11px] text-emerald-700 font-semibold truncate">
                              • {q.title}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
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
