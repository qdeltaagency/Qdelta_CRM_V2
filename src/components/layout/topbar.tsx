'use client';

import * as React from 'react';
import { useSidebar } from '@/components/layout/sidebar-context';
import { Search, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Topbar() {
  const { isCollapsed, toggleCollapsed, toggleMobileOpen } = useSidebar();

  return (
    <header className="h-14 px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area: Toggle & Search */}
      <div className="flex items-center gap-3 w-full max-w-md">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileOpen}
          className="md:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, clients, projects... (Ctrl+K)"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Right User Area */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-semibold select-none shadow-2xs">
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
