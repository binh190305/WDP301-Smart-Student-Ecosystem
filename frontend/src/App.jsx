import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { GuestRoute, ProtectedRoute, RoleRoute } from './routes/guards';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardRouter from './pages/DashboardRouter';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';
import MaterialsPage from './pages/MaterialsPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizTakePage from './pages/QuizTakePage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import CourseLessonsPage from './pages/CourseLessonsPage';
import CalendarPage from './pages/CalendarPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SearchPage from './pages/SearchPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import EventDetailPage from './pages/EventDetailPage';
import StudentDirectoryPage from './pages/StudentDirectoryPage';
import StudentPublicProfilePage from './pages/StudentPublicProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ForbiddenPage from './pages/ForbiddenPage';
import HomePage from './pages/HomePage';
import InvitationsPage from './pages/student/InvitationsPage';
import AdminWorkspacePage from './pages/admin/AdminWorkspacePage';
import DiscoverTeamsPage from './pages/student/DiscoverTeamsPage';
import MyTeamsPage from './pages/student/MyTeamsPage';
import TeamDetailPage from './pages/student/TeamDetailPage';
import MyRequestsPage from './pages/student/MyRequestsPage';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import GradesPage from './pages/student/GradesPage';
import MySkillProfilePage from './pages/student/skill-intelligence/MySkillProfilePage';
import AiSkillAnalysisPage from './pages/student/skill-intelligence/AiSkillAnalysisPage';
import SkillGapAnalysisPage from './pages/student/skill-intelligence/SkillGapAnalysisPage';
import KnowledgeGraphPage from './pages/student/skill-intelligence/KnowledgeGraphPage';
import CoursesPage from './pages/lecturer/CoursesPage';
import CourseGradebookPage from './pages/lecturer/CourseGradebookPage';
import CourseAnalyticsPage from './pages/lecturer/CourseAnalyticsPage';
import AnnouncementsRouter from './pages/AnnouncementsRouter';
import MonitorTeamsPage from './pages/lecturer/MonitorTeamsPage';
import UsersPage from './pages/admin/UsersPage';
import ModerationPage from './pages/admin/ModerationPage';

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
    <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<DashboardRouter />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="profile/change-password" element={<ChangePasswordPage />} />
      <Route path="feed" element={<FeedPage />} />
      <Route path="materials" element={<MaterialsPage />} />
      <Route path="quizzes" element={<QuizzesPage />} />
      <Route path="quizzes/:id" element={<QuizTakePage />} />
      <Route path="assignments" element={<RoleRoute roles={['student','lecturer','admin']}><AssignmentsPage /></RoleRoute>} />
      <Route path="assignments/:id" element={<RoleRoute roles={['student','lecturer','admin']}><AssignmentDetailPage /></RoleRoute>} />
      <Route path="grades" element={<RoleRoute roles={['student']}><GradesPage /></RoleRoute>} />
      <Route path="course-catalog" element={<RoleRoute roles={['student']}><StudentCoursesPage /></RoleRoute>} />
      <Route path="courses/:id/lessons" element={<CourseLessonsPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="leaderboard" element={<LeaderboardPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="events/:id" element={<EventDetailPage />} />
      <Route path="students" element={<StudentDirectoryPage />} />
      <Route path="students/:id" element={<StudentPublicProfilePage />} />
      <Route path="teams/discover" element={<RoleRoute roles={['student']}><DiscoverTeamsPage /></RoleRoute>} />
      <Route path="teams" element={<RoleRoute roles={['student']}><MyTeamsPage /></RoleRoute>} />
      <Route path="teams/:id" element={<TeamDetailPage />} />
      <Route path="requests" element={<RoleRoute roles={['student']}><MyRequestsPage /></RoleRoute>} />
      <Route path="invitations" element={<RoleRoute roles={['student']}><InvitationsPage /></RoleRoute>} />
      <Route path="skill-intelligence/profile" element={<RoleRoute roles={['student']}><MySkillProfilePage /></RoleRoute>} />
      <Route path="skill-intelligence/analyze" element={<RoleRoute roles={['student']}><AiSkillAnalysisPage /></RoleRoute>} />
      <Route path="skill-intelligence/gap-analysis" element={<Navigate to="/app/skill-intelligence/analyze" replace />} />
      <Route path="skill-intelligence/gap" element={<Navigate to="/app/skill-intelligence/analyze" replace />} />
      <Route path="skill-intelligence/graph" element={<RoleRoute roles={['student']}><KnowledgeGraphPage /></RoleRoute>} />
      <Route path="courses" element={<RoleRoute roles={['lecturer','admin']}><CoursesPage /></RoleRoute>} />
      <Route path="courses/:id/gradebook" element={<RoleRoute roles={['lecturer','admin']}><CourseGradebookPage /></RoleRoute>} />
      <Route path="courses/:id/analytics" element={<RoleRoute roles={['lecturer','admin']}><CourseAnalyticsPage /></RoleRoute>} />
      <Route path="announcements" element={<AnnouncementsRouter />} />
      <Route path="monitor" element={<RoleRoute roles={['lecturer']}><MonitorTeamsPage /></RoleRoute>} />
      <Route path="users" element={<RoleRoute roles={['admin']}><UsersPage /></RoleRoute>} />
      <Route path="moderation" element={<RoleRoute roles={['admin']}><ModerationPage /></RoleRoute>} />
      <Route path="admin-workspace" element={<RoleRoute roles={['admin']}><AdminWorkspacePage /></RoleRoute>} />
      <Route path="forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;