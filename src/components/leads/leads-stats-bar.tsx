'use client';

import * as React from 'react';
import { Lead } from '@/lib/leads-service';
import { Users, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';

interface LeadsStatsBarProps {
  leads: Lead[];
  activeTab?: 'new' | 'converted' | 'all';
  onTabSelect?: (tab: 'new' | 'converted' | 'all') => void;
}

export function LeadsStatsBar({ leads, activeTab, onTabSelect }: LeadsStatsBarProps) {
  const totalCount = leads.length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;
  const newCount = leads.filter((l) => l.status !== 'converted').length;
  const conversionRate = totalCount > 0 ? ((convertedCount / totalCount) * 100).toFixed(1) : '0.0';

  const stats = [
    {
      id: 'all' as const,
      label: 'Total Leads',
      value: totalCount,
      subtext: 'All registered inquiries',
      icon: Users,
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgLight: 'bg-blue-500/10 border-blue-500/20',
      activeBorder: 'border-blue-500 ring-1 ring-blue-500/30',
    },
    {
      id: 'new' as const,
      label: 'New / Active',
      value: newCount,
      subtext: 'In active pipeline',
      icon: Sparkles,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-500/20',
      activeBorder: 'border-amber-500 ring-1 ring-amber-500/30',
    },
    {
      id: 'converted' as const,
      label: 'Converted Leads',
      value: convertedCount,
      subtext: 'Active paying clients',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgLight: 'bg-emerald-500/10 border-emerald-500/20',
      activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/30',
    },
    {
      id: null,
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      subtext: `${convertedCount} of ${totalCount} converted`,
      icon: TrendingUp,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgLight: 'bg-indigo-500/10 border-indigo-500/20',
      activeBorder: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        const isClickable = item.id !== null && onTabSelect !== undefined;
        const isActive = isClickable && activeTab === item.id;

        return (
          <div
            key={item.label}
            onClick={() => {
              if (isClickable && item.id) {
                if (isActive) {
                  // Second click toggles off filter back to 'all'
                  onTabSelect('all');
                } else {
                  // First click applies the filter
                  onTabSelect(item.id);
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
