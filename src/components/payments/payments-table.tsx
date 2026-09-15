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
import { MilestoneStepper } from '@/components/common/milestone-stepper';
import { ProjectPaymentGroup } from '@/lib/payments-service';
import { Eye, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface PaymentsTableProps {
  groups: ProjectPaymentGroup[];
  isLoading: boolean;
  onViewPayments: (group: ProjectPaymentGroup) => void;
  onRefresh: () => void;
}

export function PaymentsTable({
  groups,
  isLoading,
  onViewPayments,
  onRefresh,
}: PaymentsTableProps) {
  const formatAmount = (num?: number | null, currency = 'USD') => {
    if (!num || Number(num) === 0) return '—';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${Number(num).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Paid Amount</TableHead>
            <TableHead>Pending Amount</TableHead>
            <TableHead>Milestones</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
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
          <TableHead>Project Name</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Paid Amount</TableHead>
          <TableHead>Pending Amount</TableHead>
          <TableHead>Milestones</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.length === 0 ? (
          <TableEmptyState
            title="No project payment records"
            description="Payment milestones will appear here grouped: one row per project."
            colSpan={8}
          />
        ) : (
          groups.map((group) => {
            const hasOverdue = group.paymentState === 'overdue' || group.milestones.some((m) => m.status === 'overdue');

            return (
              <TableRow
                key={group.projectId}
                onClick={() => onViewPayments(group)}
                className="cursor-pointer"
              >
                {/* 1. Project Name */}
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[200px] block">
                      {group.projectName}
                    </span>
                    {hasOverdue && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Pending &gt; 48 hours
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 2. Client */}
                <TableCell className="text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col">
                    {group.clientId ? (
                      <Link
                        href={`/clients/${group.clientId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1"
                        title="Open Client Workspace"
                      >
                        <span>{group.clientName}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{group.clientName}</span>
                    )}
                    {group.clientCompany && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                        {group.clientCompany}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 3. Total Amount */}
                <TableCell className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                  {formatAmount(group.totalValue, group.currency)}
                </TableCell>

                {/* 4. Paid Amount */}
                <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {formatAmount(group.amountCollected, group.currency)}
                </TableCell>

                {/* 5. Pending Amount */}
                <TableCell className="font-mono text-zinc-600 dark:text-zinc-400 text-xs">
                  {formatAmount(group.remainingAmount, group.currency)}
                </TableCell>

                {/* 6. Milestones Stepper */}
                <TableCell>
                  <MilestoneStepper
                    milestones={group.milestones}
                    currency={group.currency}
                    variant="compact"
                    size="sm"
                  />
                </TableCell>

                {/* 7. Status */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={group.paymentState} />
                    {hasOverdue && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                        &gt;48h Overdue
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 8. Actions: View Payments */}
                <TableCell className="text-right">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                      onClick={() => onViewPayments(group)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Payments
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
