// Hiểu câu mô tả nhóm muốn tìm -> tiêu chí có cấu trúc.
// LLM chỉ trích xuất; kết quả luôn được chuẩn hoá về bảng kỹ năng/ngành/vai trò có sẵn.
const { completeJson, isLlmEnabled } = require('./client');
const { ROLES, normalizeSkill, normalizeRole } = require('../skill-catalog');

const GOALS = ['excellent', 'good', 'pass'];

const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsTerm = (haystack, term) =>
  new RegExp(`(^|[^a-z0-9#+.])${escapeRegex(term)}($|[^a-z0-9#+])`).test(haystack);

const MAJOR_KEYWORDS = {
  'Kỹ thuật phần mềm': ['ky thuat phan mem', 'ktpm', 'phan mem', 'software'],
  'Trí tuệ nhân tạo': ['tri tue nhan tao', 'nganh ai', 'artificial intelligence'],
  'An toàn thông tin': ['an toan thong tin', 'attt', 'an ninh mang'],
  'Thiết kế đồ họa': ['thiet ke do hoa', 'do hoa', 'graphic design'],
  'Digital Marketing': ['digital marketing', 'nganh marketing'],
  'Quản trị kinh doanh': ['quan tri kinh doanh', 'qtkd', 'kinh doanh'],
};

const ROLE_KEYWORDS = {
  frontend: ['frontend', 'front-end', 'front end', 'giao dien web'],
  backend: ['backend', 'back-end', 'back end', 'server', 'api'],
  mobile: ['mobile', 'di dong', 'android', 'ios'],
  ai_data: ['lam ai', 'mang ai', 'machine learning', 'phan tich du lieu', 'data'],
  ui_ux: ['ui', 'ux', 'ui/ux', 'thiet ke giao dien', 'designer'],
  devops_security: ['devops', 'bao mat', 'security', 'cloud'],
  ba_pm: ['phan tich nghiep vu', 'nghiep vu', 'quan ly du an', 'project manager'],
  marketing: ['marketing', 'truyen thong', 'content'],
};

const GOAL_KEYWORDS = {
  excellent: ['diem cao', 'xuat sac', 'diem a', 'gioi'],
  good: ['diem kha', 'muc kha', 'kha'],
  pass: ['qua mon', 'du qua', 'an toan qua'],
};

// vocab: { skills: [tên chuẩn hoá], majors: [tên ngành] }
const sanitizeCriteria = (raw, vocab, fallbackTopic) => {
  const skillSet = new Set(vocab.skills);
  const majorByFold = new Map(vocab.majors.map((m) => [fold(m), m]));
  const uniq = (arr) => [...new Set(arr)];
  return {
    skills: uniq((raw.skills || []).map(normalizeSkill).filter((s) => skillSet.has(s))),
    majors: uniq((raw.majors || []).map((m) => majorByFold.get(fold(m))).filter(Boolean)),
    roles: uniq((raw.roles || []).map(normalizeRole).filter(Boolean)),
    goal: GOALS.includes(raw.goal) ? raw.goal : null,
    topic: String(raw.topic || '').trim().slice(0, 300) || fallbackTopic,
    summary: String(raw.summary || '').trim().slice(0, 300),
    intent: INTENTS.includes(raw.intent) ? raw.intent : 'find_team',
  };
};

// Ý định của tin nhắn: tìm nhóm có sẵn, xin gợi ý đề tài để tự lập nhóm, hay cả hai.
const INTENTS = ['find_team', 'suggest_topic', 'both'];
const TOPIC_INTENT_PATTERNS = [
  /(goi y|de xuat|nghi giup|tu van|y tuong|nen lam|nen chon|chon giup|cho (minh|toi|em|tui) (xin )?(vai |mot |1 )?)[^.?!]{0,30}(de tai|du an|chu de|y tuong)/,
  /(de tai|du an|chu de|y tuong) (nao|gi)/,
  /(de tai|du an|chu de|y tuong) khac/,
  /(them|nua) (vai |mot so |may |)(de tai|y tuong)/,
  /(de tai|y tuong) (nua|them)/,
  /(tao|lap|thanh lap|mo|tu lap) (mot |1 |cai |)nhom/,
];
const TEAM_INTENT_PATTERNS = [
  /(tim|kiem|tham gia|gia nhap|xin vao|vao|join) (mot |1 |cac |nhung |)nhom/,
  /nhom (nao|dang tuyen|con cho|con trong)/,
];

const detectIntent = (message) => {
  const folded = fold(message);
  const wantsTopic = TOPIC_INTENT_PATTERNS.some((re) => re.test(folded));
  const wantsTeam = TEAM_INTENT_PATTERNS.some((re) => re.test(folded));
  if (wantsTopic && wantsTeam) return 'both';
  return wantsTopic ? 'suggest_topic' : 'find_team';
};

