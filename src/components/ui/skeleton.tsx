'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  className?: string;
}

export function Skeleton({ variant = 'text', className = '', ...props }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-zinc-200/80 dark:bg-zinc-800/80 rounded';

  if (variant === 'circular') {
    return <div className={`rounded-full ${baseClasses} ${className}`} {...props} />;
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-3 ${className}`} {...props}>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (variant === 'rectangular') {
    return <div className={`rounded-md ${baseClasses} ${className}`} {...props} />;
  }

  return <div className={`h-4 w-full rounded ${baseClasses} ${className}`} {...props} />;
}

export function SkeletonTableRows({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-zinc-200/60 dark:border-zinc-800/60">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-3.5 py-3">
              <div
                className="h-4 bg-zinc-200/80 dark:bg-zinc-800/80 rounded animate-pulse"
                style={{
                  width: cIdx === 0 ? '70%' : cIdx === cols - 1 ? '40%' : '55%',
                  marginLeft: cIdx === cols - 1 ? 'auto' : '0',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
