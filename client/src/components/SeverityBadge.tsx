import React from 'react';
import type { IssueSeverity } from '@fixora/shared';
import { ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: IssueSeverity;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = false,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const styling = {
    Critical: 'bg-red-100 text-red-900 border-red-300 font-bold',
    High: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    Medium: 'bg-blue-100 text-blue-900 border-blue-300 font-semibold',
    Low: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
  }[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${styling} ${className}`}
    >
      {showIcon && <ShieldAlert className={iconSize} aria-hidden="true" />}
      <span>Severity: {severity}</span>
    </span>
  );
};
