import { supabase } from './supabase';

export type LeadSourceType = 'website' | 'manual';

export type LeadSourcePlatform =
  | 'whatsapp'
  | 'instagram'
  | 'linkedin'
  | 'referral'
  | 'email'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'won_awaiting_payment'
  | 'converted'
  | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  service: string | null;
  requirements: string | null;
  notes: string | null;
  source_type: LeadSourceType | null;
  source_platform: LeadSourcePlatform | null;
  custom_source: string | null;
  client_type?: 'new' | 'existing';
  existing_client_id?: string | null;
  existing_client?: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  } | null;
  estimated_budget: number;
  agreed_project_value: number;
  currency: string;
  duration_value: number | null;
  duration_unit: 'days' | 'weeks' | 'months' | null;
  timeline: string | null;
  status: LeadStatus;
  created_at: string;
  converted_client?: {
    id: string;
    name: string;
  }[] | { id: string; name: string } | null;
  projects?: {
    id: string;
    client_id?: string | null;
    name: string;
    stage: string;
    agreed_value: number;
    currency: string;
    is_draft: boolean;
    payment_milestones?: {
      id: string;
      milestone_number: number;
      percentage: number;
      amount: number;
      status: string;
      payment_link: string | null;
      paid_at: string | null;
      unlocked_at: string | null;
      requested_at: string | null;
    }[];
  }[];
}

export interface CreateLeadInput {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  country?: string;
  service?: string;
  requirements?: string;
  notes?: string;
  source_type?: LeadSourceType;
  source_platform?: LeadSourcePlatform | null;
  custom_source?: string;
  client_type?: 'new' | 'existing';
  existing_client_id?: string | null;
  budget?: number;
  estimated_budget?: number;
  agreed_project_value?: number;
  currency?: string;
  timeline?: string;
  duration_value?: number | null;
  duration_unit?: 'days' | 'weeks' | 'months' | null;
}

export interface UpdateLeadInput {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  service?: string;
  requirements?: string;
  notes?: string;
  source_type?: LeadSourceType;
  source_platform?: LeadSourcePlatform | null;
  custom_source?: string;
  client_type?: 'new' | 'existing';
  existing_client_id?: string | null;
  budget?: number;
  estimated_budget?: number;
  agreed_project_value?: number;
  currency?: string;
  timeline?: string;
  duration_value?: number | null;
  duration_unit?: 'days' | 'weeks' | 'months' | null;
  status?: LeadStatus;
}

export interface ConversionResult {
  client_id: string;
  project_id: string;
  lead_id: string;
  status: string;
}

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won_awaiting_payment', label: 'Won (Awaiting Payment)' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export const SERVICE_OPTIONS = [
  'Website Development',
  'UI/UX Design',
  'AI Engineering',
  'SEO',
  'High-Converting Landing Page',
  'Other',
];

export const SOURCE_PLATFORM_OPTIONS: { value: LeadSourcePlatform; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'Email Outreach' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

export const CURRENCY_OPTIONS = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'];

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'India': 'INR',
  'United Kingdom': 'GBP',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'AED',
  'Qatar': 'AED',
  'Kuwait': 'AED',
  'Bahrain': 'AED',
  'Oman': 'AED',
  'Singapore': 'SGD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'Ireland': 'EUR',
  'Portugal': 'EUR',
  'Greece': 'EUR',
  'Finland': 'EUR',
  'Slovakia': 'EUR',
  'Slovenia': 'EUR',
  'Lithuania': 'EUR',
  'Latvia': 'EUR',
  'Estonia': 'EUR',
  'Cyprus': 'EUR',
  'Malta': 'EUR',
  'Luxembourg': 'EUR',
  'United States': 'USD',
};

export function getCurrencyForCountry(country?: string | null): string {
  if (!country) return 'USD';
  return COUNTRY_CURRENCY_MAP[country.trim()] || 'USD';
}

/**
 * Fetch all leads with associated draft/prospect projects & milestones
 */
