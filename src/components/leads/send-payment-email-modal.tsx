'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead } from '@/lib/leads-service';
import { markMilestoneAsSent } from '@/lib/payments-service';
import { useToast } from '@/components/ui/toast';
import { Mail, Send, Check, Copy, ExternalLink, Link as LinkIcon } from 'lucide-react';

interface SendPaymentEmailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  paymentLink: string;
  milestoneId: string;
  depositAmount: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendPaymentEmailModal({
  isOpen,
  lead,
  paymentLink,
  milestoneId,
  depositAmount,
  currency,
  onClose,
  onSuccess,
}: SendPaymentEmailModalProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const currencySymbol =
    currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const fullPaymentUrl =
    typeof window !== 'undefined' && !paymentLink.startsWith('http')
      ? `${window.location.origin}${paymentLink}`
      : paymentLink;

  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [customMessage, setCustomMessage] = React.useState('');

  React.useEffect(() => {
    if (lead) {
      setRecipientEmail(lead.email || '');
      const projName = lead.company
        ? `${lead.company} (${lead.service || 'Project'})`
        : `${lead.name} - ${lead.service || 'Project'}`;
      setSubject(`Payment Request: Initial Milestone for ${projName}`);
      setCustomMessage(
        `Hi ${lead.name},\n\nPlease complete the initial milestone deposit payment (${currencySymbol}${depositAmount.toLocaleString()}) to confirm your project sprint and kick off development.\n\nPayment Link: ${fullPaymentUrl}\n\nBest regards,\nQdelta Digital Studio Team`
      );
    }
  }, [lead, depositAmount, currencySymbol, fullPaymentUrl]);

  if (!lead) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPaymentUrl);
    setIsCopied(true);
    toast({
      type: 'info',
      title: 'Link Copied',
      description: 'Payment link copied to clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) {
      toast({
        type: 'error',
        title: 'Email Required',
        description: 'Please enter a recipient email address.',
      });
      return;
    }

    setIsSending(true);
    try {
      if (milestoneId) {
        await markMilestoneAsSent(milestoneId);
      }

      toast({
        type: 'success',
        title: 'Payment Request Sent',
        description: `Payment link and invoice email dispatched to ${recipientEmail}.`,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send payment email.';
      toast({
        type: 'error',
        title: 'Send Error',
        description: message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Payment Request Email"
      description="Send a branded milestone settlement request directly to the client."
      maxWidth="md"
    >
      <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
        {/* Payment Summary Box */}
        <div className="p-3.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block tracking-wider">
              Initial Deposit (30%)
            </span>
            <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {currencySymbol}{depositAmount.toLocaleString()} {currency}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block">Lead / Client</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              {lead.name} {lead.company ? `(${lead.company})` : ''}
            </span>
          </div>
        </div>

        {/* Unique Payment Link Preview */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-indigo-500" />
            Unique Payment Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate select-all">
              {fullPaymentUrl}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1 cursor-pointer shrink-0"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </Button>
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs"
              title="Open Payment Checkout"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Recipient Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            Recipient Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="client@company.com"
            className="text-xs font-mono"
          />
        </div>

        {/* Email Subject */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            Email Subject
          </label>
          <Input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Payment Request..."
            className="text-xs"
          />
        </div>

        {/* Custom Message */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            Message Body Preview
          </label>
          <textarea
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-mono leading-relaxed"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            isLoading={isSending}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Payment Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
