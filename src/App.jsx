import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NetworkProvider } from './context/NetworkContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminReports from './pages/AdminReports';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import SchoolAdminDashboard from './pages/dashboards/SchoolAdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import Management from './pages/dashboards/Management';

// Attendance & Reports
import MarkAttendance from './components/Attendance/MarkAttendance';
import AttendanceSheet from './components/AttendanceSheet';
import AttendanceReport from './components/Reports/AttendanceReport';
import ProfilePage from './pages/ProfilePage';

// Initialize offline sync listeners
import './utils/offlineSync';

/* -----------------------------
   Role-based Dashboard Redirect
-------------------------------- */
const DashboardRedirect = () => {
  const { user, loading } = useAuth();   // 👈 ADD loading

  // ⏳ WAIT until AuthContext finishes restoring session
  if (loading) return null;              // or a spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = {
    ADMIN: '/admin/dashboard',
    DISTRICT_ADMIN: '/admin/dashboard',
    BLOCK_ADMIN: '/admin/dashboard',
    SCHOOL: '/school/dashboard',
    TEACHER: '/teacher/dashboard',
    STUDENT: '/student/dashboard',
    PARENT: '/student/dashboard',
  };

  return <Navigate to={roleRoutes[user.role]} replace />;
};


/* -----------------------------
   Main App Component
-------------------------------- */
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NetworkProvider>
          <Router>
            <Routes>

            {/* ---------- Public Routes ---------- */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* ---------- Dashboard Redirect ---------- */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* ---------- Admin Dashboards ---------- */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ---------- School Admin ---------- */}
            <Route
              path="/school/dashboard"
              element={
                <ProtectedRoute requiredRole="SCHOOL">
                  <SchoolAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/school/management"
              element={
                <ProtectedRoute allowedRoles={['SCHOOL', 'ADMIN', 'DISTRICT_ADMIN', 'BLOCK_ADMIN']}>
                  <Management />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/management"
              element={
                <ProtectedRoute allowedRoles={['SCHOOL', 'ADMIN', 'DISTRICT_ADMIN', 'BLOCK_ADMIN']}>
                  <Management />
                </ProtectedRoute>
              }
            />

            {/* ---------- Teacher ---------- */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute requiredRole="TEACHER">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* ---------- Student / Parent ---------- */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* ---------- Admin Reports (ADMIN IDs ONLY) ---------- */}
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMIN',
                    'DISTRICT_ADMIN',
                    'BLOCK_ADMIN',
                    'SCHOOL',
                  ]}
                >
                  <AdminReports />
                </ProtectedRoute>
              }
            />

            {/* ---------- Attendance ---------- */}
            <Route
              path="/attendance/mark"
              element={
                <ProtectedRoute>
                  <MarkAttendance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance/sheet"
              element={
                <ProtectedRoute>
                  <AttendanceSheet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports/viewer"
              element={
                <ProtectedRoute>
                  <AttendanceReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/:role/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ---------- Fallback ---------- */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          </Router>
        </NetworkProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
