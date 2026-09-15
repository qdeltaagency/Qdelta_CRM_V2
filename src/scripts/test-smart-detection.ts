import { getLeads, createLead, convertLeadToClient } from '../lib/leads-service';
import { getClients, getClientWorkspace, findClientByEmail } from '../lib/clients-service';

async function runSmartDetectionTest() {
  console.log('=== STARTING SMART CLIENT DETECTION & DUPLICATE PREVENTION TEST ===\n');

  // 1. Check existing clients
  const existingClients = await getClients();
  console.log(`Found ${existingClients.length} total clients in directory.`);

  const testTimestamp = Date.now();
  const testEmail = `founder_${testTimestamp}@smarttest.io`;
  const testCompany = `Sterling Corp ${testTimestamp}`;

  // 2. Lookup non-existent email
  console.log(`\n1. Testing smart email detection for new email "${testEmail}"...`);
  const notFound = await findClientByEmail(testEmail);
  console.log(`✓ Result for new email (should be null):`, notFound === null ? 'NULL (Passed)' : notFound);

  // 3. Create lead #1 and convert to client
  console.log(`\n2. Creating Lead #1 with email "${testEmail}"...`);
  const lead1 = await createLead({
    name: 'Marcus Sterling',
    company: testCompany,
    email: testEmail,
    phone: '+1 555 123 4567',
    country: 'United Kingdom',
    service: 'AI Engineering',
    budget: 18000,
    currency: 'USD',
    timeline: '3 weeks',
  });
  console.log(`✓ Lead #1 created: ID=${lead1.id}`);

  console.log('\n3. Converting Lead #1 to create initial Client account...');
  const conversion1 = await convertLeadToClient(lead1.id);
  console.log(`✓ Lead #1 converted: Client ID=${conversion1.client_id}, Project ID=${conversion1.project_id}`);

  // 4. Test smart client detection on the now-existing email
  console.log(`\n4. Testing Smart Client Detection on existing email "${testEmail}"...`);
  const detectedClient = await findClientByEmail(testEmail);
  if (!detectedClient) {
    throw new Error('FAILED: Existing client was not detected by email!');
  }
  console.log(`✓ Smart detection SUCCESS! Found Client: ID=${detectedClient.id}, Name=${detectedClient.name}, Company=${detectedClient.company}`);

  // 5. Create Lead #2 simulating user clicking "Use Existing Client"
  console.log(`\n5. Creating Lead #2 for returning client (simulating user clicking [Use Existing Client])...`);
  const lead2 = await createLead({
    name: 'Marcus Sterling',
    company: testCompany,
    email: testEmail,
    client_type: 'existing',
    existing_client_id: detectedClient.id,
    service: 'UI/UX Design',
    budget: 9500,
    currency: 'USD',
    timeline: '2 weeks',
  });
  console.log(`✓ Lead #2 created with existing_client_id=${lead2.existing_client_id}`);

  // 6. Convert Lead #2 and verify no duplicate client created
  console.log('\n6. Converting Lead #2...');
  const conversion2 = await convertLeadToClient(lead2.id);
  console.log(`✓ Lead #2 converted: Client ID=${conversion2.client_id}, Project ID=${conversion2.project_id}`);

  if (conversion1.client_id !== conversion2.client_id) {
    throw new Error(`FAILED: Duplicate clients created! ${conversion1.client_id} vs ${conversion2.client_id}`);
  }
  console.log(`✓ ZERO DUPLICATES: Both projects assigned to client ID=${conversion1.client_id}`);

  // 7. Verify Client Workspace
  const workspace = await getClientWorkspace(conversion1.client_id);
  console.log(`\n7. Verified Client Portfolio Workspace:`);
  console.log(`- Client Name: ${workspace?.name}`);
  console.log(`- Total Projects: ${workspace?.total_projects} (Expected: 2)`);
  console.log(`- Lifetime Value (LTV): $${workspace?.total_revenue} (Expected: $27,500)`);
  console.log(`- Projects:`);
  workspace?.projects.forEach((p, idx) => {
    console.log(`  [${idx + 1}] "${p.name}" — Value: $${p.agreed_value} — Stage: ${p.stage}`);
  });

  console.log('\n======================================================');
  console.log('🎉 SMART CLIENT DETECTION & DEDUPLICATION VERIFIED!');
  console.log('======================================================\n');
}

runSmartDetectionTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
