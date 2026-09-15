export type ServicePillar = 
  | 'Landing Pages'
  | 'Web Design & Full-Stack'
  | 'AI Solutions & Smart Workflows'
  | 'Landing Pages & High Conversion'
  | 'Web Design & Full-Stack App'
  | 'UI/UX Redesign & Overhaul'
  | 'AI Solutions & Automations'
  | 'Mobile App MVP'
  | string;

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type LeadStatus = 
  | 'New'
  | 'New Inquiry'
  | 'Proposal Sent'
  | 'In Discussion'
  | 'Link Sent'
  | 'Payment Received'
  | 'Converted'
  | 'Referred Out'
  | 'Lost';

export type HandlingMode = 
  | 'In-House'
  | 'White-Label / Partner'
  | 'Referred Out'
  | 'Inbound Referral'
  | 'White-Label'
  | string;

export type TeamMemberName = 
  | 'MD Qais'
  | 'Nagireddy Sai Prabhath'
  | 'MD Fazeel'
  | string;

export type ClientTier = 
  | 'VIP Flagship'
  | 'Enterprise'
  | 'Growth Studio'
  | 'Monthly Retainer';

export type ProjectStatus = 
  | 'Planning'
  | 'In Progress'
  | 'Client Review'
  | 'Final Settlement'
  | 'Launched'
  | 'Archived';

export type PaymentType = 
  | 'Deposit (30%)'
  | 'Milestone 2 (35%)'
  | 'Final Launch (35%)'
  | 'Deposit (50%)'
  | 'Milestone 2'
  | 'Final (100%)'
  | 'Monthly Retainer'
  | string;

export type PaymentStatus = 
  | 'Pending'
  | 'Link Sent'
  | 'Paid'
  | 'Refunded';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

export interface Lead {
  id: string;
  leadType?: 'Individual' | 'Organization';
  name: string;
  email: string;
  company?: string;
  website?: string;
  phone?: string;
  country?: string;
  serviceType: ServicePillar;
  budget?: string;
  timeline?: string;
  details: string;
  source: string; // 'LinkedIn Outreach' | 'Twitter (X)' | 'Instagram' | 'Upwork' | 'Website Form' | 'Other / Custom'
  status: LeadStatus;
  assignedTo?: TeamMemberName;
  handlingMode?: HandlingMode;
  partnerAgencyId?: string;
  referringPartner?: string;
  referralCommissionRate?: number;
  referralCommissionAmount?: number;
  paypalPaymentLink?: string;
  quoteAmount: number; // 1st Deposit (30% Upfront Kickoff)
  currency: string;
  leadScore: number;
  priority?: LeadPriority;
  submissionType?: string;
  contractAgreement?: {
    signed: boolean;
    signerName?: string;
    signerTitle?: string;
    signedAt?: string;
    signatureDataUrl?: string;
    termsAgreed?: boolean;
    agreementVersion?: string;
    scopeSummary?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  clientId?: string;
  actionType: 'created' | 'status_changed' | 'priority_changed' | 'payment_link_generated' | 'converted' | 'note_added' | 'assigned' | string;
  title: string;
  description: string;
  performedBy?: string;
  timestamp?: string;
  createdAt: string;
}

export interface ContractAgreement {
  signed: boolean;
  signerName: string;
  signerTitle?: string;
  signedAt: string;
  signatureDataUrl?: string;
  termsAgreed: boolean;
  agreementVersion: string;
  scopeSummary?: string;
}

export interface Client {
  id: string;
  name?: string;
  type?: string;
  clientType?: string;
  contactPerson?: string;
  organizationName: string;
  primaryContactName: string;
  email: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
  tier?: ClientTier;
  leadId?: string;
  assignedLeadPartner?: TeamMemberName;
  totalLtv: number;
  totalPaid: number;
  onboardingStatus: {
    brandAssets: boolean;
    credentials: boolean;
    kickoffBooked: boolean;
    slackInvited: boolean;
  };
  contractAgreement?: ContractAgreement;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName?: string;
  leadId?: string;
  title: string;
  servicePillar: ServicePillar;
  contractValue: number;
  currency: string;
  status: ProjectStatus;
  progressPercent: number;
  startDate: string;
  targetLaunchDate: string;
  githubRepoUrl?: string;
  figmaUrl?: string;
  stagingUrl?: string;
  scopeSummary?: string;
  contractAgreement?: ContractAgreement;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectTitle?: string;
  leadId?: string;
  leadName?: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  paypalReferenceId?: string;
  paymentLink: string;
  receiptSent: boolean;
  receiptEmailId?: string;
  receiptSentAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PartnerAgency {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  specialization: string;
  defaultCommissionRate: number; // e.g., 10
  totalReferredLeads: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  category: 'lead' | 'payment' | 'project' | 'partner' | 'ai';
  timestamp: string;
  partner?: TeamMemberName;
}

export interface AgencySettings {
  paypalHandle: string;
  defaultCurrency: string;
  n8nLeadWebhookUrl?: string;
  n8nPaymentWebhookUrl?: string;
  n8nOnboardingWebhookUrl?: string;
  geminiApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  companyName: string;
  agencyContactEmail: string;
  agencyMasterPasskey?: string;
}
