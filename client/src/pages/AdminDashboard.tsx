import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Search,
  RefreshCw,
  Clock,
  Clock3,
  CheckCircle2,
  Wrench,
  MapPin,
  Layers,
  ArrowRight,
  ShieldAlert,
  Camera,
  RotateCcw,
} from 'lucide-react';
import {
  ISSUE_DEPARTMENTS,
  ISSUE_SEVERITIES,
  formatStructuredLocation,
  type Issue,
  type IssueStatus,
  type IssueDepartment,
  type IssueSeverity,
} from '@fixora/shared';
import { fetchIssues } from '../services/issueService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusFilterChips } from '../components/common/StatusFilterChips';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Filters
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<IssueDepartment | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssues({
        status: statusFilter,
        department: departmentFilter,
        severity: severityFilter,
        search: searchQuery,
      });
      setIssues(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [statusFilter, departmentFilter, severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIssues();
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setDepartmentFilter('');
    setSeverityFilter('');
    setSearchQuery('');
  };

  // Metrics
  const totalCount = issues.length;
  const pendingCount = issues.filter((i) => i.status === 'Submitted' || i.status === 'Under Review').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress' || i.status === 'Assigned').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const criticalCount = issues.filter((i) => i.severity === 'Critical').length;

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
              <Shield className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Campus Admin Operations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wide">
                  Elevated Clearance
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Administrator: <strong className="text-slate-800 font-semibold">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start sm:self-auto">
            <span className="text-[11px] text-slate-500">
              Synced: {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={loadIssues}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tickets</span>
            <Layers className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Campus wide</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Submitted')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-blue-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Triage</span>
            <Clock3 className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-blue-800">{pendingCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Needs dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('In Progress')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{inProgressCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Assigned / In field</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Resolved')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-emerald-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{resolvedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Completed issues</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('Critical')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1 text-left hover:border-rose-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{criticalCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">High urgency</span>
        </button>
      </div>

      {error && (
        <div className="mb-6" role="alert">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 space-y-3">
        {/* Status Filter Chips */}
        <div>
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Status Filter
          </div>
          <StatusFilterChips
            selectedStatus={statusFilter}
            onSelectStatus={(status) => setStatusFilter(status)}
          />
        </div>

        {/* Secondary Filter Row */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-5" role="search">
            <label htmlFor="adminSearchQuery" className="sr-only">
              Search by ticket ID, title, or location
            </label>
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
            <input
              id="adminSearchQuery"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket ID, title, or location..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </form>

          {/* Department */}
          <div className="md:col-span-4">
            <label htmlFor="adminDepartmentFilter" className="sr-only">
              Filter by department
            </label>
            <select
              id="adminDepartmentFilter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as IssueDepartment | '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            >
              <option value="">All Departments</option>
              {ISSUE_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="md:col-span-3 flex items-center gap-2">
            <label htmlFor="adminSeverityFilter" className="sr-only">
              Filter by severity
            </label>
            <select
              id="adminSeverityFilter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as IssueSeverity | '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            >
              <option value="">All Severities</option>
              {ISSUE_SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>

            {(statusFilter || departmentFilter || severityFilter || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset all filters"
                aria-label="Reset all filters"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition shrink-0"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Queue Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Campus Facility Issue Queue ({issues.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Select any ticket to manage</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner size="lg" label="Loading campus ticket queue..." />
          </div>
        ) : issues.length === 0 ? (
          <div className="py-16 text-center text-slate-600 text-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-slate-900">No issues matching criteria</p>
            <p className="text-xs text-slate-500 mt-1">All reports triaged or filters too restrictive.</p>
            {(statusFilter || departmentFilter || severityFilter || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <caption className="sr-only">List of campus facility issues requiring administrator dispatch</caption>
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Issue & Location
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Department
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Severity
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Assigned Staff
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50 transition group">
                      <td className="px-5 py-3.5 font-mono font-bold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 block"
                          >
                            {issue.ticketId}
                          </Link>
                          {issue.hasImage && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200"
                              title="Photograph attached"
                            >
                              <Camera className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                              <span className="sr-only">Photo</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <Link
                          to={`/issues/${issue.id}`}
                          className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                        >
                          {issue.title}
                        </Link>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                          <span className="truncate" title={formatStructuredLocation(issue)}>
                            {formatStructuredLocation(issue)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-800">
                        {issue.department}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <SeverityBadge severity={issue.severity} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                        {issue.assignedToName ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700">
                            <Wrench className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                            <span>{issue.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/issues/${issue.id}`}
                          aria-label={`Manage ticket ${issue.ticketId}`}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-0.5 transition text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-200 p-4 space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="pt-4 first:pt-0 space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                        {issue.ticketId}
                      </span>
                      {issue.hasImage && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          <Camera className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                          <span>Photo</span>
                        </span>
                      )}
                    </div>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{issue.title}</h3>
                    <div className="flex items-start gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        {formatStructuredLocation(issue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <span className="px-2 py-0.5 rounded-full font-medium bg-white text-slate-700 border border-slate-200 text-[11px]">
                        {issue.department}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      {issue.assignedToName ? (
                        <span className="font-medium text-indigo-700 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                          <span>{issue.assignedToName}</span>
                        </span>
                      ) : (
                        <span className="italic text-slate-500">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/issues/${issue.id}`}
                    aria-label={`Open ticket ${issue.ticketId}: ${issue.title}`}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span>Manage Ticket & Dispatch</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};
