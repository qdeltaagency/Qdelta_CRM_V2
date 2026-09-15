import * as React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
