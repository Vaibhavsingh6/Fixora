import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const returnPath = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/student/dashboard'
    : '/';

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
          <HelpCircle className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Page Not Found</h2>

        <p className="text-sm text-slate-600 mb-6">
          The campus resource or page you requested does not exist or may have been relocated.
        </p>

        <Link
          to={returnPath}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Safe Ground</span>
        </Link>
      </div>
    </main>
  );
};
