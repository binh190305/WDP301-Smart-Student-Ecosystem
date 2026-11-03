// Sinh câu giải thích cho từng gợi ý + câu trả lời chat.
// Luôn có bản template; LLM chỉ dùng khi hợp lệ, lỗi/timeout thì giữ template.
const crypto = require('crypto');
const config = require('../config');
const { completeJson, isLlmEnabled } = require('./client');
const { roleLabel } = require('../skill-catalog');
const RecommendationExplanation = require('../../models/recommendation-explanation.model');

const GOAL_LABEL = { excellent: 'điểm cao', good: 'điểm khá', pass: 'qua môn' };
const list = (items) => items.slice(0, 3).join(', ');

// Các lý do có thật, sắp theo mức quan trọng. item: kết quả từ ranking (+ query_match).
const collectFacts = (item, perspective) => {
  const d = item.details || {};
  const b = item.score_breakdown || {};
  const q = item.query_details || {};
  const facts = [];
  if (q.matchedMajors?.length) facts.push({ key: 'major', majors: q.matchedMajors });
  if (q.matchedSkills?.length) facts.push({ key: 'query_skills', skills: q.matchedSkills });
  if (q.matchedRoles?.length) facts.push({ key: 'query_roles', roles: q.matchedRoles });
  if (d.filledSkills?.length) facts.push({ key: 'fill_skills', skills: d.filledSkills });
  if (d.filledRoles?.length) facts.push({ key: 'fill_roles', roles: d.filledRoles });
  if ((q.semantic ?? 0) >= 0.6 || (b.semantic_sim ?? 0) >= 0.6) facts.push({ key: 'topic' });
  if (b.goal_match === 1) facts.push({ key: 'goal', goal: d.teamGoal });
  if (d.improves) facts.push({ key: 'balance' });
  if (item.fairness_slot) facts.push({ key: 'fairness' });
  if (d.redundantSkills?.length) facts.push({ key: 'redundant', skills: d.redundantSkills });
  return facts.map((f) => ({ ...f, perspective }));
};

const FACT_TEXT = {
  student: {
    major: (f) => `Nhóm thuộc ngành ${list(f.majors)} đúng như bạn tìm.`,
    query_skills: (f) => `Dự án dùng ${list(f.skills)} như bạn mong muốn.`,
    query_roles: (f) => `Nhóm đang cần vai trò ${list(f.roles.map(roleLabel))}.`,
    fill_skills: (f) => `Nhóm đang thiếu ${list(f.skills)}, đúng thế mạnh của bạn.`,
    fill_roles: (f) => `Nhóm còn trống vai trò ${list(f.roles.map(roleLabel))} mà bạn muốn đảm nhận.`,
    topic: () => 'Đề tài gần với sở thích và định hướng của bạn.',
    goal: (f) => `Nhóm có cùng mục tiêu ${GOAL_LABEL[f.goal] || ''} với bạn.`,
    balance: () => 'Bạn giúp trình độ chung của nhóm cân bằng hơn.',
    fairness: () => 'Nhóm còn ít thành viên và đang rất cần thêm người.',
    redundant: (f) => `Lưu ý: nhóm đã khá mạnh về ${list(f.skills)}.`,
  },
  team: {
    major: (f) => `Sinh viên thuộc ngành ${list(f.majors)}.`,
    query_skills: (f) => `Có kỹ năng ${list(f.skills)}.`,
    query_roles: (f) => `Phù hợp vai trò ${list(f.roles.map(roleLabel))}.`,
    fill_skills: (f) => `Có ${list(f.skills)}, đúng phần nhóm đang thiếu.`,
    fill_roles: (f) => `Muốn đảm nhận vai trò ${list(f.roles.map(roleLabel))} mà nhóm còn trống.`,
    topic: () => 'Sở thích và giới thiệu bản thân gần với đề tài của nhóm.',
    goal: (f) => `Có cùng mục tiêu ${GOAL_LABEL[f.goal] || ''} với nhóm.`,
    balance: () => 'Giúp trình độ chung của nhóm cân bằng hơn.',
    fairness: () => '',
    redundant: (f) => `Lưu ý: nhóm đã có người mạnh về ${list(f.skills)}.`,
  },
};

const templateExplanation = (item, perspective) => {
  const sentences = collectFacts(item, perspective)
    .map((f) => FACT_TEXT[perspective][f.key](f))
    .filter(Boolean)
    .slice(0, 2);
  if (sentences.length) return sentences.join(' ');
  return perspective === 'student'
    ? 'Nhóm đang tuyển và có đề tài tương đối phù hợp với hồ sơ của bạn.'
    : 'Hồ sơ tương đối phù hợp với đề tài của nhóm.';
};

// Câu giải thích hợp lệ: không rỗng, tối đa 2 câu, không có con số điểm.
const isValidExplanation = (text) => {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (!t || t.length > 320) return false;
  if (/%|\d+([.,]\d+)?\s*(điểm|\/)/i.test(t) || /\b0[.,]\d+/.test(t)) return false;
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length <= 2;
};

const hashOf = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    explanations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, text: { type: 'string' } },
        required: ['id', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['reply', 'explanations'],
  additionalProperties: false,
};

