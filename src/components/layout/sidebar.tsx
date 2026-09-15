'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  FolderKanban,
  CreditCard,
  FileText,
  Activity,
  Settings,
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

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between select-none">
      {/* Brand Header Link */}
      <div>
        <Link
          href="/dashboard"
          className="h-14 px-6 flex items-center gap-2.5 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
          title="Go to Dashboard"
        >
          <div className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs text-white dark:text-zinc-900 tracking-wider shrink-0 group-hover:scale-105 transition-transform">
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
        </Link>

        {/* Navigation Items */}
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
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
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
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
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
    </aside>
  );
}
