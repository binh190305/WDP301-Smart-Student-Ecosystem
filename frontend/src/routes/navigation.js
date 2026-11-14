export const NAV_BY_ROLE = {
  student: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/app', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
        { to: '/app/announcements', label: 'Thông báo', icon: 'announce' },
        { to: '/app/calendar', label: 'Lịch & hạn chót', icon: 'bell' },
        { to: '/app/search', label: 'Tìm kiếm', icon: 'search' },
      ],
    },
    {
      title: 'Học tập',
      items: [
        { to: '/app/course-catalog', label: 'Học phần', icon: 'courses' },
        { to: '/app/assignments', label: 'Bài tập', icon: 'edit' },
        { to: '/app/quizzes', label: 'Ôn tập & Quiz', icon: 'quiz' },
        { to: '/app/materials', label: 'Tài liệu học tập', icon: 'materials' },
        { to: '/app/grades', label: 'Điểm số', icon: 'chart' },
      ],
    },
    {
      title: 'Nhóm',
      items: [
        { to: '/app/teams/discover', label: 'Khám phá nhóm', icon: 'sparkles' },
        { to: '/app/teams', label: 'Nhóm của tôi', icon: 'teams' },
        { to: '/app/requests', label: 'Yêu cầu tham gia', icon: 'requests' },
        { to: '/app/invitations', label: 'Lời mời vào nhóm', icon: 'requests' },
      ],
    },
    {
      title: 'AI Kỹ năng',
      items: [
        { to: '/app/skill-intelligence/profile', label: 'Hồ sơ kỹ năng', icon: 'profile' },
        { to: '/app/skill-intelligence/analyze', label: 'Phân tích & Khoảng cách', icon: 'sparkles' },
        { to: '/app/skill-intelligence/graph', label: 'Đồ thị kỹ năng', icon: 'chart' },
      ],
    },
    {
      title: 'Cộng đồng',
      items: [
        { to: '/app/feed', label: 'Bảng tin & Sự kiện', icon: 'feed' },
        { to: '/app/students', label: 'Tìm sinh viên', icon: 'users' },
        { to: '/app/leaderboard', label: 'Bảng xếp hạng', icon: 'trophy' },
      ],
    },
    {
      title: 'Cá nhân',
      items: [{ to: '/app/profile', label: 'Hồ sơ cá nhân', icon: 'profile' }],
    },
  ],
  lecturer: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/app', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
        { to: '/app/announcements', label: 'Thông báo', icon: 'announce' },
        { to: '/app/calendar', label: 'Lịch & hạn chót', icon: 'bell' },
        { to: '/app/search', label: 'Tìm kiếm', icon: 'search' },
      ],
    },
    {
      title: 'Giảng dạy',
      items: [
        { to: '/app/courses', label: 'Quản lý học phần', icon: 'courses' },
        { to: '/app/assignments', label: 'Bài tập', icon: 'edit' },
        { to: '/app/quizzes', label: 'Bộ câu hỏi', icon: 'quiz' },
        { to: '/app/materials', label: 'Tài liệu giảng dạy', icon: 'materials' },
      ],
    },
    {
      title: 'Sinh viên & cộng đồng',
      items: [
        { to: '/app/monitor', label: 'Giám sát nhóm', icon: 'teams' },
        { to: '/app/feed', label: 'Bảng tin', icon: 'feed' },
      ],
    },
    {
      title: 'Cá nhân',
      items: [{ to: '/app/profile', label: 'Hồ sơ cá nhân', icon: 'profile' }],
    },
  ],
  admin: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/app', label: 'Tổng quan hệ thống', icon: 'chart', end: true },
        { to: '/app/search', label: 'Tìm kiếm', icon: 'search' },
      ],
    },
    {
      title: 'Quản trị',
      items: [
        { to: '/app/users', label: 'Quản lý người dùng', icon: 'users' },
        { to: '/app/courses', label: 'Quản lý học phần', icon: 'courses' },
        { to: '/app/assignments', label: 'Bài tập', icon: 'edit' },
      ],
    },
    {
      title: 'Nội dung',
      items: [
        { to: '/app/announcements', label: 'Thông báo hệ thống', icon: 'announce' },
        { to: '/app/moderation', label: 'Kiểm duyệt bài đăng', icon: 'feed' },
        { to: '/app/admin-workspace', label: 'Không gian quản trị', icon: 'dashboard' },
      ],
    },
  ],
  club_leader: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/app', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
        { to: '/app/calendar', label: 'Lịch & sự kiện', icon: 'bell' },
        { to: '/app/search', label: 'Tìm kiếm', icon: 'search' },
      ],
    },
    {
      title: 'Cộng đồng',
      items: [
        { to: '/app/feed', label: 'Sự kiện & Bảng tin', icon: 'feed' },
        { to: '/app/announcements', label: 'Thông báo', icon: 'announce' },
      ],
    },
    {
      title: 'Cá nhân',
      items: [{ to: '/app/profile', label: 'Hồ sơ cá nhân', icon: 'profile' }],
    },
  ],
};