const SYSTEM = `Bạn viết giải thích ngắn gọn bằng tiếng Việt cho hệ thống gợi ý nhóm đồ án của sinh viên.
Quy tắc cho mỗi giải thích:
- Tối đa 2 câu, giọng thân thiện, xưng "bạn" với người đọc.
- Chỉ dùng các lý do được cung cấp, không bịa thêm thông tin.
- Không nêu bất kỳ con số điểm, phần trăm hay trọng số nào.
- Nếu có lý do "redundant" thì có thể nhắc nhẹ như một lưu ý.
"reply": 1-2 câu mở đầu cho câu trả lời chat, nói đã tìm được gì theo yêu cầu (không liệt kê lại từng nhóm, không nêu con số điểm).`;

const templateReply = ({ count, criteria, needsOnboarding }) => {
  const parts = [];
  if (criteria?.majors?.length) parts.push(`ngành ${criteria.majors.join(', ')}`);
  if (criteria?.skills?.length) parts.push(`kỹ năng ${criteria.skills.join(', ')}`);
  if (criteria?.roles?.length) parts.push(`vai trò ${criteria.roles.map(roleLabel).join(', ')}`);
  if (criteria?.goal) parts.push(`mục tiêu ${GOAL_LABEL[criteria.goal]}`);
  let about = parts.length ? ` theo yêu cầu ${parts.join('; ')}` : '';
  if (!about && criteria?.topic) about = ` khớp với "${criteria.topic.split('\n').pop().slice(0, 80)}"`;
  if (!count) {
    return `Mình chưa tìm thấy nhóm nào đang tuyển${about}. Bạn thử mô tả khác đi, bớt yêu cầu, hoặc tạo nhóm mới cho đề tài này nhé.`;
  }
  const tail = needsOnboarding ? ' Hãy cập nhật kỹ năng trong hồ sơ để gợi ý chính xác hơn.' : '';
  return `Mình tìm được ${count} nhóm phù hợp${about}.${tail}`;
};

/**
 * items: [{ id, studentId, teamId, ...kết quả ranking }]
 * opts: { perspective: 'student'|'team', criteria, needsOnboarding, wantReply }
 * -> { reply, explanations: Map(id -> { text, source }) }
 */
const explain = async (items, { perspective = 'student', criteria = null, needsOnboarding = false, wantReply = false } = {}) => {
  const explanations = new Map(
    items.map((it) => [it.id, { text: templateExplanation(it, perspective), source: 'template' }])
  );
  let reply = wantReply ? templateReply({ count: items.length, criteria, needsOnboarding }) : null;
  if (!isLlmEnabled() || (!items.length && !wantReply)) return { reply, explanations };

  const facts = new Map(items.map((it) => [it.id, collectFacts(it, perspective)]));
  const hashes = new Map(items.map((it) => [it.id, hashOf({ facts: facts.get(it.id), criteria })]));

  // Lấy từ cache những cặp dữ liệu không đổi
  const cached = await RecommendationExplanation.find({
    perspective,
    $or: items.map((it) => ({ student: it.studentId, team: it.teamId, dataHash: hashes.get(it.id) })),
  }).lean();
  const cachedByKey = new Map(cached.map((c) => [`${c.student}:${c.team}:${c.dataHash}`, c.text]));
  const missing = [];
  for (const it of items) {
    const text = cachedByKey.get(`${it.studentId}:${it.teamId}:${hashes.get(it.id)}`);
    if (text) explanations.set(it.id, { text, source: 'llm' });
    else missing.push(it);
  }
  if (!missing.length && !wantReply) return { reply, explanations };

  try {
    const payload = {
      perspective: perspective === 'student' ? 'giải thích cho sinh viên vì sao nhóm phù hợp' : 'giải thích cho trưởng nhóm vì sao sinh viên phù hợp',
      request: criteria ? { summary: criteria.summary, topic: criteria.topic } : null,
      onboarding_hint: needsOnboarding,
      items: missing.map((it) => ({ id: it.id, name: it.name, reasons: facts.get(it.id) })),
    };
    const raw = await completeJson({ system: SYSTEM, user: JSON.stringify(payload), schema: SCHEMA });
    if (wantReply && isValidExplanation(raw.reply)) reply = raw.reply.trim();

    const expiresAt = new Date(Date.now() + config.llm.explanationCacheDays * 24 * 60 * 60 * 1000);
    const writes = [];
    for (const { id, text } of raw.explanations || []) {
      const item = missing.find((it) => it.id === id);
      if (!item || !isValidExplanation(text)) continue;
      explanations.set(id, { text: text.trim(), source: 'llm' });
      writes.push({
        updateOne: {
          filter: { student: item.studentId, team: item.teamId, perspective, dataHash: hashes.get(id) },
          update: { $set: { text: text.trim(), expiresAt } },
          upsert: true,
        },
      });
    }
    if (writes.length) await RecommendationExplanation.bulkWrite(writes);
  } catch (err) {
    console.warn(`[recommendation] LLM giải thích lỗi, dùng template: ${err.message}`);
  }
  return { reply, explanations };
};

module.exports = { explain, templateExplanation, templateReply, isValidExplanation, collectFacts };
