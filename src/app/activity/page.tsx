'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/table';
import { fetchLiveLeadActivities } from '@/lib/supabase-service';
import { LeadActivity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity as ActivityIcon } from 'lucide-react';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = React.useState<LeadActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadActivities = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveLeadActivities();
      setActivities(data || []);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Immutable audit trail of lead conversions, project stage changes, and payments."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={loadActivities}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead className="text-right">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-zinc-400">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Loading audit log...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : activities.length === 0 ? (
            <TableEmptyState
              title="No activity recorded yet"
              description="System events like lead updates, conversions, and payments will be logged here."
              colSpan={4}
            />
          ) : (
            activities.map((act) => (
              <TableRow key={act.id}>
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    <ActivityIcon className="w-3 h-3 text-zinc-400" />
                    {act.actionType || 'Action'}
                  </span>
                </TableCell>
                <TableCell className="text-zinc-700 dark:text-zinc-300">
                  <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{act.title}</p>
                  {act.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{act.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                  {act.performedBy || 'Nagireddy Sai Prabhath'}
                </TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                  {formatRelativeTime(act.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
