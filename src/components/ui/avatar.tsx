'use client';

import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'idle' | 'busy' | 'offline';
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 'md',
  status,
  className = '',
  ...props
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };

  const statusDotSizes = {
    xs: 'h-1.5 w-1.5 ring-1',
    sm: 'h-2 w-2 ring-1.5',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3 w-3 ring-2',
  };

  const statusColors = {
    online: 'bg-emerald-500 dark:bg-[#34D399]',
    idle: 'bg-amber-500 dark:bg-[#F5B74F]',
    busy: 'bg-rose-500 dark:bg-[#F87171]',
    offline: 'bg-zinc-400 dark:bg-[#71717A]',
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-zinc-200 dark:border-[#2C2C31] shadow-2xs`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-zinc-100 dark:bg-[#232327] text-zinc-900 dark:text-[#F5F5F5] font-semibold border border-zinc-200 dark:border-[#2C2C31] flex items-center justify-center font-mono select-none shadow-2xs`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white dark:ring-[#111112] ${statusColors[status]} ${statusDotSizes[size]}`}
        />
      )}
    </div>
  );
}
