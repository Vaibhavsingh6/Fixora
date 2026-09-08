import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface AccessStatusBannerProps {
  status: 'granted' | 'denied';
  title?: string;
  message: string;
  secondaryMessage?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export const AccessStatusBanner: React.FC<AccessStatusBannerProps> = ({
  status,
  title,
  message,
  secondaryMessage,
  action,
  onDismiss,
}) => {
  const isGranted = status === 'granted';

  return (
    <div
      role={isGranted ? 'status' : 'alert'}
      aria-live="polite"
      className={`mb-5 p-4 rounded-xl border transition-all ${
        isGranted
          ? 'bg-indigo-50/80 border-indigo-200 text-slate-900'
          : 'bg-rose-50/80 border-rose-200 text-slate-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isGranted
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-rose-100 text-rose-700'
          }`}
          aria-hidden="true"
        >
          {isGranted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              isGranted ? 'text-indigo-700' : 'text-rose-700'
            }`}
          >
            <span>{isGranted ? '✓' : '✕'}</span>
            <span>{title || (isGranted ? 'ACCESS GRANTED' : 'ACCESS DENIED')}</span>
          </div>

          <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">
            {message}
          </p>

          {secondaryMessage && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {secondaryMessage}
            </p>
          )}

          {action && <div className="mt-2.5 pt-2 border-t border-slate-200/60">{action}</div>}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors -mr-1 -mt-1"
          >
            <span aria-hidden="true" className="text-lg leading-none">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};
