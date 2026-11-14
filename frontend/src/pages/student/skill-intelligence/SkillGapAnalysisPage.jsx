// Skill Gap Analysis Page – SI-05 & Comprehensive Learning Remediation
import { useState } from 'react';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { courseApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { Link } from 'react-router-dom';

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Mới bắt đầu', level: 1 },
  { value: 'elementary', label: 'Cơ bản', level: 2 },
  { value: 'intermediate', label: 'Trung cấp', level: 3 },
  { value: 'advanced', label: 'Nâng cao', level: 4 },
  { value: 'expert', label: 'Chuyên gia', level: 5 },
];

const PRESET_PROJECTS = [
  {
    id: 'fullstack',
    title: '🌐 Web Fullstack (MERN)',
    desc: 'Xây dựng hệ sinh thái sinh viên thông minh với React, Node.js, Express, MongoDB và Docker',
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
    title: '🤖 Trí tuệ Nhân tạo & Xử lý Dữ liệu',
    desc: 'Hệ thống gợi ý đề tài và ghép nhóm tự động bằng mô hình AI & Học máy',
    skills: [
      { name: 'Python', minProficiency: 'advanced' },
      { name: 'Machine Learning', minProficiency: 'intermediate' },
      { name: 'SQL', minProficiency: 'intermediate' },
      { name: 'Git', minProficiency: 'intermediate' },
    ],
  },
  {
    id: 'mobile',
    title: '📱 Mobile App (React Native)',
    desc: 'Ứng dụng di động sinh viên hỗ trợ học tập, tra cứu lịch và thông báo thời gian thực',
    skills: [
      { name: 'React', minProficiency: 'intermediate' },
      { name: 'JavaScript', minProficiency: 'advanced' },
      { name: 'TypeScript', minProficiency: 'intermediate' },
      { name: 'Git', minProficiency: 'intermediate' },
    ],
  },
  {
    id: 'uiux',
    title: '🎨 Thiết kế UI/UX & Frontend',
    desc: 'Xây dựng giao diện tương tác người dùng, wireframe prototype và thiết kế Design System',
    skills: [
      { name: 'Figma', minProficiency: 'advanced' },
      { name: 'HTML/CSS', minProficiency: 'advanced' },
      { name: 'React', minProficiency: 'intermediate' },
    ],
  },
];

