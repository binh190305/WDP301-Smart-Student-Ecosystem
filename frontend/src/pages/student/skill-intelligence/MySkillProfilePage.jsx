// My Skill Profile Page – Evidence-Based Skill Profile (AI Core 01)
import { useEffect, useState } from 'react';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { assignmentApi, quizApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const PROFICIENCY_COLORS = {
  beginner: 'bg-gray-100 text-gray-700 border-gray-200',
  elementary: 'bg-blue-100 text-blue-700 border-blue-200',
  intermediate: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  advanced: 'bg-amber-100 text-amber-700 border-amber-200',
  expert: 'bg-purple-100 text-purple-700 border-purple-200',
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
    badge: 'bg-purple-50 text-purple-700 border border-purple-300 font-semibold',
    icon: '🛡️',
  },
  assessed: {
    label: 'Đã đánh giá',
    sublabel: 'Qua Quiz / Bài tập / Rubric',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold',
    icon: '✅',
  },
  self_reported: {
    label: 'Tự khai báo',
    sublabel: 'Chưa có bằng chứng xác thực',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
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
  VERIFIED: 'bg-purple-100 text-purple-800 border-purple-200',
  ASSESSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  AI_ANALYZED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  MORE_EVIDENCE_REQUIRED: 'bg-orange-100 text-orange-800 border-orange-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  SELF_REPORTED: 'bg-gray-100 text-gray-700 border-gray-200',
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
      if (res.data?.success) {
        setSkills(res.data.data.skills || []);
        if (res.data.data.metrics) {
          setMetrics(res.data.data.metrics);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải hồ sơ kỹ năng', 'error');
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
      if (gbRes.status === 'fulfilled' && gbRes.value.data?.success) {
        setMyGradebook(gbRes.value.data.data?.submissions || []);
      }
      if (qRes.status === 'fulfilled' && qRes.value.data?.success) {
        setMyQuizzes(qRes.value.data.data?.quizzes || []);
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
      (selectedClassification === 'needs_evidence' && (!s.evidence || s.evidence.length === 0));

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
    try {
      await skillIntelligenceApi.submitEvidence(selectedSkillForEvidence._id, evidenceForm);
      showToast('Đã gửi bằng chứng năng lực thành công. Hệ thống đã đánh giá và cập nhật.', 'success');
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
      fetchProfile();
      if (activeSkillDetail && activeSkillDetail._id === selectedSkillForEvidence._id) {
        // Refresh active modal detail
        const updated = skills.find((s) => s._id === selectedSkillForEvidence._id);
        setActiveSkillDetail(updated);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể nộp bằng chứng', 'error');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🎓</span> Hồ sơ Năng lực Kỹ năng (Evidence-Based Skill Profile)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Đánh giá năng lực dựa trên bằng chứng thực tế, phân tách minh bạch giữa kỹ năng tự khai, đã kiểm tra và đã xác thực.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
        >
          <span>➕</span> Khai báo Kỹ năng mới
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng số Kỹ năng</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-gray-900">{metrics.totalSkills}</span>
            <span className="text-xs text-gray-400">hồ sơ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <span>🛡️</span> Đã xác thực
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-purple-700">{metrics.verifiedCount}</span>
            <span className="text-xs text-purple-600 font-medium">chính thức</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span>✅</span> Đã đánh giá
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-700">{metrics.assessedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">qua bài tập/quiz</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <span>📝</span> Tự khai báo
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-700">{metrics.selfReportedCount}</span>
            <span className="text-xs text-blue-600 font-medium">chưa thẩm định</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span>⚠️</span> Cần bằng chứng
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-700">{metrics.requiringEvidenceCount}</span>
            <span className="text-xs text-amber-600 font-medium">chưa có tài liệu</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            <span className="text-xs text-gray-500 font-medium">Nguồn gốc:</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedClassification === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Danh mục:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả lĩnh vực' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          Đang tải hồ sơ năng lực...
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-gray-800">Không tìm thấy kỹ năng phù hợp</h3>
          <p className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc khai báo kỹ năng mới vào hồ sơ.</p>
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
                className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{skill.skillName}</h3>
                      <span className="text-xs text-gray-500">{skill.aiCategory || 'General'}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${classMeta.badge}`}>
                      <span>{classMeta.icon}</span> {classMeta.label}
                    </span>
                  </div>

                  {/* Level & Evidence status */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PROFICIENCY_COLORS[skill.proficiency] || 'bg-gray-100'}`}>
                      {PROFICIENCY_VI[skill.proficiency] || skill.proficiency}
                    </span>
                    {skill.proficiencyScore !== null && (
                      <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Điểm rubric: {skill.proficiencyScore}/100
                      </span>
                    )}
                    {skill.aiConfidence !== null && (
                      <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full" title="Mức độ tự tin mô hình NLP khi trích xuất">
                        Độ tin cậy AI: {Math.round(skill.aiConfidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Competency progress */}
                  {totalComps > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Năng lực chứng minh:</span>
                        <span className="font-semibold text-gray-700">{demonstratedComps}/{totalComps}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${(demonstratedComps / totalComps) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Evidence tag */}
                  <div className="mt-3 text-xs flex items-center justify-between text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span>Bằng chứng nộp: <strong>{evidenceCount}</strong></span>
                    {evidenceCount === 0 && (
                      <span className="text-amber-600 font-medium">Cần bổ sung</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedSkillForEvidence(skill);
                      setIsEvidenceModalOpen(true);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                  >
                    <span>📎</span> Nộp bằng chứng
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSkillDetail(skill)}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition"
                    >
                      Chi tiết & Rubric
                    </button>
                    {skill.classification !== 'verified' && (
                      <button
                        onClick={() => handleRemoveSkill(skill._id, skill.skillName)}
                        className="text-gray-400 hover:text-rose-600 text-xs px-1"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{activeSkillDetail.skillName}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${CLASSIFICATION_META[activeSkillDetail.classification]?.badge}`}>
                    {CLASSIFICATION_META[activeSkillDetail.classification]?.icon} {CLASSIFICATION_META[activeSkillDetail.classification]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lĩnh vực: {activeSkillDetail.aiCategory || 'General'} • Cấp độ:{' '}
                  {PROFICIENCY_VI[activeSkillDetail.proficiency] || activeSkillDetail.proficiency}
                </p>
              </div>
              <button
                onClick={() => setActiveSkillDetail(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score & Credibility Banner */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-wrap gap-4 justify-between items-center text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Nguồn gốc & Thẩm định:</span>
                <span className="font-semibold text-gray-800">
                  {CLASSIFICATION_META[activeSkillDetail.classification]?.sublabel}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Điểm Năng lực Rubric:</span>
                <span className="font-bold text-indigo-700 text-base">
                  {activeSkillDetail.proficiencyScore !== null ? `${activeSkillDetail.proficiencyScore}/100` : 'Chưa có bài kiểm tra'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Độ tự tin nhận diện AI:</span>
                <span className="font-medium text-gray-700">
                  {activeSkillDetail.aiConfidence !== null ? `${Math.round(activeSkillDetail.aiConfidence * 100)}%` : 'Thủ công'}
                </span>
              </div>
            </div>

            {/* Competency Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🎯</span> Danh mục Năng lực Thành phần (Competency Breakdown)
              </h3>
              {(!activeSkillDetail.competencies || activeSkillDetail.competencies.length === 0) ? (
                <p className="text-xs text-gray-500 italic">Chưa có thông tin competency chi tiết.</p>
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
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-gray-800 text-sm">{ev.title || 'Bằng chứng năng lực'}</span>
                          <span className="ml-2 text-gray-400 font-normal">({EVIDENCE_TYPE_LABELS[ev.evidenceType] || ev.evidenceType})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${STATUS_BADGE[ev.verificationStatus] || 'bg-gray-100'}`}>
                          {ev.verificationStatus}
                        </span>
                      </div>

                      {ev.description && <p className="text-gray-600">{ev.description}</p>}
                      {ev.sourceUrl && (
                        <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block truncate">
                          🔗 {ev.sourceUrl}
                        </a>
                      )}

                      {/* Rubric feedback */}
                      {ev.assessmentResult?.feedback && (
                        <div className="p-2.5 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">
                          <strong>Kết quả đánh giá:</strong> {ev.assessmentResult.feedback}
                          {ev.assessmentResult.score && (
                            <span className="ml-2 font-bold text-emerald-700">({ev.assessmentResult.score}/100)</span>
                          )}
                        </div>
                      )}

                      {/* Reviewer Action Buttons (if Lecturer/Admin) */}
                      {isReviewer && ev.verificationStatus !== 'VERIFIED' && (
                        <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
                          <span className="text-[11px] text-gray-500 font-medium">Thẩm định giảng viên:</span>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'VERIFIED', 'Giảng viên đã xác nhận tính hợp lệ')}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-medium"
                          >
                            Xác thực (Verified)
                          </button>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'MORE_EVIDENCE_REQUIRED', 'Cần bổ sung thêm tài liệu minh chứng')}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium"
                          >
                            Yêu cầu bổ sung
                          </button>
                          <button
                            onClick={() => handleReviewEvidence(activeSkillDetail._id, ev.evidenceId || ev._id, 'REJECTED', 'Bằng chứng không phù hợp')}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium"
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
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lịch sử Xác thực</h3>
                <div className="space-y-1.5 text-xs text-gray-600">
                  {activeSkillDetail.verificationHistory.map((hist, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-400">{new Date(hist.changedAt).toLocaleDateString()}</span>
                      <span>Chuyển từ <span className="font-semibold">{hist.fromStatus}</span> ➔ <span className="font-semibold text-purple-700">{hist.toStatus}</span></span>
                      {hist.reason && <span className="text-gray-500 italic">({hist.reason})</span>}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Khai báo Kỹ năng mới</h2>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs">
              ℹ️ Kỹ năng tự khai báo sẽ được xếp loại <strong>Tự khai báo (Self-reported)</strong>. Bạn cần nộp thêm kết quả Quiz hoặc bài tập thực tế để chuyển thành <strong>Đã đánh giá (Assessed)</strong>.
            </div>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Kỹ năng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: React, Node.js, SQL, Python..."
                  value={newSkillForm.skillName}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, skillName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cấp độ Tự đánh giá *</label>
                <select
                  value={newSkillForm.proficiency}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, proficiency: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(PROFICIENCY_VI).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú hoặc Bằng chứng ban đầu</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả dự án hoặc kinh nghiệm đã làm với kỹ năng này..."
                  value={newSkillForm.evidence}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, evidence: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Nộp Bằng chứng Năng lực cho: <span className="text-indigo-600">{selectedSkillForEvidence.skillName}</span>
            </h2>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hình thức Bằng chứng *</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PROJECT">Dự án thực tế (Project)</option>
                  <option value="QUIZ_RESULT">Liên kết Kết quả Quiz môn học</option>
                  <option value="ASSIGNMENT">Liên kết Bài nộp Assignment đã chấm</option>
                  <option value="GITHUB_REPO">GitHub Repository</option>
                  <option value="CERTIFICATE">Chứng chỉ hoàn thành</option>
                  <option value="MANUAL">Tài liệu khác</option>
                </select>
              </div>

              {/* Linking to existing Quiz attempt */}
              {evidenceForm.evidenceType === 'QUIZ_RESULT' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Chọn Quiz để liên kết kết quả</label>
                  {myQuizzes.length === 0 ? (
                    <p className="text-gray-500">Chưa tìm thấy bài Quiz nào.</p>
                  ) : (
                    <select
                      value={evidenceForm.linkedEntityId}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, linkedEntityId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  <label className="block font-semibold text-gray-700 mb-1">Chọn Bài nộp môn học</label>
                  {myGradebook.length === 0 ? (
                    <p className="text-gray-500">Chưa có bài nộp nào trong hệ thống.</p>
                  ) : (
                    <select
                      value={evidenceForm.linkedEntityId}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, linkedEntityId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <label className="block font-semibold text-gray-700 mb-1">Tiêu đề Bằng chứng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xây dựng module quản lý giỏ hàng React Redux"
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Liên kết ngoài (GitHub / Demo / File URL)</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={evidenceForm.sourceUrl}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mô tả chi tiết năng lực & công việc đã làm *</label>
                <textarea
                  rows={4}
                  placeholder="Mô tả cụ thể các tính năng, công nghệ, hooks, thuật toán hoặc thư viện bạn đã sử dụng để AI phân tích đối chiếu với rubric..."
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Gửi & Đánh giá Năng lực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
