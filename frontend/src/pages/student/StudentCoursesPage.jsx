import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Card, CardBody, Badge, Button, LoadingState, EmptyState } from '../../components/common';
import PageHeader from '../../components/layout/PageHeader';

const StudentCoursesPage = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter === 'enrolled') params.enrolled = 'true';
      const res = await courseApi.list(params);
      setCourses(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const toggle = async (course) => {
    setBusyId(course._id);
    try {
      if (course.isEnrolled) {
        await courseApi.unenroll(course._id);
        toast.success(`Đã hủy ghi danh học phần ${course.code}`);
      } else {
        await courseApi.enroll(course._id);
        toast.success(`Đã ghi danh thành công học phần ${course.code}`);
      }
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.lecturer?.name?.toLowerCase().includes(q)
    );
  });

  const enrolledCount = courses.filter((c) => c.isEnrolled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-sm font-bold">
              📚
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Danh mục Học phần</h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-300 mt-1">
            Ghi danh học phần để nhận bài tập, giáo trình, bộ câu hỏi trắc nghiệm và thông báo từ giảng viên.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-stone-900 dark:bg-neutral-700 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-700/80'
            }`}
          >
            <span>Tất cả học phần</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${filter === 'all' ? 'bg-stone-700 dark:bg-neutral-600 text-white' : 'bg-stone-100 dark:bg-neutral-700 text-stone-700 dark:text-stone-300'}`}>
              {courses.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('enrolled')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'enrolled'
                ? 'bg-violet-600 dark:bg-violet-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-700/80'
            }`}
          >
            <span>Đã ghi danh</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${filter === 'enrolled' ? 'bg-violet-700 text-white' : 'bg-stone-100 dark:bg-neutral-700 text-stone-700 dark:text-stone-300'}`}>
              {enrolledCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo mã môn, tên môn, giảng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
          />
          <span className="absolute left-3 top-2.5 text-xs text-stone-400 dark:text-stone-500">🔍</span>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <LoadingState />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="Không tìm thấy học phần nào"
          description={
            filter === 'enrolled'
              ? 'Bạn chưa ghi danh học phần nào. Hãy chuyển sang tab "Tất cả học phần" để bắt đầu ghi danh.'
              : 'Không có học phần nào phù hợp với từ khóa tìm kiếm.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="card-bento p-5 flex flex-col justify-between hover:shadow-bento-hover transition-all bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-xs shadow-sm">
                      {course.code?.slice(0, 3) || 'HP'}
                    </span>
                    <div>
                      <span className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight block">
                        {course.code}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">Học phần chính quy</span>
                    </div>
                  </div>
                  {course.isEnrolled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> Đã ghi danh
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:text-stone-400">
                      Chưa ghi danh
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mt-2 line-clamp-2 leading-snug">
                  {course.title}
                </h3>

                <div className="mt-3.5 space-y-1.5 pt-3 border-t border-stone-100 dark:border-neutral-800 text-xs">
                  {course.lecturer?.name && (
                    <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                      <span className="text-stone-400 font-medium">Giảng viên:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{course.lecturer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span className="text-stone-400 font-medium">Sinh viên:</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400">
                      {course.enrollmentCount || 0} đã tham gia
                    </span>
                  </div>
                </div>

                {course.isEnrolled && (
                  <div className="mt-3">
                    <Link
                      to={`/app/courses/${course._id}/lessons`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 transition"
                    >
                      <span>Xem nội dung & bài học</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                <Button
                  variant={course.isEnrolled ? 'secondary' : 'primary'}
                  className="w-full text-xs font-bold"
                  loading={busyId === course._id}
                  onClick={() => toggle(course)}
                >
                  {course.isEnrolled ? 'Hủy ghi danh' : 'Ghi danh học phần'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCoursesPage;
