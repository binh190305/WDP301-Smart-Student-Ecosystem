/**
 * Remediation Service – SI-01 & SI-05
 * Curates 4-pillar actionable remediation for weak and missing skills:
 * 1. FPT University Courses (linked with 1-click enrollment, curriculum & detailed rationale)
 * 2. STE Study Materials (curated syllabi, slides, guides, cheat-sheets)
 * 3. YouTube Video Lectures (curated high-quality video tutorials with embed player)
 * 4. Practice Quizzes & Interactive Questions with Project Readiness Evaluation
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
  docker: {
    courseCode: 'SWP391',
    courseFallback: { code: 'SWP391', title: 'Đồ án Phát triển Ứng dụng Thực tế & Triển khai Cloud' },
    courseRationale:
      'Học phần SWP391 là đồ án thực chiến bắt buộc của sinh viên Kỹ thuật phần mềm FPT. Học phần này yêu cầu các nhóm phải đóng gói toàn bộ các dịch vụ frontend, backend và database vào Docker container, thiết lập docker-compose đa dịch vụ và đảm bảo môi trường chạy đồng nhất giữa local dev và production cloud.',
    curriculum: {
      bookTitle: 'Giáo trình Thực chiến Docker & Containerization cho Dự án Phần mềm',
      publisher: 'FPT University Academic Press & O\'Reilly Media',
      coreChapters: [
        'Chương 1: Kiến trúc Docker Engine, Images, Containers và Dockerfile đa tầng (Multi-stage build)',
        'Chương 2: Quản lý dữ liệu bền vững với Docker Volumes và liên kết mạng Container Network',
        'Chương 3: Điều phối cụm dịch vụ với Docker Compose phục vụ môi trường Testing & Production',
        'Chương 4: Bảo mật Container và Tối ưu hóa dung lượng Image cho hệ thống Web Fullstack',
      ],
    },
    materials: [
      { title: '[SWP391] Cẩm nang Containerization với Docker & Docker-Compose chuẩn FPT', desc: 'Tạo Dockerfile đa tầng, tối ưu image size, networking và cấu hình biến môi trường production' },
      { title: '[SWP391] Slide Bài giảng: Kiến trúc Microservices và Đóng gói Container', desc: 'Quy chuẩn đóng gói ứng dụng Node.js & React thành container độc lập' },
    ],
    youtube: {
      title: 'Docker & Docker-Compose Toàn Tập Cho Lập Trình Viên',
      channel: 'F8 Official',
      url: 'https://www.youtube.com/watch?v=pg19Z8LL06w',
      videoId: 'pg19Z8LL06w',
      duration: '2 giờ 30 phút • Containerize Node & React',
    },
    quizTitle: 'Trắc nghiệm Năng lực Thực hành Docker & Container Basics',
    practiceQuestions: [
      {
        question: 'Lệnh nào trong Dockerfile được dùng để chỉ định command chạy chính khi container khởi động?',
        options: ['RUN', 'CMD', 'ENV', 'EXPOSE'],
        answer: 1,
        explanation: 'CMD (hoặc ENTRYPOINT) quy định tiến trình chính sẽ chạy khi container start. RUN chỉ dùng để thực thi lệnh trong quá trình build image.',
      },
      {
        question: 'Để chia sẻ dữ liệu bền vững (persistent data) giữa host machine và Docker container, ta sử dụng cơ chế nào?',
        options: ['Docker Volumes', 'RAM Buffer', 'Temporary Cache', 'Image Layer'],
        answer: 0,
        explanation: 'Docker Volumes (hoặc Bind Mounts) cho phép lưu trữ dữ liệu bền vững bên ngoài vòng đời của container.',
      },
      {
        question: 'File docker-compose.yml phục vụ mục đích chính nào trong dự án phần mềm?',
        options: ['Biên dịch mã nguồn C++', 'Định nghĩa và điều phối khởi chạy đồng thời nhiều container dịch vụ liên kết', 'Quản lý phiên bản Git', 'Tạo máy ảo VMWare'],
        answer: 1,
        explanation: 'Docker Compose là công cụ định nghĩa và chạy các ứng dụng Docker đa container thông qua file YAML duy nhất.',
      },
      {
        question: 'Lệnh nào dùng để dừng và gỡ bỏ toàn bộ containers, networks được tạo bởi docker-compose?',
        options: ['docker-compose stop', 'docker-compose down', 'docker-compose exit', 'docker-compose rm -f'],
        answer: 1,
        explanation: 'docker-compose down dừng toàn bộ container và xóa các network mặc định được compose tạo ra.',
      },
    ],
  },

  'tailwind css': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    courseRationale:
      'FER202 là học phần trọng tâm về phát triển giao diện hiện đại tại FPT. Môn học đào tạo trực tiếp cách tích hợp Tailwind CSS vào React để xây dựng giao diện Responsive chuẩn UX, áp dụng hệ thống Design Tokens và tối ưu hóa CSS bundle khi đóng gói ứng dụng.',
    curriculum: {
      bookTitle: 'Giáo trình Thiết kế Giao diện Web Hiện đại với Tailwind CSS & React',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Triết lý Utility-First và Cấu hình Tailwind trong dự án React/Vite',
        'Chương 2: Thiết kế bố cục Responsive với Flexbox, CSS Grid và Breakpoints',
        'Chương 3: Tùy biến Theme, Typography, Dark Mode và Tối ưu hóa kích thước build',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Tailwind CSS Utility-First & Responsive Layout',
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
      {
        question: 'Class nào trong Tailwind CSS được dùng để áp dụng style khi người dùng rê chuột lên phần tử?',
        options: ['focus:', 'hover:', 'active:', 'visited:'],
        answer: 1,
        explanation: 'hover: là pseudo-class variant trong Tailwind CSS dùng cho tương tác rê chuột.',
      },
    ],
  },

  tailwind: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    courseRationale:
      'FER202 đào tạo thiết kế giao diện thích ứng với Tailwind CSS, chuẩn hóa UI Component và tối ưu trải nghiệm người dùng trong đồ án web.',
    curriculum: {
      bookTitle: 'Giáo trình Thiết kế Giao diện Web Hiện đại với Tailwind CSS',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Cấu hình Tailwind trong dự án React/Vite',
        'Chương 2: Thiết kế bố cục Responsive và Tối ưu CSS bundle',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Tailwind CSS Utility-First & Responsive Layout',
    practiceQuestions: [
      {
        question: 'Để căn giữa một phần tử theo cả hai trục bằng Flexbox trong Tailwind CSS, tổ hợp class nào đúng?',
        options: ['flex items-center justify-center', 'flex center-all', 'display-flex align-center', 'box-center'],
        answer: 0,
        explanation: 'items-center căn giữa trục phụ, justify-center căn giữa trục chính.',
      },
      {
        question: 'Class nào trong Tailwind CSS được dùng để áp dụng style khi người dùng rê chuột lên phần tử?',
        options: ['focus:', 'hover:', 'active:', 'visited:'],
        answer: 1,
        explanation: 'hover: áp dụng trạng thái khi di chuột.',
      },
    ],
  },

  redux: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    courseRationale:
      'FER202 & SWP391 yêu cầu các ứng dụng web quy mô nhóm phải quản lý trạng thái tập trung. Môn học hướng dẫn xây dựng Redux Store chuẩn với Redux Toolkit, quản lý luồng dữ liệu 1 chiều (Unidirectional data flow) và cache trạng thái server với RTK Query nhằm tránh re-render lãng phí.',
    curriculum: {
      bookTitle: 'Giáo trình Quản lý Trạng thái Ứng dụng Toàn cục với Redux Toolkit & React',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Kiến trúc State Management và Vòng lặp Dispatch ➔ Reducer ➔ Store',
        'Chương 2: Tối ưu hóa với createSlice, configureStore và Immer Library',
        'Chương 3: Xử lý tác vụ bất đồng bộ với createAsyncThunk và RTK Query',
      ],
    },
    materials: [
      { title: '[FER202] Quản lý Trạng thái Ứng dụng Toàn cục với Redux Toolkit & RTK Query', desc: 'createSlice, configureStore, createAsyncThunk và luồng dữ liệu 1 chiều' },
      { title: '[FER202] Slide: So sánh Context API vs Redux Toolkit trong Ứng dụng Lớn', desc: 'Khi nào nên dùng Context API và khi nào cần Redux Toolkit' },
    ],
    youtube: {
      title: 'Redux Toolkit Siêu Dễ Hiểu & Thực Chiến Với React',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=kAO_V2lZuhA',
      videoId: 'kAO_V2lZuhA',
      duration: '1 giờ 45 phút • Redux Toolkit',
    },
    quizTitle: 'Trắc nghiệm Năng lực Quản lý Trạng thái Redux Toolkit',
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
      {
        question: 'Hook nào trong thư viện react-redux dùng để trích xuất dữ liệu từ Redux Store vào React component?',
        options: ['useDispatch', 'useSelector', 'useStore', 'useReducer'],
        answer: 1,
        explanation: 'useSelector cho phép component lắng nghe và trích xuất đúng phần state cần thiết từ Redux store.',
      },
    ],
  },

  'redux toolkit': {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    courseRationale:
      'Học phần FER202 đào tạo chuyên sâu Redux Toolkit để đồng bộ trạng thái giữa các component phức tạp trong hệ sinh thái ứng dụng web.',
    curriculum: {
      bookTitle: 'Giáo trình Redux Toolkit & State Management Thực Chiến',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Khởi tạo Store và Slice với Redux Toolkit',
        'Chương 2: Xử lý AsyncThunk và Tích hợp API',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Quản lý Trạng thái Redux Toolkit',
    practiceQuestions: [
      {
        question: 'Hàm nào trong Redux Toolkit tự động tạo cả action creators và action types?',
        options: ['createAction', 'createSlice', 'combineReducers', 'createStore'],
        answer: 1,
        explanation: 'createSlice nhận name và reducers map rồi tự động sinh ra actions tương ứng.',
      },
      {
        question: 'Hook nào trong react-redux dùng để gửi (dispatch) một action lên Redux Store?',
        options: ['useSelector', 'useDispatch', 'useAction', 'useContext'],
        answer: 1,
        explanation: 'useDispatch trả về dispatch function để kích hoạt state update.',
      },
    ],
  },

  'rest api': {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    courseRationale:
      'PRJ301 là học phần tiêu chuẩn đào tạo kỹ thuật thiết kế và xây dựng các dịch vụ Web RESTful. Môn học trang bị nguyên lý thiết kế Resource URI, chuẩn hóa HTTP methods (GET, POST, PUT, DELETE), quản lý mã trạng thái HTTP chuẩn và bảo mật giao tiếp client-server bằng JWT token.',
    curriculum: {
      bookTitle: 'Giáo trình Thiết kế & Xây dựng Dịch vụ RESTful Web Services',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Kiến trúc Client-Server, Stateless Protocol và Các nguyên tắc ràng buộc REST',
        'Chương 2: Thiết kế Resource Endpoints, HTTP Verbs và Chuẩn hóa Phản hồi JSON',
        'Chương 3: Cơ chế Xác thực & Phân quyền với JWT, CORS, Rate Limiting và Error Handling',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Thiết kế RESTful API & HTTP Protocols',
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
      {
        question: 'Tiêu đề (Header) HTTP nào thường được dùng để gửi JSON Web Token xác thực danh tính người dùng?',
        options: ['Authentication-Key', 'Authorization: Bearer <token>', 'Token-Verify', 'User-Signature'],
        answer: 1,
        explanation: 'Chuẩn RFC 6750 quy định Authorization header với scheme Bearer dùng để truyền token.',
      },
    ],
  },

  api: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    courseRationale:
      'PRJ301 đào tạo nền tảng giao tiếp API giữa frontend và backend, xử lý bất đồng bộ và kiểm soát dữ liệu an toàn.',
    curriculum: {
      bookTitle: 'Giáo trình Thiết kế Dịch vụ API Chuẩn Công Nghiệp',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Các giao thức API (REST, WebSocket)',
        'Chương 2: Thiết kế JSON Contract và Mã trạng thái HTTP',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Giao tiếp API & Backend Service',
    practiceQuestions: [
      {
        question: 'Phương thức HTTP nào dùng để lấy dữ liệu mà không làm thay đổi trạng thái server?',
        options: ['POST', 'GET', 'PUT', 'DELETE'],
        answer: 1,
        explanation: 'GET là phương thức an toàn (safe method) chỉ dùng để đọc dữ liệu.',
      },
    ],
  },

  react: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend với React' },
    courseRationale:
      'FER202 là học phần chuyên sâu về lập trình giao diện React tại FPT University, giảng dạy toàn diện kiến trúc Single Page Application, React Hooks, Custom Hooks, Redux Toolkit và tối ưu hiệu năng giao diện người dùng theo chuẩn công nghiệp.',
    curriculum: {
      bookTitle: 'Giáo trình ReactJS & TypeScript Thực Chiến: Từ Cơ Bản Đến Nâng Cao',
      publisher: 'FPT University Academic Press & O\'Reilly Media',
      coreChapters: [
        'Chương 1: Virtual DOM, JSX, Component Architecture và Props drilling',
        'Chương 2: Làm chủ React Hooks: useState, useEffect, useRef, useMemo, useCallback',
        'Chương 3: Quản lý State toàn cục với Context API và Redux Toolkit',
        'Chương 4: Tối ưu Render, Code Splitting với React.lazy và React Router DOM',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Chuyên sâu React Hooks, State & Component Architecture',
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
      {
        question: 'Trong React, prop đặc biệt "key" được truyền vào các phần tử của danh sách nhằm mục đích gì?',
        options: ['Tạo id cho phần tử HTML', 'Giúp Virtual DOM nhận diện và tối ưu cập nhật các phần tử thay đổi', 'Đặt tên biến trong State', 'Bắt buộc của JavaScript'],
        answer: 1,
        explanation: 'Key giúp React xác định phần tử nào bị thay đổi, thêm mới hoặc xóa bỏ trong danh sách ảo.',
      },
      {
        question: 'Hook nào cho phép truy cập trực tiếp giá trị của Context mà không cần dùng Consumer component?',
        options: ['useReducer', 'useContext', 'useCallback', 'useMemo'],
        answer: 1,
        explanation: 'useContext chấp nhận context object và trả về context value hiện tại.',
      },
    ],
  },

  'node.js': {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Dịch vụ Backend' },
    courseRationale:
      'PRJ301 trang bị nền tảng kiến trúc backend hướng dịch vụ, lập trình RESTful API bất đồng bộ với Event Loop, xử lý xác thực bảo mật JWT và kết nối hệ quản trị cơ sở dữ liệu.',
    curriculum: {
      bookTitle: 'Giáo trình Lập Trình Backend Bất Đồng Bộ với Node.js & REST API',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Kiến trúc Single-Threaded Event Loop và Thư viện Libuv',
        'Chương 2: Xử lý Asynchronous Programming với Promises và Async/Await',
        'Chương 3: Xây dựng RESTful Services, Module System và Kết nối Database',
      ],
    },
    materials: [
      { title: '[PRJ301] Mẫu Thiết kế Kiến trúc MVC và RESTful Service với Node.js', desc: 'Middleware, JWT Authentication, Error handling và tối ưu I/O bất đồng bộ' },
    ],
    youtube: {
      title: 'Lập Trình RESTful API Với Node.js & Express Từ Số 0',
      channel: 'Hỏi Dân IT',
      url: 'https://www.youtube.com/watch?v=1F2W96eK4qg',
      videoId: '1F2W96eK4qg',
      duration: '10 giờ • 45 bài giảng',
    },
    quizTitle: 'Trắc nghiệm Năng lực Node.js Backend & Asynchronous Architecture',
    practiceQuestions: [
      {
        question: 'Node.js hoạt động dựa trên cơ chế nào để xử lý đồng thời nhiều kết nối I/O?',
        options: ['Đa luồng đồng bộ', 'Event Loop & Non-blocking I/O', 'Tiến trình con độc lập', 'Web Worker'],
        answer: 1,
        explanation: 'Node.js sử dụng kiến trúc Single-threaded Event Loop phối hợp Non-blocking I/O của libuv.',
      },
      {
        question: 'Module lõi nào trong Node.js cung cấp các API đọc và ghi tệp tin trên hệ điều hành?',
        options: ['http', 'fs', 'path', 'os'],
        answer: 1,
        explanation: 'fs (File System) là module tích hợp sẵn cho các thao tác tệp tin trong Node.js.',
      },
      {
        question: 'Đối tượng toàn cục nào trong Node.js cung cấp thông tin và điều khiển tiến trình đang chạy?',
        options: ['window', 'global.process', 'document', 'system'],
        answer: 1,
        explanation: 'process là đối tượng cung cấp môi trường biến env, exit code và luồng thực thi tiến trình.',
      },
    ],
  },

  express: {
    courseCode: 'PRJ301',
    courseFallback: { code: 'PRJ301', title: 'Lập trình Web & Backend Service' },
    courseRationale:
      'PRJ301 đào tạo trực tiếp cách xây dựng REST API với Express, cấu hình middleware xác thực, phân quyền role-based access control và xử lý lỗi tập trung.',
    curriculum: {
      bookTitle: 'Giáo trình Xây dựng Web API Chuyên nghiệp với Express.js',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Express Router, Request/Response Lifecycle',
        'Chương 2: Middleware Pipeline và Xác thực JWT',
        'Chương 3: Xử lý ngoại lệ tập trung và Bảo mật CORS/Helmet',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Express Middleware Pipeline & Routing',
    practiceQuestions: [
      {
        question: 'Trong middleware của Express, tham số thứ 3 thường được dùng để chuyển tiếp request là gì?',
        options: ['return', 'next()', 'forward()', 'dispatch()'],
        answer: 1,
        explanation: 'Gọi next() để chuyển quyền điều khiển sang middleware tiếp theo trong pipeline.',
      },
      {
        question: 'Để đọc dữ liệu JSON gửi lên từ body của POST request trong Express 4.16+, ta cấu hình middleware nào?',
        options: ['express.bodyParser()', 'express.json()', 'express.urlencoded()', 'express.parser()'],
        answer: 1,
        explanation: 'express.json() là built-in middleware phân tích cú pháp incoming payload JSON.',
      },
      {
        question: 'Middleware xử lý lỗi trong Express (Error handling middleware) có điểm đặc trưng gì ở danh sách tham số?',
        options: ['Chỉ nhận 1 tham số', 'Có đúng 4 tham số (err, req, res, next)', 'Không nhận tham số nào', 'Có 2 tham số (err, res)'],
        answer: 1,
        explanation: 'Express định danh error-handling middleware qua việc nhận đủ 4 tham số (err, req, res, next).',
      },
    ],
  },

  typescript: {
    courseCode: 'FER202',
    courseFallback: { code: 'FER202', title: 'Lập trình Web Frontend Nâng cao' },
    courseRationale:
      'FER202 nâng cao tích hợp TypeScript vào dự án nhằm chuẩn hóa Type-safety cho props, redux state và contract API, loại trừ lỗi runtime trước khi deploy.',
    curriculum: {
      bookTitle: 'Giáo trình TypeScript & Lập Trình An Toàn Kiểu cho Ứng Dụng Web',
      publisher: 'FPT University Academic Press & O\'Reilly Media',
      coreChapters: [
        'Chương 1: Hệ thống kiểu tĩnh, Type Inference và Type Annotations',
        'Chương 2: Interfaces, Type Aliases, Union và Intersection Types',
        'Chương 3: Generics nâng cao và Utility Types trong React/Node projects',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực TypeScript Typings & Generics',
    practiceQuestions: [
      {
        question: 'Từ khóa nào trong TypeScript dùng để tạo một type alias hoặc hợp nhất giao diện dữ liệu?',
        options: ['interface / type', 'struct', 'typedef', 'class only'],
        answer: 0,
        explanation: 'TypeScript sử dụng cả "interface" và "type" để định nghĩa hình dạng (shape) của dữ liệu.',
      },
      {
        question: 'Kiểu dữ liệu nào trong TypeScript đại diện cho giá trị có thể là bất kỳ kiểu gì và buộc phải kiểm tra kiểu trước khi sử dụng an toàn?',
        options: ['any', 'unknown', 'never', 'void'],
        answer: 1,
        explanation: 'unknown là type an toàn hơn any; không thể gọi method trên biến kiểu unknown nếu chưa type-guard.',
      },
      {
        question: 'Generic trong TypeScript được ký hiệu bằng cặp dấu nào?',
        options: ['(T)', '[T]', '<T>', '{T}'],
        answer: 2,
        explanation: 'Dấu ngoặc nhọn <T> là ký hiệu tiêu chuẩn cho kiểu tham số Generics.',
      },
    ],
  },

  mongodb: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    courseRationale:
      'DBI202 & SWP391 hướng dẫn thiết kế mô hình dữ liệu NoSQL, xây dựng schema với Mongoose, tối ưu hóa aggregation pipeline và lập chỉ mục Index cho các hệ thống lớn.',
    curriculum: {
      bookTitle: 'Giáo trình Cơ Sở Dữ Liệu NoSQL & MongoDB Thực Chiến',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Kiến trúc Document Database, Collections và CRUD operations',
        'Chương 2: Thiết kế Schema với Mongoose ODM và Ràng buộc dữ liệu',
        'Chương 3: Aggregation Framework, Indexing và Tối ưu hiệu năng truy vấn',
      ],
    },
    materials: [
      { title: '[DBI202] Cheat-sheet Tối ưu hóa Truy vấn NoSQL và Đánh chỉ mục Index B-Tree', desc: 'Mô hình dữ liệu NoSQL vs RDBMS, indexing và tối ưu truy vấn khối lượng lớn' },
    ],
    youtube: {
      title: 'Lập trình Cơ sở dữ liệu NoSQL MongoDB & Mongoose Thực Chiến',
      channel: 'TechMaster Việt Nam',
      url: 'https://www.youtube.com/watch?v=ofme2o29ngU',
      videoId: 'ofme2o29ngU',
      duration: '3 giờ • Thực hành CRUD & Indexing',
    },
    quizTitle: 'Trắc nghiệm Năng lực NoSQL MongoDB & Mongoose Modeling',
    practiceQuestions: [
      {
        question: 'Trong MongoDB, trường nào sau đây tự động được gán làm khóa chính mặc định cho mỗi document?',
        options: ['id', '_id', 'uuid', 'key'],
        answer: 1,
        explanation: '_id là trường định danh duy nhất (ObjectId) bắt buộc trong mỗi MongoDB document.',
      },
      {
        question: 'Phương thức nào trong Mongoose cho phép liên kết dữ liệu giữa các documents khác collection thông qua ObjectId tham chiếu?',
        options: ['join()', 'populate()', 'merge()', 'lookup()'],
        answer: 1,
        explanation: 'populate() trong Mongoose thay thế ObjectId tham chiếu bằng document thực tế từ collection khác.',
      },
      {
        question: 'Để tối ưu hóa tốc độ tìm kiếm trên các trường thường xuyên được truy vấn, kỹ thuật nào được áp dụng?',
        options: ['Đánh chỉ mục Index', 'Tăng RAM', 'Chuyển sang SQL', 'Bỏ qua validation'],
        answer: 0,
        explanation: 'Index tạo cấu trúc dữ liệu B-Tree giúp tìm kiếm nhanh mà không cần quét toàn bộ collection (Colscan).',
      },
    ],
  },

  sql: {
    courseCode: 'DBI202',
    courseFallback: { code: 'DBI202', title: 'Hệ quản trị cơ sở dữ liệu' },
    courseRationale:
      'DBI202 là môn học cốt lõi về Hệ quản trị cơ sở dữ liệu quan hệ, đào tạo cách thiết kế lược đồ ERD, chuẩn hóa 3NF, viết câu truy vấn phức tạp (Join, Subquery, Window function) và đánh chỉ mục B-Tree.',
    curriculum: {
      bookTitle: 'Giáo trình Cơ Sở Dữ Liệu Quan Hệ & Ngôn Ngữ Truy Vấn SQL Chuẩn DBI202',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Thiết kế Lược đồ Thực thể Liên kết (ERD) và Chuẩn hóa Dữ liệu (1NF, 2NF, 3NF)',
        'Chương 2: Truy vấn nâng cao: Subqueries, Multi-table Joins và Aggregate Functions',
        'Chương 3: Giao dịch ACID, Stored Procedures, Triggers và Lập chỉ mục Index',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Thiết kế & Truy vấn SQL Nâng cao (DBI202)',
    practiceQuestions: [
      {
        question: 'Mệnh đề nào dùng để lọc kết quả sau khi đã gom nhóm bằng GROUP BY?',
        options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'],
        answer: 1,
        explanation: 'HAVING được sử dụng để lọc trên các giá trị tổng hợp (aggregate functions) sau GROUP BY.',
      },
      {
        question: 'Loại JOIN nào trả về tất cả các bản ghi từ bảng bên trái và các bản ghi khớp từ bảng bên phải?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
        answer: 1,
        explanation: 'LEFT JOIN giữ lại toàn bộ bản ghi của bảng bên trái, nếu bảng phải không khớp sẽ điền NULL.',
      },
      {
        question: 'Ràng buộc nào đảm bảo giá trị trong một cột không được trùng lặp giữa các hàng trong bảng?',
        options: ['NOT NULL', 'CHECK', 'UNIQUE', 'DEFAULT'],
        answer: 2,
        explanation: 'Ràng buộc UNIQUE bắt buộc mọi giá trị trong cột phải là duy nhất.',
      },
    ],
  },

  python: {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy & Xử lý Dữ liệu Thông minh' },
    courseRationale:
      'AIL303m sử dụng Python làm ngôn ngữ chủ đạo để xử lý tập dữ liệu lớn, lập trình hướng đối tượng và xây dựng các thuật toán thông minh trong đồ án.',
    curriculum: {
      bookTitle: 'Giáo trình Lập Trình Python Cho Khoa Học Dữ Liệu & Trí Tuệ Nhân Tạo',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Cú pháp nâng cao, List Comprehension, Generators và OOP trong Python',
        'Chương 2: Thao tác dữ liệu ma trận với NumPy và Cấu trúc bảng với Pandas',
        'Chương 3: Trực quan hóa dữ liệu với Matplotlib, Seaborn và Xây dựng Pipeline',
      ],
    },
    materials: [
      { title: '[AIL303m] Bài giảng Chuyên sâu: Lập trình Python & Thư viện Khoa học Dữ liệu', desc: 'Bài giảng lập trình Python, xử lý dữ liệu với NumPy, Pandas và Scikit-Learn' },
    ],
    youtube: {
      title: 'Khóa học Lập trình Python Cơ Bản Đến Nâng Cao Cho Người Mới Bắt Đầu',
      channel: 'Kteam',
      url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
      videoId: 'kqtD5dpn9C8',
      duration: '8 giờ • Thực hành bài bản',
    },
    quizTitle: 'Trắc nghiệm Năng lực Lập trình Python & Thao tác Dữ liệu',
    practiceQuestions: [
      {
        question: 'Cấu trúc dữ liệu nào trong Python mang tính bất biến (immutable)?',
        options: ['List', 'Dictionary', 'Set', 'Tuple'],
        answer: 3,
        explanation: 'Tuple trong Python là immutable; một khi được tạo thì không thể thay đổi giá trị các phần tử.',
      },
      {
        question: 'Thư viện nào là tiêu chuẩn trong Python để thao tác và phân tích cấu trúc dữ liệu bảng (DataFrame)?',
        options: ['NumPy', 'Pandas', 'Requests', 'Flask'],
        answer: 1,
        explanation: 'Pandas cung cấp cấu trúc DataFrame mạnh mẽ cho phân tích dữ liệu dạng bảng.',
      },
      {
        question: 'Từ khóa nào dùng để định nghĩa một hàm ẩn danh (anonymous function) ngắn gọn trong Python?',
        options: ['def', 'func', 'lambda', 'anonymous'],
        answer: 2,
        explanation: 'lambda được dùng để định nghĩa hàm một dòng không tên trong Python.',
      },
    ],
  },

  'machine learning': {
    courseCode: 'AIL303m',
    courseFallback: { code: 'AIL303m', title: 'Học máy' },
    courseRationale:
      'AIL303m là học phần chuyên sâu về Học máy, hướng dẫn quy trình từ tiền xử lý dữ liệu, trích xuất đặc trưng, huấn luyện mô hình Scikit-Learn và đánh giá chỉ số F1/AUC-ROC.',
    curriculum: {
      bookTitle: 'Giáo trình Học Máy & Thuật Toán Phân Lớp Ứng Dụng AIL303m',
      publisher: 'FPT University Academic Press & Springer',
      coreChapters: [
        'Chương 1: Tiền xử lý dữ liệu, Chuẩn hóa đặc trưng và Phân chia Train/Validation/Test',
        'Chương 2: Thuật toán có giám sát: Hồi quy tuyến tính, Cây quyết định, Random Forest, SVM',
        'Chương 3: Học không giám sát (Clustering K-Means) và Đánh giá ma trận Confusion Matrix, F1-Score',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Thuật toán Học máy & Đánh giá Mô hình',
    practiceQuestions: [
      {
        question: 'Kỹ thuật nào dùng để ngăn chặn hiện tượng Overfitting trong mô hình học máy?',
        options: ['Tăng độ phức tạp mô hình', 'Regularization (L1/L2) & K-Fold Cross-Validation', 'Giảm số lượng mẫu huấn luyện', 'Bỏ qua bước Validation'],
        answer: 1,
        explanation: 'Regularization phạt các trọng số quá lớn, giúp mô hình tổng quát hóa tốt hơn và tránh học vẹt dữ liệu.',
      },
      {
        question: 'Trong bài toán phân loại nhị phân mất cân bằng dữ liệu (imbalanced classes), chỉ số đánh giá nào tốt hơn Accuracy?',
        options: ['Accuracy', 'F1-Score (hoặc PR-AUC)', 'MSE', 'R-squared'],
        answer: 1,
        explanation: 'F1-score cân bằng giữa Precision và Recall, phản ánh chính xác hiệu năng khi số lượng mẫu chênh lệch lớn.',
      },
      {
        question: 'Thuật toán nào sau đây thuộc nhóm học máy không giám sát (Unsupervised Learning)?',
        options: ['Linear Regression', 'Logistic Regression', 'K-Means Clustering', 'Support Vector Machine'],
        answer: 2,
        explanation: 'K-Means phân cụm các điểm dữ liệu dựa trên khoảng cách mà không cần nhãn mục tiêu (unlabeled data).',
      },
    ],
  },

  figma: {
    courseCode: 'GDE101',
    courseFallback: { code: 'GDE101', title: 'Nguyên lý thiết kế đồ họa & Giao diện' },
    courseRationale:
      'GDE101 / SWP391 yêu cầu sinh viên thiết kế Wireframe, Design System và Prototype tương tác trên Figma trước khi bước vào giai đoạn code, đảm bảo trải nghiệm người dùng tối ưu.',
    curriculum: {
      bookTitle: 'Giáo trình Thiết Kế Giao Diện UI/UX & Xây Dựng Design System với Figma',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Nguyên tắc thị giác, Phân cấp thông tin, Typography và Hệ màu 60-30-10',
        'Chương 2: Thiết kế Component, Variants, Auto-Layout và Design Tokens',
        'Chương 3: Xây dựng Prototype tương tác (Interactive Prototyping) và Usability Testing',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Thiết kế UI/UX & Nguyên tắc Figma',
    practiceQuestions: [
      {
        question: 'Tính năng nào trong Figma giúp các thành phần tự co giãn linh hoạt theo nội dung bên trong?',
        options: ['Auto Layout', 'Smart Animate', 'Constraints only', 'Boolean Groups'],
        answer: 0,
        explanation: 'Auto Layout cho phép tạo các frame tự động căn chỉnh và co giãn linh hoạt theo kích thước nội dung.',
      },
      {
        question: 'Khái niệm nào trong Figma cho phép tạo nhiều trạng thái (states) như Hover, Pressed, Disabled cho cùng một component?',
        options: ['Variants', 'Frames', 'Masks', 'Slices'],
        answer: 0,
        explanation: 'Variants gom nhóm các biến thể của component để dễ dàng chuyển đổi trạng thái khi thiết kế.',
      },
    ],
  },

  git: {
    courseCode: 'SWP391',
    courseFallback: { code: 'SWP391', title: 'Đồ án Ứng dụng Thực tế (Software Project)' },
    courseRationale:
      'SWP391 bắt buộc sinh viên làm việc nhóm theo mô hình GitFlow, tạo nhánh feature, thực hiện Pull Request, review code và giải quyết xung đột mã nguồn thực tế.',
    curriculum: {
      bookTitle: 'Cẩm nang Quản Lý Mã Nguồn và Quy Trình Hợp Tác Nhóm với Git & GitHub',
      publisher: 'FPT University Academic Press',
      coreChapters: [
        'Chương 1: Kiến trúc phân tán của Git: Working Directory, Staging Area và Repository',
        'Chương 2: Nhánh (Branches), Chiến lược GitFlow và Quy trình Pull Request / Code Review',
        'Chương 3: Rebase, Cherry-pick, Stash và Kỹ thuật giải quyết xung đột Merge Conflicts',
      ],
    },
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
    quizTitle: 'Trắc nghiệm Năng lực Quản trị Mã nguồn Git & GitFlow',
    practiceQuestions: [
      {
        question: 'Lệnh nào dùng để kết hợp các commit từ nhánh khác vào nhánh hiện tại mà không tạo commit merge rác?',
        options: ['git push', 'git rebase', 'git reset', 'git checkout'],
        answer: 1,
        explanation: 'git rebase áp dụng lại các commit lên đỉnh nhánh đích, giữ lịch sử commit thẳng hàng và sạch sẽ.',
      },
      {
        question: 'Lệnh nào giúp lưu tạm thời các thay đổi chưa commit vào stack để chuyển nhánh khẩn cấp?',
        options: ['git stash', 'git pause', 'git freeze', 'git hold'],
        answer: 0,
        explanation: 'git stash cất giữ các sửa đổi chưa commit vào một stack và khôi phục working tree sạch.',
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

      const courseRationale =
        remData.courseRationale ||
        `Học phần ${linkedCourse?.code || 'SWP391'} được bộ môn chuẩn hóa kiến trúc đầu ra trực tiếp tương ứng với các năng lực của kỹ năng ${rawSkillName || norm}, giúp người học rèn luyện thực hành và bù đắp khoảng cách kỹ năng nhanh nhất phục vụ đồ án.`;

      const curriculum =
        remData.curriculum || {
          bookTitle: `Giáo trình Chuẩn Ngành Kỹ thuật Phần mềm: ${rawSkillName || norm} & Kiến trúc Ứng dụng`,
          publisher: 'FPT University Academic Press & O\'Reilly Media',
          coreChapters: [
            `Chương 1 - 2: Nguyên lý cốt lõi và Thiết lập môi trường thực hành ${rawSkillName || norm}`,
            `Chương 3 - 5: Các mẫu thiết kế thực chiến và Tối ưu hóa hiệu năng`,
            `Chương 6: Tích hợp hoàn chỉnh vào đồ án và Triển khai hệ thống`,
          ],
        };

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
          {
            _id: null,
            title: `[Tài liệu STE] Slide Bài giảng Chuyên sâu & Cheat-sheet Tối ưu hóa ${rawSkillName || norm}`,
            description: `Slide tổng hợp quy chuẩn kỹ thuật và các lỗi thường gặp khi triển khai ${rawSkillName || norm}`,
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
        : { _id: null, title: remData.quizTitle || `Trắc nghiệm ôn tập & Đánh giá năng lực ${rawSkillName || norm}`, questionCount: (remData.practiceQuestions?.length || 4) };

      const requiredNum = item.requiredLevel || 3;
      const studentNum = item.studentLevel || 0;

      const fallbackPracticeQuestions = [
        {
          question: `Nguyên tắc / kiến thức quan trọng nhất khi làm việc với ${rawSkillName || norm} trong dự án là gì?`,
          options: [
            'Nắm chắc kiến trúc và luồng xử lý chuẩn',
            'Chỉ sao chép mã nguồn mà không kiểm thử',
            'Bỏ qua việc phân tích yêu cầu',
            'Không tuân thủ các quy chuẩn thiết kế',
          ],
          answer: 0,
          explanation: `Nắm chắc kiến trúc và luồng xử lý là nền tảng cốt lõi để làm chủ ${rawSkillName || norm}.`,
        },
        {
          question: `Khi triển khai ${rawSkillName || norm} trong môi trường sản phẩm (production), yếu tố nào cần ưu tiên hàng đầu?`,
          options: [
            'Tính ổn định, bảo mật và khả năng mở rộng',
            'Chỉ quan tâm chạy được ở môi trường cá nhân',
            'Bỏ qua việc ghi log lỗi',
            'Tắt toàn bộ các lớp xác thực',
          ],
          answer: 0,
          explanation: 'Môi trường production đòi hỏi tính ổn định, bảo mật và khả năng giám sát lỗi liên tục.',
        },
        {
          question: `Để kiểm tra và chứng minh năng lực kỹ năng ${rawSkillName || norm} đạt chuẩn đồ án, sinh viên cần làm gì?`,
          options: [
            'Hoàn thành bài kiểm tra năng lực và nộp bằng chứng mã nguồn thực tế',
            'Chỉ tự đánh giá mà không cần kiểm chứng',
            'Chờ đợi đánh giá ngẫu nhiên',
            'Không cần nộp bài tập',
          ],
          answer: 0,
          explanation: 'Bằng chứng thực nghiệm (bài quiz điểm cao, repository, bài tập) là căn cứ xác thực duy nhất.',
        },
      ];

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
        courseRationale,
        curriculum,
        materials: linkedMaterials,
        youtube: remData.youtube || {
          title: `Khóa học & Bài giảng thực chiến ${rawSkillName || norm} từ Cơ bản đến Nâng cao`,
          channel: 'Học Lập Trình FPT',
          url: `https://www.youtube.com/results?search_query=hoc+lap+trinh+${encodeURIComponent(rawSkillName || norm)}`,
          videoId: null,
          duration: '3 - 5 giờ • Toàn diện',
        },
        quiz: quizPayload,
        practiceQuestions: remData.practiceQuestions && remData.practiceQuestions.length > 0
          ? remData.practiceQuestions
          : fallbackPracticeQuestions,
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