export async function getLeads(): Promise<Lead[]> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      existing_client:existing_client_id (
        id,
        name,
        email,
        company
      ),
      converted_client:clients!lead_id (
        id,
        name
      ),
      projects (
        id,
        client_id,
        name,
        stage,
        agreed_value,
        currency,
        is_draft,
        payment_milestones (
          id,
          milestone_number,
          percentage,
          amount,
          status,
          payment_link,
          paid_at,
          unlocked_at,
          requested_at
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return (data as unknown as Lead[]) || [];
}

/**
 * Create a new lead and automatically provision a prospect project + 3 milestones
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const timelineText =
    input.timeline?.trim() ||
    (input.duration_value && input.duration_unit
      ? `${input.duration_value} ${input.duration_unit}`
      : null);

  const finalBudget =
    Number(input.budget) ||
    Number(input.agreed_project_value) ||
    Number(input.estimated_budget) ||
    0;

  const leadPayload = {
    name: input.name.trim(),
    company: input.company?.trim() || null,
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    country: input.country?.trim() || null,
    service: input.service || SERVICE_OPTIONS[0],
    requirements: input.requirements?.trim() || null,
    notes: input.notes?.trim() || null,
    source_type: input.source_type || 'manual',
    source_platform: input.source_type === 'website' ? null : input.source_platform || null,
    custom_source: input.source_platform === 'other' ? input.custom_source?.trim() || null : null,
    client_type: input.client_type || 'new',
    existing_client_id: input.client_type === 'existing' ? input.existing_client_id || null : null,
    estimated_budget: finalBudget,
    agreed_project_value: finalBudget,
    currency: input.currency || 'USD',
    duration_value: input.duration_value || null,
    duration_unit: input.duration_unit || null,
    timeline: timelineText,
    status: 'new' as LeadStatus,
  };

  const { data, error } = await supabase
    .from('leads')
    .insert([leadPayload])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  const createdLead = data as Lead;

  // Auto-create Prospect/Draft Project with calculated 3 milestones
  try {
    const projName = `${createdLead.company || createdLead.name} - ${createdLead.service || 'Project'}`;
    const agreedVal = createdLead.agreed_project_value || 0;

    await supabase.from('projects').insert([
      {
        lead_id: createdLead.id,
        client_id: null, // Draft project before conversion
        name: projName,
        service_type: createdLead.service,
        requirements: createdLead.requirements,
        timeline: createdLead.timeline,
        agreed_value: agreedVal,
        currency: createdLead.currency || 'USD',
        stage: 'planning',
        is_draft: true,
        domain_status: 'pending',
      },
    ]);
  } catch (projErr) {
    console.warn('Could not auto-create prospect project:', projErr);
  }

  // Log activity
  try {
    await supabase.from('activities').insert([
      {
        lead_id: createdLead.id,
        type: 'lead_created',
        description: `Lead "${createdLead.name}" was added with budget ${createdLead.currency} ${createdLead.agreed_project_value}.`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity:', actErr);
  }

  return createdLead;
}

/**
 * Update a lead's status and log the activity
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  leadName?: string,
  oldStatus?: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }

  // Log activity
  try {
    const desc = oldStatus
      ? `Lead status changed from "${oldStatus}" to "${newStatus}".`
      : `Lead status updated to "${newStatus}".`;

    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        type: 'lead_updated',
        description: desc,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity for status update:', actErr);
  }
}

/**
 * Update lead details, recalculate prospect milestones if value changed, and log activity
 */
export async function updateLeadDetails(
  leadId: string,
  input: UpdateLeadInput
): Promise<Lead> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const timelineText =
    input.timeline !== undefined
      ? input.timeline?.trim() || null
      : input.duration_value && input.duration_unit
      ? `${input.duration_value} ${input.duration_unit}`
      : undefined;

  const finalBudget =
    input.budget !== undefined
      ? Number(input.budget) || 0
      : input.agreed_project_value !== undefined
      ? Number(input.agreed_project_value) || 0
      : input.estimated_budget !== undefined
      ? Number(input.estimated_budget) || 0
      : undefined;

  const updatePayload: Record<string, unknown> = {
    ...input,
  };

  if (finalBudget !== undefined) {
    updatePayload.estimated_budget = finalBudget;
    updatePayload.agreed_project_value = finalBudget;
  }

  if (timelineText !== undefined) {
    updatePayload.timeline = timelineText;
  }

  if (input.source_type === 'website') {
    updatePayload.source_platform = null;
    updatePayload.custom_source = null;
  } else if (input.source_platform !== 'other') {
    updatePayload.custom_source = null;
  }

  if (input.client_type === 'new') {
    updatePayload.existing_client_id = null;
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  const updatedLead = data as Lead;

  // Sync budget to existing prospect project & recalculate milestones
  if (finalBudget !== undefined) {
    try {
      const val = finalBudget;
      const { data: projData } = await supabase
        .from('projects')
        .update({
          agreed_value: val,
          currency: input.currency || 'USD',
          timeline: timelineText || updatedLead.timeline,
        })
        .eq('lead_id', leadId)
        .select('id')
        .single();

      if (projData?.id) {
        // Update milestone amounts
        await supabase
          .from('payment_milestones')
          .update({ amount: Math.round(val * 0.30) })
          .eq('project_id', projData.id)
          .eq('milestone_number', 1);

        await supabase
          .from('payment_milestones')
          .update({ amount: Math.round(val * 0.35) })
          .eq('project_id', projData.id)
          .eq('milestone_number', 2);

        await supabase
          .from('payment_milestones')
          .update({ amount: Math.round(val * 0.35) })
          .eq('project_id', projData.id)
          .eq('milestone_number', 3);
      }
    } catch (syncErr) {
      console.warn('Could not sync project milestones:', syncErr);
    }
  }

  try {
    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        type: 'lead_updated',
        description: `Lead details & commercial terms updated for "${updatedLead.name}".`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity for lead update:', actErr);
  }

  return updatedLead;
}

/**
 * Atomic conversion of a lead into Client + Project + 3 Payment Milestones
 */
export async function convertLeadToClient(leadId: string): Promise<ConversionResult> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabase.rpc('convert_lead_to_client', {
    p_lead_id: leadId,
  });

  if (error) {
    console.error('Error converting lead via RPC:', error);
    throw error;
  }

  return data as ConversionResult;
}

