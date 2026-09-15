'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sheet } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CRMSelect } from '@/components/ui/crm-select';
import {
  ProjectItem,
  ProjectStage,
  PROJECT_STAGES,
  updateProjectStage,
} from '@/lib/projects-service';
import {
  generateMilestonePaymentLink,
  markMilestoneAsSent,
  markMilestoneAsPaid,
  PaymentMilestone,
} from '@/lib/payments-service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import {
  Activity,
  Calendar,
  DollarSign,
  Globe,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Link as LinkIcon,
  Copy,
  Send,
  Check,
} from 'lucide-react';

interface ProjectDetailsSheetProps {
  isOpen: boolean;
  project: ProjectItem | null;
  onClose: () => void;
  onOpenActivity: (projectId: string, projectName: string) => void;
  onRefresh: () => void;
}

export function ProjectDetailsSheet({
  isOpen,
  project,
  onClose,
  onOpenActivity,
  onRefresh,
}: ProjectDetailsSheetProps) {
  const { toast } = useToast();
  const [isUpdatingStage, setIsUpdatingStage] = React.useState(false);
  const [isUpdatingDomain, setIsUpdatingDomain] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  if (!project) return null;

  const client = project.clients;
  const milestones = project.payment_milestones || [];
  const currencySymbol =
    project.currency === 'INR' ? '₹' : project.currency === 'EUR' ? '€' : project.currency === 'GBP' ? '£' : '$';

  const formatAmount = (num?: number | null) => {
    if (!num || Number(num) === 0) return '—';
    return `${currencySymbol}${Number(num).toLocaleString()}`;
  };

  const copyToClipboard = (text: string) => {
    const fullUrl = text.startsWith('http') ? text : `${window.location.origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      type: 'info',
      title: 'Link Copied',
      description: 'Payment link copied to clipboard.',
    });
  };

  const handleGenerateLink = async (milestone: any) => {
    setActionLoadingId(milestone.id);
    try {
      const link = await generateMilestonePaymentLink(
        milestone.id,
        project.name,
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

  const handleMarkAsSent = async (milestoneId: string) => {
    setActionLoadingId(milestoneId);
    try {
      await markMilestoneAsSent(milestoneId);
      toast({
        type: 'success',
        title: 'Marked as Sent',
        description: 'Milestone is now marked as sent to client.',
      });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark as sent.';
      toast({
        type: 'error',
        title: 'Action Error',
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAsPaid = async (milestone: any) => {
    setActionLoadingId(milestone.id);
    try {
      await markMilestoneAsPaid({
        ...milestone,
        project_id: project.id,
        projects: {
          id: project.id,
          name: project.name,
          stage: project.stage,
          client_id: project.client_id,
          lead_id: project.lead_id,
          clients: project.clients,
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

  const handleStageChange = async (newStage: ProjectStage) => {
    if (project.stage === newStage) return;
    setIsUpdatingStage(true);
    try {
      await updateProjectStage(project, newStage);
      toast({
        type: 'success',
        title: 'Stage Updated',
        description: `Project moved to "${newStage}".`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stage.';
      toast({
        type: 'error',
        title: 'Stage Transition Blocked',
        description: msg,
      });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleDomainStatusChange = async (newStatus: string) => {
    if (!supabase) return;
    setIsUpdatingDomain(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ domain_status: newStatus })
        .eq('id', project.id);

      if (error) throw error;
      toast({
        type: 'success',
        title: 'Domain Status Updated',
        description: `Domain status changed to "${newStatus}".`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update domain status.';
      toast({
        type: 'error',
        title: 'Update Error',
        description: msg,
      });
    } finally {
      setIsUpdatingDomain(false);
    }
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

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center justify-between gap-4 w-full pr-6">
          <div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 block">
              {project.name}
            </span>
            <span className="text-xs text-zinc-500 font-normal">
              Client:{' '}
              {project.client_id ? (
                <Link
                  href={`/clients/${project.client_id}`}
                  className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline inline-flex items-center gap-1"
                  title="Open Client Workspace"
                >
                  <span>{client?.name || 'Client'}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </Link>
              ) : (
                <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{client?.name || 'Direct'}</strong>
              )}
              {client?.company ? ` (${client.company})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
              onClick={() => onOpenActivity(project.id, project.name)}
              title="View Project Activity Log"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Activity Log
            </Button>
          </div>
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Drawer
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Stage & Gating Selector */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Project Stage:</span>
            <StatusBadge status={project.stage} />
          </div>

          <div className="w-44">
            <CRMSelect
              value={project.stage}
              disabled={isUpdatingStage}
              size="xs"
              align="right"
              options={PROJECT_STAGES.map((s) => ({ value: s.value, label: s.label }))}
              onChange={(newStage) => handleStageChange(newStage as ProjectStage)}
            />
          </div>
        </div>

        {/* 1. Project Details & Commercial Metrics */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Project Overview
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block">
                Service
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block truncate">
                {project.service_type || 'Custom Service'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Agreed Value
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                {formatAmount(project.agreed_value)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block">
                Timeline
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {project.timeline || '—'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block">
                Created Date
              </span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 mt-0.5 block">
                {formatDate(project.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Requirements */}
        {project.requirements && (
          <div className="space-y-1">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Requirements & Scope
            </h4>
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {project.requirements}
            </div>
          </div>
        )}

        {/* 3. Domain Status */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Domain Verification Status
          </h4>
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>
                Domain:{' '}
                <strong className="capitalize font-medium text-zinc-900 dark:text-zinc-100">
                  {project.domain_status || 'Pending Verification'}
                </strong>
              </span>
            </div>

            <div className="w-40">
              <CRMSelect
                value={project.domain_status || 'pending'}
                disabled={isUpdatingDomain}
                size="xs"
                align="right"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'dns_configured', label: 'DNS Configured' },
                  { value: 'ssl_issued', label: 'SSL Issued' },
                  { value: 'active', label: 'Live / Active' },
                ]}
                onChange={(newStatus) => handleDomainStatusChange(newStatus)}
              />
            </div>
          </div>
        </div>

        {/* 4. Documents */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Documents & Legal Assets
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                Client Agreement
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Signed
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                Terms & Conditions
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Accepted
              </span>
            </div>
          </div>
        </div>

        {/* 5. Payments (Milestones) */}
        <div className="space-y-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
              Payment Milestones
            </h4>
            <span className="text-[11px] font-mono text-zinc-400">
              30% / 35% / 35% Model
            </span>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((stepNum) => {
              const m = milestones.find((item) => item.milestone_number === stepNum) || {
                id: `ms-${stepNum}`,
                milestone_number: stepNum,
                percentage: stepNum === 1 ? 30 : 35,
                amount: Math.round(((project.agreed_value || 0) * (stepNum === 1 ? 0.3 : 0.35))),
                status: stepNum === 1 ? 'ready' : 'locked',
                payment_link: null,
                paid_at: null,
                unlocked_at: null,
                requested_at: null,
              };

              const isPaid = m.status === 'paid';
              const isReady = m.status === 'ready';
              const isLocked = m.status === 'locked';
              const isPending = m.status === 'pending' || m.status === 'link_generated';
              const isActing = actionLoadingId === m.id;

              const title =
                stepNum === 1
                  ? 'Initial (30%)'
                  : stepNum === 2
                  ? 'Mid Review (35%)'
                  : 'Final Delivery (35%)';

              const lockReason =
                stepNum === 2
                  ? 'Locked until project stage reaches "Client Review"'
                  : 'Locked until project stage reaches "Ready For Delivery"';

              return (
                <div
                  key={m.id || stepNum}
                  className={`p-3.5 rounded-xl border text-xs transition-all duration-200 hover:shadow-xs ${
                    isPaid
                      ? 'border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/15'
                      : isReady
                      ? 'border-blue-500/25 bg-blue-500/5 dark:bg-blue-950/15'
                      : isPending
                      ? 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatAmount(m.amount)}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          • {m.percentage || (stepNum === 1 ? 30 : 35)}% of total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                    </div>
                  </div>

                  {/* Payment Link Section (if link enabled / generated) */}
                  {m.payment_link && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-medium">
                          <LinkIcon className="w-3 h-3 text-indigo-500" />
                          Payment Link
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate select-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}${m.payment_link}` : m.payment_link}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1 cursor-pointer shrink-0"
                          onClick={() => copyToClipboard(m.payment_link!)}
                          title="Copy Payment Link"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </Button>
                        <a
                          href={m.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] gap-1"
                          title="Open Payment Link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Metadata & Actions Bar */}
                  <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-wrap items-center justify-between gap-2">
                    {isPaid ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Paid on {formatDate(m.paid_at)}</span>
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>{lockReason}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between">
                        <span className="text-[11px] text-zinc-500">
                          {m.status === 'ready'
                            ? 'Milestone unlocked & ready'
                            : m.status === 'link_generated'
                            ? 'Link generated, ready to send'
                            : 'Awaiting client settlement'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {m.status === 'ready' && !m.payment_link && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                              isLoading={isActing}
                              onClick={() => handleGenerateLink(m)}
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>Generate Link</span>
                            </Button>
                          )}
                          {m.status === 'link_generated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                              isLoading={isActing}
                              onClick={() => handleMarkAsSent(m.id)}
                            >
                              <Send className="w-3 h-3 text-indigo-500" />
                              <span>Mark Sent</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={m.status === 'ready' ? 'outline' : 'default'}
                            className="h-7 px-2.5 text-xs gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                            isLoading={isActing}
                            onClick={() => handleMarkAsPaid(m)}
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
