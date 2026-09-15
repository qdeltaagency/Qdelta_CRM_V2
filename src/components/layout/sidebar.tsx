'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/components/layout/sidebar-context';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  FolderKanban,
  CreditCard,
  FileText,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: UserCheck },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Close mobile nav on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  return (
    <>
      {/* 1. Desktop Animated Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex shrink-0 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col justify-between select-none z-30 overflow-hidden"
      >
        {/* Brand Header */}
        <div>
          <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
              <div className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs text-white dark:text-zinc-900 tracking-wider shrink-0">
                QD
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col truncate"
                >
                  <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                    Q Delta
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                    Internal CRM
                  </span>
                </motion.div>
              )}
            </Link>

            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className={`px-2.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              {!isCollapsed && (
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  Agency Active
                </span>
              )}
            </div>
            {!isCollapsed && <span className="text-[10px] text-zinc-400 font-mono">v2.0</span>}
          </div>
        </div>
      </motion.aside>

      {/* 2. Mobile Animated Drawer Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Mobile Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative w-64 h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between z-10 will-change-transform"
            >
              <div>
                <div className="h-14 px-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs text-white dark:text-zinc-900 tracking-wider">
                      QD
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                        Q Delta
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                        Internal CRM
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="p-3 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      Agency Active
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">v2.0</span>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
