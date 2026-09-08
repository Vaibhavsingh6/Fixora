import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  PlusCircle,
  Clock,
  ShieldAlert,
  Calendar,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MapPin,
  Camera,
} from 'lucide-react';
import type { Issue } from '@fixora/shared';
import { fetchIssues } from '../services/issueService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStudentIssues() {
      try {
        const data = await fetchIssues();
        if (isMounted) {
          setRecentIssues(data);
        }
      } catch (err) {
        console.warn('Could not load student dashboard issues:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadStudentIssues();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalReported = recentIssues.length;
  const inProgressCount = recentIssues.filter(
    (i) => i.status === 'In Progress' || i.status === 'Assigned' || i.status === 'Under Review'
  ).length;
  const resolvedCount = recentIssues.filter((i) => i.status === 'Resolved').length;

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Welcome Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
              <User className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Welcome, {user?.name || 'Student'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wide">
                  Student Portal
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Authenticated & Role Verified</span>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Link
          to="/my-issues"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow transition block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
            Total Issues Reported
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-2">{totalReported}</div>
          <span className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
            <span>View all tickets</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        </Link>

        <Link
          to="/my-issues?status=In Progress"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-300 hover:shadow transition block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            In Progress / Active
          </span>
          <div className="text-3xl font-bold text-amber-600 mt-2">{inProgressCount}</div>
          <span className="text-xs text-amber-700 font-medium mt-2 flex items-center gap-1">
            <span>Being addressed</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        </Link>

        <Link
          to="/my-issues?status=Resolved"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow transition block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Resolved Issues
          </span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{resolvedCount}</div>
          <span className="text-xs text-emerald-700 font-medium mt-2 flex items-center gap-1">
            <span>Closed issues</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center mb-4">
              <PlusCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold mb-2 text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Gemini 3.8 Flash Powered</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Report Campus Facility Issue</h2>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Describe classroom, hostel, lab, or campus issues. Gemini AI will categorize, evaluate urgency, and assist facility staff.
            </p>
          </div>
          <Link
            to="/report-issue"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-800 hover:bg-indigo-50 font-bold rounded-xl transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          >
            <span>Start Issue Report</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              Real-Time Tracking
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Track My Reported Issues</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Review live status badges, assigned technician details, and audit timeline updates for all your reported tickets.
            </p>
          </div>
          <Link
            to="/my-issues"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            <span>View All My Tickets ({totalReported})</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <span>Recent Reported Issues</span>
          </h2>
          <Link
            to="/my-issues"
            className="text-xs font-semibold text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
          >
            View All ({totalReported})
          </Link>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" label="Loading tickets..." />
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm">
            <p className="mb-3">You haven't reported any issues yet.</p>
            <Link
              to="/report-issue"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Report an Issue</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentIssues.slice(0, 3).map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 rounded-xl px-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {issue.ticketId}
                    </span>
                    <StatusBadge status={issue.status} />
                    <SeverityBadge severity={issue.severity} size="sm" />
                    {issue.hasImage && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <Camera className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                        <span>Photo</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{issue.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>
                      {issue.locationType} - {issue.specificLocation}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 self-end sm:self-center">
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Account Profile Card & RBAC Verification Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Student Profile Document (Firestore)</span>
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-600 uppercase">User UID</dt>
              <dd className="font-mono text-xs text-slate-800 mt-1 truncate" title={user?.uid}>
                {user?.uid}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600 uppercase">Role</dt>
              <dd className="text-slate-800 font-semibold mt-1 capitalize">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600 uppercase">Email Address</dt>
              <dd className="text-slate-800 mt-1">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600 uppercase">Registered Date</dt>
              <dd className="text-slate-800 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active session'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Elevated administrative dispatch routes are strictly restricted to verified facility staff. Client-side route
            guards and server-side rules enforce security boundaries:
          </p>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>Verify Admin Route Guard (403 Expected)</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
};
