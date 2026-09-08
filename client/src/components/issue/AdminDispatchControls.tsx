import React, { useState } from 'react';
import { Wrench, Phone, Mail, Edit3, ArrowRight } from 'lucide-react';
import type {
  Issue,
  IssueStatus,
  IssueCategory,
  IssueSeverity,
  IssueDepartment,
  ResponsiblePerson,
} from '@fixora/shared';
import {
  ISSUE_STATUSES,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_DEPARTMENTS,
} from '@fixora/shared';
import { LoadingSpinner } from '../LoadingSpinner';

interface AdminDispatchControlsProps {
  issue: Issue;
  responsiblePeople: ResponsiblePerson[];
  onStatusUpdate: (status: IssueStatus, note: string, resolutionNote?: string) => Promise<void>;
  onAssignTechnician: (personId: string) => Promise<void>;
  onOverrideDetails: (overrides: {
    category?: IssueCategory;
    severity?: IssueSeverity;
    department?: IssueDepartment;
    note?: string;
  }) => Promise<void>;
}

export const AdminDispatchControls: React.FC<AdminDispatchControlsProps> = ({
  issue,
  responsiblePeople,
  onStatusUpdate,
  onAssignTechnician,
  onOverrideDetails,
}) => {
  // Status Update State
  const [newStatus, setNewStatus] = useState<IssueStatus>(issue.status);
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState(issue.resolutionNote || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Technician Assignment State
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    issue.assignedToId || (responsiblePeople[0]?.id ?? '')
  );
  const [isAssigning, setIsAssigning] = useState(false);

  // Overrides State
  const [overrideCategory, setOverrideCategory] = useState<IssueCategory>(issue.category);
  const [overrideSeverity, setOverrideSeverity] = useState<IssueSeverity>(issue.severity);
  const [overrideDepartment, setOverrideDepartment] = useState<IssueDepartment>(issue.department);
  const [overrideNote, setOverrideNote] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);

    if (newStatus === 'Resolved' && !resolutionNote.trim()) {
      setStatusError('Resolution note is required when resolving a ticket.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(
        newStatus,
        statusNote.trim() || `Status changed to ${newStatus}`,
        newStatus === 'Resolved' ? resolutionNote.trim() : undefined
      );
      setStatusNote('');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    setIsAssigning(true);
    try {
      await onAssignTechnician(selectedPersonId);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOverriding(true);
    try {
      await onOverrideDetails({
        category: overrideCategory,
        severity: overrideSeverity,
        department: overrideDepartment,
        note: overrideNote.trim(),
      });
      setOverrideNote('');
    } finally {
      setIsOverriding(false);
    }
  };

  const selectedPerson = responsiblePeople.find((p) => p.id === selectedPersonId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Wrench className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-bold text-slate-900">Admin Dispatch Controls</h2>
      </div>

      {/* 1. Status Update Form */}
      <form onSubmit={handleStatusSubmit} className="space-y-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          1. Update Ticket Status
        </span>

        <div>
          <label htmlFor="adminStatusSelect" className="block text-xs font-semibold text-slate-700 mb-1">
            Status Action
          </label>
          <select
            id="adminStatusSelect"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
          >
            {ISSUE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="statusNote" className="block text-xs font-semibold text-slate-700 mb-1">
            Update Note <span className="text-red-500">*</span>
          </label>
          <textarea
            id="statusNote"
            rows={2}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="e.g. Technician dispatched to inspect wiring..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            required
          />
        </div>

        {newStatus === 'Resolved' && (
          <div>
            <label htmlFor="resolutionNote" className="block text-xs font-semibold text-emerald-800 mb-1">
              Final Resolution Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resolutionNote"
              rows={2}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Replaced faulty socket and verified grounding."
              className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              required
            />
          </div>
        )}

        {statusError && <p className="text-xs text-red-600 font-medium">{statusError}</p>}

        <button
          type="submit"
          disabled={isUpdatingStatus}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
        >
          {isUpdatingStatus ? (
            <>
              <LoadingSpinner inline size="sm" className="text-white" />
              <span>Applying Update...</span>
            </>
          ) : (
            <>
              <span>Apply Status Transition</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <hr className="border-slate-100" />

      {/* 2. Assign Technician Form */}
      <form onSubmit={handleAssignSubmit} className="space-y-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          2. Assign Campus Technician
        </span>

        <div>
          <label htmlFor="assignTechnicianSelect" className="block text-xs font-semibold text-slate-700 mb-1">
            Select Staff Member
          </label>
          <select
            id="assignTechnicianSelect"
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          >
            {responsiblePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.department})
              </option>
            ))}
          </select>
        </div>

        {selectedPerson && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>{selectedPerson.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>{selectedPerson.email}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isAssigning}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          {isAssigning ? (
            <>
              <LoadingSpinner inline size="sm" className="text-white" />
              <span>Assigning...</span>
            </>
          ) : (
            <span>Assign Staff Member</span>
          )}
        </button>
      </form>

      <hr className="border-slate-100" />

      {/* 3. Override Triage Details */}
      <form onSubmit={handleOverrideSubmit} className="space-y-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1">
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
          <span>3. Override Classification</span>
        </span>

        <div className="space-y-2.5">
          <div>
            <label htmlFor="overrideDeptSelect" className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <select
              id="overrideDeptSelect"
              value={overrideDepartment}
              onChange={(e) => setOverrideDepartment(e.target.value as IssueDepartment)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              {ISSUE_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="overrideSeveritySelect" className="block text-xs font-semibold text-slate-700 mb-1">
              Severity
            </label>
            <select
              id="overrideSeveritySelect"
              value={overrideSeverity}
              onChange={(e) => setOverrideSeverity(e.target.value as IssueSeverity)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              {ISSUE_SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="overrideCategorySelect" className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              id="overrideCategorySelect"
              value={overrideCategory}
              onChange={(e) => setOverrideCategory(e.target.value as IssueCategory)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="overrideReason" className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Override
            </label>
            <input
              id="overrideReason"
              type="text"
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              placeholder="e.g. Higher impact during semester exams"
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isOverriding}
          className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          {isOverriding ? 'Saving Overrides...' : 'Apply Overrides'}
        </button>
      </form>
    </div>
  );
};
