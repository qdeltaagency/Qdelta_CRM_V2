'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Lead, convertLeadToClient } from '@/lib/leads-service';
import { useToast } from '@/components/ui/toast';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface ConvertLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConvertLeadModal({
  isOpen,
  lead,
  onClose,
  onSuccess,
}: ConvertLeadModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!lead) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await convertLeadToClient(lead.id);
      toast({
        type: 'success',
        title: 'Lead Converted',
        description: 'Lead converted to client and project created.',
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Conversion error:', err);
      toast({
        type: 'error',
        title: 'Conversion failed',
        description: 'Conversion failed. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead to Client"
      description="Finalize onboarding for this qualified lead."
      maxWidth="sm"
      footer={
        <>
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
            type="button"
            variant="default"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            Confirm Conversion
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {lead.name}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/40">
              Won — Payment Confirmed
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
            {lead.company && <p>Company: <strong className="text-zinc-700 dark:text-zinc-300">{lead.company}</strong></p>}
            {lead.service && <p>Service: <strong className="text-zinc-700 dark:text-zinc-300">{lead.service}</strong></p>}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">
            Are you sure you want to convert this lead?
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            This action will automatically:
          </p>
          <ul className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 pl-4 list-disc">
            <li>Create an active Client record</li>
            <li>Create a new Project in Planning stage</li>
            <li>Provision 3 Fixed Payment Milestones (30% / 35% / 35%)</li>
            <li>Mark this Lead status as Converted</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
