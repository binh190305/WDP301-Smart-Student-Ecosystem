const test = require('node:test');
const assert = require('node:assert/strict');

const {
  teamExclusionReason,
  recommendGroupsForStudent,
  recommendMembersForGroup,
  isUnderdog,
} = require('../../src/recommendation/ranking');
const { student, team } = require('./helpers');

const members = (n, skills = { Java: 4 }) => Array.from({ length: n }, () => student({ skills }));

test('lọc cứng: loại nhóm không tuyển, đủ người, đã là thành viên, bị từ chối, khác môn', () => {
  const s = student({ skills: { React: 3 } });
  assert.equal(teamExclusionReason(s, team({ status: 'closed' })), 'not_recruiting');
  assert.equal(teamExclusionReason(s, team({ members: members(5), maxMembers: 5 })), 'full');
  assert.equal(teamExclusionReason(s, team({ members: [s] })), 'already_member');
  const t = team({ members: members(1) });
  assert.equal(teamExclusionReason(s, t, { rejectedTeamIds: new Set([t.id]) }), 'rejected');
  const c = team({ members: members(1), course: 'c1' });
  assert.equal(teamExclusionReason(s, c, { enrolledCourseIds: new Set() }), 'other_course');
  assert.equal(teamExclusionReason(s, c, { enrolledCourseIds: new Set(['c1']) }), null);
});

test('lọc cứng: trần 6 thành viên dù maxMembers lớn hơn', () => {
  const s = student({ skills: { React: 3 } });
  assert.equal(teamExclusionReason(s, team({ members: members(6), maxMembers: 10 })), 'full');
  assert.equal(teamExclusionReason(s, team({ members: members(5), maxMembers: 10 })), null);
});

test('sinh viên chưa có kỹ năng: needs_onboarding thay vì gợi ý', () => {
  const r = recommendGroupsForStudent(student(), [team({ members: members(1), needs: { React: 3 } })]);
  assert.equal(r.needs_onboarding, true);
  assert.deepEqual(r.recommendations, []);
});

test('không còn nhóm nào qua bộ lọc: danh sách rỗng + gợi ý tạo nhóm', () => {
  const r = recommendGroupsForStudent(student({ skills: { React: 3 } }), [team({ status: 'full' })]);
  assert.equal(r.suggest_create_team, true);
  assert.deepEqual(r.recommendations, []);
});

test('xếp hạng: nhóm thiếu đúng kỹ năng của sinh viên đứng đầu', () => {
  const s = student({ skills: { Figma: 4 } });
  const needsDesign = team({ name: 'design', members: members(3, { React: 4 }), needs: { React: 3, Figma: 3 } });
  const needsBackend = team({ name: 'backend', members: members(3, { React: 4 }), needs: { React: 3, Java: 3 } });
  const r = recommendGroupsForStudent(s, [needsBackend, needsDesign], {}, 5);
  assert.equal(r.recommendations[0].team.name, 'design');
  assert.ok(r.recommendations[0].score > r.recommendations[1].score);
});

test('công bằng: dành 1 vị trí cho nhóm ít người khi top toàn nhóm đông', () => {
  const s = student({ skills: { Figma: 4 } });
  const busy = Array.from({ length: 6 }, (_, i) =>
    team({ name: `busy${i}`, members: members(4, { React: 4 }), needs: { Figma: 3 }, maxMembers: 6 })
  );
  const small = team({ name: 'small', members: members(1, { React: 4 }), needs: { Figma: 2, Java: 3, SQL: 3, Docker: 3 } });
  assert.equal(isUnderdog(small), true);
  assert.equal(isUnderdog(busy[0]), false);

  const r = recommendGroupsForStudent(s, [...busy, small], {}, 5);
  assert.equal(r.recommendations.length, 5);
  const last = r.recommendations[4];
  assert.equal(last.team.name, 'small');
  assert.equal(last.fairness_slot, true);
  assert.equal(r.recommendations.filter((x) => x.fairness_slot).length, 1);
});

test('công bằng: nhóm lâu không có thành viên mới cũng được tính là yếu thế', () => {
  assert.equal(isUnderdog(team({ members: members(4), joinedDaysAgo: 20 })), true);
});

test('công bằng: không chèn khi top đã có nhóm yếu thế', () => {
  const s = student({ skills: { Figma: 4 } });
  const small = team({ name: 'small', members: members(1, { React: 4 }), needs: { Figma: 3 } });
  const busy = team({ name: 'busy', members: members(4, { React: 4 }), needs: { Java: 3 } });
  const r = recommendGroupsForStudent(s, [small, busy], {}, 1);
  assert.equal(r.recommendations[0].team.name, 'small');
  assert.equal(r.recommendations[0].fairness_slot, false);
});

test('gợi ý thành viên: ưu tiên người lấp kỹ năng, loại thành viên/người không kỹ năng/đã mời', () => {
  const leader = student({ skills: { React: 4, 'Node.js': 4 } });
  const t = team({ members: [leader], needs: { React: 3, 'Node.js': 3, Figma: 3 } });
  const designer = student({ name: 'designer', skills: { Figma: 4 } });
  const dev = student({ name: 'dev', skills: { React: 5 } });
  const empty = student({ name: 'empty' });
  const invited = student({ name: 'invited', skills: { Figma: 5 } });
  const r = recommendMembersForGroup(t, [dev, designer, empty, invited, leader], {
    pendingInviteeIds: new Set([invited.id]),
  });
  assert.deepEqual(r.recommendations.map((x) => x.student.name), ['designer', 'dev']);
});

test('gợi ý thành viên: nhóm đã đủ hoặc đóng thì trả rỗng', () => {
  const r = recommendMembersForGroup(team({ members: members(6), maxMembers: 6 }), [student({ skills: { React: 3 } })]);
  assert.equal(r.team_open, false);
  assert.deepEqual(r.recommendations, []);
});

test('gợi ý thành viên: nhóm gắn môn chỉ gợi ý sinh viên đã ghi danh', () => {
  const t = team({ members: members(1), needs: { Figma: 3 }, course: 'c1' });
  const inCourse = student({ skills: { Figma: 3 } });
  const outCourse = student({ skills: { Figma: 5 } });
  const r = recommendMembersForGroup(t, [inCourse, outCourse], { courseStudentIds: new Set([inCourse.id]) });
  assert.deepEqual(r.recommendations.map((x) => x.student.id), [inCourse.id]);
});
