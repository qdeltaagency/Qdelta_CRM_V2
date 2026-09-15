'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, recordOfflinePaymentAndConvert } from '@/lib/leads-service';
import { useToast } from '@/components/ui/toast';
import {
  FileText,
  Receipt,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Building2,
  DollarSign,
} from 'lucide-react';

interface OfflinePaymentModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfflinePaymentModal({
  isOpen,
  lead,
  onClose,
  onSuccess,
}: OfflinePaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [invoiceNumber, setInvoiceNumber] = React.useState('');
  const [invoiceFileName, setInvoiceFileName] = React.useState('');
  const [receiptNumber, setReceiptNumber] = React.useState('');
  const [receiptFileName, setReceiptFileName] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  if (!lead) return null;

  const agreedVal = Number(lead.agreed_project_value || lead.estimated_budget) || 0;
  const depositVal = Math.round(agreedVal * 0.3);
  const currencySymbol =
    lead.currency === 'INR' ? '₹' : lead.currency === 'EUR' ? '€' : lead.currency === 'GBP' ? '£' : '$';

  // Strict validation: Require at least invoice number/file AND receipt number/file, plus confirmation checkbox
  const hasInvoiceProof = Boolean(invoiceNumber.trim() || invoiceFileName.trim());
  const hasReceiptProof = Boolean(receiptNumber.trim() || receiptFileName.trim());
  const canSubmit = hasInvoiceProof && hasReceiptProof && isConfirmed;

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFileName(e.target.files[0].name);
      if (!invoiceNumber) {
        setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      }
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name);
      if (!receiptNumber) {
        setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        type: 'error',
        title: 'Proof Required',
        description: 'Please provide both Invoice and Receipt proof before converting.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await recordOfflinePaymentAndConvert({
        leadId: lead.id,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceFileUrl: invoiceFileName ? `/uploads/invoices/${invoiceFileName}` : undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        receiptFileUrl: receiptFileName ? `/uploads/receipts/${receiptFileName}` : undefined,
        notes: notes.trim() || undefined,
        amount: depositVal,
      });

      toast({
        type: 'success',
        title: 'Offline Payment Verified & Lead Converted',
        description: `Client account created and project launched for "${lead.name}".`,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Offline conversion failed.';
      toast({
        type: 'error',
        title: 'Conversion Error',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Offline Payment Verification & Conversion"
      description="Record offline payment proof (Invoice & Receipt) to authorize client conversion."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Notice Box */}
        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Payment Gating Required</span>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
              Leads cannot be converted without either online payment or verified offline invoice and receipt documentation.
            </p>
          </div>
        </div>

        {/* Lead & Deposit Summary */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Lead / Company
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block truncate mt-0.5">
              {lead.name} {lead.company ? `(${lead.company})` : ''}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">{lead.service || 'Custom Service'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 block">
              Initial Deposit Amount (30%)
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm block mt-0.5">
              {currencySymbol}{depositVal.toLocaleString()} {lead.currency || 'USD'}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Total Project Value: {currencySymbol}{agreedVal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 1. Invoice Section */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              1. Commercial Invoice Proof <span className="text-red-500">*</span>
            </span>
            {hasInvoiceProof && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Provided
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Invoice Reference #
              </label>
              <Input
                type="text"
                placeholder="e.g. INV-2026-084"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Upload Invoice File
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="invoice-file"
                  onChange={handleInvoiceFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                <label
                  htmlFor="invoice-file"
                  className="flex items-center justify-between px-3 h-8 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[140px]">
                    {invoiceFileName || 'Choose File...'}
                  </span>
                  <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Receipt Section */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              2. Payment Receipt / Settlement Proof <span className="text-red-500">*</span>
            </span>
            {hasReceiptProof && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Provided
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Receipt / Transaction Ref #
              </label>
              <Input
                type="text"
                placeholder="e.g. WIRE-98432 or UTR..."
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Upload Receipt / Slip
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="receipt-file"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                <label
                  htmlFor="receipt-file"
                  className="flex items-center justify-between px-3 h-8 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[140px]">
                    {receiptFileName || 'Choose File...'}
                  </span>
                  <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Internal Notes */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Settlement Notes / Bank Details (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g. Received via international wire transfer on Sep 15"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Confirmation Checkbox */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="confirm-offline-payment"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <label
            htmlFor="confirm-offline-payment"
            className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug cursor-pointer select-none"
          >
            I verify that the initial deposit of{' '}
            <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
              {currencySymbol}{depositVal.toLocaleString()}
            </strong>{' '}
            has been received and audited, and authorize client account activation.
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify & Convert to Client
          </Button>
        </div>
      </form>
    </Modal>
  );
}
