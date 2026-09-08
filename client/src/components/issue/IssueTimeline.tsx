import React from 'react';
import { Clock } from 'lucide-react';
import type { IssueUpdate } from '@fixora/shared';

interface IssueTimelineProps {
  updates: IssueUpdate[];
}

export const IssueTimeline: React.FC<IssueTimelineProps> = ({ updates }) => {
  return (
    <section aria-labelledby="timeline-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 id="timeline-heading" className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Clock className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        <span>Activity & Resolution Timeline</span>
      </h2>

      <ol className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {updates.map((update, idx) => (
          <li key={update.id || idx} className="relative group">
            <div
              className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white"
              aria-hidden="true"
            />
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-800">
                    {update.updatedByName || 'System Dispatch'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      update.updatedByRole === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {update.updatedByRole}
                  </span>
                </div>
                <time
                  dateTime={new Date(Number(update.createdAt)).toISOString()}
                  className="text-[11px] text-slate-500 font-medium"
                >
                  {new Date(Number(update.createdAt)).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed">{update.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
