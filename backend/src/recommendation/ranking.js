// Lọc cứng + xếp hạng cho hai chiều gợi ý. Thuần logic, dữ liệu do service nạp sẵn.
const config = require('./config');
const { scorePair } = require('./scoring');

const DAY = 24 * 60 * 60 * 1000;

// Trả về lý do bị loại, hoặc null nếu nhóm hợp lệ với sinh viên.
const teamExclusionReason = (student, team, ctx = {}) => {
  if (team.status !== 'recruiting') return 'not_recruiting';
  if (team.size >= team.capacity) return 'full';
  if (team.memberIds.has(student.id)) return 'already_member';
  if (ctx.rejectedTeamIds?.has(team.id)) return 'rejected';
  if (team.courseId && !ctx.enrolledCourseIds?.has(team.courseId)) return 'other_course';
  return null;
};

const isUnderdog = (team, now = Date.now()) =>
  team.size <= config.fairness.smallTeamMaxMembers ||
  now - team.lastJoinAt >= config.fairness.staleDays * DAY;

// Giữ 1 vị trí trong top cho nhóm ít thành viên hoặc lâu chưa tuyển được người.
const applyFairnessSlot = (ranked, limit, now) => {
  const top = ranked.slice(0, limit);
  if (!config.fairness.enabled || limit < 2 || ranked.length <= limit) return top;
  if (top.some((r) => isUnderdog(r.team, now))) return top;
  const candidate = ranked
    .slice(limit)
    .find((r) => isUnderdog(r.team, now) && r.score >= config.fairness.minScore);
  if (!candidate) return top;
  return [...top.slice(0, limit - 1), { ...candidate, fairness_slot: true }];
};

const byScoreDesc = (a, b) => b.score - a.score || (a.tiebreak || '').localeCompare(b.tiebreak || '');

/**
 * student: hồ sơ sinh viên; teams: hồ sơ nhóm.
 * ctx: { rejectedTeamIds:Set, enrolledCourseIds:Set, studentVector, teamVectors:Map, now }
 */
// Lọc cứng + chấm điểm hồ sơ cho mọi nhóm hợp lệ, sắp giảm dần (dùng chung cho chat).
const scoreTeamsForStudent = (student, teams, ctx = {}) =>
  teams
    .filter((team) => !teamExclusionReason(student, team, ctx))
    .map((team) => ({
      team,
      tiebreak: team.id,
      ...scorePair(student, team, { student: ctx.studentVector, team: ctx.teamVectors?.get(team.id) }),
    }))
    .sort(byScoreDesc);

const recommendGroupsForStudent = (student, teams, ctx = {}, limit = config.defaultLimits.groups) => {
  if (!student.skills.size) {
    return { needs_onboarding: true, suggest_create_team: false, recommendations: [] };
  }
  const now = ctx.now || Date.now();
  const ranked = scoreTeamsForStudent(student, teams, ctx);

  const recommendations = applyFairnessSlot(ranked, limit, now).map(({ tiebreak, ...r }) => ({
    ...r,
    fairness_slot: Boolean(r.fairness_slot),
  }));
  return {
    needs_onboarding: false,
    suggest_create_team: recommendations.length === 0,
    recommendations,
  };
};

const studentExclusionReason = (student, team, ctx = {}) => {
  if (team.memberIds.has(student.id)) return 'already_member';
  if (!student.skills.size) return 'no_skills';
  if (ctx.rejectedStudentIds?.has(student.id)) return 'rejected';
  if (ctx.pendingInviteeIds?.has(student.id)) return 'already_invited';
  if (team.courseId && !ctx.courseStudentIds?.has(student.id)) return 'other_course';
  return null;
};

/**
 * ctx: { rejectedStudentIds:Set, pendingInviteeIds:Set, courseStudentIds:Set, teamVector, studentVectors:Map }
 */
const recommendMembersForGroup = (team, students, ctx = {}, limit = config.defaultLimits.members) => {
  if (team.status !== 'recruiting' || team.size >= team.capacity) {
    return { team_open: false, recommendations: [] };
  }
  const recommendations = students
    .filter((student) => !studentExclusionReason(student, team, ctx))
    .map((student) => ({
      student,
      tiebreak: student.id,
      ...scorePair(student, team, { student: ctx.studentVectors?.get(student.id), team: ctx.teamVector }),
    }))
    .sort(byScoreDesc)
    .slice(0, limit)
    .map(({ tiebreak, ...r }) => r);
  return { team_open: true, recommendations };
};

module.exports = {
  teamExclusionReason,
  studentExclusionReason,
  isUnderdog,
  applyFairnessSlot,
  byScoreDesc,
  scoreTeamsForStudent,
  recommendGroupsForStudent,
  recommendMembersForGroup,
};