/**
 * Generate unique payment link for Lead (Milestone #1 Initial Deposit)
 */
export async function generateLeadPaymentLink(leadId: string): Promise<{
  paymentLink: string;
  milestoneId: string;
  amount: number;
  currency: string;
}> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  // 1. Fetch Lead
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*, projects(*, payment_milestones(*))')
    .eq('id', leadId)
    .single();

  if (leadErr || !lead) {
    throw new Error('Lead not found.');
  }

  // 2. Find or create draft project
  let project = lead.projects?.[0];
  if (!project) {
    const val = Number(lead.agreed_project_value || lead.estimated_budget) || 0;
    const { data: newProj, error: projErr } = await supabase
      .from('projects')
      .insert([
        {
          lead_id: leadId,
          name: `${lead.company || lead.name} - ${lead.service || 'Project'}`,
          service_type: lead.service,
          requirements: lead.requirements,
          timeline: lead.timeline,
          stage: 'planning',
          agreed_value: val,
          currency: lead.currency || 'USD',
          is_draft: true,
          domain_status: 'pending',
        },
      ])
      .select('*, payment_milestones(*)')
      .single();

    if (projErr || !newProj) {
      throw new Error('Could not initialize project for lead.');
    }
    project = newProj;
  }

  // 3. Find Milestone 1
  const { data: milestones, error: msErr } = await supabase
    .from('payment_milestones')
    .select('*')
    .eq('project_id', project.id)
    .order('milestone_number', { ascending: true });

  if (msErr || !milestones || milestones.length === 0) {
    throw new Error('Could not find payment milestones for project.');
  }

  const ms1 = milestones.find((m) => m.milestone_number === 1) || milestones[0];
  const generatedLink = `/pay/${ms1.id}`;
  const nowIso = new Date().toISOString();

  // 4. Update milestone with link
  const { error: updateMsErr } = await supabase
    .from('payment_milestones')
    .update({
      status: ms1.status === 'paid' ? 'paid' : 'link_generated',
      payment_link: generatedLink,
      payment_link_generated_at: nowIso,
      provider: 'stripe',
    })
    .eq('id', ms1.id);

  if (updateMsErr) {
    throw updateMsErr;
  }

  // 5. If lead status is earlier than won_awaiting_payment, update to won_awaiting_payment
  if (
    lead.status !== 'won_awaiting_payment' &&
    lead.status !== 'converted'
  ) {
    await supabase
      .from('leads')
      .update({ status: 'won_awaiting_payment' })
      .eq('id', leadId);
  }

  // 6. Log activity
  try {
    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        project_id: project.id,
        type: 'payment_created',
        description: `Payment link generated for Milestone #1 (${generatedLink}) for lead "${lead.name}".`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity:', actErr);
  }

  return {
    paymentLink: generatedLink,
    milestoneId: ms1.id,
    amount: ms1.amount || 0,
    currency: project.currency || lead.currency || 'USD',
  };
}

