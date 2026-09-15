import { supabase } from './supabase';

export interface ClientProjectMilestone {
  id: string;
  milestone_number: number;
  percentage: number;
  amount: number;
  status: string;
  payment_link: string | null;
  paid_at: string | null;
  unlocked_at: string | null;
  requested_at: string | null;
}

export interface ClientProject {
  id: string;
  name: string;
  service_type: string | null;
  stage: string;
  agreed_value: number;
  currency: string;
  timeline: string | null;
  requirements: string | null;
  domain_status: string | null;
  created_at: string;
  completed_at?: string | null;
  is_draft: boolean;
  payment_milestones?: ClientProjectMilestone[];
}

export interface ClientWorkspaceData {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  lead_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_revenue: number; // LTV
  active_value: number;
  currency: string;
  milestone_summary: {
    milestone_1_count: number;
    milestone_2_count: number;
    milestone_3_count: number;
  };
  projects: ClientProject[];
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  lead_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  total_projects_count: number;
  active_projects_count: number;
  lifetime_value: number;
  currency: string;
  projects?: ClientProject[];
}

/**
 * Fetch all clients with project counts, computed lifetime values, and 30-day lifecycle status
 */
export async function getClients(): Promise<Client[]> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      company,
      email,
      phone,
      country,
      lead_id,
      status,
      created_at,
      projects (
        id,
        name,
        service_type,
        stage,
        agreed_value,
        currency,
        timeline,
        created_at,
        completed_at,
        is_draft,
        payment_milestones (
          id,
          milestone_number,
          percentage,
          amount,
          status,
          paid_at
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  const rawClients = data || [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  return rawClients.map((c: any) => {
    const allProjects: ClientProject[] = (c.projects || []).filter(
      (p: any) => !p.is_draft
    );
    const totalCount = allProjects.length;
    const activeCount = allProjects.filter((p) => p.stage !== 'completed').length;
    const ltv = allProjects.reduce((acc, p) => acc + (Number(p.agreed_value) || 0), 0);
    const currency = allProjects[0]?.currency || 'USD';

    // 30-Day Post-Completion Inactive Lifecycle Calculation
    let effectiveStatus: 'active' | 'inactive' = c.status || 'active';
    if (activeCount > 0) {
      effectiveStatus = 'active';
    } else if (totalCount > 0) {
      const latestProjectTime = allProjects.reduce((latest, p) => {
        const time = p.completed_at
          ? new Date(p.completed_at).getTime()
          : new Date(p.created_at).getTime();
        return Math.max(latest, time);
      }, 0);

      const isWithin30Days = now - latestProjectTime < thirtyDaysMs;
      effectiveStatus = isWithin30Days ? 'active' : 'inactive';
    }

    return {
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      country: c.country,
      lead_id: c.lead_id,
      status: effectiveStatus,
      created_at: c.created_at,
      total_projects_count: totalCount,
      active_projects_count: activeCount,
      lifetime_value: ltv,
      currency,
      projects: allProjects,
    };
  });
}

/**
 * Fetch a single client and their complete project container for dedicated workspace
 */
export async function getClientWorkspace(clientId: string): Promise<ClientWorkspaceData | null> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      company,
      email,
      phone,
      country,
      lead_id,
      status,
      created_at,
      projects (
        id,
        name,
        service_type,
        stage,
        agreed_value,
        currency,
        timeline,
        requirements,
        domain_status,
        created_at,
        completed_at,
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
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client workspace:', error);
    throw error;
  }

  if (!data) return null;

  const allProjects: ClientProject[] = (data.projects || [])
    .filter((p: any) => !p.is_draft)
    .map((p: any) => ({
      ...p,
      payment_milestones: (p.payment_milestones || []).sort(
        (a: any, b: any) => a.milestone_number - b.milestone_number
      ),
    }));

  const total_projects = allProjects.length;
  const active_projects = allProjects.filter((p) => p.stage !== 'completed').length;
  const completed_projects = allProjects.filter((p) => p.stage === 'completed').length;
  const total_revenue = allProjects.reduce((acc, p) => acc + (Number(p.agreed_value) || 0), 0);
  const active_value = allProjects
    .filter((p) => p.stage !== 'completed')
    .reduce((acc, p) => acc + (Number(p.agreed_value) || 0), 0);

  const currency = allProjects[0]?.currency || 'USD';

  // 30-Day Post-Completion Inactive Lifecycle Calculation
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  let effectiveStatus: 'active' | 'inactive' = data.status || 'active';

  if (active_projects > 0) {
    effectiveStatus = 'active';
  } else if (total_projects > 0) {
    const latestProjectTime = allProjects.reduce((latest, p) => {
      const time = p.completed_at
        ? new Date(p.completed_at).getTime()
        : new Date(p.created_at).getTime();
      return Math.max(latest, time);
    }, 0);

    const isWithin30Days = now - latestProjectTime < thirtyDaysMs;
    effectiveStatus = isWithin30Days ? 'active' : 'inactive';
  }

  // Calculate milestone summary
  let milestone_1_count = 0;
  let milestone_2_count = 0;
  let milestone_3_count = 0;

  for (const proj of allProjects) {
    const ms = proj.payment_milestones || [];
    const ms1 = ms.find((m) => m.milestone_number === 1);
    const ms2 = ms.find((m) => m.milestone_number === 2);
    const ms3 = ms.find((m) => m.milestone_number === 3);

    if (ms1?.status !== 'paid') {
      milestone_1_count += 1;
    } else if (ms2?.status !== 'paid') {
      milestone_2_count += 1;
    } else if (ms3?.status !== 'paid') {
      milestone_3_count += 1;
    } else {
      // All paid
      milestone_3_count += 1;
    }
  }

  return {
    id: data.id,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    country: data.country,
    lead_id: data.lead_id,
    status: effectiveStatus,
    created_at: data.created_at,
    total_projects,
    active_projects,
    completed_projects,
    total_revenue,
    active_value,
    currency,
    milestone_summary: {
      milestone_1_count,
      milestone_2_count,
      milestone_3_count,
    },
    projects: allProjects,
  };
}

/**
 * Update client status (active / inactive)
 */
export async function updateClientStatus(
  clientId: string,
  status: 'active' | 'inactive'
): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { error } = await supabase
    .from('clients')
    .update({ status })
    .eq('id', clientId);

  if (error) {
    console.error('Error updating client status:', error);
    throw error;
  }
}

/**
 * Lookup existing client by email (case-insensitive) for smart client detection
 */
export async function findClientByEmail(email: string): Promise<Client | null> {
  if (!supabase || !email || !email.trim()) return null;

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) return null;

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, company, email, phone, country, status')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Error finding client by email:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      country: data.country,
      lead_id: null,
      status: data.status,
      created_at: '',
      total_projects_count: 0,
      active_projects_count: 0,
      lifetime_value: 0,
      currency: 'USD',
    };
  } catch (err) {
    console.error('Error in findClientByEmail:', err);
    return null;
  }
}

