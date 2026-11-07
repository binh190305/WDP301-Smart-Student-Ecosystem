import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import Icon from '../../components/common/Icon';
import { cn } from '../../utils/cn';

const ROLE_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  mobile: 'Mobile',
  ai_data: 'AI/Dữ liệu',
  ui_ux: 'UI/UX',
  devops_security: 'DevOps/Bảo mật',
  ba_pm: 'Phân tích nghiệp vụ/Quản lý dự án',
  marketing: 'Marketing/Truyền thông',
};
const GOAL_LABELS = { excellent: 'Điểm cao', good: 'Khá', pass: 'Qua môn' };

const SUGGESTIONS = [
  'Nhóm làm app về y tế, cần người làm frontend',
  'Nhóm ngành Trí tuệ nhân tạo, mục tiêu điểm cao',
  'Nhóm thiết kế, branding cần người làm website',
  'Nhóm còn ít người, làm web thương mại điện tử',
];

const OPEN_KEY = 'aiTeamChatOpen';
const HISTORY_KEY = 'aiTeamChatHistory';

let nextId = 0;
const newId = () => (nextId += 1);

const historyKey = (user) => `${HISTORY_KEY}:${user?._id || user?.id || 'guest'}`;

const loadHistory = (user) => {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey(user)));
    if (!Array.isArray(saved) || !saved.length) return null;
    nextId = Math.max(nextId, ...saved.map((m) => m.id || 0));
    return saved;
  } catch {
    return null;
  }
};

