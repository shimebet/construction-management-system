import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import CompaniesPage from './pages/companies/CompaniesPage';
import CostPage from './pages/cost/CostPage';
import DailyReportsPage from './pages/daily-reports/DailyReportsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import FinancePage from './pages/finance/FinancePage';
import InventoryPage from './pages/inventory/InventoryPage';
import MilestonesPage from './pages/milestones/MilestonesPage';
import ProcurementPage from './pages/procurement/ProcurementPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import QualityPage from './pages/quality/QualityPage';
import ReportsPage from './pages/reports/ReportsPage';
import RfisPage from './pages/rfis/RfisPage';
import SafetyPage from './pages/safety/SafetyPage';
import SchedulesPage from './pages/schedules/SchedulesPage';
import SettingsPage from './pages/settings/SettingsPage';
import SubmittalsPage from './pages/submittals/SubmittalsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import TasksPage from './pages/tasks/TasksPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import UsersPage from './pages/users/UsersPage';
import WbsPage from './pages/wbs/WbsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/wbs" element={<WbsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          <Route path="/daily-reports" element={<DailyReportsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/rfis" element={<RfisPage />} />
          <Route path="/submittals" element={<SubmittalsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/procurement" element={<ProcurementPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/cost" element={<CostPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}