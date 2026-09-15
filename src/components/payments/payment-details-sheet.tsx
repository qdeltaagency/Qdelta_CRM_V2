'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sheet } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ProjectPaymentGroup,
  PaymentMilestone,
  generateMilestonePaymentLink,
  markMilestoneAsSent,
  markMilestoneAsPaid,
  isMilestoneOverdue,
} from '@/lib/payments-service';
import { useToast } from '@/components/ui/toast';
import {
  Link as LinkIcon,
  Copy,
  Send,
  CheckCircle2,
  Lock,
  Check,
  Receipt,
  AlertCircle,
  Activity,
  ExternalLink,
} from 'lucide-react';

interface PaymentDetailsSheetProps {
  isOpen: boolean;
  group: ProjectPaymentGroup | null;
  onClose: () => void;
  onOpenActivity?: (projectId: string, projectName: string) => void;
  onRefresh: () => void;
}

export function PaymentDetailsSheet({
  isOpen,
  group,
  onClose,
  onOpenActivity,
  onRefresh,
}: PaymentDetailsSheetProps) {
  const { toast } = useToast();
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  if (!group) return null;

  const currencySymbol =
    group.currency === 'INR' ? '₹' : group.currency === 'EUR' ? '€' : group.currency === 'GBP' ? '£' : '$';

  const formatAmount = (num?: number | null) => {
    if (!num || Number(num) === 0) return '—';
    return `${currencySymbol}${Number(num).toLocaleString()}`;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
    toast({
      type: 'info',
      title: 'Link Copied',
      description: 'Payment link copied to clipboard.',
    });
  };

  const handleGenerateLink = async (milestone: PaymentMilestone) => {
    if (milestone.status !== 'ready') {
      toast({
        type: 'error',
        title: 'Action Not Allowed',
        description: 'Payment link can only be generated for ready milestones.',
      });
      return;
    }

    setActionLoadingId(milestone.id);
    try {
      const link = await generateMilestonePaymentLink(
        milestone.id,
        group.projectName,
        milestone.milestone_number
      );
      toast({
        type: 'success',
        title: 'Payment Link Generated',
        description: `Link: ${link}`,
      });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate link.';
      toast({
        type: 'error',
        title: 'Action Error',
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAsSent = async (milestone: PaymentMilestone) => {
    if (milestone.status !== 'link_generated') {
      toast({
        type: 'error',
        title: 'Action Not Allowed',
        description: 'Link must be generated before marking as sent.',
      });
      return;
    }

    setActionLoadingId(milestone.id);
    try {
      await markMilestoneAsSent(milestone.id);
      toast({
        type: 'success',
        title: 'Marked as Sent',
        description: `Milestone #${milestone.milestone_number} is now awaiting client payment.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update milestone.';
      toast({
        type: 'error',
        title: 'Action Error',
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAsPaid = async (milestone: PaymentMilestone) => {
    if (milestone.status === 'locked') {
      toast({
        type: 'error',
        title: 'Milestone Locked',
        description: 'Cannot pay a locked milestone.',
      });
      return;
    }

    setActionLoadingId(milestone.id);
    try {
      await markMilestoneAsPaid({
        ...milestone,
        projects: {
          id: group.projectId,
          name: group.projectName,
          stage: group.projectStage,
          client_id: group.clientId,
          lead_id: group.leadId,
          clients: {
            id: group.clientId || '',
            name: group.clientName,
            company: group.clientCompany,
            lead_id: group.leadId,
          },
        },
      });
      toast({
        type: 'success',
        title: 'Milestone Paid',
        description: `Milestone #${milestone.milestone_number} (${milestone.percentage}%) marked as paid.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark as paid.';
      toast({
        type: 'error',
        title: 'Action Error',
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const milestones = group.milestones;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center justify-between gap-3 w-full pr-6">
          <div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 block">
              {group.projectName}
            </span>
            <span className="text-xs text-zinc-500 font-normal">
              Client:{' '}
              {group.clientId ? (
                <Link
                  href={`/clients/${group.clientId}`}
                  className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline inline-flex items-center gap-1"
                  title="Open Client Workspace"
                >
                  <span>{group.clientName}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </Link>
              ) : (
                <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{group.clientName}</strong>
              )}
              {group.clientCompany ? ` (${group.clientCompany})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenActivity && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
                onClick={() => onOpenActivity(group.projectId, group.projectName)}
                title="View Payment Activity Log"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Activity Log
              </Button>
            )}
            <StatusBadge status={group.paymentState} />
          </div>
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Sidebar
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Commercial Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block">
              Total Amount
            </span>
            <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">
              {formatAmount(group.totalValue)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Paid Amount
            </span>
            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {formatAmount(group.amountCollected)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block">
              Pending Amount
            </span>
            <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">
              {formatAmount(group.remainingAmount)}
            </span>
          </div>
        </div>

        {/* Body: Vertical 3 Milestones Breakdown */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Milestones Breakdown (30% / 35% / 35%)
          </h4>

          {milestones.map((m) => {
            const isActing = actionLoadingId === m.id;
            const isOverdue = isMilestoneOverdue(m) || m.status === 'overdue';

            const milestoneTitle =
              m.milestone_number === 1
                ? 'Initial (30%)'
                : m.milestone_number === 2
                ? 'Mid Review (35%)'
                : 'Final Delivery (35%)';

            const lockReason =
              m.milestone_number === 2
                ? 'Locked until project stage reaches "Client Review".'
                : m.milestone_number === 3
                ? 'Locked until project stage reaches "Ready For Delivery".'
                : 'Locked until previous prerequisites are satisfied.';

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border text-xs transition-colors ${
                  m.status === 'paid'
                    ? 'border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/15'
                    : isOverdue
                    ? 'border-red-500/30 bg-red-500/5 dark:bg-red-950/20'
                    : m.status === 'pending' || m.status === 'link_generated'
                    ? 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/15'
                    : m.status === 'ready'
                    ? 'border-blue-500/25 bg-blue-500/5 dark:bg-blue-950/15'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 opacity-75'
                }`}
              >
                {/* Milestone Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {milestoneTitle}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      Amount: <strong>{formatAmount(m.amount)}</strong> ({m.percentage}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isOverdue && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                        Pending &gt; 48h
                      </span>
                    )}
                    <StatusBadge status={m.status} />
                  </div>
                </div>

                {/* Metadata & Timestamps */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {m.payment_link && (
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-zinc-400 text-[10px]">Payment Link:</span>
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[220px]">
                        {m.payment_link}
                      </span>
                    </div>
                  )}

                  {m.paid_at ? (
                    <div className="col-span-2 flex items-center justify-between pt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Paid At: {formatDate(m.paid_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-zinc-400 text-[10px]">
                        <Receipt className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Unlocked At:</span>
                        <span>{m.unlocked_at ? formatDate(m.unlocked_at) : '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Requested At:</span>
                        <span>{formatDate(m.requested_at)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* State Actions */}
                <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  {/* Status: locked */}
                  {m.status === 'locked' && (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>{lockReason}</span>
                    </div>
                  )}

                  {/* Status: ready */}
                  {m.status === 'ready' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full h-8 text-xs gap-1.5 cursor-pointer"
                      isLoading={isActing}
                      onClick={() => handleGenerateLink(m)}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Generate Payment Link
                    </Button>
                  )}

                  {/* Status: link_generated */}
                  {m.status === 'link_generated' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 p-1.5 px-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate flex-1">
                          {m.payment_link}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                          onClick={() => copyToClipboard(m.payment_link!)}
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800/60 dark:hover:bg-purple-950/30 cursor-pointer"
                        isLoading={isActing}
                        onClick={() => handleMarkAsSent(m)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Mark Link as Sent to Client
                      </Button>
                    </div>
                  )}

                  {/* Status: pending / overdue */}
                  {(m.status === 'pending' || isOverdue) && (
                    <div className="space-y-2">
                      {isOverdue && (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pending &gt; 48 hours since request.</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {m.payment_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                            onClick={() => copyToClipboard(m.payment_link!)}
                          >
                            <Copy className="w-3 h-3" />
                            Copy Link
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-2xs cursor-pointer"
                          isLoading={isActing}
                          onClick={() => handleMarkAsPaid(m)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Paid
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status: paid */}
                  {m.status === 'paid' && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Settled & Confirmed
                      </span>
                      <span className="inline-flex items-center gap-1 text-zinc-400 font-mono">
                        #REC-{m.id.substring(0, 6).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
