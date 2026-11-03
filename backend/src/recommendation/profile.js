// Chuyển document User/Team (lean) thành hồ sơ chuẩn hoá phục vụ tính điểm.
const config = require('./config');
const { normalizeSkill, rolesForSkill, normalizeRole } = require('./skill-catalog');

const GOALS = ['excellent', 'good', 'pass'];

const idOf = (value) => (value && value._id ? value._id : value)?.toString();

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

const buildStudentProfile = (user) => {
  const explicitLevels = new Map(
    (user.skillLevels || []).map((s) => [normalizeSkill(s.name), Number(s.level)])
  );
  const skills = new Map();
  for (const raw of user.skills || []) {
    const name = normalizeSkill(raw);
    if (!name) continue;
    skills.set(name, explicitLevels.get(name) || config.defaultSkillLevel);
  }

  const declaredRoles = (user.preferredRoles || []).map(normalizeRole).filter(Boolean);
  const roles = new Set(declaredRoles);
  if (!roles.size) {
    for (const [skill, level] of skills) {
      if (level >= config.defaultSkillLevel) rolesForSkill(skill).forEach((r) => roles.add(r));
    }
  }

  // Trình độ chung (thang 1-5): ưu tiên level kỹ năng đã khai, sau đó tới GPA.
  const declared = [...skills.keys()].filter((s) => explicitLevels.has(s)).map((s) => skills.get(s));
  let level = mean(declared);
  if (level === null && typeof user.gpa === 'number') level = 1 + user.gpa;

  return {
    id: idOf(user),
    name: user.name,
    skills,
    roles,
    rolesDeclared: declaredRoles.length > 0,
    goal: GOALS.includes(user.goal) ? user.goal : null,
    level,
    availability: Array.isArray(user.availability) && user.availability.length ? new Set(user.availability) : null,
  };
};

const latestJoinAt = (team) => {
  const times = (team.members || []).map((m) => new Date(m.joinedAt || team.createdAt).getTime());
  return times.length ? Math.max(...times) : new Date(team.createdAt || Date.now()).getTime();
};

// memberProfiles: hồ sơ sinh viên của các thành viên hiện tại.
const buildTeamProfile = (team, memberProfiles = []) => {
  const requirements = new Map();
  for (const r of team.skillRequirements || []) {
    const name = normalizeSkill(r.name);
    if (name) requirements.set(name, Number(r.minLevel) || config.defaultRequiredLevel);
  }
  for (const raw of team.skillsNeeded || []) {
    const name = normalizeSkill(raw);
    if (name && !requirements.has(name)) requirements.set(name, config.defaultRequiredLevel);
  }

  const coverage = new Map();
  const memberRoles = new Set();
  for (const member of memberProfiles) {
    for (const [skill, level] of member.skills) {
      coverage.set(skill, Math.max(coverage.get(skill) || 0, level));
    }
    member.roles.forEach((r) => memberRoles.add(r));
  }

  const missing = [];
  const covered = new Set();
  for (const [skill, required] of requirements) {
    const current = coverage.get(skill) || 0;
    if (current < required) missing.push({ skill, required, current });
    else covered.add(skill);
  }
  for (const [skill, level] of coverage) {
    if (level >= config.strongSkillLevel) covered.add(skill);
  }

  let rolesNeeded = (team.rolesNeeded || []).map(normalizeRole).filter(Boolean);
  if (!rolesNeeded.length) {
    const derived = new Set();
    for (const { skill } of missing) rolesForSkill(skill).forEach((r) => derived.add(r));
    rolesNeeded = [...derived];
  }
  const openRoles = rolesNeeded.filter((r) => !memberRoles.has(r));

  const memberLevels = memberProfiles.map((m) => m.level).filter((l) => l !== null);

  let availability = null;
  const withSchedule = memberProfiles.filter((m) => m.availability);
  if (withSchedule.length) {
    availability = new Set(withSchedule[0].availability);
    for (const m of withSchedule.slice(1)) {
      for (const slot of availability) if (!m.availability.has(slot)) availability.delete(slot);
    }
  }

  const size = (team.members || []).length;
  return {
    id: idOf(team),
    name: team.name,
    major: team.major || '',
    status: team.status,
    presentSkills: new Set(coverage.keys()),
    courseId: team.course ? idOf(team.course) : null,
    memberIds: new Set((team.members || []).map((m) => idOf(m.user))),
    size,
    capacity: Math.min(team.maxMembers || config.teamSizeCap, config.teamSizeCap),
    requirements,
    missing,
    covered,
    rolesNeeded,
    openRoles,
    goal: GOALS.includes(team.goal) ? team.goal : null,
    avgLevel: mean(memberLevels),
    levelCount: memberLevels.length,
    availability,
    lastJoinAt: latestJoinAt(team),
  };
};

module.exports = { buildStudentProfile, buildTeamProfile, GOALS };
