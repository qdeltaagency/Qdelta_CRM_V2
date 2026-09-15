'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PaymentsTable } from '@/components/payments/payments-table';
import { PaymentDetailsSheet } from '@/components/payments/payment-details-sheet';
import { ActivitySheet } from '@/components/common/activity-sheet';
import {
  ProjectPaymentGroup,
  PaymentSummaryMetrics,
  getProjectPaymentGroups,
} from '@/lib/payments-service';
import { useToast } from '@/components/ui/toast';
import { RefreshCw, DollarSign, Clock, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

type PaymentFilterTab = 'all' | 'ready' | 'awaiting' | 'overdue' | 'paid';

export default function PaymentsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = React.useState<ProjectPaymentGroup[]>([]);
  const [summary, setSummary] = React.useState<PaymentSummaryMetrics>({
    readyToCollect: 0,
    awaitingPayment: 0,
    overdueCount: 0,
    overdueAmount: 0,
    collectedThisMonth: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<PaymentFilterTab>('all');
  const [selectedGroup, setSelectedGroup] = React.useState<ProjectPaymentGroup | null>(null);
  const [activityProject, setActivityProject] = React.useState<{ id: string | null; name: string } | null>(null);

  const loadData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const { groups: fetchedGroups, summary: fetchedSummary } =
        await getProjectPaymentGroups();
      setGroups(fetchedGroups);
      setSummary(fetchedSummary);

      setSelectedGroup((prev) => {
        if (!prev) return null;
        return fetchedGroups.find((g) => g.projectId === prev.projectId) || null;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not fetch payments data.';
      toast({
        type: 'error',
        title: 'Error loading payments',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Filter groups according to activeTab
  const filteredGroups = React.useMemo(() => {
    if (activeTab === 'all') return groups;
    if (activeTab === 'ready') {
      return groups.filter(
        (g) => g.paymentState === 'ready_to_collect' || g.milestones.some((m) => m.status === 'ready')
      );
    }
    if (activeTab === 'awaiting') {
      return groups.filter(
        (g) =>
          g.paymentState === 'awaiting_payment' ||
          g.milestones.some((m) => m.status === 'pending' || m.status === 'link_generated')
      );
    }
    if (activeTab === 'overdue') {
      return groups.filter(
        (g) => g.paymentState === 'overdue' || g.milestones.some((m) => m.status === 'overdue')
      );
    }
    if (activeTab === 'paid') {
      return groups.filter((g) => g.paymentState === 'all_paid');
    }
    return groups;
  }, [groups, activeTab]);

  const formatAmount = (num: number) => {
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments & Milestones"
        description="Fixed 30% / 35% / 35% milestone tracking, payment links, and settlement actions."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
              onClick={() => setActivityProject({ id: null, name: 'All Payments' })}
              title="Open Global Activity Log"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Activity Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isLoading}
              title="Refresh payments list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        }
      />

      {/* Top Financial Attention Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab(activeTab === 'ready' ? 'all' : 'ready')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'ready'
              ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-500/10 dark:bg-blue-950/30 shadow-xs'
              : 'border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ready to Collect
            </span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300 mt-1 block">
            {formatAmount(summary.readyToCollect)}
          </span>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'awaiting' ? 'all' : 'awaiting')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'awaiting'
              ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 shadow-xs'
              : 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Awaiting Payment
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300 mt-1 block">
            {formatAmount(summary.awaitingPayment)}
          </span>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-red-500 ring-1 ring-red-500/30 bg-red-500/10 dark:bg-red-950/30 shadow-xs'
              : summary.overdueCount > 0
              ? 'border-red-500/30 bg-red-500/5 dark:bg-red-950/20 hover:border-red-500/50'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${
              summary.overdueCount > 0 || activeTab === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'
            }`}>
              Pending &gt; 48h
            </span>
            <AlertCircle className={`w-4 h-4 ${summary.overdueCount > 0 || activeTab === 'overdue' ? 'text-red-500' : 'text-zinc-400'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-lg font-bold font-mono ${
              summary.overdueCount > 0 || activeTab === 'overdue' ? 'text-red-700 dark:text-red-300' : 'text-zinc-900 dark:text-zinc-100'
            }`}>
              {formatAmount(summary.overdueAmount)}
            </span>
            {summary.overdueCount > 0 && (
              <span className="text-[11px] text-red-600 dark:text-red-400 font-mono">
                ({summary.overdueCount} item{summary.overdueCount > 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'paid' ? 'all' : 'paid')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'paid'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-xs'
              : 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Collected This Month
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 block">
            {formatAmount(summary.collectedThisMonth)}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2 text-xs">
        {[
          { key: 'all', label: 'All Projects' },
          { key: 'ready', label: 'Ready' },
          { key: 'awaiting', label: 'Awaiting' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'paid', label: '100% Paid' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'all') {
                setActiveTab('all');
              } else {
                setActiveTab(activeTab === tab.key ? 'all' : (tab.key as PaymentFilterTab));
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped Payments Table (ONE ROW PER PROJECT) */}
      <PaymentsTable
        groups={filteredGroups}
        isLoading={isLoading}
        onViewPayments={(g) => setSelectedGroup(g)}
        onRefresh={() => loadData(false)}
      />

      {/* Payment Details Right-Side Sidebar Drawer */}
      <PaymentDetailsSheet
        isOpen={Boolean(selectedGroup)}
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onOpenActivity={(pId, pName) => setActivityProject({ id: pId, name: pName })}
        onRefresh={() => loadData(false)}
      />

      {/* Activity Sheet */}
      <ActivitySheet
        isOpen={Boolean(activityProject)}
        onClose={() => setActivityProject(null)}
        entityId={activityProject?.id || null}
        entityType="project"
        entityName={activityProject?.name}
      />
    </div>
  );
}
