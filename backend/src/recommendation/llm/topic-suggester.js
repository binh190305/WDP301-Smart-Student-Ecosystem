// Gợi ý đề tài để sinh viên tự tạo nhóm, dựa trên hồ sơ + yêu cầu chat.
// LLM sinh đề tài mới; lỗi/chưa cấu hình thì chọn từ bộ đề tài mẫu theo mức khớp hồ sơ.
const crypto = require('crypto');
const { completeJson, isLlmEnabled } = require('./client');
const { ROLES, normalizeSkill, normalizeRole, rolesForSkill } = require('../skill-catalog');
const { fold, containsTerm } = require('./query-parser');

const DEFAULT_COUNT = 4;
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map();

const TOPIC_TEMPLATES = require('../topic-templates');

const studentRoles = (user) => {
  const declared = (user.preferredRoles || []).map(normalizeRole).filter(Boolean);
  if (declared.length) return new Set(declared);
  return new Set((user.skills || []).flatMap(rolesForSkill));
};

const scoreTemplate = (tpl, { user, criteria, roles, skills }) => {
  const wanted = fold([criteria?.topic, ...(user.interests || []), user.description].filter(Boolean).join(' '));
  let score = 0;
  // Khớp nguyên từ: tránh "ai" khớp nhầm trong "đề tài"
  score += tpl.keywords.filter((k) => containsTerm(wanted, k)).length * 3;
  if (criteria?.majors?.includes(tpl.major)) score += 3;
  else if (user.major && fold(user.major) === fold(tpl.major)) score += 2;
  score += tpl.rolesNeeded.filter((r) => criteria?.roles?.includes(r)).length * 2;
  score += tpl.rolesNeeded.filter((r) => roles.has(r)).length;
  score += tpl.skillsNeeded.filter((s) => skills.has(normalizeSkill(s))).length;
  score += tpl.skillsNeeded.filter((s) => criteria?.skills?.includes(normalizeSkill(s))).length * 2;
  return score;
};

// Ưu tiên đề tài mà sinh viên đóng góp được nhưng vẫn còn kỹ năng cần tuyển thêm.
const suggestFromTemplates = ({ user, criteria, existingTopics = [], count = DEFAULT_COUNT }) => {
  const skills = new Set((user.skills || []).map(normalizeSkill));
  const taken = new Set(existingTopics.map(fold));
  const ctx = { user, criteria, roles: studentRoles(user), skills };
  return TOPIC_TEMPLATES.filter((t) => !taken.has(fold(t.title)))
    .map((t, index) => ({ t, index, score: scoreTemplate(t, ctx) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ t }) => ({
      title: t.title,
      topic: t.topic,
      major: t.major,
      description: t.description,
      skillsNeeded: t.skillsNeeded,
      rolesNeeded: t.rolesNeeded,
      reason: '',
      source: 'template',
    }));
};

const SCHEMA = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Tên đề tài/dự án, ngắn gọn' },
          topic: { type: 'string', description: 'Lĩnh vực, 1-4 từ (VD: Y tế số, Fintech)' },
          major: { type: 'string' },
          description: { type: 'string', description: '1-2 câu mô tả chức năng chính' },
          skillsNeeded: { type: 'array', items: { type: 'string' } },
          rolesNeeded: { type: 'array', items: { type: 'string', enum: Object.keys(ROLES) } },
          reason: { type: 'string', description: '1 câu vì sao đề tài hợp với sinh viên' },
        },
        required: ['title', 'topic', 'major', 'description', 'skillsNeeded', 'rolesNeeded', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['topics'],
  additionalProperties: false,
};

