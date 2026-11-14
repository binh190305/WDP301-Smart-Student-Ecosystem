// My Skill Profile Page – Evidence-Based Skill Profile (AI Core 01)
import { useEffect, useState } from 'react';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { assignmentApi, quizApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const PROFICIENCY_COLORS = {
  beginner: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-neutral-800 dark:text-stone-300 dark:border-neutral-700',
  elementary: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  intermediate: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  advanced: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  expert: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
};

const PROFICIENCY_VI = {
  beginner: 'Mới bắt đầu (Cấp 1)',
  elementary: 'Cơ bản (Cấp 2)',
  intermediate: 'Trung cấp (Cấp 3)',
  advanced: 'Nâng cao (Cấp 4)',
  expert: 'Chuyên gia (Cấp 5)',
};

const CLASSIFICATION_META = {
  verified: {
    label: 'Đã xác thực',
    sublabel: 'Giảng viên / Chứng chỉ hợp lệ',
    badge: 'bg-violet-50 text-violet-700 border border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 font-semibold',
    icon: '🛡️',
  },
  assessed: {
    label: 'Đã đánh giá',
    sublabel: 'Qua Quiz / Bài tập / Rubric',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    icon: '✅',
  },
  self_reported: {
    label: 'Tự khai báo',
    sublabel: 'Chưa có bằng chứng xác thực',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: '📝',
  },
};

const EVIDENCE_TYPE_LABELS = {
  QUIZ_RESULT: 'Kết quả Quiz',
  ASSIGNMENT: 'Bài nộp môn học',
  PROJECT: 'Dự án thực tế',
  GITHUB_REPO: 'GitHub Repository',
  COURSE_COMPLETION: 'Hoàn thành khóa học',
  CERTIFICATE: 'Chứng chỉ chuyên môn',
  TEAM_CONTRIBUTION: 'Đóng góp nhóm',
  PRACTICAL_ASSESSMENT: 'Bài thực hành',
  PROJECT_DESCRIPTION: 'Mô tả đề tài',
  MANUAL: 'Khai báo tài liệu',
};

const STATUS_BADGE = {
  VERIFIED: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800',
  ASSESSED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  AI_ANALYZED: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  MORE_EVIDENCE_REQUIRED: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
  SELF_REPORTED: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-neutral-800 dark:text-stone-300 dark:border-neutral-700',
};

export default function MySkillProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [skills, setSkills] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSkills: 0,
    selfReportedCount: 0,
    assessedCount: 0,
    verifiedCount: 0,
    requiringEvidenceCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeSkillDetail, setActiveSkillDetail] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedSkillForEvidence, setSelectedSkillForEvidence] = useState(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Add skill form state
  const [newSkillForm, setNewSkillForm] = useState({
    skillName: '',
    proficiency: 'intermediate',
    evidence: '',
  });

  // Evidence submission form state
  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: 'PROJECT',
    title: '',
    description: '',
    sourceUrl: '',
    sourceText: '',
    linkedEntityType: 'None',
    linkedEntityId: '',
  });

  // Student available quizzes & assignments for linking
  const [myGradebook, setMyGradebook] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);

  const isReviewer = ['lecturer', 'admin'].includes(user?.role);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await skillIntelligenceApi.getMySkills();
      const payload = res?.data || res;
      if (res?.success || payload?.success || payload?.skills) {
        const skillsList = payload.skills || payload.data?.skills || [];
        setSkills(skillsList);
        const metricsData = payload.metrics || payload.data?.metrics;
        if (metricsData) {
          setMetrics(metricsData);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Không thể tải hồ sơ kỹ năng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkableEntities = async () => {
    try {
      const [gbRes, qRes] = await Promise.allSettled([
        assignmentApi.myGradebook(),
        quizApi.list({ limit: 50 }),
      ]);
      if (gbRes.status === 'fulfilled') {
        const gbPayload = gbRes.value?.data || gbRes.value;
        const list = gbPayload?.submissions || gbPayload?.data?.submissions || [];
        setMyGradebook(list);
      }
      if (qRes.status === 'fulfilled') {
        const qPayload = qRes.value?.data || qRes.value;
        const list = qPayload?.quizzes || qPayload?.data?.quizzes || [];
        setMyQuizzes(list);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLinkableEntities();
  }, []);

  // Filter skills
  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.aiCategory && s.aiCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      s.aiCategory === selectedCategory ||
      (selectedCategory === 'Khác' && !s.aiCategory);

    const matchesClass =
      selectedClassification === 'ALL' ||
      (selectedClassification === 'verified' && s.classification === 'verified') ||
      (selectedClassification === 'assessed' && s.classification === 'assessed') ||
      (selectedClassification === 'self_reported' && s.classification === 'self_reported') ||
      (selectedClassification === 'needs_evidence' &&
        (!s.evidence ||
          s.evidence.length === 0 ||
          s.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ||
          (Array.isArray(s.evidence) && s.evidence.some((e) => e.verificationStatus === 'MORE_EVIDENCE_REQUIRED'))));

    return matchesSearch && matchesCategory && matchesClass;
  });

  const categories = ['ALL', 'Frontend Development', 'Backend Development', 'Database', 'DevOps & Cloud', 'Artificial Intelligence', 'Software Engineering'];

  // Handle Add Skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillForm.skillName.trim()) {
      showToast('Vui lòng nhập tên kỹ năng', 'warning');
      return;
    }
    try {
      await skillIntelligenceApi.addSkill(newSkillForm);
      showToast(`Đã thêm kỹ năng ${newSkillForm.skillName} (Tự khai báo)`, 'success');
      setIsAddModalOpen(false);
      setNewSkillForm({ skillName: '', proficiency: 'intermediate', evidence: '' });
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thêm kỹ năng', 'error');
    }
  };

  // Handle Submit Evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!selectedSkillForEvidence) return;
    if (!evidenceForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bằng chứng', 'warning');
      return;
    }
    if (!evidenceForm.description.trim()) {
      showToast('Vui lòng nhập mô tả chi tiết năng lực & công việc đã làm', 'warning');
      return;
    }

    setSubmittingEvidence(true);
    try {
      const res = await skillIntelligenceApi.submitEvidence(selectedSkillForEvidence._id, evidenceForm);
      showToast('Đã nộp bằng chứng năng lực thành công! AI đã phân tích và lưu vào hồ sơ.', 'success');
      setIsEvidenceModalOpen(false);
      setEvidenceForm({
        evidenceType: 'PROJECT',
        title: '',
        description: '',
        sourceUrl: '',
        sourceText: '',
        linkedEntityType: 'None',
        linkedEntityId: '',
      });
      await fetchProfile();
      if (activeSkillDetail && activeSkillDetail._id === selectedSkillForEvidence._id) {
        const updated = res?.data || res;
        setActiveSkillDetail(updated);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Không thể nộp bằng chứng', 'error');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Handle Lecturer Review
  const handleReviewEvidence = async (skillId, evidenceId, decision, comments = '') => {
    try {
      await skillIntelligenceApi.reviewEvidence(skillId, evidenceId, { decision, comments });
      showToast(`Đã cập nhật trạng thái thẩm định: ${decision}`, 'success');
      fetchProfile();
      if (activeSkillDetail) {
        setActiveSkillDetail(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thẩm định bằng chứng', 'error');
    }
  };

  // Handle Remove Skill
  const handleRemoveSkill = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá kỹ năng ${name}?`)) return;
    try {
      await skillIntelligenceApi.removeSkill(id);
      showToast(`Đã xoá kỹ năng ${name}`, 'success');
      fetchProfile();
      if (activeSkillDetail?._id === id) setActiveSkillDetail(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xoá kỹ năng', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Tabs matching official reference */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-sm font-bold">
                📊
              </span>
              <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Skill Intelligence</h1>
            </div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-1">
              Hệ thống phân tích năng lực chuẩn hoá, đồ thị tri thức & xác minh kỹ năng bằng AI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-brand-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 active:scale-[0.98] transition"
            >
              <span>➕</span> Khai báo kỹ năng
            </button>
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-stone-200/80 dark:border-neutral-800 pb-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả kỹ năng' },
            { id: 'verified', label: '🛡️ Đã xác thực' },
            { id: 'assessed', label: '✅ Đã đánh giá' },
            { id: 'needs_evidence', label: '⚠️ Cần bằng chứng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedClassification(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedClassification === tab.id
                  ? 'bg-stone-900 text-white dark:bg-neutral-800 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <a
            href="/app/skill-intelligence/analyze"
            className="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/60 ml-auto flex items-center gap-1.5"
          >
            <span>✨</span> Phân tích khoảng cách kỹ năng (AI Gap Analysis) →
          </a>
        </div>

        {/* Alert Banner: Yêu cầu nộp bổ sung minh chứng từ ban thẩm định */}
        {skills.filter(
          (s) =>
            s.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ||
            (Array.isArray(s.evidence) && s.evidence.some((e) => e.verificationStatus === 'MORE_EVIDENCE_REQUIRED'))
        ).length > 0 && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/50 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Yêu cầu nộp bổ sung minh chứng (
                  {
                    skills.filter(
                      (s) =>
                        s.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ||
                        (Array.isArray(s.evidence) && s.evidence.some((e) => e.verificationStatus === 'MORE_EVIDENCE_REQUIRED'))
                    ).length
                  }{' '}
                  kỹ năng)
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Ban thẩm định yêu cầu bổ sung minh chứng cho:{' '}
                  <strong className="text-amber-950 dark:text-amber-100">
                    {skills
                      .filter(
                        (s) =>
                          s.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ||
                          (Array.isArray(s.evidence) && s.evidence.some((e) => e.verificationStatus === 'MORE_EVIDENCE_REQUIRED'))
                      )
                      .map((s) => s.skillName)
                      .join(', ')}
                  </strong>
                  . Vui lòng kiểm tra nhận xét của Giảng viên và nộp bổ sung tài liệu để hoàn tất thẩm định.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedClassification('needs_evidence')}
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition shrink-0"
            >
              Lọc kỹ năng cần bổ sung ➔
            </button>
          </div>
        )}
      </div>

      {/* Main Bento Hero: Radar Chart + 4 Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Bento: Radar Chart */}
        <div className="lg:col-span-7 card-bento flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">Bản đồ Năng lực Kỹ năng</h3>
              <p className="text-xs text-stone-500 dark:text-stone-300">Đánh giá đa chiều theo 6 trục chuyên môn thực tế</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-300">
                <span className="h-2 w-2 rounded-full bg-violet-600"></span> Năng lực hiện tại
              </span>
              <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-300">
                <span className="h-2 w-2 rounded-full bg-stone-300 dark:bg-neutral-500"></span> Mức mục tiêu
              </span>
            </div>
          </div>

          {/* SVG Radar Chart */}
          <div className="relative flex items-center justify-center py-4">
            {(() => {
              // 6 Real Technical Competence Axes for Radar Chart (STE Curriculum)
              const radarAxes = [
                { id: 'frontend', label: 'Frontend', keywords: ['react', 'next', 'html', 'css', 'javascript', 'typescript', 'vue', 'tailwind'] },
                { id: 'backend', label: 'Backend', keywords: ['node', 'express', 'nest', 'java', 'spring', 'python', 'c#', '.net'] },
                { id: 'devops', label: 'DevOps', keywords: ['docker', 'git', 'ci/cd', 'kubernetes', 'linux', 'cloud', 'aws', 'gcp'] },
                { id: 'database', label: 'Database', keywords: ['mongo', 'sql', 'postgres', 'mysql', 'database', 'redis', 'nosql', 'prisma'] },
                { id: 'data_ai', label: 'Data & AI', keywords: ['python', 'ai', 'machine learning', 'data', 'deep learning', 'pandas', 'nlp'] },
                { id: 'ui_ux', label: 'UI/UX', keywords: ['figma', 'ui/ux', 'design', 'wireframe', 'prototype', 'adobe', 'canva'] },
              ];

              const radarScores = radarAxes.map((axis) => {
                const matched = skills.filter((s) => {
                  const name = (s.skillName || s.name || '').toLowerCase();
                  const cat = (s.category || s.aiCategory || '').toLowerCase();
                  return axis.keywords.some((kw) => name.includes(kw) || cat.includes(kw));
                });
                if (matched.length === 0) return 1.5;
                const sumLevel = matched.reduce((acc, s) => {
                  const lvl = s.proficiencyLevel || (s.proficiency === 'advanced' ? 4 : s.proficiency === 'intermediate' ? 3 : 2);
                  return acc + lvl;
                }, 0);
                return Math.min(5, Math.max(1, sumLevel / matched.length));
              });

              const radarRadii = radarScores.map((score) => Math.round(20 + (score / 5) * 75));
              const radarPoints = [
                [160, 140 - radarRadii[0]],
                [Math.round(160 + radarRadii[1] * 0.866), Math.round(140 - radarRadii[1] * 0.5)],
                [Math.round(160 + radarRadii[2] * 0.866), Math.round(140 + radarRadii[2] * 0.5)],
                [160, 140 + radarRadii[3]],
                [Math.round(160 - radarRadii[4] * 0.866), Math.round(140 + radarRadii[4] * 0.5)],
                [Math.round(160 - radarRadii[5] * 0.866), Math.round(140 - radarRadii[5] * 0.5)],
              ];
              const radarPointsString = radarPoints.map((p) => p.join(',')).join(' ');

              return (
                <svg viewBox="0 0 320 280" className="w-full max-w-[340px] overflow-visible">
                  <defs>
                    <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {/* Concentric Polygons */}
                  {[0.25, 0.5, 0.75, 1].map((scale, i) => {
                    const r = 95 * scale;
                    const points = [
                      [160, 140 - r],
                      [160 + r * 0.866, 140 - r * 0.5],
                      [160 + r * 0.866, 140 + r * 0.5],
                      [160, 140 + r],
                      [160 - r * 0.866, 140 + r * 0.5],
                      [160 - r * 0.866, 140 - r * 0.5],
                    ].map((p) => p.join(',')).join(' ');
                    return (
                      <polygon
                        key={i}
                        points={points}
                        fill="none"
                        stroke="#E7E5E4"
                        strokeWidth="1"
                        strokeDasharray={scale === 1 ? 'none' : '3 3'}
                      />
                    );
                  })}

                  {/* Axis lines */}
                  {[
                    [160, 140, 160, 45],
                    [160, 140, 160 + 95 * 0.866, 140 - 47.5],
                    [160, 140, 160 + 95 * 0.866, 140 + 47.5],
                    [160, 140, 160, 235],
                    [160, 140, 160 - 95 * 0.866, 140 + 47.5],
                    [160, 140, 160 - 95 * 0.866, 140 - 47.5],
                  ].map((line, idx) => (
                    <line key={idx} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke="#D6D3D1" strokeWidth="1" />
                  ))}

                  {/* Target Polygon (Stone dashed) */}
                  <polygon
                    points="160,55 235,100 230,180 160,225 90,180 85,100"
                    fill="none"
                    stroke="#A8A29E"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Dynamic User Polygon based on actual skill levels */}
                  {skills.length > 0 ? (
                    <>
                      <polygon
                        points={radarPointsString}
                        fill="url(#radarFill)"
                        stroke="#7C3AED"
                        strokeWidth="2.5"
                      />
                      {radarPoints.map((pt, i) => (
                        <circle key={i} cx={pt[0]} cy={pt[1]} r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                      ))}
                    </>
                  ) : (
                    <circle cx="160" cy="140" r="5" fill="#D6D3D1" />
                  )}

                  {/* Real Curriculum Axis Labels */}
                  <text x="160" y="32" textAnchor="middle" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">Frontend</text>
                  <text x="255" y="90" textAnchor="start" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">Backend</text>
                  <text x="255" y="195" textAnchor="start" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">DevOps</text>
                  <text x="160" y="255" textAnchor="middle" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">Database</text>
                  <text x="65" y="195" textAnchor="end" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">Data & AI</text>
                  <text x="65" y="90" textAnchor="end" className="text-[11px] font-bold fill-stone-700 dark:fill-stone-300">UI/UX</text>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Right Bento: 4 Stat Cards Bound to REAL DATA */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Điểm năng lực thực tế */}
          {(() => {
            const calculatedScore =
              metrics.totalSkills > 0
                ? Math.min(
                    100,
                    Math.round(
                      (((metrics.verifiedCount || 0) * 2 +
                        (metrics.assessedCount || 0) * 1.5 +
                        (metrics.selfReportedCount || 0) * 1) /
                        (metrics.totalSkills * 2)) *
                        100
                    )
                  )
                : 0;

            return (
              <div className="card-bento flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-300 uppercase tracking-wider">Điểm năng lực</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    {calculatedScore}<span className="text-sm font-semibold text-stone-400 dark:text-stone-400">/100</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-700">
                    {calculatedScore >= 70 ? 'Khá giỏi' : calculatedScore >= 40 ? 'Đang tích lũy' : 'Khởi đầu'}
                  </span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-neutral-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${calculatedScore}%` }} />
                </div>
              </div>
            );
          })()}

          {/* Kỹ năng đã xác minh thực tế */}
          <div className="card-bento flex flex-col justify-between col-span-2 sm:col-span-1 border-violet-200/80 dark:border-neutral-700 bg-gradient-to-br from-white via-violet-50/20 to-violet-50/40 dark:from-neutral-800 dark:via-violet-950/30 dark:to-neutral-800">
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Đã xác thực
            </span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-violet-700 dark:text-violet-200 tracking-tight">
                {metrics.verifiedCount || 0}
              </span>
              <span className="text-xs font-bold text-violet-700 dark:text-violet-200 bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 rounded-full border border-transparent dark:border-violet-700">chính thức</span>
            </div>
            <p className="text-[11px] text-violet-700/80 dark:text-violet-300 font-medium mt-3">Được GV & chứng chỉ duyệt</p>
          </div>

          {/* Kỹ năng đang phát triển thực tế */}
          <div className="card-bento flex flex-col justify-between col-span-2 sm:col-span-1 border-purple-200/80 dark:border-neutral-700 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40 dark:from-neutral-800 dark:via-purple-950/30 dark:to-neutral-800">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📈</span> Đang phát triển
            </span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-purple-700 dark:text-purple-200 tracking-tight">
                {(metrics.assessedCount || 0) + (metrics.selfReportedCount || 0)}
              </span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full border border-transparent dark:border-purple-700">đang tích luỹ</span>
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300 font-medium mt-3">Qua quiz, bài tập & tự khai</p>
          </div>

          {/* Khoảng trống kỹ năng thực tế */}
          <div className="card-bento flex flex-col justify-between col-span-2 sm:col-span-1 border-amber-200/80 dark:border-neutral-700 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/40 dark:from-neutral-800 dark:via-amber-950/30 dark:to-neutral-800">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> Cần bằng chứng
            </span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-amber-700 dark:text-amber-200 tracking-tight">
                {metrics.requiringEvidenceCount || 0}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-transparent dark:border-amber-700">chưa nộp</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300 font-medium mt-3">Khuyến nghị nộp minh chứng</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-bento space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Tìm kiếm kỹ năng trong hồ sơ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-neutral-700 rounded-xl bg-stone-50/60 dark:bg-neutral-800 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-xs text-stone-400">🔍</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider whitespace-nowrap">Nguồn:</span>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'verified', label: '🛡️ Đã xác thực' },
              { id: 'assessed', label: '✅ Đã đánh giá' },
              { id: 'self_reported', label: '📝 Tự khai' },
              { id: 'needs_evidence', label: '⚠️ Thiếu bằng chứng' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedClassification(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedClassification === f.id
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2.5 border-t border-stone-200/80 dark:border-neutral-800">
          <span className="text-[11px] text-stone-500 dark:text-stone-300 font-bold uppercase tracking-wider whitespace-nowrap">Danh mục:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white dark:bg-violet-600 shadow-sm'
                  : 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả lĩnh vực' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-16 text-stone-500 dark:text-stone-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-2"></div>
          Đang tải hồ sơ năng lực...
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-800/80 rounded-2xl border border-stone-200/80 dark:border-neutral-700 p-8 shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Không tìm thấy kỹ năng phù hợp</h3>
          <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">Thử thay đổi bộ lọc hoặc khai báo kỹ năng mới vào hồ sơ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const classMeta = CLASSIFICATION_META[skill.classification] || CLASSIFICATION_META.self_reported;
            const evidenceCount = skill.evidence?.length || 0;
            const demonstratedComps = (skill.competencies || []).filter((c) => ['competent', 'mastered'].includes(c.status)).length;
            const totalComps = skill.competencies?.length || 0;

            return (
              <div
                key={skill._id}
                className="card-bento flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">{skill.skillName}</h3>
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-300">{skill.aiCategory || 'General'}</span>
                    </div>
                    {skill.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 font-bold">
                        <span>⚠️</span> Cần bổ sung
                      </span>
                    ) : skill.verificationStatus === 'PENDING_REVIEW' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold">
                        <span>⏳</span> Chờ thẩm định
                      </span>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${classMeta.badge}`}>
                        <span>{classMeta.icon}</span> {classMeta.label}
                      </span>
                    )}
                  </div>

                  {/* Level & Evidence status */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-semibold ${PROFICIENCY_COLORS[skill.proficiency] || 'bg-stone-100 dark:bg-neutral-800 dark:text-stone-200 dark:border-neutral-700'}`}>
                      {PROFICIENCY_VI[skill.proficiency] || skill.proficiency}
                    </span>
                    {skill.proficiencyScore !== null && (
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-700 px-2.5 py-0.5 rounded-lg font-bold">
                        Điểm rubric: {skill.proficiencyScore}/100
                      </span>
                    )}
                    {skill.aiConfidence !== null && (
                      <span className="text-xs bg-violet-50/60 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-700/60 px-2 py-0.5 rounded-lg font-medium" title="Mức độ tự tin mô hình NLP khi trích xuất">
                        Độ tin cậy AI: {Math.round(skill.aiConfidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Competency progress */}
                  {totalComps > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-stone-600 dark:text-stone-300 mb-1.5 font-medium">
                        <span>Năng lực chứng minh:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">{demonstratedComps}/{totalComps}</span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(demonstratedComps / totalComps) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Evidence tag */}
                  <div className="mt-3.5 text-xs flex items-center justify-between text-stone-700 dark:text-stone-200 bg-stone-50/80 dark:bg-neutral-800/90 p-2.5 rounded-xl border border-stone-200/80 dark:border-neutral-700">
                    <span>Bằng chứng nộp: <strong className="text-stone-900 dark:text-stone-100">{evidenceCount}</strong></span>
                    {skill.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ? (
                      <span className="text-amber-800 dark:text-amber-200 font-bold bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md text-[11px] border border-amber-300 dark:border-amber-700 animate-pulse">
                        ⚠️ GV yêu cầu bổ sung
                      </span>
                    ) : evidenceCount === 0 ? (
                      <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md text-[11px] border border-amber-200/50 dark:border-amber-700">
                        Chưa có bằng chứng
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedSkillForEvidence(skill);
                      setIsEvidenceModalOpen(true);
                    }}
                    className={`text-xs font-semibold flex items-center gap-1 transition rounded-lg ${
                      skill.verificationStatus === 'MORE_EVIDENCE_REQUIRED'
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 dark:border dark:border-amber-700 px-2.5 py-1 font-bold shadow-2xs'
                        : 'text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 hover:underline'
                    }`}
                  >
                    <span>📎</span> {skill.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ? 'Nộp bổ sung ngay ➔' : 'Nộp bằng chứng'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSkillDetail(skill)}
                      className="px-2.5 py-1 text-xs bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-800 dark:text-stone-200 rounded-lg font-medium transition"
                    >
                      Chi tiết & Rubric
                    </button>
                    {skill.classification !== 'verified' && (
                      <button
                        onClick={() => handleRemoveSkill(skill._id, skill.skillName)}
                        className="text-stone-400 hover:text-rose-600 text-xs px-1"
                        title="Xoá kỹ năng"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL (COMPETENCIES & EVIDENCE CENTER) */}
      {activeSkillDetail && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-stone-900 dark:text-stone-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{activeSkillDetail.skillName}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${CLASSIFICATION_META[activeSkillDetail.classification]?.badge}`}>
                    {CLASSIFICATION_META[activeSkillDetail.classification]?.icon} {CLASSIFICATION_META[activeSkillDetail.classification]?.label}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-300 mt-1">
                  Lĩnh vực: {activeSkillDetail.aiCategory || 'General'} • Cấp độ:{' '}
                  {PROFICIENCY_VI[activeSkillDetail.proficiency] || activeSkillDetail.proficiency}
                </p>
              </div>
              <button
                onClick={() => setActiveSkillDetail(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score & Credibility Banner */}
            <div className="bg-gradient-to-r from-stone-50 to-violet-50/50 dark:from-neutral-800 dark:to-violet-950/40 p-4 rounded-xl border border-violet-100 dark:border-neutral-700 flex flex-wrap gap-4 justify-between items-center text-sm">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block">Nguồn gốc & Thẩm định:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-100">
                  {CLASSIFICATION_META[activeSkillDetail.classification]?.sublabel}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block">Điểm Năng lực Rubric:</span>
                <span className="font-bold text-violet-700 dark:text-violet-300 text-base">
                  {activeSkillDetail.proficiencyScore !== null ? `${activeSkillDetail.proficiencyScore}/100` : 'Chưa có bài kiểm tra'}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block">Độ tự tin nhận diện AI:</span>
                <span className="font-medium text-stone-700 dark:text-stone-200">
                  {activeSkillDetail.aiConfidence !== null ? `${Math.round(activeSkillDetail.aiConfidence * 100)}%` : 'Thủ công'}
                </span>
              </div>
            </div>

            {/* Competency Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                <span>🎯</span> Danh mục Năng lực Thành phần (Competency Breakdown)
              </h3>
              {(!activeSkillDetail.competencies || activeSkillDetail.competencies.length === 0) ? (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic">Chưa có thông tin competency chi tiết.</p>
              ) : (
                <div className="space-y-2">
                  {activeSkillDetail.competencies.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-gray-800">{comp.name}</div>
                        <div className="text-gray-500 text-[11px]">{comp.description}</div>
                        {comp.evidenceSnippet && (
                          <div className="text-indigo-600 text-[11px] italic">" {comp.evidenceSnippet} "</div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
                          comp.status === 'mastered'
                            ? 'bg-purple-100 text-purple-700'
                            : comp.status === 'competent'
                            ? 'bg-emerald-100 text-emerald-700'
                            : comp.status === 'developing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {comp.status === 'mastered'
                          ? '🌟 Chuyên sâu'
                          : comp.status === 'competent'
                          ? '✅ Thành thạo'
                          : comp.status === 'developing'
                          ? '⏳ Đang phát triển'
                          : 'Chưa kiểm tra'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>📂</span> Hồ sơ Bằng chứng Đã nộp ({activeSkillDetail.evidence?.length || 0})
                </h3>
                <button
                  onClick={() => {
                    setSelectedSkillForEvidence(activeSkillDetail);
                    setIsEvidenceModalOpen(true);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  ➕ Thêm bằng chứng
                </button>
              </div>

              {(!activeSkillDetail.evidence || activeSkillDetail.evidence.length === 0) ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                  Chưa có bằng chứng nào được nộp cho kỹ năng này. Hãy liên kết bài Quiz hoặc bài nộp Assignment để được hệ thống đánh giá thực nghiệm.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSkillDetail.evidence.map((ev, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50/60 dark:bg-neutral-800 space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{ev.title || 'Bằng chứng năng lực'}</span>
                          <span className="ml-2 text-stone-400 dark:text-stone-400 font-normal">({EVIDENCE_TYPE_LABELS[ev.evidenceType] || ev.evidenceType})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${STATUS_BADGE[ev.verificationStatus] || 'bg-stone-100 dark:bg-neutral-700 dark:text-stone-200'}`}>
                          {ev.verificationStatus}
                        </span>
                      </div>

                      {ev.description && <p className="text-stone-600 dark:text-stone-300">{ev.description}</p>}
                      {ev.sourceUrl && (
                        <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-300 hover:underline block truncate">
                          🔗 {ev.sourceUrl}
                        </a>
                      )}

                      {/* Rubric feedback */}
                      {ev.assessmentResult?.feedback && (
                        <div className="p-2.5 bg-stone-100 dark:bg-neutral-750 rounded-lg text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-neutral-700">
                          <strong>Kết quả đánh giá:</strong> {ev.assessmentResult.feedback}
                          {ev.assessmentResult.score && (
                            <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-300">({ev.assessmentResult.score}/100)</span>
                          )}
                        </div>
                      )}

                      {/* Reviewer Comments & Guidance */}
                      {ev.reviewerComments && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                            <span>💬</span> Nhận xét thẩm định từ Giảng viên / Ban thẩm định:
                          </div>
                          <p className="italic text-stone-800 dark:text-stone-200">"{ev.reviewerComments}"</p>
                          {ev.verificationStatus === 'MORE_EVIDENCE_REQUIRED' && (
                            <div className="pt-1.5 flex items-center justify-between border-t border-amber-200/60 dark:border-amber-800">
                              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                Trạng thái: Yêu cầu nộp bổ sung minh chứng
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedSkillForEvidence(activeSkillDetail);
                                  setIsEvidenceModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition"
                              >
                                Nộp bổ sung ngay ➔
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reviewer Action Buttons (if Lecturer/Admin) */}
                      {isReviewer && ev.verificationStatus !== 'VERIFIED' && (
                        <div className="pt-2 flex items-center gap-2 border-t border-stone-200 dark:border-neutral-700">
                          <span className="text-[11px] text-stone-500 dark:text-stone-300 font-medium">Thẩm định giảng viên:</span>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'VERIFIED', 'Giảng viên đã xác nhận tính hợp lệ')}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-semibold transition"
                          >
                            Xác thực (Verified)
                          </button>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'MORE_EVIDENCE_REQUIRED', 'Cần bổ sung thêm tài liệu minh chứng')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition"
                          >
                            Yêu cầu bổ sung
                          </button>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'REJECTED', 'Bằng chứng không phù hợp')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History */}
            {activeSkillDetail.verificationHistory?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-2">Lịch sử Xác thực</h3>
                <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                  {activeSkillDetail.verificationHistory.map((hist, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-stone-400 dark:text-stone-400">{new Date(hist.changedAt).toLocaleDateString()}</span>
                      <span>Chuyển từ <span className="font-semibold text-stone-800 dark:text-stone-200">{hist.fromStatus}</span> ➔ <span className="font-semibold text-violet-700 dark:text-violet-300">{hist.toStatus}</span></span>
                      {hist.reason && <span className="text-stone-500 dark:text-stone-400 italic">({hist.reason})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD MANUAL SKILL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Khai báo Kỹ năng mới</h2>
            <div className="p-3 bg-violet-50/80 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800 rounded-xl text-violet-900 dark:text-violet-200 text-xs">
              ℹ️ Kỹ năng tự khai báo sẽ được xếp loại <strong>Tự khai báo (Self-reported)</strong>. Bạn cần nộp thêm kết quả Quiz hoặc bài tập thực tế để chuyển thành <strong>Đã đánh giá (Assessed)</strong>.
            </div>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">Tên Kỹ năng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: React, Node.js, SQL, Python..."
                  value={newSkillForm.skillName}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, skillName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">Cấp độ Tự đánh giá *</label>
                <select
                  value={newSkillForm.proficiency}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, proficiency: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  {Object.entries(PROFICIENCY_VI).map(([key, label]) => (
                    <option key={key} value={key} className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">Ghi chú hoặc Bằng chứng ban đầu</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả dự án hoặc kinh nghiệm đã làm với kỹ năng này..."
                  value={newSkillForm.evidence}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, evidence: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 dark:border-neutral-700 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
                >
                  Lưu Kỹ năng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVIDENCE SUBMISSION MODAL */}
      {isEvidenceModalOpen && selectedSkillForEvidence && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Nộp Bằng chứng Năng lực cho: <span className="text-violet-600 dark:text-violet-400">{selectedSkillForEvidence.skillName}</span>
            </h2>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Hình thức Bằng chứng *</label>
                <select
                  value={evidenceForm.evidenceType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEvidenceForm({
                      ...evidenceForm,
                      evidenceType: val,
                      linkedEntityType: val === 'QUIZ_RESULT' ? 'QuizAttempt' : val === 'ASSIGNMENT' ? 'Submission' : 'None',
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="PROJECT" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">Dự án thực tế (Project)</option>
                  <option value="QUIZ_RESULT" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">Liên kết Kết quả Quiz môn học</option>
                  <option value="ASSIGNMENT" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">Liên kết Bài nộp Assignment đã chấm</option>
                  <option value="GITHUB_REPO" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">GitHub Repository</option>
                  <option value="CERTIFICATE" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">Chứng chỉ hoàn thành</option>
                  <option value="MANUAL" className="bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100">Tài liệu khác</option>
                </select>
              </div>

              {/* Linking to existing Quiz attempt */}
              {evidenceForm.evidenceType === 'QUIZ_RESULT' && (
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Chọn Quiz để liên kết kết quả</label>
                  {myQuizzes.length === 0 ? (
                    <p className="text-stone-500 dark:text-stone-400">Chưa tìm thấy bài Quiz nào.</p>
                  ) : (
                    <select
                      value={evidenceForm.linkedEntityId}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, linkedEntityId: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Chọn bài Quiz --</option>
                      {myQuizzes.map((q) => (
                        <option key={q._id} value={q._id}>{q.title} ({q.totalQuestions} câu hỏi)</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Linking to existing Assignment Submission */}
              {evidenceForm.evidenceType === 'ASSIGNMENT' && (
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Chọn Bài nộp môn học</label>
                  {myGradebook.length === 0 ? (
                    <p className="text-stone-500 dark:text-stone-400">Chưa có bài nộp nào trong hệ thống.</p>
                  ) : (
                    <select
                      value={evidenceForm.linkedEntityId}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, linkedEntityId: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Chọn bài nộp đã làm --</option>
                      {myGradebook.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.assignment?.title || 'Bài tập'} • Điểm: {s.score !== null ? s.score : 'Chờ chấm'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Tiêu đề Bằng chứng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xây dựng module quản lý giỏ hàng React Redux"
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Liên kết ngoài (GitHub / Demo / File URL)</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={evidenceForm.sourceUrl}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-1">Mô tả chi tiết năng lực & công việc đã làm *</label>
                <textarea
                  rows={4}
                  placeholder="Mô tả cụ thể các tính năng, công nghệ, hooks, thuật toán hoặc thư viện bạn đã sử dụng để AI phân tích đối chiếu với rubric..."
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 dark:border-neutral-700 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-violet-500/20 transition flex items-center gap-1.5"
                >
                  {submittingEvidence ? (
                    <>
                      <span className="animate-spin">⏳</span> Đang thẩm định AI...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Gửi & Đánh giá Năng lực
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
