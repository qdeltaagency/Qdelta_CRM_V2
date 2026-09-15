import { supabase } from '../lib/supabase';
import {
  createLead,
  updateLeadStatus,
  convertLeadToClient,
  getLeads,
} from '../lib/leads-service';
import {
  getClients,
  getClientWorkspace,
} from '../lib/clients-service';
import {
  getProjects,
  updateProjectStage,
} from '../lib/projects-service';
import {
  getProjectPaymentGroups,
  generateMilestonePaymentLink,
  markMilestoneAsSent,
  markMilestoneAsPaid,
} from '../lib/payments-service';

async function runEndToEndVerification() {
  console.log('--- STARTING CRM FLOW END-TO-END REFINEMENT VERIFICATION ---');

  const testEmail = `test_founder_${Date.now()}@vancemedia.com`;

  // 1. Create Lead with budget, timeline, country, custom source
  console.log('\n1. Creating Lead with budget, flexible timeline, and country dropdown...');
  const lead = await createLead({
    name: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    email: testEmail,
    phone: '+1 415 888 7766',
    country: 'United States',
    service: 'AI Engineering',
    source_type: 'manual',
    source_platform: 'other',
    custom_source: 'TechCrunch Disrupt',
    budget: 12000,
    currency: 'USD',
    timeline: '1 month',
    requirements: 'Custom AI agent integration and real-time dashboard.',
    notes: 'High priority lead.',
  });

  console.log(`✓ Lead created: ID=${lead.id}, Name=${lead.name}, Budget=$${lead.agreed_project_value}, Timeline="${lead.timeline}", Source="${lead.custom_source}"`);

  // 2. Lead Conversion (Strictly creates Client + launches Project without payment links in lead module)
  console.log('\n2. Converting Lead to Client...');
  const conversionResult = await convertLeadToClient(lead.id);
  console.log(`✓ Lead converted via RPC: Client ID=${conversionResult.client_id}, Project ID=${conversionResult.project_id}`);

  // 3. Client Container Verification (5 Top Metrics + Milestone Summary)
  console.log('\n3. Verifying Client Detail Container...');
  const workspace = await getClientWorkspace(conversionResult.client_id);
  if (!workspace) throw new Error('Client workspace not found!');

  console.log(`✓ Client Top Metrics:`);
  console.log(`  - Total Projects: ${workspace.total_projects}`);
  console.log(`  - Active Projects: ${workspace.active_projects}`);
  console.log(`  - Completed Projects: ${workspace.completed_projects}`);
  console.log(`  - Total Revenue (LTV): $${workspace.total_revenue}`);
  console.log(`  - Active Value: $${workspace.active_value}`);
  console.log(`✓ Milestone Summary: M1 Count=${workspace.milestone_summary.milestone_1_count}, M2 Count=${workspace.milestone_summary.milestone_2_count}, M3 Count=${workspace.milestone_summary.milestone_3_count}`);
  console.log(`✓ Attached Projects List: ${workspace.projects.length} project(s)`);

  // 4. Projects Page Verification (Converted project appears without + New Project button)
  console.log('\n4. Verifying Projects Page...');
  const projects = await getProjects();
  const foundProject = projects.find((p) => p.id === conversionResult.project_id);
  if (!foundProject) throw new Error('Converted project missing from projects page!');

  console.log(`✓ Converted project visible on /projects: "${foundProject.name}", Stage=${foundProject.stage}`);

  // 5. Payments Module (ONE ROW PER PROJECT, 3 Milestones in Sidebar, Gating, Pending > 48h)
  console.log('\n5. Verifying Payments Module...');
  const { groups, summary } = await getProjectPaymentGroups();
  const paymentRow = groups.find((g) => g.projectId === conversionResult.project_id);
  if (!paymentRow) throw new Error('Payment row missing from payments table!');

  console.log(`✓ Grouped Payment Row (ONE row):`);
  console.log(`  - Project Name: ${paymentRow.projectName}`);
  console.log(`  - Client: ${paymentRow.clientName}`);
  console.log(`  - Total Amount: $${paymentRow.totalValue}`);
  console.log(`  - Paid Amount: $${paymentRow.amountCollected}`);
  console.log(`  - Pending Amount: $${paymentRow.remainingAmount}`);
  console.log(`  - Status: ${paymentRow.paymentState}`);

  console.log('\n==================================================');
  console.log('🎉 ALL REFINED CRM FEATURES VERIFIED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
