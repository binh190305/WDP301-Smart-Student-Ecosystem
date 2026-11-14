/**
 * Remediation Service – SI-01 & SI-05
 * Curates 4-pillar actionable remediation for weak and missing skills:
 * 1. FPT University Courses (linked with 1-click enrollment)
 * 2. STE Study Materials (slides, guides, cheat-sheets)
 * 3. YouTube Video Lectures (curated high-quality video tutorials)
 * 4. Practice Quizzes & Interactive Questions
 */

const { Course, Material, Quiz, Enrollment } = require('../models');

const PROFICIENCY_LABELS = {
  1: 'Mới bắt đầu (Cấp 1)',
  2: 'Cơ bản (Cấp 2)',
  3: 'Trung cấp (Cấp 3)',
  4: 'Nâng cao (Cấp 4)',
  5: 'Chuyên gia (Cấp 5)',
};

const REMEDIATION_KNOWLEDGE_BASE = {
  react: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: '[FER202] Giáo trình ReactJS & TypeScript Thực Chiến: Từ Cơ Bản Đến Nâng Cao', desc: 'Hướng dẫn xây dựng Single Page Application hiện đại với React Hooks, Tailwind và Redux Toolkit' },
      { title: '[FER202] Slide Bài giảng: State Management và Tối ưu Hiệu năng React', desc: 'Tài liệu chi tiết về useState, useEffect, useCallback, useMemo và Context API' },
    ],
    youtube: {
      title: 'Khóa học ReactJS Toàn Diện Từ Cơ Bản Đến Nâng Cao',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=x0fSBAgBrOQ',
      videoId: 'x0fSBAgBrOQ',
      duration: '12 giờ • 85 bài giảng',
    },
    quizTitle: '[FER202] Trắc nghiệm Chuyên sâu React Hooks, State & Component Lifecycle',
    practiceQuestions: [
      {
        question: 'Hook nào trong React được sử dụng để quản lý side-effects như fetch API hay subscribe event?',
        options: ['useState', 'useEffect', 'useMemo', 'useRef'],
        answer: 1,
        explanation: 'useEffect được thực thi sau khi component render để xử lý các side-effects và dọn dẹp subscription.',
      },
      {
        question: 'Để tránh re-render không cần thiết khi truyền callback xuống component con, ta dùng hook nào?',
        options: ['useCallback', 'useContext', 'useReducer', 'useLayoutEffect'],
        answer: 0,
        explanation: 'useCallback ghi nhớ instance của function giữa các lần render khi dependencies không đổi.',
      },
    ],
  },
  'node.js': {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    materials: [
      { title: '[PRJ301] Mẫu Thiết kế Kiến trúc MVC và RESTful Service với Java Servlet & JDBC', desc: 'Middleware, JWT Authentication, Error handling và tối ưu I/O bất đồng bộ' },
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
        explanation: 'Node.js sử dụng kiến trúc Single-threaded Event Loop phối hợp Non-blocking I/O của libuv.',
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
    practiceQuestions: [
      {
        question: 'Trong middleware của Express, tham số thứ 3 thường được dùng để chuyển tiếp request là gì?',
        options: ['return', 'next()', 'forward()', 'dispatch()'],
        answer: 1,
        explanation: 'Gọi next() để chuyển quyền điều khiển sang middleware tiếp theo trong pipeline.',
      },
    ],
  },
  typescript: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    materials: [
      { title: '[FER202] Giáo trình ReactJS & TypeScript Thực Chiến: Từ Cơ Bản Đến Nâng Cao', desc: 'Cách định kiểu chặt chẽ cho API payload, Redux state và React Props' },
    ],
    youtube: {
      title: 'TypeScript Siêu Nhanh & Thực Chiến Cho Web Developer',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=BCg4U1FzODs',
      videoId: 'BCg4U1FzODs',
      duration: '2 giờ • 18 bài giảng',
    },
    quizTitle: 'Kiểm tra Kiến thức TypeScript Typings & Generics',
    practiceQuestions: [
      {
        question: 'Từ khóa nào trong TypeScript dùng để tạo một type alias hoặc hợp nhất giao diện dữ liệu?',
        options: ['interface / type', 'struct', 'typedef', 'class only'],
        answer: 0,
        explanation: 'TypeScript sử dụng cả "interface" và "type" để định nghĩa hình dạng (shape) của dữ liệu.',
      },
    ],
  },
  javascript: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: 'Cẩm nang JavaScript ES6+ Hiện Đại: Promise, Async/Await, Destructuring', desc: 'Toàn bộ tính năng cốt lõi của JavaScript hiện đại phục vụ phát triển ứng dụng' },
    ],
    youtube: {
      title: 'JavaScript Cơ Bản Đến Nâng Cao Dành Cho Người Mới',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=0SJE9dYdpps',
      videoId: '0SJE9dYdpps',
      duration: '15 giờ • ES6+',
    },
    quizTitle: 'Trắc nghiệm JavaScript ES6+ & Asynchronous Programming',
    practiceQuestions: [
      {
        question: 'Kết quả của Promise.all([p1, p2]) sẽ bị reject ngay lập tức khi nào?',
        options: ['Khi cả hai promise reject', 'Khi có ít nhất một promise reject', 'Không bao giờ reject', 'Chỉ khi p1 reject'],
        answer: 1,
        explanation: 'Promise.all tuân theo cơ chế fail-fast: chỉ cần 1 promise thất bại thì toàn bộ reject ngay.',
      },
    ],
  },
  mongodb: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    materials: [
      { title: '[DBI202] Cheat-sheet Tối ưu hóa Truy vấn SQL và Đánh chỉ mục Index B-Tree', desc: 'Mô hình dữ liệu NoSQL vs RDBMS, indexing và tối ưu truy vấn khối lượng lớn' },
    ],
    youtube: {
      title: 'Lập trình Cơ sở dữ liệu NoSQL MongoDB & Mongoose Thực Chiến',
      channel: 'TechMaster Việt Nam',
      url: 'https://www.youtube.com/watch?v=ofme2o29ngU',
      videoId: 'ofme2o29ngU',
      duration: '3 giờ • Thực hành CRUD & Indexing',
    },
    quizTitle: '[DBI202] Trắc nghiệm Tối ưu hóa Truy vấn SQL, Ràng buộc Toàn vẹn & Indexing',
    practiceQuestions: [
      {
        question: 'Trong MongoDB, trường nào sau đây tự động được gán làm khóa chính mặc định cho mỗi document?',
        options: ['id', '_id', 'uuid', 'key'],
        answer: 1,
        explanation: '_id là trường định danh duy nhất (ObjectId) bắt buộc trong mỗi MongoDB document.',
      },
    ],
  },
  sql: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    materials: [
      { title: '[DBI202] Cheat-sheet Tối ưu hóa Truy vấn SQL và Đánh chỉ mục Index B-Tree', desc: 'Cẩm nang tối ưu hóa subquery, join, group by và phân tích execution plan' },
    ],
    youtube: {
      title: 'Truy Vấn Dữ Liệu SQL Từ Cơ Bản Đến Nâng Cao (Chuẩn DBI202)',
      channel: 'Lập Trình Cuộc Sống',
      url: 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
      videoId: 'HXV3zeRR3h4',
      duration: '4 giờ • Join, Group By, Subquery',
    },
    quizTitle: '[DBI202] Trắc nghiệm Tối ưu hóa Truy vấn SQL, Ràng buộc Toàn vẹn & Indexing',
    practiceQuestions: [
      {
        question: 'Mệnh đề nào dùng để lọc kết quả sau khi đã gom nhóm bằng GROUP BY?',
        options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'],
        answer: 1,
        explanation: 'HAVING được sử dụng để lọc trên các giá trị tổng hợp (aggregate functions) sau GROUP BY.',
      },
    ],
  },
  docker: {
    courseCode: 'SWP391',
    courseFallback: { code: 'SWP391', title: 'Đồ án Ứng dụng Thực tế & Triển khai Cloud' },
    materials: [
      { title: '[SWP391] Cẩm nang Containerization với Docker & Docker-Compose', desc: 'Tạo Dockerfile đa tầng, tối ưu image size, networking và cấu hình biến môi trường production' },
      { title: '[SWP391] Slide Bài giảng: Kiến trúc Microservices và Đóng gói Container', desc: 'Quy chuẩn đóng gói ứng dụng Node.js & React thành container độc lập' },
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
  'tailwind css': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: '[FER202] Cẩm nang Thiết kế Giao diện Hiện đại với Tailwind CSS Utility Classes', desc: 'Responsive Design, Grid/Flexbox, Dark Mode, Typography và tối ưu hóa CSS bundle' },
      { title: '[FER202] Bộ Component UI mẫu viết bằng Tailwind CSS & React Icons', desc: 'Card, Modal, Navbar, Form Controls và Animation mượt mà' },
    ],
    youtube: {
      title: 'Học Tailwind CSS Cơ Bản Đến Nâng Cao Siêu Tốc',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=dFgzHOX84xQ',
      videoId: 'dFgzHOX84xQ',
      duration: '2 giờ 15 phút • Thiết kế Responsive',
    },
    quizTitle: 'Trắc nghiệm Tailwind CSS Utility-First & Responsive Layout',
    practiceQuestions: [
      {
        question: 'Để căn giữa một phần tử theo cả hai trục bằng Flexbox trong Tailwind CSS, tổ hợp class nào đúng?',
        options: ['flex items-center justify-center', 'flex center-all', 'display-flex align-center', 'box-center'],
        answer: 0,
        explanation: 'items-center căn giữa trục phụ (cross-axis), justify-center căn giữa trục chính (main-axis).',
      },
      {
        question: 'Prefix nào trong Tailwind CSS đại diện cho breakpoint màn hình tablet từ 768px trở lên?',
        options: ['sm:', 'md:', 'lg:', 'xl:'],
        answer: 1,
        explanation: 'md: tương ứng với min-width 768px trong Tailwind CSS responsive breakpoints.',
      },
    ],
  },
  tailwind: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: '[FER202] Cẩm nang Thiết kế Giao diện Hiện đại với Tailwind CSS Utility Classes', desc: 'Responsive Design, Grid/Flexbox, Dark Mode, Typography và tối ưu hóa CSS bundle' },
    ],
    youtube: {
      title: 'Học Tailwind CSS Cơ Bản Đến Nâng Cao Siêu Tốc',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=dFgzHOX84xQ',
      videoId: 'dFgzHOX84xQ',
      duration: '2 giờ 15 phút • Thiết kế Responsive',
    },
    quizTitle: 'Trắc nghiệm Tailwind CSS Utility-First & Responsive Layout',
    practiceQuestions: [
      {
        question: 'Để căn giữa một phần tử theo cả hai trục bằng Flexbox trong Tailwind CSS, tổ hợp class nào đúng?',
        options: ['flex items-center justify-center', 'flex center-all', 'display-flex align-center', 'box-center'],
        answer: 0,
        explanation: 'items-center căn giữa trục phụ, justify-center căn giữa trục chính.',
      },
    ],
  },
  redux: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    materials: [
      { title: '[FER202] Quản lý Trạng thái Ứng dụng Toàn cục với Redux Toolkit & RTK Query', desc: 'createSlice, configureStore, createAsyncThunk và luồng dữ liệu 1 chiều (unidirectional data flow)' },
      { title: '[FER202] Slide: So sánh Context API vs Redux Toolkit trong Ứng dụng Lớn', desc: 'Khi nào nên dùng Context API và khi nào cần Redux Toolkit để tránh re-render' },
    ],
    youtube: {
      title: 'Redux Toolkit Siêu Dễ Hiểu & Thực Chiến Với React',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=kAO_V2lZuhA',
      videoId: 'kAO_V2lZuhA',
      duration: '1 giờ 45 phút • Redux Toolkit',
    },
    quizTitle: 'Kiểm tra Kiến thức Redux Toolkit State Management',
    practiceQuestions: [
      {
        question: 'Hàm nào trong Redux Toolkit tự động tạo cả action creators và action types dựa trên các reducers khai báo?',
        options: ['createAction', 'createSlice', 'combineReducers', 'createStore'],
        answer: 1,
        explanation: 'createSlice nhận name và reducers map rồi tự động sinh ra actions tương ứng.',
      },
      {
        question: 'Trong Redux Toolkit, cơ chế nào cho phép ta viết code thay đổi state như thể đang mutate trực tiếp?',
        options: ['Immer library tích hợp sẵn', 'Virtual DOM', 'Proxy thuần', 'Deep clone thủ công'],
        answer: 0,
        explanation: 'Redux Toolkit tích hợp sẵn thư viện Immer, cho phép viết mutating syntax nhưng vẫn sinh ra immutable updates an toàn.',
      },
    ],
  },
  'redux toolkit': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    materials: [
      { title: '[FER202] Quản lý Trạng thái Ứng dụng Toàn cục với Redux Toolkit & RTK Query', desc: 'createSlice, configureStore, createAsyncThunk và luồng dữ liệu 1 chiều' },
    ],
    youtube: {
      title: 'Redux Toolkit Siêu Dễ Hiểu & Thực Chiến Với React',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=kAO_V2lZuhA',
      videoId: 'kAO_V2lZuhA',
      duration: '1 giờ 45 phút • Redux Toolkit',
    },
    quizTitle: 'Kiểm tra Kiến thức Redux Toolkit State Management',
    practiceQuestions: [
      {
        question: 'Hàm nào trong Redux Toolkit tự động tạo cả action creators và action types?',
        options: ['createAction', 'createSlice', 'combineReducers', 'createStore'],
        answer: 1,
        explanation: 'createSlice nhận name và reducers map rồi tự động sinh ra actions tương ứng.',
      },
    ],
  },
  'rest api': {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    materials: [
      { title: '[PRJ301] Hướng dẫn Thiết kế RESTful API Chuẩn Công nghiệp & Mã Trạng thái HTTP', desc: 'Thiết kế Resource URI, HTTP methods (GET/POST/PUT/PATCH/DELETE), Status codes và bảo mật Token' },
      { title: '[PRJ301] Slide: Xử lý Pagination, Filtering, Sorting và Error Response chuẩn', desc: 'Cấu trúc phản hồi JSON chuẩn hóa và xử lý ngoại lệ tập trung' },
    ],
    youtube: {
      title: 'RESTful API Là Gì? Hướng Dẫn Thiết Kế API Chuẩn Nhất',
      channel: '28Tech',
      url: 'https://www.youtube.com/watch?v=lsMQRaeKNDk',
      videoId: 'lsMQRaeKNDk',
      duration: '1 giờ 30 phút • REST Best Practices',
    },
    quizTitle: 'Trắc nghiệm Thiết kế RESTful API & HTTP Methods',
    practiceQuestions: [
      {
        question: 'Phương thức HTTP nào mang tính Idempotent (thực hiện nhiều lần cho cùng kết quả) và dùng để cập nhật toàn bộ tài nguyên?',
        options: ['POST', 'PUT', 'PATCH', 'OPTIONS'],
        answer: 1,
        explanation: 'PUT mang tính idempotent và được dùng để thay thế toàn bộ trạng thái tài nguyên đích.',
      },
      {
        question: 'Mã trạng thái HTTP nào biểu thị việc tạo mới tài nguyên thành công trên server?',
        options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
        answer: 1,
        explanation: '201 Created là mã chuẩn thông báo tài nguyên mới đã được khởi tạo thành công.',
      },
    ],
  },
  api: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    materials: [
      { title: '[PRJ301] Hướng dẫn Thiết kế RESTful API Chuẩn Công nghiệp & Mã Trạng thái HTTP', desc: 'Thiết kế Resource URI, HTTP methods, Status codes và bảo mật Token' },
    ],
    youtube: {
      title: 'RESTful API Là Gì? Hướng Dẫn Thiết Kế API Chuẩn Nhất',
      channel: '28Tech',
      url: 'https://www.youtube.com/watch?v=lsMQRaeKNDk',
      videoId: 'lsMQRaeKNDk',
      duration: '1 giờ 30 phút • REST Best Practices',
    },
    quizTitle: 'Trắc nghiệm Thiết kế RESTful API & HTTP Methods',
    practiceQuestions: [
      {
        question: 'Phương thức HTTP nào dùng để lấy dữ liệu mà không làm thay đổi trạng thái server?',
        options: ['POST', 'GET', 'PUT', 'DELETE'],
        answer: 1,
        explanation: 'GET là phương thức an toàn (safe method) chỉ dùng để đọc dữ liệu.',
      },
    ],
  },
  'html/css': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    materials: [
      { title: '[FER202] Giáo trình HTML5 & CSS3 Chuyên sâu: Flexbox, CSS Grid và Responsive Media Queries', desc: 'Thiết kế giao diện thích ứng đa thiết bị, Semantic HTML chuẩn SEO và Accessibility (a11y)' },
      { title: '[FER202] Slide: CSS Box Model, Specificity và Kỹ thuật Tối ưu Animation 60fps', desc: 'Transform, Transition, Keyframes và nguyên tắc rendering mượt mà' },
    ],
    youtube: {
      title: 'Khóa học HTML CSS Từ Cơ Bản Đến Nâng Cao Dành Cho Người Mới',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=R6plN3FvzFY',
      videoId: 'R6plN3FvzFY',
      duration: '10 giờ • Dự án thực chiến',
    },
    quizTitle: 'Trắc nghiệm HTML5 & CSS Layout Fundamentals',
    practiceQuestions: [
      {
        question: 'Thẻ ngữ nghĩa (semantic tag) nào trong HTML5 dùng để định nghĩa khối nội dung độc lập như bài báo hoặc tin tức?',
        options: ['<section>', '<article>', '<div>', '<main>'],
        answer: 1,
        explanation: '<article> dùng cho nội dung hoàn chỉnh và độc lập có thể phân phối hoặc tái sử dụng riêng.',
      },
    ],
  },
  kubernetes: {
    courseCode: 'SWP391',
    courseFallback: { code: 'SWP391', title: 'Đồ án Ứng dụng Thực tế & Hạ tầng Phân tán' },
    materials: [
      { title: '[SWP391] Cẩm nang Điều phối Container với Kubernetes (K8s) Cluster', desc: 'Deployments, Services, ConfigMaps, Ingress và HPA Auto-scaling' },
    ],
    youtube: {
      title: 'Kubernetes Toàn Tập: Pods, Services, Deployments Dành Cho Developer',
      channel: 'TechMaster',
      url: 'https://www.youtube.com/watch?v=X48VuDVv0do',
      videoId: 'X48VuDVv0do',
      duration: '3 giờ 30 phút • Điều phối container',
    },
    quizTitle: 'Trắc nghiệm Kubernetes Architecture & Deployments',
    practiceQuestions: [
      {
        question: 'Đối tượng nhỏ nhất và cơ bản nhất có thể triển khai được trong Kubernetes là gì?',
        options: ['Node', 'Pod', 'Service', 'Container'],
        answer: 1,
        explanation: 'Pod là đơn vị tính toán nhỏ nhất được quản lý bởi Kubernetes, chứa một hoặc nhiều containers cùng chia sẻ network và storage.',
      },
    ],
  },
  pandas: {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy & Xử lý Dữ liệu Thông minh' },
    materials: [
      { title: '[AIL303m] Cẩm nang Khai phá Dữ liệu với Pandas & NumPy: Làm sạch và Biến đổi', desc: 'Xử lý missing data, GroupBy, Pivot Table và tối ưu bộ nhớ DataFrame' },
    ],
    youtube: {
      title: 'Xử Lý Dữ Liệu Bằng Pandas & Python Thực Chiến',
      channel: 'Dạy Nhau Học',
      url: 'https://www.youtube.com/watch?v=dcqPhpY7tWk',
      videoId: 'dcqPhpY7tWk',
      duration: '2 giờ 45 phút • Pandas & Python',
    },
    quizTitle: 'Trắc nghiệm Xử lý Dữ liệu với thư viện Pandas',
    practiceQuestions: [
      {
        question: 'Phương thức nào trong Pandas dùng để loại bỏ các hàng có chứa giá trị bị thiếu (NaN)?',
        options: ['df.fillna()', 'df.dropna()', 'df.drop()', 'df.clean()'],
        answer: 1,
        explanation: 'dropna() loại bỏ các hàng hoặc cột chứa giá trị missing NaN.',
      },
    ],
  },
  'react native': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Ứng dụng Di động Đa nền tảng' },
    materials: [
      { title: 'Giáo trình Lập trình Ứng dụng Di động Đa Nền tảng với React Native & Expo', desc: 'Navigation Stack, Core Components, Async Storage và tích hợp Native APIs' },
    ],
    youtube: {
      title: 'Học Lập Trình React Native Cho Người Mới Bắt Đầu',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
      videoId: '0-S5a0eXPoc',
      duration: '4 giờ • Expo & React Native',
    },
    quizTitle: 'Trắc nghiệm Lập trình Mobile React Native Fundamentals',
    practiceQuestions: [
      {
        question: 'Trong React Native, component nào tương đương với thẻ <div> trong HTML để tạo khối giao diện?',
        options: ['<Text>', '<View>', '<Block>', '<Container>'],
        answer: 1,
        explanation: '<View> là component cơ bản nhất để xây dựng UI trong React Native, hỗ trợ layout Flexbox.',
      },
    ],
  },
  python: {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: '[AIL303m] Bài giảng Chuyên sâu: Mạng Nơ-ron Nhân tạo và Học sâu với PyTorch', desc: 'Bài giảng lập trình Python, xử lý dữ liệu với NumPy, Pandas và Scikit-Learn' },
    ],
    youtube: {
      title: 'Khóa học Lập trình Python Cơ Bản Đến Nâng Cao Cho Người Mới Bắt Đầu',
      channel: 'Kteam',
      url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
      videoId: 'kqtD5dpn9C8',
      duration: '8 giờ • Thực hành bài bản',
    },
    quizTitle: '[AIL303m] Kiểm tra Nền tảng Học máy: Overfitting, Underfitting và Đánh giá Mô hình',
    practiceQuestions: [
      {
        question: 'Cấu trúc dữ liệu nào trong Python mang tính bất biến (immutable)?',
        options: ['List', 'Dictionary', 'Set', 'Tuple'],
        answer: 3,
        explanation: 'Tuple trong Python là immutable; một khi được tạo thì không thể thay đổi giá trị các phần tử.',
      },
    ],
  },
  'machine learning': {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: '[AIL303m] Bài giảng Chuyên sâu: Mạng Nơ-ron Nhân tạo và Học sâu với PyTorch', desc: 'Mô hình học máy có giám sát, không giám sát, xử lý Overfitting và đánh giá F1-score' },
    ],
    youtube: {
      title: 'Học Máy Machine Learning & Xử Lý Dữ Liệu Python Từ Cơ Bản',
      channel: 'Dạy Nhau Học',
      url: 'https://www.youtube.com/watch?v=GwIo3g5ChTQ',
      videoId: 'GwIo3g5ChTQ',
      duration: '6 giờ • Scikit-Learn & Pandas',
    },
    quizTitle: '[AIL303m] Kiểm tra Nền tảng Học máy: Overfitting, Underfitting và Đánh giá Mô hình',
    practiceQuestions: [
      {
        question: 'Kỹ thuật nào dùng để ngăn chặn hiện tượng Overfitting trong mô hình học máy?',
        options: ['Tăng độ phức tạp mô hình', 'Regularization (L1/L2) & Dropout', 'Giảm số lượng mẫu huấn luyện', 'Bỏ qua bước Validation'],
        answer: 1,
        explanation: 'Regularization phạt các trọng số quá lớn, giúp mô hình tổng quát hóa tốt hơn và tránh học vẹt dữ liệu.',
      },
    ],
  },
  'deep learning': {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    materials: [
      { title: '[AIL303m] Bài giảng Chuyên sâu: Mạng Nơ-ron Nhân tạo và Học sâu với PyTorch', desc: 'Mạng nơ-ron nhân tạo, lan truyền ngược (backpropagation) và tối ưu hóa Adam' },
    ],
    youtube: {
      title: 'Deep Learning & Neural Networks Cơ Bản Với PyTorch / TensorFlow',
      channel: 'Mì AI',
      url: 'https://www.youtube.com/watch?v=aircAruvnKk',
      videoId: 'aircAruvnKk',
      duration: '5 giờ • CNN, RNN',
    },
    quizTitle: '[AIL303m] Kiểm tra Nền tảng Học máy: Overfitting, Underfitting và Đánh giá Mô hình',
    practiceQuestions: [
      {
        question: 'Hàm kích hoạt (Activation function) phổ biến nhất trong các lớp ẩn của mạng nơ-ron hiện đại là gì?',
        options: ['Sigmoid', 'ReLU', 'Linear', 'Step function'],
        answer: 1,
        explanation: 'ReLU (Rectified Linear Unit) tính toán nhanh và hạn chế hiện tượng triệt tiêu gradient (vanishing gradient).',
      },
    ],
  },
  figma: {
    courseCode: 'GDE101',
    courseFallback: { code: 'GDE101', title: 'Nguyên lý thiết kế đồ họa' },
    materials: [
      { title: '[GDE101] Bộ Thư viện UI Kit & Design System Chuẩn Material 3 cho Figma', desc: 'Bố cục, quy tắc 60-30-10, typography và auto-layout tương tác prototype' },
    ],
    youtube: {
      title: 'Thiết Kế UI/UX Với Figma: Wireframe, Auto-layout & Interactive Prototype',
      channel: 'Figma Việt Nam',
      url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
      videoId: 'FTFaQWZBqQ8',
      duration: '3 giờ 45 phút • Design System',
    },
    quizTitle: 'Trắc nghiệm Nguyên lý Thiết kế UI/UX & Figma',
    practiceQuestions: [
      {
        question: 'Tính năng nào trong Figma giúp các thành phần tự co giãn linh hoạt theo nội dung bên trong?',
        options: ['Auto Layout', 'Smart Animate', 'Constraints only', 'Boolean Groups'],
        answer: 0,
        explanation: 'Auto Layout cho phép tạo các frame tự động căn chỉnh và co giãn linh hoạt (flexbox-like).',
      },
    ],
  },
  git: {
    courseCode: 'SWP391',
    courseFallback: { code: 'SWP391', title: 'Đồ án Ứng dụng Thực tế (Software Project)' },
    materials: [
      { title: '[SWP391] Cẩm nang Quy trình Agile/Scrum và Quản lý Source Code Git Flow', desc: 'Branching, Pull Request, Rebase vs Merge và giải quyết xung đột mã nguồn' },
    ],
    youtube: {
      title: 'Git & GitHub Thực Chiến: Quản Lý Source Code & Nhánh Nhóm',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      videoId: 'RGOj5yH7evk',
      duration: '1 giờ 15 phút • Git Flow & Conflict Resolution',
    },
    quizTitle: '[SWP391] Kiểm tra Kiến thức Agile/Scrum, User Stories & Quản trị Dự án',
    practiceQuestions: [
      {
        question: 'Lệnh nào dùng để kết hợp các commit từ nhánh khác vào nhánh hiện tại mà không tạo commit merge rác?',
        options: ['git push', 'git rebase', 'git reset', 'git checkout'],
        answer: 1,
        explanation: 'git rebase áp dụng lại các commit lên đỉnh nhánh đích, giữ lịch sử commit thẳng hàng và sạch sẽ.',
      },
    ],
  },
};

