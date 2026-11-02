const { buildStudentProfile, buildTeamProfile } = require('../../src/recommendation/profile');

let seq = 0;
const nextId = () => `id${(seq += 1)}`;

// skills: { React: 4, Figma: 2 } -> skills + skillLevels
const student = ({ skills = {}, ...rest } = {}) =>
  buildStudentProfile({
    _id: rest._id || nextId(),
    name: rest.name || 'SV',
    skills: Object.keys(skills),
    skillLevels: Object.entries(skills).map(([name, level]) => ({ name, level })),
    ...rest,
  });

const DAY = 24 * 60 * 60 * 1000;

// members: danh sách hồ sơ sinh viên đã có trong nhóm
const team = ({ members = [], needs = {}, joinedDaysAgo = 1, ...rest } = {}) => {
  const doc = {
    _id: rest._id || nextId(),
    name: rest.name || 'Nhóm',
    status: 'recruiting',
    maxMembers: 5,
    createdAt: new Date(Date.now() - 30 * DAY),
    skillRequirements: Object.entries(needs).map(([name, minLevel]) => ({ name, minLevel })),
    members: members.map((m) => ({ user: m.id, joinedAt: new Date(Date.now() - joinedDaysAgo * DAY) })),
    ...rest,
  };
  return buildTeamProfile(doc, members);
};

module.exports = { student, team, DAY };
