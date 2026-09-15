import { supabase } from './supabase';

export type ProjectStage =
  | 'planning'
  | 'design'
  | 'development'
  | 'client_review'
  | 'ready_for_delivery'
  | 'handover'
  | 'completed';

export interface ProjectMilestone {
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

export interface ProjectItem {
  id: string;
  name: string;
  service_type: string | null;
  stage: ProjectStage;
  agreed_value: number;
  currency: string;
  timeline: string | null;
  requirements: string | null;
  domain_status: string | null;
  created_at: string;
  is_draft: boolean;
  client_id: string | null;
  lead_id: string | null;
  clients?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  } | null;
  payment_milestones?: ProjectMilestone[];
}

export const PROJECT_STAGES: { value: ProjectStage; label: string; order: number }[] = [
  { value: 'planning', label: 'Planning', order: 1 },
  { value: 'design', label: 'Design', order: 2 },
  { value: 'development', label: 'Development', order: 3 },
  { value: 'client_review', label: 'Client Review (Milestone 2 Gate)', order: 4 },
  { value: 'ready_for_delivery', label: 'Ready For Delivery (Milestone 3 Gate)', order: 5 },
  { value: 'handover', label: 'Handover', order: 6 },
  { value: 'completed', label: 'Completed', order: 7 },
];

/**
 * Fetch all active non-draft projects
 */
export async function getProjects(): Promise<ProjectItem[]> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabase
    .from('projects')
    .select(`
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
      is_draft,
      client_id,
      lead_id,
      clients (
        id,
        name,
        company,
        email
      ),
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
    `)
    .eq('is_draft', false) // Only show active converted projects
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    ...p,
    payment_milestones: (p.payment_milestones || []).sort(
      (a: any, b: any) => a.milestone_number - b.milestone_number
    ),
  }));
}

/**
 * Update project stage with payment gating rules:
 * - Second 35% unpaid blocks transition into 'ready_for_delivery' or later.
 * - Final 35% unpaid blocks transition into 'handover' / 'completed'.
 */
export async function updateProjectStage(
  project: ProjectItem,
  newStage: ProjectStage
): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const ms = project.payment_milestones || [];
  const ms2 = ms.find((m) => m.milestone_number === 2);
  const ms3 = ms.find((m) => m.milestone_number === 3);

  // Gate 1: Progression into 'ready_for_delivery' requires Milestone 2 to be paid
  if (['ready_for_delivery', 'handover', 'completed'].includes(newStage)) {
    if (ms2 && ms2.status !== 'paid') {
      throw new Error(
        'Stage Transition Blocked: Milestone #2 (35%) must be paid before moving past Client Review into Delivery/Handover.'
      );
    }
  }

  // Gate 2: Progression into 'handover' / 'completed' requires Milestone 3 to be paid
  if (['handover', 'completed'].includes(newStage)) {
    if (ms3 && ms3.status !== 'paid') {
      throw new Error(
        'Stage Transition Blocked: Final Milestone #3 (35%) must be settled before Handover & Completion.'
      );
    }
  }

  const { error } = await supabase
    .from('projects')
    .update({ stage: newStage })
    .eq('id', project.id);

  if (error) {
    console.error('Error updating project stage:', error);
    throw error;
  }
}
