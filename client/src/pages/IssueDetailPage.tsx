import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import type {
  Issue,
  IssueUpdate,
  IssueStatus,
  IssueCategory,
  IssueSeverity,
  IssueDepartment,
  ResponsiblePerson,
} from '@fixora/shared';
import {
  fetchIssueById,
  updateIssueStatus,
  overrideIssueDetails,
  assignTechnician,
  fetchResponsiblePeople,
} from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { IssueHeader } from '../components/issue/IssueHeader';
import { AiTriageCard } from '../components/issue/AiTriageCard';
import { IssueTimeline } from '../components/issue/IssueTimeline';
import { AdminDispatchControls } from '../components/issue/AdminDispatchControls';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [updates, setUpdates] = useState<IssueUpdate[]>([]);
  const [responsiblePeople, setResponsiblePeople] = useState<ResponsiblePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchIssueById(id);
      setIssue(data.issue);
      setUpdates(data.updates);

      // If admin, load staff directory for dispatch
      if (user?.role === 'admin') {
        const staff = await fetchResponsiblePeople();
        setResponsiblePeople(staff);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.role]);

  // Handle Admin Status Update
  const handleStatusUpdate = async (status: IssueStatus, note: string, resolutionNote?: string) => {
    if (!id || !issue) return;
    setError(null);
    setActionSuccess(null);

    try {
      const res = await updateIssueStatus(id, status, note, resolutionNote);
      setIssue(res.issue);
      setUpdates((prev) => [...prev, res.update]);
      setActionSuccess(`Status successfully updated to "${status}".`);
    } catch (err) {
      setError((err as Error).message || 'Failed to update status.');
      throw err;
    }
  };

  // Handle Admin Technician Assignment
  const handleAssignTechnician = async (personId: string) => {
    if (!id || !issue) return;
    setError(null);
    setActionSuccess(null);

    try {
      const res = await assignTechnician(id, personId);
      setIssue(res.issue);
      setUpdates((prev) => [...prev, res.update]);
      setActionSuccess(`Assigned technician "${res.issue.assignedToName}".`);
    } catch (err) {
      setError((err as Error).message || 'Failed to assign technician.');
      throw err;
    }
  };

  // Handle Admin Detail Overrides
  const handleOverrideDetails = async (overrides: {
    category?: IssueCategory;
    severity?: IssueSeverity;
    department?: IssueDepartment;
    note?: string;
  }) => {
    if (!id || !issue) return;
    setError(null);
    setActionSuccess(null);

    try {
      const res = await overrideIssueDetails(id, overrides);
      setIssue(res.issue);
      setUpdates((prev) => [...prev, res.update]);
      setActionSuccess('Issue classification details overridden successfully.');
    } catch (err) {
      setError((err as Error).message || 'Failed to override details.');
      throw err;
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-20 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Loading ticket details..." />
      </main>
    );
  }

  if (error && !issue) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Issue Unavailable</h1>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Go Back
        </button>
      </main>
    );
  }

  if (!issue) return null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={user?.role === 'admin' ? '/admin/dashboard' : '/my-issues'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1 transition"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to {user?.role === 'admin' ? 'Admin Dashboard' : 'My Issues'}</span>
        </Link>

        <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
          Ticket: {issue.ticketId}
        </span>
      </div>

      {actionSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-800 hover:text-emerald-950 font-semibold text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6" role="alert">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Issue Overview, AI Analysis & Activity Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <IssueHeader issue={issue} />
          <AiTriageCard issue={issue} />
          <IssueTimeline updates={updates} />
        </div>

        {/* Right Column: Admin Management Panel or Assigned Staff Card */}
        <div className="lg:col-span-4 space-y-6">
          {user?.role === 'admin' ? (
            <AdminDispatchControls
              issue={issue}
              responsiblePeople={responsiblePeople}
              onStatusUpdate={handleStatusUpdate}
              onAssignTechnician={handleAssignTechnician}
              onOverrideDetails={handleOverrideDetails}
            />
          ) : (
            // Student View: Facility Staff Contact Card
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>Department In-Charge</span>
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Responsible Unit</span>
                  <span className="font-semibold text-slate-900 text-sm">{issue.department} Services</span>
                </div>

                {issue.assignedToName ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider block">
                      Assigned Technician
                    </span>
                    <span className="font-bold text-slate-900 text-sm block">{issue.assignedToName}</span>
                    <span className="text-slate-600 text-[11px] block">
                      A campus technician has been assigned and is addressing this issue.
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-600 text-xs">
                    Pending technician dispatch by campus facilities administrator.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
