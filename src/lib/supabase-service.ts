import { supabase, isSupabaseConfigured } from './supabase';
import { Lead, Client, Project, Payment, PartnerAgency, LeadActivity, LeadStatus, PaymentStatus, ProjectStatus } from './types';

// Map snake_case DB row to camelCase Lead
export function mapLeadRow(row: any): Lead {
  let priority: 'Hot' | 'Warm' | 'Cold' = 'Warm';
  const score = Number(row.lead_score || 80);
  if (score >= 90) priority = 'Hot';
  else if (score < 70) priority = 'Cold';

  return {
    id: row.id,
    leadType: (row.lead_type as 'Individual' | 'Organization') || (row.company && row.company !== row.name ? 'Organization' : 'Individual'),
    name: row.name,
    email: row.email,
    company: row.company || '',
    phone: row.phone || '',
    country: row.country || '',
    serviceType: row.service_type || 'Landing Pages & High Conversion',
    budget: row.budget || '',
    timeline: row.timeline || '',
    details: row.details || '',
    source: row.source || 'Manual CRM Entry',
    status: (row.status as LeadStatus) || 'New Inquiry',
    assignedTo: row.assigned_to || undefined,
    handlingMode: row.handling_mode || 'In-House',
    partnerAgencyId: row.partner_agency_id,
    referralCommissionRate: row.referral_commission_rate ? Number(row.referral_commission_rate) : undefined,
    referralCommissionAmount: row.referral_commission_amount ? Number(row.referral_commission_amount) : undefined,
    paypalPaymentLink: row.paypal_payment_link,
    quoteAmount: Number(row.quote_amount || 0),
    currency: row.currency || 'USD',
    leadScore: score,
    priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Map snake_case DB row to camelCase Client
export function mapClientRow(row: any): Client {
  return {
    id: row.id,
    organizationName: row.organization_name,
    primaryContactName: row.primary_contact_name,
    email: row.email,
    phone: row.phone || '',
    country: row.country || '',
    avatarUrl: row.avatar_url,
    tier: row.tier,
    leadId: row.lead_id,
    assignedLeadPartner: row.assigned_lead_partner,
    totalLtv: Number(row.total_ltv || 0),
    totalPaid: Number(row.total_paid || 0),
    onboardingStatus: row.onboarding_status || {
      brandAssets: false,
      credentials: false,
      kickoffBooked: false,
      slackInvited: false,
    },
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Map snake_case DB row to camelCase Project
export function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    servicePillar: row.service_pillar,
    contractValue: Number(row.contract_value || 0),
    currency: row.currency || 'USD',
    status: row.status as ProjectStatus,
    progressPercent: Number(row.progress_percent || 0),
    startDate: row.start_date || '',
    targetLaunchDate: row.target_launch_date || '',
    githubRepoUrl: row.github_repo_url,
    figmaUrl: row.figma_url,
    stagingUrl: row.staging_url,
    milestones: row.milestones || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Map snake_case DB row to camelCase Payment
export function mapPaymentRow(row: any): Payment {
  return {
    id: row.id,
    clientId: row.client_id,
    leadId: row.lead_id,
    amount: Number(row.amount || 0),
    currency: row.currency || 'USD',
    type: row.type,
    status: row.status as PaymentStatus,
    paypalReferenceId: row.paypal_reference_id,
    paymentLink: row.payment_link || '',
    receiptSent: Boolean(row.receipt_sent),
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

// Map snake_case DB row to camelCase PartnerAgency
export function mapPartnerRow(row: any): PartnerAgency {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    specialization: row.specialization,
    defaultCommissionRate: Number(row.default_commission_rate || 10),
    totalReferredLeads: Number(row.total_referred_leads || 0),
    totalCommissionEarned: Number(row.total_commission_earned || 0),
    totalCommissionPaid: Number(row.total_commission_paid || 0),
    createdAt: row.created_at,
  };
}

export const isValidUuid = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

// --- Live Supabase API Handlers ---

export async function fetchLiveLeads(): Promise<Lead[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map(mapLeadRow);
}

export async function createLiveLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead | null> {
  if (!supabase) return null;
  let score = lead.leadScore || 80;
  if (lead.priority === 'Hot') score = 95;
  else if (lead.priority === 'Cold') score = 60;

  const quoteAmt = Number(lead.quoteAmount || 0);
  const autoPaypal = quoteAmt > 0
    ? `https://paypal.me/qdeltastudio/${quoteAmt}${lead.currency || 'USD'}`
    : 'https://paypal.me/qdeltastudio';

  const payload: any = {
    name: lead.name,
    email: lead.email,
    company: lead.company || null,
    phone: lead.phone || null,
    country: lead.country || null,
    service_type: lead.serviceType || 'Landing Pages & High Conversion',
    budget: lead.budget || null,
    timeline: lead.timeline || null,
    details: lead.details || '',
    source: lead.source || 'LinkedIn Outreach',
    status: lead.status || 'New Inquiry',
    assigned_to: lead.assignedTo || null,
    handling_mode: lead.handlingMode || 'In-House',
    paypal_payment_link: lead.paypalPaymentLink || autoPaypal,
    quote_amount: quoteAmt,
    currency: lead.currency || 'USD',
    lead_score: score,
  };

  if (isValidUuid(lead.partnerAgencyId)) {
    payload.partner_agency_id = lead.partnerAgencyId;
  }
  if (lead.referralCommissionRate !== undefined) {
    payload.referral_commission_rate = lead.referralCommissionRate;
  }
  if (lead.referralCommissionAmount !== undefined) {
    payload.referral_commission_amount = lead.referralCommissionAmount;
  }

  let { data, error } = await supabase.from('leads').insert(payload).select().single();

  // If insert failed due to column incompatibility, fallback to essential schema fields
  if (error) {
    const fallbackPayload = {
      name: payload.name,
      email: payload.email,
      company: payload.company,
      phone: payload.phone,
      service_type: payload.service_type,
      budget: payload.budget,
      timeline: payload.timeline,
      details: payload.details,
      source: payload.source,
      status: payload.status,
      assigned_to: payload.assigned_to,
      paypal_payment_link: payload.paypal_payment_link,
      quote_amount: payload.quote_amount,
      currency: payload.currency,
      lead_score: payload.lead_score,
    };
    const retry = await supabase.from('leads').insert(fallbackPayload).select().single();
    if (!retry.error && retry.data) {
      data = retry.data;
      error = null;
    }
  }

  if (error || !data) {
    console.error('Supabase createLiveLead error:', error?.message || error?.details || error);
    return null;
  }
  return mapLeadRow(data);
}

export async function updateLiveLead(id: string, updates: Partial<Lead>): Promise<boolean> {
  if (!supabase) return false;
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.country !== undefined) payload.country = updates.country || null;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.serviceType !== undefined) payload.service_type = updates.serviceType;
  if (updates.budget !== undefined) payload.budget = updates.budget;
  if (updates.timeline !== undefined) payload.timeline = updates.timeline;
  if (updates.details !== undefined) payload.details = updates.details;
  if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
  if (updates.handlingMode !== undefined) payload.handling_mode = updates.handlingMode;
  if (isValidUuid(updates.partnerAgencyId)) payload.partner_agency_id = updates.partnerAgencyId;
  if (updates.referralCommissionRate !== undefined) payload.referral_commission_rate = updates.referralCommissionRate || null;
  if (updates.referralCommissionAmount !== undefined) payload.referral_commission_amount = updates.referralCommissionAmount || null;
  if (updates.quoteAmount !== undefined) payload.quote_amount = updates.quoteAmount;
  if (updates.currency !== undefined) payload.currency = updates.currency;
  if (updates.paypalPaymentLink !== undefined) payload.paypal_payment_link = updates.paypalPaymentLink;

  let { error } = await supabase.from('leads').update(payload).eq('id', id);
  if (error) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.country;
    delete fallbackPayload.handling_mode;
    delete fallbackPayload.partner_agency_id;
    delete fallbackPayload.referral_commission_rate;
    delete fallbackPayload.referral_commission_amount;
    const retry = await supabase.from('leads').update(fallbackPayload).eq('id', id);
    if (!retry.error) error = null;
  }
  return !error;
}

export async function deleteLiveLead(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  return !error;
}

export async function fetchLiveClients(): Promise<Client[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map(mapClientRow);
}

export async function createLiveClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
  if (!supabase) return null;
  const payload: any = {
    organization_name: client.organizationName,
    primary_contact_name: client.primaryContactName,
    email: client.email,
    phone: client.phone,
    country: client.country || null,
    avatar_url: client.avatarUrl,
    tier: client.tier,
    assigned_lead_partner: client.assignedLeadPartner,
    total_ltv: client.totalLtv,
    total_paid: client.totalPaid,
    onboarding_status: client.onboardingStatus,
    notes: client.notes,
  };
  if (isValidUuid(client.leadId)) {
    payload.lead_id = client.leadId;
  }
  let { data, error } = await supabase.from('clients').insert(payload).select().single();
  if (error && payload.country !== undefined) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.country;
    const retry = await supabase.from('clients').insert(fallbackPayload).select().single();
    if (!retry.error && retry.data) {
      data = retry.data;
      error = null;
    }
  }
  if (error || !data) {
    console.error('Supabase createLiveClient error:', error?.message || error?.details || error);
    return null;
  }
  return mapClientRow(data);
}

