'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-12 text-center rounded-[12px] border border-dashed border-zinc-200 dark:border-[#2C2C31] bg-zinc-50/50 dark:bg-[#1C1C1F]/40 flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="p-3 rounded-[10px] bg-white dark:bg-[#232327] text-zinc-400 dark:text-[#71717A] border border-zinc-200 dark:border-[#2C2C31] shadow-2xs">
        {icon || <Layers className="h-5 w-5" />}
      </div>
      <div className="max-w-xs space-y-1">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-[#F5F5F5]">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-[#71717A] font-normal leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
