/**
 * SkillTemplateService
 * Manages database-backed Project Skill Templates for Unified Project Skill Analyzer.
 */
const mongoose = require('mongoose');
const SkillTemplate = require('../models/skill-template.model');
const { normalizeSkill } = require('../recommendation/skill-catalog');

const DEFAULT_TEMPLATES = [
  {
    code: 'web_fullstack_mern',
    title: '🌐 Web Fullstack (MERN)',
    category: 'Web Development',
    description: 'Xây dựng hệ sinh thái sinh viên thông minh với React, Node.js, Express, MongoDB, TypeScript và Docker.',
    sampleProjectText:
      'Dự án phát triển nền tảng Web Fullstack phục vụ học tập và cộng tác sinh viên. Phía frontend xây dựng Single Page Application bằng React, TypeScript, Tailwind CSS và Redux Toolkit. Phía backend sử dụng Node.js, Express REST API, xử lý JWT authentication và kết nối cơ sở dữ liệu MongoDB. Triển khai đóng gói ứng dụng với Docker và quản lý mã nguồn bằng Git flow.',
    roleRequirements: ['Frontend Developer', 'Backend Developer', 'DevOps / Fullstack'],
    tags: ['mern', 'react', 'node', 'mongodb', 'docker', 'web'],
    requiredSkills: [
      {
        name: 'React',
        normalizedName: 'react',
        category: 'Frontend Development',
        requiredLevel: 'advanced',
        requiredProficiencyNumber: 4,
        importance: 'high',
        weight: 1.5,
        requiredCompetencies: ['Components & Props', 'Hooks & Context API', 'State Management', 'REST API Integration'],
        reasoning: 'Giao diện chính yêu cầu SPA tương tác mượt mà, quản lý trạng thái phức tạp.',
      },
      {
        name: 'Node.js',
        normalizedName: 'node.js',
        category: 'Backend Development',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'high',
        weight: 1.3,
        requiredCompetencies: ['Async/Await & Event Loop', 'Express Routing', 'JWT Authentication', 'Error Handling'],
        reasoning: 'Nền tảng backend xử lý logic nghiệp vụ và xác thực phân quyền.',
      },
      {
        name: 'Express',
        normalizedName: 'express',
        category: 'Backend Development',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['RESTful Endpoints', 'Middleware Pipeline', 'Input Validation'],
        reasoning: 'Framework định tuyến API chuẩn cho Node.js.',
      },
      {
        name: 'MongoDB',
        normalizedName: 'mongodb',
        category: 'Database',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['Mongoose Schemas', 'Aggregation Pipeline', 'Indexing & Query Optimization'],
        reasoning: 'Cơ sở dữ liệu NoSQL lưu trữ hồ sơ, tài liệu và hoạt động nhóm.',
      },
      {
        name: 'TypeScript',
        normalizedName: 'typescript',
        category: 'Frontend Development',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['Generics & Utility Types', 'Interface Modeling', 'Type Safety'],
        reasoning: 'Đảm bảo code an toàn kiểu cho cả client và shared contract.',
      },
      {
        name: 'Docker',
        normalizedName: 'docker',
        category: 'DevOps & Cloud',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'low',
        weight: 0.8,
        requiredCompetencies: ['Dockerfile Construction', 'Docker Compose Orchestration', 'Multi-stage Builds'],
        reasoning: 'Đóng gói môi trường đồng nhất cho phát triển và kiểm thử.',
      },
    ],
  },
  {
    code: 'ai_data_science',
    title: '🤖 Trí tuệ Nhân tạo & Xử lý Dữ liệu',
    category: 'Artificial Intelligence',
    description: 'Hệ thống gợi ý đề tài và ghép nhóm tự động bằng mô hình AI & Học máy.',
    sampleProjectText:
      'Dự án nghiên cứu và xây dựng mô hình AI gợi ý đồ án tốt nghiệp và ghép nhóm tự động cho sinh viên. Hệ thống sử dụng Python và Pandas để tiền xử lý dữ liệu sinh viên từ cơ sở dữ liệu SQL. Sau đó áp dụng các thuật toán Machine Learning (Scikit-Learn) và mạng nơ-ron Deep Learning để mô hình hóa sự tương thích kỹ năng và đánh giá hiệu quả ghép đội ngũ.',
    roleRequirements: ['AI Engineer', 'Data Scientist', 'MLOps Engineer'],
    tags: ['ai', 'python', 'machine learning', 'deep learning', 'sql'],
    requiredSkills: [
      {
        name: 'Python',
        normalizedName: 'python',
        category: 'Artificial Intelligence',
        requiredLevel: 'advanced',
        requiredProficiencyNumber: 4,
        importance: 'high',
        weight: 1.5,
        requiredCompetencies: ['Advanced Data Structures', 'Pandas & NumPy', 'Data Preprocessing', 'OOP & Modular Code'],
        reasoning: 'Ngôn ngữ cốt lõi cho toàn bộ pipeline dữ liệu và huấn luyện mô hình.',
      },
      {
        name: 'Machine Learning',
        normalizedName: 'machine learning',
        category: 'Artificial Intelligence',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'high',
        weight: 1.3,
        requiredCompetencies: ['Supervised Learning', 'Feature Engineering', 'Model Evaluation & Cross-Validation'],
        reasoning: 'Huấn luyện các mô hình phân loại và dự đoán độ tương thích nhóm.',
      },
      {
        name: 'Deep Learning',
        normalizedName: 'deep learning',
        category: 'Artificial Intelligence',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.2,
        requiredCompetencies: ['Neural Networks Architectures', 'Embeddings & Vector Representations', 'PyTorch / TensorFlow'],
        reasoning: 'Tạo embedding vector biểu diễn hồ sơ sinh viên và yêu cầu dự án.',
      },
      {
        name: 'SQL',
        normalizedName: 'sql',
        category: 'Database',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['Complex Joins', 'Aggregations', 'Data Extraction & Cleaning'],
        reasoning: 'Truy vấn và trích xuất tập dữ liệu huấn luyện từ cơ sở dữ liệu quan hệ.',
      },
      {
        name: 'Git',
        normalizedName: 'git',
        category: 'Software Engineering',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'low',
        weight: 0.8,
        requiredCompetencies: ['Branching & Merging', 'Code Reviews', 'Version Control'],
        reasoning: 'Quản lý mã nguồn thử nghiệm và chia sẻ dataset định danh.',
      },
    ],
  },
  {
    code: 'mobile_app_react_native',
    title: '📱 Mobile App (React Native)',
    category: 'Mobile Development',
    description: 'Ứng dụng di động sinh viên hỗ trợ học tập, tra cứu lịch và thông báo thời gian thực.',
    sampleProjectText:
      'Đồ án xây dựng ứng dụng di động hỗ trợ học tập cho sinh viên. Giai đoạn đầu tập trung nghiên cứu trải nghiệm người dùng, thiết kế Design System và Wireframe prototype tương tác trên Figma. Giai đoạn hai lập trình ứng dụng di động đa nền tảng bằng React Native và TypeScript, tích hợp Firebase Authentication và RESTful API.',
    roleRequirements: ['Mobile Developer', 'UI/UX Designer'],
    tags: ['mobile', 'react native', 'typescript', 'figma'],
    requiredSkills: [
      {
        name: 'React',
        normalizedName: 'react',
        category: 'Frontend Development',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'high',
        weight: 1.4,
        requiredCompetencies: ['React Native Components', 'Navigation Stack', 'Hooks & State'],
        reasoning: 'Nền tảng lập trình ứng dụng di động React Native.',
      },
      {
        name: 'JavaScript',
        normalizedName: 'javascript',
        category: 'Frontend Development',
        requiredLevel: 'advanced',
        requiredProficiencyNumber: 4,
        importance: 'high',
        weight: 1.3,
        requiredCompetencies: ['ES6+ Syntaxes', 'Asynchronous JS', 'Mobile Lifecycle'],
        reasoning: 'Xử lý logic mượt mà trên thiết bị di động.',
      },
      {
        name: 'TypeScript',
        normalizedName: 'typescript',
        category: 'Frontend Development',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['Type Safety', 'Component Props Typing'],
        reasoning: 'Tránh lỗi runtime trên thiết bị di động.',
      },
      {
        name: 'Figma',
        normalizedName: 'figma',
        category: 'UI/UX Design',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 0.9,
        requiredCompetencies: ['Mobile Wireframing', 'Interactive Prototypes', 'Design System'],
        reasoning: 'Thiết kế chuẩn UI/UX theo tiêu chuẩn iOS và Android.',
      },
    ],
  },
  {
    code: 'cloud_devops',
    title: '☁️ Cloud & DevOps Engineering',
    category: 'DevOps & Cloud',
    description: 'Triển khai hạ tầng CI/CD, Containerization và giám sát hệ thống học tập tự động.',
    sampleProjectText:
      'Dự án thiết lập kiến trúc triển khai microservices cho nền tảng giáo dục. Đóng gói dịch vụ bằng Docker, triển khai cluster trên Kubernetes, xây dựng pipeline tự động hóa CI/CD với GitHub Actions và tích hợp hệ thống giám sát Prometheus / Grafana.',
    roleRequirements: ['DevOps Engineer', 'Cloud Architect'],
    tags: ['devops', 'cloud', 'docker', 'kubernetes', 'ci/cd'],
    requiredSkills: [
      {
        name: 'Docker',
        normalizedName: 'docker',
        category: 'DevOps & Cloud',
        requiredLevel: 'advanced',
        requiredProficiencyNumber: 4,
        importance: 'high',
        weight: 1.5,
        requiredCompetencies: ['Container Optimization', 'Multi-stage Builds', 'Networking & Volumes'],
        reasoning: 'Đóng gói toàn bộ services thành container hiệu năng cao.',
      },
      {
        name: 'Kubernetes',
        normalizedName: 'kubernetes',
        category: 'DevOps & Cloud',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'high',
        weight: 1.3,
        requiredCompetencies: ['Deployments & Services', 'Ingress Controller', 'ConfigMaps & Secrets'],
        reasoning: 'Điều phối và tự động co giãn các dịch vụ ứng dụng.',
      },
      {
        name: 'Git',
        normalizedName: 'git',
        category: 'Software Engineering',
        requiredLevel: 'intermediate',
        requiredProficiencyNumber: 3,
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: ['GitFlow', 'CI Triggers', 'Release Tags'],
        reasoning: 'Kích hoạt pipeline CI/CD tự động khi có commit.',
      },
    ],
  },
];

