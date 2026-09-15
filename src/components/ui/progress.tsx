'use client';

import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = 'indigo',
  size = 'md',
  showLabel = false,
  className = '',
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const variantColors = {
    indigo: 'bg-indigo-600 dark:bg-[#8B7CFF]',
    emerald: 'bg-emerald-500 dark:bg-[#34D399]',
    amber: 'bg-amber-500 dark:bg-[#F5B74F]',
    rose: 'bg-rose-500 dark:bg-[#F87171]',
    slate: 'bg-zinc-500 dark:bg-[#71717A]',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className={`w-full space-y-1 ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between text-[11px] font-mono font-medium text-zinc-500 dark:text-[#A1A1AA]">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-zinc-100 dark:bg-[#232327] rounded-full overflow-hidden border border-zinc-200 dark:border-[#2C2C31]`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variantColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
