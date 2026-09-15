/**
 * Q Delta CRM — Document Template Generator Engine
 * Generates high-fidelity, printable, and PDF-ready HTML documents.
 */

export interface DocumentData {
  documentId?: string;
  documentNumber: string;
  documentType: 'proposal' | 'invoice' | 'receipt' | 'agreement' | 'client_agreement' | 'nda' | 'terms' | 'handover';
  title: string;
  createdDate: string;
  dueDate?: string;
  paidDate?: string;
  
  // Client Info
  clientName: string;
  clientCompany?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientCountry?: string | null;

  // Project Info
  projectName: string;
  serviceType?: string | null;
  requirements?: string | null;
  timeline?: string | null;
  agreedValue: number;
  currency: string;

  // Milestone / Payment Details
  milestoneNumber?: number;
  milestonePercentage?: number;
  milestoneAmount?: number;
  paymentLink?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
}

function getCurrencySymbol(currency: string = 'USD'): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'AED ';
    case 'SGD': return 'SGD ';
    default: return '$';
  }
}

const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #0c0c0e;
    color: #e4e4e7;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-container {
    max-width: 820px;
    margin: 0 auto;
    background: #141417;
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .header-brand {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 28px;
    border-bottom: 1px solid #27272a;
    margin-bottom: 32px;
  }
  .logo-box {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .badge-indigo { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
  .badge-emerald { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
  .badge-amber { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
  
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
    padding: 20px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
  }
  .table-custom {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
  }
  .table-custom th {
    text-align: left;
    padding: 12px 16px;
    background: #18181b;
    color: #a1a1aa;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    border-bottom: 1px solid #27272a;
  }
  .table-custom td {
    padding: 14px 16px;
    border-bottom: 1px solid #27272a;
    font-size: 13px;
    color: #e4e4e7;
  }
  .total-box {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 20px;
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #ffffff;
    margin: 28px 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #27272a;
  }
  .terms-box {
    background: rgba(24, 24, 27, 0.6);
    border: 1px solid #27272a;
    border-radius: 10px;
    padding: 16px;
    font-size: 12px;
    color: #a1a1aa;
    line-height: 1.6;
    margin-top: 24px;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #27272a;
  }
  .sig-line {
    border-bottom: 1px dashed #52525b;
    height: 40px;
    margin-bottom: 8px;
  }
  
  @media print {
    body { background: #ffffff !important; color: #18181b !important; }
    .doc-container { border: none !important; box-shadow: none !important; padding: 0 !important; background: #ffffff !important; }
    .meta-grid, .total-box, .terms-box { background: #f4f4f5 !important; border-color: #e4e4e7 !important; color: #18181b !important; }
    .table-custom th { background: #f4f4f5 !important; color: #71717a !important; border-color: #e4e4e7 !important; }
    .table-custom td { border-color: #e4e4e7 !important; color: #18181b !important; }
    .badge { border-color: #d4d4d8 !important; }
    .no-print { display: none !important; }
  }
`;

/**
 * 1. Proposal Template
 */
export function generateProposalHtml(data: DocumentData): string {
  const sym = getCurrencySymbol(data.currency);
  const m1 = Math.round(data.agreedValue * 0.3);
  const m2 = Math.round(data.agreedValue * 0.35);
  const m3 = Math.round(data.agreedValue * 0.35);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proposal — ${data.projectName} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Flagship Engineering & Growth Systems</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-indigo">Official Proposal</span>
        <div class="mono" style="font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Issued: ${data.createdDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Prepared For</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
        ${data.clientCountry ? `<div style="color: #71717a; font-size: 12px;">${data.clientCountry}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Project Scope</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.projectName}</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Service: ${data.serviceType || 'Digital Product Sprint'}</div>
        <div style="color: #71717a; font-size: 12px;">Timeline: ${data.timeline || '4–6 Weeks'}</div>
      </div>
    </div>

    <div class="section-title">1. Executive Overview & Technical Scope</div>
    <div style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 20px; white-space: pre-wrap;">
${data.requirements || `Q Delta is engaged to deliver architecture, frontend & backend engineering, payment workflows, and production deployment for ${data.projectName}.

Key Scope Deliverables:
• Comprehensive UI/UX Design and responsive responsive workflows.
• Full-stack Next.js and Supabase database integration.
• Transactional milestone payment gating and automation.
• Performance optimization, SEO tags, and production deployment.`}
    </div>

    <div class="section-title">2. Commercial Terms & 3-Stage Milestone Schedule</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Milestone</th>
          <th>Deliverables / Trigger</th>
          <th>%</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Milestone 1: Kickoff Deposit</strong></td>
          <td>Initial sprint kickoff, technical architecture & design review</td>
          <td>30%</td>
          <td style="text-align: right;" class="mono font-bold">${sym}${m1.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Milestone 2: Mid-Sprint Review</strong></td>
          <td>Functional staging delivery & client review approval</td>
          <td>35%</td>
          <td style="text-align: right;" class="mono font-bold">${sym}${m2.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Milestone 3: Final Handover</strong></td>
          <td>Production rollout, domain activation & source handover</td>
          <td>35%</td>
          <td style="text-align: right;" class="mono font-bold">${sym}${m3.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block;">Total Project Investment</span>
        <span style="font-size: 12px; color: #a1a1aa;">Fixed-fee contract (${data.currency})</span>
      </div>
      <span class="mono" style="font-size: 24px; font-weight: 800; color: #38bdf8;">
        ${sym}${data.agreedValue.toLocaleString()} ${data.currency}
      </span>
    </div>

    <div class="terms-box">
      <strong>Terms & Acceptance:</strong> This proposal is valid for 30 calendar days from issue. By accepting below or settling Milestone 1 deposit, client agrees to the terms and engages Q Delta Studio for project delivery.
    </div>

    <div class="sig-grid">
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">Q Delta Studio Representative</strong>
        <div style="font-size: 11px; color: #71717a;">Managing Partner</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">${data.clientName}</strong>
        <div style="font-size: 11px; color: #71717a;">${data.clientCompany || 'Client Authorized Signatory'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 2. Invoice Template
 */
export function generateInvoiceHtml(data: DocumentData): string {
  const sym = getCurrencySymbol(data.currency);
  const amount = data.milestoneAmount || Math.round(data.agreedValue * ((data.milestonePercentage || 30) / 100));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.documentNumber} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Commercial Invoicing & Settlements</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-amber">Payment Due</span>
        <div class="mono" style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Issue Date: ${data.createdDate}</div>
        ${data.dueDate ? `<div style="font-size: 11px; color: #f59e0b; margin-top: 2px;">Due Date: ${data.dueDate}</div>` : ''}
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Billed To</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
        ${data.clientCountry ? `<div style="color: #71717a; font-size: 12px;">${data.clientCountry}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Project Reference</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.projectName}</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Milestone #${data.milestoneNumber || 1} (${data.milestonePercentage || 30}%)</div>
        <div style="color: #71717a; font-size: 12px;">Total Contract: ${sym}${data.agreedValue.toLocaleString()} ${data.currency}</div>
      </div>
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th>Description</th>
          <th>Stage</th>
          <th>Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${data.title || `Milestone #${data.milestoneNumber || 1} Settlement`}</strong>
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 3px;">
              ${data.notes || `Contracted milestone deposit for ${data.projectName}`}
            </div>
          </td>
          <td>${data.milestonePercentage || 30}%</td>
          <td>1</td>
          <td style="text-align: right;" class="mono font-bold">${sym}${amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block;">Total Due</span>
        <span style="font-size: 12px; color: #fbbf24;">Payable upon receipt (${data.currency})</span>
      </div>
      <span class="mono" style="font-size: 26px; font-weight: 800; color: #fbbf24;">
        ${sym}${amount.toLocaleString()} ${data.currency}
      </span>
    </div>

    ${data.paymentLink ? `
    <div style="text-align: center; margin-top: 32px;" class="no-print">
      <a href="${data.paymentLink}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
        Pay Online via Secure Portal →
      </a>
      <p style="font-size: 11px; color: #71717a; margin-top: 8px;">Direct Link: ${data.paymentLink}</p>
    </div>` : ''}

    <div class="terms-box">
      <strong>Payment Instructions:</strong> Settlements are processed securely through our client gateway. For international wire transfers or corporate remittance receipts, please quote invoice ref <code>${data.documentNumber}</code>.
    </div>
  </div>
</body>
</html>`;
}

/**
 * 3. Receipt Template
 */
export function generateReceiptHtml(data: DocumentData): string {
  const sym = getCurrencySymbol(data.currency);
  const amount = data.milestoneAmount || Math.round(data.agreedValue * ((data.milestonePercentage || 30) / 100));
  const paidDate = data.paidDate || data.createdDate;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt ${data.documentNumber} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Official Settlement Confirmation</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-emerald">✓ Paid in Full</span>
        <div class="mono" style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #34d399; margin-top: 2px;">Paid: ${paidDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Received From</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Settlement Details</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.projectName}</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Milestone #${data.milestoneNumber || 1} (${data.milestonePercentage || 30}%)</div>
        <div class="mono" style="color: #71717a; font-size: 11px;">Ref: ${data.transactionRef || 'TXN-SETTLED-DIRECT'}</div>
      </div>
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th>Transaction Item</th>
          <th>Milestone</th>
          <th>Status</th>
          <th style="text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${data.title || `Milestone #${data.milestoneNumber || 1} Settlement`}</strong>
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 3px;">
              ${data.notes || `Full payment received for milestone deliverables`}
            </div>
          </td>
          <td>${data.milestonePercentage || 30}%</td>
          <td><span style="color: #34d399; font-weight: 700;">Completed</span></td>
          <td style="text-align: right;" class="mono font-bold">${sym}${amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block;">Total Amount Received</span>
        <span style="font-size: 12px; color: #34d399;">Zero outstanding balance on this invoice</span>
      </div>
      <span class="mono" style="font-size: 26px; font-weight: 800; color: #34d399;">
        ${sym}${amount.toLocaleString()} ${data.currency}
      </span>
    </div>

    <div class="terms-box">
      <strong>Receipt Confirmation:</strong> This serves as official cryptographic proof of settlement for project accounting. Milestone deliverables are locked into sprint deployment.
    </div>
  </div>
</body>
</html>`;
}

/**
 * 4. Client Agreement / SOW Template
 */
export function generateAgreementHtml(data: DocumentData): string {
  const sym = getCurrencySymbol(data.currency);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Master Services Agreement — ${data.projectName} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Master Services Agreement & SOW</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-indigo">Legally Binding SOW</span>
        <div class="mono" style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Effective Date: ${data.createdDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Service Recipient (Client)</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Service Provider</span>
        <strong style="color: #ffffff; font-size: 14px;">Q Delta Agency</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Digital Architecture & Engineering</div>
        <div style="color: #71717a; font-size: 12px;">Agreed Value: ${sym}${data.agreedValue.toLocaleString()} ${data.currency}</div>
      </div>
    </div>

    <div class="section-title">1. Scope of Services & Deliverables</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 16px;">
      Q Delta will provide engineering and design services for the project titled <strong>"${data.projectName}"</strong>. Work will proceed according to agreed milestones and technical requirements.
    </p>

    <div class="section-title">2. Milestone Schedule & Payment Obligations</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 16px;">
      Payments will be structured strictly in 3 tranches: 30% initial kickoff deposit, 35% mid-review milestone gate, and 35% final handover upon deployment.
    </p>

    <div class="section-title">3. Intellectual Property & Code Ownership</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 16px;">
      Upon 100% full settlement of all milestones, all bespoke source code, UI components, designs, and brand assets developed under this agreement shall belong exclusively to the Client.
    </p>

    <div class="section-title">4. Confidentiality & Non-Disclosure</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 24px;">
      Both parties agree to protect proprietary source code, business data, and customer information with strict confidentiality for a minimum period of 3 years.
    </p>

    <div class="sig-grid">
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">Q Delta Studio Representative</strong>
        <div style="font-size: 11px; color: #71717a;">Authorized Signatory</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">${data.clientName}</strong>
        <div style="font-size: 11px; color: #71717a;">${data.clientCompany || 'Client Authorized Signatory'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 5. NDA Template
 */
export function generateNdaHtml(data: DocumentData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mutual NDA — ${data.clientCompany || data.clientName} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Mutual Non-Disclosure Agreement</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-indigo">Confidential</span>
        <div class="mono" style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Effective Date: ${data.createdDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Party A (Client)</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Party B (Agency)</span>
        <strong style="color: #ffffff; font-size: 14px;">Q Delta Agency</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Project: ${data.projectName}</div>
      </div>
    </div>

    <div class="section-title">1. Purpose & Confidential Information</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 16px;">
      The parties wish to explore and execute technology engineering and business collaborations for <strong>${data.projectName}</strong>. "Confidential Information" encompasses all business plans, software architectures, algorithms, customer data, and technical specifications disclosed by either party.
    </p>

    <div class="section-title">2. Obligations of Non-Disclosure</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 16px;">
      Each receiving party agrees: (a) to hold Confidential Information in strict confidence; (b) not to disclose such information to third parties without prior written consent; and (c) to use the information solely for the authorized project collaboration.
    </p>

    <div class="section-title">3. Duration & Jurisdiction</div>
    <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin-bottom: 24px;">
      This agreement remains in effect for 3 years from the date of execution and shall be governed by international commercial arbitration laws.
    </p>

    <div class="sig-grid">
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">Q Delta Studio Representative</strong>
        <div style="font-size: 11px; color: #71717a;">Authorized Signatory</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">${data.clientName}</strong>
        <div style="font-size: 11px; color: #71717a;">${data.clientCompany || 'Authorized Signatory'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 6. Handover & Delivery Acceptance Template
 */
export function generateHandoverHtml(data: DocumentData): string {
  const sym = getCurrencySymbol(data.currency);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Handover & Delivery — ${data.projectName} — Q Delta</title>
  <style>${COMMON_CSS}</style>
</head>
<body>
  <div class="doc-container">
    <div class="header-brand">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div class="logo-box">Q</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #ffffff;">Q Delta Studio</h1>
            <p style="font-size: 12px; color: #a1a1aa;">Project Delivery & Handover Sign-off</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-emerald">Handover Complete</span>
        <div class="mono" style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${data.documentNumber}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Handover Date: ${data.createdDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Client</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.clientName}</strong>
        ${data.clientCompany ? `<div style="color: #a1a1aa; font-size: 12px;">${data.clientCompany}</div>` : ''}
        ${data.clientEmail ? `<div style="color: #71717a; font-size: 12px;">${data.clientEmail}</div>` : ''}
      </div>
      <div>
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Delivered Project</span>
        <strong style="color: #ffffff; font-size: 14px;">${data.projectName}</strong>
        <div style="color: #a1a1aa; font-size: 12px;">Service: ${data.serviceType || 'Digital Product'}</div>
        <div style="color: #34d399; font-size: 12px; font-weight: 700;">Final Settlement: Complete (${sym}${data.agreedValue.toLocaleString()})</div>
      </div>
    </div>

    <div class="section-title">1. Deliverables & Asset Transfer Checklist</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Deliverable Asset</th>
          <th>Location / Access</th>
          <th style="text-align: right;">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Production Source Code</strong></td>
          <td>Private GitHub repository transfer</td>
          <td style="text-align: right; color: #34d399; font-weight: 700;">✓ Transferred</td>
        </tr>
        <tr>
          <td><strong>Database & Hosting Credentials</strong></td>
          <td>Supabase / Vercel ownership invite</td>
          <td style="text-align: right; color: #34d399; font-weight: 700;">✓ Assigned</td>
        </tr>
        <tr>
          <td><strong>Design Assets & Tokens</strong></td>
          <td>Figma files, brand typography, vector tokens</td>
          <td style="text-align: right; color: #34d399; font-weight: 700;">✓ Delivered</td>
        </tr>
        <tr>
          <td><strong>Documentation & API Guides</strong></td>
          <td>Technical README & architectural blueprints</td>
          <td style="text-align: right; color: #34d399; font-weight: 700;">✓ Delivered</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">2. Warranty & Post-Launch Support</div>
    <div class="terms-box">
      <strong>30-Day Post-Launch Warranty:</strong> Q Delta guarantees 30 days of complimentary technical warranty support covering critical bug fixes, hosting verification, and launch stabilization.
    </div>

    <div class="sig-grid">
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">Q Delta Lead Engineer</strong>
        <div style="font-size: 11px; color: #71717a;">Delivery Completed</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <strong style="font-size: 12px; color: #ffffff;">${data.clientName}</strong>
        <div style="font-size: 11px; color: #71717a;">Client Acceptance & Sign-off</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Master HTML Document Renderer dispatcher
 */
export function renderDocumentHtml(data: DocumentData): string {
  switch (data.documentType) {
    case 'proposal':
      return generateProposalHtml(data);
    case 'invoice':
      return generateInvoiceHtml(data);
    case 'receipt':
      return generateReceiptHtml(data);
    case 'agreement':
    case 'client_agreement':
      return generateAgreementHtml(data);
    case 'nda':
      return generateNdaHtml(data);
    case 'handover':
      return generateHandoverHtml(data);
    default:
      return generateProposalHtml(data);
  }
}
