import { gamificationApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { Card, CardBody, Badge, LoadingState, ErrorState, EmptyState } from '../components/common';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/layout/PageHeader';
import { cn } from '../utils/cn';

const RANK_STYLES = {
  1: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
  2: 'bg-stone-200 text-stone-700 border border-stone-300 dark:bg-neutral-700 dark:text-stone-200 dark:border-neutral-600',
  3: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700',
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { data, loading, error, run } = useAsync(() => gamificationApi.leaderboard(), []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={run} />;

  const top = data?.data?.top || [];
  const me = data?.data?.me;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bảng xếp hạng"
        description="Điểm hoạt động tính từ bài tập, trắc nghiệm, bài học hoàn thành và bình luận."
      />

      {me && (
        <Card className="mb-6 border-stone-200/80 dark:border-neutral-700/80 bg-white dark:bg-[#1e1e1e]">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 dark:bg-neutral-800 text-lg font-black text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-neutral-700 shadow-sm">
                #{me.rank}
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-stone-900 dark:text-stone-100">{me.points} điểm hoạt động</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {me.stats.submissionCount} bài nộp · {me.stats.quizAttempts} lượt trắc nghiệm · {me.stats.lessonsCompleted} bài học · {me.stats.comments} bình luận
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.badges.map((badge) => (
                <span
                  key={badge.key}
                  title={badge.description}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border',
                    badge.earned
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                      : 'bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-neutral-700'
                  )}
                >
                  {badge.earned ? '🏅' : '🔒'} {badge.label}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {top.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" description="Chưa có sinh viên nào có hoạt động." />
      ) : (
        <Card>
          <CardBody className="p-0">
            {top.map((row) => {
              const isMe = row.student._id === user?.id;
              return (
                <div
                  key={row.student._id}
                  className={cn(
                    'flex items-center gap-3.5 border-b border-stone-100 dark:border-neutral-800/80 px-5 py-3.5 transition last:border-0',
                    isMe
                      ? 'bg-violet-50/70 dark:bg-violet-950/30'
                      : 'hover:bg-stone-50/70 dark:hover:bg-neutral-800/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs',
                      RANK_STYLES[row.rank] || 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-neutral-700'
                    )}
                  >
                    {row.rank}
                  </span>
                  <Avatar name={row.student.name} src={row.student.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-sm text-stone-900 dark:text-stone-100">
                      {row.student.name}
                      {isMe && <span className="ml-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">(Bạn)</span>}
                    </p>
                    {row.student.major && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{row.student.major}</p>}
                  </div>
                  <Badge tone="brand">{row.points} điểm</Badge>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default LeaderboardPage;
