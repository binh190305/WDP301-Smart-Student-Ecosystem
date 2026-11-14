/**
 * Rich Demo Data Seeder for Smart Student Ecosystem (STE)
 * Enriches users, courses, assignments, submissions, announcements, materials, quizzes, and posts
 * Run: node src/utils/seed-demo-rich.js
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
  Announcement,
  Material,
  Quiz,
  Post,
  Comment,
} = require('../models');

const DEFAULT_PASSWORD = 'Fptu@2026';

// ─── 1. NEW USERS (STUDENTS & LECTURERS) ────────────────────────────────────
const NEW_LECTURERS = [
  {
    name: 'ThS. Hoàng Đình Quang',
    email: 'quanghd@fe.edu.vn',
    role: 'lecturer',
    major: 'Kỹ thuật phần mềm',
    description: 'Giảng viên chuyên ngành Web & Di động, phụ trách các học phần FER202, SWP391.',
    skills: ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Next.js'],
  },
  {
    name: 'TS. Nguyễn Minh Châu',
    email: 'chaunm@fe.edu.vn',
    role: 'lecturer',
    major: 'Trí tuệ nhân tạo',
    description: 'Trưởng bộ môn Khoa học Dữ liệu & AI, giảng dạy học máy và phân tích dữ liệu lớn.',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'Data Science'],
  },
];

const NEW_STUDENTS = [
  {
    name: 'Lê Hoàng Long',
    email: 'longlhse162100@fpt.edu.vn',
    major: 'Kỹ thuật phần mềm',
    gpa: 3.75,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Git'],
    interests: ['Web Frontend', 'UI/UX Design', 'Khởi nghiệp'],
    description: 'Sinh viên năm 3 đam mê lập trình Web hiện đại, có kinh nghiệm làm việc với React Hooks và Vite.',
  },
  {
    name: 'Phan Công Bình',
    email: 'binhpcse160911@fpt.edu.vn',
    major: 'Kỹ thuật phần mềm',
    gpa: 3.65,
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Microservices'],
    interests: ['Backend Development', 'Kiến trúc hệ thống', 'DevOps'],
    description: 'Chuyên về phát triển dịch vụ Backend với Java Spring Boot và tối ưu hiệu năng cơ sở dữ liệu.',
  },
  {
    name: 'Nguyễn Thị Phương Thảo',
    email: 'thaontpse163422@fpt.edu.vn',
    major: 'Trí tuệ nhân tạo',
    gpa: 3.82,
    skills: ['Python', 'PyTorch', 'Computer Vision', 'Pandas', 'Machine Learning'],
    interests: ['AI trong Y tế', 'Nhận diện hình ảnh', 'Nghiên cứu khoa học'],
    description: 'Thành viên phòng Lab AI, nghiên cứu mô hình thị giác máy tính và ứng dụng chẩn đoán hình ảnh.',
  },
  {
    name: 'Hoàng Quốc Việt',
    email: 'viethqse161544@fpt.edu.vn',
    major: 'An toàn thông tin',
    gpa: 3.4,
    skills: ['Linux', 'Network Security', 'Python', 'Ethical Hacking', 'Docker'],
    interests: ['Bảo mật ứng dụng Web', 'CTF', 'An ninh mạng'],
    description: 'Yêu thích kiểm thử xâm nhập (Penetration Testing) và đánh giá an toàn hệ thống thông tin.',
  },
  {
    name: 'Trần Diệu Linh',
    email: 'linhtdse164100@fpt.edu.vn',
    major: 'Thiết kế đồ họa',
    gpa: 3.55,
    skills: ['Figma', 'UI/UX', 'Design System', 'Adobe Illustrator', 'Wireframe'],
    interests: ['UI/UX Mobile', 'Trải nghiệm người dùng', 'Design Thinking'],
    description: 'Chuyên viên thiết kế giao diện ứng dụng, tạo prototype tương tác và xây dựng Design System chuẩn Material 3.',
  },
  {
    name: 'Đinh Quang Huy',
    email: 'huydqse160788@fpt.edu.vn',
    major: 'Kỹ thuật phần mềm',
    gpa: 3.3,
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'GraphQL'],
    interests: ['RESTful API', 'Real-time System', 'Fintech'],
    description: 'Lập trình viên Backend Node.js, có kinh nghiệm xây dựng ứng dụng thời gian thực với Socket.io và Redis.',
  },
  {
    name: 'Phạm Mai Chi',
    email: 'chipmse162333@fpt.edu.vn',
    major: 'Digital Marketing',
    gpa: 3.6,
    skills: ['Content Marketing', 'SEO', 'Canva', 'Social Media', 'Google Analytics'],
    interests: ['Truyền thông số', 'Tăng trưởng người dùng', 'Sự kiện'],
    description: 'Phụ trách truyền thông cho các dự án khởi nghiệp sinh viên, lập kế hoạch nội dung và phát triển kênh số.',
  },
  {
    name: 'Vũ Minh Đức',
    email: 'ducmvse163899@fpt.edu.vn',
    major: 'Kỹ thuật phần mềm',
    gpa: 3.45,
    skills: ['Flutter', 'React Native', 'TypeScript', 'Firebase', 'Mobile Development'],
    interests: ['Lập trình Di động', 'Cross-platform', 'IoT'],
    description: 'Đam mê phát triển ứng dụng di động đa nền tảng với Flutter và React Native.',
  },
  {
    name: 'Bùi Khánh Toàn',
    email: 'toanbkse161044@fpt.edu.vn',
    major: 'Trí tuệ nhân tạo',
    gpa: 3.7,
    skills: ['SQL', 'Python', 'Power BI', 'Data Analysis', 'BigQuery'],
    interests: ['Phân tích Dữ liệu', 'Kinh doanh thông minh (BI)', 'Data Warehouse'],
    description: 'Chuyên gia xử lý dữ liệu và trực quan hóa báo cáo quản trị với Power BI và SQL.',
  },
  {
    name: 'Đỗ Phương Anh',
    email: 'anhdpse164500@fpt.edu.vn',
    major: 'Quản trị kinh doanh',
    gpa: 3.5,
    skills: ['Project Management', 'Agile', 'Scrum', 'Business Analysis', 'Jira'],
    interests: ['Quản trị dự án CNTT', 'Product Owner', 'Khởi nghiệp'],
    description: 'Thành thạo phương pháp luận Agile/Scrum, quản trị tiến độ dự án và điều phối nhóm phát triển phần mềm.',
  },
];

// ─── 2. NEW COURSES ─────────────────────────────────────────────────────────
const NEW_COURSES = [
  {
    code: 'FER202',
    title: 'Lập trình Web Frontend với React',
    description: 'Xây dựng giao diện web hiện đại SPA với React, JSX, Hooks, State Management, Router và Tailwind CSS.',
    semester: 'Fall 2026',
    lecturerEmail: 'quanghd@fe.edu.vn',
  },
  {
    code: 'SWP391',
    title: 'Đồ án Ứng dụng Thực tế (Software Project)',
    description: 'Môn học đồ án nhóm thực chiến: Quy trình Agile/Scrum, thiết kế kiến trúc, phát triển MVP và nghiệm thu đồ án.',
    semester: 'Fall 2026',
    lecturerEmail: 'dangnh@fe.edu.vn',
  },
  {
    code: 'PRN211',
    title: 'Lập trình Cơ bản với C# & .NET',
    description: 'Nền tảng lập trình hướng đối tượng trên hệ sinh thái .NET, LINQ, Entity Framework Core và lập trình desktop.',
    semester: 'Fall 2026',
    lecturerEmail: 'baolq@fe.edu.vn',
  },
  {
    code: 'MAS291',
    title: 'Xác suất Thống kê cho Khoa học Dữ liệu',
    description: 'Các mô hình xác suất, thống kê suy diễn, kiểm định giả thuyết và ứng dụng trong khoa học dữ liệu.',
    semester: 'Fall 2026',
    lecturerEmail: 'chaunm@fe.edu.vn',
  },
  {
    code: 'PMG202c',
    title: 'Quản trị Dự án Công nghệ Thông tin',
    description: 'Phương pháp quản lý dự án chuẩn quốc tế: Scrum framework, lập kế hoạch Sprint, quản trị rủi ro và điều phối tài nguyên.',
    semester: 'Fall 2026',
    lecturerEmail: 'khoidm@fe.edu.vn',
  },
  {
    code: 'NWC203c',
    title: 'Mạng Máy tính & Hạ tầng Mạng',
    description: 'Mô hình OSI, TCP/IP, định tuyến, chuyển mạch, giao thức mạng và phân tích lưu lượng với Wireshark.',
    semester: 'Fall 2026',
    lecturerEmail: 'baolq@fe.edu.vn',
  },
];

// ─── 3. NEW ASSIGNMENTS ─────────────────────────────────────────────────────
const NEW_ASSIGNMENTS = [
  {
    courseCode: 'FER202',
    title: 'Assignment 1: Xây dựng Giao diện Dashboard SPA với React Hooks và Tailwind CSS',
    description: 'Xây dựng giao diện Dashboard ứng dụng quản lý sinh viên với React: sử dụng useState, useEffect, Custom Hooks, thiết kế responsive với Tailwind CSS và tích hợp Mock API.',
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000), // 5 days from now
    maxScore: 10,
    authorEmail: 'quanghd@fe.edu.vn',
  },
  {
    courseCode: 'FER202',
    title: 'Assignment 2: Tích hợp State Management, Form Validation và JWT Authentication',
    description: 'Phát triển luồng đăng nhập, đăng ký, xác thực phân quyền Route Guards và quản lý trạng thái tập trung với React Context API hoặc Redux Toolkit.',
    dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000), // 12 days from now
    maxScore: 10,
    authorEmail: 'quanghd@fe.edu.vn',
  },
  {
    courseCode: 'SWP391',
    title: 'Milestone 1: Báo cáo Đặc tả Yêu cầu SRS và Bản vẽ Thiết kế Kiến trúc Hệ thống',
    description: 'Nộp tài liệu đặc tả yêu cầu phần mềm (SRS), danh sách User Stories, sơ đồ Use Case, ERD cơ sở dữ liệu và bản vẽ kiến trúc hệ thống tổng quan.',
    dueDate: new Date(Date.now() + 8 * 24 * 3600 * 1000), // 8 days from now
    maxScore: 10,
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    courseCode: 'SWP391',
    title: 'Milestone 2: Báo cáo Sprint 2, Demo MVP và Bằng chứng Kiểm thử Unit Test',
    description: 'Báo cáo kết quả Sprint 2, video demo các chức năng cốt lõi MVP, mã nguồn GitHub và kết quả chạy Unit Test kiểm thử chất lượng code.',
    dueDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    maxScore: 10,
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    courseCode: 'PRJ301',
    title: 'Bài tập lớn: Xây dựng RESTful API với Java Servlet, JDBC và JWT Filter',
    description: 'Thiết kế RESTful API cho module thương mại điện tử với Java: xử lý CRUD, phân trang, lọc dữ liệu và áp dụng Design Pattern DAO / DTO.',
    dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    maxScore: 10,
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    courseCode: 'DBI202',
    title: 'Thực hành Truy vấn Nâng cao: Subquery, Window Functions và Stored Procedure',
    description: 'Viết các câu lệnh truy vấn SQL phức tạp kết nối nhiều bảng (Join), sử dụng hàm cửa sổ (Window functions), Stored Procedure và đánh chỉ mục tối ưu.',
    dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    maxScore: 10,
    authorEmail: 'baolq@fe.edu.vn',
  },
  {
    courseCode: 'AIL303m',
    title: 'Đồ án Học máy: Phân loại Văn bản Tiếng Việt và Đánh giá Mô hình với Scikit-Learn',
    description: 'Thu thập tập dữ liệu văn bản tiếng Việt, tiền xử lý tách từ, trích xuất đặc trưng TF-IDF, huấn luyện các bộ phân loại Naive Bayes / SVM và đánh giá F1-score.',
    dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
    maxScore: 10,
    authorEmail: 'huongttm@fe.edu.vn',
  },
  {
    courseCode: 'GDE101',
    title: 'Thiết kế Design System và Prototype Ứng dụng Di động trên Figma',
    description: 'Xây dựng bộ quy chuẩn Design System (màu sắc, typography, components, icons) và thiết kế Interactive Prototype có animation chuyển màn hình trên Figma.',
    dueDate: new Date(Date.now() + 9 * 24 * 3600 * 1000),
    maxScore: 10,
    authorEmail: 'dungpt@fe.edu.vn',
  },
];

// ─── 4. NEW ANNOUNCEMENTS ───────────────────────────────────────────────────
const NEW_ANNOUNCEMENTS = [
  {
    title: '📢 Lịch Đăng ký Đề tài Tốt nghiệp Kỳ Fall 2026 và Tiêu chuẩn Xét duyệt',
    content: 'Phòng Đào tạo thông báo mở cổng đăng ký đề tài tốt nghiệp kỳ Fall 2026 từ ngày 15/07 đến 30/07. Sinh viên cần hoàn tất việc ghép nhóm (4-5 thành viên) và có giảng viên hướng dẫn phê duyệt đề cương trước khi nộp.',
    scope: 'global',
    audience: 'students',
    authorEmail: 'admin@fpt.edu.vn',
  },
  {
    title: '🚀 Ngày hội Doanh nghiệp IT Job Fair & Triển lãm Công nghệ FPT 2026',
    content: 'Sự kiện thường niên kết nối hơn 40 doanh nghiệp công nghệ hàng đầu (FPT Software, Viettel, VNG, VNPT, Shopee). Cơ hội phỏng vấn thực tập sinh và nhận việc làm chính thức ngay tại ngày hội.',
    scope: 'global',
    audience: 'all',
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    title: '💡 Hội thảo Chuyên đề: Ứng dụng Generative AI và Microservices trong Dự án Doanh nghiệp',
    content: 'Buổi chia sẻ với các chuyên gia kiến trúc phần mềm về cách tích hợp mô hình ngôn ngữ lớn (LLM), Vector Database và container hóa dịch vụ với Docker & Kubernetes trong sản phẩm thực tế.',
    scope: 'global',
    audience: 'students',
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    title: '📝 FER202: Hướng dẫn Nộp Assignment 1 và Lịch Review Code',
    content: 'Sinh viên học phần FER202 chú ý: Hạn chót nộp Assignment 1 vào 23:59 Chủ Nhật tuần này. Yêu cầu đính kèm link GitHub repository và video demo ngắn 3 phút. Lịch review code trực tiếp sẽ diễn ra vào buổi học tuần sau.',
    scope: 'course',
    courseCode: 'FER202',
    audience: 'students',
    authorEmail: 'quanghd@fe.edu.vn',
  },
  {
    title: '👥 SWP391: Nhắc nhở Nộp Báo cáo Milestone 1 và Lịch Họp Mentor',
    content: 'Các nhóm SWP391 cần hoàn thiện tài liệu SRS và bản vẽ kiến trúc ERD để gửi cho Mentor doanh nghiệp nhận xét trước thứ Sáu. Đề nghị nhóm trưởng kiểm tra tiến độ của từng thành viên.',
    scope: 'course',
    courseCode: 'SWP391',
    audience: 'students',
    authorEmail: 'dangnh@fe.edu.vn',
  },
  {
    title: '📚 DBI202: Cập nhật Bộ Đề thi Thử Final Exam và Tài liệu Tối ưu SQL',
    content: 'Giảng viên đã đăng tải tài liệu ôn tập và 3 bộ đề trắc nghiệm SQL mẫu lên mục Tài liệu học tập. Sinh viên nên làm thử bài Quiz ôn tập trên hệ thống trước kỳ thi kết thúc học phần.',
    scope: 'course',
    courseCode: 'DBI202',
    audience: 'students',
    authorEmail: 'baolq@fe.edu.vn',
  },
  {
    title: '🤖 AIL303m: Cung cấp Tài khoản Cloud GPU phục vụ Thực hành Deep Learning',
    content: 'Nhà trường đã cấp tài khoản Google Colab Pro và máy chủ GPU cho các bạn sinh viên lớp Học máy AIL303m. Hướng dẫn kết nối và tài liệu mẫu đã được cập nhật trong thư mục học phần.',
    scope: 'course',
    courseCode: 'AIL303m',
    audience: 'students',
    authorEmail: 'huongttm@fe.edu.vn',
  },
];

// ─── 5. NEW MATERIALS ───────────────────────────────────────────────────────
const NEW_MATERIALS = [
  {
    courseCode: 'FER202',
    title: 'Giáo trình ReactJS & TypeScript Thực Chiến: Từ Cơ Bản Đến Nâng Cao',
    description: 'Tài liệu hướng dẫn toàn diện: JSX, Functional Components, Hooks, Context API, Redux Toolkit và các mẫu thiết kế Clean Code.',
    fileName: 'fer202-react-typescript-guide.pdf',
  },
  {
    courseCode: 'FER202',
    title: 'Slide Bài giảng: State Management và Tối ưu Hiệu năng React',
    description: 'Phân tích cơ chế Virtual DOM, Diffing algorithm, memoization với useMemo/useCallback và tối ưu hóa thời gian re-render.',
    fileName: 'fer202-state-management-slides.pdf',
  },
  {
    courseCode: 'SWP391',
    title: 'Cẩm nang Quy trình Agile/Scrum và Quản lý Source Code Git Flow',
    description: 'Hướng dẫn quy chuẩn làm việc nhóm: lập kế hoạch Sprint, chia nhỏ User Story, quy tắc đặt tên Branch và giải quyết merge conflict.',
    fileName: 'swp391-agile-gitflow-guide.pdf',
  },
  {
    courseCode: 'DBI202',
    title: 'Cheat-sheet Tối ưu hóa Truy vấn SQL và Đánh chỉ mục Index B-Tree',
    description: 'Bảng tóm tắt các cú pháp truy vấn phức tạp, phân tích Execution Plan và các lưu ý tránh Full Table Scan.',
    fileName: 'dbi202-sql-indexing-cheatsheet.pdf',
  },
  {
    courseCode: 'AIL303m',
    title: 'Bài giảng Chuyên sâu: Mạng Nơ-ron Nhân tạo và Học sâu với PyTorch',
    description: 'Kiến trúc Multi-layer Perceptron (MLP), Convolutional Neural Network (CNN) và kỹ thuật regularization tránh Overfitting.',
    fileName: 'ail303m-deep-learning-pytorch.pdf',
  },
  {
    courseCode: 'IAO202',
    title: 'Tài liệu Thực hành Quét Lỗ Hổng Bảo mật và Phòng thủ Ứng dụng Web',
    description: 'Phân tích lỗ hổng phổ biến OWASP Top 10: SQL Injection, XSS, CSRF, Broken Authentication và phương pháp vá lỗi.',
    fileName: 'iao202-web-security-owasp.pdf',
  },
  {
    courseCode: 'GDE101',
    title: 'Bộ Thư viện UI Kit & Design System Chuẩn Material 3 cho Figma',
    description: 'Tài nguyên thành phần giao diện chuẩn Google Material Design 3 bao gồm Button, Input, Modal, Typography và Color Tokens.',
    fileName: 'gde101-material3-design-system.fig',
  },
  {
    courseCode: 'PRJ301',
    title: 'Mẫu Thiết kế Kiến trúc MVC và RESTful Service với Java Servlet & JDBC',
    description: 'Mã nguồn mẫu chuẩn Enterprise: Filter xác thực JWT, Connection Pooling HikariCP và xử lý ngoại lệ tập trung.',
    fileName: 'prj301-mvc-rest-architecture.zip',
  },
];

// ─── 6. NEW QUIZZES ─────────────────────────────────────────────────────────
const NEW_QUIZZES = [
  {
    title: 'Trắc nghiệm Chuyên sâu React Hooks, State & Component Lifecycle',
    courseCode: 'FER202',
    creatorEmail: 'quanghd@fe.edu.vn',
    timeLimitMinutes: 15,
    questions: [
      {
        questionText: 'Hook nào trong React được sử dụng để lưu trữ giá trị có thể thay đổi nhưng KHÔNG làm re-render component khi giá trị đổi?',
        options: ['useState', 'useRef', 'useEffect', 'useMemo'],
        correctIndexes: [1],
        explanation: 'useRef trả về một mutable ref object có thuộc tính .current tồn tại suốt vòng đời component mà không kích hoạt re-render.',
      },
      {
        questionText: 'Để tránh việc tạo lại hàm callback mỗi lần component cha re-render, bạn nên sử dụng hook nào?',
        options: ['useCallback', 'useMemo', 'useContext', 'useReducer'],
        correctIndexes: [0],
        explanation: 'useCallback trả về một hàm callback được memoize, chỉ tạo lại khi một trong các dependencies thay đổi.',
      },
      {
        questionText: 'Khi nào hàm cleanup trả về trong useEffect được thực thi?',
        options: [
          'Chỉ khi component mount lần đầu',
          'Trước khi component unmount hoặc trước khi effect chạy lần tiếp theo do dependency thay đổi',
          'Sau khi toàn bộ DOM thật đã vẽ xong',
          'Chỉ khi xảy ra lỗi runtime',
        ],
        correctIndexes: [1],
        explanation: 'Cleanup function chạy để dọn dẹp subscription/timer trước khi effect chạy lại hoặc khi component bị unmount.',
      },
      {
        questionText: 'Những nguyên tắc nào sau đây là bắt buộc khi sử dụng React Hooks? (chọn nhiều đáp án)',
        options: [
          'Chỉ gọi Hooks ở cấp cao nhất (top level) của component, không gọi trong vòng lặp/điều kiện',
          'Chỉ gọi Hooks từ React function components hoặc custom Hooks',
          'Bắt buộc phải truyền dependency array rỗng cho mọi hook',
          'Có thể gọi Hooks bên trong hàm JavaScript thông thường',
        ],
        correctIndexes: [0, 1],
        explanation: 'Quy tắc Rules of Hooks quy định chỉ gọi Hooks ở top-level và chỉ gọi từ React Function hoặc Custom Hooks.',
      },
    ],
  },
  {
    title: 'Kiểm tra Kiến thức Agile/Scrum, User Stories & Quản trị Dự án',
    courseCode: 'SWP391',
    creatorEmail: 'dangnh@fe.edu.vn',
    timeLimitMinutes: 15,
    questions: [
      {
        questionText: 'Trong mô hình Scrum, cuộc họp Daily Scrum (Stand-up) kéo dài tối đa bao nhiêu phút?',
        options: ['15 phút', '30 phút', '45 phút', '60 phút'],
        correctIndexes: [0],
        explanation: 'Daily Scrum là sự kiện ngắn 15 phút hàng ngày dành cho Developers đồng bộ công việc và phát hiện trở ngại.',
      },
      {
        questionText: 'Ai là người có thẩm quyền cao nhất trong việc sắp xếp độ ưu tiên của Product Backlog?',
        options: ['Scrum Master', 'Product Owner', 'Tech Lead', 'Project Manager'],
        correctIndexes: [1],
        explanation: 'Product Owner là người chịu trách nhiệm tối đa hóa giá trị sản phẩm và quản lý sắp xếp Product Backlog.',
      },
      {
        questionText: 'Tiêu chuẩn Definition of Done (DoD) có ý nghĩa gì đối với nhóm phát triển?',
        options: [
          'Là danh sách câu hỏi phỏng vấn khách hàng',
          'Là cam kết chung về chất lượng mà một hạng mục công việc phải đạt trước khi được coi là hoàn thành',
          'Là thời hạn kết thúc học kỳ của môn học',
          'Là số lượng dòng code tối thiểu cần viết',
        ],
        correctIndexes: [1],
        explanation: 'DoD định nghĩa tiêu chuẩn chất lượng bắt buộc (code review, test pass, deploy...) để một Increment có thể sử dụng được.',
      },
    ],
  },
  {
    title: 'Trắc nghiệm Tối ưu hóa Truy vấn SQL, Ràng buộc Toàn vẹn & Indexing',
    courseCode: 'DBI202',
    creatorEmail: 'baolq@fe.edu.vn',
    timeLimitMinutes: 20,
    questions: [
      {
        questionText: 'Mục đích chính của việc tạo chỉ mục (Index) trên một cột cơ sở dữ liệu là gì?',
        options: [
          'Tăng tốc độ truy vấn tìm kiếm dữ liệu (SELECT)',
          'Tăng tốc độ thao tác thêm mới (INSERT)',
          'Giảm dung lượng ổ đĩa lưu trữ',
          'Mã hóa dữ liệu bảo mật',
        ],
        correctIndexes: [0],
        explanation: 'Index tạo ra cấu trúc cây tìm kiếm (thường là B-Tree) giúp tra cứu nhanh hơn, nhưng làm chậm thao tác INSERT/UPDATE vì phải cập nhật cây.',
      },
      {
        questionText: 'Thuộc tính ACID trong hệ quản trị cơ sở dữ liệu bao gồm những tính chất nào?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Accuracy, Completeness, Integrity, Dependability',
          'Authentication, Confidentiality, Integrity, Detection',
          'Automation, Concurrency, Indexing, Distribution',
        ],
        correctIndexes: [0],
        explanation: 'ACID đại diện cho: Nguyên tử (Atomicity), Nhất quán (Consistency), Độc lập (Isolation) và Bền vững (Durability).',
      },
    ],
  },
  {
    title: 'Kiểm tra Nền tảng Học máy: Overfitting, Underfitting và Đánh giá Mô hình',
    courseCode: 'AIL303m',
    creatorEmail: 'huongttm@fe.edu.vn',
    timeLimitMinutes: 15,
    questions: [
      {
        questionText: 'Hiện tượng Overfitting (quá khớp) xảy ra khi nào?',
        options: [
          'Mô hình có độ chính xác rất cao trên tập huấn luyện nhưng dự đoán kém trên tập kiểm thử',
          'Mô hình dự đoán kém trên cả tập huấn luyện và tập kiểm thử',
          'Mô hình hội tụ quá nhanh trong epoch đầu tiên',
          'Tập dữ liệu kiểm thử quá lớn',
        ],
        correctIndexes: [0],
        explanation: 'Overfitting xảy ra khi mô hình học cả nhiễu của dữ liệu huấn luyện, mất khả năng tổng quát hóa trên dữ liệu mới.',
      },
      {
        questionText: 'Phương pháp nào sau đây giúp hạn chế hiện tượng Overfitting? (chọn nhiều đáp án)',
        options: [
          'Thu thập thêm dữ liệu huấn luyện',
          'Sử dụng kỹ thuật Regularization (L1 / L2)',
          'Sử dụng Dropout hoặc Early Stopping',
          'Tăng số lượng tham số mô hình lên gấp 10 lần',
        ],
        correctIndexes: [0, 1, 2],
        explanation: 'Thêm dữ liệu, áp dụng phạt trọng số Regularization, Dropout và dừng sớm giúp giảm đáng kể Overfitting.',
      },
    ],
  },
];

// ─── 7. NEW COMMUNITY POSTS ─────────────────────────────────────────────────
const NEW_POSTS = [
  {
    type: 'event',
    title: '🚀 FPT Tech Hackathon 2026: Đổi Mới Sáng Tạo Với AI & Cloud',
    content: 'CLB Công nghệ FCode và Khoa CNTT chính thức khởi động cuộc thi Hackathon 2026! Cơ hội tranh tài giải thưởng 80.000.000 VNĐ và cơ hội nhận đầu tư thiên thần cho các dự án tiềm năng. Các đội nhóm đang tuyển thành viên: Frontend React, Backend Java/Node.js, AI Engineer và UI/UX Designer. Đăng ký tham gia ngay!',
    tagsNeeded: ['Frontend', 'Backend', 'AI/Data', 'UI/UX'],
    location: 'Hội trường Alpha & Online Discord',
    eventDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    authorEmail: 'tuanva.clb@fpt.edu.vn',
  },
  {
    type: 'event',
    title: '💡 Workshop: Thiết kế Microservices & Tối ưu CI/CD với Docker/K8s',
    content: 'Buổi chia sẻ thực chiến từ chuyên gia kiến trúc phần mềm FPT Software. Nội dung bao gồm: Phân rã Monolith sang Microservices, quản lý API Gateway, cấu hình Docker Compose và xây dựng quy trình CI/CD tự động bằng GitHub Actions.',
    tagsNeeded: ['DevOps', 'Backend', 'System Design'],
    location: 'Phòng Lab 302, Tòa nhà Beta',
    eventDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    authorEmail: 'quanghd@fe.edu.vn',
  },
  {
    type: 'academic_update',
    title: '👥 Nhóm Đồ án Tốt nghiệp SWP391 cần tìm 1 bạn Frontend (React) và 1 bạn UI/UX',
    content: 'Nhóm chúng mình hiện có 3 thành viên (2 Backend Node.js/Java và 1 AI). Đề tài xây dựng Nền tảng Hỗ trợ Học tập Thông minh tích hợp Trợ lý AI. Cần tìm thêm 1 bạn làm Frontend React và 1 bạn chuyên thiết kế Figma UI/UX có tinh thần trách nhiệm cao. Mục tiêu đạt điểm A+ đồ án!',
    tagsNeeded: ['React', 'UI/UX', 'Figma'],
    authorEmail: 'thuannmhe161234@fpt.edu.vn',
  },
  {
    type: 'academic_update',
    title: '📖 Tổng hợp Bộ Tài liệu & Đề thi Ôn tập Môn CSD201 và DBI202',
    content: 'Mình vừa tổng hợp lại toàn bộ slide bài giảng, cẩm nang tóm tắt công thức, đề thi mẫu và code ví dụ của 2 môn CSD201 và DBI202. Chúc các bạn sinh viên vượt qua kỳ thi giữa kỳ với điểm số cao nhất!',
    tagsNeeded: ['Data Structures', 'SQL', 'Database'],
    authorEmail: 'longlhse162100@fpt.edu.vn',
  },
  {
    type: 'event',
    title: '🎨 Figma Design Challenge: Thiết kế Giao diện Ứng dụng Di động Tương tác',
    content: 'Cuộc thi thiết kế giao diện UI/UX dành riêng cho sinh viên ngành Thiết kế đồ họa và CNTT. Chủ đề năm nay là "Ứng dụng Di động Nâng cao Sức khỏe Tinh thần cho Sinh viên". Nộp tác phẩm trước ngày 25/08.',
    tagsNeeded: ['UI/UX', 'Figma', 'Mobile Design'],
    location: 'Trực tuyến trên Behance & STE Feed',
    eventDate: new Date(Date.now() + 18 * 24 * 3600 * 1000),
    authorEmail: 'dungpt@fe.edu.vn',
  },
];

const dns = require('dns');
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_) {}
}

async function seedRichDemo() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ste';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', uri.replace(/:[^:]*@/, ':***@'));

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. SEED LECTURERS
  console.log('\n--- 1. Bơm thêm Giảng viên ---');
  for (const lec of NEW_LECTURERS) {
    let user = await User.findOne({ email: lec.email });
    if (!user) {
      user = await User.create({
        ...lec,
        password: hashedPassword,
        isActive: true,
      });
      console.log(`  + Đã tạo Giảng viên: ${lec.name} (${lec.email})`);
    } else {
      console.log(`  ✓ Giảng viên đã tồn tại: ${lec.name}`);
    }
  }

  // 2. SEED STUDENTS
  console.log('\n--- 2. Bơm thêm Sinh viên ---');
  for (const stu of NEW_STUDENTS) {
    let user = await User.findOne({ email: stu.email });
    if (!user) {
      user = await User.create({
        ...stu,
        role: 'student',
        password: hashedPassword,
        isActive: true,
      });
      console.log(`  + Đã tạo Sinh viên: ${stu.name} (${stu.email})`);
    } else {
      console.log(`  ✓ Sinh viên đã tồn tại: ${stu.name}`);
    }
  }

  // 3. SEED COURSES
  console.log('\n--- 3. Bơm thêm Học phần / Môn học ---');
  const courseMap = new Map();
  const allCourses = await Course.find().lean();
  allCourses.forEach((c) => courseMap.set(c.code, c));

  for (const cData of NEW_COURSES) {
    let course = await Course.findOne({ code: cData.code });
    if (!course) {
      const lecturer = await User.findOne({ email: cData.lecturerEmail });
      if (lecturer) {
        course = await Course.create({
          code: cData.code,
          title: cData.title,
          description: cData.description,
          semester: cData.semester,
          lecturer: lecturer._id,
          isActive: true,
        });
        courseMap.set(cData.code, course);
        console.log(`  + Đã tạo Học phần: ${cData.code} - ${cData.title}`);
      }
    } else {
      courseMap.set(cData.code, course);
      console.log(`  ✓ Học phần đã tồn tại: ${cData.code}`);
    }
  }

  // 4. SEED ENROLLMENTS
  console.log('\n--- 4. Ghi danh sinh viên vào các học phần ---');
  const allStudents = await User.find({ role: 'student' }).lean();
  const popularCodes = ['FER202', 'SWP391', 'DBI202', 'CSD201', 'PRJ301', 'AIL303m'];

  let enrollCount = 0;
  for (const student of allStudents) {
    for (const code of popularCodes) {
      const course = courseMap.get(code);
      if (course) {
        const existing = await Enrollment.findOne({ student: student._id, course: course._id });
        if (!existing) {
          await Enrollment.create({
            student: student._id,
            course: course._id,
            status: 'active',
          });
          enrollCount++;
        }
      }
    }
  }
  console.log(`  ✓ Đã ghi danh thêm ${enrollCount} lượt học phần cho sinh viên.`);

  // 5. SEED ASSIGNMENTS
  console.log('\n--- 5. Bơm thêm Bài tập môn học (Assignments) ---');
  const assignmentMap = new Map();
  for (const aData of NEW_ASSIGNMENTS) {
    const course = courseMap.get(aData.courseCode) || (await Course.findOne({ code: aData.courseCode }));
    const author = await User.findOne({ email: aData.authorEmail }) || (await User.findOne({ role: 'lecturer' }));

    if (course && author) {
      let assignment = await Assignment.findOne({ course: course._id, title: aData.title });
      if (!assignment) {
        assignment = await Assignment.create({
          course: course._id,
          title: aData.title,
          description: aData.description,
          dueDate: aData.dueDate,
          maxScore: aData.maxScore,
          createdBy: author._id,
          isPublished: true,
        });
        assignmentMap.set(aData.title, assignment);
        console.log(`  + Đã tạo Bài tập: [${aData.courseCode}] ${aData.title}`);
      } else {
        assignmentMap.set(aData.title, assignment);
        console.log(`  ✓ Bài tập đã tồn tại: ${aData.title}`);
      }
    }
  }

  // 6. SEED SUBMISSIONS
  console.log('\n--- 6. Bơm bài nộp mẫu từ sinh viên kèm điểm và nhận xét ---');
  const thuan = await User.findOne({ email: 'thuannmhe161234@fpt.edu.vn' });
  const long = await User.findOne({ email: 'longlhse162100@fpt.edu.vn' });
  const lecturerDang = await User.findOne({ email: 'dangnh@fe.edu.vn' });

  const allAssignments = await Assignment.find().lean();
  let subCount = 0;

  for (const asg of allAssignments) {
    // Sinh viên Thuận nộp bài
    if (thuan) {
      const exists = await Submission.findOne({ assignment: asg._id, student: thuan._id });
      if (!exists) {
        await Submission.create({
          assignment: asg._id,
          student: thuan._id,
          content: `Em xin nộp bài tập '${asg.title}'. Mã nguồn dự án được lưu tại repository GitHub: https://github.com/thuannm/${asg._id}. Em đã thực hiện đầy đủ các chức năng theo yêu cầu đề bài.`,
          fileName: `Baitap_${asg.title.slice(0, 20)}.zip`,
          fileUrl: `/uploads/submissions/sample.zip`,
          status: 'graded',
          score: 9.5,
          feedback: 'Bài làm rất tốt, cấu trúc mã nguồn sạch, áp dụng đúng chuẩn kiến trúc và giải thuật tối ưu.',
          gradedBy: lecturerDang?._id || null,
          gradedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        });
        subCount++;
      }
    }

    // Sinh viên Long nộp bài
    if (long) {
      const exists = await Submission.findOne({ assignment: asg._id, student: long._id });
      if (!exists) {
        await Submission.create({
          assignment: asg._id,
          student: long._id,
          content: `Bài tập hoàn thiện module của em: Đã kiểm thử đầy đủ các test cases và đóng gói mã nguồn.`,
          fileName: `Submission_${asg.title.slice(0, 15)}.zip`,
          fileUrl: `/uploads/submissions/sample.zip`,
          status: 'submitted',
          score: null,
          submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        });
        subCount++;
      }
    }
  }
  console.log(`  ✓ Đã tạo thêm ${subCount} bài nộp sinh viên.`);

  // 7. SEED ANNOUNCEMENTS
  console.log('\n--- 7. Bơm thêm Thông báo hệ thống & Thông báo môn học ---');
  for (const aData of NEW_ANNOUNCEMENTS) {
    let author = await User.findOne({ email: aData.authorEmail }) || (await User.findOne({ role: 'admin' }));
    let course = aData.courseCode ? await Course.findOne({ code: aData.courseCode }) : null;

    let announce = await Announcement.findOne({ title: aData.title });
    if (!announce) {
      await Announcement.create({
        title: aData.title,
        content: aData.content,
        author: author._id,
        scope: aData.scope,
        course: course?._id || null,
        audience: aData.audience || 'all',
        isBroadcast: aData.scope === 'global',
        status: 'published',
      });
      console.log(`  + Đã tạo Thông báo: ${aData.title}`);
    } else {
      console.log(`  ✓ Thông báo đã tồn tại: ${aData.title}`);
    }
  }

  // 8. SEED MATERIALS
  console.log('\n--- 8. Bơm thêm Tài liệu học tập (Materials) ---');
  const defaultUploader = (await User.findOne({ role: 'lecturer' })) || (await User.findOne({ role: 'admin' }));
  for (const mData of NEW_MATERIALS) {
    const course = courseMap.get(mData.courseCode) || (await Course.findOne({ code: mData.courseCode }));
    if (course) {
      let mat = await Material.findOne({ title: mData.title });
      if (!mat) {
        await Material.create({
          course: course._id,
          title: mData.title,
          description: mData.description,
          fileUrl: `/uploads/materials/${mData.fileName}`,
          fileName: mData.fileName,
          mimeType: 'application/pdf',
          size: Math.floor(Math.random() * 3000000) + 500000,
          uploadedBy: defaultUploader._id,
          downloadCount: Math.floor(Math.random() * 45) + 5,
        });
        console.log(`  + Đã tạo Tài liệu: [${mData.courseCode}] ${mData.title}`);
      } else {
        console.log(`  ✓ Tài liệu đã tồn tại: ${mData.title}`);
      }
    }
  }

  // 9. SEED QUIZZES
  console.log('\n--- 9. Bơm thêm Bài Quiz trắc nghiệm ---');
  for (const qData of NEW_QUIZZES) {
    const course = courseMap.get(qData.courseCode) || (await Course.findOne({ code: qData.courseCode }));
    const creator = await User.findOne({ email: qData.creatorEmail }) || defaultUploader;

    let quiz = await Quiz.findOne({ title: qData.title });
    if (!quiz && course) {
      await Quiz.create({
        title: qData.title,
        course: course._id,
        createdBy: creator._id,
        questions: qData.questions,
        isPublished: true,
        timeLimitMinutes: qData.timeLimitMinutes || 15,
        passingPercentage: 60,
      });
      console.log(`  + Đã tạo Quiz: [${qData.courseCode}] ${qData.title}`);
    } else {
      console.log(`  ✓ Quiz đã tồn tại: ${qData.title}`);
    }
  }

  // 10. SEED POSTS
  console.log('\n--- 10. Bơm thêm Bài viết Bảng tin / Sự kiện (Posts) ---');
  for (const pData of NEW_POSTS) {
    const author = await User.findOne({ email: pData.authorEmail }) || (await User.findOne({ role: 'student' }));
    let post = await Post.findOne({ title: pData.title });
    if (!post && author) {
      await Post.create({
        title: pData.title,
        content: pData.content,
        author: author._id,
        type: pData.type,
        tagsNeeded: pData.tagsNeeded || [],
        location: pData.location || '',
        eventDate: pData.eventDate || null,
        status: 'published',
      });
      console.log(`  + Đã tạo Bài viết: ${pData.title}`);
    } else {
      console.log(`  ✓ Bài viết đã tồn tại: ${pData.title}`);
    }
  }

  console.log('\n🎉 ĐÃ BƠM TOÀN BỘ DỮ LIỆU DEMO THÀNH CÔNG!');
  const counts = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Assignment.countDocuments(),
    Submission.countDocuments(),
    Announcement.countDocuments(),
    Material.countDocuments(),
    Quiz.countDocuments(),
    Post.countDocuments(),
  ]);

  console.log(`
📊 Thống kê dữ liệu hiện tại trong STE:
- Người dùng (Users): ${counts[0]} tài khoản (Mật khẩu chung: ${DEFAULT_PASSWORD})
- Học phần (Courses): ${counts[1]} học phần
- Lượt ghi danh (Enrollments): ${counts[2]} lượt
- Bài tập (Assignments): ${counts[3]} bài tập
- Bài nộp sinh viên (Submissions): ${counts[4]} bài nộp
- Thông báo (Announcements): ${counts[5]} thông báo
- Tài liệu học tập (Materials): ${counts[6]} tài liệu
- Bài Quiz trắc nghiệm: ${counts[7]} bài quiz
- Bài viết Bảng tin (Posts): ${counts[8]} bài viết
  `);

  process.exit(0);
}

seedRichDemo().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu demo phong phú:', err);
  process.exit(1);
});

