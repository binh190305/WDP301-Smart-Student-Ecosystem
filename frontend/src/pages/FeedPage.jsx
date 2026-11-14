import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Card,
  CardBody,
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  TagInput,
  Modal,
  LoadingState,
  EmptyState,
  ConfirmDialog,
} from '../components/common';
import Avatar from '../components/common/Avatar';
import Icon from '../components/common/Icon';
import CommentSection from '../components/CommentSection';
import PageHeader from '../components/layout/PageHeader';
import { POST_TYPE_LABELS } from '../utils/constants';
import { formatDateTime, formatRelative } from '../utils/format';
import { cn } from '../utils/cn';

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'clap', emoji: '👏' },
];

const FeedPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canPost = ['lecturer', 'admin', 'club_leader'].includes(user?.role);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'event', title: '', content: '', eventDate: '', endDate: '', location: '', capacity: '', registrationDeadline: '', onlineUrl: '', tagsNeeded: [] });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await postApi.list(filter ? { type: filter, limit: 30 } : { limit: 30 });
      setPosts(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const react = async (post, type) => {
    try {
      const res = await postApi.react(post._id, { type });
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, reactionCount: res.data.reactionCount, myReaction: res.data.myReaction } : p))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.type !== 'event') {
        delete payload.eventDate;
        delete payload.endDate;
        delete payload.location;
        delete payload.capacity;
        delete payload.registrationDeadline;
        delete payload.onlineUrl;
        payload.tagsNeeded = [];
      } else {
        ['endDate', 'location', 'capacity', 'registrationDeadline', 'onlineUrl'].forEach((key) => {
          if (payload[key] === '' || payload[key] == null) delete payload[key];
        });
        if (payload.capacity) payload.capacity = Number(payload.capacity);
      }
      if (editing) {
        const response = await postApi.update(editing._id, payload);
        const updated = response.data?.post || response.data;
        setPosts((current) => current.map((post) => (post._id === editing._id ? { ...post, ...updated } : post)));
        setDetail((current) => (current?._id === editing._id ? { ...current, ...updated } : current));
        toast.success('Đã cập nhật bài đăng');
      } else {
        await postApi.create(payload);
        toast.success('Đã đăng bài');
      }
      setCreateOpen(false);
      setEditing(null);
      setForm({ type: 'event', title: '', content: '', eventDate: '', endDate: '', location: '', capacity: '', registrationDeadline: '', onlineUrl: '', tagsNeeded: [] });
      if (!editing) load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({ type: post.type, title: post.title || '', content: post.content || '', eventDate: post.eventDate ? new Date(post.eventDate).toISOString().slice(0, 16) : '', endDate: post.endDate ? new Date(post.endDate).toISOString().slice(0, 16) : '', location: post.location || '', capacity: post.capacity ?? '', registrationDeadline: post.registrationDeadline ? new Date(post.registrationDeadline).toISOString().slice(0, 16) : '', onlineUrl: post.onlineUrl || '', tagsNeeded: post.tagsNeeded || [] });
    setCreateOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await postApi.remove(toDelete._id);
      toast.success('Đã xóa bài đăng');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const findTeammates = (post) =>
    navigate('/app/teams/discover', { state: { fromEvent: post._id, eventTitle: post.title, tags: post.tagsNeeded } });

  return (
    <div>
      <PageHeader
        title="Bảng tin & Sự kiện"
        description="Cập nhật thông tin học vụ, sự kiện và hoạt động cộng đồng sinh viên."
        action={
          canPost && (
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="h-4 w-4" /> Đăng bài
            </Button>
          )
        }
      />

      <div className="mb-5 inline-flex rounded-xl border border-stone-200/80 dark:border-neutral-700 bg-stone-100 dark:bg-neutral-800/90 p-1 shadow-xs">
        {[
          { key: '', label: 'Tất cả' },
          { key: 'event', label: 'Sự kiện' },
          { key: 'academic_update', label: 'Học vụ' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition',
              filter === item.key
                ? 'bg-violet-600 dark:bg-violet-600 text-white shadow-sm'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-neutral-700'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <EmptyState title="Chưa có bài đăng nào" />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {posts.map((post) => {
            const canManage = post.author?._id === user?.id || user?.role === 'admin';
            return (
              <Card key={post._id} className="hover:border-stone-300 dark:hover:border-neutral-600 transition">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={post.author?.name} src={post.author?.avatarUrl} />
                      <div>
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{post.author?.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{formatRelative(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={post.type === 'event' ? 'accent' : 'brand'}>{POST_TYPE_LABELS[post.type]}</Badge>
                      {post.status === 'hidden' && <Badge tone="danger">Đã ẩn</Badge>}
                      {canManage && (
                        <>
                          <button type="button" onClick={() => openEdit(post)} className="rounded-lg p-1 text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 transition hover:bg-stone-100 dark:hover:bg-neutral-800" aria-label="Chỉnh sửa bài đăng"><Icon name="edit" className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setToDelete(post)} className="rounded-lg p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-950/40" aria-label="Xóa bài đăng"><Icon name="trash" className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <button type="button" onClick={() => setDetail(post)} className="mt-3 block w-full text-left">
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 transition hover:text-violet-600 dark:hover:text-violet-400 leading-snug">{post.title}</h3>
                    <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{post.content}</p>
                    <span className="mt-2 inline-block text-xs font-bold text-violet-600 dark:text-violet-400">Xem chi tiết →</span>
                  </button>

                  {post.eventDate && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Icon name="bell" className="h-4 w-4" /> {formatDateTime(post.eventDate)}
                    </p>
                  )}

                  {post.tagsNeeded?.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Cần tuyển:</span>
                      {post.tagsNeeded.map((tag) => (
                        <Badge key={tag} tone="accent">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 dark:border-neutral-800 pt-3">
                    <div className="flex gap-1.5">
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          type="button"
                          onClick={() => react(post, r.type)}
                          className={cn(
                            'rounded-xl px-2.5 py-1 text-sm transition text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800',
                            post.myReaction === r.type && 'bg-violet-100 dark:bg-violet-950/80 font-bold'
                          )}
                        >
                          {r.emoji}
                        </button>
                      ))}
                      <span className="ml-1 self-center text-xs text-stone-500 dark:text-stone-400">{post.reactionCount} lượt cảm xúc</span>
                      <button
                        type="button"
                        onClick={() => setDetail(post)}
                        className="ml-2 flex items-center gap-1 self-center text-xs text-stone-500 dark:text-stone-400 transition hover:text-violet-600 dark:hover:text-violet-400"
                      >
                        <Icon name="requests" className="h-4 w-4" /> {post.commentCount || 0}
                      </button>
                    </div>

                    {post.type === 'event' && user?.role === 'student' && (
                      <Button size="sm" variant="accent" onClick={() => findTeammates(post)}>
                        <Icon name="sparkles" className="h-4 w-4" /> Tìm đồng đội
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
         title={editing ? 'Chỉnh sửa bài đăng' : 'Đăng bài mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={submit} loading={saving}>{editing ? 'Lưu thay đổi' : 'Đăng'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Loại bài đăng" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="event">Sự kiện</option>
            <option value="academic_update">Thông tin học vụ</option>
          </Select>
          <Input label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Nội dung" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} />
          {form.type === 'event' && (
            <>
              <Input
                label="Thời gian diễn ra"
                type="datetime-local"
                required={!editing}
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Thời gian kết thúc" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                <Input label="Hạn đăng ký" type="datetime-local" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
                <Input label="Địa điểm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                <Input label="Số lượng tối đa" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                <Input label="Liên kết trực tuyến" type="url" value={form.onlineUrl} onChange={(e) => setForm({ ...form, onlineUrl: e.target.value })} />
              </div>
              <TagInput
                label="Vị trí cần tuyển"
                value={form.tagsNeeded}
                onChange={(tagsNeeded) => setForm({ ...form, tagsNeeded })}
                hint="Ví dụ: Backend, UI/UX, Marketing"
              />
            </>
          )}
        </div>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title || ''} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.author?.name} src={detail.author?.avatarUrl} />
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{detail.author?.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{formatDateTime(detail.createdAt)}</p>
              </div>
              <Badge tone={detail.type === 'event' ? 'accent' : 'brand'} className="ml-auto">
                {POST_TYPE_LABELS[detail.type]}
              </Badge>
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700 dark:text-stone-200">{detail.content}</p>

            {detail.eventDate && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Icon name="bell" className="h-4 w-4" /> {formatDateTime(detail.eventDate)}
              </p>
            )}

            {detail.tagsNeeded?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Cần tuyển:</span>
                {detail.tagsNeeded.map((tag) => (
                  <Badge key={tag} tone="accent">{tag}</Badge>
                ))}
              </div>
            )}

            {detail.type === 'event' && user?.role === 'student' && (
              <div className="border-t border-stone-100 dark:border-neutral-800 pt-3">
                <Button size="sm" variant="accent" onClick={() => findTeammates(detail)}>
                  <Icon name="sparkles" className="h-4 w-4" /> Tìm đồng đội
                </Button>
              </div>
            )}

            <CommentSection postId={detail._id} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Xóa bài đăng"
        message="Bạn có chắc muốn xóa bài đăng này?"
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default FeedPage;