export async function updateLiveClient(id: string, updates: Partial<Client>): Promise<boolean> {
  if (!supabase) return false;
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.organizationName !== undefined) payload.organization_name = updates.organizationName;
  if (updates.primaryContactName !== undefined) payload.primary_contact_name = updates.primaryContactName;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.country !== undefined) payload.country = updates.country || null;
  if (updates.totalLtv !== undefined) payload.total_ltv = updates.totalLtv;
  if (updates.totalPaid !== undefined) payload.total_paid = updates.totalPaid;
  if (updates.onboardingStatus !== undefined) payload.onboarding_status = updates.onboardingStatus;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  let { error } = await supabase.from('clients').update(payload).eq('id', id);
  if (error && payload.country !== undefined) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.country;
    const retry = await supabase.from('clients').update(fallbackPayload).eq('id', id);
    if (!retry.error) error = null;
  }
  return !error;
}

export async function deleteLiveClient(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  return !error;
}

export async function fetchLiveProjects(): Promise<Project[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map(mapProjectRow);
}

export async function createLiveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
  if (!supabase) return null;
  const payload: any = {
    title: project.title,
    service_pillar: project.servicePillar,
    contract_value: project.contractValue,
    currency: project.currency,
    status: project.status,
    progress_percent: project.progressPercent,
    start_date: project.startDate || null,
    target_launch_date: project.targetLaunchDate || null,
    github_repo_url: project.githubRepoUrl,
    figma_url: project.figmaUrl,
    staging_url: project.stagingUrl,
    milestones: project.milestones,
  };
  if (isValidUuid(project.clientId)) {
    payload.client_id = project.clientId;
  }
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error || !data) return null;
  return mapProjectRow(data);
}