/**
 * Builds remediation packages for weak and missing skills
 * @param {Array<{ skillName, normalizedName, requiredLevel, studentLevel, gap }>} skills
 * @param {string} studentId
 */
const buildRemediationList = async (skills, studentId) => {
  if (!Array.isArray(skills) || skills.length === 0) return [];

  try {
    const [courses, materials, quizzes, enrollments] = await Promise.all([
      Course.find({ isActive: true }).lean().catch(() => []),
      Material.find().lean().catch(() => []),
      Quiz.find().lean().catch(() => []),
      studentId ? Enrollment.find({ student: studentId }).select('course status').lean().catch(() => []) : [],
    ]);

    const courseByCode = new Map(courses.map((c) => [c.code?.toUpperCase(), c]));
    const enrolledCourseIds = new Set(enrollments.map((e) => e.course?.toString()));

    return skills.map((rawItem) => {
      const item = typeof rawItem === 'string'
        ? { skillName: rawItem, normalizedName: rawItem.toLowerCase().trim() }
        : rawItem;
      const rawSkillName = item.skillName || item.name || '';
      const norm = (item.normalizedName || rawSkillName).toLowerCase().trim();
      const remData = REMEDIATION_KNOWLEDGE_BASE[norm] || {};

      // 1. Course linking
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
          description: `Học phần chuẩn bị năng lực cho kỹ năng ${rawSkillName || norm}`,
          isEnrolled: false,
        };
      } else {
        linkedCourse = {
          _id: null,
          code: 'SWP391',
          title: `Đồ án Phát triển & Thực hành (${rawSkillName || norm})`,
          description: `Học phần chuẩn bị năng lực và ứng dụng thực chiến cho kỹ năng ${rawSkillName || norm}`,
          isEnrolled: false,
        };
      }

      // 2. Material linking
      let linkedMaterials = materials
        .filter((m) => {
          if (linkedCourse?._id && m.course && m.course.toString() === linkedCourse._id.toString()) return true;
          return m.title && m.title.toLowerCase().includes(norm);
        })
        .map((m) => ({ _id: m._id, title: m.title, description: m.description }));

      if (linkedMaterials.length === 0 && remData.materials?.length) {
        linkedMaterials = remData.materials;
      }
      if (linkedMaterials.length === 0) {
        linkedMaterials = [
          {
            _id: null,
            title: `[Tài liệu STE] Giáo trình & Hướng dẫn Thực hành ${rawSkillName || norm} từ Cơ bản đến Nâng cao`,
            description: `Tài liệu tóm tắt kiến thức cốt lõi, best practices và bài tập rèn luyện kỹ năng ${rawSkillName || norm}`,
          },
        ];
      }

      // 3. Quiz linking
      let linkedQuiz = quizzes.find((q) => {
        if (linkedCourse?._id && q.course && q.course.toString() === linkedCourse._id.toString()) return true;
        return q.title && q.title.toLowerCase().includes(norm);
      });

      const quizPayload = linkedQuiz
        ? { _id: linkedQuiz._id, title: linkedQuiz.title, questionCount: linkedQuiz.questions?.length || 4 }
        : { _id: null, title: remData.quizTitle || `Trắc nghiệm ôn tập ${rawSkillName || norm}`, questionCount: 4 };

      const requiredNum = item.requiredLevel || 3;
      const studentNum = item.studentLevel || 0;

      return {
        skillName: rawSkillName || norm,
        normalizedName: norm,
        category: item.category || 'Software Engineering',
        requiredLevel: requiredNum,
        requiredLabel: PROFICIENCY_LABELS[requiredNum] || `Cấp ${requiredNum}`,
        studentLevel: studentNum,
        studentLabel: studentNum ? PROFICIENCY_LABELS[studentNum] : 'Chưa có',
        gap: item.gap || (studentNum ? Math.max(1, requiredNum - studentNum) : requiredNum),
        status: studentNum === 0 ? 'missing' : 'partial',
        course: linkedCourse,
        materials: linkedMaterials,
        youtube: remData.youtube || {
          title: `Khóa học & Bài giảng thực chiến ${item.skillName} từ Cơ bản đến Nâng cao`,
          channel: 'Học Lập Trình FPT',
          url: `https://www.youtube.com/results?search_query=hoc+lap+trinh+${encodeURIComponent(item.skillName)}`,
          videoId: null,
          duration: '3 - 5 giờ',
        },
        quiz: quizPayload,
        practiceQuestions: remData.practiceQuestions || [
          {
            question: `Nguyên tắc / kiến thức quan trọng nhất khi làm việc với ${item.skillName} là gì?`,
            options: [
              'Nắm chắc kiến trúc và luồng xử lý chuẩn',
              'Chỉ sao chép mã nguồn mà không kiểm thử',
              'Bỏ qua việc phân tích yêu cầu',
              'Không tuân thủ các quy chuẩn thiết kế',
            ],
            answer: 0,
            explanation: `Nắm chắc kiến trúc và luồng xử lý là nền tảng cốt lõi để làm chủ ${item.skillName}.`,
          },
        ],
      };
    });
  } catch (err) {
    console.error('[remediation] Error building remediation items:', err);
    return [];
  }
};

module.exports = {
  REMEDIATION_KNOWLEDGE_BASE,
  buildRemediationList,
  PROFICIENCY_LABELS,
};

