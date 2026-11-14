/**
 * Seed Demo Data for Student Nguyễn Minh Thuận (SI-01 to SI-05)
 * Run: node src/utils/seed-demo-thuan.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const User = require('../models/user.model');
const Taxonomy = require('../models/taxonomy.model');
const StudentSkill = require('../models/student-skill.model');
const SkillRelationship = require('../models/skill-relationship.model');
const { seedGraph } = require('../skill-intelligence/knowledge-graph.service');

const THUAN_EMAIL = 'thuannmhe161234@fpt.edu.vn';

const DEMO_SKILLS = [
  {
    name: 'JavaScript',
    proficiency: 'advanced',
    status: 'confirmed',
    category: 'Frontend',
    confidence: 0.95,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Xây dựng frontend SPA hoàn chỉnh với ES6+, Async/Await, Webpack và tối ưu hiệu năng',
        sourceText: 'Dự án Hệ sinh thái học tập STE - Đảm nhiệm phát triển module quản lý nhóm và bài tập',
      },
      {
        evidenceType: 'COURSE_COMPLETION',
        description: 'Chứng chỉ JavaScript Modern & Clean Code',
      },
    ],
  },
  {
    name: 'React',
    proficiency: 'advanced',
    status: 'confirmed',
    category: 'Frontend',
    confidence: 0.94,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Xây dựng UI với React Hooks, Context API, Redux Toolkit, TailwindCSS và Vite',
        sourceText: 'Dự án Smart Student Ecosystem - Xây dựng giao diện cho sinh viên và giảng viên',
      },
      {
        evidenceType: 'WORK_EXPERIENCE',
        description: 'Thực tập sinh Frontend Developer - 6 tháng làm việc với ReactJS và RESTful API',
      },
    ],
  },
  {
    name: 'HTML/CSS',
    proficiency: 'advanced',
    status: 'confirmed',
    category: 'Frontend',
    confidence: 0.96,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Thiết kế Responsive Web Design, Tailwind CSS, Flexbox/Grid, CSS Animations',
      },
    ],
  },
  {
    name: 'TypeScript',
    proficiency: 'intermediate',
    status: 'confirmed',
    category: 'Frontend',
    confidence: 0.88,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Áp dụng TypeScript để định kiểu cho State Management, API Services và Components',
      },
    ],
  },
  {
    name: 'Node.js',
    proficiency: 'intermediate',
    status: 'confirmed',
    category: 'Backend',
    confidence: 0.89,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Xây dựng REST API backend với Node.js, Express, xử lý JWT authentication và middleware',
      },
    ],
  },
  {
    name: 'Express',
    proficiency: 'intermediate',
    status: 'confirmed',
    category: 'Backend',
    confidence: 0.87,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Thiết kế RESTful APIs chuẩn MVC, Router modular, middleware xác thực & phân quyền',
      },
    ],
  },
  {
    name: 'MongoDB',
    proficiency: 'intermediate',
    status: 'confirmed',
    category: 'Database',
    confidence: 0.85,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Mô hình hóa dữ liệu NoSQL, Mongoose ODM, đánh index tối ưu truy vấn aggregation pipeline',
      },
    ],
  },
  {
    name: 'Git',
    proficiency: 'intermediate',
    status: 'confirmed',
    category: 'DevOps',
    confidence: 0.9,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Sử dụng Git flow, quản lý branch, giải quyết merge conflict và CI/CD cơ bản với GitHub Actions',
      },
    ],
  },
  {
    name: 'Docker',
    proficiency: 'elementary',
    status: 'ai_suggested',
    category: 'DevOps',
    confidence: 0.78,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Viết Dockerfile containerize ứng dụng Node.js & React, cấu hình docker-compose đa dịch vụ',
      },
    ],
  },
  {
    name: 'Python',
    proficiency: 'intermediate',
    status: 'student_declared',
    category: 'AI/Data Science',
    confidence: 0.82,
    evidence: [
      {
        evidenceType: 'ACADEMIC_INTEREST',
        description: 'Học phần trí tuệ nhân tạo, xử lý dữ liệu và thuật toán gợi ý đội nhóm',
      },
    ],
  },
  {
    name: 'SQL',
    proficiency: 'intermediate',
    status: 'ai_suggested',
    category: 'Database',
    confidence: 0.8,
    evidence: [
      {
        evidenceType: 'COURSE_COMPLETION',
        description: 'Môn Hệ quản trị cơ sở dữ liệu (DBI202) - FPT University',
      },
    ],
  },
  {
    name: 'Figma',
    proficiency: 'elementary',
    status: 'student_declared',
    category: 'UI/UX',
    confidence: 0.75,
    evidence: [
      {
        evidenceType: 'PROJECT_DESCRIPTION',
        description: 'Wireframing và thiết kế UI prototype cho các màn hình mobile & web app',
      },
    ],
  },
];

const ADDITIONAL_RELATIONSHIPS = [
  { from: 'node.js', to: 'mongodb', type: 'COMPLEMENTARY_TO', weight: 0.85 },
  { from: 'express', to: 'mongodb', type: 'COMPLEMENTARY_TO', weight: 0.85 },
  { from: 'git', to: 'docker', type: 'COMPLEMENTARY_TO', weight: 0.75 },
  { from: 'javascript', to: 'html/css', type: 'COMPLEMENTARY_TO', weight: 0.9 },
  { from: 'sql', to: 'mongodb', type: 'RELATED_TO', weight: 0.7 },
  { from: 'figma', to: 'react', type: 'COMPLEMENTARY_TO', weight: 0.75 },
  { from: 'python', to: 'sql', type: 'COMPLEMENTARY_TO', weight: 0.75 },
];

const dns = require('dns');
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_) {}
}

async function seedThuanDemo() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ste';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', uri.replace(/:[^:]*@/, ':***@'));

  // 1. Find Thuận
  let thuan = await User.findOne({ email: THUAN_EMAIL });
  if (!thuan) {
    console.error(`❌ Student with email ${THUAN_EMAIL} not found!`);
    process.exit(1);
  }
  console.log(`👤 Found student: ${thuan.name} (${thuan._id})`);

  // 2. Ensure canonical graph seeded
  await seedGraph();
  console.log('✅ Base knowledge graph relationships verified');

  // 3. Upsert Taxonomies for all demo skills
  for (const item of DEMO_SKILLS) {
    const norm = item.name.trim().toLowerCase();
    await Taxonomy.findOneAndUpdate(
      { type: 'skill', normalizedName: norm },
      { name: item.name, normalizedName: norm, type: 'skill', isActive: true },
      { upsert: true, new: true }
    );
  }

  // 4. Upsert StudentSkills for Thuận
  for (const item of DEMO_SKILLS) {
    const norm = item.name.trim().toLowerCase();
    const tax = await Taxonomy.findOne({ type: 'skill', normalizedName: norm });

    await StudentSkill.findOneAndUpdate(
      { student: thuan._id, normalizedName: norm },
      {
        student: thuan._id,
        skillName: item.name,
        normalizedName: norm,
        taxonomy: tax?._id || null,
        proficiency: item.proficiency,
        status: item.status,
        confidence: item.confidence,
        aiCategory: item.category,
        assessmentMethod: item.status === 'confirmed' ? 'verified' : (item.status === 'ai_suggested' ? 'ai_extracted' : 'self_reported'),
        evidence: (item.evidence || []).map((e) => ({
          ...e,
          evidenceId: e.evidenceId || new mongoose.Types.ObjectId().toString(),
          title: e.title || `Bằng chứng ${e.evidenceType}`,
          verificationStatus: e.verificationStatus || 'PENDING_REVIEW',
        })),
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`  ✓ Seeded skill: ${item.name} (${item.proficiency} - ${item.status})`);
  }

  // 5. Add extra relationships
  for (const rel of ADDITIONAL_RELATIONSHIPS) {
    const fromTax = await Taxonomy.findOne({ type: 'skill', normalizedName: rel.from.toLowerCase() });
    const toTax = await Taxonomy.findOne({ type: 'skill', normalizedName: rel.to.toLowerCase() });
    if (fromTax && toTax) {
      await SkillRelationship.findOneAndUpdate(
        { fromId: fromTax._id, toId: toTax._id, relationshipType: rel.type },
        {
          fromType: 'skill',
          fromId: fromTax._id,
          toType: 'skill',
          toId: toTax._id,
          relationshipType: rel.type,
          weight: rel.weight,
          source: 'system',
          isActive: true,
        },
        { upsert: true }
      );
    }
  }

  // 6. Update user's skills array in User model for consistency
  thuan.skills = DEMO_SKILLS.map((s) => s.name);
  await thuan.save();
  console.log(`✅ Updated User.skills array with ${thuan.skills.length} skills`);

  const totalSkills = await StudentSkill.countDocuments({ student: thuan._id, isActive: true });
  const totalRels = await SkillRelationship.countDocuments({ isActive: true });
  console.log(`\n🎉 Seed finished! Student Thuận has ${totalSkills} skills in StudentSkill. Total graph relationships: ${totalRels}.`);
  process.exit(0);
}

seedThuanDemo().catch((err) => {
  console.error('❌ Error seeding demo:', err);
  process.exit(1);
});

