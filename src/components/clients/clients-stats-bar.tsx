'use client';

import * as React from 'react';
import { Client } from '@/lib/clients-service';
import { Users, UserCheck, DollarSign, Activity } from 'lucide-react';

interface ClientsStatsBarProps {
  clients: Client[];
  activeStatusFilter?: 'all' | 'active' | 'inactive';
  onStatusFilterChange?: (status: 'all' | 'active' | 'inactive') => void;
}

export function ClientsStatsBar({
  clients,
  activeStatusFilter,
  onStatusFilterChange,
}: ClientsStatsBarProps) {
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;

  // Compute Total Revenue (LTV) across all clients
  const totalLTV = clients.reduce((acc, c) => acc + (Number(c.lifetime_value) || 0), 0);

  // Compute Active Project Value (agreed value of projects with stage !== 'completed')
  const activeProjectValue = clients.reduce((acc, c) => {
    const activeProjects = (c.projects || []).filter((p) => p.stage !== 'completed');
    const clientActiveVal = activeProjects.reduce(
      (pAcc, p) => pAcc + (Number(p.agreed_value) || 0),
      0
    );
    return acc + clientActiveVal;
  }, 0);

  const stats = [
    {
      id: 'all' as const,
      label: 'Total Clients',
      value: totalClients,
      subtext: 'Unique agency client accounts',
      icon: Users,
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgLight: 'bg-blue-500/10 border-blue-500/20',
      activeBorder: 'border-blue-500 ring-1 ring-blue-500/30',
    },
    {
      id: 'active' as const,
      label: 'Active Clients',
      value: activeClients,
      subtext: `${((activeClients / (totalClients || 1)) * 100).toFixed(0)}% retention rate`,
      icon: UserCheck,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgLight: 'bg-emerald-500/10 border-emerald-500/20',
      activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/30',
    },
    {
      id: null,
      label: 'Total Revenue (LTV)',
      value: `$${totalLTV.toLocaleString()}`,
      subtext: 'Cumulative lifetime contracts',
      icon: DollarSign,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgLight: 'bg-indigo-500/10 border-indigo-500/20',
      activeBorder: '',
    },
    {
      id: null,
      label: 'Active Project Value',
      value: `$${activeProjectValue.toLocaleString()}`,
      subtext: 'In-flight delivery pipeline',
      icon: Activity,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-500/20',
      activeBorder: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        const isClickable = item.id !== null && onStatusFilterChange !== undefined;
        const isActive = isClickable && activeStatusFilter === item.id;

        return (
          <div
            key={item.label}
            onClick={() => {
              if (isClickable && item.id) {
                if (isActive) {
                  // Second click toggles off filter back to 'all'
                  onStatusFilterChange('all');
                } else {
                  // First click applies the filter
                  onStatusFilterChange(item.id);
                }
              }
            }}
            className={`p-3.5 rounded-xl border bg-white dark:bg-zinc-900/70 backdrop-blur-xs transition-all duration-150 ${
              isActive
                ? `${item.activeBorder} shadow-xs`
                : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            } ${isClickable ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${item.bgLight}`}>
                <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {item.value}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
              {item.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
