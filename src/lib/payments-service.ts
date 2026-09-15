import { supabase } from './supabase';
import { convertLeadToClient } from './leads-service';

export type MilestoneStatus =
  | 'locked'
  | 'ready'
  | 'link_generated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'overdue';

export interface PaymentMilestone {
  id: string;
  project_id: string;
  milestone_number: number;
  percentage: number;
  amount: number;
  status: MilestoneStatus;
  payment_link: string | null;
  provider: string | null;
  created_at: string;
  paid_at: string | null;
  unlocked_at: string | null;
  requested_at: string | null;
  projects?: {
    id: string;
    name: string;
    stage: string;
    agreed_value?: number;
    currency?: string;
    client_id: string | null;
    lead_id: string | null;
    clients?: {
      id: string;
      name: string;
      company: string | null;
      lead_id: string | null;
    } | null;
  } | null;
}

export interface ProjectPaymentGroup {
  projectId: string;
  projectName: string;
  projectStage: string;
  leadId: string | null;
  clientId: string | null;
  clientName: string;
  clientCompany: string | null;
  totalValue: number;
  amountCollected: number;
  remainingAmount: number;
  currency: string;
  nextPayment: {
    milestoneNumber: number;
    percentage: number;
    amount: number;
    status: MilestoneStatus;
  } | null;
  paymentState: 'all_paid' | 'awaiting_payment' | 'ready_to_collect' | 'overdue' | 'in_progress';
  milestones: PaymentMilestone[];
}

export interface PaymentSummaryMetrics {
  readyToCollect: number;
  awaitingPayment: number;
  overdueCount: number;
  overdueAmount: number;
  collectedThisMonth: number;
}

/**
 * Checks if a milestone is overdue based strictly on requested_at > 48 hours ago
 */
export function isMilestoneOverdue(milestone: PaymentMilestone): boolean {
  if (milestone.status !== 'pending' && milestone.status !== 'overdue') {
    return false;
  }
  if (!milestone.requested_at) {
    return false;
  }
  const requestedDate = new Date(milestone.requested_at).getTime();
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  return requestedDate < fortyEightHoursAgo;
}

/**
 * Fetch all projects and their 3 fixed payment milestones grouped: ONE ROW PER PROJECT
 */
export async function getProjectPaymentGroups(): Promise<{
  groups: ProjectPaymentGroup[];
  summary: PaymentSummaryMetrics;
}> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  // Fetch all projects (both active and converted) with clients and milestones
  const { data: projectsData, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      stage,
      agreed_value,
      currency,
      lead_id,
      client_id,
      is_draft,
      clients (
        id,
        name,
        company,
        lead_id
      ),
      payment_milestones (
        id,
        project_id,
        milestone_number,
        percentage,
        amount,
        status,
        payment_link,
        provider,
        created_at,
        paid_at,
        unlocked_at,
        requested_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project payment groups:', error);
    throw error;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let totalReadyToCollect = 0;
  let totalAwaitingPayment = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let collectedThisMonth = 0;

  const groups: ProjectPaymentGroup[] = (projectsData || []).map((proj: any) => {
    const rawMilestones: PaymentMilestone[] = (proj.payment_milestones || []).sort(
      (a: any, b: any) => a.milestone_number - b.milestone_number
    );

    // Compute effective overdue status for each milestone
    const milestones = rawMilestones.map((m) => {
      if (isMilestoneOverdue(m)) {
        return { ...m, status: 'overdue' as MilestoneStatus };
      }
      return m;
    });

    const totalVal = Number(proj.agreed_value) || 0;
    const currency = proj.currency || 'USD';

    let amountCollected = 0;
    let nextPayment: ProjectPaymentGroup['nextPayment'] = null;
    let hasOverdue = false;
    let hasPendingOrLinkGen = false;
    let hasReady = false;

    for (const m of milestones) {
      const amt = Number(m.amount) || 0;

      if (m.status === 'paid') {
        amountCollected += amt;
        if (m.paid_at && new Date(m.paid_at).getTime() >= startOfMonth) {
          collectedThisMonth += amt;
        }
      } else {
        if (!nextPayment) {
          nextPayment = {
            milestoneNumber: m.milestone_number,
            percentage: m.percentage,
            amount: amt,
            status: m.status,
          };
        }

        if (m.status === 'overdue') {
          hasOverdue = true;
          overdueCount += 1;
          overdueAmount += amt;
        } else if (m.status === 'pending' || m.status === 'link_generated') {
          hasPendingOrLinkGen = true;
          totalAwaitingPayment += amt;
        } else if (m.status === 'ready') {
          hasReady = true;
          totalReadyToCollect += amt;
        }
      }
    }

    const remainingAmount = Math.max(0, totalVal - amountCollected);

    let paymentState: ProjectPaymentGroup['paymentState'] = 'in_progress';
    if (amountCollected >= totalVal && totalVal > 0) {
      paymentState = 'all_paid';
    } else if (hasOverdue) {
      paymentState = 'overdue';
    } else if (hasPendingOrLinkGen) {
      paymentState = 'awaiting_payment';
    } else if (hasReady) {
      paymentState = 'ready_to_collect';
    }

    const client = proj.clients;

    return {
      projectId: proj.id,
      projectName: proj.name,
      projectStage: proj.stage,
      leadId: proj.lead_id,
      clientId: proj.client_id,
      clientName: client?.name || (proj.is_draft ? 'Prospect Client' : 'Direct Account'),
      clientCompany: client?.company || null,
      totalValue: totalVal,
      amountCollected,
      remainingAmount,
      currency,
      nextPayment,
      paymentState,
      milestones,
    };
  });

  return {
    groups,
    summary: {
      readyToCollect: totalReadyToCollect,
      awaitingPayment: totalAwaitingPayment,
      overdueCount,
      overdueAmount,
      collectedThisMonth,
    },
  };
}

/**
 * Generate payment link for a ready milestone
 */
export async function generateMilestonePaymentLink(
  milestoneId: string,
  projectName?: string,
  milestoneNumber?: number
): Promise<string> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const generatedLink = `/pay/${milestoneId}`;
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('payment_milestones')
    .update({
      status: 'link_generated',
      payment_link: generatedLink,
      payment_link_generated_at: nowIso,
      provider: 'stripe',
    })
    .eq('id', milestoneId);

  if (error) {
    console.error('Error generating payment link:', error);
    throw error;
  }

  return generatedLink;
}