const CriteriaChips = ({ criteria }) => {
  if (!criteria) return null;
  const chips = [
    ...criteria.majors.map((m) => `Ngành: ${m}`),
    ...criteria.skills.map((s) => `Kỹ năng: ${s}`),
    ...criteria.roles.map((r) => `Vai trò: ${ROLE_LABELS[r] || r}`),
    ...(criteria.goal ? [`Mục tiêu: ${GOAL_LABELS[criteria.goal]}`] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-slate-500">AI hiểu yêu cầu:</span>
      {chips.map((chip) => (
        <span key={chip} className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
          {chip}
        </span>
      ))}
    </div>
  );
};

const ResultCard = ({ item, requested, onJoin, source }) => {
  const { team } = item;
  const pending = item.pending_request || requested;
  const logClick = () => recommendationApi.click({ teamId: team._id, source }).catch(() => {});
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/app/teams/${team._id}`} onClick={logClick} className="font-semibold text-slate-900 hover:text-brand-600">
            {team.name}
          </Link>
          <p className="text-sm text-slate-500">
            {[team.topic, team.major].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
          {Math.round(item.score * 100)}% phù hợp
        </span>
      </div>

      <p className="mt-3 flex gap-2 rounded-lg bg-brand-50/60 px-3 py-2 text-sm text-slate-700">
        <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <span>{item.explanation}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            {team.memberCount}/{team.capacity} thành viên
          </span>
          {item.fairness_slot && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">Nhóm đang cần người</span>
          )}
          {team.missingSkills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
              Thiếu: {skill}
            </span>
          ))}
        </div>
        {pending ? (
          <span className="text-xs font-semibold text-slate-500">Đã gửi yêu cầu</span>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              logClick();
              onJoin(team);
            }}
          >
            Xin tham gia
          </Button>
        )}
      </div>
    </div>
  );
};

const AssistantMessage = ({ message, requestedIds, onJoin, onCreate }) => (
  <div className="flex gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
      <Icon name="sparkles" className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      {message.loading ? (
        <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Đang tìm nhóm phù hợp...
        </div>
      ) : (
        <>
          <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message.text}
            {message.needsOnboarding && (
              <div className="mt-2">
                <Link to="/app/profile" className="font-semibold text-brand-600 hover:underline">
                  Cập nhật kỹ năng trong hồ sơ →
                </Link>
              </div>
            )}
          </div>
          <CriteriaChips criteria={message.criteria} />
          {message.recommendations?.length > 0 && (
            <div className="mt-3 space-y-3">
              {message.recommendations.map((item) => (
                <ResultCard
                  key={item.team._id}
                  item={item}
                  source={message.source}
                  requested={requestedIds.has(item.team._id)}
                  onJoin={onJoin}
                />
              ))}
            </div>
          )}
          {message.suggestCreate && (
            <Button className="mt-3" variant="secondary" size="sm" onClick={onCreate}>
              <Icon name="plus" className="h-4 w-4" /> Tạo nhóm mới
            </Button>
          )}
        </>
      )}
    </div>
  </div>
);

const UserMessage = ({ text }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
      {text}
    </div>
  </div>
);

const AiTeamChat = ({ requestedIds, onJoin, onCreate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) !== '0');
  const bottomRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A reply that arrives after the user left the page is appended to the saved history instead
  const settleReply = (pendingId, reply) => {
    if (mountedRef.current) {
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? reply : m)));
      return;
    }
    const saved = loadHistory(user) || [];
    localStorage.setItem(historyKey(user), JSON.stringify([...saved, reply]));
  };

  const greet = async () => {
    const id = newId();
    setMessages([{ id, role: 'assistant', loading: true }]);
    const intro = `Chào ${user?.name?.split(' ').pop() || 'bạn'}! Hãy mô tả nhóm bạn muốn tìm: đề tài dự án, ngành học, kỹ năng hoặc vai trò bạn muốn đảm nhận.`;
    try {
      const res = await recommendationApi.groups('me', { limit: 5 });
      const data = res.data;
      setMessages([
        data.needs_onboarding
          ? { id, role: 'assistant', text: `${intro} Hồ sơ của bạn chưa có kỹ năng nên mình chưa gợi ý sẵn được, nhưng bạn vẫn có thể mô tả yêu cầu ngay.`, needsOnboarding: true }
          : {
              id,
              role: 'assistant',
              source: 'profile',
              text: data.recommendations.length
                ? `${intro} Trước mắt, đây là các nhóm hợp với hồ sơ của bạn:`
                : intro,
              recommendations: data.recommendations,
              suggestCreate: data.suggest_create_team,
            },
      ]);
    } catch (err) {
      setMessages([{ id, role: 'assistant', text: intro }]);
    }
  };

  useEffect(() => {
    const saved = loadHistory(user);
    if (saved) setMessages(saved);
    else greet();
  }, []);

  useEffect(() => {
    const finished = messages.filter((m) => !m.loading);
    if (finished.length) localStorage.setItem(historyKey(user), JSON.stringify(finished));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || sending) return;
    const history = messages.filter((m) => m.role === 'user').map((m) => m.text);
    const pendingId = newId();
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text: message }, { id: pendingId, role: 'assistant', loading: true }]);
    setInput('');
    setSending(true);
    try {
      const res = await recommendationApi.chat({ message, history, limit: 5 });
      const data = res.data;
      settleReply(pendingId, {
        id: pendingId,
        role: 'assistant',
        source: 'chat',
        text: data.reply,
        criteria: data.criteria,
        recommendations: data.recommendations,
        suggestCreate: data.suggest_create_team,
        needsOnboarding: data.needs_onboarding,
      });
    } catch (err) {
      settleReply(pendingId, { id: pendingId, role: 'assistant', text: err.message || 'Có lỗi xảy ra, bạn thử lại nhé.' });
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  };

  const hasAsked = messages.some((m) => m.role === 'user');

  const toggleOpen = () =>
    setOpen((prev) => {
      localStorage.setItem(OPEN_KEY, prev ? '0' : '1');
      return !prev;
    });

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-card',
        open && 'h-[calc(100vh-260px)] min-h-[520px]'
      )}
    >
      <div className={cn('flex items-center justify-between gap-3 bg-white px-5 py-3', open && 'border-b border-slate-200')}>
        <button type="button" onClick={toggleOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon name="sparkles" className="h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Trợ lý tìm nhóm AI</p>
            <p className="truncate text-xs text-slate-500">
              {open ? 'Gợi ý dựa trên yêu cầu của bạn và kỹ năng nhóm đang thiếu' : 'Nhấn để mở chat và mô tả nhóm bạn muốn tìm'}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {open && hasAsked && (
            <Button variant="ghost" size="sm" onClick={greet} disabled={sending}>
              Bắt đầu lại
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggleOpen} aria-expanded={open}>
            {open ? 'Thu gọn' : 'Mở chat'}
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      </div>

      {open && (
      <>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} text={message.text} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              requestedIds={requestedIds}
              onJoin={onJoin}
              onCreate={onCreate}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        {!hasAsked && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={sending}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <textarea
            rows={1}
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="VD: Mình muốn tìm nhóm ngành Kỹ thuật phần mềm làm app y tế, cần người làm frontend..."
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <Button type="submit" loading={sending} disabled={!input.trim()} className={cn('h-[42px]')}>
            Gửi
          </Button>
        </form>
      </div>
      </>
      )}
    </div>
  );
};

export default AiTeamChat;
