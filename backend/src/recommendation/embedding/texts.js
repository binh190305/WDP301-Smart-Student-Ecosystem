// Văn bản đầu vào cho embedding.
const crypto = require('crypto');
const { roleLabel } = require('../skill-catalog');

const join = (items) => (items || []).filter(Boolean).join(', ');

// Sinh viên = kỹ năng + vai trò + sở thích + giới thiệu bản thân.
const buildStudentText = (user) =>
  [
    `Kỹ năng: ${join(user.skills)}`,
    user.preferredRoles?.length ? `Vai trò mong muốn: ${join(user.preferredRoles.map(roleLabel))}` : '',
    user.interests?.length ? `Sở thích: ${join(user.interests)}` : '',
    user.description ? `Giới thiệu: ${user.description}` : '',
  ]
    .filter(Boolean)
    .join('. ');

// Nhóm = tên đề tài + chủ đề + mô tả + kỹ năng cần.
const buildTeamText = (team) =>
  [
    `Đề tài: ${team.name}`,
    team.topic ? `Chủ đề: ${team.topic}` : '',
    team.description ? `Mô tả: ${team.description}` : '',
    team.skillsNeeded?.length ? `Kỹ năng cần: ${join(team.skillsNeeded)}` : '',
  ]
    .filter(Boolean)
    .join('. ');

const hashText = (text) => crypto.createHash('sha256').update(text).digest('hex');

module.exports = { buildStudentText, buildTeamText, hashText };
