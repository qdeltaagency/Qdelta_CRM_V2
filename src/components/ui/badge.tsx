'use client';

import * as React from 'react';

export type BadgeVariant =
  | 'gray'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'red'
  | 'strong_red'
  | 'default'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  className = '',
  variant = 'gray',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    gray: {
      container:
        'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/60',
      dot: 'bg-zinc-400 dark:bg-zinc-500',
    },
    blue: {
      container:
        'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      dot: 'bg-blue-500',
    },
    purple: {
      container:
        'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
      dot: 'bg-purple-500',
    },
    yellow: {
      container:
        'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      dot: 'bg-amber-500',
    },
    orange: {
      container:
        'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40',
      dot: 'bg-orange-500',
    },
    green: {
      container:
        'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
      dot: 'bg-emerald-500',
    },
    red: {
      container:
        'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40',
      dot: 'bg-red-500',
    },
    strong_red: {
      container:
        'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800 font-semibold',
      dot: 'bg-red-600 dark:bg-red-400',
    },
    default: {
      container: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent',
      dot: 'bg-zinc-400 dark:bg-zinc-600',
    },
    outline: {
      container:
        'border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 bg-transparent',
      dot: 'bg-zinc-400',
    },
  };

  const current = variantStyles[variant] || variantStyles.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${current.container} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dot}`} />}
      {children}
    </span>
  );
}

/**
 * StatusBadge maps CRM domain statuses to color-coded badges matching the business rules.
 */
export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let variant: BadgeVariant = 'gray';
  let label = status;

  switch (normalized) {
    // Leads Status Rules
    case 'new':
      variant = 'gray';
      label = 'New';
      break;
    case 'contacted':
      variant = 'blue';
      label = 'Contacted';
      break;
    case 'qualified':
      variant = 'purple';
      label = 'Qualified';
      break;
    case 'proposal_sent':
      variant = 'yellow';
      label = 'Proposal Sent';
      break;
    case 'negotiation':
      variant = 'orange';
      label = 'Negotiation';
      break;
    case 'won':
      variant = 'green';
      label = 'Won';
      break;
    case 'won_awaiting_payment':
    case 'awaiting_payment':
      variant = 'yellow';
      label = 'Awaiting Payment';
      break;
    case 'converted':
      variant = 'green';
      label = 'Converted';
      break;
    case 'lost':
      variant = 'red';
      label = 'Lost';
      break;

    // Clients
    case 'active':
      variant = 'green';
      label = 'Active';
      break;
    case 'inactive':
      variant = 'gray';
      label = 'Inactive';
      break;

    // Milestones & Payments (Exact rules)
    // locked -> gray
    case 'locked':
      variant = 'gray';
      label = 'Locked';
      break;
    // ready -> blue
    case 'ready':
      variant = 'blue';
      label = 'Ready';
      break;
    // link_generated -> purple
    case 'link_generated':
      variant = 'purple';
      label = 'Link Generated';
      break;
    // pending -> orange
    case 'pending':
      variant = 'orange';
      label = 'Pending';
      break;
    // paid -> green
    case 'paid':
      variant = 'green';
      label = 'Paid';
      break;
    // failed -> red
    case 'failed':
      variant = 'red';
      label = 'Failed';
      break;
    // overdue -> strong red
    case 'overdue':
      variant = 'strong_red';
      label = 'Overdue';
      break;

    // Projects / Stages
    case 'planning':
      variant = 'gray';
      label = 'Planning';
      break;
    case 'design':
      variant = 'purple';
      label = 'Design';
      break;
    case 'internal_review':
      variant = 'gray';
      label = 'Internal Review';
      break;
    case 'development':
      variant = 'blue';
      label = 'Development';
      break;
    case 'qa_testing':
      variant = 'orange';
      label = 'QA Testing';
      break;
    case 'client_review':
      variant = 'yellow';
      label = 'Client Review';
      break;
    case 'revision':
      variant = 'orange';
      label = 'Revision';
      break;
    case 'ready_for_delivery':
      variant = 'blue';
      label = 'Ready for Delivery';
      break;
    case 'handover':
      variant = 'green';
      label = 'Handover';
      break;
    case 'completed':
      variant = 'green';
      label = 'Completed';
      break;
    case 'on_hold':
      variant = 'red';
      label = 'On Hold';
      break;

    default:
      variant = 'gray';
      label = status;
  }

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
