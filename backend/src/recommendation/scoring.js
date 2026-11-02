// Lớp 1: các thành phần điểm (0-1) và hàm tổng hợp.
// Mỗi thành phần trả về { value, details }; value = null nghĩa là thiếu dữ liệu.
const config = require('./config');

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const round = (x) => Math.round(x * 10000) / 10000;

const gapFill = (student, team) => {
  if (!team.requirements.size && !team.rolesNeeded.length) return { value: null, details: {} };

  const filledSkills = [];
  let skillPart = 0;
  for (const { skill, required, current } of team.missing) {
    const level = student.skills.get(skill) || 0;
    if (level <= current) continue;
    skillPart += Math.min(1, (level - current) / (required - current));
    filledSkills.push(skill);
  }
  if (team.missing.length) skillPart /= team.missing.length;

  const filledRoles = team.openRoles.filter((r) => student.roles.has(r));
  const value = clamp01(skillPart + (filledRoles.length ? config.roleMatchBonus : 0));
  return {
    value,
    details: { filledSkills, filledRoles, missingSkills: team.missing.map((m) => m.skill) },
  };
};

const cosine = (a, b) => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

const semanticSim = (studentVector, teamVector) => {
  if (!studentVector || !teamVector || studentVector.length !== teamVector.length) {
    return { value: null, details: {} };
  }
  const raw = cosine(studentVector, teamVector);
  const { min, max } = config.semanticRange;
  return { value: clamp01((raw - min) / (max - min)), details: { cosine: round(raw) } };
};

// availability: tập các khung giờ rảnh dạng "thứ-giờ", mỗi phần tử = 1 giờ/tuần.
const scheduleOverlap = (student, team) => {
  if (!student.availability || !team.availability) return { value: null, details: {} };
  let hours = 0;
  for (const slot of student.availability) if (team.availability.has(slot)) hours += 1;
  return { value: clamp01(hours / config.scheduleFullOverlapHours), details: { commonHours: hours } };
};

const GOAL_RANK = { pass: 0, good: 1, excellent: 2 };

const goalMatch = (student, team) => {
  if (!student.goal || !team.goal) return { value: null, details: {} };
  const diff = Math.abs(GOAL_RANK[student.goal] - GOAL_RANK[team.goal]);
  return { value: 1 - diff / 2, details: { studentGoal: student.goal, teamGoal: team.goal } };
};

const levelBalance = (student, team) => {
  if (student.level === null || team.avgLevel === null) return { value: null, details: {} };
  const target = config.goalTargetLevel[team.goal] || config.defaultTargetLevel;
  const n = team.levelCount;
  const newAvg = (team.avgLevel * n + student.level) / (n + 1);
  const before = Math.abs(team.avgLevel - target);
  const after = Math.abs(newAvg - target);
  return {
    value: clamp01(1 - after / config.levelBalanceMaxDistance),
    details: { improves: after < before, teamAvg: round(team.avgLevel), newAvg: round(newAvg), target },
  };
};

const redundancy = (student, team) => {
  const strong = [...student.skills].filter(([, level]) => level >= config.strongSkillLevel).map(([s]) => s);
  if (!strong.length) return { value: 0, details: { redundantSkills: [] } };
  const redundantSkills = strong.filter((s) => team.covered.has(s));
  return { value: redundantSkills.length / strong.length, details: { redundantSkills } };
};

const POSITIVE = ['gap_fill', 'semantic_sim', 'schedule_overlap', 'goal_match', 'level_balance'];

const combine = (breakdown, weights = config.weights, penalty = config.redundancyPenalty) => {
  const available = POSITIVE.filter((k) => breakdown[k] !== null && breakdown[k] !== undefined);
  const total = available.reduce((sum, k) => sum + weights[k], 0);
  const weightsUsed = {};
  let score = 0;
  for (const k of POSITIVE) {
    weightsUsed[k] = available.includes(k) && total ? round(weights[k] / total) : 0;
    if (weightsUsed[k]) score += weightsUsed[k] * breakdown[k];
  }
  weightsUsed.redundancy = -penalty;
  score -= penalty * (breakdown.redundancy || 0);
  return { score: round(clamp01(score)), weightsUsed };
};

// Chấm điểm một cặp (sinh viên, nhóm).
const scorePair = (student, team, vectors = {}) => {
  const parts = {
    gap_fill: gapFill(student, team),
    semantic_sim: semanticSim(vectors.student, vectors.team),
    schedule_overlap: scheduleOverlap(student, team),
    goal_match: goalMatch(student, team),
    level_balance: levelBalance(student, team),
    redundancy: redundancy(student, team),
  };
  const breakdown = {};
  const details = {};
  for (const [key, { value, details: d }] of Object.entries(parts)) {
    breakdown[key] = value === null ? null : round(value);
    Object.assign(details, d);
  }
  const { score, weightsUsed } = combine(breakdown);
  return { score, score_breakdown: breakdown, weights_used: weightsUsed, details };
};

module.exports = {
  gapFill,
  semanticSim,
  scheduleOverlap,
  goalMatch,
  levelBalance,
  redundancy,
  combine,
  scorePair,
  cosine,
};