/**
 * Seed or refresh default templates in MongoDB.
 */
const ensureDefaultTemplates = async () => {
  if (mongoose.connection.readyState !== 1) return;
  for (const t of DEFAULT_TEMPLATES) {
    const existing = await SkillTemplate.findOne({ code: t.code });
    if (!existing) {
      await SkillTemplate.create(t);
    }
  }
};

/**
 * List all active templates.
 */
const getTemplates = async () => {
  if (mongoose.connection.readyState !== 1) {
    return DEFAULT_TEMPLATES;
  }
  await ensureDefaultTemplates();
  return SkillTemplate.find({ isActive: true }).sort({ category: 1, title: 1 }).lean();
};

/**
 * Get template by ID or code.
 */
const getTemplateByIdOrCode = async (idOrCode) => {
  const code = (idOrCode || '').toLowerCase();
  const fallback = DEFAULT_TEMPLATES.find((t) => t.code === code);
  if (mongoose.connection.readyState !== 1) {
    return fallback || null;
  }
  await ensureDefaultTemplates();
  const query = idOrCode.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrCode }
    : { code };
  const found = await SkillTemplate.findOne(query).lean();
  return found || fallback || null;
};

module.exports = {
  DEFAULT_TEMPLATES,
  ensureDefaultTemplates,
  getTemplates,
  getTemplateByIdOrCode,
};
