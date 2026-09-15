'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-[10px] border border-zinc-200 dark:border-[#2C2C31] bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-[#F5F5F5] shadow-xs ${
        hover ? 'hover:border-zinc-300 dark:hover:border-[#3F3F46] transition-colors duration-150' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 md:p-5 border-b border-zinc-200 dark:border-[#2C2C31] flex items-center justify-between gap-4 ${className}`}
    >
      <div>
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-[#F5F5F5] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-[#71717A] mt-0.5 font-normal">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 md:p-5 border-t border-zinc-200 dark:border-[#2C2C31] bg-zinc-50/80 dark:bg-[#171719] flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}
