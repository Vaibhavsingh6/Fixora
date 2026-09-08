import React from 'react';
import type { IssueStatus } from '@fixora/shared';
import { ISSUE_STATUSES } from '@fixora/shared';
import { Check } from 'lucide-react';

export interface StatusFilterChipsProps {
  selectedStatus: IssueStatus | '';
  onSelectStatus: (status: IssueStatus | '') => void;
  className?: string;
  counts?: Partial<Record<IssueStatus | 'all', number>>;
}

export const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  selectedStatus,
  onSelectStatus,
  className = '',
  counts,
}) => {
  const options: Array<{ label: string; value: IssueStatus | '' }> = [
    { label: 'All', value: '' },
    ...ISSUE_STATUSES.map((status) => ({ label: status, value: status })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter issues by status"
      className={`flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = selectedStatus === option.value;
        const count = counts ? (option.value === '' ? counts.all : counts[option.value]) : undefined;

        return (
          <button
            key={option.label}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onSelectStatus(option.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
            <span>{option.label}</span>
            {typeof count === 'number' && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
