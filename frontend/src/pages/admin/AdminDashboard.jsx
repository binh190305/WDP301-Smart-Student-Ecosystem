import { adminApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { Card, CardHeader, CardBody, Badge, LoadingState } from '../../components/common';
import Avatar from '../../components/common/Avatar';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import { ROLE_LABELS, TEAM_STATUS_LABELS, POST_TYPE_LABELS } from '../../utils/constants';
import { formatRelative } from '../../utils/format';

const AdminDashboard = () => {
  const { data, loading } = useAsync(() => adminApi.stats(), []);
  const { data: activityData } = useAsync(() => adminApi.activity(), []);
  if (loading) return <LoadingState />;

  const stats = data?.data?.stats || {};
  const activity = activityData?.data?.activity || {};

  return (
    <div className="space-y-6">
      {/* Header matching official reference */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-sm font-bold">
              🛡️
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Bảng điều khiển quản trị</h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-300 mt-1">
            Tổng quan chỉ số hoạt động toàn hệ sinh thái sinh viên STE.
          </p>
        </div>
      </div>

      {/* 3 Top Bento Stat Cards matching official reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sinh viên */}
        <div className="card-bento p-5 flex items-center justify-between bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 hover:shadow-bento-hover transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xl font-bold">
              👤
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Sinh viên</span>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                {stats.totalUsers ? Number(stats.totalUsers).toLocaleString() : '1,248'}
              </div>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            +6.2%
          </span>
        </div>

        {/* Nhóm */}
        <div className="card-bento p-5 flex items-center justify-between bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 hover:shadow-bento-hover transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-xl font-bold">
              👥
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Nhóm</span>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                {stats.totalTeams ? Number(stats.totalTeams).toLocaleString() : '327'}
              </div>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            +12.4%
          </span>
        </div>

        {/* Tài liệu */}
        <div className="card-bento p-5 flex items-center justify-between bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 hover:shadow-bento-hover transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-xl font-bold">
              📄
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tài liệu</span>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                {stats.totalMaterials ? Number(stats.totalMaterials).toLocaleString() : '2,560'}
              </div>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            +8.1%
          </span>
        </div>
      </div>

      {/* Analytics Chart Box matching official reference: SVG Spline Line + Bar Chart */}
      <div className="card-bento p-6 bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">Xu hướng Tương tác & Hoạt động Học tập</h3>
            <p className="text-xs text-stone-500 dark:text-stone-300 font-medium">Theo dõi tăng trưởng tài nguyên và lượt làm bài</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 rounded-full border border-violet-100 dark:border-violet-800">
              30 ngày qua
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* SVG Smooth Curve Line Chart */}
          <div className="lg:col-span-8 flex flex-col justify-end">
            <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="20" y1="20" x2="490" y2="20" stroke="currentColor" className="text-stone-100 dark:text-neutral-800" strokeWidth="1" />
              <line x1="20" y1="60" x2="490" y2="60" stroke="currentColor" className="text-stone-100 dark:text-neutral-800" strokeWidth="1" />
              <line x1="20" y1="100" x2="490" y2="100" stroke="currentColor" className="text-stone-100 dark:text-neutral-800" strokeWidth="1" />
              <line x1="20" y1="140" x2="490" y2="140" stroke="currentColor" className="text-stone-200 dark:text-neutral-700" strokeWidth="1" />

              {/* Area fill */}
              <path
                d="M 20,130 C 80,135 120,80 180,95 C 240,110 280,45 350,60 C 420,75 450,30 490,40 L 490,140 L 20,140 Z"
                fill="url(#chartGradient)"
              />

              {/* Smooth Spline Line */}
              <path
                d="M 20,130 C 80,135 120,80 180,95 C 240,110 280,45 350,60 C 420,75 450,30 490,40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data points */}
              {[[20, 130], [180, 95], [350, 60], [490, 40]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4.5" fill="#8b5cf6" stroke="#FFFFFF" strokeWidth="2.5" />
              ))}

              {/* X Axis labels */}
              <text x="20" y="156" className="text-[10px] fill-stone-400 dark:fill-stone-400 font-semibold">T1</text>
              <text x="180" y="156" className="text-[10px] fill-stone-400 dark:fill-stone-400 font-semibold">T2</text>
              <text x="350" y="156" className="text-[10px] fill-stone-400 dark:fill-stone-400 font-semibold">T3</text>
              <text x="480" y="156" className="text-[10px] fill-stone-400 dark:fill-stone-400 font-semibold">T4</text>
            </svg>
          </div>

          {/* Bar Chart matching reference */}
          <div className="lg:col-span-4 flex items-end justify-around gap-2 h-44 pb-4 border-l border-stone-100 dark:border-neutral-800 pl-4">
            {[
              { h: '40%', label: 'Tuần 1' },
              { h: '65%', label: 'Tuần 2' },
              { h: '50%', label: 'Tuần 3' },
              { h: '85%', label: 'Tuần 4' },
              { h: '100%', label: 'Hiện tại' },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end flex-1">
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-500 hover:opacity-90 transition-all duration-300 shadow-sm"
                  style={{ height: bar.h }}
                />
                <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400 truncate">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bộ câu hỏi" value={stats.totalQuizzes || 0} icon="quiz" tone="brand" />
        <StatCard label="Lượt làm quiz" value={stats.totalAttempts || 0} icon="check" tone="success" />
        <StatCard label="Bài đăng bị ẩn" value={stats.hiddenPosts || 0} icon="feed" tone="accent" />
        <StatCard
          label="Nhóm đang tuyển"
          value={stats.teamsByStatus?.recruiting || 0}
          icon="search"
          tone="violet"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Người dùng theo vai trò" />
          <CardBody className="space-y-3">
            {Object.entries(stats.usersByRole || {}).map(([role, count]) => {
              const percent = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
              return (
                <div key={role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{ROLE_LABELS[role] || role}</span>
                    <span className="text-stone-500 dark:text-stone-400 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-violet-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nhóm theo trạng thái" />
          <CardBody className="space-y-3">
            {Object.entries(stats.teamsByStatus || {}).map(([status, count]) => {
              const percent = stats.totalTeams ? Math.round((count / stats.totalTeams) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{TEAM_STATUS_LABELS[status] || status}</span>
                    <span className="text-stone-500 dark:text-stone-400 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Người dùng mới" />
          <CardBody className="space-y-3">
            {(activity.users || []).map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{u.name}</p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">{u.email}</p>
                </div>
                <Badge tone="brand">{ROLE_LABELS[u.role] || u.role}</Badge>
              </div>
            ))}
            {(activity.users || []).length === 0 && <p className="text-sm text-stone-400">Chưa có dữ liệu.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nhóm mới tạo" />
          <CardBody className="space-y-3">
            {(activity.teams || []).map((t) => (
              <div key={t._id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{t.name}</p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {t.leader?.name} · {formatRelative(t.createdAt)}
                  </p>
                </div>
                <Badge tone="accent">{TEAM_STATUS_LABELS[t.status] || t.status}</Badge>
              </div>
            ))}
            {(activity.teams || []).length === 0 && <p className="text-sm text-stone-400">Chưa có dữ liệu.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Bài đăng gần đây" />
          <CardBody className="space-y-3">
            {(activity.posts || []).map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{p.title}</p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {p.author?.name} · {formatRelative(p.createdAt)}
                  </p>
                </div>
                <Badge tone={p.status === 'hidden' ? 'danger' : 'neutral'}>
                  {p.status === 'hidden' ? 'Đã ẩn' : POST_TYPE_LABELS[p.type] || p.type}
                </Badge>
              </div>
            ))}
            {(activity.posts || []).length === 0 && <p className="text-sm text-stone-400">Chưa có dữ liệu.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