export async function updateLiveProject(id: string, updates: Partial<Project>): Promise<boolean> {
  if (!supabase) return false;
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.progressPercent !== undefined) payload.progress_percent = updates.progressPercent;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.servicePillar !== undefined) payload.service_pillar = updates.servicePillar;
  if (updates.contractValue !== undefined) payload.contract_value = updates.contractValue;
  if (updates.currency !== undefined) payload.currency = updates.currency;
  if (updates.targetLaunchDate !== undefined) payload.target_launch_date = updates.targetLaunchDate;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.githubRepoUrl !== undefined) payload.github_repo_url = updates.githubRepoUrl;
  if (updates.figmaUrl !== undefined) payload.figma_url = updates.figmaUrl;
  if (updates.stagingUrl !== undefined) payload.staging_url = updates.stagingUrl;
  if (updates.milestones !== undefined) payload.milestones = updates.milestones;

  const { error } = await supabase.from('projects').update(payload).eq('id', id);
  return !error;
}

export async function deleteLiveProject(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return !error;
}

export async function fetchLivePayments(): Promise<Payment[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map(mapPaymentRow);
}

export async function createLivePayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment | null> {
  if (!supabase) return null;
  const payload: any = {
    amount: payment.amount,
    currency: payment.currency || 'USD',
    type: payment.type || 'Deposit (50%)',
    status: payment.status || 'Pending',
    paypal_reference_id: payment.paypalReferenceId || null,
    payment_link: payment.paymentLink || null,
    receipt_sent: Boolean(payment.receiptSent),
    paid_at: payment.paidAt || null,
  };
  if (isValidUuid(payment.clientId)) {
    payload.client_id = payment.clientId;
  }
  if (isValidUuid(payment.leadId)) {
    payload.lead_id = payment.leadId;
  }
  const { data, error } = await supabase.from('payments').insert(payload).select().single();
  if (error || !data) return null;
  return mapPaymentRow(data);
}

