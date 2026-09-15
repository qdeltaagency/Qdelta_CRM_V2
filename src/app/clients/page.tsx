'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ClientsStatsBar } from '@/components/clients/clients-stats-bar';
import { ClientsTable } from '@/components/clients/clients-table';
import { ActivitySheet } from '@/components/common/activity-sheet';
import { Client, getClients } from '@/lib/clients-service';
import { useToast } from '@/components/ui/toast';
import { RefreshCw, ArrowRight, Activity, Search } from 'lucide-react';

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActivityOpen, setIsActivityOpen] = React.useState(false);

  // Search and status filter
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not fetch clients from database.';
      toast({
        type: 'error',
        title: 'Error loading clients',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Counts for status tabs
  const activeCount = React.useMemo(() => clients.filter((c) => c.status === 'active').length, [clients]);
  const inactiveCount = React.useMemo(() => clients.filter((c) => c.status === 'inactive').length, [clients]);
  const totalCount = clients.length;

  // Filtered clients list
  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      // Status filter
      if (statusFilter === 'active' && client.status !== 'active') return false;
      if (statusFilter === 'inactive' && client.status !== 'inactive') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesCompany = (client.company || '').toLowerCase().includes(query);
        const matchesEmail = (client.email || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [clients, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Client Portfolios"
        description="Active client directory, unified multi-project containers, and cumulative revenue tracking."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
              onClick={() => setIsActivityOpen(true)}
              title="Open Global Activity Log"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Activity Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadClients}
              disabled={isLoading}
              title="Refresh clients list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Link href="/leads">
              <Button size="sm" variant="outline" className="gap-1.5">
                Go to Leads
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Summary Cards */}
      <ClientsStatsBar
        clients={clients}
        activeStatusFilter={statusFilter}
        onStatusFilterChange={(status) => setStatusFilter(status)}
      />

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start text-xs font-medium">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>All Clients</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'all'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Active</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Inactive</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'inactive'
                  ? 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Main Clients Table */}
      <ClientsTable
        clients={filteredClients}
        isLoading={isLoading}
        onRefresh={loadClients}
      />

      {/* Activity Sheet */}
      <ActivitySheet
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        entityId={null}
        entityType="client"
        entityName="All Clients"
      />
    </div>
  );
}

