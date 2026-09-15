import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  generateDocumentToken,
} from '../lib/documents-service';
import { renderDocumentHtml, DocumentData } from '../lib/document-templates';

// Simple .env.local reader
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = trimmed.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
      }
      if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseKey = trimmed.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (err) {
    console.warn('Could not read .env.local file directly');
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('=== Q Delta CRM Document Flow Test ===');

  // 1. Check DB Connection
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, agreed_value, currency, client_id, clients(*)')
    .limit(1);

  if (projErr || !projects || projects.length === 0) {
    console.error('Error fetching project for test:', projErr);
    return;
  }

  const project = projects[0];
  console.log(`Found test project: "${project.name}" (ID: ${project.id})`);

  const clientObj: any = Array.isArray(project.clients) ? project.clients[0] : project.clients;

  // 2. Insert Test Proposal Document
  const token = generateDocumentToken();
  const docNumber = `TEST-PROP-${Date.now().toString(36).toUpperCase()}`;

  const { data: insertedDoc, error: insertErr } = await supabase
    .from('documents')
    .insert([
      {
        name: `Technical Architecture Proposal - ${project.name}`,
        type: 'proposal',
        project_id: project.id,
        client_id: project.client_id || clientObj?.id || null,
        status: 'generated',
        public_token: token,
        metadata: {
          document_number: docNumber,
          agreed_value: project.agreed_value || 12000,
          currency: project.currency || 'USD',
          service_type: 'Full-Stack Web & AI Application',
          timeline: '4 Weeks',
          client_name: clientObj?.name || 'Test Client',
          client_company: clientObj?.company || 'Test Corp',
          milestone_percentage: 30,
          milestone_amount: 3600,
        },
      },
    ])
    .select()
    .single();

  if (insertErr) {
    console.error('Failed to insert test document:', insertErr);
    return;
  }

  console.log('✓ Successfully created proposal document:', insertedDoc.id);
  console.log('✓ Public Token generated:', insertedDoc.public_token);

  // 3. Fetch Document by Token
  const { data: fetchedDoc, error: fetchErr } = await supabase
    .from('documents')
    .select('*, projects(*), clients(*)')
    .eq('public_token', token)
    .single();

  if (fetchErr || !fetchedDoc) {
    console.error('Failed to fetch document by token:', fetchErr);
    return;
  }
  console.log('✓ Successfully retrieved document via public token route verification!');

  // 4. Test HTML Template Renderer
  const templateData: DocumentData = {
    documentId: fetchedDoc.id,
    documentNumber: docNumber,
    documentType: 'proposal',
    title: fetchedDoc.name,
    createdDate: fetchedDoc.created_at,
    clientName: fetchedDoc.clients?.name || 'Test Client',
    clientCompany: fetchedDoc.clients?.company || 'Test Corp',
    projectName: project.name,
    serviceType: 'Full-Stack Web & AI Application',
    timeline: '4 Weeks',
    agreedValue: project.agreed_value || 12000,
    currency: project.currency || 'USD',
    milestoneNumber: 1,
    milestonePercentage: 30,
    milestoneAmount: 3600,
  };

  const htmlOutput = renderDocumentHtml(templateData);
  console.log(`✓ Generated Document HTML successfully (${htmlOutput.length} bytes rendered)!`);

  // 5. Clean up test record
  await supabase.from('documents').delete().eq('id', insertedDoc.id);
  console.log('✓ Cleaned up test document record.');

  console.log('=== All Document Flow Tests PASSED ===');
}

runTest().catch(console.error);
