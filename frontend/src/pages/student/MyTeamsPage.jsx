import { useState } from 'react';
import { Link } from 'react-router-dom';
import { teamApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { Card, CardBody, Badge, Button, LoadingState, EmptyState } from '../../components/common';
import Avatar from '../../components/common/Avatar';
import PageHeader from '../../components/layout/PageHeader';
import Icon from '../../components/common/Icon';
import { TEAM_STATUS_LABELS } from '../../utils/constants';
import CreateTeamModal from './CreateTeamModal';

const STATUS_TONE = { recruiting: 'success', full: 'warning', closed: 'neutral' };

const MyTeamsPage = () => {
  const { user } = useAuth();
  const { data, loading, run } = useAsync(() => teamApi.mine(), []);
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) return <LoadingState />;
  const teams = data?.data?.teams || [];

  return (
    <div className="space-y-6">
      {/* Header matching official reference */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-sm font-bold">
              👥
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Quản lý đội nhóm</h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-300 mt-1">
            Không gian làm việc, phân công nhiệm vụ và theo dõi tiến độ đồ án nhóm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="shadow-md shadow-violet-500/20">
            <Icon name="plus" className="h-4 w-4" /> Tạo nhóm mới
          </Button>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="Bạn chưa tham gia nhóm nào"
          description="Hãy để AI gợi ý nhóm phù hợp, hoặc tự tạo nhóm để bắt đầu tuyển thành viên."
          action={
            <div className="flex gap-2">
              <Link to="/app/teams/discover">
                <Button variant="secondary">Tìm nhóm</Button>
              </Link>
              <Button onClick={() => setCreateOpen(true)}>Tạo nhóm</Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {teams.map((team) => {
            const isLeader = team.leader?._id === user?.id || team.leader === user?.id;
            const memberCount = team.members?.length || 1;
            const maxMembers = team.maxMembers || 5;
            const recruitmentProgress = Math.min(100, Math.round((memberCount / maxMembers) * 100));
            return (
              <div
                key={team._id}
                className="card-bento p-6 flex flex-col justify-between transition-all bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 shadow-sm hover:border-violet-300 dark:hover:border-violet-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-violet-500/20">
                        👥
                      </div>
                      <div>
                        <Link
                          to={`/app/teams/${team._id}`}
                          className="font-black text-base text-stone-900 dark:text-stone-100 hover:text-violet-600 dark:hover:text-violet-300 transition"
                        >
                          {team.name}
                        </Link>
                        <p className="text-xs text-stone-500 dark:text-stone-300 font-medium mt-0.5">
                          {memberCount} thành viên • Dự án: {team.topic || team.major || 'STE Platform'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isLeader && (
                        <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/60 dark:border-violet-800">
                          Trưởng nhóm
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                        {TEAM_STATUS_LABELS[team.status] || 'Đang hoạt động'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Team Progress */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700 dark:text-stone-300">Quy mô & Đội hình</span>
                      <span className="font-black text-violet-600 dark:text-violet-300">{memberCount}/{maxMembers} thành viên ({recruitmentProgress}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-neutral-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                        style={{ width: `${recruitmentProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      <span>{maxMembers - memberCount > 0 ? `Cần tuyển thêm ${maxMembers - memberCount} thành viên` : 'Đội hình đã hoàn tất'}</span>
                      <span className="text-violet-600 dark:text-violet-300 font-semibold">{team.status === 'recruiting' ? 'Đang tuyển' : 'Đã đủ thành viên'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with member avatar stack and Manage button */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-neutral-800">
                  <div className="flex items-center -space-x-2">
                    {(team.members || []).slice(0, 3).map((m, idx) => (
                      <div
                        key={idx}
                        className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/60 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-200 shadow-sm"
                      >
                        {m.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    ))}
                    {(team.members?.length || 0) > 3 && (
                      <div className="h-7 w-7 rounded-full bg-stone-100 dark:bg-neutral-700 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-[10px] font-bold text-stone-500 dark:text-stone-300 shadow-sm">
                        +{(team.members?.length || 0) - 3}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/app/teams/${team._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-stone-800 dark:text-stone-200 border border-stone-200/60 dark:border-neutral-700 transition"
                  >
                    <span>Quản lý</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={run} />
    </div>
  );
};

export default MyTeamsPage;