const parseWithRules = (text, vocab) => {
  const folded = ` ${fold(text)} `;
  const pick = (table) => Object.keys(table).filter((key) => table[key].some((kw) => containsTerm(folded, kw)));
  const skills = vocab.skills.filter((s) => containsTerm(folded, fold(s)));
  const majors = [
    ...pick(MAJOR_KEYWORDS),
    ...vocab.majors.filter((m) => containsTerm(folded, fold(m))),
  ];
  const goals = pick(GOAL_KEYWORDS);
  return sanitizeCriteria(
    { skills, majors, roles: pick(ROLE_KEYWORDS), goal: goals[0] || null, topic: text, intent: detectIntent(text) },
    vocab,
    text
  );
};

// Câu bổ sung cho yêu cầu trước ("ưu tiên điểm cao", "thêm React"...) thì gộp với lịch sử;
// câu mô tả đề tài mới thì tìm lại từ đầu để không mang theo tiêu chí cũ.
const REFINEMENT_PREFIXES = [
  'uu tien', 'them', 'chi ', 'loc', 'bo ', 'nhung', 'con ', 'va ', 'voi ', 'ngoai ra',
  'cung', 'neu', 'thay', 'doi', 'it nguoi', 'nhieu nguoi', 'muc tieu', 'nganh', 'can them',
];
const isRefinement = (message) => {
  const folded = fold(message).trim();
  // "có đề tài khác không", "gợi ý thêm đề tài": xin thêm theo yêu cầu trước
  const asksForMore = /(de tai|du an|chu de|y tuong|nhom) khac|(them|nua) (vai |mot so |may |)(de tai|y tuong)|(de tai|y tuong) (nua|them)/;
  return REFINEMENT_PREFIXES.some((p) => folded.startsWith(p)) || asksForMore.test(folded);
};

const SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'Mô tả ngắn đề tài/lĩnh vực dự án người dùng muốn, dùng cho tìm kiếm ngữ nghĩa' },
    skills: { type: 'array', items: { type: 'string' } },
    majors: { type: 'array', items: { type: 'string' } },
    roles: { type: 'array', items: { type: 'string', enum: Object.keys(ROLES) } },
    goal: { type: 'string', enum: [...GOALS, 'none'] },
    summary: { type: 'string', description: 'Một câu tiếng Việt tóm tắt yêu cầu' },
    intent: { type: 'string', enum: INTENTS },
  },
  required: ['topic', 'skills', 'majors', 'roles', 'goal', 'summary', 'intent'],
  additionalProperties: false,
};

const buildSystemPrompt = (vocab) => `Bạn trích xuất tiêu chí tìm nhóm đồ án từ tin nhắn của sinh viên (tiếng Việt).
Chỉ trích những gì sinh viên thực sự nói, không suy đoán thêm.
Nếu tin nhắn mới chỉ bổ sung/điều chỉnh yêu cầu trước (ví dụ "ưu tiên điểm cao", "thêm React") thì gộp với tiêu chí trước.
Nếu tin nhắn mới mô tả một đề tài/yêu cầu khác thì BỎ QUA hoàn toàn các tin nhắn trước.
- skills: chỉ chọn từ danh sách kỹ năng: ${vocab.skills.join(', ')}
- majors: chỉ chọn từ danh sách ngành: ${vocab.majors.join(', ')}
- roles: vai trò sinh viên muốn đảm nhận hoặc nhóm cần: ${Object.entries(ROLES).map(([k, v]) => `${k} (${v})`).join(', ')}
- goal: excellent = điểm cao, good = khá, pass = qua môn, none = không nói
- topic: lĩnh vực/đề tài dự án mong muốn, viết lại ngắn gọn; để trống nếu không nói.
- intent: find_team = muốn tìm/tham gia nhóm có sẵn (mặc định); suggest_topic = xin gợi ý đề tài/ý tưởng hoặc muốn tự tạo nhóm mới;
  both = hỏi cả hai. Tin nhắn chỉ bổ sung tiêu chí thì giữ ý định của yêu cầu trước.`;

/**
 * message: tin nhắn hiện tại; history: các tin nhắn trước của sinh viên (string[]).
 * Trả về { ...criteria, source: 'llm' | 'rules' }.
 */
const parseTeamQuery = async (message, history, vocab) => {
  const context = isRefinement(message) ? [...history, message].join('\n') : message;
  if (isLlmEnabled()) {
    try {
      const prior = history.length ? `Các tin nhắn trước:\n${history.map((h) => `- ${h}`).join('\n')}\n\n` : '';
      const raw = await completeJson({
        system: buildSystemPrompt(vocab),
        user: `${prior}Tin nhắn mới: ${message}`,
        schema: SCHEMA,
      });
      return { ...sanitizeCriteria(raw, vocab, context), source: 'llm' };
    } catch (err) {
      console.warn(`[recommendation] LLM phân tích câu hỏi lỗi, dùng luật: ${err.message}`);
    }
  }
  return { ...parseWithRules(context, vocab), source: 'rules' };
};

module.exports = { parseTeamQuery, parseWithRules, sanitizeCriteria, isRefinement, detectIntent, containsTerm, fold };
