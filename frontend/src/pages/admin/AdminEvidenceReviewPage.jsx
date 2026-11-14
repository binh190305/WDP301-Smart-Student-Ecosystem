import { useState, useEffect } from 'react';
import { skillIntelligenceApi } from '../../api/skill-intelligence';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../context/ToastContext';

const AdminEvidenceReviewPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [evidenceList, setEvidenceList] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewScore, setReviewScore] = useState(85);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await skillIntelligenceApi.listAllPendingEvidence();
      const list = res?.data || res || [];
      setEvidenceList(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách bằng chứng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleReview = async (decision) => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await skillIntelligenceApi.reviewEvidence(
        selectedItem.skillId,
        selectedItem.evidenceId,
        {
          decision,
          comments: reviewComment || (decision === 'VERIFIED' ? 'Đã thẩm định đạt yêu cầu chuẩn đầu ra' : 'Cần bổ sung thêm tài liệu minh chứng rõ ràng hơn'),
          score: decision === 'VERIFIED' ? Number(reviewScore) : null,
        }
      );
      showToast(
        decision === 'VERIFIED'
          ? `Đã xác thực kỹ năng "${selectedItem.skillName}" cho sinh viên ${selectedItem.studentName}!`
          : decision === 'REJECTED'
          ? `Đã từ chối bằng chứng của ${selectedItem.studentName}`
          : `Đã gửi yêu cầu bổ sung bằng chứng`,
        'success'
      );
      setSelectedItem(null);
      setReviewComment('');
      fetchPending();
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thẩm định', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = evidenceList.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (item.studentName && item.studentName.toLowerCase().includes(term)) ||
      (item.skillName && item.skillName.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term));

    const matchesType =
      filterType === 'ALL' ||
      item.evidenceType === filterType ||
      (filterType === 'PROJECT' && (item.evidenceType === 'PROJECT' || item.evidenceType === 'PROJECT_DESCRIPTION')) ||
      (filterType === 'CERTIFICATE' && (item.evidenceType === 'CERTIFICATE' || item.evidenceType === 'COURSE_COMPLETION')) ||
      (filterType === 'MANUAL' && (item.evidenceType === 'MANUAL' || item.evidenceType === 'WORK_EXPERIENCE' || item.evidenceType === 'ACADEMIC_INTEREST'));

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thẩm định & Kiểm duyệt Bằng chứng Kỹ năng"
        description="Không gian dành cho Giảng viên & Quản trị viên thẩm định các minh chứng năng lực thực tế của sinh viên."
      />

      {/* Top Bento Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-bento flex items-center justify-between border-amber-100 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Chờ thẩm định</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{evidenceList.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xl font-bold">
            ⏳
          </div>
        </div>

        <div className="card-bento flex items-center justify-between border-violet-100 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Dự án thực tế</p>
            <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">
              {evidenceList.filter((e) => ['PROJECT', 'PROJECT_DESCRIPTION'].includes(e.evidenceType)).length}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-xl font-bold">
            💻
          </div>
        </div>

        <div className="card-bento flex items-center justify-between border-stone-200/80 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">GitHub & Code</p>
            <p className="mt-1 text-2xl font-bold text-stone-800 dark:text-stone-200">
              {evidenceList.filter((e) => e.evidenceType === 'GITHUB_REPO').length}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-neutral-800 text-stone-800 dark:text-stone-200 text-xl font-bold">
            🐙
          </div>
        </div>

        <div className="card-bento flex items-center justify-between border-emerald-100 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Chứng chỉ & Khác</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {evidenceList.filter((e) => ['CERTIFICATE', 'COURSE_COMPLETION', 'MANUAL', 'WORK_EXPERIENCE', 'ACADEMIC_INTEREST'].includes(e.evidenceType)).length}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
            📜
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2.5xl border border-stone-200/80 dark:border-neutral-800 shadow-bento">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo sinh viên, kỹ năng, đề tài..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50/50 dark:bg-neutral-800 px-3.5 py-2 text-sm text-stone-800 dark:text-stone-100 focus:border-violet-500 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'PROJECT', 'GITHUB_REPO', 'CERTIFICATE', 'MANUAL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterType === type
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700'
              }`}
            >
              {type === 'ALL'
                ? 'Tất cả'
                : type === 'PROJECT'
                ? 'Dự án'
                : type === 'GITHUB_REPO'
                ? 'GitHub'
                : type === 'CERTIFICATE'
                ? 'Chứng chỉ'
                : 'Khác'}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Đang tải danh sách bằng chứng...</p>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] p-12 text-center shadow-bento">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-3xl">
            ✨
          </div>
          <h3 className="mt-4 text-base font-bold text-stone-900 dark:text-stone-100">Không có bằng chứng nào chờ thẩm định</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Tất cả các minh chứng kỹ năng của sinh viên đã được xét duyệt hoặc chưa có sinh viên nào nộp mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => (
            <div
              key={`${item.skillId}-${item.evidenceId}`}
              className="card-bento flex flex-col justify-between border-stone-200/90 dark:border-neutral-800"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="badge-ai">
                    ⚡ {item.skillName}
                  </span>
                  <span className="inline-flex rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Chờ duyệt
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1">{item.title || 'Bằng chứng kỹ năng'}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Sinh viên: <span className="font-semibold text-violet-700 dark:text-violet-400">{item.studentName}</span> ({item.studentEmail})
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50/70 dark:bg-neutral-800 p-3 text-xs text-stone-600 dark:text-stone-300 border border-stone-100 dark:border-neutral-700">
                  <p className="line-clamp-3 italic">
                    "{item.description || 'Không có mô tả chi tiết'}"
                  </p>
                </div>

                {item.sourceUrl && (
                  <div className="text-xs">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 hover:underline font-medium"
                    >
                      🔗 Xem liên kết minh chứng ngoài ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : 'Mới nộp'}
                </span>
                <button
                  onClick={() => setSelectedItem(item)}
                  className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                >
                  Thẩm định ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 dark:bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl space-y-4 border border-stone-200/80 dark:border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Thẩm định minh chứng</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Sinh viên: <strong className="text-violet-700 dark:text-violet-400">{selectedItem.studentName}</strong> • Kỹ năng: <strong className="text-stone-900 dark:text-stone-100">{selectedItem.skillName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-stone-700 dark:text-stone-300">Tiêu đề:</span>
                <p className="text-stone-900 dark:text-stone-100 font-medium mt-0.5">{selectedItem.title}</p>
              </div>

              <div>
                <span className="font-semibold text-stone-700 dark:text-stone-300">Mô tả chi tiết năng lực:</span>
                <div className="mt-1 rounded-xl bg-stone-50 dark:bg-neutral-800 p-3 text-stone-700 dark:text-stone-200 border border-stone-200/60 dark:border-neutral-700 max-h-36 overflow-y-auto">
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.sourceUrl && (
                <div>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Đường dẫn đính kèm:</span>
                  <p className="mt-0.5">
                    <a
                      href={selectedItem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 dark:text-violet-400 hover:underline break-all font-medium"
                    >
                      {selectedItem.sourceUrl}
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Điểm đánh giá năng lực thực tế (0 - 100 điểm)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    className="flex-1 accent-violet-600"
                  />
                  <span className="font-bold text-sm text-violet-700 dark:text-violet-400 w-12 text-right">
                    {reviewScore} đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nhận xét thẩm định của Giảng viên / Ban thẩm định
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ghi chú đánh giá hoặc lý do yêu cầu bổ sung minh chứng..."
                  className="w-full rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 p-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 dark:border-neutral-800 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-stone-300 dark:border-neutral-700 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-neutral-800"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview('MORE_EVIDENCE_REQUIRED')}
                className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/60 dark:border-amber-700 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-50"
              >
                Yêu cầu bổ sung
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview('REJECTED')}
                className="rounded-xl border border-red-300 bg-red-50 dark:bg-rose-950/60 dark:border-rose-700 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-rose-900/60 disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview('VERIFIED')}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-700 transition disabled:opacity-50"
              >
                {submitting ? 'Đang duyệt...' : '✓ Xác thực chính thức'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvidenceReviewPage;

