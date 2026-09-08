import React from 'react';
import {
  Clock3,
  HelpCircle,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { IssueStatus } from '@fixora/shared';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1 font-semibold';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'Submitted':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}
        >
          <Clock3 className={iconSize} aria-hidden="true" />
          <span>Submitted</span>
        </span>
      );
    case 'Under Review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}
        >
          <HelpCircle className={iconSize} aria-hidden="true" />
          <span>Under Review</span>
        </span>
      );
    case 'Assigned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses} ${className}`}
        >
          <Wrench className={iconSize} aria-hidden="true" />
          <span>Assigned</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses} ${className}`}
        >
          <Clock className={iconSize} aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className={iconSize} aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
    case 'Reopened':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses} ${className}`}
        >
          <AlertCircle className={iconSize} aria-hidden="true" />
          <span>Reopened</span>
        </span>
      );
  }
};
