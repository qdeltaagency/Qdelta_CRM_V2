/**
 * Qdelta CRM v1 — Premium Transactional Email HTML Templates
 * Clean, dark-mode optimized, high-converting agency email layouts.
 */

export interface PaymentReceiptEmailData {
  clientName: string;
  companyName: string;
  projectTitle: string;
  amount: number;
  currency: string;
  milestoneType: string;
  transactionId: string;
  receiptUrl?: string;
  dateStr?: string;
}

export interface OnboardingWelcomeEmailData {
  clientName: string;
  companyName: string;
  projectTitle: string;
  servicePillar?: string;
  portalUrl?: string;
  kickoffUrl?: string;
  assignedPartner?: string;
}

export function generatePaymentReceiptHtml(data: PaymentReceiptEmailData): string {
  const dateFormatted = data.dateStr || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt & SOW Confirmation — Qdelta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #141417; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #18181b 0%, #1e1b4b 100%); border-bottom: 1px solid #27272a;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 6px 12px; margin-bottom: 12px;">
                      <span style="color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Payment Confirmed</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Official Payment Receipt</h1>
                    <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 13px;">Qdelta Digital Studio • Milestone Settlement</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #4f46e5; border-radius: 10px; text-align: center; line-height: 40px; color: #ffffff; font-weight: 800; font-size: 18px;">
                      Q
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Details Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">
                Hi <strong style="color: #ffffff;">${data.clientName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                Thank you for your payment. Your transaction has been securely processed and recorded into your active project ledger.
              </p>

              <!-- Transaction Summary Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #71717a; font-size: 11px; text-transform: uppercase; font-weight: 600; padding-bottom: 6px;">Amount Paid</td>
                        <td align="right" style="color: #34d399; font-size: 20px; font-weight: 800; font-family: monospace; padding-bottom: 6px;">
                          $${Number(data.amount).toLocaleString()} ${data.currency || 'USD'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Milestone Stage</td>
                        <td align="right" style="color: #e4e4e7; font-size: 12px; font-weight: 600; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.milestoneType || '1st Deposit (50%)'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Client / Company</td>
                        <td align="right" style="color: #e4e4e7; font-size: 12px; font-weight: 600; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.companyName || data.clientName}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Project Deliverable</td>
                        <td align="right" style="color: #e4e4e7; font-size: 12px; font-weight: 600; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.projectTitle || 'Flagship Engineering Sprint'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Transaction Ref</td>
                        <td align="right" style="color: #a1a1aa; font-size: 11px; font-family: monospace; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.transactionId || 'PP-TX-VERIFIED'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Date Processed</td>
                        <td align="right" style="color: #a1a1aa; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${dateFormatted}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SOW Note -->
              <div style="background-color: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 28px;">
                <p style="margin: 0; color: #c7d2fe; font-size: 12px; line-height: 1.5;">
                  ✓ <strong>Master Scope Agreement Signed:</strong> Your electronic signature and milestone deliverables schedule have been locked into the studio sprint queue.
                </p>
              </div>

              <!-- Action Button -->
              ${
                data.receiptUrl
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.receiptUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      View Receipt & Signed SOW
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }

              <p style="margin: 0; color: #71717a; font-size: 12px; line-height: 1.6;">
                If you have any questions about this invoice, reply directly to this email or reach out to your lead partner.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #101012; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #71717a; font-size: 11px;">
                © ${new Date().getFullYear()} Qdelta Digital Studio. All rights reserved.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 10px;">
                Automated Transaction Service • HMAC-SHA256 Cryptographically Verified
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function generateOnboardingWelcomeHtml(data: OnboardingWelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Qdelta — Project Kickoff & Onboarding</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #141417; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-bottom: 1px solid #3730a3;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 8px; padding: 6px 12px; margin-bottom: 12px;">
                <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">🚀 Project Sprint Initialized</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Welcome to Qdelta Studio</h1>
              <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px;">Your dedicated project sprint is officially underway</p>
            </td>
          </tr>

          <!-- Onboarding Steps Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 15px; font-weight: 600;">
                Hi ${data.clientName},
              </p>
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                We are thrilled to partner with <strong style="color: #ffffff;">${data.companyName}</strong> on <strong style="color: #ffffff;">${data.projectTitle}</strong>. Our engineering and design team is ready to begin your architecture and development sprint.
              </p>

              <!-- Next Steps Roadmap -->
              <h3 style="margin: 0 0 14px 0; color: #e4e4e7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">
                Your 4-Step Onboarding Roadmap:
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <!-- Step 1 -->
                <tr>
                  <td width="32" valign="top" style="padding-bottom: 16px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 700; text-align: center; line-height: 24px;">1</div>
                  </td>
                  <td style="padding-left: 12px; padding-bottom: 16px;">
                    <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">Kickoff & Discovery Alignment</p>
                    <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px; line-height: 1.4;">
                      We'll sync on technical requirements, target launch date, and key user flows.
                    </p>
                  </td>
                </tr>

                <!-- Step 2 -->
                <tr>
                  <td width="32" valign="top" style="padding-bottom: 16px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #312e81; color: #a5b4fc; font-size: 11px; font-weight: 700; text-align: center; line-height: 24px;">2</div>
                  </td>
                  <td style="padding-left: 12px; padding-bottom: 16px;">
                    <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">Brand Assets & Credentials</p>
                    <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px; line-height: 1.4;">
                      Share logos, fonts, Figma files, or hosting access in your private portal.
                    </p>
                  </td>
                </tr>

                <!-- Step 3 -->
                <tr>
                  <td width="32" valign="top" style="padding-bottom: 16px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #312e81; color: #a5b4fc; font-size: 11px; font-weight: 700; text-align: center; line-height: 24px;">3</div>
                  </td>
                  <td style="padding-left: 12px; padding-bottom: 16px;">
                    <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">Dedicated Communications Channel</p>
                    <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px; line-height: 1.4;">
                      You'll receive a direct Slack / Discord invite for real-time sprint updates.
                    </p>
                  </td>
                </tr>

                <!-- Step 4 -->
                <tr>
                  <td width="32" valign="top">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #312e81; color: #a5b4fc; font-size: 11px; font-weight: 700; text-align: center; line-height: 24px;">4</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">Sprint 1 Design & Architecture Review</p>
                    <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px; line-height: 1.4;">
                      First interactive staging walkthrough delivered within 5–7 business days.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl || 'https://qdelta.digital'}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Open Your Client Hub Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 12px; line-height: 1.6; text-align: center;">
                Assigned Lead Partner: <strong style="color: #a1a1aa;">${data.assignedPartner || 'Nagireddy Sai Prabhath'}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #101012; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #71717a; font-size: 11px;">
                © ${new Date().getFullYear()} Qdelta Digital Studio. Built for exceptional founders.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 10px;">
                Qdelta Digital Operations System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export interface PaymentRequestEmailData {
  clientName: string;
  companyName: string;
  projectTitle: string;
  amount: number;
  currency: string;
  milestoneTitle: string;
  paymentUrl: string;
  notes?: string;
}

export function generatePaymentRequestHtml(data: PaymentRequestEmailData): string {
  const currencySymbol =
    data.currency === 'INR' ? '₹' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Request — ${data.projectTitle} — Qdelta Studio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #141417; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-bottom: 1px solid #3730a3;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 12px;">
                      <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Payment Requested</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Milestone Settlement Request</h1>
                    <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 13px;">${data.projectTitle}</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #4f46e5; border-radius: 10px; text-align: center; line-height: 40px; color: #ffffff; font-weight: 800; font-size: 18px;">
                      Q
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 15px; font-weight: 600;">
                Hi ${data.clientName},
              </p>
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                To kick off your project sprint for <strong style="color: #ffffff;">${data.projectTitle}</strong>, please complete the initial milestone deposit payment using the secure link below.
              </p>

              <!-- Payment Summary Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #71717a; font-size: 11px; text-transform: uppercase; font-weight: 600; padding-bottom: 6px;">Deposit Amount</td>
                        <td align="right" style="color: #38bdf8; font-size: 22px; font-weight: 800; font-family: monospace; padding-bottom: 6px;">
                          ${currencySymbol}${Number(data.amount).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Milestone</td>
                        <td align="right" style="color: #e4e4e7; font-size: 12px; font-weight: 600; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.milestoneTitle || 'Initial (30%)'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; padding: 6px 0; border-top: 1px solid #27272a;">Client / Company</td>
                        <td align="right" style="color: #e4e4e7; font-size: 12px; font-weight: 600; padding: 6px 0; border-top: 1px solid #27272a;">
                          ${data.companyName ? `${data.companyName} (${data.clientName})` : data.clientName}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.paymentUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Pay Deposit & Confirm Project →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 12px; line-height: 1.6; text-align: center;">
                Payment link: <a href="${data.paymentUrl}" style="color: #818cf8; word-break: break-all;">${data.paymentUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #101012; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #71717a; font-size: 11px;">
                © ${new Date().getFullYear()} Qdelta Digital Studio. All rights reserved.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 10px;">
                Secure 256-bit Encrypted Settlement Link
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
