const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const COURSE_LESSONS_DATA = {
  SWP391: [
    {
      title: 'Tuần 1: Khởi động Đồ án & Thiết lập Quy trình Agile/Scrum',
      order: 1,
      content: `### Mục tiêu bài học:
1. Nắm vững phương pháp luận Scrum: Sprint planning, Daily standup, Sprint review và Sprint retrospective.
2. Thiết lập quy tắc làm việc nhóm (Team Charter), phân chia vai trò Product Owner, Scrum Master và Dev Team.
3. Cài đặt môi trường quản lý mã nguồn Git branching model (GitFlow: main, develop, feature branches).

### Nội dung chi tiết:
- **Tài liệu đặc tả (SRS - Software Requirements Specification)**:
  - Phân tích Actor & Use Case Diagrams.
  - Viết User Stories theo chuẩn INVEST: As a <role>, I want <feature> so that <benefit>.
  - Xác định Acceptance Criteria (Tiêu chí chấp nhận) cho từng User Story.
- **Quy tắc Git Commit**:
  - Format: \`feat(auth): implement JWT refresh token flow\`
  - Không push trực tiếp lên main/develop; bắt buộc tạo Pull Request (PR) và có ít nhất 1 code reviewer duyệt.

### Thực hành:
- Khởi tạo repository nhóm trên GitHub/GitLab, cấu hình Branch Protection Rules cho branch \`main\` và \`develop\`.`
    },
    {
      title: 'Tuần 2: Thiết kế Kiến trúc Hệ thống & Cơ sở Dữ liệu (ERD/Schema)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Thiết kế kiến trúc phần mềm 3 tầng (3-Tier Architecture) hoặc Microservices nhẹ.
2. Xây dựng Sơ đồ Thực thể Quan hệ (ERD) và ánh xạ sang Schema NoSQL (MongoDB) hoặc RDBMS (PostgreSQL).
3. Thiết kế đặc tả RESTful API theo chuẩn OpenAPI 3.0 (Swagger).

### Nội dung chi tiết:
- **Nguyên lý thiết kế REST API**:
  - Sử dụng danh từ cho URI: \`/api/v1/students\`, \`/api/v1/courses/:id/lessons\`.
  - HTTP Methods chuẩn xác: GET (đọc), POST (tạo), PUT/PATCH (cập nhật), DELETE (xóa).
  - Chuẩn mã lỗi HTTP Status Codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Error).
- **Thiết kế Index trong Database**:
  - Đánh Single Index cho các trường thường xuyên filter (\`email\`, \`studentCode\`).
  - Đánh Compound Index cho các truy vấn phức hợp kết hợp sắp xếp: \`{ major: 1, gpa: -1 }\`.

### Bài tập tuần:
- Nộp file thiết kế Figma Prototype và file sơ đồ Database Schema đã chuẩn hóa dạng 3NF.`
    },
    {
      title: 'Tuần 3: Xây dựng Module Xác thực & Phân quyền Người dùng (RBAC)',
      order: 3,
      content: `### Mục tiêu bài học:
1. Triển khai Authentication an toàn với JSON Web Token (JWT) và Bcrypt password hashing.
2. Thiết kế Role-Based Access Control (RBAC) phân tầng quyền hạn giữa Sinh viên, Giảng viên và Admin.
3. Bảo mật ứng dụng chống lại các lỗ hổng OWASP Top 10 (XSS, CSRF, Injection).

### Hướng dẫn mã nguồn (Node.js & Express):
\`\`\`javascript
// Middleware xác thực JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
\`\`\`

### Checklist kiểm tra an ninh:
- Mật khẩu phải được hash bằng Bcrypt với Salt Rounds >= 10.
- Cookie lưu Refresh Token phải có cờ \`httpOnly: true\`, \`secure: true\` và \`sameSite: 'strict'\`.`
    },
    {
      title: 'Tuần 4: Phát triển Giao diện Người dùng với React, Tailwind & State Management',
      order: 4,
      content: `### Mục tiêu bài học:
1. Áp dụng Component-Driven Development, chia nhỏ UI thành Atomic Components tái sử dụng.
2. Quản lý trạng thái ứng dụng đồng bộ bằng Context API hoặc Redux Toolkit / Zustand.
3. Tích hợp Axios Interceptor để tự động đính kèm Token và xử lý Refresh Token khi gặp lỗi 401.

### Kiến trúc thư mục Frontend:
\`\`\`text
src/
├── api/            # API client và endpoints
├── components/     # UI components (Button, Input, Modal, Card)
├── context/        # Global state (Auth, Theme, Toast)
├── hooks/          # Custom hooks (useAsync, useDebounce)
├── pages/          # Router screens
└── utils/          # Helpers & formatters
\`\`\`

### Thực hành:
- Tối ưu Core Web Vitals, áp dụng React.lazy() và Suspense để Code Splitting giảm kích thước gói bundle.`
    },
    {
      title: 'Tuần 5: Kiểm thử Phần mềm (Unit Test, Integration Test) & CI/CD Pipeline',
      order: 5,
      content: `### Mục tiêu bài học:
1. Viết Unit Test cho Business Logic bằng Jest và Supertest.
2. Xây dựng quy trình tự động hóa tích hợp liên tục (CI/CD) với GitHub Actions.
3. Đóng gói ứng dụng thành Docker Container (Multi-stage build) và triển khai lên Cloud Run/VPS.

### Cấu hình GitHub Actions CI (.github/workflows/ci.yml):
\`\`\`yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
\`\`\`

### Chuẩn bị Milestone 1:
- Toàn bộ nhóm thực hiện chạy thử nghiệm đồ án trước Hội đồng phản biện.`
    }
  ],
  FER202: [
    {
      title: 'Bài 1: Tổng quan Hệ sinh thái React, JSX & Virtual DOM',
      order: 1,
      content: `### Mục tiêu bài học:
1. Hiểu bản chất Virtual DOM và cơ chế Reconciliation (Diffing Algorithm) của React.
2. Phân biệt Declarative UI (React) và Imperative UI (Vanilla JavaScript DOM manipulation).
3. Khởi tạo dự án hiện đại với Vite, thiết lập ESLint và Prettier.

### Ví dụ JSX cơ bản:
\`\`\`jsx
const StudentCard = ({ name, major, gpa }) => (
  <div className="card-bento p-4">
    <h3 className="text-lg font-bold text-slate-900">{name}</h3>
    <p className="text-sm text-slate-500">Chuyên ngành: {major}</p>
    <span className="badge-ai mt-2">GPA: {gpa}</span>
  </div>
);
\`\`\`

### Bài tập:
- Chuyển đổi mã HTML/CSS tĩnh sang các React Components có thể tái sử dụng.`
    },
    {
      title: 'Bài 2: Quản lý Trạng thái với React Hooks (useState, useEffect, useMemo, useCallback)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Nắm vững vòng đời Component thông qua Hook \`useEffect\`.
2. Tránh các bẫy thường gặp: Infinite Re-renders, Stale Closures và Missing Dependencies.
3. Tối ưu hiệu năng với \`useMemo\` (ghi nhớ giá trị tính toán tốn kém) và \`useCallback\` (giữ nguyên tham chiếu hàm).

### Ví dụ Custom Hook:
\`\`\`javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};
\`\`\`

### Ứng dụng:
- Sử dụng hook \`useDebounce\` cho ô tìm kiếm kỹ năng để tránh spam API requests khi người dùng gõ phím.`
    },
    {
      title: 'Bài 3: Định tuyến Nâng cao với React Router v6 & Bảo vệ Tuyến đường (Route Guards)',
      order: 3,
      content: `### Mục tiêu bài học:
1. Xây dựng hệ thống điều hướng SPA với \`createBrowserRouter\` hoặc \`<Routes>\`.
2. Phân quyền truy cập các trang theo Role (Sinh viên, Giảng viên, Admin).
3. Xử lý Nested Layouts, Dynamic Route Parameters (\`/app/teams/:id\`) và Error Boundaries.

### Mẫu ProtectedRoute Component:
\`\`\`jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
};
\`\`\``
    },
    {
      title: 'Bài 4: Xử lý Form Phức tạp & Kết nối RESTful API với Axios',
      order: 4,
      content: `### Mục tiêu bài học:
1. Xây dựng Form kiểm soát (Controlled Form) với validation thời gian thực.
2. Tích hợp thư viện React Hook Form + Zod để xác thực dữ liệu đầu vào chuẩn xác.
3. Quản lý trạng thái gọi API: Loading, Success, Error và Empty State.

### Checklist thực hành:
- Tự động bắt lỗi 401 và chuyển hướng sang trang đăng nhập.
- Hiển thị Toast thông báo khi lưu dữ liệu thành công.`
    }
  ],
  DBI202: [
    {
      title: 'Bài 1: Mô hình Thực thể Quan hệ (ER Model) & Chuẩn hóa Cơ sở Dữ liệu',
      order: 1,
      content: `### Mục tiêu bài học:
1. Hiểu rõ các dạng chuẩn: 1NF (Atomic values), 2NF (Loại bỏ Functional Dependency một phần), 3NF (Loại bỏ Transitive Dependency).
2. Thiết kế ERD với các mối quan hệ 1-1, 1-N, N-N (Bảng trung gian).
3. Xác định Khóa chính (Primary Key), Khóa ngoại (Foreign Key) và Ràng buộc toàn vẹn (Integrity Constraints).`
    },
    {
      title: 'Bài 2: Ngôn ngữ Truy vấn SQL Nâng cao (JOINs, Subqueries, CTE, Window Functions)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Nắm vững cú pháp INNER JOIN, LEFT OUTER JOIN, RIGHT JOIN, FULL OUTER JOIN.
2. Sử dụng Common Table Expressions (WITH clause) để tái cấu trúc các truy vấn phức tạp.
3. Ứng dụng Window Functions (ROW_NUMBER(), RANK(), DENSE_RANK()) để phân trang và xếp hạng sinh viên.

### Ví dụ Truy vấn Xếp hạng Sinh viên:
\`\`\`sql
WITH StudentRanks AS (
  SELECT 
    s.id,
    s.name,
    s.major,
    s.gpa,
    DENSE_RANK() OVER (PARTITION BY s.major ORDER BY s.gpa DESC) as rank_in_major
  FROM Students s
)
SELECT * FROM StudentRanks WHERE rank_in_major <= 5;
\`\`\``
    },
    {
      title: 'Bài 3: Tối ưu Hóa Hiệu năng Truy vấn (Indexing & Execution Plan)',
      order: 3,
      content: `### Mục tiêu bài học:
1. Hiểu cơ chế hoạt động của Clustered Index và Non-Clustered Index (B-Tree Data Structure).
2. Đọc và phân tích Execution Plan để phát hiện Index Scan / Table Scan không mong muốn.
3. Tránh các lỗi làm vô hiệu hóa Index (dùng hàm trên cột Index, ép kiểu ngầm định).`
    },
    {
      title: 'Bài 4: Quản lý Giao dịch (Transactions), Khóa (Locking) & Mức cô lập (ACID)',
      order: 4,
      content: `### Mục tiêu bài học:
1. 4 thuộc tính ACID: Atomicity, Consistency, Isolation, Durability.
2. Các hiện tượng tranh chấp dữ liệu: Dirty Read, Non-Repeatable Read, Phantom Read.
3. Sử dụng Transaction để đảm bảo tính toàn vẹn khi đăng ký nhóm đồ án.`
    }
  ],
  CSD201: [
    {
      title: 'Bài 1: Phân tích Độ phức tạp Thuật toán (Big-O Notation) & Cấu trúc Danh sách',
      order: 1,
      content: `### Mục tiêu bài học:
1. Phân tích độ phức tạp thời gian (Time Complexity) và không gian (Space Complexity) O(1), O(log N), O(N), O(N log N), O(N^2).
2. Cấu trúc Danh sách liên kết đơn (Singly Linked List) và Danh sách liên kết đôi (Doubly Linked List).
3. Ngăn xếp (Stack) và Hàng đợi (Queue) cùng các ứng dụng thực tế (Undo/Redo, Call Stack, BFS).`
    },
    {
      title: 'Bài 2: Cây Nhị phân Tìm kiếm (Binary Search Tree - BST) & Cây Cân bằng AVL',
      order: 2,
      content: `### Mục tiêu bài học:
1. Thao tác chèn, tìm kiếm, xóa trên Cây nhị phân tìm kiếm BST.
2. Các phép duyệt cây: Pre-order (NLR), In-order (LNR - cho dãy tăng dần), Post-order (LRN) và Breadth-First Traversal.
3. Kỹ thuật xoay cây (Left Rotation, Right Rotation) trong Cây AVL để đảm bảo chiều cao O(log N).`
    },
    {
      title: 'Bài 3: Các Thuật toán Sắp xếp Hiệu quả (Quick Sort, Merge Sort, Heap Sort)',
      order: 3,
      content: `### Mục tiêu bài học:
1. So sánh chi tiết ưu nhược điểm của Quick Sort (phân hoạch Hoare/Lomuto) và Merge Sort (chia để trị).
2. Xây dựng Cấu trúc Heap (Max-Heap, Min-Heap) và Hàng đợi ưu tiên (Priority Queue).
3. Ứng dụng Heap Sort trong bài toán tìm Top-K kỹ năng xuất sắc nhất của sinh viên.`
    },
    {
      title: 'Bài 4: Thuật toán Đồ thị (Graph Traversal & Shortest Path: Dijkstra, Kruskal)',
      order: 4,
      content: `### Mục tiêu bài học:
1. Biểu diễn đồ thị bằng Ma trận kề (Adjacency Matrix) và Danh sách kề (Adjacency List).
2. Thuật toán tìm đường đi ngắn nhất Dijkstra và tìm cây khung nhỏ nhất (MST) Kruskal/Prim.
3. Ứng dụng trong việc xây dựng Đồ thị tri thức Kỹ năng (Skill Knowledge Graph) trên nền tảng STE.`
    }
  ],
  AIL303m: [
    {
      title: 'Bài 1: Nhập môn Học máy (Machine Learning) & Tiền xử lý Dữ liệu với Python (NumPy, Pandas)',
      order: 1,
      content: `### Mục tiêu bài học:
1. Phân biệt Supervised Learning (Hồi quy, Phân loại) và Unsupervised Learning (Gom cụm, Giảm số chiều).
2. Làm sạch dữ liệu: Xử lý Missing values, Outliers, One-Hot Encoding và Chuẩn hóa (MinMax, Standard Scaler).
3. Khám phá dữ liệu (EDA - Exploratory Data Analysis) với Matplotlib và Seaborn.`
    },
    {
      title: 'Bài 2: Các Mô hình Học có Giám sát Cổ điển (Linear Regression, Logistic Regression, Random Forest)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Thuật toán Gradient Descent và hàm mất mát (Loss Function: MSE, Cross-Entropy).
2. Cây quyết định (Decision Tree) và kỹ thuật Ensemble Learning (Random Forest, Gradient Boosting).
3. Đánh giá mô hình: Confusion Matrix, Accuracy, Precision, Recall, F1-Score và Đường cong ROC-AUC.`
    },
    {
      title: 'Bài 3: Vector Embeddings & Ứng dụng Ghép nhóm Đồ án Thông minh trong STE',
      order: 3,
      content: `### Mục tiêu bài học:
1. Hiểu bản chất Vector Embedding: Biểu diễn vector dày đặc của văn bản và kỹ năng trong không gian đa chiều.
2. Tính toán độ tương đồng ngữ nghĩa bằng Cosine Similarity:
   $$\\text{Cosine Similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$$
3. Xây dựng thuật toán AI tự động gợi ý đề tài và ghép đội nhóm sinh viên tương thích về kỹ năng.`
    }
  ],
  PRN211: [
    {
      title: 'Bài 1: Lập trình C# Hiện đại & Nền tảng .NET 8 Đa nền tảng',
      order: 1,
      content: `### Mục tiêu bài học:
1. Cú pháp C# nâng cao: LINQ (Language Integrated Query), Async/Await, Pattern Matching và Records.
2. Cấu trúc dự án .NET: Dependency Injection (DI) tích hợp sẵn, Configuration và Logging.
3. Tạo ứng dụng Web API với ASP.NET Core.`
    },
    {
      title: 'Bài 2: Tương tác Cơ sở Dữ liệu với Entity Framework Core (EF Core)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Code-First Approach và quy trình Migrations.
2. Tối ưu truy vấn EF Core: \`AsNoTracking()\`, Eager Loading (\`Include\`) và Lazy Loading.
3. Repository Pattern và Unit of Work trong ứng dụng Enterprise.`
    }
  ],
  MAS291: [
    {
      title: 'Bài 1: Biến ngẫu nhiên, Phân phối Xác suất & Thống kê Mô tả',
      order: 1,
      content: `### Mục tiêu bài học:
1. Các tham số đặc trưng: Kỳ vọng (Mean), Phương sai (Variance), Độ lệch chuẩn (Standard Deviation).
2. Các phân phối quan trọng: Phân phối Nhị thức (Binomial), Phân phối Poisson, Phân phối Chuẩn (Normal Distribution).
3. Định lý Giới hạn Trung tâm (Central Limit Theorem) và ứng dụng trong khoa học dữ liệu.`
    },
    {
      title: 'Bài 2: Ước lượng Tham số & Kiểm định Giả thuyết Thống kê (Hypothesis Testing)',
      order: 2,
      content: `### Mục tiêu bài học:
1. Xây dựng Khoảng tin cậy (Confidence Interval) cho trung bình và tỷ lệ.
2. Quy trình kiểm định 5 bước: Thiết lập H0/H1, Tính giá trị thống kê t-test / z-test, Tra cứu p-value và đưa ra kết luận.
3. Phân tích phương sai ANOVA để so sánh hiệu quả học tập giữa các phương pháp giảng dạy.`
    }
  ]
};

async function seedLessons() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB for lesson seeding.');

  const Course = mongoose.model('Course', new mongoose.Schema({ name: String, code: String, major: String }));
  const Lesson = mongoose.model('Lesson', new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  }, { timestamps: true }));
  const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));

  // Find a lecturer or admin to be the creator
  let creator = await User.findOne({ role: 'lecturer' });
  if (!creator) creator = await User.findOne({ role: 'admin' });
  if (!creator) creator = await User.findOne({});
  console.log('Using creator ID:', creator?._id, 'Name:', creator?.name || 'Faculty Member');

  let totalAdded = 0;

  for (const [courseCode, lessonList] of Object.entries(COURSE_LESSONS_DATA)) {
    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      console.log(`⚠️ Course code [${courseCode}] not found in database. Skipping.`);
      continue;
    }

    // Check existing lessons for this course
    const existingCount = await Lesson.countDocuments({ course: course._id });
    console.log(`\n📚 Processing [${courseCode}] ${course.name || ''} (Current: ${existingCount} lessons):`);

    // Remove existing lessons if small to replace with clean structured rich lessons
    await Lesson.deleteMany({ course: course._id });

    for (const item of lessonList) {
      await Lesson.create({
        course: course._id,
        title: item.title,
        content: item.content,
        order: item.order,
        createdBy: creator._id,
      });
      totalAdded++;
      console.log(`  ✓ Added Lesson ${item.order}: ${item.title}`);
    }
  }

  // Also for other courses without explicit seed, add 3 foundational lessons
  const allCourses = await Course.find({}).lean();
  for (const c of allCourses) {
    const count = await Lesson.countDocuments({ course: c._id });
    if (count === 0) {
      console.log(`\n📚 Adding base curriculum lessons for [${c.code}]:`);
      const defaultLessons = [
        {
          title: `Tổng quan & Đề cương Môn học ${c.code}`,
          order: 1,
          content: `### Giới thiệu Học phần:\nMôn học ${c.code} cung cấp nền tảng kiến thức chuyên môn cốt lõi và kỹ năng thực hành cần thiết cho sinh viên ngành ${c.major || 'Công nghệ thông tin'}.\n\n### Chuẩn đầu ra:\n- Nắm vững kiến thức lý thuyết nền tảng.\n- Thực hiện đồ án/bài tập thực hành theo yêu cầu.\n- Đạt chuẩn đánh giá rubric của bộ môn.`
        },
        {
          title: `Phương pháp Thực hành & Công cụ Làm việc ${c.code}`,
          order: 2,
          content: `### Hướng dẫn Môi trường Làm việc:\nSinh viên cần cài đặt đầy đủ công cụ lập trình, IDE và tài liệu chính thống được khuyến nghị bởi giảng viên phụ trách môn ${c.code}.\n\n### Quy định Nộp bài:\n- Tuân thủ đúng hạn chót (Deadline) của từng Assignment.\n- Trình bày mã nguồn sạch (Clean Code), có ghi chú rõ ràng.`
        },
        {
          title: `Đồ án & Ôn tập Tổng kết Học phần ${c.code}`,
          order: 3,
          content: `### Chuẩn bị Kiểm tra Cuối kỳ:\n- Ôn tập toàn bộ các chủ đề lý thuyết và bài tập trắc nghiệm trên hệ thống Quiz của STE.\n- Hoàn thiện sản phẩm nhóm và slide báo cáo đồ án đúng quy chuẩn.`
        }
      ];
      for (const item of defaultLessons) {
        await Lesson.create({
          course: c._id,
          title: item.title,
          content: item.content,
          order: item.order,
          createdBy: creator._id,
        });
        totalAdded++;
        console.log(`  ✓ Added Lesson ${item.order}: ${item.title}`);
      }
    }
  }

  console.log(`\n🎉 Finished seeding lessons! Total lessons seeded: ${totalAdded}`);
  await mongoose.disconnect();
}

seedLessons().catch((err) => {
  console.error('Error seeding lessons:', err);
  process.exit(1);
});

