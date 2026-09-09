import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { formatStructuredLocation, type Issue, type IssueStatus } from '@fixora/shared';
import { fetchIssues } from '../services/issueService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusFilterChips } from '../components/common/StatusFilterChips';

export const MyIssuesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as IssueStatus) || '';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const loadIssues = async (statusOverride?: IssueStatus | '', queryOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeStatus = statusOverride !== undefined ? statusOverride : statusFilter;
      const activeQuery = queryOverride !== undefined ? queryOverride : searchQuery;
      const data = await fetchIssues({
        status: activeStatus,
        search: activeQuery,
      });
      setIssues(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load your issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues(statusFilter);
    // Update URL query param quietly
    if (statusFilter) {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIssues();
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    loadIssues('', '');
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Reported Issues</h1>
          <p className="text-slate-600 mt-1">
            Track status, technician assignments, and resolution updates in real-time.
          </p>
        </div>
        <Link
          to="/report-issue"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6" role="alert">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Filter and Search Bar Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 space-y-3">
        {/* Status Filter Chips Row */}
        <div>
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Status Filter
          </div>
          <StatusFilterChips
            selectedStatus={statusFilter}
            onSelectStatus={(status) => setStatusFilter(status)}
          />
        </div>

        {/* Search Input Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80" role="search">
            <label htmlFor="issue-search-input" className="sr-only">
              Search issues by ticket ID or title
            </label>
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="issue-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket ID or title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
          </form>

          {(statusFilter || searchQuery) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" label="Loading your issues..." />
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Reported Issues Found</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
            {statusFilter || searchQuery
              ? 'No issues match your selected filter or search criteria.'
              : "You haven't submitted any campus facility issues yet."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(statusFilter || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show All Issues</span>
              </button>
            )}
            <Link
              to="/report-issue"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 text-xs"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Report an Issue Now</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4" role="feed" aria-label="Reported issues list">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {issue.ticketId}
                    </span>
                    <StatusBadge status={issue.status} />
                    <SeverityBadge severity={issue.severity} size="sm" />
                    <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
                      {issue.department}
                    </span>
                    {issue.hasImage && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                        <span>Photo</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                    {issue.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>{formatStructuredLocation(issue)}</span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <time dateTime={new Date(Number(issue.createdAt)).toISOString()}>
                        {new Date(Number(issue.createdAt)).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    <span>View Timeline</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};
