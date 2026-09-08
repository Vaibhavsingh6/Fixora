import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import type { UserRole } from '@fixora/shared';
import { isAllowedInstitutionalEmail, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Initial authentication hydration state
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <LoadingSpinner label="Verifying access permissions..." size="lg" />
      </main>
    );
  }

  // 2. Unauthenticated user check -> redirect to login with return path
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 3. Institutional domain validation check
  if (!isAllowedInstitutionalEmail(user.email)) {
    return (
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div
          role="alert"
          aria-live="assertive"
          className="bg-white p-8 rounded-xl shadow-sm border border-rose-200"
        >
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Institutional Access Restricted</h1>

          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            {INSTITUTION_RESTRICTED_MESSAGE}
          </p>

          <Link
            to="/login"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Sign in with @vitbhopal.ac.in Account
          </Link>
        </div>
      </main>
    );
  }

  // 4. Role authorization check -> strictly verify user's role against allowed list
  if (!allowedRoles.includes(user.role)) {
    const recommendedPath = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';

    return (
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div
          role="alert"
          aria-live="assertive"
          className="bg-white p-8 rounded-xl shadow-sm border border-rose-200"
        >
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h1>

          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Your current account role is{' '}
            <strong className="capitalize text-slate-800 font-semibold">{user.role}</strong>. This section
            requires <strong className="capitalize text-slate-800 font-semibold">{allowedRoles.join(' or ')}</strong> privileges.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={recommendedPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Return to My Dashboard</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Authorization passed
  return <>{children}</>;
};
