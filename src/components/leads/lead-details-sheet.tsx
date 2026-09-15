'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sheet } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CRMSelect } from '@/components/ui/crm-select';
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_OPTIONS,
  updateLeadStatus,
  convertLeadToClient,
  generateLeadPaymentLink,
} from '@/lib/leads-service';
import { SendPaymentEmailModal } from '@/components/leads/send-payment-email-modal';
import { OfflinePaymentModal } from '@/components/leads/offline-payment-modal';
import { useToast } from '@/components/ui/toast';
import {
  Activity,
  Edit2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  Tag,
  UserCheck,
  ArrowRight,
  CreditCard,
  Link as LinkIcon,
  Copy,
  Send,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface LeadDetailsSheetProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onOpenActivity: (leadId: string, leadName: string) => void;
  onRefresh: () => void;
}

export function LeadDetailsSheet({
  isOpen,
  lead,
  onClose,
  onEdit,
  onOpenActivity,
  onRefresh,
}: LeadDetailsSheetProps) {
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);

  // Modal States
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = React.useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  if (!lead) return null;

  const budgetVal = Number(lead.agreed_project_value || lead.estimated_budget) || 0;
  const depositVal = Math.round(budgetVal * 0.3);
  const currencySymbol =
    lead.currency === 'INR' ? '₹' : lead.currency === 'EUR' ? '€' : lead.currency === 'GBP' ? '£' : '$';

  const isConverted = lead.status === 'converted';
  const isAwaitingPayment = lead.status === 'won_awaiting_payment';

  // Find existing draft project & milestone 1
  const prospectProject = lead.projects?.[0];
  const milestone1 = prospectProject?.payment_milestones?.find((m) => m.milestone_number === 1);
  const existingPaymentLink = milestone1?.payment_link;
  const milestone1Id = milestone1?.id || '';

  const convertedClientObj = Array.isArray(lead.converted_client)
    ? lead.converted_client[0]
    : lead.converted_client;

  const targetClientId =
    lead.existing_client_id ||
    convertedClientObj?.id ||
    lead.projects?.find((p) => p.client_id)?.client_id ||
    null;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (lead.status === newStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateLeadStatus(lead.id, newStatus, lead.name, lead.status);
      toast({
        type: 'success',
        title: 'Status Updated',
        description: `Lead status changed to "${newStatus}".`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      toast({
        type: 'error',
        title: 'Update Error',
        description: msg,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await generateLeadPaymentLink(lead.id);
      toast({
        type: 'success',
        title: 'Payment Link Generated',
        description: `Unique checkout link ready for ${lead.name}.`,
      });
      onRefresh();
      setIsSendEmailModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate link.';
      toast({
        type: 'error',
        title: 'Link Generation Error',
        description: msg,
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyPaymentLink = (link: string) => {
    const fullUrl = link.startsWith('http') ? link : `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    toast({
      type: 'info',
      title: 'Link Copied',
      description: 'Payment link copied to clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        width="lg"
        title={
          <div className="flex items-center justify-between gap-4 w-full pr-6">
            <div>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 block">
                {lead.name}
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                {lead.company ? `${lead.company} • ` : ''}Added {formatDate(lead.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
                onClick={() => onOpenActivity(lead.id, lead.name)}
                title="View Lead Activity Log"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Activity Log
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs cursor-pointer"
                onClick={() => {
                  onClose();
                  onEdit(lead);
                }}
                title="Edit Lead"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            {isConverted ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Client Onboarded
                </span>
                {targetClientId && (
                  <Link href={`/clients/${targetClientId}`}>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 px-2.5 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      title="Open Client Workspace"
                    >
                      <span>Client Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ) : isAwaitingPayment ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 border-zinc-300 dark:border-zinc-700"
                onClick={() => setIsOfflineModalOpen(true)}
                title="Upload invoice/receipt to verify offline payment and convert"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Offline Convert
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="h-8 px-3 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                onClick={() => handleStatusChange('won_awaiting_payment')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mark Won & Request Payment
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Close Drawer
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* 1. Status Switcher Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Pipeline Stage:</span>
              <StatusBadge status={lead.status} />
            </div>

            {!isConverted && (
              <div className="w-48">
                <CRMSelect
                  value={lead.status}
                  disabled={isUpdatingStatus}
                  size="xs"
                  align="right"
                  options={LEAD_STATUS_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  onChange={(newVal) => handleStatusChange(newVal as LeadStatus)}
                />
              </div>
            )}
          </div>

          {/* 2. PAYMENT & CONVERSION FLOW SECTION */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                Lead Settlement & Conversion Flow
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                Initial Milestone (30%)
              </span>
            </div>

            {/* Deposit & Terms Snapshot */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Required Deposit (30%)
                </span>
                <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 block mt-0.5">
                  {currencySymbol}{depositVal.toLocaleString()} {lead.currency || 'USD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Total Project Value
                </span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 block mt-0.5">
                  {currencySymbol}{budgetVal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* State-specific UI and Actions */}
            {isConverted ? (
              <div className="p-3.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Successfully Converted & Active
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Project Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  This lead has been converted into an active client container with a delivery project and 3 payment milestones locked into the sprint schedule.
                </p>
              </div>
            ) : isAwaitingPayment ? (
              <div className="space-y-3">
                {existingPaymentLink ? (
                  <div className="p-3.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Active Payment Link
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {milestone1?.status || 'Awaiting Payment'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate select-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}${existingPaymentLink}` : existingPaymentLink}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] gap-1 cursor-pointer shrink-0"
                        onClick={() => copyPaymentLink(existingPaymentLink)}
                        title="Copy link"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </Button>
                      <a
                        href={existingPaymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]"
                        title="Open payment checkout"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        onClick={() => setIsSendEmailModalOpen(true)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send via Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Awaiting Deposit Settlement
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                        Initial (30%)
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Generate an online payment link to email to the lead, or use offline convert below to record payment proof.
                    </p>

                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        isLoading={isGeneratingLink}
                        onClick={handleGeneratePaymentLink}
                        className="w-full h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-medium shadow-sm shadow-indigo-600/20"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Generate Payment Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block">
                    Qualification Phase
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Lead is in negotiation / qualification pipeline
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 cursor-pointer"
                  onClick={() => handleStatusChange('won_awaiting_payment')}
                >
                  <Sparkles className="w-3 h-3" />
                  Mark as Won
                </Button>
              </div>
            )}
          </div>

          {/* 3. Client Relationship Status */}
          {lead.client_type === 'existing' && (
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  Existing Client Account: <strong className="font-semibold">{lead.existing_client?.name || lead.name}</strong>
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                Returning Client
              </span>
            </div>
          )}

          {/* 4. Contact & Service Info */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Contact & Service
            </h4>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{lead.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{lead.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{lead.country || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{lead.service || '—'}</span>
              </div>
            </div>
          </div>

          {/* 5. Source Information */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Source Info
            </h4>
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                {lead.source_type === 'website' ? (
                  <Globe className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Tag className="w-4 h-4 text-zinc-400" />
                )}
                <span>
                  Channel:{' '}
                  <strong className="capitalize font-medium text-zinc-900 dark:text-zinc-100">
                    {lead.source_type === 'website'
                      ? 'Website Ingestion'
                      : lead.source_platform || 'Manual'}
                  </strong>
                </span>
              </div>

              {lead.custom_source && (
                <span className="text-[11px] text-zinc-500 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  Custom: {lead.custom_source}
                </span>
              )}
            </div>
          </div>

          {/* 6. Commercial Terms & Timeline */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Commercial & Timeline
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
                  Budget
                </span>
                <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-300">
                  {budgetVal ? `${currencySymbol}${budgetVal.toLocaleString()}` : '—'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  Currency
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {lead.currency || 'USD'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  Timeline
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {lead.timeline || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 7. Requirements */}
          {lead.requirements && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Requirements
              </h4>
              <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {lead.requirements}
              </div>
            </div>
          )}

          {/* 8. Internal Notes */}
          {lead.notes && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Internal Notes
              </h4>
              <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {lead.notes}
              </div>
            </div>
          )}
        </div>
      </Sheet>

      {/* Send Payment Email Modal */}
      <SendPaymentEmailModal
        isOpen={isSendEmailModalOpen}
        lead={lead}
        paymentLink={existingPaymentLink || `/pay/${milestone1Id}`}
        milestoneId={milestone1Id}
        depositAmount={depositVal}
        currency={lead.currency || 'USD'}
        onClose={() => setIsSendEmailModalOpen(false)}
        onSuccess={() => onRefresh()}
      />

      {/* Offline Payment & Conversion Modal */}
      <OfflinePaymentModal
        isOpen={isOfflineModalOpen}
        lead={lead}
        onClose={() => setIsOfflineModalOpen(false)}
        onSuccess={() => {
          onRefresh();
          onClose();
        }}
      />
    </>
  );
}
