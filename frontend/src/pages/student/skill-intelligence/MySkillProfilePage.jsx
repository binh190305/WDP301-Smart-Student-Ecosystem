// My Skill Profile Page – SI-03
import { useEffect, useState } from 'react';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { Link } from 'react-router-dom';

const PROFICIENCY_COLORS = {
  beginner: 'bg-gray-100 text-gray-700',
  elementary: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-green-100 text-green-700',
  advanced: 'bg-yellow-100 text-yellow-700',
  expert: 'bg-purple-100 text-purple-700',
};
const PROFICIENCY_VI = {
  beginner: 'Mới bắt đầu',
  elementary: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
  expert: 'Chuyên gia',
};
const STATUS_BADGES = {
  student_declared: { label: 'Tự khai', color: 'bg-blue-50 text-blue-600 border border-blue-200' },
  ai_suggested: { label: 'AI đề xuất', color: 'bg-orange-50 text-orange-600 border border-orange-200' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-green-50 text-green-600 border border-green-200' },
  rejected: { label: 'Đã từ chối', color: 'bg-red-50 text-red-600 border border-red-200' },
};

function SkillCard({ skill, onConfirm, onReject, onRemove, onUpdateProficiency }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newProficiency, setNewProficiency] = useState(skill.proficiency);
  const badge = STATUS_BADGES[skill.status] || STATUS_BADGES.student_declared;

  const handleProficiencyUpdate = async () => {
    await onUpdateProficiency(skill._id, newProficiency);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900 text-sm">{skill.skillName}</span>
          {skill.aiCategory && <span className="text-xs text-gray-400">{skill.aiCategory}</span>}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
      </div>

      {/* Proficiency */}
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={newProficiency}
              onChange={(e) => setNewProficiency(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              {Object.entries(PROFICIENCY_VI).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button onClick={handleProficiencyUpdate} className="text-xs text-blue-600 hover:underline">Lưu</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">Hủy</button>
          </>
        ) : (
          <button
            onClick={() => skill.status !== 'rejected' && setEditing(true)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[skill.proficiency]} ${skill.status !== 'rejected' ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {PROFICIENCY_VI[skill.proficiency] || skill.proficiency}
          </button>
        )}
        {skill.confidence != null && (
          <span className="text-xs text-gray-400 ml-auto">
            Độ tin cậy: {Math.round(skill.confidence * 100)}%
          </span>
        )}
      </div>

      {/* AI suggestion actions */}
      {skill.status === 'ai_suggested' && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => onConfirm(skill._id)}
            className="flex-1 text-xs bg-green-600 text-white rounded px-2 py-1 hover:bg-green-700"
          >
            ✓ Xác nhận
          </button>
          <button
            onClick={() => onReject(skill._id)}
            className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100"
          >
            ✕ Từ chối
          </button>
        </div>
      )}

      {/* Evidence toggle */}
      {skill.evidence?.length > 0 && (
        <button
          onClick={() => setShowEvidence((p) => !p)}
          className="text-xs text-blue-500 hover:underline text-left"
        >
          {showEvidence ? 'Ẩn' : 'Xem'} bằng chứng ({skill.evidence.length})
        </button>
      )}
      {showEvidence && (
        <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 space-y-1">
          {skill.evidence.map((e, i) => (
            <div key={i} className="border-l-2 border-blue-200 pl-2">
              <span className="font-medium">{e.evidenceType}:</span> {e.description || e.sourceText || '—'}
            </div>
          ))}
        </div>
      )}

      {/* Remove */}
      {skill.status !== 'rejected' && (
        <button
          onClick={() => onRemove(skill._id)}
          className="text-xs text-gray-400 hover:text-red-500 text-right self-end"
        >
          Xóa
        </button>
      )}
    </div>
  );
}

