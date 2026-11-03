// Migration dữ liệu cho module gợi ý nhóm:
// - Tạo bảng kỹ năng chuẩn (Taxonomy type 'skill') từ kỹ năng đang có.
// - Bổ sung level kỹ năng, vai trò, mục tiêu cho sinh viên/nhóm mẫu (chỉ khi còn trống).
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { mongoUri } = require('../config/env');
const { User, Team } = require('../models');
const Taxonomy = require('../models/taxonomy.model');

const studentProfiles = {
  'thuannmhe161234@fpt.edu.vn': { levels: { JavaScript: 4, React: 4, 'Node.js': 3, MongoDB: 3 }, roles: ['frontend'], goal: 'excellent' },
  'baotghe162001@fpt.edu.vn': { levels: { Java: 4, 'Spring Boot': 4, MySQL: 3 }, roles: ['backend'], goal: 'good' },
  'nguyenltse160877@fpt.edu.vn': { levels: { Python: 5, 'Machine Learning': 4, Pandas: 4, TensorFlow: 3 }, roles: ['ai_data'], goal: 'excellent' },
  'anhpdhe163344@fpt.edu.vn': { levels: { Linux: 4, 'Network Security': 4, Python: 3 }, roles: ['devops_security'], goal: 'good' },
  'nganhtkse161122@fpt.edu.vn': { levels: { Figma: 5, 'UI/UX': 4, Photoshop: 4, Illustrator: 3 }, roles: ['ui_ux'], goal: 'good' },
  'huydqhe162788@fpt.edu.vn': { levels: { 'C#': 3, '.NET': 3, 'SQL Server': 3 }, roles: ['backend'], goal: 'pass' },
  'linhbpse160455@fpt.edu.vn': { levels: { 'Content Marketing': 4, SEO: 3, Canva: 4, 'Social Media': 4 }, roles: ['marketing'], goal: 'good' },
  'phatnthe164900@fpt.edu.vn': { levels: { Python: 3, 'Data Analysis': 4, SQL: 3 }, roles: ['ai_data'], goal: 'good' },
  'yenvhse161600@fpt.edu.vn': { levels: { React: 4, TypeScript: 4, 'Node.js': 3, PostgreSQL: 3 }, roles: ['frontend'], goal: 'excellent' },
  'khanhtvhe162355@fpt.edu.vn': { levels: { Python: 3, Docker: 4, Linux: 3 }, roles: ['devops_security'], goal: 'pass' },
  'hanlgse160199@fpt.edu.vn': { levels: { 'Business Analysis': 4, Excel: 4, 'Project Management': 3 }, roles: ['ba_pm'], goal: 'good' },
  'namcnhe163011@fpt.edu.vn': { levels: { Java: 4, Algorithms: 5, 'System Design': 3, Kubernetes: 3 }, roles: ['backend'], goal: 'excellent' },
};

// Mục tiêu của nhóm và các kỹ năng yêu cầu level cao hơn mặc định (3).
const teamProfiles = {
  'HealthMate - Trợ lý sức khỏe': { goal: 'excellent' },
  'PayFlow - Ví điện tử sinh viên': { goal: 'good' },
  'MediScan AI': { goal: 'excellent', levels: { 'machine learning': 4, python: 4 } },
  'StudyHub - Nền tảng học nhóm': { goal: 'good' },
  'CampusEats - Đặt món căng tin': { goal: 'pass' },
  'GreenCycle - Phân loại rác thông minh': { goal: 'good' },
  'SecureVault - Quản lý mật khẩu': { goal: 'good', levels: { 'network security': 4 } },
  'CodeArena - Luyện thi lập trình': { goal: 'excellent', levels: { algorithms: 4 } },
  'EventGo - Quản lý sự kiện CLB': { goal: 'good' },
  'MindCare - Chatbot tâm lý': { goal: 'excellent' },
  'BrandLab - Studio nhận diện thương hiệu': { goal: 'good' },
  'DevOps Pipeline Lab': { goal: 'good' },
  'FinTrack - Dashboard đầu tư': { goal: 'good' },
  'SmartLib - Thư viện số FPTU': { goal: 'pass' },
  'TravelMate - Gợi ý lịch trình du lịch': { goal: 'good' },
  'CyberQuest - Luyện CTF': { goal: 'excellent' },
  'ArtBox - Triển lãm số': { goal: 'good' },
};

const run = async () => {
  await connectDB(mongoUri);
  const stats = { taxonomySkills: 0, students: 0, teams: 0 };

  // 1. Bảng kỹ năng chuẩn
  const names = new Map();
  for (const u of await User.find({ role: 'student' }).select('skills').lean()) {
    (u.skills || []).forEach((s) => names.set(s.trim().toLowerCase(), s.trim()));
  }
  for (const t of await Team.find().select('skillsNeeded').lean()) {
    (t.skillsNeeded || []).forEach((s) => {
      const key = s.trim().toLowerCase();
      if (!names.has(key)) names.set(key, s.trim());
    });
  }
  for (const [normalizedName, name] of names) {
    const res = await Taxonomy.updateOne(
      { type: 'skill', normalizedName },
      { $setOnInsert: { type: 'skill', name, normalizedName, isActive: true } },
      { upsert: true }
    );
    stats.taxonomySkills += res.upsertedCount;
  }

  // 2. Hồ sơ sinh viên (không ghi đè dữ liệu sinh viên đã tự khai)
  for (const [email, p] of Object.entries(studentProfiles)) {
    const user = await User.findOne({ email });
    if (!user || user.skillLevels.length || user.preferredRoles.length || user.goal) continue;
    user.skillLevels = Object.entries(p.levels)
      .filter(([name]) => user.skills.some((s) => s.toLowerCase() === name.toLowerCase()))
      .map(([name, level]) => ({ name, level }));
    user.preferredRoles = p.roles;
    user.goal = p.goal;
    await user.save();
    stats.students += 1;
  }

  // 3. Hồ sơ nhóm
  for (const [name, p] of Object.entries(teamProfiles)) {
    const team = await Team.findOne({ name });
    if (!team || team.goal || team.skillRequirements.length) continue;
    team.goal = p.goal;
    team.skillRequirements = Object.entries(p.levels || {})
      .filter(([skill]) => team.skillsNeeded.some((s) => s.toLowerCase() === skill))
      .map(([skill, minLevel]) => ({ name: skill, minLevel }));
    await team.save();
    stats.teams += 1;
  }

  console.log('Đã bổ sung dữ liệu gợi ý:', stats);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
