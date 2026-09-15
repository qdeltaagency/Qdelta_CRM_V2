/**
 * PayPal Link Generator & Communication Templates for Qdelta Agency
 */

export interface GeneratePayPalLinkParams {
  paypalHandle: string; // e.g. "qdelta" or "yourbusiness"
  amount: number;
  currency?: string; // e.g. "USD", "EUR", "GBP", "INR"
  note?: string;
}

/**
 * Generates direct paypal.me payment link
 * Format: https://paypal.me/{handle}/{amount}{currency}
 */
export function generatePayPalMeLink({
  paypalHandle,
  amount,
  currency = 'USD',
}: GeneratePayPalLinkParams): string {
  const cleanHandle = paypalHandle.replace(/^@/, '').trim();
  const cleanAmount = Number(amount) || 0;
  return `https://paypal.me/${cleanHandle}/${cleanAmount}${currency}`;
}

/**
 * Pre-formatted instant chat message for WhatsApp, Slack, LinkedIn, Discord
 */
export function generateChatPitchMessage({
  clientName,
  projectName,
  serviceType,
  depositAmount,
  currency = 'USD',
  paypalLink,
  assignedPartner = 'Nagireddy Sai Prabhath',
}: {
  clientName: string;
  projectName: string;
  serviceType: string;
  depositAmount: number;
  currency?: string;
  paypalLink: string;
  assignedPartner?: string;
}): string {
  return `Hey ${clientName}, great connecting with you regarding ${projectName} (${serviceType})! 🚀

To officially lock in our sprint calendar and kick off technical architecture, here is the direct secure PayPal link for the 50% deposit (${currency} $${depositAmount.toLocaleString()}):

👉 ${paypalLink}

Once completed, we will immediately send over your client portal invite, onboarding kit, and schedule our kickoff sprint with ${assignedPartner}.

Looking forward to building something extraordinary together!`;
}

/**
 * Pre-formatted Payment Receipt Email / Message
 */
export function generatePaymentReceiptEmail({
  clientName,
  organizationName,
  projectName,
  amount,
  currency = 'USD',
  paypalRefId,
  assignedPartner,
}: {
  clientName: string;
  organizationName: string;
  projectName: string;
  amount: number;
  currency?: string;
  paypalRefId?: string;
  assignedPartner: string;
}): { subject: string; body: string } {
  const subject = `[Qdelta] Payment Confirmed: Kickoff Deposit for ${projectName}`;
  const body = `Hi ${clientName},

Thank you for confirming the kickoff payment of ${currency} $${amount.toLocaleString()} for ${projectName}.

Receipt Details:
• Organization: ${organizationName}
• Project: ${projectName}
• Amount Received: ${currency} $${amount.toLocaleString()}
• Reference ID: ${paypalRefId || `QD-PAY-${Date.now().toString().slice(-6)}`}
• Lead Partner: ${assignedPartner}
• Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

Your project sprint has been locked into the studio schedule. Your onboarding kit and next steps are attached below.

Best regards,
The Qdelta Engineering & Design Studio`;

  return { subject, body };
}

/**
 * VIP Client Onboarding Kit Email / Message
 */
export function generateOnboardingKitEmail({
  clientName,
  projectName,
  assignedPartner,
  kickoffBookingUrl = 'https://cal.com/qdelta-studio/kickoff',
}: {
  clientName: string;
  projectName: string;
  assignedPartner: string;
  kickoffBookingUrl?: string;
}): { subject: string; body: string } {
  const subject = `🚀 Welcome to Qdelta! Onboarding & Next Steps for ${projectName}`;
  const body = `Hi ${clientName},

Welcome to Qdelta! We are thrilled to start engineering ${projectName}.

Here is your 3-step kickoff checklist:

1. 📅 Schedule Technical Kickoff:
Book a 30-minute alignment call with your lead partner (${assignedPartner}):
👉 ${kickoffBookingUrl}

2. 🎨 Asset Gathering & Brand Kit:
Please prepare:
- Vector Logo & Brand Guidelines (.svg / .fig / .pdf)
- Domain / DNS access or GitHub repo permissions (if existing)
- Any reference designs, copy docs, or key feature requirements

3. 💬 Dedicated Studio Channel:
We will be setting up a direct communication thread to keep updates fluid and transparent.

If you have any questions before our kickoff call, feel free to reply directly to this thread.

Let's build the future,
${assignedPartner} & The Qdelta Studio Team`;

  return { subject, body };
}

/**
 * Partner Agency Handoff Brief
 */
export function generatePartnerHandoffBrief({
  partnerAgencyName,
  partnerContact,
  clientName,
  companyName,
  serviceType,
  budget,
  timeline,
  details,
  referralRate = 10,
}: {
  partnerAgencyName: string;
  partnerContact: string;
  clientName: string;
  companyName?: string;
  serviceType: string;
  budget?: string;
  timeline?: string;
  details: string;
  referralRate?: number;
}): { subject: string; body: string } {
  const subject = `[Lead Referral from Qdelta] New Client Opportunity for ${partnerAgencyName}: ${clientName}`;
  const body = `Hey ${partnerContact},

We have an exciting client inquiry that matches ${partnerAgencyName}'s expertise. Since our internal Qdelta sprint capacity is currently allocated to Next.js/AI flagships, we are passing this lead directly to you.

Client Opportunity Summary:
• Client Name: ${clientName} ${companyName ? `(${companyName})` : ''}
• Requested Service: ${serviceType}
• Target Budget: ${budget || 'To be scoped'}
• Target Timeline: ${timeline || 'Flexible'}
• Project Brief: ${details}
• Agreed Referral Commission: ${referralRate}% upon contract close

Please let us know once you initiate contact so we can keep our partner ledger synchronized.

Best,
Qdelta Studio`;

  return { subject, body };
}
