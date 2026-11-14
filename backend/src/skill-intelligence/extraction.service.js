/**
 * SkillExtractionService
 * Extracts skills from free text using LLM (Gemini, Claude, OpenAI)
 * with robust rule-based NLP extraction fallback when LLM is unavailable or unconfigured.
 * Also performs Deep Gap Analysis against the student's profile and provides
 * comprehensive remediation packages (Courses, Study Materials, YouTube Video Lessons, and Quizzes).
 */
const { completeJson, isLlmEnabled } = require('../recommendation/llm/client');
const { normalizeMany, normalizeProficiency } = require('./normalization.service');
const { classifyMany } = require('./classification.service');
const { Course, Material, Quiz, StudentSkill, Enrollment } = require('../models');

// ─── JSON Schema for LLM structured output ──────────────────────────────────
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Tên kỹ năng (tiếng Anh hoặc tiếng Việt)' },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: '0-1 mức độ chắc chắn trích xuất',
          },
          evidence: { type: 'string', description: 'Đoạn văn bản làm căn cứ' },
          suggestedProficiency: {
            type: 'string',
            enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
          },
          category: { type: 'string', description: 'Danh mục kỹ năng gợi ý' },
          reasoning: { type: 'string', description: 'Giải thích tại sao kỹ năng này được trích xuất' },
        },
        required: ['name', 'confidence', 'evidence', 'suggestedProficiency'],
      },
    },
  },
  required: ['skills'],
};

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn kỹ thuật và kiến trúc sư hệ thống.
Nhiệm vụ: Phân tích văn bản mô tả dự án / đề tài / CV và trích xuất danh sách tất cả các kỹ năng công nghệ, công cụ, ngôn ngữ và nền tảng cần thiết.
Quy tắc:
1. Chỉ trích xuất kỹ năng có bằng chứng trong văn bản.
2. Chuẩn hóa tên kỹ năng theo tiếng Anh kỹ thuật (React, Node.js, Python, TypeScript, Docker, MongoDB...).
3. Gợi ý mức độ thành thạo cần thiết cho dự án: 'elementary', 'intermediate', hoặc 'advanced'.
Trả về JSON đúng schema.`;

// ─── Rule-based Pattern Dictionary for Offline / Non-LLM Extraction ──────────
const SKILL_PATTERNS = [
  // Frontend
  { name: 'React', regex: /\b(react|reactjs|react\.js)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'TypeScript', regex: /\b(typescript|ts)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'JavaScript', regex: /\b(javascript|es[5-9]|es20\d\d|js)\b/i, category: 'Frontend Development', defaultLevel: 'advanced' },
  { name: 'HTML/CSS', regex: /\b(html5?|css3?|html\/css)\b/i, category: 'Frontend Development', defaultLevel: 'advanced' },
  { name: 'Tailwind CSS', regex: /\b(tailwind(\s*css)?)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Vue', regex: /\b(vue|vuejs|vue\.js)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Angular', regex: /\b(angular|angularjs)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Next.js', regex: /\b(next|nextjs|next\.js)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Redux', regex: /\b(redux(\s*toolkit)?)\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Bootstrap', regex: /\bbootstrap\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Vite', regex: /\bvite\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },
  { name: 'Webpack', regex: /\bwebpack\b/i, category: 'Frontend Development', defaultLevel: 'intermediate' },

  // Backend
  { name: 'Node.js', regex: /\b(node|nodejs|node\.js)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Express', regex: /\b(express|expressjs|express\.js)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'NestJS', regex: /\b(nest|nestjs)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Java', regex: /\bjava\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Spring Boot', regex: /\b(spring(\s*boot)?)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'C#', regex: /\b(c#|c\s*sharp)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: '.NET', regex: /\b(\.net(\s*core)?|asp\.net|dotnet)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Python', regex: /\bpython\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'Django', regex: /\bdjango\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Flask', regex: /\bflask\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'FastAPI', regex: /\bfastapi\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'PHP', regex: /\bphp\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Laravel', regex: /\blaravel\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Go', regex: /\b(golang|go\s*lang)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'REST API', regex: /\b(rest(ful)?\s*api|restful)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'GraphQL', regex: /\bgraphql\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },
  { name: 'Microservices', regex: /\b(microservices?|vi dịch vụ)\b/i, category: 'Backend Development', defaultLevel: 'intermediate' },

  // Database
  { name: 'MongoDB', regex: /\b(mongodb|mongo)\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'MySQL', regex: /\bmysql\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'PostgreSQL', regex: /\b(postgres|postgresql)\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'SQL Server', regex: /\b(sql\s*server|mssql)\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'SQL', regex: /\b(sql|cơ sở dữ liệu|database)\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'Redis', regex: /\bredis\b/i, category: 'Database', defaultLevel: 'intermediate' },
  { name: 'Firebase', regex: /\bfirebase\b/i, category: 'Database', defaultLevel: 'intermediate' },

  // DevOps & Cloud
  { name: 'Docker', regex: /\b(docker|container(ize)?)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'Kubernetes', regex: /\b(kubernetes|k8s)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'Git', regex: /\b(git|github|gitlab)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'CI/CD', regex: /\b(ci\s*\/\s*cd|github\s*actions|jenkins)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'Linux', regex: /\b(linux|ubuntu)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'AWS', regex: /\b(aws|amazon web services)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },
  { name: 'GCP', regex: /\b(gcp|google cloud)\b/i, category: 'DevOps & Cloud', defaultLevel: 'intermediate' },

  // AI & Data Science
  { name: 'Machine Learning', regex: /\b(machine\s*learning|học máy|ml)\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'Deep Learning', regex: /\b(deep\s*learning|học sâu|mạng nơ-ron|neural\s*network)\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'TensorFlow', regex: /\btensorflow\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'PyTorch', regex: /\bpytorch\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'Pandas', regex: /\bpandas\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'Scikit-Learn', regex: /\b(scikit-?learn|sklearn)\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },
  { name: 'Data Analysis', regex: /\b(data\s*analysis|xử lý dữ liệu|phân tích dữ liệu)\b/i, category: 'Artificial Intelligence', defaultLevel: 'intermediate' },

  // Mobile
  { name: 'React Native', regex: /\breact\s*native\b/i, category: 'Mobile Development', defaultLevel: 'intermediate' },
  { name: 'Flutter', regex: /\bflutter\b/i, category: 'Mobile Development', defaultLevel: 'intermediate' },
  { name: 'Kotlin', regex: /\bkotlin\b/i, category: 'Mobile Development', defaultLevel: 'intermediate' },
  { name: 'Swift', regex: /\bswift\b/i, category: 'Mobile Development', defaultLevel: 'intermediate' },

  // UI/UX
  { name: 'Figma', regex: /\bfigma\b/i, category: 'UI/UX Design', defaultLevel: 'intermediate' },
  { name: 'UI/UX', regex: /\b(ui\s*\/\s*ux|ux\s*\/\s*ui|wireframe|prototype|design\s*system)\b/i, category: 'UI/UX Design', defaultLevel: 'intermediate' },
  { name: 'Photoshop', regex: /\bphotoshop\b/i, category: 'UI/UX Design', defaultLevel: 'elementary' },
  { name: 'Canva', regex: /\bcanva\b/i, category: 'UI/UX Design', defaultLevel: 'elementary' },
];

// ─── Curated Remediation Knowledge Base (Courses, Materials, YouTube, Quizzes) ─
const REMEDIATION_KNOWLEDGE_BASE = {
  react: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: 'Tài liệu Chuyên sâu React Hooks, State & Context API', desc: 'Hướng dẫn xây dựng Single Page Application hiện đại với React và Tailwind' },
    ],
    youtube: {
      title: 'Khóa học ReactJS Toàn Diện Từ Cơ Bản Đến Nâng Cao',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=x0fSBAgBrOQ',
      videoId: 'x0fSBAgBrOQ',
      duration: '12 giờ • 85 bài giảng',
    },
    quizTitle: 'Trắc nghiệm Chuyên sâu React Hooks & State Management',
    practiceQuestions: [
      {
        question: 'Hook nào trong React được sử dụng để quản lý side-effects như fetch API hay subscribe event?',
        options: ['useState', 'useEffect', 'useMemo', 'useRef'],
        answer: 1,
        explanation: 'useEffect được thực thi sau khi component render để xử lý các side-effects.',
      },
      {
        question: 'Để tránh re-render không cần thiết khi truyền callback xuống component con, ta dùng hook nào?',
        options: ['useCallback', 'useContext', 'useReducer', 'useLayoutEffect'],
        answer: 0,
        explanation: 'useCallback trả về một memoized version của callback chỉ thay đổi khi dependencies đổi.',
      },
    ],
  },
  'node.js': {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Java Web & Dịch vụ Backend' },
    materials: [
      { title: 'Cẩm nang Xây dựng RESTful API chuẩn MVC với Node.js & Express', desc: 'Middleware, JWT Authentication, Error handling và tối ưu I/O bất đồng bộ' },
    ],
    youtube: {
      title: 'Lập Trình RESTful API Với Node.js & Express Từ Số 0',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=1F2W96eK4qg',
      videoId: '1F2W96eK4qg',
      duration: '10 giờ • 45 bài giảng',
    },
    quizTitle: 'Kiểm tra Kiến thức Node.js & RESTful API',
    practiceQuestions: [
      {
        question: 'Node.js hoạt động dựa trên cơ chế nào để xử lý đồng thời nhiều kết nối I/O?',
        options: ['Đa luồng đồng bộ', 'Event Loop & Non-blocking I/O', 'Tiến trình con độc lập', 'Web Worker'],
        answer: 1,
        explanation: 'Node.js sử dụng kiến trúc Single-threaded Event Loop phối hợp Non-blocking I/O.',
      },
    ],
  },
  express: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Backend Service' },
    materials: [
      { title: 'Thiết kế RESTful API chuẩn REST với Express Router & Middleware', desc: 'Bảo mật CORS, Helmet, Rate Limiter và JWT authentication' },
    ],
    youtube: {
      title: 'Express.js Crash Course - Xây dựng Backend API chuyên nghiệp',
      channel: 'Traversy Media / Lập trình Việt',
      url: 'https://www.youtube.com/watch?v=L72fhGm1tfE',
      videoId: 'L72fhGm1tfE',
      duration: '3 giờ • Thực chiến API',
    },
    quizTitle: 'Trắc nghiệm Express Middleware & Routing',
  },
  typescript: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web Nâng cao' },
    materials: [
      { title: 'Tài liệu TypeScript Clean Code: Generics, Interfaces & Type Utility', desc: 'Cách định kiểu chặt chẽ cho API payload, Redux state và React Props' },
    ],
    youtube: {
      title: 'TypeScript Siêu Nhanh & Thực Chiến Cho Web Developer',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=BCg4U1FzODs',
      videoId: 'BCg4U1FzODs',
      duration: '2 giờ • 18 bài giảng',
    },
    quizTitle: 'Kiểm tra Kiến thức TypeScript Typings & Generics',
  },
  mongodb: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    materials: [
      { title: 'Chương 2 - Mô hình quan hệ và chuẩn hóa', desc: 'Tài liệu về mô hình dữ liệu quan hệ, khóa chính, khóa ngoại và các dạng chuẩn' },
      { title: 'Cẩm nang NoSQL MongoDB: Schema Modeling & Aggregation Pipeline', desc: 'Index, replica set và tối ưu hóa truy vấn khối lượng lớn' },
    ],
    youtube: {
      title: 'Lập trình Cơ sở dữ liệu NoSQL MongoDB & Mongoose Thực Chiến',
      channel: 'TechMaster Việt Nam',
      url: 'https://www.youtube.com/watch?v=ofme2o29ngU',
      videoId: 'ofme2o29ngU',
      duration: '3 giờ • Thực hành CRUD & Indexing',
    },
    quizTitle: 'Kiểm tra nhanh về Cơ sở dữ liệu',
  },
  sql: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    materials: [
      { title: 'Chương 2 - Mô hình quan hệ và chuẩn hóa', desc: 'Giáo trình chuẩn DBI202' },
    ],
    youtube: {
      title: 'Truy Vấn Dữ Liệu SQL Từ Cơ Bản Đến Nâng Cao (Chuẩn DBI202)',
      channel: 'Lập Trình Cuộc Sống',
      url: 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
      videoId: 'HXV3zeRR3h4',
      duration: '4 giờ • Join, Group By, Subquery',
    },
    quizTitle: 'Kiểm tra nhanh về Cơ sở dữ liệu',
  },
  docker: {
    courseCode: 'IAO202',
    courseFallback: { code: 'IAO202', title: 'Nhập môn An toàn thông tin & Hạ tầng' },
    materials: [
      { title: 'Cẩm nang Containerization với Docker & Docker-Compose', desc: 'Tạo Dockerfile đa tầng, tối ưu image size và quản lý mạng container' },
    ],
    youtube: {
      title: 'Docker & Docker-Compose Toàn Tập Cho Lập Trình Viên',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=pg19Z8LL06w',
      videoId: 'pg19Z8LL06w',
      duration: '2 giờ 30 phút • Containerize Node & React',
    },
    quizTitle: 'Trắc nghiệm Docker & Container Basics',
    practiceQuestions: [
      {
        question: 'Lệnh nào trong Dockerfile được dùng để chỉ định command chạy chính khi container khởi động?',
        options: ['RUN', 'CMD', 'ENV', 'EXPOSE'],
        answer: 1,
        explanation: 'CMD (hoặc ENTRYPOINT) quy định tiến trình chính sẽ chạy khi container start.',
      },
    ],
  },
  python: {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: 'Chương 1 - Giới thiệu học máy', desc: 'Bài giảng tổng quan về học máy, học có giám sát và học không giám sát' },
    ],
    youtube: {
      title: 'Khóa học Lập trình Python Cơ Bản Đến Nâng Cao Cho Người Mới Bắt Đầu',
      channel: 'Kteam',
      url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
      videoId: 'kqtD5dpn9C8',
      duration: '8 giờ • Thực hành bài bản',
    },
    quizTitle: 'Trắc nghiệm Ngôn ngữ Lập trình Python & Cấu trúc Dữ liệu',
  },
  'machine learning': {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: 'Chương 1 - Giới thiệu học máy', desc: 'Bài giảng tổng quan về học máy, học có giám sát và học không giám sát' },
    ],
    youtube: {
      title: 'Học Máy Machine Learning & Xử Lý Dữ Liệu Python Từ Cơ Bản',
      channel: 'Dạy Nhau Học',
      url: 'https://www.youtube.com/watch?v=GwIo3g5ChTQ',
      videoId: 'GwIo3g5ChTQ',
      duration: '6 giờ • Scikit-Learn & Pandas',
    },
    quizTitle: 'Trắc nghiệm Nền tảng Học máy & Đánh giá Mô hình',
  },
  'deep learning': {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: 'Chương 1 - Giới thiệu học máy', desc: 'Mạng nơ-ron nhân tạo và tối ưu hóa hàm mất mát' },
    ],
    youtube: {
      title: 'Deep Learning & Neural Networks Cơ Bản Với PyTorch / TensorFlow',
      channel: 'Mì AI',
      url: 'https://www.youtube.com/watch?v=aircAruvnKk',
      videoId: 'aircAruvnKk',
      duration: '5 giờ • CNN, RNN',
    },
    quizTitle: 'Kiểm tra Kiến thức Mạng Nơ-ron & Học sâu',
  },
  figma: {
    courseCode: 'GDE101',
    courseFallback: { code: 'GDE101', title: 'Nguyên lý thiết kế đồ họa' },
    materials: [
      { title: 'Tài liệu Nguyên lý Thiết kế Giao diện Người dùng UX/UI', desc: 'Bố cục, quy tắc 60-30-10, typography và design system' },
    ],
    youtube: {
      title: 'Thiết Kế UI/UX Với Figma: Wireframe, Auto-layout & Interactive Prototype',
      channel: 'Figma Việt Nam',
      url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
      videoId: 'FTFaQWZBqQ8',
      duration: '3 giờ 45 phút • Design System',
    },
    quizTitle: 'Trắc nghiệm Nguyên lý Thiết kế UI/UX',
  },
  git: {
    courseCode: 'PRF192',
    courseFallback: { code: 'PRF192', title: 'Lập trình cơ bản với C' },
    materials: [
      { title: 'Cẩm nang Git Flow & Quy trình Làm việc Nhóm Hiệu quả', desc: 'Branching, Pull Request, Rebase vs Merge và giải quyết xung đột' },
    ],
    youtube: {
      title: 'Git & GitHub Thực Chiến: Quản Lý Source Code & Nhánh Nhóm',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      videoId: 'RGOj5yH7evk',
      duration: '1 giờ 15 phút • Git Flow & Conflict Resolution',
    },
    quizTitle: 'Kiểm tra Kỹ năng Git & GitHub Trong Dự án',
  },
};

const PROFICIENCY_NUMS = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  advanced: 4,
  expert: 5,
};

const PROFICIENCY_LABELS = {
  1: 'Mới bắt đầu',
  2: 'Cơ bản',
  3: 'Trung cấp',
  4: 'Nâng cao',
  5: 'Chuyên gia',
};

/**
 * Trích xuất kỹ năng bằng NLP từ điển & ngữ cảnh câu (Không phụ thuộc LLM)
 */
const extractSkillsWithRules = (text) => {
  const sentences = String(text || '')
    .split(/[.\n;!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const advancedRegex = /(thành thạo|chuyên sâu|nâng cao|hơn \d+ năm|nhiều năm|advanced|expert|master|tối ưu|chủ chốt|lead)/i;
  const elementaryRegex = /(cơ bản|mới học|tiếp cận|tìm hiểu|mới bắt đầu|beginner|elementary|biết qua|nhập môn)/i;

  const foundSkills = [];
  const seen = new Set();

  for (const item of SKILL_PATTERNS) {
    if (seen.has(item.name)) continue;

    // Tìm câu có đề cập kỹ năng
    const matchedSentence = sentences.find((s) => item.regex.test(s));
    if (matchedSentence) {
      seen.add(item.name);

      // Dự đoán mức độ từ ngữ cảnh câu
      let suggestedProficiency = item.defaultLevel;
      if (advancedRegex.test(matchedSentence)) {
        suggestedProficiency = 'advanced';
      } else if (elementaryRegex.test(matchedSentence)) {
        suggestedProficiency = 'elementary';
      }

      foundSkills.push({
        name: item.name,
        confidence: 0.95,
        evidence: matchedSentence,
        suggestedProficiency,
        category: item.category,
        reasoning: `Phát hiện kỹ năng "${item.name}" được đề cập trong ngữ cảnh: "${matchedSentence.slice(0, 100)}"`,
      });
    }
  }

  return foundSkills;
};

/**
 * Phân tích khoảng cách năng lực & tạo gói tài nguyên cải thiện toàn diện
 */
const performReadinessAssessment = async (extractedSkills, studentId) => {
  if (!studentId || !extractedSkills.length) return null;

  try {
    // 1. Tải kỹ năng hiện tại của sinh viên
    const studentSkills = await StudentSkill.find({
      student: studentId,
      isActive: true,
      status: { $in: ['student_declared', 'confirmed', 'ai_suggested'] },
    }).lean();

    const studentSkillMap = new Map(
      studentSkills.map((s) => [s.normalizedName, s.proficiencyLevel || PROFICIENCY_NUMS[s.proficiency] || 1])
    );

    // 2. Tải cơ sở dữ liệu Khóa học, Tài liệu, Quiz, và tình trạng ghi danh
    const [courses, materials, quizzes, enrollments] = await Promise.all([
      Course.find({ isActive: true }).lean().catch(() => []),
      Material.find().lean().catch(() => []),
      Quiz.find().lean().catch(() => []),
      Enrollment.find({ student: studentId }).select('course status').lean().catch(() => []),
    ]);

    const courseByCode = new Map(courses.map((c) => [c.code?.toUpperCase(), c]));
    const enrolledCourseIds = new Set(enrollments.map((e) => e.course?.toString()));

    const matched = [];
    const partial = [];
    const missing = [];
    const remediationList = [];

    for (const skill of extractedSkills) {
      const requiredNum = PROFICIENCY_NUMS[skill.suggestedProficiency] || 3;
      const studentNum = studentSkillMap.get(skill.normalizedName);

      const remData = REMEDIATION_KNOWLEDGE_BASE[skill.normalizedName] || {};

      // Liên kết khóa học
      let linkedCourse = null;
      if (remData.courseCode && courseByCode.has(remData.courseCode.toUpperCase())) {
        const c = courseByCode.get(remData.courseCode.toUpperCase());
        linkedCourse = {
          _id: c._id,
          code: c.code,
          title: c.title,
          description: c.description,
          isEnrolled: enrolledCourseIds.has(c._id.toString()),
        };
      } else if (remData.courseFallback) {
        linkedCourse = {
          _id: null,
          code: remData.courseFallback.code,
          title: remData.courseFallback.title,
          description: `Học phần chuyên môn chuẩn bị cho kỹ năng ${skill.skillName}`,
          isEnrolled: false,
        };
      }

      // Liên kết tài liệu
      let linkedMaterials = materials
        .filter((m) => {
          if (linkedCourse?._id && m.course && m.course.toString() === linkedCourse._id.toString()) return true;
          return m.title && m.title.toLowerCase().includes(skill.normalizedName);
        })
        .map((m) => ({ _id: m._id, title: m.title, description: m.description }));

      if (linkedMaterials.length === 0 && remData.materials?.length) {
        linkedMaterials = remData.materials;
      }

      // Liên kết Quiz
      let linkedQuiz = quizzes.find((q) => {
        if (linkedCourse?._id && q.course && q.course.toString() === linkedCourse._id.toString()) return true;
        return q.title && q.title.toLowerCase().includes(skill.normalizedName);
      });

      const quizPayload = linkedQuiz
        ? { _id: linkedQuiz._id, title: linkedQuiz.title, questionCount: linkedQuiz.questions?.length || 4 }
        : { _id: null, title: remData.quizTitle || `Trắc nghiệm ôn tập ${skill.skillName}`, questionCount: 4 };

      // Gói giải pháp học tập cho kỹ năng
      const remediationItem = {
        skillName: skill.skillName,
        normalizedName: skill.normalizedName,
        category: skill.category,
        requiredLevel: requiredNum,
        requiredLabel: PROFICIENCY_LABELS[requiredNum],
        studentLevel: studentNum || 0,
        studentLabel: studentNum ? PROFICIENCY_LABELS[studentNum] : 'Chưa có',
        course: linkedCourse,
        materials: linkedMaterials,
        youtube: remData.youtube || {
          title: `Khóa học & Bài giảng thực chiến ${skill.skillName} từ Cơ bản đến Nâng cao`,
          channel: 'Học Lập Trình FPT',
          url: `https://www.youtube.com/results?search_query=hoc+lap+trinh+${encodeURIComponent(skill.skillName)}`,
          duration: '3 - 5 giờ',
        },
        quiz: quizPayload,
        practiceQuestions: remData.practiceQuestions || [
          {
            question: `Nguyên lý / kỹ thuật quan trọng nhất khi làm việc với ${skill.skillName} là gì?`,
            options: [
              'Nắm vững kiến trúc & luồng dữ liệu chuẩn',
              'Sử dụng thư viện không cần hiểu bản chất',
              'Chỉ sao chép code mẫu từ diễn đàn',
              'Bỏ qua việc kiểm thử và xử lý lỗi',
            ],
            answer: 0,
            explanation: `Khi làm việc với ${skill.skillName}, nắm chắc kiến trúc và luồng dữ liệu là yếu tố then chốt để viết mã chất lượng.`,
          },
        ],
      };

      if (studentNum === undefined) {
        // Chưa có trong hồ sơ
        missing.push({
          skillName: skill.skillName,
          category: skill.category,
          requiredLevel: requiredNum,
          requiredLabel: PROFICIENCY_LABELS[requiredNum],
          gap: requiredNum,
        });
        remediationList.push({ ...remediationItem, status: 'missing', gap: requiredNum });
      } else if (studentNum >= requiredNum) {
        // Đã đạt yêu cầu
        matched.push({
          skillName: skill.skillName,
          category: skill.category,
          requiredLevel: requiredNum,
          studentLevel: studentNum,
          studentLabel: PROFICIENCY_LABELS[studentNum],
          surplus: studentNum - requiredNum,
        });
      } else {
        // Đã có nhưng còn yếu
        const gap = requiredNum - studentNum;
        partial.push({
          skillName: skill.skillName,
          category: skill.category,
          requiredLevel: requiredNum,
          requiredLabel: PROFICIENCY_LABELS[requiredNum],
          studentLevel: studentNum,
          studentLabel: PROFICIENCY_LABELS[studentNum],
          gap,
        });
        remediationList.push({ ...remediationItem, status: 'partial', gap });
      }
    }

    const totalReq = extractedSkills.length;
    const readinessScore = totalReq > 0
      ? Math.round(((matched.length + partial.length * 0.5) / totalReq) * 100)
      : 0;

    let overallAssessment = '';
    if (readinessScore >= 80) {
      overallAssessment = `Bạn có nền tảng năng lực rất vững chắc (${readinessScore}%), đáp ứng phần lớn các kỹ thuật trọng tâm của dự án này. Hãy tập trung củng cố các kỹ năng còn thiếu để hoàn thiện đồ án xuất sắc.`;
    } else if (readinessScore >= 50) {
      overallAssessment = `Bạn đáp ứng ở mức khá (${readinessScore}%). Dự án này là cơ hội tốt để bạn nâng tầm kỹ năng thực chiến. Bạn cần bổ sung ${missing.length} kỹ năng còn thiếu và nâng cao trình độ cho ${partial.length} kỹ năng hiện tại theo lộ trình đề xuất bên dưới.`;
    } else {
      overallAssessment = `Dự án này đòi hỏi nhiều kỹ năng công nghệ mới (${readinessScore}%). Để triển khai thành công, bạn nên đăng ký các học phần liên kết FPT, xem bài giảng YouTube hướng dẫn và làm các bài Quiz kiểm tra kiến thức trước khi bắt tay thực hiện.`;
    }

    return {
      readinessScore,
      matched,
      partial,
      missing,
      overallAssessment,
      remediation: remediationList,
    };
  } catch (err) {
    console.error('[skill-intelligence] Lỗi phân tích so sánh năng lực:', err);
    return null;
  }
};

