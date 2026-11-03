const test = require('node:test');
const assert = require('node:assert/strict');

const { buildStudentText, buildTeamText, hashText } = require('../../src/recommendation/embedding/texts');
const { planSync } = require('../../src/recommendation/embedding/sync');

test('văn bản sinh viên gồm kỹ năng, vai trò, sở thích, giới thiệu', () => {
  const text = buildStudentText({
    skills: ['React', 'Node.js'],
    preferredRoles: ['frontend'],
    interests: ['Y tế số'],
    description: 'Thích làm web',
  });
  assert.equal(text, 'Kỹ năng: React, Node.js. Vai trò mong muốn: Frontend. Sở thích: Y tế số. Giới thiệu: Thích làm web');
});

test('văn bản nhóm gồm tên đề tài, chủ đề, mô tả, kỹ năng cần; bỏ phần trống', () => {
  assert.equal(
    buildTeamText({ name: 'HealthMate', topic: '', description: 'App sức khỏe', skillsNeeded: ['React'] }),
    'Đề tài: HealthMate. Mô tả: App sức khỏe. Kỹ năng cần: React'
  );
});

test('planSync: chỉ tính lại khi văn bản đổi, xoá vector không còn chủ', () => {
  const items = [
    { ownerType: 'student', owner: 'a', text: 'giữ nguyên' },
    { ownerType: 'student', owner: 'b', text: 'đã sửa' },
    { ownerType: 'team', owner: 'c', text: 'mới' },
  ];
  const existing = [
    { ownerType: 'student', owner: 'a', textHash: hashText('giữ nguyên') },
    { ownerType: 'student', owner: 'b', textHash: hashText('bản cũ') },
    { ownerType: 'team', owner: 'd', textHash: 'x' },
  ];
  const { toEmbed, staleKeys } = planSync(items, existing);
  assert.deepEqual(toEmbed.map((i) => i.owner), ['b', 'c']);
  assert.deepEqual(staleKeys, ['team:d']);
});