const buildSystemPrompt = (vocab, count) => `Bạn gợi ý đề tài đồ án nhóm cho sinh viên đại học Việt Nam để họ tự lập nhóm mới.
- Gợi ý đúng ${count} đề tài khác nhau, khả thi trong 1 học kỳ với nhóm 3-6 người, viết bằng tiếng Việt.
- Bám sát yêu cầu trong chat (nếu có), sau đó tới ngành, kỹ năng, sở thích của sinh viên.
- Sinh viên phải đóng góp được bằng kỹ năng hiện có; skillsNeeded gồm 3-6 kỹ năng nhóm cần (cả kỹ năng cần tuyển thêm).
- Không trùng với các đề tài nhóm đang tuyển (recruiting_team_topics).
- TUYỆT ĐỐI không lặp lại hay chỉ đổi tên các đề tài đã gợi ý trước đó (already_suggested); hãy nghĩ ý tưởng mới.
- major: ưu tiên chọn từ danh sách ngành: ${vocab.majors.join(', ')}
- skillsNeeded: ưu tiên tên kỹ năng trong danh sách: ${vocab.skills.join(', ')}
- reason: 1 câu, xưng "bạn", không nêu con số điểm.`;

const clean = (s, max) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, max);

const sanitizeTopics = (raw, { count, existingTopics }) => {
  const taken = new Set(existingTopics.map(fold));
  const seen = new Set();
  const out = [];
  for (const t of raw?.topics || []) {
    const title = clean(t.title, 120);
    const key = fold(title);
    if (title.length < 3 || taken.has(key) || seen.has(key)) continue;
    seen.add(key);
    const skills = [...new Set((t.skillsNeeded || []).map((s) => clean(s, 40)).filter(Boolean))].slice(0, 8);
    out.push({
      title,
      topic: clean(t.topic, 200),
      major: clean(t.major, 120),
      description: clean(t.description, 600),
      skillsNeeded: skills,
      rolesNeeded: [...new Set((t.rolesNeeded || []).map(normalizeRole).filter(Boolean))],
      reason: clean(t.reason, 300),
      source: 'llm',
    });
    if (out.length >= count) break;
  }
  return out;
};

const cacheKey = (payload) => crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

const remember = (key, value) => {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

/**
 * user: document sinh viên (lean); criteria: tiêu chí chat (có thể null);
 * existingTopics: tên/chủ đề các nhóm đang tuyển; excludeTopics: tên đề tài đã gợi ý trong cuộc chat;
 * vocab: { skills, majors }.
 * Trả về [{ title, topic, major, description, skillsNeeded, rolesNeeded, reason, source }].
 */
const suggestTopics = async ({ user, criteria = null, existingTopics = [], excludeTopics = [], vocab, count = DEFAULT_COUNT }) => {
  const avoid = [...existingTopics, ...excludeTopics];
  if (!isLlmEnabled()) return suggestFromTemplates({ user, criteria, existingTopics: avoid, count });

  const profile = {
    major: user.major || '',
    skills: user.skills || [],
    preferredRoles: user.preferredRoles || [],
    interests: user.interests || [],
    goal: user.goal || null,
    description: clean(user.description, 300),
  };
  const request = criteria ? { summary: criteria.summary, topic: criteria.topic, skills: criteria.skills, majors: criteria.majors, roles: criteria.roles } : null;
  const key = cacheKey({ profile, request, count, excludeTopics });
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  try {
    const raw = await completeJson({
      system: buildSystemPrompt(vocab, count),
      user: JSON.stringify({
        student: profile,
        chat_request: request,
        recruiting_team_topics: existingTopics.slice(0, 40),
        already_suggested: excludeTopics,
      }),
      schema: SCHEMA,
    });
    const topics = sanitizeTopics(raw, { count, existingTopics: avoid });
    if (topics.length) {
      remember(key, topics);
      return topics;
    }
  } catch (err) {
    console.warn(`[recommendation] LLM gợi ý đề tài lỗi, dùng đề tài mẫu: ${err.message}`);
  }
  return suggestFromTemplates({ user, criteria, existingTopics: avoid, count });
};

module.exports = { suggestTopics, suggestFromTemplates, sanitizeTopics, TOPIC_TEMPLATES };