/**
 * Trích xuất kỹ năng từ văn bản tự do của sinh viên.
 * Ưu tiên gọi LLM; tự động chuyển sang bộ trích xuất luật NLP khi LLM chưa cấu hình hoặc gặp sự cố.
 * Đồng thời phân tích so sánh năng lực và đề xuất tài nguyên học tập (Khóa học, Tài liệu, YouTube, Quiz).
 * @param {string} text - student's free-text input
 * @param {string} evidenceType - source of the text (e.g. PROJECT_DESCRIPTION)
 * @param {string} studentId - current student's User ID
 * @returns {Promise<{ skills: Array, fallback: boolean, batchId: string, gapAnalysis: Object }>}
 */
const extractSkills = async (text, evidenceType = 'PROJECT_DESCRIPTION', studentId = null) => {
  const batchId = `extract-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // ── Input validation ────────────────────────────────────────────────────────
  const trimmed = String(text || '').trim();
  if (trimmed.length < 10) {
    return { skills: [], fallback: false, batchId, gapAnalysis: null };
  }

  let rawSkills = [];
  let usedLlm = false;

  // ── 1. Thử gọi LLM nếu có cấu hình ──────────────────────────────────────────
  if (isLlmEnabled()) {
    try {
      const rawResult = await completeJson({
        system: SYSTEM_PROMPT,
        user: `Loại nguồn: ${evidenceType}\n\nNội dung:\n${trimmed.slice(0, 3000)}`,
        schema: EXTRACTION_SCHEMA,
        maxTokens: 2000,
      });
      if (Array.isArray(rawResult?.skills) && rawResult.skills.length > 0) {
        rawSkills = rawResult.skills;
        usedLlm = true;
      }
    } catch (err) {
      console.warn(`[skill-intelligence] LLM extraction error (${err.message}). Chuyển sang trích xuất luật.`);
    }
  }

  // ── 2. Fallback sang NLP Rule Extractor nếu LLM không khả dụng hoặc không tìm thấy kỹ năng ──
  if (rawSkills.length === 0) {
    rawSkills = extractSkillsWithRules(trimmed);
  }

  if (rawSkills.length === 0) {
    return {
      skills: [],
      fallback: false,
      batchId,
      gapAnalysis: null,
    };
  }

  // ── 3. Validate & normalize results ─────────────────────────────────────────
  // Step 1: Normalize names
  const normalizedNames = normalizeMany(rawSkills.map((s) => s.name));

  // Step 2: Classify (taxonomy lookup / create)
  const classified = await classifyMany(normalizedNames);

  // Step 3: Merge metadata with normalized/classified data
  const classifiedMap = new Map(classified.map((c) => [c.normalizedName, c]));

  const skills = normalizedNames
    .map((n, idx) => {
      const raw =
        rawSkills.find(
          (s) =>
            String(s.name || '').toLowerCase().trim() === n.displayName.toLowerCase() ||
            n.normalizedName.includes(String(s.name || '').toLowerCase().trim())
        ) || rawSkills[idx];

      const cls = classifiedMap.get(n.normalizedName) || {};

      return {
        skillName: n.displayName,
        normalizedName: n.normalizedName,
        taxonomyId: cls.taxonomyId || null,
        category: cls.category || raw?.category || 'Software Engineering',
        confidence: Math.min(1, Math.max(0, Number(raw?.confidence) || 0.9)),
        evidence: String(raw?.evidence || trimmed.slice(0, 200)),
        evidenceType,
        suggestedProficiency: normalizeProficiency(raw?.suggestedProficiency, true),
        reasoning: String(raw?.reasoning || `Kỹ năng được nhận diện từ văn bản mô tả.`),
        batchId,
        isKnown: n.isKnown,
        aliasUsed: n.aliasUsed,
      };
    })
    .filter((s) => s.normalizedName && s.confidence >= 0.5);

  // ── 4. So sánh năng lực & đề xuất tài nguyên cải thiện (Courses, Materials, YouTube, Quizzes) ──
  let gapAnalysis = null;
  if (studentId) {
    gapAnalysis = await performReadinessAssessment(skills, studentId);
  }

  return {
    skills,
    fallback: false,
    batchId,
    source: usedLlm ? 'llm' : 'nlp_rules',
    gapAnalysis,
  };
};

module.exports = { extractSkills };
