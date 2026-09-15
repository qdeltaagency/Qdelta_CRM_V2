import { supabase } from '../lib/supabase';
import {
  createLead,
  convertLeadToClient,
} from '../lib/leads-service';
import {
  getClients,
  getClientWorkspace,
} from '../lib/clients-service';

async function testClientUniquenessAndMultiProjectConversion() {
  console.log('=== STARTING CLIENT UNIQUENESS & CONVERSION VERIFICATION ===\n');

  const uniqueSuffix = Date.now();
  const testEmail = `founder_${uniqueSuffix}@nexusprime.io`;
  const clientName = 'Elena Rostova';
  const companyName = 'Nexus Prime AI';

  // 1. Create Lead #1 (New Client)
  console.log('1. Creating Lead #1 (Brand New Client)...');
  const lead1 = await createLead({
    name: clientName,
    company: companyName,
    email: testEmail,
    phone: '+1 415 999 1122',
    country: 'United States',
    service: 'AI Engineering',
    source_type: 'manual',
    source_platform: 'linkedin',
    client_type: 'new',
    budget: 15000,
    currency: 'USD',
    timeline: '3 weeks',
    requirements: 'Phase 1: Agent orchestration core platform.',
  });
  console.log(`✓ Lead #1 created: ID=${lead1.id}, Name=${lead1.name}, Email=${lead1.email}`);

  // 2. Convert Lead #1
  console.log('\n2. Converting Lead #1 to Client...');
  const res1 = await convertLeadToClient(lead1.id);
  console.log(`✓ Lead #1 converted: Client ID=${res1.client_id}, Project #1 ID=${res1.project_id}`);

  // Verify client workspace after first conversion
  const workspace1 = await getClientWorkspace(res1.client_id);
  if (!workspace1) throw new Error('Client workspace not found!');
  console.log(`✓ Client Workspace after Project #1:`);
  console.log(`  - Client Name: ${workspace1.name}`);
  console.log(`  - Total Projects: ${workspace1.total_projects}`);
  console.log(`  - Lifetime Value (LTV): $${workspace1.total_revenue}`);

  if (workspace1.total_projects !== 1 || workspace1.total_revenue !== 15000) {
    throw new Error(`Expected 1 project and $15000 LTV, got ${workspace1.total_projects} projects and $${workspace1.total_revenue}`);
  }

  // 3. Create Lead #2 for the SAME returning client (Existing Client)
  console.log('\n3. Creating Lead #2 for Returning Client (linking to existing_client_id)...');
  const lead2 = await createLead({
    name: clientName,
    company: companyName,
    email: testEmail,
    phone: '+1 415 999 1122',
    country: 'United States',
    service: 'UI/UX Design',
    source_type: 'manual',
    source_platform: 'referral',
    client_type: 'existing',
    existing_client_id: res1.client_id,
    budget: 8000,
    currency: 'USD',
    timeline: '2 weeks',
    requirements: 'Phase 2: Custom Dashboard Design System.',
  });
  console.log(`✓ Lead #2 created: ID=${lead2.id}, Tagged as existing_client_id=${lead2.existing_client_id}`);

  // 4. Convert Lead #2
  console.log('\n4. Converting Lead #2...');
  const res2 = await convertLeadToClient(lead2.id);
  console.log(`✓ Lead #2 converted: Client ID=${res2.client_id}, Project #2 ID=${res2.project_id}`);

  // 5. Verify NO duplicate client was created
  if (res2.client_id !== res1.client_id) {
    throw new Error(`Duplicate client created! Expected ${res1.client_id} but got ${res2.client_id}`);
  }
  console.log(`✓ VERIFIED: Both projects are assigned to the EXACT same Client ID (${res1.client_id})!`);

  // 6. Verify Client Workspace has 2 projects and cumulative revenue ($15,000 + $8,000 = $23,000)
  console.log('\n5. Verifying Cumulative Client Workspace & Portfolio...');
  const workspace2 = await getClientWorkspace(res1.client_id);
  if (!workspace2) throw new Error('Workspace not found after second project!');

  console.log(`✓ Updated Client Workspace:`);
  console.log(`  - Total Projects: ${workspace2.total_projects}`);
  console.log(`  - Active Projects: ${workspace2.active_projects}`);
  console.log(`  - Lifetime Value (LTV): $${workspace2.total_revenue}`);
  console.log(`  - Projects in container:`);
  workspace2.projects.forEach((p, idx) => {
    console.log(`    [${idx + 1}] "${p.name}" — Service: ${p.service_type} — Value: $${p.agreed_value} — Stage: ${p.stage}`);
  });

  if (workspace2.total_projects !== 2) {
    throw new Error(`Expected total_projects to be 2, got ${workspace2.total_projects}`);
  }
  if (workspace2.total_revenue !== 23000) {
    throw new Error(`Expected total_revenue to be $23000, got $${workspace2.total_revenue}`);
  }

  // 7. Verify Global Clients List has NO duplicate row for this email
  console.log('\n6. Checking Global Clients Directory for duplicates...');
  const allClients = await getClients();
  const matchingClients = allClients.filter(
    (c) => c.email?.toLowerCase() === testEmail.toLowerCase()
  );

  console.log(`✓ Total matching clients with email "${testEmail}": ${matchingClients.length}`);
  if (matchingClients.length !== 1) {
    throw new Error(`Duplicate client row detected in clients list! Count: ${matchingClients.length}`);
  }

  console.log('\n======================================================');
  console.log('🎉 CLIENT UNIQUENESS & MULTI-PROJECT INTEGRITY VERIFIED!');
  console.log('======================================================\n');
}

testClientUniquenessAndMultiProjectConversion().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
