// Mức khớp giữa nhóm và yêu cầu sinh viên nhập trong chat (0-1).
const config = require('./config');
const { cosine, goalMatch } = require('./scoring');
const { fold } = require('./llm/query-parser');

const round = (x) => Math.round(x * 10000) / 10000;

// Câu hỏi ngắn cho cosine thấp hơn hồ sơ đầy đủ (~0.81-0.89 trên dữ liệu mẫu). Kết hợp:
// - tương đối (min-max trong lượt tìm): phân biệt rõ nhóm khớp nhất với phần còn lại;
// - tuyệt đối (khoảng semanticAbsoluteRange): tránh việc nhóm "ít tệ nhất" luôn được 1 điểm
//   khi không có nhóm nào thật sự liên quan.
// teamVectors: Map(teamId -> vector) -> Map(teamId -> 0..1)
const relativeSemantic = (queryVector, teamIds, teamVectors) => {
  const raw = new Map();
  if (!queryVector) return raw;
  for (const id of teamIds) {
    const v = teamVectors.get(id);
    if (v && v.length === queryVector.length) raw.set(id, cosine(queryVector, v));
  }
  if (!raw.size) return raw;
  const values = [...raw.values()];
  const min = Math.min(...values);
  const spread = Math.max(...values) - min;
  const scaled = new Map();
  for (const [id, c] of raw) scaled.set(id, spread < 0.005 ? 0.5 : (c - min) / spread);
  return scaled;
};

const hybridSemantic = (queryVector, teamIds, teamVectors) => {
  const relative = relativeSemantic(queryVector, teamIds, teamVectors);
  const { min, max } = config.chat.semanticAbsoluteRange;
  const result = new Map();
  for (const [id, rel] of relative) {
    const abs = Math.max(0, Math.min(1, (cosine(queryVector, teamVectors.get(id)) - min) / (max - min)));
    result.set(id, round((rel + abs) / 2));
  }
  return result;
};

// Tiêu chí sinh viên nêu rõ là bắt buộc: đã nói ngành thì nhóm phải đúng ngành,
// đã nói kỹ năng thì nhóm phải cần hoặc dùng ít nhất một kỹ năng đó.
// Vai trò và mục tiêu chỉ tính điểm (bộ trích xuất dễ nhầm, lọc cứng sẽ loại sai).
const passesHardFilters = (criteria, team) => {
  if (criteria.majors.length && !criteria.majors.some((m) => fold(m) === fold(team.major))) return false;
  if (criteria.skills.length) {
    const related = new Set([...team.requirements.keys(), ...team.presentSkills]);
    if (!criteria.skills.some((s) => related.has(s))) return false;
  }
  return true;
};

// criteria: { skills, majors, roles, goal }; team: hồ sơ nhóm; semantic: 0-1 từ relativeSemantic
const queryMatch = (criteria, team, { semantic = null } = {}) => {
  const parts = {};
  const details = {};

  parts.semantic = semantic;
  details.semantic = semantic;

  if (criteria.skills.length) {
    const related = new Set([...team.requirements.keys(), ...team.presentSkills]);
    details.matchedSkills = criteria.skills.filter((s) => related.has(s));
    parts.skills = details.matchedSkills.length / criteria.skills.length;
  } else parts.skills = null;

  if (criteria.majors.length) {
    const teamMajor = fold(team.major);
    details.matchedMajors = criteria.majors.filter((m) => fold(m) === teamMajor);
    parts.majors = details.matchedMajors.length ? 1 : 0;
  } else parts.majors = null;

  if (criteria.roles.length) {
    const wanted = new Set([...team.openRoles, ...team.rolesNeeded]);
    details.matchedRoles = criteria.roles.filter((r) => wanted.has(r));
    parts.roles = details.matchedRoles.length / criteria.roles.length;
  } else parts.roles = null;

  parts.goal = criteria.goal ? goalMatch({ goal: criteria.goal }, team).value : null;

  const weights = config.chat.queryWeights;
  const available = Object.keys(weights).filter((k) => parts[k] !== null && parts[k] !== undefined);
  const total = available.reduce((sum, k) => sum + weights[k], 0);
  const score = total ? available.reduce((sum, k) => sum + (weights[k] / total) * parts[k], 0) : null;

  const breakdown = {};
  for (const [k, v] of Object.entries(parts)) breakdown[k] = v === null || v === undefined ? null : round(v);
  return { score: score === null ? null : round(score), breakdown, details };
};

// Điểm cuối cho chat: trộn mức khớp yêu cầu với điểm hồ sơ.
const blendScores = (queryScore, profileScore) => {
  if (queryScore === null) return profileScore;
  const w = config.chat.queryBlend;
  return round(w * queryScore + (1 - w) * profileScore);
};

module.exports = { queryMatch, blendScores, relativeSemantic, hybridSemantic, passesHardFilters };
