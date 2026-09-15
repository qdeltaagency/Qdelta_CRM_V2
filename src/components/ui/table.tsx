'use client';

import * as React from 'react';

export function Table({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
      <table className={`w-full text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/90 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-zinc-200/80 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-zinc-50/90 dark:hover:bg-zinc-800/50 transition-colors cursor-default ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 select-none ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-normal align-middle ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableEmptyState({
  title = 'No leads yet',
  description = 'Leads from your website or manual entry will appear here.',
  action,
  colSpan = 7,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 px-6 text-left">
        <div className="flex flex-col items-start max-w-md py-1">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {description}
          </p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
