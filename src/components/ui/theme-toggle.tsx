'use client';

import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all duration-200 cursor-pointer group shadow-xs ${className}`}
      aria-label={mounted ? `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
      title={mounted ? `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode` : 'Toggle theme'}
      suppressHydrationWarning
    >
      <div className="relative h-4 w-4 overflow-hidden flex items-center justify-center">
        {mounted ? (
          resolvedTheme === 'dark' ? (
            <SunIcon className="h-4 w-4 text-amber-400 transform transition-transform duration-300 hover:rotate-45" />
          ) : (
            <MoonIcon className="h-4 w-4 text-indigo-500 transform transition-transform duration-300 hover:-rotate-12" />
          )
        ) : (
          <span className="h-4 w-4 block" />
        )}
      </div>
    </button>
  );
}
