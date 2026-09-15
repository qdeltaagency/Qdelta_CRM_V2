'use client';

import * as React from 'react';
import { Search } from 'lucide-react';

export function Topbar() {
  return (
    <header className="h-14 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="flex items-center w-full max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, clients, projects..."
            className="w-full h-8 pl-9 pr-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-colors"
          />
        </div>
      </div>

      {/* Right User Area */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-semibold select-none">
            SA
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
              Sai Prabhath
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Agency Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
