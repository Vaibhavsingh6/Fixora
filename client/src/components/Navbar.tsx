import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Shield, LogOut, Menu, X, User, PlusCircle, ListOrdered } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 text-indigo-700 font-bold text-xl tracking-tight focus-visible:rounded"
            aria-label="Fixora Home"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>Fixora</span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
              Campus
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {user ? (
              <div className="flex items-center gap-5">
                {/* Navigation Links */}
                {user.role === 'admin' ? (
                  <Link
                    to="/admin/dashboard"
                    className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    Operations Queue
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/student/dashboard"
                      className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/report-issue"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Report Issue
                    </Link>
                    <Link
                      to="/my-issues"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      <ListOrdered className="w-4 h-4" />
                      My Issues
                    </Link>
                  </>
                )}

                {/* Role Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  {user.role === 'admin' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Student</span>
                    </>
                  )}
                </div>

                {/* User Name */}
                <span className="text-sm font-medium text-slate-800 max-w-[130px] truncate" title={user.name}>
                  {user.name}
                </span>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors py-1.5 px-3 rounded-xl hover:bg-rose-50"
                  aria-label="Sign out of Fixora"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  {user.role}
                </span>
              </div>

              {user.role === 'admin' ? (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-slate-700 hover:text-indigo-600 py-1"
                >
                  Operations Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/student/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-slate-700 hover:text-indigo-600 py-1"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/report-issue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-indigo-600 hover:text-indigo-700 py-1"
                  >
                    Report Issue
                  </Link>
                  <Link
                    to="/my-issues"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-slate-700 hover:text-indigo-600 py-1"
                  >
                    My Issues
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full text-left text-base font-medium text-rose-600 py-1 border-t border-slate-100 pt-2"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-700 hover:text-indigo-600 py-1"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
