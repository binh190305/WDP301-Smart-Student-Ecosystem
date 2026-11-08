const test = require('node:test');
const assert = require('node:assert/strict');

const { suggestFromTemplates, sanitizeTopics, TOPIC_TEMPLATES } = require('../../src/recommendation/llm/topic-suggester');

test('đề tài mẫu: ưu tiên chủ đề trong yêu cầu chat', () => {
  const [first] = suggestFromTemplates({
    user: { major: 'Kỹ thuật phần mềm', skills: ['React'] },
    criteria: { topic: 'app y tế đặt lịch khám', skills: [], majors: [], roles: [] },
  });
  assert.equal(first.topic, 'Y tế số');
  assert.equal(first.source, 'template');
});

test('đề tài mẫu: khớp ngành và kỹ năng khi không có yêu cầu chat', () => {
  const [first] = suggestFromTemplates({ user: { major: 'An toàn thông tin', skills: ['Linux', 'Web Security'] } });
  assert.equal(first.major, 'An toàn thông tin');
});

test('đề tài mẫu: trả đúng số lượng và bỏ đề tài đã có nhóm', () => {
  const taken = TOPIC_TEMPLATES[0].title;
  const topics = suggestFromTemplates({ user: {}, existingTopics: [taken], count: 3 });
  assert.equal(topics.length, 3);
  assert.ok(topics.every((t) => t.title !== taken));
});

test('sanitizeTopics: bỏ trùng, bỏ đề tài đã có nhóm, lọc vai trò lạ, giới hạn số lượng', () => {
  const raw = {
    topics: [
      { title: 'App A', topic: 'X', major: 'M', description: 'd', skillsNeeded: ['React', 'React'], rolesNeeded: ['frontend', 'hacker'], reason: 'r' },
      { title: 'app a', topic: 'X', major: 'M', description: 'd', skillsNeeded: [], rolesNeeded: [], reason: '' },
      { title: 'Nhóm cũ', topic: 'X', major: 'M', description: 'd', skillsNeeded: [], rolesNeeded: [], reason: '' },
      { title: 'App B', topic: 'Y', major: 'M', description: 'd', skillsNeeded: [], rolesNeeded: [], reason: '' },
      { title: 'App C', topic: 'Z', major: 'M', description: 'd', skillsNeeded: [], rolesNeeded: [], reason: '' },
    ],
  };
  const topics = sanitizeTopics(raw, { count: 2, existingTopics: ['Nhóm cũ'] });
  assert.deepEqual(topics.map((t) => t.title), ['App A', 'App B']);
  assert.deepEqual(topics[0].skillsNeeded, ['React']);
  assert.deepEqual(topics[0].rolesNeeded, ['frontend']);
});

const { detectIntent } = require('../../src/recommendation/llm/query-parser');

test('detectIntent: phân biệt xin đề tài, tìm nhóm và hỏi cả hai', () => {
  assert.equal(detectIntent('tôi cần gợi ý đề tài để tạo 1 nhóm đồ án'), 'suggest_topic');
  assert.equal(detectIntent('Gợi ý đề tài để mình tự lập nhóm'), 'suggest_topic');
  assert.equal(detectIntent('Nên làm đề tài gì về y tế?'), 'suggest_topic');
  assert.equal(detectIntent('Mình muốn tạo nhóm làm app AI'), 'suggest_topic');
  assert.equal(detectIntent('Nhóm làm app về y tế, cần người làm frontend'), 'find_team');
  assert.equal(detectIntent('Tìm nhóm làm đề tài thương mại điện tử'), 'find_team');
  assert.equal(detectIntent('Tìm nhóm hoặc gợi ý đề tài về fintech'), 'both');
});

test('đề tài mẫu: câu xin đề tài chung chung chỉ dựa vào hồ sơ (không khớp nhầm "ai" trong "đề tài")', () => {
  const user = { major: 'Kỹ thuật phần mềm', skills: ['React', 'Node.js'] };
  const generic = suggestFromTemplates({
    user,
    criteria: { topic: 'tôi cần gợi ý đề tài để tạo 1 nhóm đồ án', skills: [], majors: [], roles: [] },
  });
  assert.deepEqual(generic.map((t) => t.title), suggestFromTemplates({ user }).map((t) => t.title));
});

const { isRefinement } = require('../../src/recommendation/llm/query-parser');
const { suggestTopics } = require('../../src/recommendation/llm/topic-suggester');

test('kho đề tài mẫu đủ lớn và không trùng tên', () => {
  assert.ok(TOPIC_TEMPLATES.length >= 40);
  assert.equal(new Set(TOPIC_TEMPLATES.map((t) => t.title)).size, TOPIC_TEMPLATES.length);
});

test('"có đề tài khác không" là xin thêm đề tài và nối tiếp yêu cầu trước', () => {
  for (const msg of ['Có đề tài khác không?', 'gợi ý thêm vài đề tài', 'còn ý tưởng nào nữa không']) {
    assert.equal(detectIntent(msg), 'suggest_topic', msg);
  }
  assert.ok(isRefinement('Có đề tài khác không?'));
  assert.ok(isRefinement('gợi ý thêm vài đề tài'));
});

test('hỏi đề tài khác liên tục: mỗi lần 4 đề tài, không bao giờ lặp lại', async () => {
  const prev = process.env.LLM_ENABLED;
  process.env.LLM_ENABLED = 'false';
  try {
    const user = { major: 'Kỹ thuật phần mềm', skills: ['React', 'Node.js'] };
    const shown = [];
    for (;;) {
      const topics = await suggestTopics({ user, excludeTopics: shown, vocab: { skills: [], majors: [] } });
      if (!topics.length) break;
      assert.ok(topics.length <= 4);
      for (const t of topics) assert.ok(!shown.includes(t.title), `lặp lại: ${t.title}`);
      shown.push(...topics.map((t) => t.title));
    }
    assert.equal(shown.length, TOPIC_TEMPLATES.length);
  } finally {
    if (prev === undefined) delete process.env.LLM_ENABLED;
    else process.env.LLM_ENABLED = prev;
  }
});
