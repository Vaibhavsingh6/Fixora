import React from 'react';
import { Sparkles, Eye, ShieldCheck, Check, FileText } from 'lucide-react';
import type { Issue } from '@fixora/shared';
import { SeverityBadge } from '../SeverityBadge';

interface AiTriageCardProps {
  issue: Issue;
}

export const AiTriageCard: React.FC<AiTriageCardProps> = ({ issue }) => {
  const hasDiffDescription =
    Boolean(issue.improvedDescription && issue.improvedDescription.trim() !== issue.description.trim());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Triage & Advisory Analysis</h2>
            <p className="text-xs text-slate-500">Analyzed by Gemini 3.8 Flash Multimodal</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 self-start sm:self-auto">
          <span>AI Suggested (Advisory Only)</span>
        </div>
      </div>

      {/* Dedicated AI Vision Insights Section (Photo observations) */}
      {issue.visualObservations && issue.visualObservations.length > 0 && (
        <section
          aria-label="AI Vision Insights"
          className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <span>AI Vision Insights</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
              Visual Evidence Analyzed
            </span>
          </div>

          <div className="space-y-2">
            {issue.visualObservations.map((obs, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-indigo-950 font-medium bg-white/70 p-2.5 rounded-xl border border-indigo-100/80"
              >
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{obs}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Suggested Attributes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
            Suggested Category
          </span>
          <span className="text-sm font-bold text-slate-900">{issue.category}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
            Suggested Dept
          </span>
          <span className="text-sm font-bold text-slate-900">{issue.aiSuggestedDepartment}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
            Suggested Severity
          </span>
          <SeverityBadge severity={issue.aiSuggestedSeverity} size="sm" />
        </div>
      </div>

      {/* Enhanced Description Comparison */}
      <section aria-label="Issue description comparison" className="space-y-2 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Issue Description Analysis</span>
        </div>

        {hasDiffDescription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Description */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Original Description</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Student Report
                </span>
              </div>
              <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {issue.description}
              </p>
            </div>

            {/* AI Improved Draft */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>AI Improved Draft</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Gemini Structured
                </span>
              </div>
              <p className="text-xs text-indigo-950 whitespace-pre-line leading-relaxed italic">
                "{issue.improvedDescription}"
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">Student Description</span>
            <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {issue.description}
            </p>
          </div>
        )}
      </section>

      {/* AI Transparency & Human Oversight Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Decision Transparency:</strong> Gemini 3.8 Flash provides automated classification
          recommendations. Final dispatch, severity validation, and technician assignments are
          strictly reviewed and approved by human campus administrators.
        </p>
      </div>
    </div>
  );
};