export default function MySkillProfilePage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addForm, setAddForm] = useState({ show: false, skillName: '', proficiency: 'beginner', evidence: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');
  const [successMsg, setSuccessMsg] = useState('');

  const notify = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await skillIntelligenceApi.getMySkills(filterStatus !== 'all' ? { status: filterStatus === 'active' ? undefined : filterStatus } : {});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setSkills(list);
    } catch {
      setError('Không thể tải hồ sơ kỹ năng.');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleConfirm = async (id) => {
    await skillIntelligenceApi.confirmSkill(id, {});
    notify('Đã xác nhận kỹ năng!');
    load();
  };
  const handleReject = async (id) => {
    await skillIntelligenceApi.rejectSkill(id);
    notify('Đã từ chối kỹ năng.');
    load();
  };
  const handleRemove = async (id) => {
    if (!window.confirm('Xóa kỹ năng này?')) return;
    await skillIntelligenceApi.removeSkill(id);
    notify('Đã xóa kỹ năng.');
    load();
  };
  const handleUpdateProficiency = async (id, proficiency) => {
    await skillIntelligenceApi.updateSkill(id, { proficiency });
    notify('Đã cập nhật mức độ.');
    load();
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.skillName.trim()) return;
    setAddLoading(true);
    try {
      await skillIntelligenceApi.addSkill({ skillName: addForm.skillName, proficiency: addForm.proficiency, evidence: addForm.evidence });
      setAddForm({ show: false, skillName: '', proficiency: 'beginner', evidence: '' });
      notify('Đã thêm kỹ năng!');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi thêm kỹ năng.');
    } finally {
      setAddLoading(false);
    }
  };

  const skillList = Array.isArray(skills) ? skills : [];
  const aiSuggested = skillList.filter((s) => s.status === 'ai_suggested');
  const active = skillList.filter((s) => s.status !== 'ai_suggested' && s.status !== 'rejected');
  const rejected = skillList.filter((s) => s.status === 'rejected');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ kỹ năng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xác minh các kỹ năng của bạn</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/app/skill-intelligence/analyze"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            🤖 Phân tích AI
          </Link>
          <button
            onClick={() => setAddForm((p) => ({ ...p, show: !p.show }))}
            className="text-sm bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            + Thêm kỹ năng
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/app/skill-intelligence/graph" className="text-xs text-blue-600 underline">🕸 Đồ thị kỹ năng</Link>
        <Link to="/app/skill-intelligence/gap-analysis" className="text-xs text-blue-600 underline">📊 Phân tích khoảng cách</Link>
      </div>

      {/* Success message */}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{successMsg}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

      {/* Add skill form */}
      {addForm.show && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">Thêm kỹ năng mới</h3>
          <div className="flex gap-3 flex-wrap">
            <input
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Tên kỹ năng (vd: React, Python…)"
              value={addForm.skillName}
              onChange={(e) => setAddForm((p) => ({ ...p, skillName: e.target.value }))}
              required
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={addForm.proficiency}
              onChange={(e) => setAddForm((p) => ({ ...p, proficiency: e.target.value }))}
            >
              {Object.entries(PROFICIENCY_VI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Mô tả bằng chứng (tùy chọn)"
            value={addForm.evidence}
            onChange={(e) => setAddForm((p) => ({ ...p, evidence: e.target.value }))}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={addLoading} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {addLoading ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button type="button" onClick={() => setAddForm({ show: false, skillName: '', proficiency: 'beginner', evidence: '' })} className="text-sm text-gray-500 hover:text-gray-700">Hủy</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải…</div>
      ) : (
        <>
          {/* AI Suggestions pending review */}
          {aiSuggested.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                🤖 AI đề xuất – cần xem xét ({aiSuggested.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiSuggested.map((s) => (
                  <SkillCard key={s._id} skill={s} onConfirm={handleConfirm} onReject={handleReject} onRemove={handleRemove} onUpdateProficiency={handleUpdateProficiency} />
                ))}
              </div>
            </section>
          )}

          {/* Active skills */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Kỹ năng của tôi ({active.length})</h2>
            {active.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>Chưa có kỹ năng nào.</p>
                <p className="text-sm mt-1">Thêm thủ công hoặc sử dụng phân tích AI để trích xuất từ hồ sơ của bạn.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {active.map((s) => (
                  <SkillCard key={s._id} skill={s} onConfirm={handleConfirm} onReject={handleReject} onRemove={handleRemove} onUpdateProficiency={handleUpdateProficiency} />
                ))}
              </div>
            )}
          </section>

          {/* Rejected */}
          {rejected.length > 0 && (
            <section>
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Kỹ năng đã từ chối ({rejected.length})</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {rejected.map((s) => (
                    <SkillCard key={s._id} skill={s} onConfirm={handleConfirm} onReject={handleReject} onRemove={handleRemove} onUpdateProficiency={handleUpdateProficiency} />
                  ))}
                </div>
              </details>
            </section>
          )}
        </>
      )}
    </div>
  );
}

