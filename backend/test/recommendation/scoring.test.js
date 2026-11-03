const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../../src/recommendation/config');
const {
  gapFill,
  semanticSim,
  scheduleOverlap,
  goalMatch,
  levelBalance,
  redundancy,
  combine,
  scorePair,
} = require('../../src/recommendation/scoring');
const { buildStudentProfile } = require('../../src/recommendation/profile');
const { student, team } = require('./helpers');

const close = (actual, expected, eps = 1e-3) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);

test('profile: chuẩn hoá tên kỹ năng, level mặc định và suy ra vai trò', () => {
  const p = buildStudentProfile({ _id: 'x', skills: ['ReactJS', ' Node.JS '], skillLevels: [{ name: 'react', level: 5 }] });
  assert.equal(p.skills.get('react'), 5);
  assert.equal(p.skills.get('node.js'), config.defaultSkillLevel);
  assert.ok(p.roles.has('frontend') && p.roles.has('backend'));
  assert.equal(p.level, 5); // chỉ tính level đã khai
});

test('profile: không khai level thì dùng GPA làm trình độ', () => {
  const p = buildStudentProfile({ _id: 'x', skills: ['React'], gpa: 3 });
  assert.equal(p.level, 4);
});

test('gap_fill: lấp đủ kỹ năng thiếu được điểm cao, kỹ năng nhóm đã có thì 0', () => {
  const leader = student({ skills: { React: 4 } });
  const t = team({ members: [leader], needs: { React: 3, Figma: 3 }, rolesNeeded: [] });
  assert.deepEqual(t.missing.map((m) => m.skill), ['figma']);

  const designer = student({ skills: { Figma: 4 } });
  const frontend = student({ skills: { React: 5 } });
  const designerGap = gapFill(designer, t);
  close(designerGap.value, 1);
  assert.deepEqual(designerGap.details.filledSkills, ['figma']);
  assert.equal(gapFill(frontend, t).value, 0);
});

test('gap_fill: lấp một phần khi level thấp hơn yêu cầu', () => {
  const t = team({ members: [student({ skills: { Java: 3 } })], needs: { Python: 4 }, rolesNeeded: [] });
  close(gapFill(student({ skills: { Python: 2 } }), t).value, 0.5);
});

test('gap_fill: cộng thưởng khi vai trò mong muốn trùng vai trò còn trống', () => {
  const t = team({ members: [student({ skills: { Java: 4 } })], needs: { Figma: 3 }, rolesNeeded: ['ui_ux', 'marketing'] });
  const s = student({ skills: { SEO: 3 }, preferredRoles: ['marketing'] });
  const r = gapFill(s, t);
  close(r.value, config.roleMatchBonus);
  assert.deepEqual(r.details.filledRoles, ['marketing']);
});

test('gap_fill: nhóm không khai kỹ năng/vai trò thì null', () => {
  assert.equal(gapFill(student({ skills: { React: 3 } }), team({ members: [] })).value, null);
});

test('semantic_sim: null khi thiếu vector, ánh xạ cosine về 0-1', () => {
  assert.equal(semanticSim(null, [1, 0]).value, null);
  assert.equal(semanticSim([1, 0], [1, 0]).value, 1);
  assert.equal(semanticSim([1, 0], [0, 1]).value, 0);
});

test('schedule_overlap: null khi thiếu lịch, tối đa 1', () => {
  const a = student({ skills: { React: 3 } });
  assert.equal(scheduleOverlap(a, team({ members: [a] })).value, null);
  const slots = Array.from({ length: 12 }, (_, i) => `1-${i + 8}`);
  const s = student({ skills: { React: 3 }, availability: slots.slice(0, 5) });
  const m = student({ skills: { Java: 3 }, availability: slots });
  close(scheduleOverlap(s, team({ members: [m] })).value, 0.5);
  const s2 = student({ skills: { React: 3 }, availability: slots });
  assert.equal(scheduleOverlap(s2, team({ members: [m] })).value, 1);
});

test('goal_match: cùng mục tiêu = 1, lệch hai bậc = 0, thiếu = null', () => {
  const t = team({ goal: 'excellent' });
  assert.equal(goalMatch(student({ skills: { a: 1 }, goal: 'excellent' }), t).value, 1);
  assert.equal(goalMatch(student({ skills: { a: 1 }, goal: 'good' }), t).value, 0.5);
  assert.equal(goalMatch(student({ skills: { a: 1 }, goal: 'pass' }), t).value, 0);
  assert.equal(goalMatch(student({ skills: { a: 1 } }), t).value, null);
});

test('level_balance: ưu tiên người kéo trình độ trung bình về mục tiêu', () => {
  const weak = student({ skills: { Java: 2 } });
  const t = team({ members: [weak, student({ skills: { SQL: 2 } })], goal: 'excellent' });
  const strong = levelBalance(student({ skills: { Python: 5 } }), t);
  const alsoWeak = levelBalance(student({ skills: { Python: 2 } }), t);
  assert.ok(strong.value > alsoWeak.value);
  assert.equal(strong.details.improves, true);
  assert.equal(levelBalance(student({ skills: { Python: 5 } }), team({ members: [] })).value, null);
});

test('redundancy: tỉ lệ kỹ năng mạnh trùng với kỹ năng nhóm đã đủ', () => {
  const t = team({ members: [student({ skills: { React: 4 } })], needs: { React: 3, Figma: 3 } });
  const r = redundancy(student({ skills: { React: 5, Figma: 4 } }), t);
  close(r.value, 0.5);
  assert.deepEqual(r.details.redundantSkills, ['react']);
  assert.equal(redundancy(student({ skills: { React: 3 } }), t).value, 0); // không có kỹ năng mạnh
});

test('combine: đúng công thức khi đủ dữ liệu', () => {
  const b = { gap_fill: 1, semantic_sim: 0.5, schedule_overlap: 0.5, goal_match: 1, level_balance: 0, redundancy: 1 };
  close(combine(b).score, 0.35 + 0.1 + 0.1 + 0.1 - 0.15);
});

test('combine: chia lại trọng số khi thiếu thành phần', () => {
  const b = { gap_fill: 1, semantic_sim: 1, schedule_overlap: null, goal_match: null, level_balance: null, redundancy: 0 };
  const { score, weightsUsed } = combine(b);
  close(score, 1);
  close(weightsUsed.gap_fill, 0.35 / 0.55);
  assert.equal(weightsUsed.schedule_overlap, 0);
});

test('combine: điểm bị kẹp trong [0, 1] và không có dữ liệu thì 0', () => {
  const b = { gap_fill: 0, semantic_sim: 0, schedule_overlap: null, goal_match: null, level_balance: null, redundancy: 1 };
  assert.equal(combine(b).score, 0);
  assert.equal(combine({ redundancy: 0 }).score, 0);
});

test('scorePair: người bổ sung kỹ năng xếp trên người trùng kỹ năng', () => {
  const t = team({ members: [student({ skills: { React: 4, 'Node.js': 4 } })], needs: { React: 3, 'Node.js': 3, Figma: 3 } });
  const designer = scorePair(student({ skills: { Figma: 4 } }), t);
  const duplicate = scorePair(student({ skills: { React: 5, 'Node.js': 4 } }), t);
  assert.ok(designer.score > duplicate.score, `${designer.score} <= ${duplicate.score}`);
  assert.ok(duplicate.score_breakdown.redundancy > 0);
});
