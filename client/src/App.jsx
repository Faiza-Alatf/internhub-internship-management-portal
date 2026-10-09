import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InternsPage from './pages/InternsPage';
import InternProfilePage from './pages/InternProfilePage';
import MentorsPage from './pages/MentorsPage';
import MentorProfilePage from './pages/MentorProfilePage';
import DepartmentsPage from './pages/DepartmentsPage';
import TasksPage from './pages/TasksPage';
import AttendancePage from './pages/AttendancePage';
import EvaluationsPage from './pages/EvaluationsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const ADMIN = ['ADMIN'];
const STAFF = ['ADMIN', 'MENTOR'];

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="interns" element={<ProtectedRoute roles={STAFF}><InternsPage /></ProtectedRoute>} />
        <Route path="interns/:id" element={<ProtectedRoute roles={STAFF}><InternProfilePage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={['INTERN']}><InternProfilePage self /></ProtectedRoute>} />
        <Route path="mentors" element={<ProtectedRoute roles={ADMIN}><MentorsPage /></ProtectedRoute>} />
        <Route path="mentors/:id" element={<ProtectedRoute roles={ADMIN}><MentorProfilePage /></ProtectedRoute>} />
        <Route path="departments" element={<ProtectedRoute roles={ADMIN}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
