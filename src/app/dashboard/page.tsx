import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="High-level agency overview and operational health."
        action={
          <Link href="/leads">
            <Button size="sm" variant="default">
              <Plus className="w-3.5 h-3.5" />
              New Lead
            </Button>
          </Link>
        }
      />

      {/* Metrics Row (Subtle, Clean Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Active Leads
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            0
          </p>
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Active Clients
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            0
          </p>
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Ongoing Projects
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            0
          </p>
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Pending Milestones
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            0
          </p>
        </div>
      </div>

      {/* Recent Activity / Pipeline Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
            Recent Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          >
            View all
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Domain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmptyState
              title="No projects currently active"
              description="Converted leads and newly created projects will appear here."
              colSpan={5}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
