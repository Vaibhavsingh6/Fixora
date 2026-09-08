import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { AccessStatusBanner } from '../components/common/AccessStatusBanner';
import { UserPlus, User, Mail, Lock, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { isAllowedInstitutionalEmail, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';

export const RegisterPage: React.FC = () => {
  const { register, loading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<'granted' | 'denied' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);
    setAccessStatus(null);

    if (!name.trim()) {
      setClientError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setClientError('Please enter your campus email.');
      return;
    }
    if (!isAllowedInstitutionalEmail(email)) {
      setAccessStatus('denied');
      return;
    }
    if (password.length < 6) {
      setClientError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
      });

      setAccessStatus('granted');
    } catch {
      // Handled in AuthContext
    }
  };

  const isDomainDenied = accessStatus === 'denied' || error === INSTITUTION_RESTRICTED_MESSAGE;

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-600 border border-indigo-100">
            <UserPlus className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your Account</h1>
          <p className="text-sm text-slate-600 mt-1">VIT Bhopal Campus Portal (@vitbhopal.ac.in)</p>
        </div>

        {/* Institutional Access Granted Banner */}
        {accessStatus === 'granted' && (
          <AccessStatusBanner
            status="granted"
            title="ACCESS GRANTED"
            message="VIT Bhopal email accepted."
            secondaryMessage="Please verify your institutional email before signing in."
            action={
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            }
          />
        )}

        {/* Institutional Access Denied Banner */}
        {isDomainDenied && (
          <AccessStatusBanner
            status="denied"
            title="ACCESS DENIED"
            message={INSTITUTION_RESTRICTED_MESSAGE}
            onDismiss={() => {
              setAccessStatus(null);
              clearError();
            }}
          />
        )}

        {/* Other Validation Error Alerts */}
        {(clientError || (error && !isDomainDenied)) && (
          <ErrorAlert
            message={clientError || error || ''}
            onDismiss={() => {
              setClientError(null);
              clearError();
            }}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Campus Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@vitbhopal.ac.in"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password (6+ characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
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

          {/* Role Policy Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              All public registrations are provisioned as <strong>Student</strong> accounts.
              Campus facility administrators and staff accounts are provisioned via verified institutional administration.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {loading ? (
              <span>Creating Student Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
};
