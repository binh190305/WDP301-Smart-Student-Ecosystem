/**
 * Seed Demo Data for 3 Demo Accounts (STE / AACS)
 *  1. Student 1: Nguyễn Đại Đức (thuannmhe161234@fpt.edu.vn) - Web Fullstack MERN
 *  2. Student 2: Lê Thảo Nguyên (nguyenltse160877@fpt.edu.vn) - AI & Data Science
 *  3. Lecturer: ThS. Hoàng Đình Quang (quanghd@fe.edu.vn) - Giảng viên & Thẩm định viên
 *
 * Password for all 3: Fptu@2026
 * Run: node src/utils/seed-demo-3-accounts.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const {
  User,
  Course,
  Enrollment,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  StudentSkill,
  Material,
} = require('../models');
const { getStandardCompetencies } = require('../skill-intelligence/competency-catalog');

const DEFAULT_PASSWORD = 'Fptu@2026';

async function seed() {
  console.log(' Connecting to MongoDB:', process.env.MONGO_URI?.split('@')[1] || 'Cluster');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB successfully.\n');

  // ─── 1. LOCATE OR UPSERT THE 3 DEMO ACCOUNTS ───────────────────────────────
  console.log('📌 1. Chuẩn bị 3 tài khoản Demo...');

  // 1.1. Student 1: Nguyễn Đại Đức
  let student1 = await User.findOne({ email: 'thuannmhe161234@fpt.edu.vn' });
  if (!student1) {
    student1 = await User.create({
      name: 'Nguyễn Đại Đức',
      email: 'thuannmhe161234@fpt.edu.vn',
      password: DEFAULT_PASSWORD,
      role: 'student',
      major: 'Kỹ thuật phần mềm',
      gpa: 3.65,
      skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'HTML/CSS', 'TypeScript', 'Git', 'Docker', 'Python', 'SQL', 'Figma'],
      preferredRoles: ['Frontend Developer', 'Fullstack Developer'],
      interests: ['Web Development', 'Cloud Computing', 'UI/UX'],
      description: 'Sinh viên Kỹ thuật phần mềm K16 FPT. Chuyên sâu phát triển ứng dụng Web Fullstack MERN và kiến trúc Cloud.',
      avatarUrl: '/uploads/avatars/2026/11/10/80bb97123a31f77be2ad403dec0143b4.jpg',
      isActive: true,
    });
  } else {
    student1.name = 'Nguyễn Đại Đức';
    student1.password = DEFAULT_PASSWORD;
    student1.gpa = 3.65;
    student1.major = 'Kỹ thuật phần mềm';
    student1.skills = ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'HTML/CSS', 'TypeScript', 'Git', 'Docker', 'Python', 'SQL', 'Figma'];
    student1.isActive = true;
    await student1.save();
  }
  console.log(`  ✓ Sinh viên 1: ${student1.name} (${student1.email}) - Mật khẩu: ${DEFAULT_PASSWORD}`);

  // 1.2. Student 2: Lê Thảo Nguyên
  let student2 = await User.findOne({ email: 'nguyenltse160877@fpt.edu.vn' });
  if (!student2) {
    student2 = await User.create({
      name: 'Lê Thảo Nguyên',
      email: 'nguyenltse160877@fpt.edu.vn',
      password: DEFAULT_PASSWORD,
      role: 'student',
      major: 'Trí tuệ nhân tạo',
      gpa: 3.82,
      skills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Deep Learning', 'Scikit-Learn', 'TensorFlow', 'PyTorch', 'Git', 'Data Analysis'],
      preferredRoles: ['AI Engineer', 'Data Scientist'],
      interests: ['Machine Learning', 'Natural Language Processing', 'Data Science'],
      description: 'Sinh viên chuyên ngành Trí tuệ nhân tạo K16 FPT. Nghiên cứu mô hình học máy, mạng nơ-ron và khai phá dữ liệu.',
      avatarUrl: '/uploads/avatars/2026/11/10/bb3d8ff511eb43aa34e18ad7a339d80a.jpg',
      isActive: true,
    });
  } else {
    student2.name = 'Lê Thảo Nguyên';
    student2.password = DEFAULT_PASSWORD;
    student2.gpa = 3.82;
    student2.major = 'Trí tuệ nhân tạo';
    student2.skills = ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Deep Learning', 'Scikit-Learn', 'TensorFlow', 'PyTorch', 'Git', 'Data Analysis'];
    student2.isActive = true;
    await student2.save();
  }
  console.log(`  ✓ Sinh viên 2: ${student2.name} (${student2.email}) - Mật khẩu: ${DEFAULT_PASSWORD}`);

  // 1.3. Lecturer: ThS. Hoàng Đình Quang
  let lecturer = await User.findOne({ email: 'quanghd@fe.edu.vn' });
  if (!lecturer) {
    lecturer = await User.create({
      name: 'ThS. Hoàng Đình Quang',
      email: 'quanghd@fe.edu.vn',
      password: DEFAULT_PASSWORD,
      role: 'lecturer',
      major: 'Kỹ thuật phần mềm',
      skills: ['React', 'JavaScript', 'Node.js', 'Software Architecture'],
      description: 'Giảng viên Bộ môn Kỹ thuật phần mềm FPT University, phụ trách các học phần FER202, SWP391.',
      isActive: true,
    });
  } else {
    lecturer.name = 'ThS. Hoàng Đình Quang';
    lecturer.password = DEFAULT_PASSWORD;
    lecturer.role = 'lecturer';
    lecturer.isActive = true;
    await lecturer.save();
  }
  console.log(`  ✓ Giảng viên: ${lecturer.name} (${lecturer.email}) - Mật khẩu: ${DEFAULT_PASSWORD}\n`);

  // ─── 2. HỌC PHẦN (COURSES) & GHI DANH (ENROLLMENTS) ────────────────────────
  console.log('📌 2. Thiết lập Khóa học và Ghi danh...');

  const courseDefs = [
    { code: 'FER202', title: 'Lập trình Web Frontend với React', term: 'Fall 2026', major: 'Kỹ thuật phần mềm' },
    { code: 'SWP391', title: 'Đồ án Phát triển Ứng dụng Phần mềm', term: 'Fall 2026', major: 'Kỹ thuật phần mềm' },
    { code: 'PRJ301', title: 'Lập trình Ứng dụng Web Java & Node.js', term: 'Summer 2026', major: 'Kỹ thuật phần mềm' },
    { code: 'DBI202', title: 'Hệ quản trị Cơ sở Dữ liệu & SQL', term: 'Spring 2026', major: 'Kỹ thuật phần mềm' },
    { code: 'AIL303m', title: 'Học máy & Xử lý Dữ liệu Thông minh', term: 'Fall 2026', major: 'Trí tuệ nhân tạo' },
    { code: 'MAS291', title: 'Xác suất Thống kê cho Khoa học Dữ liệu', term: 'Summer 2026', major: 'Trí tuệ nhân tạo' },
  ];

  const courseMap = {};
  for (const c of courseDefs) {
    let doc = await Course.findOne({ code: c.code });
    if (!doc) {
      doc = await Course.create({
        code: c.code,
        title: c.title,
        description: `Học phần chuẩn ${c.title} dành cho sinh viên FPT.`,
        term: c.term,
        instructor: lecturer._id,
        credits: 3,
        isActive: true,
      });
    }
    courseMap[c.code] = doc;
  }

  // Enroll Student 1 in FER202, SWP391, PRJ301, DBI202
  const s1Courses = ['FER202', 'SWP391', 'PRJ301', 'DBI202'];
  for (const code of s1Courses) {
    await Enrollment.findOneAndUpdate(
      { student: student1._id, course: courseMap[code]._id },
      { status: 'active', enrolledAt: new Date(Date.now() - 60 * 86400000) },
      { upsert: true }
    );
  }

  // Enroll Student 2 in AIL303m, MAS291, DBI202
  const s2Courses = ['AIL303m', 'MAS291', 'DBI202'];
  for (const code of s2Courses) {
    await Enrollment.findOneAndUpdate(
      { student: student2._id, course: courseMap[code]._id },
      { status: 'active', enrolledAt: new Date(Date.now() - 60 * 86400000) },
      { upsert: true }
    );
  }
  console.log('  ✓ Đã ghi danh sinh viên vào các học phần tương ứng.\n');

  // ─── 3. QUIZZES & QUIZ ATTEMPTS ─────────────────────────────────────────────
  console.log('📌 3. Tạo bài Quiz và Kết quả làm bài kiểm tra thực nghiệm...');

  // Quiz 1: React Fundamentals (FER202)
  let quizReact = await Quiz.findOne({ title: /React/i });
  if (!quizReact) {
    quizReact = await Quiz.create({
      course: courseMap['FER202']._id,
      createdBy: lecturer._id,
      title: 'Kiểm tra Năng lực Lập trình React Hooks & State Management',
      description: 'Đánh giá kiến thức React components, props, hooks lifecycle và Redux.',
      questions: [
        {
          questionText: 'Trong React, hook nào dùng để quản lý side-effects?',
          options: ['useState', 'useEffect', 'useContext', 'useReducer'],
          correctIndexes: [1],
          explanation: 'useEffect dùng để thực hiện các side-effects như fetch API, timers.',
        },
        {
          questionText: 'Context API trong React chủ yếu được sử dụng để giải quyết vấn đề gì?',
          options: ['State hoisting', 'Props drilling', 'Memory leak', 'Slow rendering'],
          correctIndexes: [1],
          explanation: 'Context API giúp truyền dữ liệu xuyên component tree mà không cần truyền props qua từng tầng.',
        },
      ],
      passingPercentage: 60,
      timeLimitMinutes: 20,
      isPublished: true,
    });
  }

  // Quiz Attempt for Student 1 (React - 100% Passed)
  await QuizAttempt.findOneAndUpdate(
    { quiz: quizReact._id, student: student1._id },
    {
      score: 10,
      totalQuestions: 10,
      percentage: 100,
      passed: true,
      timeSpentSeconds: 650,
      createdAt: new Date(Date.now() - 15 * 86400000),
    },
    { upsert: true }
  );

  // Quiz 2: Python & Data Preprocessing (AIL303m)
  let quizPython = await Quiz.findOne({ title: /Python/i });
  if (!quizPython) {
    quizPython = await Quiz.create({
      course: courseMap['AIL303m']._id,
      createdBy: lecturer._id,
      title: 'Trắc nghiệm Ngôn ngữ Lập trình Python & Cấu trúc Dữ liệu',
      description: 'Đánh giá kiến thức Python OOP, Pandas, NumPy và xử lý dữ liệu.',
      questions: [
        {
          questionText: 'Cấu trúc dữ liệu nào trong Pandas đại diện cho bảng dữ liệu 2 chiều?',
          options: ['Series', 'DataFrame', 'Panel', 'Matrix'],
          correctIndexes: [1],
          explanation: 'DataFrame là cấu trúc 2 chiều dạng bảng trong Pandas.',
        },
      ],
      passingPercentage: 60,
      timeLimitMinutes: 20,
      isPublished: true,
    });
  }

  // Quiz Attempt for Student 2 (Python - 95% Passed)
  await QuizAttempt.findOneAndUpdate(
    { quiz: quizPython._id, student: student2._id },
    {
      score: 10,
      totalQuestions: 10,
      percentage: 100,
      passed: true,
      timeSpentSeconds: 720,
      createdAt: new Date(Date.now() - 20 * 86400000),
    },
    { upsert: true }
  );
  console.log('  ✓ Đã nạp QuizAttempts đạt điểm cao cho React và Python.\n');

  // ─── 4. ASSIGNMENTS & GRADED SUBMISSIONS ────────────────────────────────────
  console.log('📌 4. Tạo Bài tập và Bài nộp đã được Giảng viên chấm điểm...');

  // Assignment 1: FER202 Lab 1
  let asgReact = await Assignment.findOne({ course: courseMap['FER202']._id, title: /SPA/i });
  if (!asgReact) {
    asgReact = await Assignment.create({
      course: courseMap['FER202']._id,
      createdBy: lecturer._id,
      title: 'Lab 1: Xây dựng SPA với React Context & Custom Hooks',
      description: 'Phát triển ứng dụng giỏ hàng trực tuyến có xác thực người dùng.',
      maxScore: 10,
      dueDate: new Date(Date.now() + 30 * 86400000),
      isPublished: true,
    });
  }

  // Submission for Student 1 (Grade: 9.5/10)
  const sub1 = await Submission.findOneAndUpdate(
    { assignment: asgReact._id, student: student1._id },
    {
      content: 'Bài nộp mã nguồn frontend: Tích hợp React 18, Custom hooks useAuth, useCart và Context API. Tối ưu memoization và lazy loading.',
      status: 'graded',
      score: 9.5,
      feedback: 'Cấu trúc thư mục chuẩn modular, component tách bạch rõ ràng, xử lý state rất mượt mà. Đạt chuẩn năng lực cao.',
      gradedBy: lecturer._id,
      gradedAt: new Date(Date.now() - 10 * 86400000),
      submittedAt: new Date(Date.now() - 12 * 86400000),
    },
    { upsert: true, new: true }
  );

  // Assignment 2: AIL303m Lab
  let asgAI = await Assignment.findOne({ course: courseMap['AIL303m']._id, title: /Machine Learning/i });
  if (!asgAI) {
    asgAI = await Assignment.create({
      course: courseMap['AIL303m']._id,
      createdBy: lecturer._id,
      title: 'Lab 2: Huấn luyện Mô hình Phân loại với Scikit-Learn',
      description: 'Xử lý dữ liệu khuyết, chuẩn hóa đặc trưng và huấn luyện mô hình Random Forest.',
      maxScore: 10,
      dueDate: new Date(Date.now() + 30 * 86400000),
      isPublished: true,
    });
  }

  // Submission for Student 2 (Grade: 9.2/10)
  const sub2 = await Submission.findOneAndUpdate(
    { assignment: asgAI._id, student: student2._id },
    {
      content: 'Báo cáo thực hành mô hình Machine Learning: Tiền xử lý dữ liệu với Pandas, vẽ ROC curve, phân tích Confusion Matrix và tối ưu F1-score.',
      status: 'graded',
      score: 9.2,
      feedback: 'Thuật toán áp dụng chính xác, đánh giá cross-validation bài bản và phân tích biểu đồ trực quan.',
      gradedBy: lecturer._id,
      gradedAt: new Date(Date.now() - 14 * 86400000),
      submittedAt: new Date(Date.now() - 16 * 86400000),
    },
    { upsert: true, new: true }
  );
  console.log('  ✓ Đã nạp Bài tập & Bài nộp đạt điểm 9.5/10 và 9.2/10.\n');

  // ─── 5. STUDENT 1: EVIDENCE-BASED SKILLS (NGUYỄN ĐẠI ĐỨC) ───────────────────
  console.log('📌 5. Nạp Hồ sơ Kỹ năng 3 cấp (Evidence-Based) cho Nguyễn Đại Đức...');
  await StudentSkill.deleteMany({ student: student1._id });

  const s1Skills = [
    // 🛡️ VERIFIED SKILLS (Đã xác thực chính thức bởi Giảng viên)
    {
      skillName: 'React',
      proficiency: 'advanced',
      proficiencyLevel: 4,
      proficiencyScore: 95,
      classification: 'verified',
      verificationStatus: 'VERIFIED',
      aiCategory: 'Frontend Development',
      status: 'confirmed',
      assessmentMethod: 'verified',
      competencies: getStandardCompetencies('React').map((c) => ({
        ...c,
        status: ['Components & JSX', 'State Management', 'Hooks Lifecycle', 'Context API'].includes(c.name) ? 'mastered' : 'competent',
        score: 95,
        strengths: 'Nắm vững kiến trúc component, custom hooks và Context API chuyên sâu.',
      })),
      evidence: [
        {
          evidenceType: 'PROJECT',
          title: 'Dự án Hệ sinh thái Sinh viên STE - Frontend SPA',
          description: 'Xây dựng giao diện Single Page Application với React 18, React Router v6, Tailwind CSS và Redux Toolkit.',
          sourceUrl: 'https://github.com/nguyendaiduc/ste-student-ecosystem-frontend',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 5 * 86400000),
          reviewerComments: 'Mã nguồn tổ chức chuyên nghiệp, tuân thủ Clean Code và tối ưu re-render rất tốt.',
          assessmentResult: {
            score: 95,
            rubric: 'Enterprise React Project Rubric',
            feedback: 'Đã thẩm định mã nguồn trên GitHub repository. Đáp ứng hoàn toàn tiêu chuẩn dự án cấp độ Advanced.',
            competenciesDemonstrated: ['Components & JSX', 'State Management', 'Hooks Lifecycle', 'Context API'],
          },
        },
        {
          evidenceType: 'ASSIGNMENT',
          title: 'Bài nộp Lab 1 môn FER202: Ứng dụng SPA Giỏ hàng',
          description: 'Bài tập thực hành tại lớp đạt điểm 9.5/10 do giảng viên ThS. Hoàng Đình Quang chấm.',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 10 * 86400000),
          linkedEntity: { entityType: 'Submission', entityId: sub1._id },
          assessmentResult: {
            score: 95,
            rubric: 'Academic Course Evaluation',
            feedback: 'Bài tập thực hành xuất sắc, cấu trúc hook mẫu mực.',
            competenciesDemonstrated: ['Hooks Lifecycle', 'State Management'],
          },
        },
      ],
      verificationHistory: [
        {
          changedAt: new Date(Date.now() - 5 * 86400000),
          fromStatus: 'ASSESSED',
          toStatus: 'VERIFIED',
          changedBy: lecturer._id,
          reason: 'Giảng viên ThS. Hoàng Đình Quang đã trực tiếp thẩm định mã nguồn GitHub và bảo vệ đồ án Lab 1 thành công.',
          comments: 'Xác thực kỹ năng mức độ Advanced.',
        },
      ],
    },
    {
      skillName: 'JavaScript',
      proficiency: 'advanced',
      proficiencyLevel: 4,
      proficiencyScore: 92,
      classification: 'verified',
      verificationStatus: 'VERIFIED',
      aiCategory: 'Frontend Development',
      status: 'confirmed',
      assessmentMethod: 'verified',
      competencies: getStandardCompetencies('JavaScript').map((c) => ({
        ...c,
        status: 'competent',
        score: 92,
      })),
      evidence: [
        {
          evidenceType: 'CERTIFICATE',
          title: 'Chứng chỉ Modern JavaScript ES6+ & Clean Code',
          description: 'Hoàn thành khóa học chuyên sâu ES6+, Async/Await, Webpack và tối ưu bộ nhớ.',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 8 * 86400000),
          assessmentResult: {
            score: 92,
            rubric: 'Standard Technical Certification',
            feedback: 'Chứng chỉ hợp lệ, hoàn thành đầy đủ bài test kiểm tra.',
          },
        },
      ],
      verificationHistory: [
        {
          changedAt: new Date(Date.now() - 8 * 86400000),
          fromStatus: 'PENDING_REVIEW',
          toStatus: 'VERIFIED',
          changedBy: lecturer._id,
          reason: 'Xác thực chứng chỉ chuyên môn hợp lệ.',
        },
      ],
    },
    {
      skillName: 'HTML/CSS',
      proficiency: 'advanced',
      proficiencyLevel: 4,
      proficiencyScore: 90,
      classification: 'verified',
      verificationStatus: 'VERIFIED',
      aiCategory: 'Frontend Development',
      status: 'confirmed',
      assessmentMethod: 'verified',
      competencies: getStandardCompetencies('HTML/CSS').map((c) => ({
        ...c,
        status: 'competent',
        score: 90,
      })),
      evidence: [
        {
          evidenceType: 'PROJECT',
          title: 'Giao diện Responsive Tailwind CSS & UI Design',
          description: 'Thiết kế giao diện hỗ trợ Desktop, Tablet và Mobile hoàn toàn thích ứng.',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 12 * 86400000),
          assessmentResult: { score: 90, feedback: 'Responsive layout chuẩn UI/UX.' },
        },
      ],
    },

    // ✅ ASSESSED SKILLS (Đã đánh giá qua bài tập/quiz thực tế trong hệ thống)
    {
      skillName: 'Node.js',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 88,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Backend Development',
      status: 'confirmed',
      assessmentMethod: 'assignment_graded',
      competencies: getStandardCompetencies('Node.js').map((c) => ({
        ...c,
        status: ['Async/Await & Event Loop', 'Express Routing & Middleware'].includes(c.name) ? 'competent' : 'developing',
        score: 88,
      })),
      evidence: [
        {
          evidenceType: 'QUIZ_RESULT',
          title: 'Kết quả Quiz: Node.js Backend & Asynchronous Architecture',
          description: 'Hoạt động kiểm tra trắc nghiệm chuyên đề backend: Đạt 9/10 câu hỏi chính xác.',
          verificationStatus: 'ASSESSED',
          assessmentResult: {
            score: 90,
            rubric: 'Objective Assessment Rubric',
            feedback: 'Nắm vững luồng Event Loop và xử lý bất đồng bộ trong Node.js.',
            competenciesDemonstrated: ['Async/Await & Event Loop'],
          },
        },
      ],
      assessmentHistory: [
        {
          assessmentDate: new Date(Date.now() - 15 * 86400000),
          method: 'quiz_assessed',
          score: 90,
          rubric: 'Node.js Multiple Choice Test',
          proficiencyAssessed: 'intermediate',
          notes: 'Hoàn thành bài kiểm tra trực tuyến hệ thống.',
        },
      ],
    },
    {
      skillName: 'Express',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 85,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Backend Development',
      status: 'confirmed',
      assessmentMethod: 'quiz_assessed',
      competencies: getStandardCompetencies('Express').map((c) => ({ ...c, status: 'competent', score: 85 })),
      evidence: [
        {
          evidenceType: 'PROJECT_DESCRIPTION',
          title: 'Xây dựng Router & Middleware Authentication JWT',
          description: 'Hệ thống định tuyến API modular với Express Router và middleware bảo vệ phân quyền JWT.',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: {
            score: 85,
            rubric: 'Competency-based Natural Language Assessment',
            feedback: 'Bằng chứng thể hiện năng lực trong các chủ đề: Express Routing, Middleware Pipeline, JWT Security.',
            competenciesDemonstrated: ['Express Routing & Middleware'],
          },
        },
      ],
    },
    {
      skillName: 'MongoDB',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 85,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Database',
      status: 'confirmed',
      assessmentMethod: 'quiz_assessed',
      competencies: getStandardCompetencies('MongoDB').map((c) => ({ ...c, status: 'competent', score: 85 })),
      evidence: [
        {
          evidenceType: 'PROJECT',
          title: 'Mongoose Schemas & Aggregation Pipelines cho STE',
          description: 'Thiết kế 18 schemas Mongoose, đánh chỉ mục compound index và tối ưu truy vấn.',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: {
            score: 85,
            feedback: 'Thiết kế schema dữ liệu hợp lý, áp dụng indexing tối ưu.',
            competenciesDemonstrated: ['Document CRUD', 'Schema Modeling (Mongoose)'],
          },
        },
      ],
    },
    {
      skillName: 'SQL',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 82,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Database',
      status: 'confirmed',
      assessmentMethod: 'assignment_graded',
      competencies: getStandardCompetencies('SQL').map((c) => ({ ...c, status: 'competent', score: 82 })),
      evidence: [
        {
          evidenceType: 'ASSIGNMENT',
          title: 'Bài tập lớn DBI202: Thiết kế CSDL Quản lý Thư viện',
          description: 'Viết các câu lệnh SQL JOIN, GROUP BY, Window Functions và Transaction.',
          verificationStatus: 'ASSESSED',
          assessmentResult: { score: 82, feedback: 'Truy vấn chính xác, chuẩn hóa 3NF tốt.' },
        },
      ],
    },

    // 📝 SELF-REPORTED SKILLS (Tự khai báo & AI đề xuất)
    {
      skillName: 'TypeScript',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      aiCategory: 'Frontend Development',
      status: 'student_declared',
      assessmentMethod: 'self_reported',
      competencies: getStandardCompetencies('TypeScript'),
      evidence: [
        {
          evidenceType: 'MANUAL',
          title: 'Tự khai báo kinh nghiệm',
          description: 'Đã sử dụng TypeScript trong các dự án cá nhân để định nghĩa interfaces và generic types.',
          verificationStatus: 'SELF_REPORTED',
        },
      ],
    },
    {
      skillName: 'Git',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      aiCategory: 'Software Engineering',
      status: 'confirmed',
      assessmentMethod: 'self_reported',
      competencies: getStandardCompetencies('Git'),
      evidence: [
        {
          evidenceType: 'MANUAL',
          title: 'Quản lý mã nguồn nhóm',
          description: 'Sử dụng Git flow, tạo Pull Request và review mã nguồn cho nhóm.',
          verificationStatus: 'SELF_REPORTED',
        },
      ],
    },
    {
      skillName: 'Docker',
      proficiency: 'elementary',
      proficiencyLevel: 2,
      classification: 'self_reported',
      verificationStatus: 'AI_ANALYZED',
      aiConfidence: 0.94,
      aiCategory: 'DevOps & Cloud',
      status: 'ai_suggested',
      assessmentMethod: 'ai_extracted',
      competencies: getStandardCompetencies('Docker'),
      evidence: [
        {
          evidenceType: 'PROJECT_DESCRIPTION',
          title: 'AI trích xuất từ đề tài MERN',
          description: 'Đề cập Dockerfile cơ bản và Docker Compose chạy backend và MongoDB.',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: { score: 60, feedback: 'Mới làm quen với lệnh build và run cơ bản.' },
        },
      ],
    },
    {
      skillName: 'Python',
      proficiency: 'elementary',
      proficiencyLevel: 2,
      classification: 'self_reported',
      verificationStatus: 'MORE_EVIDENCE_REQUIRED',
      aiCategory: 'Artificial Intelligence',
      status: 'student_declared',
      assessmentMethod: 'self_reported',
      competencies: getStandardCompetencies('Python'),
      evidence: [], // ⚠️ Zero evidence -> Requiring evidence
    },
    {
      skillName: 'Figma',
      proficiency: 'elementary',
      proficiencyLevel: 2,
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      aiCategory: 'UI/UX Design',
      status: 'student_declared',
      assessmentMethod: 'self_reported',
      competencies: getStandardCompetencies('Figma'),
      evidence: [], // ⚠️ Zero evidence -> Requiring evidence
    },
  ];

  for (const s of s1Skills) {
    await StudentSkill.create({
      student: student1._id,
      ...s,
      lastAssessedAt: new Date(),
      isActive: true,
    });
  }
  console.log(`  ✓ Đã nạp ${s1Skills.length} kỹ năng cho Nguyễn Đại Đức: 3 Verified, 4 Assessed, 5 Self-reported (2 cần bằng chứng).\n`);

  // ─── 6. STUDENT 2: EVIDENCE-BASED SKILLS (LÊ THẢO NGUYÊN) ───────────────────
  console.log('📌 6. Nạp Hồ sơ Kỹ năng cho Lê Thảo Nguyên (AI & Data Science)...');
  await StudentSkill.deleteMany({ student: student2._id });

  const s2Skills = [
    // 🛡️ VERIFIED
    {
      skillName: 'Python',
      proficiency: 'advanced',
      proficiencyLevel: 4,
      proficiencyScore: 96,
      classification: 'verified',
      verificationStatus: 'VERIFIED',
      aiCategory: 'Artificial Intelligence',
      status: 'confirmed',
      assessmentMethod: 'verified',
      competencies: getStandardCompetencies('Python').map((c) => ({ ...c, status: 'mastered', score: 96 })),
      evidence: [
        {
          evidenceType: 'PROJECT',
          title: 'Hệ thống Phân loại Văn bản NLP Tiếng Việt với Python',
          description: 'Xây dựng pipeline thu thập dữ liệu, trích xuất đặc trưng TF-IDF và huấn luyện mô hình phân loại.',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 6 * 86400000),
          assessmentResult: { score: 96, feedback: 'Mã nguồn Python tối ưu, áp dụng OOP và module rõ ràng.' },
        },
      ],
    },
    {
      skillName: 'Machine Learning',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 90,
      classification: 'verified',
      verificationStatus: 'VERIFIED',
      aiCategory: 'Artificial Intelligence',
      status: 'confirmed',
      assessmentMethod: 'verified',
      competencies: getStandardCompetencies('Machine Learning').map((c) => ({ ...c, status: 'competent', score: 90 })),
      evidence: [
        {
          evidenceType: 'ASSIGNMENT',
          title: 'Bài tập Lab 2 AIL303m: Scikit-Learn Classification',
          description: 'Đạt điểm 9.2/10 môn AIL303m.',
          verificationStatus: 'VERIFIED',
          reviewer: lecturer._id,
          reviewedAt: new Date(Date.now() - 14 * 86400000),
          linkedEntity: { entityType: 'Submission', entityId: sub2._id },
          assessmentResult: { score: 92, feedback: 'Mô hình đạt độ chính xác 91.5% trên tập kiểm thử.' },
        },
      ],
    },

    // ✅ ASSESSED
    {
      skillName: 'Pandas',
      proficiency: 'advanced',
      proficiencyLevel: 4,
      proficiencyScore: 92,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Artificial Intelligence',
      status: 'confirmed',
      assessmentMethod: 'quiz_assessed',
      competencies: getStandardCompetencies('Pandas').map((c) => ({ ...c, status: 'competent', score: 92 })),
      evidence: [
        {
          evidenceType: 'QUIZ_RESULT',
          title: 'Kiểm tra trắc nghiệm Pandas & Data Wrangling',
          description: 'Đạt 10/10 câu hỏi trắc nghiệm thực hành.',
          verificationStatus: 'ASSESSED',
          assessmentResult: { score: 100, feedback: 'Thành thạo DataFrame, Series và groupby aggregation.' },
        },
      ],
    },
    {
      skillName: 'SQL',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 88,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Database',
      status: 'confirmed',
      assessmentMethod: 'quiz_assessed',
      competencies: getStandardCompetencies('SQL').map((c) => ({ ...c, status: 'competent', score: 88 })),
      evidence: [
        {
          evidenceType: 'PROJECT_DESCRIPTION',
          title: 'Truy vấn & Trích xuất tập dữ liệu Data Warehouse',
          description: 'Viết các câu lệnh truy vấn phức tạp kết nối nhiều bảng dữ liệu phục vụ huấn luyện mô hình.',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: { score: 88, feedback: 'Sử dụng thành thạo Inner/Outer Join và Aggregate functions.' },
        },
      ],
    },
    {
      skillName: 'Deep Learning',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      proficiencyScore: 85,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      aiCategory: 'Artificial Intelligence',
      status: 'confirmed',
      assessmentMethod: 'assignment_graded',
      competencies: getStandardCompetencies('Deep Learning').map((c) => ({ ...c, status: 'competent', score: 85 })),
      evidence: [
        {
          evidenceType: 'PROJECT',
          title: 'Mạng Nơ-ron Phân loại Ảnh với PyTorch',
          description: 'Huấn luyện mạng CNN cơ bản nhận diện hình ảnh.',
          verificationStatus: 'ASSESSED',
          assessmentResult: { score: 85, feedback: 'Hiểu rõ hàm mất mát (loss function) và backpropagation.' },
        },
      ],
    },

    // 📝 SELF-REPORTED
    {
      skillName: 'TensorFlow',
      proficiency: 'elementary',
      proficiencyLevel: 2,
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      aiCategory: 'Artificial Intelligence',
      status: 'student_declared',
      competencies: getStandardCompetencies('TensorFlow'),
      evidence: [],
    },
    {
      skillName: 'Git',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      aiCategory: 'Software Engineering',
      status: 'confirmed',
      competencies: getStandardCompetencies('Git'),
      evidence: [
        {
          evidenceType: 'MANUAL',
          title: 'Khai báo kỹ năng Git',
          description: 'Quản lý kho mã nguồn dự án học máy trên GitHub.',
          verificationStatus: 'SELF_REPORTED',
        },
      ],
    },
  ];

  for (const s of s2Skills) {
    await StudentSkill.create({
      student: student2._id,
      ...s,
      lastAssessedAt: new Date(),
      isActive: true,
    });
  }
  console.log(`  ✓ Đã nạp ${s2Skills.length} kỹ năng cho Lê Thảo Nguyên: 2 Verified, 3 Assessed, 2 Self-reported.\n`);

  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🎉 SEED DỮ LIỆU DEMO THÀNH CÔNG RỰC RỠ!');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('📋 THÔNG TIN 3 TÀI KHOẢN ĐỂ BẠN THUYẾT TRÌNH VÀ DEMO:');
  console.log('────────────────────────────────────────────────────────────────────');
  console.log('1️⃣  TÀI KHOẢN SINH VIÊN 1 (WEB FULLSTACK / MERN):');
  console.log('    • Họ tên:   Nguyễn Đại Đức');
  console.log('    • Email:    thuannmhe161234@fpt.edu.vn');
  console.log('    • Mật khẩu: Fptu@2026');
  console.log('    • Dữ liệu:  12 Kỹ năng (3 Verified, 4 Assessed, 5 Self-reported)');
  console.log('                4 Khóa học ghi danh (FER202, SWP391, PRJ301, DBI202)');
  console.log('                Quiz React đạt 100%, Bài nộp FER202 đạt 9.5/10');
  console.log('────────────────────────────────────────────────────────────────────');
  console.log('2️⃣  TÀI KHOẢN SINH VIÊN 2 (AI & DATA SCIENCE):');
  console.log('    • Họ tên:   Lê Thảo Nguyên');
  console.log('    • Email:    nguyenltse160877@fpt.edu.vn');
  console.log('    • Mật khẩu: Fptu@2026');
  console.log('    • Dữ liệu:  7 Kỹ năng AI/Data (2 Verified, 3 Assessed, 2 Self-reported)');
  console.log('                Khóa học AIL303m, MAS291; Quiz Python 100%, Lab AI 9.2/10');
  console.log('────────────────────────────────────────────────────────────────────');
  console.log('3️⃣  TÀI KHOẢN GIẢNG VIÊN & REVIEWER (THẨM ĐỊNH BẰNG CHỨNG):');
  console.log('    • Họ tên:   ThS. Hoàng Đình Quang');
  console.log('    • Email:    quanghd@fe.edu.vn');
  console.log('    • Mật khẩu: Fptu@2026');
  console.log('    • Quyền:    Giảng viên bộ môn Web, có quyền thẩm định (Verified / Reject)');
  console.log('                bằng chứng năng lực của sinh viên và chấm điểm rubric');
  console.log('════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi khi nạp dữ liệu:', err);
  process.exit(1);
});