export interface OfflinePaymentData {
  leadId: string;
  invoiceNumber?: string;
  invoiceFileUrl?: string;
  receiptNumber?: string;
  receiptFileUrl?: string;
  notes?: string;
  amount?: number;
}

/**
 * Record Offline Payment (Invoice & Receipt) and Convert Lead to Client
 */
export async function recordOfflinePaymentAndConvert(
  data: OfflinePaymentData
): Promise<ConversionResult> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { leadId, invoiceNumber, invoiceFileUrl, receiptNumber, receiptFileUrl, notes, amount } = data;
  const nowIso = new Date().toISOString();

  // 1. Fetch Lead
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadErr || !lead) {
    throw new Error('Lead not found.');
  }

  // 2. Fetch or create prospect project directly from projects table
  let { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    const val = Number(lead.agreed_project_value || lead.estimated_budget) || 0;
    const { data: newProj, error: projErr } = await supabase
      .from('projects')
      .insert([
        {
          lead_id: leadId,
          name: `${lead.company || lead.name} - ${lead.service || 'Project'}`,
          service_type: lead.service,
          requirements: lead.requirements,
          timeline: lead.timeline,
          stage: 'planning',
          agreed_value: val,
          currency: lead.currency || 'USD',
          is_draft: true,
          domain_status: 'pending',
        },
      ])
      .select('*')
      .single();

    if (projErr || !newProj) {
      throw new Error('Could not create project.');
    }
    project = newProj;
  }

  // 3. Fetch Milestone 1
  const { data: milestones } = await supabase
    .from('payment_milestones')
    .select('*')
    .eq('project_id', project.id)
    .order('milestone_number', { ascending: true });

  const ms1 = milestones?.find((m) => m.milestone_number === 1) || milestones?.[0];

  // 4. Insert Documents (Invoice & Receipt)
  if (invoiceNumber || invoiceFileUrl) {
    await supabase.from('documents').insert([
      {
        lead_id: leadId,
        project_id: project.id,
        type: 'invoice',
        name: invoiceNumber ? `Invoice #${invoiceNumber}` : `Initial Invoice - ${lead.name}`,
        file_url: invoiceFileUrl || null,
        status: 'accepted',
      },
    ]);
  }

  if (receiptNumber || receiptFileUrl) {
    await supabase.from('documents').insert([
      {
        lead_id: leadId,
        project_id: project.id,
        type: 'receipt',
        name: receiptNumber ? `Receipt #${receiptNumber}` : `Payment Receipt - ${lead.name}`,
        file_url: receiptFileUrl || null,
        status: 'completed',
      },
    ]);
  }

  // 5. Update Milestone 1 to Paid
  if (ms1) {
    await supabase
      .from('payment_milestones')
      .update({
        status: 'paid',
        paid_at: nowIso,
        provider: 'offline_settlement',
      })
      .eq('id', ms1.id);

    // Insert into payments table
    await supabase.from('payments').insert([
      {
        project_id: project.id,
        milestone_id: ms1.id,
        provider: 'offline_settlement',
        provider_payment_id: receiptNumber || `OFFLINE-${Date.now()}`,
        amount: amount || ms1.amount || 0,
        currency: lead.currency || 'USD',
        status: 'paid',
        paid_at: nowIso,
        metadata: {
          invoice_number: invoiceNumber,
          receipt_number: receiptNumber,
          notes: notes,
          verification_method: 'offline_manual',
        },
      },
    ]);
  }

  // 5. Log activity
  try {
    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        project_id: project.id,
        type: 'payment_paid',
        description: `Offline payment verified for "${lead.name}". Invoice #${invoiceNumber || 'N/A'}, Receipt #${receiptNumber || 'N/A'}.`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity:', actErr);
  }

  // 7. Convert Lead to Client via RPC
  const result = await convertLeadToClient(leadId);

  // 8. Ensure Milestone 1 of the converted project is marked as paid
  if (result?.project_id) {
    await supabase
      .from('payment_milestones')
      .update({
        status: 'paid',
        paid_at: nowIso,
        provider: 'offline_settlement',
      })
      .eq('project_id', result.project_id)
      .eq('milestone_number', 1);
  }

  return result;
}

