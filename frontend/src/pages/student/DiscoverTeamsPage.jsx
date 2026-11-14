import { useEffect, useState } from 'react';
import { teamApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  Button,
  Input,
  Select,
  LoadingState,
  EmptyState,
  Pagination,
  Modal,
  Textarea,
} from '../../components/common';
import PageHeader from '../../components/layout/PageHeader';
import Icon from '../../components/common/Icon';
import { cn } from '../../utils/cn';
import TeamCard from './TeamCard';
import CreateTeamModal from './CreateTeamModal';
import AiTeamChat from './AiTeamChat';

const TABS = [
  { key: 'recommended', label: 'Gợi ý từ AI', icon: 'sparkles' },
  { key: 'search', label: 'Tìm kiếm nhóm', icon: 'search' },
];

const DiscoverTeamsPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('recommended');
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState(() => new Set());
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', major: '', skill: '', status: 'recruiting', page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  // Đề tài AI gợi ý để điền sẵn form; createKey đổi để form khởi tạo lại theo defaults mới
  const [createDefaults, setCreateDefaults] = useState(null);
  const [createKey, setCreateKey] = useState(0);
  const openCreate = (defaults = null) => {
    setCreateDefaults(defaults);
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  };
  const [joinTarget, setJoinTarget] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);

  const loadSearch = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 9 };
      if (filters.search) params.search = filters.search;
      if (filters.major) params.major = filters.major;
      if (filters.skill) params.skill = filters.skill;
      if (filters.status) params.status = filters.status;
      const res = await teamApi.list(params);
      setTeams(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'search') loadSearch();
  }, [tab, filters.page]);

  const applySearch = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadSearch();
  };

  const submitJoin = async () => {
    setJoining(true);
    try {
      await teamApi.requestJoin(joinTarget._id, { message: joinMessage });
      toast.success('Đã gửi yêu cầu tham gia nhóm');
      setRequestedIds((prev) => new Set(prev).add(joinTarget._id));
      setJoinTarget(null);
      setJoinMessage('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-sm font-bold">
              👥
            </span>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Tìm kiếm & Ghép đội nhóm</h1>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-1">
            Sử dụng AI để phân tích kỹ năng và tìm nhóm đồ án phù hợp nhất, hoặc chủ động tìm kiếm theo chuyên ngành.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openCreate()} className="shadow-md shadow-violet-500/20">
            <Icon name="plus" className="h-4 w-4" /> Tạo nhóm mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 dark:border-neutral-800 pb-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition',
              tab === item.key
                ? 'bg-stone-900 text-white dark:bg-neutral-800 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            )}
          >
            <Icon name={item.icon} className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <form onSubmit={applySearch} className="mb-6 grid gap-3 rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 p-4 sm:grid-cols-2 lg:grid-cols-5 shadow-sm">
          <Input
            className="lg:col-span-2"
            placeholder="Tìm theo tên, chủ đề..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Input placeholder="Ngành học" value={filters.major} onChange={(e) => setFilters({ ...filters, major: e.target.value })} />
          <Input placeholder="Kỹ năng" value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} />
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Mọi trạng thái</option>
            <option value="recruiting">Đang tuyển</option>
            <option value="full">Đã đủ</option>
            <option value="closed">Đã đóng</option>
          </Select>
          <Button type="submit" className="sm:col-span-2 lg:col-span-5">Tìm kiếm</Button>
        </form>
      )}

      {/* Keep the chat mounted so its draft and in-flight replies survive tab switches */}
      <div className={cn(tab !== 'recommended' && 'hidden')}>
        <AiTeamChat requestedIds={requestedIds} onJoin={setJoinTarget} onCreate={openCreate} />
      </div>

      {tab === 'recommended' ? null : loading ? (
        <LoadingState />
      ) : teams.length === 0 ? (
        <EmptyState title="Không tìm thấy nhóm nào" description="Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team._id} team={team} joinable={team.status === 'recruiting'} onJoin={setJoinTarget} />
            ))}
          </div>
          <Pagination pagination={pagination} onChange={(page) => setFilters({ ...filters, page })} />
        </>
      )}

      <CreateTeamModal
        key={createKey}
        open={createOpen}
        defaults={createDefaults}
        onClose={() => setCreateOpen(false)}
        onCreated={() => tab === 'search' && loadSearch()}
      />

      <Modal
        open={Boolean(joinTarget)}
        onClose={() => setJoinTarget(null)}
        title={`Gửi yêu cầu tham gia: ${joinTarget?.name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setJoinTarget(null)}>Hủy</Button>
            <Button onClick={submitJoin} loading={joining}>Gửi yêu cầu</Button>
          </>
        }
      >
        <Textarea
          label="Lời nhắn tới trưởng nhóm"
          placeholder="Giới thiệu ngắn về bản thân và lý do bạn muốn tham gia..."
          value={joinMessage}
          onChange={(e) => setJoinMessage(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default DiscoverTeamsPage;
