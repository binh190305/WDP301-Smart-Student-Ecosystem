// Unified AI Skill Analysis & Project Readiness Intelligence (SI-01 & SI-05)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { skillIntelligenceApi, courseApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

const EVIDENCE_TYPES = [
  { value: 'PROJECT_DESCRIPTION', label: 'Mô tả Đề tài / Dự án' },
  { value: 'WORK_EXPERIENCE', label: 'Mô tả Công việc / Tuyển dụng' },
  { value: 'ACADEMIC_INTEREST', label: 'Mối quan tâm Học thuật' },
  { value: 'CERTIFICATE', label: 'Chứng chỉ / Khóa học' },
  { value: 'MANUAL', label: 'Khác' },
];

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Mới bắt đầu (Cấp 1)', level: 1 },
  { value: 'elementary', label: 'Cơ bản (Cấp 2)', level: 2 },
  { value: 'intermediate', label: 'Trung cấp (Cấp 3)', level: 3 },
  { value: 'advanced', label: 'Nâng cao (Cấp 4)', level: 4 },
  { value: 'expert', label: 'Chuyên gia (Cấp 5)', level: 5 },
];

const CATEGORY_COLORS = {
  'Frontend Development': { bg: '#3b82f6', light: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Backend Development': { bg: '#10b981', light: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  'Database': { bg: '#f59e0b', light: '#fffbeb', text: '#b45309', border: '#fde68a' },
  'DevOps & Cloud': { bg: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  'Artificial Intelligence': { bg: '#ec4899', light: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
  'UI/UX Design': { bg: '#06b6d4', light: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  'Software Engineering': { bg: '#6366f1', light: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  'Khác': { bg: '#64748b', light: '#f8fafc', text: '#334155', border: '#cbd5e1' },
};

const TEXT_DEMO_PROJECTS = [
  {
    title: '🌐 Web Fullstack MERN & Cloud',
    desc: 'Hệ thống thương mại điện tử với React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB, Docker và Git.',
    text: 'Dự án phát triển nền tảng Web Fullstack phục vụ mua sắm trực tuyến. Phía frontend xây dựng Single Page Application bằng React, TypeScript, Tailwind CSS và Redux Toolkit. Phía backend sử dụng Node.js, Express REST API, xử lý JWT authentication và kết nối cơ sở dữ liệu MongoDB. Triển khai đóng gói ứng dụng với Docker và quản lý mã nguồn bằng Git flow.',
  },
  {
    title: '🤖 Trí tuệ Nhân tạo & Xử lý Dữ liệu',
    desc: 'Hệ thống gợi ý đề tài và ghép nhóm thông minh sử dụng Python, Machine Learning, Deep Learning và SQL.',
    text: 'Dự án nghiên cứu và xây dựng mô hình AI gợi ý đồ án tốt nghiệp và ghép nhóm tự động cho sinh viên. Hệ thống sử dụng Python và Pandas để tiền xử lý dữ liệu sinh viên từ cơ sở dữ liệu SQL. Sau đó áp dụng các thuật toán Machine Learning (Scikit-Learn) và mạng nơ-ron Deep Learning để mô hình hóa sự tương thích kỹ năng và đánh giá hiệu quả ghép đội ngũ.',
  },
  {
    title: '📱 Mobile App & Thiết kế UI/UX',
    desc: 'Ứng dụng di động sinh viên với Figma UI/UX, React Native, TypeScript và Firebase.',
    text: 'Đồ án xây dựng ứng dụng di động hỗ trợ học tập cho sinh viên. Giai đoạn đầu tập trung nghiên cứu trải nghiệm người dùng, thiết kế Design System và Wireframe prototype tương tác trên Figma. Giai đoạn hai lập trình ứng dụng di động đa nền tảng bằng React Native và TypeScript, tích hợp Firebase Authentication và RESTful API.',
  },
];

const PRESET_PROJECTS = [
  {
    id: 'fullstack',
    title: '🌐 Web Fullstack (MERN)',
    desc: 'React, Node.js, Express, MongoDB, TypeScript, Docker',
    skills: [
      { name: 'React', minProficiency: 'advanced' },
      { name: 'Node.js', minProficiency: 'intermediate' },
      { name: 'Express', minProficiency: 'intermediate' },
      { name: 'MongoDB', minProficiency: 'intermediate' },
      { name: 'TypeScript', minProficiency: 'intermediate' },
      { name: 'Docker', minProficiency: 'intermediate' },
    ],
  },
  {
    id: 'ai-data',
    title: '🤖 Trí tuệ Nhân tạo & Data',
    desc: 'Python, Machine Learning, Deep Learning, SQL, Git',
    skills: [
      { name: 'Python', minProficiency: 'advanced' },
      { name: 'Machine Learning', minProficiency: 'intermediate' },
      { name: 'Deep Learning', minProficiency: 'intermediate' },
      { name: 'SQL', minProficiency: 'intermediate' },
      { name: 'Git', minProficiency: 'intermediate' },
    ],
  },
  {
    id: 'mobile',
    title: '📱 Mobile App (React Native)',
    desc: 'React Native, JavaScript, TypeScript, Firebase, Git',
    skills: [
      { name: 'React Native', minProficiency: 'intermediate' },
      { name: 'JavaScript', minProficiency: 'advanced' },
      { name: 'TypeScript', minProficiency: 'intermediate' },
      { name: 'Git', minProficiency: 'intermediate' },
    ],
  },
  {
    id: 'uiux',
    title: '🎨 Thiết kế UI/UX & Frontend',
    desc: 'Figma, UI/UX, HTML/CSS, React, Tailwind CSS',
    skills: [
      { name: 'Figma', minProficiency: 'advanced' },
      { name: 'HTML/CSS', minProficiency: 'advanced' },
      { name: 'React', minProficiency: 'intermediate' },
      { name: 'UI/UX', minProficiency: 'advanced' },
    ],
  },
];

export default function AiSkillAnalysisPage() {
  const toast = useToast();

  // Mode: 'text' (NLP/LLM extraction) or 'target' (custom skill builder / presets)
  const [mode, setMode] = useState('text');

  // Mode 1: Text
  const [text, setText] = useState('');
  const [evidenceType, setEvidenceType] = useState('PROJECT_DESCRIPTION');

  // Mode 2: Target skills
  const [targetSkills, setTargetSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', minProficiency: 'intermediate' });
  const [projectDescription, setProjectDescription] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  // Common result & states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedToSave, setSelectedToSave] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Remediation states
  const [enrollingCode, setEnrollingCode] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showPracticeQuiz, setShowPracticeQuiz] = useState({});

  // Fast apply text sample
  const applyTextDemo = (sample) => {
    setText(sample.text);
    setError('');
    setResult(null);
    setSaved(false);
  };

  // Fast apply target preset
  const applyTargetPreset = (preset) => {
    setActivePreset(preset.id);
    setTargetSkills([...preset.skills]);
    setProjectDescription(preset.desc);
    setError('');
    setResult(null);
  };

  const addTargetSkill = () => {
    if (!newSkill.name.trim()) return;
    setTargetSkills((prev) => [...prev, { ...newSkill }]);
    setNewSkill({ name: '', minProficiency: 'intermediate' });
    setActivePreset(null);
  };

  const removeTargetSkill = (idx) => {
    setTargetSkills((prev) => prev.filter((_, i) => i !== idx));
    setActivePreset(null);
  };

  // Execute Analysis
  const handleAnalyze = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    try {
      if (mode === 'text') {
        if (text.trim().length < 10) {
          setError('Vui lòng nhập tối thiểu 10 ký tự mô tả đề tài / dự án.');
          setLoading(false);
          return;
        }

        const res = await skillIntelligenceApi.extract({ text, evidenceType, saveToProfile: false });
        const data = res?.data?.data || res?.data || res || {};
        setResult({
          mode: 'text',
          skills: data.skills || [],
          batchId: data.batchId,
          source: data.source,
          gapAnalysis: data.gapAnalysis,
        });

        const skillsArr = Array.isArray(data.skills) ? data.skills : [];
        setSelectedToSave(new Set(skillsArr.map((_, i) => i)));

        if (data.gapAnalysis?.remediation) {
          const enrolled = new Set();
          data.gapAnalysis.remediation.forEach((item) => {
            if (item.course?.isEnrolled) enrolled.add(item.course.code);
          });
          setEnrolledCourses(enrolled);
        }
      } else {
        if (targetSkills.length === 0) {
          setError('Vui lòng thêm ít nhất một kỹ năng yêu cầu hoặc chọn dự án mẫu.');
          setLoading(false);
          return;
        }

        const res = await skillIntelligenceApi.analyzeGap({ targetSkills, projectDescription });
        const data = res?.data?.data || res?.data || res || {};

        setResult({
          mode: 'target',
          gapAnalysis: {
            readinessScore: data.coverageScore || 0,
            matched: data.matched || [],
            partial: data.partial || [],
            missing: data.missing || [],
            overallAssessment: data.explanation || '',
            remediation: data.remediation || [],
          },
        });

        if (data.remediation) {
          const enrolled = new Set();
          data.remediation.forEach((item) => {
            if (item.course?.isEnrolled) enrolled.add(item.course.code);
          });
          setEnrolledCourses(enrolled);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi phân tích kỹ năng.');
    } finally {
      setLoading(false);
    }
  };

  // Save extracted skills to profile
  const handleSaveToProfile = async () => {
    if (!result?.skills || selectedToSave.size === 0) return;
    setSaving(true);
    try {
      const toSave = result.skills.filter((_, i) => selectedToSave.has(i));
      await skillIntelligenceApi.saveSuggestions({ skills: toSave, batchId: result.batchId });
      setSaved(true);
      toast.success(`Đã lưu thành công ${toSave.length} kỹ năng vào Hồ sơ của bạn!`);
    } catch (err) {
      toast.error(err?.message || 'Không thể lưu kỹ năng.');
    } finally {
      setSaving(false);
    }
  };

  // Quick enroll course
  const handleEnrollCourse = async (course) => {
    if (!course?._id) {
      toast.info(`Học phần ${course.code} đã có trong chương trình đào tạo FPT.`);
      return;
    }
    setEnrollingCode(course.code);
    try {
      await courseApi.enroll(course._id);
      setEnrolledCourses((prev) => new Set(prev).add(course.code));
      toast.success(`Đã ghi danh thành công học phần ${course.code} - ${course.title}!`);
    } catch (err) {
      toast.error(err?.message || `Không thể ghi danh học phần ${course.code}`);
    } finally {
      setEnrollingCode(null);
    }
  };

  const gap = result?.gapAnalysis;
  const readiness = gap?.readinessScore ?? 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl p-2 bg-indigo-50 rounded-2xl border border-indigo-100">🤖</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Phân tích & Đo khoảng cách Kỹ năng Dự án
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Tích hợp AI bóc tách yêu cầu công nghệ, đo lường điểm sẵn sàng (% Readiness), chỉ ra điểm yếu và mở lộ trình học tập 4 trụ cột (Môn học FPT, Tài liệu STE, Video YouTube, Quiz).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/app/skill-intelligence/graph"
            className="text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-xs"
          >
            <span>🌐</span>
            <span>Xem Đồ thị Kỹ năng</span>
          </Link>
          <Link
            to="/app/skill-intelligence/profile"
            className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5"
          >
            <span>👤</span>
            <span>Hồ sơ Kỹ năng</span>
          </Link>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl w-fit border border-gray-200/70">
        <button
          onClick={() => { setMode('text'); setError(''); setResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            mode === 'text'
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🤖</span>
          <span>Chế độ 1: Dán mô tả đề tài / CV (AI trích xuất tự động)</span>
        </button>

        <button
          onClick={() => { setMode('target'); setError(''); setResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            mode === 'target'
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🎯</span>
          <span>Chế độ 2: Chọn từ Bộ kỹ năng mục tiêu & Dự án mẫu</span>
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
        {mode === 'text' ? (
          <>
            {/* Quick Demo Samples */}
            <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
                  <span>⚡</span>
                  <span>Mẫu đề tài / dự án thử nghiệm nhanh</span>
                </div>
                <span className="text-[11px] text-indigo-600 font-medium">(Nhấp để tự động nạp văn bản mô tả)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TEXT_DEMO_PROJECTS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => applyTextDemo(sample)}
                    className="text-left p-3 rounded-xl bg-white/95 border border-indigo-200/80 hover:bg-white hover:border-indigo-400 text-xs text-gray-800 transition shadow-xs hover:shadow-sm"
                  >
                    <div className="font-bold text-indigo-950 truncate">{sample.title}</div>
                    <div className="text-gray-500 line-clamp-1 mt-1 text-[11px]">{sample.desc}</div>
                    <div className="text-indigo-600 font-semibold mt-1.5 text-[11px] flex items-center gap-1">
                      <span>Chọn mẫu này</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loại thông tin nguồn</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {EVIDENCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nội dung mô tả đề tài / dự án hoặc yêu cầu tuyển dụng <span className="text-gray-400 font-normal">(tối thiểu 10 ký tự)</span>
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Dán mô tả các công nghệ, framework, mục tiêu hoặc giải pháp kỹ thuật cần áp dụng.
                  </p>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed"
                placeholder="Ví dụ: Dự án phát triển hệ sinh thái sinh viên với React, Node.js, Express REST API, MongoDB, Docker và Git..."
              />
              <div className="text-right text-[11px] text-gray-400">
                {text.length}/3000 ký tự
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Mode 2: Target Skill Builder */}
            <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Dự án mẫu có sẵn (Nạp ngay danh mục kỹ năng)</span>
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">(Nhấp để nạp bộ kỹ năng chuẩn)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PRESET_PROJECTS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyTargetPreset(preset)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      activePreset === preset.id
                        ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white/90 border-gray-200 hover:bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900 truncate">{preset.title}</div>
                    <div className="text-gray-500 mt-1 line-clamp-1 text-[11px]">{preset.desc}</div>
                    <div className="text-indigo-600 font-semibold mt-1 text-[11px] flex items-center gap-1">
                      <span>{preset.skills.length} kỹ năng</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Skill Row */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">Kỹ năng yêu cầu của dự án ({targetSkills.length})</label>
                {targetSkills.length > 0 && (
                  <button
                    onClick={() => { setTargetSkills([]); setActivePreset(null); setResult(null); }}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTargetSkill())}
                  placeholder="Nhập tên kỹ năng (ví dụ: React, Docker, Python...) và bấm Enter"
                  className="flex-1 min-w-48 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <select
                  value={newSkill.minProficiency}
                  onChange={(e) => setNewSkill((p) => ({ ...p, minProficiency: e.target.value }))}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                >
                  {PROFICIENCY_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label} (tối thiểu)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addTargetSkill}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  + Thêm kỹ năng
                </button>
              </div>

              {/* Target Pills */}
              {targetSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {targetSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs px-3 py-1.5 rounded-full font-semibold"
                    >
                      <span>{s.name}</span>
                      <span className="text-indigo-400">·</span>
                      <span className="text-indigo-600 font-normal">
                        {PROFICIENCY_OPTIONS.find((l) => l.value === s.minProficiency)?.label || s.minProficiency}
                      </span>
                      <button
                        onClick={() => removeTargetSkill(idx)}
                        className="ml-1 text-indigo-400 hover:text-rose-600 font-bold"
                        title="Xóa"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Chưa có kỹ năng nào. Hãy nhập tên kỹ năng hoặc chọn một trong các dự án mẫu bên trên.
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả tóm tắt dự án (tùy chọn)</label>
                <input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Giúp AI hiểu ngữ cảnh dự án để đưa ra lời khuyên học tập chính xác nhất..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || (mode === 'text' ? text.trim().length < 10 : targetSkills.length === 0)}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <span className="animate-spin text-base">⏳</span>
              <span>AI đang bóc tách kỹ năng, đo khoảng cách và xây dựng lộ trình học tập...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Bắt đầu Phân tích Kỹ năng & Đo khoảng cách Dự án</span>
            </>
          )}
        </button>
      </div>

      {/* RESULTS DISPLAY */}
      {result && gap && (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION 1: READINESS / COVERAGE SCORE CARD */}
          <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/30 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <span>📊</span>
                  <span>Kết quả Đánh giá Năng lực Sinh viên</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  Độ Sẵn Sàng Cho Dự Án: <span className={readiness >= 80 ? 'text-emerald-600' : readiness >= 50 ? 'text-amber-600' : 'text-rose-600'}>{readiness}%</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đo lường độ khớp giữa năng lực thực tế của bạn với các yêu cầu kỹ thuật trọng tâm của đề tài.
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold shadow-xs ${
                    readiness >= 80
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : readiness >= 50
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {readiness >= 80 ? '🌟 Rất phù hợp đề tài' : readiness >= 50 ? '⚡ Phù hợp vừa phải' : '⚠️ Cần bổ sung năng lực'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  readiness >= 80 ? 'bg-emerald-500' : readiness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, readiness))}%` }}
              />
            </div>

            {/* 3 Metric Counters */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{gap.matched?.length || 0}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">Đã đạt yêu cầu</p>
                <span className="text-[10px] text-emerald-600">Sẵn sàng áp dụng</span>
              </div>

              <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-100 text-center">
                <p className="text-2xl font-extrabold text-amber-600">{gap.partial?.length || 0}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">Cần nâng cao</p>
                <span className="text-[10px] text-amber-700">Thiếu bậc trình độ</span>
              </div>

              <div className="bg-white/80 p-3.5 rounded-2xl border border-rose-100 text-center">
                <p className="text-2xl font-extrabold text-rose-600">{gap.missing?.length || 0}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">Chưa có kỹ năng</p>
                <span className="text-[10px] text-rose-600">Cần học từ đầu</span>
              </div>
            </div>

            {/* AI Assessment Narrative */}
            {gap.overallAssessment && (
              <div className="bg-white/90 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-2.5">
                <span className="text-lg">💡</span>
                <div className="space-y-0.5">
                  <div className="font-bold text-indigo-900">Nhận định & Lời khuyên từ AI:</div>
                  <div className="text-gray-700 leading-relaxed">{gap.overallAssessment}</div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PROFICIENCY LEVEL COMPARISON BAR CHART */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>📊</span>
                  <span>So sánh Trình độ Chi tiết Từng Kỹ năng</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Đối chiếu mức độ hiện tại của sinh viên với chuẩn đầu ra tối thiểu của đề tài</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 bg-indigo-600 rounded-sm" /> Hiện tại</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 bg-gray-300 rounded-sm" /> Yêu cầu</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {[...(gap.matched || []), ...(gap.partial || []), ...(gap.missing || [])].map((item, idx) => {
                const cur = item.studentLevel || 0;
                const req = item.requiredLevel || 3;
                const isMatched = cur >= req;
                const isPartial = cur > 0 && cur < req;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{item.skillName}</span>
                      <span className="text-gray-500 text-[11px]">
                        {cur > 0 ? `Cấp ${cur}/5 (${item.studentLabel})` : 'Chưa có'} → Yêu cầu: Cấp {req}/5 ({item.requiredLabel})
                      </span>
                    </div>

                    <div className="relative w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
                      {/* Required indicator line */}
                      <div
                        className="absolute top-0 bottom-0 border-r-2 border-dashed border-gray-600 z-10"
                        style={{ left: `${(req / 5) * 100}%` }}
                        title={`Yêu cầu tối thiểu: cấp ${req}`}
                      />
                      {/* Current level fill */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMatched ? 'bg-emerald-500' : isPartial ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${(cur / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: 3-COLUMN BREAKDOWN (MATCHED, PARTIAL, MISSING) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Matched */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                  <span>✅</span>
                  <span>Đã đáp ứng ({gap.matched?.length || 0})</span>
                </h3>
                <span className="text-[11px] bg-emerald-200/60 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Đạt chuẩn
                </span>
              </div>

              {gap.matched?.length > 0 ? (
                <ul className="space-y-2">
                  {gap.matched.map((s, idx) => (
                    <li key={idx} className="bg-white p-3 rounded-2xl border border-emerald-100 text-xs shadow-xs">
                      <div className="font-bold text-gray-900">{s.skillName}</div>
                      <div className="text-emerald-700 mt-1">
                        Trình độ: <span className="font-semibold">{s.studentLabel}</span>
                        {s.surplus > 0 && <span className="text-emerald-500 ml-1 font-bold">(+{s.surplus} bậc)</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Chưa có kỹ năng nào đạt chuẩn</p>
              )}
            </div>

            {/* Partial */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Cần nâng cao ({gap.partial?.length || 0})</span>
                </h3>
                <span className="text-[11px] bg-amber-200/60 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  Chưa đủ level
                </span>
              </div>

              {gap.partial?.length > 0 ? (
                <ul className="space-y-2">
                  {gap.partial.map((s, idx) => (
                    <li key={idx} className="bg-white p-3 rounded-2xl border border-amber-100 text-xs shadow-xs">
                      <div className="font-bold text-gray-900">{s.skillName}</div>
                      <div className="text-amber-800 mt-1">
                        Hiện tại: <span className="font-semibold">{s.studentLabel}</span> → Cần: <span className="font-semibold">{s.requiredLabel}</span>
                      </div>
                      <div className="text-amber-600 mt-0.5 font-bold text-[11px]">
                        Thiếu {s.gap} bậc trình độ
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Không có kỹ năng nào ở mức này</p>
              )}
            </div>

            {/* Missing */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                <h3 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                  <span>❌</span>
                  <span>Chưa có kỹ năng ({gap.missing?.length || 0})</span>
                </h3>
                <span className="text-[11px] bg-rose-200/60 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                  Cần học từ đầu
                </span>
              </div>

              {gap.missing?.length > 0 ? (
                <ul className="space-y-2">
                  {gap.missing.map((s, idx) => (
                    <li key={idx} className="bg-white p-3 rounded-2xl border border-rose-100 text-xs shadow-xs">
                      <div className="font-bold text-gray-900">{s.skillName}</div>
                      <div className="text-rose-700 mt-1">
                        Mục tiêu: <span className="font-semibold">{s.requiredLabel}</span>
                      </div>
                      <div className="text-rose-500 mt-0.5 text-[11px]">
                        Chưa có trong hồ sơ sinh viên
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Bạn đã sở hữu đầy đủ tất cả kỹ năng dự án cần!</p>
              )}
            </div>
          </div>

          {/* SECTION 4: SAVE NEW SKILLS TO PROFILE (FOR TEXT EXTRACTION MODE) */}
          {result?.mode === 'text' && result?.skills?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>✨</span>
                    <span>Kỹ năng AI nhận diện từ văn bản ({result.skills.length})</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chọn các kỹ năng phù hợp để lưu trực tiếp vào Hồ sơ Năng lực của bạn
                  </p>
                </div>

                <button
                  onClick={handleSaveToProfile}
                  disabled={saving || saved || selectedToSave.size === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Đang lưu…' : saved ? '✓ Đã lưu vào Hồ sơ' : `Lưu (${selectedToSave.size}) kỹ năng vào Hồ sơ`}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {result.skills.map((s, i) => {
                  const isChecked = selectedToSave.has(i);
                  const color = CATEGORY_COLORS[s.category] || CATEGORY_COLORS['Khác'];

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedToSave((prev) => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        });
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        isChecked
                          ? 'border-indigo-400 text-indigo-950 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                      }`}
                      style={{ backgroundColor: isChecked ? color.light : undefined }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.bg }} />
                      <span>{s.skillName}</span>
                      <span className="text-[10px] text-gray-500 font-normal">({s.suggestedProficiency})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: 4-PILLAR ACTIONABLE REMEDIATION ROADMAP */}
          {gap.remediation?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>🚀</span>
                      <span>Lộ trình Cải thiện Kỹ năng & Đề xuất Phương pháp Học tập</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Giải pháp hành động cụ thể cho từng kỹ năng còn yếu: Đăng ký học phần FPT, tài liệu chính thống STE, bài giảng video YouTube và bài Quiz ôn tập
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200">
                    {gap.remediation.length} kỹ năng cần hỗ trợ
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {gap.remediation.map((rem, i) => (
                  <div
                    key={i}
                    className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 space-y-4 hover:border-indigo-300 transition-all"
                  >
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/70 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">{rem.skillName}</h3>
                            <span className="text-xs text-gray-500 font-medium">({rem.category})</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Trạng thái:{' '}
                            <span className={`font-semibold ${rem.status === 'partial' ? 'text-amber-700' : 'text-rose-600'}`}>
                              {rem.status === 'partial'
                                ? `Hiện tại: ${rem.studentLabel} → Cần đạt: ${rem.requiredLabel}`
                                : `Chưa có → Mục tiêu: ${rem.requiredLabel}`}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold w-fit ${
                          rem.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rem.status === 'partial' ? `Thiếu ${rem.gap} bậc trình độ` : 'Cần học mới'}
                      </span>
                    </div>

                    {/* 4 Pillars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Pillar 1: FPT Course */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-1">
                            <span>🎓</span>
                            <span>Học phần FPT liên kết</span>
                          </div>
                          {rem.course ? (
                            <>
                              <div className="font-bold text-gray-900 text-sm">{rem.course.code}</div>
                              <div className="text-xs text-gray-600 font-medium mt-0.5">{rem.course.title}</div>
                              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                                {rem.course.description}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Chưa liên kết môn học cụ thể</p>
                          )}
                        </div>

                        {rem.course && (
                          <div>
                            {enrolledCourses.has(rem.course.code) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-full justify-center">
                                <span>✓</span>
                                <span>Đã ghi danh học</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleEnrollCourse(rem.course)}
                                disabled={enrollingCode === rem.course.code}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {enrollingCode === rem.course.code ? (
                                  <span>Đang đăng ký…</span>
                                ) : (
                                  <>
                                    <span>+</span>
                                    <span>Đăng ký học phần ngay</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pillar 2: STE Materials */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                            <span>📚</span>
                            <span>Tài liệu học tập STE</span>
                          </div>
                          {rem.materials?.length > 0 ? (
                            <div className="space-y-1.5">
                              {rem.materials.slice(0, 2).map((m, mIdx) => (
                                <div key={mIdx} className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                                  <div className="text-xs font-bold text-gray-900 line-clamp-1">{m.title}</div>
                                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{m.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Tài liệu đang được cập nhật</p>
                          )}
                        </div>

                        <Link
                          to="/app/materials"
                          className="w-full text-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <span>Xem tất cả tài liệu</span>
                          <span>→</span>
                        </Link>
                      </div>

                      {/* Pillar 3: YouTube Video */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mb-1">
                            <span>🎥</span>
                            <span>Bài giảng YouTube</span>
                          </div>
                          {rem.youtube ? (
                            <>
                              <div className="font-bold text-gray-900 text-xs line-clamp-2">
                                {rem.youtube.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                                <span className="font-medium text-rose-600">{rem.youtube.channel}</span>
                                <span>•</span>
                                <span>{rem.youtube.duration}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Đang tuyển chọn video chất lượng</p>
                          )}
                        </div>

                        {rem.youtube?.videoId ? (
                          <button
                            onClick={() => setActiveVideoModal(rem.youtube)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <span>▶</span>
                            <span>Xem bài giảng ngay</span>
                          </button>
                        ) : (
                          <a
                            href={rem.youtube?.url || 'https://youtube.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1"
                          >
                            <span>Mở trên YouTube</span>
                            <span>↗</span>
                          </a>
                        )}
                      </div>

                      {/* Pillar 4: Quizzes */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                            <span>📝</span>
                            <span>Trắc nghiệm ôn tập</span>
                          </div>
                          <div className="font-bold text-gray-900 text-xs line-clamp-2">
                            {rem.quiz?.title || `Quiz kiểm tra kỹ năng ${rem.skillName}`}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {rem.quiz?.questionCount || 4} câu hỏi kiểm tra độ hiểu sâu
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <button
                            onClick={() =>
                              setShowPracticeQuiz((prev) => ({
                                ...prev,
                                [rem.skillName]: !prev[rem.skillName],
                              }))
                            }
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                          >
                            <span>⚡</span>
                            <span>
                              {showPracticeQuiz[rem.skillName] ? 'Ẩn câu hỏi' : 'Làm câu hỏi nhanh'}
                            </span>
                          </button>

                          <Link
                            to="/app/quizzes"
                            className="w-full text-center block text-[11px] text-amber-800 hover:underline font-medium pt-0.5"
                          >
                            Đến danh mục Quiz hệ thống →
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Interactive On-Page Practice Questions Drawer */}
                    {showPracticeQuiz[rem.skillName] && rem.practiceQuestions?.length > 0 && (
                      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <span>🎯</span>
                            <span>Câu hỏi luyện tập nhanh: {rem.skillName}</span>
                          </div>
                          <span className="text-[11px] text-amber-700">Chọn đáp án đúng</span>
                        </div>

                        <div className="space-y-4">
                          {rem.practiceQuestions.map((q, qIdx) => {
                            const currentAns = quizAnswers[`${rem.skillName}-${qIdx}`];
                            const isSubmitted = currentAns !== undefined;
                            const isCorrect = isSubmitted && currentAns === q.answer;

                            return (
                              <div key={qIdx} className="bg-white p-3.5 rounded-xl border border-amber-100 text-xs space-y-2">
                                <div className="font-semibold text-gray-900">
                                  Câu {qIdx + 1}: {q.question}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt, optIdx) => {
                                    let btnStyle = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
                                    if (isSubmitted) {
                                      if (optIdx === q.answer) {
                                        btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                                      } else if (currentAns === optIdx) {
                                        btnStyle = 'bg-rose-100 border-rose-300 text-rose-800';
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() =>
                                          setQuizAnswers((prev) => ({
                                            ...prev,
                                            [`${rem.skillName}-${qIdx}`]: optIdx,
                                          }))
                                        }
                                        className={`text-left p-2.5 rounded-lg border text-xs transition ${btnStyle}`}
                                      >
                                        <span className="font-bold mr-1.5">
                                          {String.fromCharCode(65 + optIdx)}.
                                        </span>
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>

                                {isSubmitted && (
                                  <div
                                    className={`mt-2 p-2.5 rounded-lg text-xs ${
                                      isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                    }`}
                                  >
                                    <span className="font-bold">
                                      {isCorrect ? '✅ Chính xác! ' : '❌ Chưa đúng! '}
                                    </span>
                                    <span>{q.explanation}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded YouTube Video Lecture Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl space-y-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-bold text-lg">▶</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{activeVideoModal.title}</h3>
                  <p className="text-xs text-gray-500">
                    Kênh: <span className="font-medium">{activeVideoModal.channel}</span> • Thời lượng: {activeVideoModal.duration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="relative pt-[56.25%] bg-black">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.videoId}?autoplay=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Nguồn học tập chất lượng cao được tuyển chọn cho sinh viên FPT
              </span>
              <a
                href={activeVideoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>Mở trong YouTube</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