function ProgressBar({ value, max = 100, color = 'bg-blue-500' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, max)}%` }} />
    </div>
  );
}

export default function SkillGapAnalysisPage() {
  const toast = useToast();
  const [targetSkills, setTargetSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', minProficiency: 'intermediate' });
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  // Remediation states
  const [enrollingCode, setEnrollingCode] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showPracticeQuiz, setShowPracticeQuiz] = useState({});

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setTargetSkills([...preset.skills]);
    setProjectDescription(preset.desc);
    setError('');
    setResult(null);
  };

  const addTarget = () => {
    if (!newSkill.name.trim()) return;
    setTargetSkills((p) => [...p, { ...newSkill }]);
    setNewSkill({ name: '', minProficiency: 'intermediate' });
    setActivePreset(null);
  };

  const removeTarget = (i) => {
    setTargetSkills((p) => p.filter((_, idx) => idx !== i));
    setActivePreset(null);
  };

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

  const handleAnalyze = async () => {
    if (targetSkills.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await skillIntelligenceApi.analyzeGap({ targetSkills, projectDescription });
      const data = res?.data?.data || res?.data || res || null;
      setResult(data);

      if (data?.remediation) {
        const enrolled = new Set();
        data.remediation.forEach((item) => {
          if (item.course?.isEnrolled) enrolled.add(item.course.code);
        });
        setEnrolledCourses(enrolled);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi phân tích khoảng cách kỹ năng.');
    } finally {
      setLoading(false);
    }
  };

  const coverageColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getLevelNumber = (lvlLabel) => {
    const map = { Beginner: 1, Elementary: 2, Intermediate: 3, Advanced: 4, Expert: 5 };
    return map[lvlLabel] || 1;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân tích khoảng cách kỹ năng</h1>
          <p className="text-sm text-gray-500 mt-1">So sánh kỹ năng của bạn với yêu cầu đề tài / dự án và nhận lộ trình học tập tối ưu</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/skill-intelligence/graph" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            🌐 Xem đồ thị kỹ năng
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/app/skill-intelligence/profile" className="text-sm text-blue-600 hover:underline">
            ← Hồ sơ kỹ năng
          </Link>
        </div>
      </div>

      {/* Demo Presets Bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">⚡</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">Dự án mẫu để thử nghiệm nhanh</span>
          <span className="text-xs text-indigo-500 ml-auto">(Click để nạp ngay bộ kỹ năng)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_PROJECTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`text-left p-3 rounded-xl border text-xs transition-all ${
                activePreset === preset.id
                  ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                  : 'bg-white/80 border-gray-200 hover:bg-white hover:border-indigo-300'
              }`}
            >
              <div className="font-semibold text-gray-800 truncate">{preset.title}</div>
              <div className="text-gray-500 mt-1 line-clamp-1">{preset.desc}</div>
              <div className="text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
                <span>{preset.skills.length} kỹ năng</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target skill builder */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Kỹ năng yêu cầu của dự án</h2>
          {targetSkills.length > 0 && (
            <button
              onClick={() => { setTargetSkills([]); setActivePreset(null); setResult(null); }}
              className="text-xs text-red-500 hover:underline"
            >
              Xóa tất cả ({targetSkills.length})
            </button>
          )}
        </div>

        {/* Add skill row */}
        <div className="flex gap-2 flex-wrap">
          <input
            value={newSkill.name}
            onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTarget())}
            placeholder="Tên kỹ năng (ví dụ: React, Docker, Python... Nhấn Enter)"
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={newSkill.minProficiency}
            onChange={(e) => setNewSkill((p) => ({ ...p, minProficiency: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {PROFICIENCY_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label} (tối thiểu)
              </option>
            ))}
          </select>
          <button
            onClick={addTarget}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Thêm
          </button>
        </div>

        {/* Target list pills */}
        {targetSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {targetSkills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs px-3 py-1.5 rounded-full font-medium"
              >
                <span>{s.name}</span>
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-600 font-normal">
                  {PROFICIENCY_LEVELS.find((l) => l.value === s.minProficiency)?.label || s.minProficiency}
                </span>
                <button
                  onClick={() => removeTarget(i)}
                  className="ml-1 text-indigo-400 hover:text-red-500 font-bold"
                  title="Xóa"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Chưa có kỹ năng nào. Hãy nhập tên kỹ năng hoặc bấm vào một trong các dự án mẫu bên trên.</p>
        )}

        {/* Optional project description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả dự án (tùy chọn)</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Giúp AI hiểu ngữ cảnh dự án để đưa ra lời khuyên học tập chính xác nhất…"
          />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <button
          onClick={handleAnalyze}
          disabled={loading || targetSkills.length === 0}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Đang phân tích khoảng cách kỹ năng…</span>
            </>
          ) : (
            <>
              <span>📊</span>
              <span>Phân tích khoảng cách kỹ năng ({targetSkills.length} kỹ năng)</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fadeIn">
          {/* Coverage score card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">Mức độ đáp ứng tổng thể</h2>
                <p className="text-xs text-gray-500 mt-0.5">So sánh bộ kỹ năng cá nhân với yêu cầu dự án</p>
              </div>
              <div className="text-right">
                <span className={`text-4xl font-extrabold ${coverageColor(result.coverageScore)}`}>
                  {result.coverageScore}%
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {result.coverageScore >= 80 ? 'Rất phù hợp' : result.coverageScore >= 50 ? 'Phù hợp vừa phải' : 'Cần bổ sung nhiều'}
                </p>
              </div>
            </div>
            <ProgressBar
              value={result.coverageScore}
              color={result.coverageScore >= 80 ? 'bg-emerald-500' : result.coverageScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}
            />

            {/* Quick stats counter */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100 text-center">
              <div>
                <p className="text-xl font-bold text-emerald-600">{result.matched?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Đã đạt yêu cầu</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{result.partial?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Cần nâng cao</p>
              </div>
              <div>
                <p className="text-xl font-bold text-rose-600">{result.missing?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Chưa có kỹ năng</p>
              </div>
            </div>
          </div>

          {/* AI Explanation */}
          {result.explanation && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900 shadow-sm flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-semibold text-blue-950 mb-0.5">Đánh giá & Khuyến nghị từ AI:</p>
                <p className="leading-relaxed text-blue-800">{result.explanation}</p>
              </div>
            </div>
          )}

          {/* Visual Proficiency Comparison Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">📊 So sánh trình độ chi tiết từng kỹ năng</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-indigo-500 rounded" /> Hiện tại</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-300 rounded" /> Yêu cầu</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[...(result.matched || []), ...(result.partial || []), ...(result.missing || [])].map((item, idx) => {
                const cur = item.studentLevel || 0;
                const req = item.requiredLevel || 3;
                const isMatched = cur >= req;
                const isPartial = cur > 0 && cur < req;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{item.skillName}</span>
                      <span className="text-gray-500">
                        {cur > 0 ? `Cấp ${cur}/5` : 'Chưa có'} → Yêu cầu Cấp {req}/5
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      {/* Required benchmark indicator */}
                      <div
                        className="absolute top-0 bottom-0 border-r-2 border-dashed border-gray-600 z-10"
                        style={{ left: `${(req / 5) * 100}%` }}
                        title={`Yêu cầu tối thiểu: cấp ${req}`}
                      />
                      {/* Current level bar */}
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

          {/* Breakdown columns: Matched, Partial, Missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Matched */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <span>✅</span>
                <span>Đáp ứng đầy đủ ({result.matched?.length || 0})</span>
              </h3>
              {result.matched?.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.matched.map((s, i) => (
                    <li key={i} className="text-xs bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <div className="font-semibold text-gray-900">{s.skillName}</div>
                      <div className="text-emerald-700 mt-0.5">
                        Trình độ: <span className="font-medium">{s.studentLabel}</span>
                        {s.surplus > 0 && <span className="text-emerald-500 ml-1">(+{s.surplus} bậc)</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Chưa có kỹ năng nào đạt yêu cầu</p>
              )}
            </div>

            {/* Partial */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Cần nâng cao ({result.partial?.length || 0})</span>
              </h3>
              {result.partial?.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.partial.map((s, i) => (
                    <li key={i} className="text-xs bg-white/80 p-2.5 rounded-xl border border-amber-100">
                      <div className="font-semibold text-gray-900">{s.skillName}</div>
                      <div className="text-amber-800 mt-0.5">
                        Hiện tại: <span className="font-medium">{s.studentLabel}</span> → Cần: <span className="font-medium">{s.requiredLabel}</span>
                      </div>
                      <div className="text-amber-600 mt-0.5 font-medium">Thiếu {s.gap} bậc trình độ</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Không có kỹ năng nào ở mức này</p>
              )}
            </div>

            {/* Missing */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                <span>❌</span>
                <span>Chưa có kỹ năng ({result.missing?.length || 0})</span>
              </h3>
              {result.missing?.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.missing.map((s, i) => (
                    <li key={i} className="text-xs bg-white/80 p-2.5 rounded-xl border border-rose-100">
                      <div className="font-semibold text-gray-900">{s.skillName}</div>
                      <div className="text-rose-700 mt-0.5">
                        Yêu cầu: <span className="font-medium">{s.requiredLabel}</span>
                      </div>
                      <div className="text-rose-500 mt-0.5">Chưa có trong hồ sơ sinh viên</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Đã sở hữu đầy đủ tất cả kỹ năng!</p>
              )}
            </div>
          </div>

          {/* Learning priority */}
          {result.learningPriority?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Lộ trình ưu tiên học tập khuyến nghị</span>
                </h2>
                <Link
                  to="/app/skill-intelligence/graph"
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                >
                  <span>Xem vị trí các kỹ năng này trên Đồ thị</span>
                  <span>→</span>
                </Link>
              </div>

              <ol className="space-y-3">
                {result.learningPriority.map((s) => (
                  <li key={s.rank} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-base font-bold text-indigo-600 w-6 text-center">{s.rank}</span>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">{s.skillName}</span>
                      {'gap' in s && s.gap > 0 ? (
                        <span className="text-xs text-amber-700 ml-2">Cần nâng thêm {s.gap} bậc</span>
                      ) : (
                        <span className="text-xs text-rose-600 ml-2">Cần học từ đầu (Mục tiêu: {s.requiredLabel})</span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        'studentLevel' in s ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {'studentLevel' in s ? 'Cải thiện' : 'Học mới'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Remediation 4 Pillars */}
          {result.remediation?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>🚀</span>
                      <span>Đề xuất Phương pháp Cải thiện & Lộ trình Học tập Tích hợp</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Các giải pháp học tập cụ thể cho từng kỹ năng còn yếu: Đăng ký học phần FPT, tài liệu chính thống, bài giảng video YouTube và bài Quiz ôn tập
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                    {result.remediation.length} kỹ năng cần hỗ trợ
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {result.remediation.map((rem, i) => (
                  <div
                    key={i}
                    className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 space-y-4 hover:border-indigo-300 transition-all"
                  >
                    {/* Skill Header Banner */}
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
                            <span
                              className={`font-semibold ${
                                rem.status === 'partial' ? 'text-amber-700' : 'text-rose-600'
                              }`}
                            >
                              {rem.status === 'partial'
                                ? `Hiện tại: ${rem.studentLabel} → Cần đạt: ${rem.requiredLabel}`
                                : `Chưa có → Mục tiêu: ${rem.requiredLabel}`}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold w-fit ${
                          rem.status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rem.status === 'partial' ? `Thiếu ${rem.gap} bậc trình độ` : 'Cần học mới'}
                      </span>
                    </div>

                    {/* 4 Pillars of Learning Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* 1. Môn học FPT liên kết */}
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

                      {/* 2. Tài liệu học tập STE */}
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

                      {/* 3. Bài giảng Video YouTube */}
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

                      {/* 4. Quiz & Đề kiểm tra ôn tập */}
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
