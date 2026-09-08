import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label,
  size = 'md',
  className = '',
  inline = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  if (inline) {
    return (
      <div
        className={`${sizeClasses} border-current border-t-transparent rounded-full animate-spin ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center py-6 space-y-3 ${className}`}
    >
      <div
        className={`${sizeClasses} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
};
