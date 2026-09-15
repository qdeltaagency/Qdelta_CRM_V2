'use client';

import * as React from 'react';
import { Check, Lock } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

export interface MilestoneItemLike {
  id?: string;
  milestone_number: number;
  percentage?: number;
  amount?: number | null;
  status: string;
  payment_link?: string | null;
  paid_at?: string | null;
  unlocked_at?: string | null;
  requested_at?: string | null;
}

export interface MilestoneStepperProps {
  milestones?: MilestoneItemLike[];
  currency?: string;
  variant?: 'compact' | 'full';
  size?: 'sm' | 'md';
  className?: string;
}

const STEP_CONFIG = [
  { step: 1, label: 'Initial', percentage: 30, fullTitle: 'Initial (30%)' },
  { step: 2, label: 'Mid Review', percentage: 35, fullTitle: 'Mid Review (35%)' },
  { step: 3, label: 'Final Delivery', percentage: 35, fullTitle: 'Final Delivery (35%)' },
];

export function MilestoneStepper({
  milestones = [],
  currency = 'USD',
  variant = 'compact',
  size = 'sm',
  className = '',
}: MilestoneStepperProps) {
  const currencySymbol =
    currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const formatAmount = (num?: number | null) => {
    if (num === undefined || num === null || Number(num) === 0) return null;
    return `${currencySymbol}${Number(num).toLocaleString()}`;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return null;
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

  // Map steps with actual milestone data
  const steps = STEP_CONFIG.map((cfg) => {
    const found = milestones.find((m) => m.milestone_number === cfg.step);
    const rawStatus = found?.status || (cfg.step === 1 ? 'ready' : 'locked');
    const isPaid = rawStatus === 'paid';
    const isLocked = rawStatus === 'locked';
    const isActive = !isPaid && !isLocked;

    return {
      ...cfg,
      milestone: found,
      status: rawStatus,
      isPaid,
      isActive,
      isLocked,
      amount: found?.amount,
      paid_at: found?.paid_at,
    };
  });

  const isStep1Paid = steps[0]?.isPaid;
  const isStep2Paid = steps[1]?.isPaid;
  const isStep3Paid = steps[2]?.isPaid;

  const nodeDimensions =
    size === 'sm'
      ? variant === 'compact'
        ? 'w-5 h-5 text-[10px]'
        : 'w-6 h-6 text-xs'
      : 'w-7 h-7 text-xs';

  const iconDimensions = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className={`flex items-center select-none ${className}`}>
      {steps.map((s, index) => {
        const isFirst = index === 0;
        const precedingStepPaid = index === 1 ? isStep1Paid : index === 2 ? isStep2Paid : false;

        // Tooltip description content
        const statusLabel = s.isPaid
          ? 'Paid'
          : s.status === 'ready'
          ? 'Ready for Payment'
          : s.status === 'link_generated'
          ? 'Link Generated'
          : s.status === 'pending'
          ? 'Payment Requested'
          : s.status === 'overdue'
          ? 'Overdue (>48h)'
          : 'Locked (Prerequisite pending)';

        const amountFormatted = formatAmount(s.amount);
        const paidFormatted = formatDate(s.paid_at);

        const tooltipNode = (
          <div className="flex flex-col gap-1 p-1 min-w-[140px] text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-zinc-100">{s.fullTitle}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  s.isPaid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : s.isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {statusLabel}
              </span>
            </div>
            {amountFormatted && (
              <div className="text-[10px] text-zinc-300 font-mono">
                Amount: <strong className="text-white">{amountFormatted}</strong>
              </div>
            )}
            {paidFormatted && (
              <div className="text-[9px] text-emerald-400">
                Paid on {paidFormatted}
              </div>
            )}
          </div>
        );

        return (
          <React.Fragment key={s.step}>
            {/* Connecting progress line before this step (for step 2 and step 3) */}
            {!isFirst && (
              <div
                className={`h-[2px] transition-all duration-300 ease-in-out ${
                  variant === 'compact' ? 'w-3.5 sm:w-5' : 'w-8 sm:w-12'
                } ${
                  precedingStepPaid
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            )}

            {/* Stepper Node */}
            <Tooltip content={tooltipNode} position="top">
              <div className="group flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95">
                <div
                  className={`relative flex items-center justify-center rounded-full font-semibold transition-all duration-300 ${nodeDimensions} ${
                    s.isPaid
                      ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 ring-2 ring-emerald-500/20'
                      : s.isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/40 ring-2 ring-blue-500/20 dark:ring-blue-400/20 font-bold animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/60'
                  }`}
                >
                  {s.isPaid ? (
                    <Check className={`${iconDimensions} stroke-[2.5]`} />
                  ) : s.isActive ? (
                    <span className="leading-none">{s.step}</span>
                  ) : (
                    <Lock className={`${iconDimensions} stroke-[2]`} />
                  )}
                </div>

                {/* Subtitle / Label for full variant */}
                {variant === 'full' && (
                  <div className="mt-1 text-center">
                    <span
                      className={`text-[10px] font-medium transition-colors block ${
                        s.isPaid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : s.isActive
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 block">
                      {s.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
}
