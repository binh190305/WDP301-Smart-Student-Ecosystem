import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teamApi, joinRequestApi, announcementApi, postApi } from '../../api';
import { skillIntelligenceApi } from '../../api/skill-intelligence';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState, Card, CardHeader, CardBody, Badge, Button } from '../../components/common';
import { MatchScoreBadge } from '../../components/common/MatchScore';
import { formatRelative } from '../../utils/format';

const StudentDashboard = () => {
  const { user } = useAuth();

  const { data, loading } = useAsync(
    () =>
      Promise.all([
        teamApi.recommended({ limit: 4 }),
        teamApi.mine(),
        joinRequestApi.mine({ status: 'pending' }),
        announcementApi.list({ limit: 4 }),
        postApi.list({ type: 'event', limit: 3 }),
        skillIntelligenceApi.getMySkills().catch(() => ({ data: [] })),
        skillIntelligenceApi.getProfileMetrics().catch(() => ({ data: {} })),
      ]),
    []
  );

  if (loading) return <LoadingState />;

  const [recommended, myTeams, pendingRequests, announcements, events, skillsData, metricsData] = data || [];
  const recommendations = recommended?.data?.recommendations || [];
  const teams = myTeams?.data?.teams || [];

  // Robustly extract skills array
  const mySkills = Array.isArray(skillsData?.data?.skills)
    ? skillsData.data.skills
    : Array.isArray(skillsData?.data)
    ? skillsData.data
    : [];
  const metrics = metricsData?.data?.metrics || metricsData?.data || {};

  // Calculate real progress based on actual skills
  const totalSkillsCount = mySkills.length;
  const verifiedCount =
    metrics.verifiedCount ??
    (Array.isArray(mySkills) ? mySkills.filter((s) => s.classification === 'verified').length : 0);
  const progressPercent = totalSkillsCount > 0 ? Math.min(100, Math.round((totalSkillsCount / 8) * 100)) : 0;

  const topSkills = Array.isArray(mySkills) ? mySkills.slice(0, 4) : [];
  const upcomingEvent = events?.data?.[0];

  const skillsRequiringEvidence = Array.isArray(mySkills)
    ? mySkills.filter(
        (s) =>
          s.verificationStatus === 'MORE_EVIDENCE_REQUIRED' ||
          (Array.isArray(s.evidence) && s.evidence.some((e) => e.verificationStatus === 'MORE_EVIDENCE_REQUIRED'))
      )
    : [];

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-8">
      {/* Alert: Yêu cầu nộp bổ sung minh chứng */}
      {skillsRequiringEvidence.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Bạn có {skillsRequiringEvidence.length} kỹ năng cần nộp bổ sung minh chứng
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Ban thẩm định / Giảng viên yêu cầu bổ sung minh chứng cho:{' '}
                <strong>{skillsRequiringEvidence.map((s) => s.skillName).join(', ')}</strong>. Vui lòng cập nhật để hoàn tất thẩm định.
              </p>
            </div>
          </div>
          <Link
            to="/app/skill-intelligence/profile"
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition shrink-0"
          >
            Nộp bổ sung ngay ➔
          </Link>
        </div>
      )}

      {/* 1. THE 3-COLUMN BENTO GRID WITH REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Tiến độ phát triển kỹ năng */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-700/80 dark:bg-[#1e1e1e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200 text-[10px]">
                  📈
                </span>
                Tiến độ phát triển kỹ năng
              </h3>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-700">
                {verifiedCount} đã xác thực
              </span>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    {totalSkillsCount}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-300 ml-1.5">kỹ năng tích lũy</span>
                </div>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full border border-transparent dark:border-neutral-700">
                  Mục tiêu: 8 kỹ năng
                </span>
              </div>

              {/* Linear Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalSkillsCount / 8) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-neutral-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-300 mb-2">Kỹ năng nổi bật</p>
            {topSkills.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {topSkills.map((sk) => (
                  <div
                    key={sk._id || sk.skillName}
                    className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/90 px-2.5 py-1.5 text-xs font-bold text-stone-800 dark:text-stone-100 border border-stone-200/80 dark:border-neutral-700 shadow-2xs hover:border-violet-300 dark:hover:border-violet-500 transition"
                  >
                    <span className="truncate">{sk.skillName}</span>
                    <span className="text-[10px] text-violet-700 dark:text-violet-200 bg-violet-100/70 dark:bg-violet-900/60 font-extrabold px-1.5 py-0.5 rounded-md border border-transparent dark:border-violet-700/60">
                      {sk.proficiency ? sk.proficiency.slice(0, 3).toUpperCase() : 'LV.1'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 bg-stone-50 dark:bg-neutral-800/80 rounded-xl border border-dashed border-stone-200 dark:border-neutral-700">
                <Link
                  to="/app/skill-intelligence/profile"
                  className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200"
                >
                  ➕ Khai báo kỹ năng đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Hoạt động gần đây */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-700/80 dark:bg-[#1e1e1e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 text-[10px]">
                  ⚡
                </span>
                Hoạt động gần đây
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-700">Trực tuyến</span>
            </div>
            
            <div className="space-y-2.5 mt-4">
              {teams.length > 0 && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800/90 border border-stone-200/60 dark:border-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-xs font-bold">
                      👥
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-100 truncate max-w-[170px]">
                      Nhóm: <strong className="text-violet-700 dark:text-violet-300">{teams[0]?.name}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-300 font-medium">{teams[0]?.status || 'Active'}</span>
                </div>
              )}

              {totalSkillsCount > 0 && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800/90 border border-stone-200/60 dark:border-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 text-xs font-bold">
                      ✓
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-100 truncate max-w-[170px]">
                      Đã cập nhật: <strong className="text-emerald-700 dark:text-emerald-300">{mySkills[0]?.skillName || 'Kỹ năng'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-300 font-medium">Hồ sơ năng lực</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800/90 border border-stone-200/60 dark:border-neutral-700">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 text-xs font-bold">
                    📝
                  </span>
                  <span className="font-semibold text-stone-800 dark:text-stone-100 truncate max-w-[170px]">
                    Đã đăng nhập: <strong className="text-purple-700 dark:text-purple-300">{user?.name}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold">Vừa xong</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-neutral-800 text-right mt-4">
            <Link to="/app/skill-intelligence/profile" className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 transition">
              Xem hồ sơ năng lực ➔
            </Link>
          </div>
        </div>

        {/* Card 3: Sự kiện sắp tới & Thông báo */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-700/80 dark:bg-[#1e1e1e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200 text-[10px]">
                  🏆
                </span>
                Sự kiện sắp tới
              </h3>
              <Link to="/app/calendar" className="text-[11px] font-bold text-violet-600 dark:text-violet-300 hover:underline">
                Xem lịch ➔
              </Link>
            </div>

            {/* Event Card from DB or default calendar link */}
            {upcomingEvent ? (
              <Link
                to={`/app/events/${upcomingEvent._id}`}
                className="group flex items-center gap-3.5 rounded-xl border border-stone-200/70 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/90 p-3 hover:bg-stone-100/80 dark:hover:bg-neutral-800 transition block mt-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 text-white font-black text-xs shadow-xs group-hover:scale-105 transition">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition">
                    {upcomingEvent.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-300 font-medium mt-0.5">
                    {formatRelative(upcomingEvent.createdAt)}
                  </p>
                </div>
                <span className="text-stone-400 dark:text-stone-400 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition font-bold text-sm">›</span>
              </Link>
            ) : (
              <Link
                to="/app/feed"
                className="group flex items-center gap-3.5 rounded-xl border border-stone-200/70 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/90 p-3 hover:bg-stone-100/80 dark:hover:bg-neutral-800 transition block mt-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 text-white font-black text-xs shadow-xs group-hover:scale-105 transition">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition">
                    Bảng tin hoạt động & sự kiện
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-300 font-medium mt-0.5">Khám phá hoạt động học thuật mới</p>
                </div>
                <span className="text-stone-400 dark:text-stone-400 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition font-bold text-sm">›</span>
              </Link>
            )}

            {/* Thông báo Alert Card */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">Thông báo</span>
                  <span className="flex h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white shadow-2xs">
                    {(announcements?.data || []).length}
                  </span>
                </div>
                <Link to="/app/announcements" className="text-[11px] font-bold text-stone-500 dark:text-stone-300 hover:text-stone-700 dark:hover:text-white">
                  Xem tất cả
                </Link>
              </div>

              <p className="text-[11px] text-stone-700 dark:text-stone-200 font-medium leading-relaxed bg-stone-50 dark:bg-neutral-800/90 p-2.5 rounded-xl border border-stone-200/60 dark:border-neutral-700 line-clamp-2">
                {(announcements?.data || [])[0]?.title || 'Chưa có thông báo mới từ hệ thống.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BẢO TOÀN DỮ LIỆU & CHỨC NĂNG CỐT LÕI */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Khối gợi ý nhóm đồ án thực tế */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Đội nhóm đề xuất phù hợp nhất"
            subtitle="Dựa trên thuật toán AI Embedding & Phân tích khoảng cách kỹ năng (Skill Gap)"
            action={
              <Link to="/app/teams/discover" className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 hover:underline">
                Xem toàn bộ ➔
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-300">
                Chưa có gợi ý nhóm nào phù hợp. Hãy khai báo thêm kỹ năng nhé!
              </div>
            ) : (
              recommendations.map(({ team, score }) => (
                <Link
                  key={team._id}
                  to={`/app/teams/${team._id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800/90 dark:hover:border-violet-500 dark:hover:bg-neutral-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-stone-900 dark:text-stone-100">{team.name}</p>
                      <span className="badge-ai text-[10px]">Đề xuất AI</span>
                    </div>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-300 mt-0.5">{team.topic || team.major}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(team.skillsNeeded || []).slice(0, 4).map((skill) => (
                        <span key={skill} className="inline-flex rounded-lg bg-violet-50 dark:bg-violet-950/80 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-200 border border-violet-200/70 dark:border-violet-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <MatchScoreBadge score={score} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        {/* Khối Thông báo học vụ & Sự kiện từ DB */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Bảng tin học vụ mới" />
            <CardBody className="space-y-3">
              {(announcements?.data || []).length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-300">Chưa có thông báo.</p>
              ) : (
                (announcements?.data || []).slice(0, 3).map((item) => (
                  <div key={item._id} className="border-l-2 border-violet-500 pl-3">
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-300 mt-0.5">{formatRelative(item.createdAt)}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Hoạt động ngoại khóa" />
            <CardBody className="space-y-3">
              {(events?.data || []).length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-300">Chưa có sự kiện.</p>
              ) : (
                (events?.data || []).slice(0, 2).map((event) => (
                  <Link key={event._id} to="/app/feed" className="block rounded-xl p-2.5 transition hover:bg-stone-50 dark:hover:bg-neutral-800/90 border border-stone-200/70 dark:border-neutral-700 bg-stone-50/50 dark:bg-neutral-800/60">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{event.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(event.tagsNeeded || []).slice(0, 2).map((tag) => (
                        <Badge key={tag} tone="accent">{tag}</Badge>
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