export async function updateLivePayment(id: string, updates: Partial<Payment>): Promise<boolean> {
  if (!supabase) return false;
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.paidAt !== undefined) payload.paid_at = updates.paidAt;
  if (updates.paypalReferenceId !== undefined) payload.paypal_reference_id = updates.paypalReferenceId;
  if (updates.receiptSent !== undefined) payload.receipt_sent = updates.receiptSent;
  if (updates.paymentLink !== undefined) payload.payment_link = updates.paymentLink;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.currency !== undefined) payload.currency = updates.currency;

  const { error } = await supabase.from('payments').update(payload).eq('id', id);
  return !error;
}

export async function deleteLivePayment(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('payments').delete().eq('id', id);
  return !error;
}

export async function fetchLivePartners(): Promise<PartnerAgency[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('partner_agencies').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map(mapPartnerRow);
}

export async function createLivePartner(
  partner: Omit<PartnerAgency, 'id' | 'createdAt' | 'totalReferredLeads' | 'totalCommissionEarned' | 'totalCommissionPaid'>
): Promise<PartnerAgency | null> {
  if (!supabase) return null;
  const payload = {
    name: partner.name,
    contact_person: partner.contactPerson,
    email: partner.email,
    specialization: partner.specialization,
    default_commission_rate: partner.defaultCommissionRate || 10,
    total_referred_leads: 0,
    total_commission_earned: 0,
    total_commission_paid: 0,
  };
  const { data, error } = await supabase.from('partner_agencies').insert(payload).select().single();
  if (error || !data) {
    console.error('Supabase createLivePartner error:', error);
    return null;
  }
  return mapPartnerRow(data);
}

export async function updateLivePartner(id: string, updates: Partial<PartnerAgency>): Promise<boolean> {
  if (!supabase) return false;
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.contactPerson !== undefined) payload.contact_person = updates.contactPerson;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.specialization !== undefined) payload.specialization = updates.specialization;
  if (updates.defaultCommissionRate !== undefined) payload.default_commission_rate = updates.defaultCommissionRate;
  if (updates.totalReferredLeads !== undefined) payload.total_referred_leads = updates.totalReferredLeads;
  if (updates.totalCommissionEarned !== undefined) payload.total_commission_earned = updates.totalCommissionEarned;
  if (updates.totalCommissionPaid !== undefined) payload.total_commission_paid = updates.totalCommissionPaid;

  const { error } = await supabase.from('partner_agencies').update(payload).eq('id', id);
  return !error;
}

export async function deleteLivePartner(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('partner_agencies').delete().eq('id', id);
  return !error;
}

// --- Lead Activities Handlers (Audit Trail) ---

export function mapLeadActivityRow(row: any): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    clientId: row.client_id || undefined,
    actionType: row.action_type || 'note_added',
    title: row.title,
    description: row.description,
    performedBy: row.performed_by || 'Nagireddy Sai Prabhath',
    createdAt: row.created_at,
  };
}

export async function fetchLiveLeadActivities(leadId?: string, clientId?: string): Promise<LeadActivity[] | null> {
  if (!supabase) return null;
  let query = supabase.from('lead_activities').select('*').order('created_at', { ascending: false });
  if (leadId && isValidUuid(leadId)) {
    query = query.eq('lead_id', leadId);
  } else if (clientId && isValidUuid(clientId)) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query;
  if (error || !data) return null;
  return data.map(mapLeadActivityRow);
}

export async function createLiveLeadActivity(
  activity: Omit<LeadActivity, 'id' | 'createdAt'>
): Promise<LeadActivity | null> {
  if (!supabase) return null;
  const payload: any = {
    action_type: activity.actionType || 'note_added',
    title: activity.title,
    description: activity.description,
    performed_by: activity.performedBy || 'Nagireddy Sai Prabhath',
  };
  if (isValidUuid(activity.leadId)) {
    payload.lead_id = activity.leadId;
  }
  if (isValidUuid(activity.clientId)) {
    payload.client_id = activity.clientId;
  }
  const { data, error } = await supabase.from('lead_activities').insert(payload).select().single();
  if (error || !data) {
    console.error('Supabase createLiveLeadActivity error:', error?.message || error);
    return null;
  }
  return mapLeadActivityRow(data);
}

export async function deleteLiveLeadActivities(leadId: string): Promise<boolean> {
  if (!supabase) return false;
  if (!isValidUuid(leadId)) return false;
  const { error } = await supabase.from('lead_activities').delete().eq('lead_id', leadId);
  return !error;
}



