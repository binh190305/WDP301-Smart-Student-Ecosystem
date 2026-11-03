const test = require('node:test');
const assert = require('node:assert/strict');

const { parseWithRules, sanitizeCriteria, isRefinement } = require('../../src/recommendation/llm/query-parser');
const { templateExplanation, templateReply, isValidExplanation } = require('../../src/recommendation/llm/explainer');
const { queryMatch, blendScores, relativeSemantic, passesHardFilters } = require('../../src/recommendation/query-match');
const { student, team } = require('./helpers');

const vocab = {
  skills: ['react', 'node.js', 'python', 'figma', 'ui/ux', 'c#', '.net', 'machine learning'],
  majors: ['Kỹ thuật phần mềm', 'Trí tuệ nhân tạo', 'Thiết kế đồ họa'],
};

test('luật: nhận kỹ năng, ngành (không dấu / viết tắt), vai trò, mục tiêu', () => {
  const c = parseWithRules('Mình muốn tìm nhóm nganh ai lam app y te, can React va Node.js, muon lam frontend, diem cao', vocab);
  assert.deepEqual(c.skills.sort(), ['node.js', 'react']);
  assert.deepEqual(c.majors, ['Trí tuệ nhân tạo']);
  assert.ok(c.roles.includes('frontend'));
  assert.equal(c.goal, 'excellent');
});

test('luật: không nhận nhầm từ nằm trong từ khác', () => {
  const c = parseWithRules('Nhóm hai người làm đồ án, ba bạn nữa', vocab);
  assert.deepEqual(c.roles, []);
  assert.deepEqual(c.skills, []);
});

test('câu bổ sung thì gộp lịch sử, câu đề tài mới thì tìm lại từ đầu', () => {
  assert.equal(isRefinement('ưu tiên nhóm muốn đạt điểm cao'), true);
  assert.equal(isRefinement('Thêm React nữa'), true);
  assert.equal(isRefinement('tôi muốn tìm nhóm dự án đặt đồ ăn'), false);
});

test('lọc cứng: đã nêu ngành/kỹ năng thì nhóm phải khớp', () => {
  const t = team({ major: 'Kỹ thuật phần mềm', members: [student({ skills: { Java: 4 } })], needs: { React: 3 } });
  const base = { skills: [], majors: [], roles: ['frontend'], goal: null };
  assert.equal(passesHardFilters(base, t), true);
  assert.equal(passesHardFilters({ ...base, majors: ['Kỹ thuật phần mềm'] }, t), true);
  assert.equal(passesHardFilters({ ...base, majors: ['Trí tuệ nhân tạo'] }, t), false);
  assert.equal(passesHardFilters({ ...base, skills: ['java'] }, t), true); // thành viên đang dùng
  assert.equal(passesHardFilters({ ...base, skills: ['python'] }, t), false);
});

test('chuẩn hoá đầu ra LLM: bỏ kỹ năng/ngành/vai trò ngoài danh mục', () => {
  const c = sanitizeCriteria(
    { skills: ['ReactJS', 'Rust'], majors: ['tri tue nhan tao', 'Y khoa'], roles: ['frontend', 'chef'], goal: 'none', topic: '' },
    vocab,
    'câu gốc'
  );
  assert.deepEqual(c.skills, ['react']);
  assert.deepEqual(c.majors, ['Trí tuệ nhân tạo']);
  assert.deepEqual(c.roles, ['frontend']);
  assert.equal(c.goal, null);
  assert.equal(c.topic, 'câu gốc');
});

test('khớp yêu cầu: ngành, kỹ năng, vai trò; chia lại trọng số khi thiếu vector', () => {
  const t = team({ major: 'Trí tuệ nhân tạo', members: [student({ skills: { Python: 4 } })], needs: { Python: 3, React: 3 } });
  const criteria = { skills: ['react'], majors: ['Trí tuệ nhân tạo'], roles: ['frontend'], goal: null };
  const q = queryMatch(criteria, t);
  assert.equal(q.breakdown.semantic, null);
  assert.equal(q.breakdown.majors, 1);
  assert.equal(q.breakdown.skills, 1);
  assert.equal(q.breakdown.roles, 1);
  assert.equal(q.score, 1);
  const other = queryMatch({ ...criteria, majors: ['Thiết kế đồ họa'] }, t);
  assert.ok(other.score < q.score);
});

test('ngữ nghĩa tương đối: nhóm khớp nhất = 1, kém nhất = 0, thiếu vector thì bỏ qua', () => {
  const vectors = new Map([['a', [1, 0]], ['b', [0.8, 0.6]], ['c', [0, 1]]]);
  const s = relativeSemantic([1, 0], ['a', 'b', 'c', 'x'], vectors);
  assert.equal(s.get('a'), 1);
  assert.equal(s.get('c'), 0);
  assert.ok(s.get('b') > 0 && s.get('b') < 1);
  assert.equal(s.has('x'), false);
  assert.equal(relativeSemantic(null, ['a'], vectors).size, 0);
});

test('trộn điểm: không có yêu cầu thì giữ điểm hồ sơ', () => {
  assert.equal(blendScores(null, 0.42), 0.42);
  assert.equal(blendScores(1, 0), require('../../src/recommendation/config').chat.queryBlend);
});

test('kiểm tra giải thích: tối đa 2 câu, không nêu con số điểm', () => {
  assert.equal(isValidExplanation('Nhóm đang thiếu Figma. Bạn rất hợp.'), true);
  assert.equal(isValidExplanation('Câu một. Câu hai. Câu ba.'), false);
  assert.equal(isValidExplanation('Bạn phù hợp 85% với nhóm.'), false);
  assert.equal(isValidExplanation('Điểm khớp 0.82 rất cao.'), false);
  assert.equal(isValidExplanation(''), false);
});

test('template giải thích dùng lý do thật, tối đa 2 câu', () => {
  const text = templateExplanation(
    {
      details: { filledSkills: ['figma'], filledRoles: ['ui_ux'], redundantSkills: [] },
      score_breakdown: { semantic_sim: 0.9 },
    },
    'student'
  );
  assert.match(text, /figma/);
  assert.match(text, /UI\/UX/);
  assert.equal(isValidExplanation(text), true);
});

test('template trả lời chat khi không có kết quả gợi ý tạo nhóm mới', () => {
  assert.match(templateReply({ count: 0, criteria: { majors: ['Trí tuệ nhân tạo'], skills: [], roles: [] } }), /tạo nhóm mới/);
});
