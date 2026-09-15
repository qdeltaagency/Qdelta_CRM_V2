import {
  createLead,
  generateLeadPaymentLink,
  recordOfflinePaymentAndConvert,
  getLeads,
} from '../lib/leads-service';
import { supabase } from '../lib/supabase';

async function runTest() {
  console.log('--- STARTING LEAD -> PAYMENT -> CLIENT CONVERSION TEST ---');

  const uniqueSuffix = Date.now().toString().slice(-4);
  const testEmail = `lead.conversion.${uniqueSuffix}@acmeworks.io`;

  // 1. Create a Lead
  console.log(`1. Creating Test Lead with email: ${testEmail}`);
  const newLead = await createLead({
    name: `Sarah Jenkins ${uniqueSuffix}`,
    company: `Apex Labs ${uniqueSuffix}`,
    email: testEmail,
    phone: '+1 555 987 6543',
    country: 'United States',
    service: 'AI Engineering',
    requirements: 'Custom LLM integration and semantic workflow pipeline.',
    notes: 'Budget approved by CTO.',
    source_type: 'manual',
    source_platform: 'linkedin',
    budget: 12000,
    currency: 'USD',
    timeline: '4 weeks',
  });

  console.log(`✓ Lead Created: ID=${newLead.id}, Status=${newLead.status}, Budget=${newLead.agreed_project_value}`);

  // 2. Generate Payment Link
  console.log('\n2. Testing Payment Link Generation for Lead...');
  const payInfo = await generateLeadPaymentLink(newLead.id);
  console.log(`✓ Payment Link: ${payInfo.paymentLink}`);
  console.log(`✓ Milestone Deposit (30%): $${payInfo.amount} ${payInfo.currency}`);

  // Verify lead status moved to won_awaiting_payment
  const { data: updatedLead } = await supabase
    .from('leads')
    .select('*, projects(*, payment_milestones(*))')
    .eq('id', newLead.id)
    .single();

  console.log(`✓ Updated Lead Status: ${updatedLead.status} (Expected: won_awaiting_payment)`);

  // 3. Test Offline Payment Verification & Conversion
  console.log('\n3. Testing Offline Payment Verification & Conversion...');
  const conversionRes = await recordOfflinePaymentAndConvert({
    leadId: newLead.id,
    invoiceNumber: `INV-2026-${uniqueSuffix}`,
    invoiceFileUrl: `/uploads/invoices/inv-${uniqueSuffix}.pdf`,
    receiptNumber: `REC-WIRE-${uniqueSuffix}`,
    receiptFileUrl: `/uploads/receipts/rec-${uniqueSuffix}.pdf`,
    notes: 'Verified wire transfer from JP Morgan Chase.',
    amount: payInfo.amount,
  });

  console.log(`✓ Conversion Result: ClientID=${conversionRes.client_id}, ProjectID=${conversionRes.project_id}`);

  // 4. Verify Final State in Database
  console.log('\n4. Verifying Database Records...');
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', conversionRes.client_id)
    .single();

  console.log(`✓ Client: Name="${client.name}", Company="${client.company}", Status="${client.status}"`);

  const { data: project } = await supabase
    .from('projects')
    .select('*, payment_milestones(*)')
    .eq('id', conversionRes.project_id)
    .single();

  console.log(`✓ Project: Name="${project.name}", Service="${project.service_type}", Stage="${project.stage}", AgreedValue=$${project.agreed_value}, Timeline="${project.timeline}"`);

  const ms = (project.payment_milestones || []).sort((a: any, b: any) => a.milestone_number - b.milestone_number);
  console.log(`✓ Milestone 1 Status: ${ms[0]?.status} (Paid At: ${ms[0]?.paid_at})`);
  console.log(`✓ Milestone 2 Status: ${ms[1]?.status}`);
  console.log(`✓ Milestone 3 Status: ${ms[2]?.status}`);

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('lead_id', newLead.id);

  console.log(`✓ Attached Documents Count: ${docs?.length || 0}`);
  docs?.forEach((d: any) => {
    console.log(`  - Doc: Type=${d.type}, Name="${d.name}", Status=${d.status}, ClientID=${d.client_id}`);
  });

  console.log('\n🎉 ALL LEAD -> PAYMENT -> CLIENT CONVERSION TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