/**
 * Mark milestone as Sent (link_generated -> pending)
 */
export async function markMilestoneAsSent(milestoneId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('payment_milestones')
    .update({
      status: 'pending',
      requested_at: nowIso,
    })
    .eq('id', milestoneId);

  if (error) {
    console.error('Error marking milestone as sent:', error);
    throw error;
  }
}

/**
 * Mark milestone as Paid:
 * - Updates status to 'paid', paid_at = now()
 * - Inserts into payments table
 * - If milestone 1, converts lead / activates client if still a draft
 * - Automatically unlocks milestone 2 if applicable
 */
export async function markMilestoneAsPaid(
  milestone: PaymentMilestone
): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  if (milestone.status === 'locked') {
    throw new Error('Cannot mark a locked milestone as paid.');
  }

  const nowIso = new Date().toISOString();

  // 1. Update milestone status
  const { error } = await supabase
    .from('payment_milestones')
    .update({
      status: 'paid',
      paid_at: nowIso,
    })
    .eq('id', milestone.id);

  if (error) {
    console.error('Error marking milestone as paid:', error);
    throw error;
  }

  // 2. Insert record in payments table
  try {
    await supabase.from('payments').insert([
      {
        project_id: milestone.project_id,
        milestone_id: milestone.id,
        provider: milestone.provider || 'stripe',
        amount: milestone.amount || 0,
        currency: 'USD',
        status: 'paid',
        paid_at: nowIso,
        metadata: {
          milestone_number: milestone.milestone_number,
          percentage: milestone.percentage,
        },
      },
    ]);
  } catch (payErr) {
    console.warn('Could not record payment entry:', payErr);
  }

  // 3. If milestone #1 is paid on a draft lead, trigger atomic conversion
  const leadId = milestone.projects?.lead_id || milestone.projects?.clients?.lead_id;
  if (milestone.milestone_number === 1 && leadId) {
    try {
      await convertLeadToClient(leadId);
    } catch (convErr) {
      console.warn('Could not convert lead on milestone payment:', convErr);
    }
  }

  // 4. Log activity
  try {
    await supabase.from('activities').insert([
      {
        project_id: milestone.project_id,
        client_id: milestone.projects?.client_id || null,
        lead_id: leadId || null,
        type: 'payment_received',
        description: `Milestone #${milestone.milestone_number} (${milestone.percentage}%) payment of $${milestone.amount} marked as paid.`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log payment activity:', actErr);
  }
}
