'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client, updateClientStatus } from '@/lib/clients-service';
import { useToast } from '@/components/ui/toast';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ClientsTable({
  clients,
  isLoading,
  onRefresh,
}: ClientsTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusToggle = async (client: Client) => {
    const nextStatus = client.status === 'active' ? 'inactive' : 'active';
    setUpdatingId(client.id);

    try {
      await updateClientStatus(client.id, nextStatus);
      toast({
        type: 'success',
        title: 'Status Updated',
        description: `Client marked as ${nextStatus}.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update client status.';
      toast({
        type: 'error',
        title: 'Update Error',
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatLTV = (amount: number, currency: string) => {
    if (!amount || amount === 0) return '—';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client / Company</TableHead>
            <TableHead className="text-center">Projects</TableHead>
            <TableHead className="text-center">Active Projects</TableHead>
            <TableHead>Lifetime Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Since</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-center">
                <div className="h-4 w-8 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-center">
                <div className="h-4 w-8 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-4 w-20 ml-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-6 w-24 ml-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client / Company</TableHead>
          <TableHead className="text-center">Projects</TableHead>
          <TableHead className="text-center">Active Projects</TableHead>
          <TableHead>Lifetime Value</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Since</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length === 0 ? (
          <TableEmptyState
            title="No clients found in this view"
            description="Clients matching your selected filter will appear here."
            colSpan={7}
            action={
              <Link href="/leads">
                <Button size="sm" variant="default" className="gap-1.5 cursor-pointer">
                  Go to Leads
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            }
          />
        ) : (
          clients.map((client) => {
            const isUpdating = updatingId === client.id;

            return (
              <TableRow key={client.id}>
                {/* 1. Client / Company */}
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {client.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                      {client.company && <span>{client.company}</span>}
                      {client.company && client.email && <span>•</span>}
                      {client.email && <span className="font-mono text-zinc-400">{client.email}</span>}
                    </div>
                  </div>
                </TableCell>

                {/* 2. Total Projects */}
                <TableCell className="text-center font-mono text-zinc-700 dark:text-zinc-300 text-xs">
                  {client.total_projects_count}
                </TableCell>

                {/* 3. Active Projects */}
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                    {client.active_projects_count}
                  </span>
                </TableCell>

                {/* 4. Lifetime Value */}
                <TableCell className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                  {formatLTV(client.lifetime_value, client.currency)}
                </TableCell>

                {/* 5. Status with toggle */}
                <TableCell>
                  <button
                    onClick={() => handleStatusToggle(client)}
                    disabled={isUpdating}
                    className="cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                    title="Click to toggle active / inactive"
                  >
                    <StatusBadge status={client.status} />
                  </button>
                </TableCell>

                {/* 6. Since */}
                <TableCell className="text-right text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                  {formatDate(client.created_at)}
                </TableCell>

                {/* 7. Actions: Open Dedicated Workspace */}
                <TableCell className="text-right">
                  <Link href={`/clients/${client.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1.5"
                      title="Open Dedicated Client Workspace"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
