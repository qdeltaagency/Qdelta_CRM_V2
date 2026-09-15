'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  className?: string;
}

export function Skeleton({ variant = 'text', className = '', ...props }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-zinc-200 dark:bg-[#232327]';

  if (variant === 'circular') {
    return <div className={`rounded-full ${baseClasses} ${className}`} {...props} />;
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-[10px] border border-zinc-200 dark:border-[#2C2C31] bg-white dark:bg-[#1C1C1F] p-5 space-y-3 ${className}`} {...props}>
        <div className={`h-4 w-1/3 rounded-[6px] ${baseClasses}`} />
        <div className={`h-8 w-2/3 rounded-[6px] ${baseClasses}`} />
        <div className={`h-3 w-full rounded-[6px] ${baseClasses}`} />
      </div>
    );
  }

  if (variant === 'rectangular') {
    return <div className={`rounded-[8px] ${baseClasses} ${className}`} {...props} />;
  }

  return <div className={`h-4 w-full rounded-[6px] ${baseClasses} ${className}`} {...props} />;
}
