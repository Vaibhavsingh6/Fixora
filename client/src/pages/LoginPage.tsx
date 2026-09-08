import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { AccessStatusBanner } from '../components/common/AccessStatusBanner';
import { LogIn, Lock, Mail, ArrowRight, Eye, EyeOff, Shield, User } from 'lucide-react';

import { isAllowedInstitutionalEmail, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';

const UNVERIFIED_MESSAGE = 'Please verify your VIT Bhopal email before accessing Fixora.';

export const LoginPage: React.FC = () => {
  const { login, loading, error, clearError, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);
    setResendStatus('idle');

    if (!email || !password) {
      setClientError('Please fill in both email and password.');
      return;
    }

    if (!isAllowedInstitutionalEmail(email)) {
      setClientError(INSTITUTION_RESTRICTED_MESSAGE);
      return;
    }

    try {
      const user = await login({ email, password });
      const target = redirectPath || (user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      navigate(target, { replace: true });
    } catch {
      // Error handled in AuthContext
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      const sent = await resendVerificationEmail();
      if (sent) {
        setResendStatus('sent');
      } else {
        setResendStatus('failed');
      }
    } catch {
      setResendStatus('failed');
    }
  };

  const isDomainDenied = clientError === INSTITUTION_RESTRICTED_MESSAGE || error === INSTITUTION_RESTRICTED_MESSAGE;
  const isUnverified = error === UNVERIFIED_MESSAGE;

  // Quick fill helper for competition evaluators
  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    clearError();
    setClientError(null);
    setResendStatus('idle');
  };

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-600 border border-indigo-100">
            <LogIn className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to Fixora</h1>
          <p className="text-sm text-slate-600 mt-1">Access your campus reporting dashboard</p>
        </div>

        {/* Institutional Access Denied Banner - Invalid Domain */}
        {isDomainDenied && (
          <AccessStatusBanner
            status="denied"
            title="ACCESS DENIED"
            message={INSTITUTION_RESTRICTED_MESSAGE}
            onDismiss={() => {
              setClientError(null);
              clearError();
            }}
          />
        )}

        {/* Institutional Access Denied Banner - Unverified VIT Email */}
        {isUnverified && !isDomainDenied && (
          <AccessStatusBanner
            status="denied"
            title="ACCESS DENIED"
            message={UNVERIFIED_MESSAGE}
            action={
              <div className="flex items-center gap-2">
                {resendStatus === 'sent' ? (
                  <span className="text-xs font-semibold text-emerald-700">
                    ✓ Verification email sent! Please check your inbox.
                  </span>
                ) : resendStatus === 'failed' ? (
                  <span className="text-xs text-rose-700">
                    Failed to resend. Please sign in again to request a new link.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending'}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? 'Sending verification...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            }
            onDismiss={() => {
              clearError();
              setResendStatus('idle');
            }}
          />
        )}

        {/* Other Validation Error Alerts */}
        {(clientError || (error && !isDomainDenied && !isUnverified)) && (
          <ErrorAlert
            message={clientError || error || ''}
            onDismiss={() => {
              setClientError(null);
              clearError();
            }}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Campus Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@vitbhopal.ac.in"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-1">
            Quick Fill Demo Accounts (@vitbhopal.ac.in)
          </p>
          <p className="text-[11px] text-slate-400 text-center mb-3">Password: password123</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('student@vitbhopal.ac.in')}
              className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
              <span className="truncate">Student Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@vitbhopal.ac.in')}
              className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
              <span className="truncate">Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Registration Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          New to Fixora?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
};
