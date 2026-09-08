import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';

// Route Code-Splitting via React.lazy()
const LandingPage = React.lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const StudentDashboard = React.lazy(() =>
  import('./pages/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const AdminDashboard = React.lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const ReportIssuePage = React.lazy(() =>
  import('./pages/ReportIssuePage').then((m) => ({ default: m.ReportIssuePage }))
);
const MyIssuesPage = React.lazy(() =>
  import('./pages/MyIssuesPage').then((m) => ({ default: m.MyIssuesPage }))
);
const IssueDetailPage = React.lazy(() =>
  import('./pages/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <Suspense
            fallback={
              <main className="flex-1 flex justify-center items-center py-24">
                <LoadingSpinner size="lg" label="Loading page..." />
              </main>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Protected Routes */}
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-issue"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ReportIssuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-issues"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyIssuesPage />
                  </ProtectedRoute>
                }
              />

              {/* Common Authenticated Routes (Guarded by component/server RBAC) */}
              <Route
                path="/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};
