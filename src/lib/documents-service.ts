import { supabase } from './supabase';
import { PaymentMilestone } from './payments-service';

export type DocumentType =
  | 'proposal'
  | 'invoice'
  | 'receipt'
  | 'agreement'
  | 'client_agreement'
  | 'nda'
  | 'terms'
  | 'handover';

export type DocumentStatus =
  | 'draft'
  | 'generated'
  | 'sent'
  | 'accepted'
  | 'completed';

export interface DocumentRecord {
  id: string;
  client_id: string | null;
  project_id: string | null;
  lead_id: string | null;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  file_url: string | null;
  public_token: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at?: string;
  projects?: {
    id: string;
    name: string;
    stage: string;
    agreed_value?: number;
    currency?: string;
    client_id?: string | null;
  } | null;
  clients?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    country?: string | null;
  } | null;
}

/**
 * Generate a random 16-byte hex token for public URLs
 */
export function generateDocumentToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Fetch all documents with project and client info
 */
export async function getDocuments(): Promise<DocumentRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return (data || []) as DocumentRecord[];
}

/**
 * Fetch documents for a specific project
 */
export async function getProjectDocuments(projectId: string): Promise<DocumentRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching documents for project ${projectId}:`, error);
    return [];
  }

  return (data || []) as DocumentRecord[];
}

/**
 * Fetch single document by public token
 */
export async function getDocumentByToken(token: string): Promise<DocumentRecord | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('Error fetching document by token:', error);
    return null;
  }

  return data as DocumentRecord | null;
}

/**
 * Fetch single document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching document by id:', error);
    return null;
  }

  return data as DocumentRecord | null;
}

/**
 * Create a new document in the database
 */
export async function createDocument(params: {
  name: string;
  type: DocumentType;
  project_id?: string | null;
  client_id?: string | null;
  lead_id?: string | null;
  status?: DocumentStatus;
  metadata?: Record<string, any>;
  file_url?: string | null;
}): Promise<DocumentRecord> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const token = generateDocumentToken();
  const insertPayload = {
    name: params.name,
    type: params.type,
    project_id: params.project_id || null,
    client_id: params.client_id || null,
    lead_id: params.lead_id || null,
    status: params.status || 'generated',
    file_url: params.file_url || null,
    public_token: token,
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('documents')
    .insert([insertPayload])
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  // Activity log
  try {
    await supabase.from('activities').insert([
      {
        project_id: params.project_id || null,
        client_id: params.client_id || null,
        lead_id: params.lead_id || null,
        type: 'document_created',
        description: `Generated ${params.type.toUpperCase()}: "${params.name}"`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity for document creation:', actErr);
  }

  return data as DocumentRecord;
}

/**
 * Update document status (e.g., mark sent, accepted, signed)
 */
export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  extraMetadata?: Record<string, any>
): Promise<DocumentRecord> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  // Fetch existing document to merge metadata
  const { data: existing } = await supabase
    .from('documents')
    .select('metadata, type, name, project_id, client_id')
    .eq('id', id)
    .single();

  const mergedMetadata = {
    ...(existing?.metadata || {}),
    ...(extraMetadata || {}),
    [`${status}_at`]: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('documents')
    .update({
      status,
      metadata: mergedMetadata,
    })
    .eq('id', id)
    .select(`
      *,
      projects (
        id,
        name,
        stage,
        agreed_value,
        currency,
        client_id
      ),
      clients (
        id,
        name,
        company,
        email,
        phone,
        country
      )
    `)
    .single();

  if (error) {
    console.error('Error updating document status:', error);
    throw error;
  }

  // Activity log
  try {
    await supabase.from('activities').insert([
      {
        project_id: existing?.project_id || null,
        client_id: existing?.client_id || null,
        type: 'document_status_changed',
        description: `Document "${existing?.name || id}" status updated to ${status.toUpperCase()}`,
      },
    ]);
  } catch (actErr) {
    console.warn('Could not log activity for document update:', actErr);
  }

  return data as DocumentRecord;
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Automatically generates an invoice document for a ready milestone if not already created
 */
export async function generateMilestoneInvoice(
  milestone: PaymentMilestone
): Promise<DocumentRecord | null> {
  if (!supabase) return null;

  try {
    // Check if an invoice document already exists for this milestone
    const { data: existing } = await supabase
      .from('documents')
      .select('id, public_token')
      .eq('project_id', milestone.project_id)
      .eq('type', 'invoice')
      .contains('metadata', { milestone_id: milestone.id })
      .maybeSingle();

    if (existing) {
      return (await getDocumentById(existing.id));
    }

    const docNumber = `INV-${new Date().getFullYear()}-${String(milestone.milestone_number).padStart(3, '0')}${Math.floor(100 + Math.random() * 900)}`;
    const milestoneTitle =
      milestone.milestone_number === 1
        ? `Deposit (Initial Kickoff ${milestone.percentage}%)`
        : milestone.milestone_number === 2
        ? `Milestone Beta Delivery (${milestone.percentage}%)`
        : `Final Handover & Launch (${milestone.percentage}%)`;

    const docName = `Invoice #${docNumber} - ${milestone.projects?.name || 'Project'} (${milestone.percentage}%)`;

    const created = await createDocument({
      name: docName,
      type: 'invoice',
      project_id: milestone.project_id,
      client_id: milestone.projects?.client_id || null,
      lead_id: milestone.projects?.lead_id || null,
      status: 'generated',
      metadata: {
        milestone_id: milestone.id,
        milestone_number: milestone.milestone_number,
        milestone_percentage: milestone.percentage,
        milestone_amount: milestone.amount,
        milestone_title: milestoneTitle,
        document_number: docNumber,
        currency: milestone.projects?.currency || 'USD',
        payment_link: `/pay/${milestone.id}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    return created;
  } catch (err) {
    console.error('Error auto-generating milestone invoice:', err);
    return null;
  }
}

/**
 * Automatically generates a receipt document when a milestone is marked paid
 */
export async function generateMilestoneReceipt(
  milestone: PaymentMilestone,
  transactionRef?: string
): Promise<DocumentRecord | null> {
  if (!supabase) return null;

  try {
    // Check if a receipt document already exists for this milestone
    const { data: existing } = await supabase
      .from('documents')
      .select('id, public_token')
      .eq('project_id', milestone.project_id)
      .eq('type', 'receipt')
      .contains('metadata', { milestone_id: milestone.id })
      .maybeSingle();

    if (existing) {
      return (await getDocumentById(existing.id));
    }

    const docNumber = `RCT-${new Date().getFullYear()}-${String(milestone.milestone_number).padStart(3, '0')}${Math.floor(100 + Math.random() * 900)}`;
    const txId = transactionRef || `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const docName = `Receipt #${docNumber} - ${milestone.projects?.name || 'Project'} (${milestone.percentage}%)`;

    const created = await createDocument({
      name: docName,
      type: 'receipt',
      project_id: milestone.project_id,
      client_id: milestone.projects?.client_id || null,
      lead_id: milestone.projects?.lead_id || null,
      status: 'completed',
      metadata: {
        milestone_id: milestone.id,
        milestone_number: milestone.milestone_number,
        milestone_percentage: milestone.percentage,
        milestone_amount: milestone.amount,
        document_number: docNumber,
        currency: milestone.projects?.currency || 'USD',
        transaction_ref: txId,
        paid_at: new Date().toISOString(),
      },
    });

    return created;
  } catch (err) {
    console.error('Error auto-generating milestone receipt:', err);
    return null;
  }
}
