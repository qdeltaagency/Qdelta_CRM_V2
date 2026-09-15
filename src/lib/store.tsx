'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Lead,
  Client,
  Project,
  Payment,
  PartnerAgency,
  ActivityLog,
  LeadActivity,
  AgencySettings,
  LeadStatus,
  HandlingMode,
  TeamMemberName,
  PaymentStatus,
  ProjectStatus,
  ClientTier,
} from './types';
import {
  INITIAL_LEADS,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_PAYMENTS,
  INITIAL_PARTNER_AGENCIES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
} from './seed-data';
import { generatePayPalMeLink, generatePaymentReceiptEmail } from './paypal';
import {
  fetchLiveLeads,
  createLiveLead,
  updateLiveLead,
  deleteLiveLead,
  fetchLiveClients,
  createLiveClient,
  updateLiveClient,
  deleteLiveClient,
  fetchLiveProjects,
  createLiveProject,
  updateLiveProject,
  deleteLiveProject,
  fetchLivePayments,
  createLivePayment,
  updateLivePayment,
  deleteLivePayment,
  fetchLivePartners,
  createLivePartner,
  updateLivePartner,
  deleteLivePartner,
  fetchLiveLeadActivities,
  createLiveLeadActivity,
  deleteLiveLeadActivities,
} from './supabase-service';

type ConvertResult = { client: Client; project: Project } | null;

interface CRMContextType {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  partnerAgencies: PartnerAgency[];
  activityLogs: ActivityLog[];
  leadActivities: LeadActivity[];
  settings: AgencySettings;
  isHydrated: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Lead Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  generateLeadPayPalLink: (leadId: string, amount?: number, currency?: string) => string;
  transferLeadToPartner: (leadId: string, partnerAgencyId: string, referralRate?: number) => void;
  addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => void;
  convertLeadToClient: (
    leadId: string,
    projectTitle?: string,
    contractData?: {
      signerName?: string;
      signerTitle?: string;
      signatureDataUrl?: string;
      signedAt?: string;
      receiptEmailId?: string;
      onboardingEmailId?: string;
    }
  ) => ConvertResult;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  toggleOnboardingItem: (clientId: string, key: keyof Client['onboardingStatus']) => void;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, title: string, dueDate?: string) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;

  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  updatePaymentStatus: (id: string, status: PaymentStatus, paypalRefId?: string) => void;
  deletePayment: (id: string) => void;
  sendPaymentReceipt: (paymentId: string) => { subject: string; body: string } | null;

  // Partner Actions
  addPartnerAgency: (partner: Omit<PartnerAgency, 'id' | 'createdAt' | 'totalReferredLeads' | 'totalCommissionEarned' | 'totalCommissionPaid'>) => PartnerAgency;
  updatePartnerAgency: (id: string, updates: Partial<PartnerAgency>) => void;
  deletePartnerAgency: (id: string) => void;

  // Settings & System Actions
  updateSettings: (updates: Partial<AgencySettings>) => void;
  resetToSeedData: () => Promise<void>;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;

  // UI & Layout Actions
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  setIsMobileNavOpen: (open: boolean) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const UI_STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'qdelta_crm_sidebar_collapsed_v1',
};

// Legacy keys to purge so no stale cached test data remains in the browser
const LEGACY_STORAGE_KEYS = [
  'qdelta_crm_leads_v1',
  'qdelta_crm_clients_v1',
  'qdelta_crm_projects_v1',
  'qdelta_crm_payments_v1',
  'qdelta_crm_partners_v1',
  'qdelta_crm_logs_v1',
  'qdelta_crm_settings_v1',
];

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [partnerAgencies, setPartnerAgencies] = useState<PartnerAgency[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [settings, setSettings] = useState<AgencySettings>(INITIAL_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
  const setSidebarCollapsed = (collapsed: boolean) => setIsSidebarCollapsed(collapsed);
  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);

  // Global Keyboard Shortcut (⌘B / Ctrl+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // UI state hydration only (sidebar collapsed preference) & purge obsolete local data keys
  useEffect(() => {
    try {
      // Clean up any stale legacy business data caches
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
      const storedSidebarCollapsed = localStorage.getItem(UI_STORAGE_KEYS.SIDEBAR_COLLAPSED);
      if (storedSidebarCollapsed !== null) {
        setIsSidebarCollapsed(storedSidebarCollapsed === 'true');
      }
    } catch {
      // Ignore client storage errors
    }
  }, []);

  // Save UI sidebar preference only
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(UI_STORAGE_KEYS.SIDEBAR_COLLAPSED, String(isSidebarCollapsed));
    } catch {
      // Ignore
    }
  }, [isSidebarCollapsed, isHydrated]);

  // Direct Live Data Fetch from Database (Single Source of Truth)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [liveLeads, liveClients, liveProjects, livePayments, livePartners, liveActivities] = await Promise.all([
        fetchLiveLeads(),
        fetchLiveClients(),
        fetchLiveProjects(),
        fetchLivePayments(),
        fetchLivePartners(),
        fetchLiveLeadActivities(),
      ]);

      setLeads(liveLeads ?? []);
      setClients(liveClients ?? []);
      setProjects(liveProjects ?? []);
      setPayments(livePayments ?? []);
      setPartnerAgencies(livePartners ?? []);
      setLeadActivities(liveActivities ?? []);
    } catch (err) {
      console.error('Error fetching live data from Supabase:', err);
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, []);

  // Load live data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const logActivity = (
    title: string,
    description: string,
    category: ActivityLog['category'],
    partner?: TeamMemberName
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title,
      description,
      category,
      timestamp: 'Just now',
      partner,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const addLeadActivity = (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => {
    const tempId = `act-${Date.now()}`;
    const newAct: LeadActivity = {
      ...activity,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setLeadActivities((prev) => [newAct, ...prev]);
    if (activity.leadId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activity.leadId)) {
      createLiveLeadActivity(activity).then((saved) => {
        if (saved) {
          setLeadActivities((prev) => prev.map((a) => (a.id === tempId ? saved : a)));
        }
      });
    }
  };

  // ==========================================
  // LEAD ACTIONS (Direct Database Operations)
  // ==========================================
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead => {
    const tempId = `lead-${Date.now()}`;
    const now = new Date().toISOString();
    const quoteAmt = Number(leadData.quoteAmount) || 0;
    const autoPaypal = leadData.paypalPaymentLink || (quoteAmt > 0
      ? generatePayPalMeLink({ paypalHandle: settings.paypalHandle || 'qdeltastudio', amount: quoteAmt, currency: leadData.currency || 'USD' })
      : `https://paypal.me/${settings.paypalHandle || 'qdeltastudio'}`);

    const newLead: Lead = {
      ...leadData,
      paypalPaymentLink: autoPaypal,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    setLeads((prev) => [newLead, ...prev]);
    logActivity(
      'New Inbound Lead Created',
      `${newLead.name} (${newLead.company || newLead.serviceType}) entered the pipeline.`,
      'lead',
      newLead.assignedTo
    );

    addLeadActivity({
      leadId: tempId,
      actionType: 'created',
      title: 'Inbound Lead Created',
      description: `Lead created from ${newLead.source || 'Outreach'} with agreed budget of ${newLead.budget || '$0'}. 1st deposit (30%): $${quoteAmt.toLocaleString()} ${newLead.currency || 'USD'}.`,
      performedBy: newLead.assignedTo || 'Nagireddy Sai Prabhath',
    });

    // Commit to Supabase and update ID with database record
    createLiveLead({
      ...leadData,
      paypalPaymentLink: autoPaypal,
    }).then((saved) => {
      if (saved) {
        setLeads((prev) => prev.map((l) => (l.id === tempId ? saved : l)));
        setLeadActivities((prev) => prev.map((a) => (a.leadId === tempId ? { ...a, leadId: saved.id } : a)));
        createLiveLeadActivity({
          leadId: saved.id,
          actionType: 'created',
          title: 'Inbound Lead Created',
          description: `Lead created from ${saved.source || 'Outreach'} with agreed budget of ${saved.budget || '$0'}. 1st deposit (30%): $${quoteAmt.toLocaleString()} ${saved.currency || 'USD'}.`,
          performedBy: saved.assignedTo || 'Nagireddy Sai Prabhath',
        });
      }
    });

    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString() } : lead))
    );
    updateLiveLead(id, updates);
  };

  const deleteLead = (id: string) => {
    const target = leads.find((l) => l.id === id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setLeadActivities((prev) => prev.filter((a) => a.leadId !== id));
    if (target) {
      logActivity('Lead Removed', `${target.name} was removed from the pipeline.`, 'lead');
    }
    deleteLiveLead(id);
    deleteLiveLeadActivities(id);
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    const target = leads.find((l) => l.id === id);
    if (!target) return;

    updateLead(id, { status });
    logActivity(
      `Lead Stage: ${status}`,
      `${target.name} (${target.company || target.serviceType}) stage moved to ${status}.`,
      'lead',
      target.assignedTo
    );

    addLeadActivity({
      leadId: id,
      actionType: 'status_changed',
      title: `Stage Changed to "${status}"`,
      description: `Pipeline stage moved to "${status}".`,
      performedBy: target.assignedTo || 'Nagireddy Sai Prabhath',
    });
  };

  const generateLeadPayPalLink = (
    leadId: string,
    amount?: number,
    currency?: string
  ): string => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return '';

    const effectiveAmount = amount ?? (lead.quoteAmount ? Math.round(lead.quoteAmount) : 3000);
    const effectiveCurrency = currency || lead.currency || settings.defaultCurrency || 'USD';

    const link = generatePayPalMeLink({
      paypalHandle: settings.paypalHandle,
      amount: effectiveAmount,
      currency: effectiveCurrency,
    });

    updateLead(leadId, {
      paypalPaymentLink: link,
      status: 'Link Sent',
    });

    // Also track in payments as Link Sent
    addPayment({
      leadId: lead.id,
      leadName: `${lead.name} (${lead.company || lead.serviceType})`,
      amount: effectiveAmount,
      currency: effectiveCurrency,
      type: 'Deposit (30%)',
      status: 'Link Sent',
      paymentLink: link,
      receiptSent: false,
    });

    logActivity(
      'PayPal Deposit Link Generated',
      `Generated $${effectiveAmount.toLocaleString()} ${effectiveCurrency} deposit link for ${lead.name}.`,
      'payment',
      lead.assignedTo
    );

    addLeadActivity({
      leadId,
      actionType: 'payment_link_generated',
      title: 'PayPal Deposit Link Generated',
      description: `Generated $${effectiveAmount.toLocaleString()} ${effectiveCurrency} PayPal deposit link (30% kickoff deposit).`,
      performedBy: lead.assignedTo || 'Nagireddy Sai Prabhath',
    });

    return link;
  };

  const convertLeadToClient = (
    leadId: string,
    customProjectTitle?: string,
    contractData?: {
      signerName?: string;
      signerTitle?: string;
      signatureDataUrl?: string;
      signedAt?: string;
      receiptEmailId?: string;
      onboardingEmailId?: string;
    }
  ): ConvertResult => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const now = new Date().toISOString();
    const rawBudget = lead.budget ? Number(String(lead.budget).replace(/[^0-9.]/g, '')) : 0;
    const contractVal = rawBudget > 0 ? rawBudget : (lead.quoteAmount ? Math.round(lead.quoteAmount / 0.3) : 5000);
    const deposit1Val = lead.quoteAmount || Math.round(contractVal * 0.30);
    const deposit2Val = Math.round(contractVal * 0.35);
    const deposit3Val = contractVal - deposit1Val - deposit2Val;

    // 1. Check if organization already exists in clients
    const existingClient = lead.company && lead.company !== lead.name
      ? clients.find((c) => c.organizationName.toLowerCase() === (lead.company || '').toLowerCase().trim())
      : null;

    let activeClient: Client;

    if (existingClient) {
      activeClient = {
        ...existingClient,
        totalLtv: (existingClient.totalLtv || 0) + contractVal,
        totalPaid: (existingClient.totalPaid || 0) + deposit1Val,
        updatedAt: now,
      };
      setClients((prev) => prev.map((c) => (c.id === existingClient.id ? activeClient : c)));
      updateLiveClient(existingClient.id, {
        totalLtv: activeClient.totalLtv,
        totalPaid: activeClient.totalPaid,
      });
    } else {
      activeClient = {
        id: `client-${Date.now()}`,
        organizationName: lead.company || lead.name,
        primaryContactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        country: lead.country,
        tier: contractVal >= 10000 ? 'VIP Flagship' : 'Growth Studio',
        leadId: lead.id,
        assignedLeadPartner: lead.assignedTo,
        totalLtv: contractVal,
        totalPaid: deposit1Val,
        onboardingStatus: {
          brandAssets: false,
          credentials: false,
          kickoffBooked: false,
          slackInvited: true,
        },
        contractAgreement: {
          signed: true,
          signerName: contractData?.signerName || lead.name,
          signerTitle: contractData?.signerTitle || 'Authorized Client Signer',
          signedAt: contractData?.signedAt || now,
          signatureDataUrl: contractData?.signatureDataUrl,
          termsAgreed: true,
          agreementVersion: 'QDL-MSA-2026.1',
          scopeSummary: `${lead.serviceType} Sprint (30% kickoff / 35% milestone / 35% launch)`,
        },
        notes: `Converted from inbound lead with signed MSA agreement. Brief: ${lead.details}`,
        createdAt: now,
        updatedAt: now,
      };
      setClients((prev) => [activeClient, ...prev]);

      createLiveClient({
        organizationName: activeClient.organizationName,
        primaryContactName: activeClient.primaryContactName,
        email: activeClient.email,
        phone: activeClient.phone,
        country: activeClient.country,
        tier: activeClient.tier,
        leadId: activeClient.leadId,
        assignedLeadPartner: activeClient.assignedLeadPartner,
        totalLtv: activeClient.totalLtv,
        totalPaid: activeClient.totalPaid,
        onboardingStatus: activeClient.onboardingStatus,
        notes: activeClient.notes,
      }).then((savedClient) => {
        if (savedClient) {
          setClients((prev) => prev.map((c) => (c.id === activeClient.id ? savedClient : c)));
        }
      });
    }

    // 2. Instantiate Project
    const targetLaunch = new Date();
    targetLaunch.setDate(targetLaunch.getDate() + 28);

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      clientId: activeClient.id,
      title: customProjectTitle || `${activeClient.organizationName} — ${lead.serviceType}`,
      servicePillar: lead.serviceType,
      contractValue: contractVal,
      currency: lead.currency || 'USD',
      status: 'Planning',
      progressPercent: 15,
      startDate: new Date().toISOString().split('T')[0],
      targetLaunchDate: targetLaunch.toISOString().split('T')[0],
      milestones: [
        { id: `m1-${Date.now()}`, title: 'Kickoff & Architecture Discovery', completed: true, dueDate: 'Sprint 1' },
        { id: `m2-${Date.now()}`, title: 'UI/UX Polish & Interactive Prototypes', completed: false, dueDate: 'Sprint 2' },
        { id: `m3-${Date.now()}`, title: 'Next.js 16 Full-Stack & API Build', completed: false, dueDate: 'Sprint 3' },
        { id: `m4-${Date.now()}`, title: 'QA, Speed Audit & Production Launch', completed: false, dueDate: 'Sprint 4' },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProject, ...prev]);

    // 3. 3-Installment Payments (30% / 35% / 35%)
    const milestone2PaymentLink = generatePayPalMeLink({
      paypalHandle: settings.paypalHandle,
      amount: deposit2Val,
      currency: lead.currency || 'USD',
    });

    const milestone3PaymentLink = generatePayPalMeLink({
      paypalHandle: settings.paypalHandle,
      amount: deposit3Val,
      currency: lead.currency || 'USD',
    });

    const depositPayment: Payment = {
      id: `pay-${Date.now()}-1`,
      clientId: activeClient.id,
      clientName: activeClient.organizationName,
      leadId: lead.id,
      leadName: `${lead.name} (${activeClient.organizationName})`,
      amount: deposit1Val,
      currency: lead.currency || 'USD',
      type: 'Deposit (30%)',
      status: 'Paid',
      paypalReferenceId: `PP-TX-${Date.now().toString().slice(-6)}`,
      paymentLink: lead.paypalPaymentLink || generatePayPalMeLink({ paypalHandle: settings.paypalHandle, amount: deposit1Val, currency: lead.currency || 'USD' }),
      receiptSent: true,
      paidAt: now,
      createdAt: now,
    };

    const milestone2Payment: Payment = {
      id: `pay-${Date.now()}-2`,
      clientId: activeClient.id,
      clientName: activeClient.organizationName,
      leadId: lead.id,
      leadName: `${lead.name} (${activeClient.organizationName})`,
      amount: deposit2Val,
      currency: lead.currency || 'USD',
      type: 'Milestone 2 (35%)',
      status: 'Pending',
      paymentLink: milestone2PaymentLink,
      receiptSent: false,
      createdAt: now,
    };

    const finalMilestonePayment: Payment = {
      id: `pay-${Date.now()}-3`,
      clientId: activeClient.id,
      clientName: activeClient.organizationName,
      leadId: lead.id,
      leadName: `${lead.name} (${activeClient.organizationName})`,
      amount: deposit3Val,
      currency: lead.currency || 'USD',
      type: 'Final Launch (35%)',
      status: 'Pending',
      paymentLink: milestone3PaymentLink,
      receiptSent: false,
      createdAt: now,
    };

    setPayments((prev) => [depositPayment, milestone2Payment, finalMilestonePayment, ...prev.filter((p) => p.leadId !== leadId)]);

    // 4. Update Lead Status in Database & React state
    updateLead(leadId, { status: 'Converted' });

    // Commit Project & Payments to Supabase in Background
    createLiveProject({
      clientId: activeClient.id,
      title: newProject.title,
      servicePillar: newProject.servicePillar,
      contractValue: newProject.contractValue,
      currency: newProject.currency,
      status: newProject.status,
      progressPercent: newProject.progressPercent,
      startDate: newProject.startDate,
      targetLaunchDate: newProject.targetLaunchDate,
      milestones: newProject.milestones,
    }).then((savedProj) => {
      if (savedProj) {
        setProjects((prev) => prev.map((p) => (p.id === newProject.id ? savedProj : p)));
      }
    });

    createLivePayment({
      clientId: activeClient.id,
      leadId: lead.id,
      amount: depositPayment.amount,
      currency: depositPayment.currency,
      type: 'Deposit (30%)',
      status: 'Paid',
      paypalReferenceId: depositPayment.paypalReferenceId,
      paymentLink: depositPayment.paymentLink,
      receiptSent: true,
      paidAt: depositPayment.paidAt,
    });

    createLivePayment({
      clientId: activeClient.id,
      leadId: lead.id,
      amount: milestone2Payment.amount,
      currency: milestone2Payment.currency,
      type: 'Milestone 2 (35%)',
      status: 'Pending',
      paymentLink: milestone2Payment.paymentLink,
      receiptSent: false,
    });

    createLivePayment({
      clientId: activeClient.id,
      leadId: lead.id,
      amount: finalMilestonePayment.amount,
      currency: finalMilestonePayment.currency,
      type: 'Final Launch (35%)',
      status: 'Pending',
      paymentLink: finalMilestonePayment.paymentLink,
      receiptSent: false,
    });

    addLeadActivity({
      leadId: lead.id,
      clientId: activeClient.id,
      actionType: 'converted',
      title: '🎉 Lead Converted to Active Client',
      description: `${lead.name} (${activeClient.organizationName}) converted to active client. 3-stage milestone payment plan scheduled ($${deposit1Val.toLocaleString()} Kickoff / $${deposit2Val.toLocaleString()} Mid-Dev / $${deposit3Val.toLocaleString()} Launch).`,
      performedBy: lead.assignedTo || 'Nagireddy Sai Prabhath',
    });

    logActivity(
      '🎉 Lead Converted to Active Client!',
      `${lead.name} (${activeClient.organizationName}) is now an active client. Project initialized.`,
      'project',
      lead.assignedTo
    );

    return { client: activeClient, project: newProject };
  };

  const transferLeadToPartner = (leadId: string, partnerId: string, referralRate: number = 10) => {
    const lead = leads.find((l) => l.id === leadId);
    const partner = partnerAgencies.find((p) => p.id === partnerId);
    if (!lead || !partner) return;

    const commissionAmount = Math.round(((lead.quoteAmount || 3000) * referralRate) / 100);

    updateLead(leadId, {
      status: 'Referred Out',
      handlingMode: 'Referred Out',
      partnerAgencyId: partner.id,
      referralCommissionRate: referralRate,
      referralCommissionAmount: commissionAmount,
    });

    // Update partner stats
    const updatedStats = {
      totalReferredLeads: partner.totalReferredLeads + 1,
      totalCommissionEarned: partner.totalCommissionEarned + commissionAmount,
    };
    updateLivePartner(partner.id, updatedStats);

    setPartnerAgencies((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, ...updatedStats } : p))
    );

    logActivity(
      'Lead Transferred to Partner Agency',
      `${lead.name} transferred to ${partner.name} (${referralRate}% / $${commissionAmount.toLocaleString()} fee logged).`,
      'partner',
      lead.assignedTo
    );
  };

  // ==========================================
  // CLIENT ACTIONS (Direct Database Operations)
  // ==========================================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
    const tempId = `client-${Date.now()}`;
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    setClients((prev) => [newClient, ...prev]);
    logActivity('New Client Added', `${newClient.organizationName} profile created.`, 'project', newClient.assignedLeadPartner);

    createLiveClient(clientData).then((saved) => {
      if (saved) {
        setClients((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
      }
    });

    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...updates, updatedAt: new Date().toISOString() } : client
      )
    );
    updateLiveClient(id, updates);
  };

  const deleteClient = (id: string) => {
    const target = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (target) {
      logActivity('Client Removed', `${target.organizationName} was removed.`, 'project');
    }
    deleteLiveClient(id);
  };

  const toggleOnboardingItem = (clientId: string, key: keyof Client['onboardingStatus']) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const updatedOnboarding = {
      ...client.onboardingStatus,
      [key]: !client.onboardingStatus[key],
    };

    updateClient(clientId, { onboardingStatus: updatedOnboarding });
    logActivity(
      'Onboarding Checklist Updated',
      `${client.organizationName}: ${key} marked as ${updatedOnboarding[key] ? 'Complete' : 'Pending'}.`,
      'project',
      client.assignedLeadPartner
    );
  };

  // ==========================================
  // PROJECT ACTIONS (Direct Database Operations)
  // ==========================================
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const tempId = `proj-${Date.now()}`;
    const now = new Date().toISOString();
    const newProj: Project = {
      ...projectData,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProj, ...prev]);

    createLiveProject(projectData).then((saved) => {
      if (saved) {
        setProjects((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
      }
    });

    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === id ? { ...proj, ...updates, updatedAt: new Date().toISOString() } : proj
      )
    );
    updateLiveProject(id, updates);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    deleteLiveProject(id);
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedMilestones = project.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: progress,
      status: progress === 100 ? 'Launched' : 'In Progress',
    });
  };

  const addMilestone = (projectId: string, title: string, dueDate?: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newMilestone = {
      id: `m-${Date.now()}`,
      title,
      completed: false,
      dueDate: dueDate || 'Upcoming',
    };

    const updatedMilestones = [...project.milestones, newMilestone];
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: progress,
    });
  };

  const deleteMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedMilestones = project.milestones.filter((m) => m.id !== milestoneId);
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: progress,
    });
  };

  // ==========================================
  // PAYMENT ACTIONS (Direct Database Operations)
  // ==========================================
  const addPayment = (paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const tempId = `pay-${Date.now()}`;
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...paymentData,
      id: tempId,
      createdAt: now,
    };

    setPayments((prev) => [newPayment, ...prev]);

    createLivePayment(paymentData).then((saved) => {
      if (saved) {
        setPayments((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
      }
    });

    return newPayment;
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus, paypalRefId?: string) => {
    const target = payments.find((p) => p.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updates = {
      status,
      paypalReferenceId: paypalRefId || target.paypalReferenceId || `PP-TX-${Date.now().toString().slice(-6)}`,
      paidAt: status === 'Paid' ? now : target.paidAt,
    };

    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    updateLivePayment(id, updates);

    // If client payment, update client total paid
    if (target.clientId && status === 'Paid') {
      const client = clients.find((c) => c.id === target.clientId);
      if (client) {
        updateClient(client.id, {
          totalPaid: (client.totalPaid || 0) + target.amount,
        });
      }
    }

    logActivity(
      `Payment Status: ${status}`,
      `Payment of $${target.amount.toLocaleString()} for ${target.clientName || target.leadName || 'Lead'} marked as ${status}.`,
      'payment'
    );
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    deleteLivePayment(id);
  };

  const sendPaymentReceipt = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return null;

    const client = clients.find((c) => c.id === payment.clientId);
    const receipt = generatePaymentReceiptEmail({
      clientName: client?.primaryContactName || 'Valued Client',
      organizationName: client?.organizationName || payment.clientName || 'Client Project',
      projectName: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      paypalRefId: payment.paypalReferenceId,
      assignedPartner: client?.assignedLeadPartner || 'Nagireddy Sai Prabhath',
    });

    updatePaymentStatus(paymentId, payment.status);
    updateLivePayment(paymentId, { receiptSent: true });

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, receiptSent: true } : p))
    );

    logActivity(
      'Receipt & Onboarding Email Sent',
      `Sent formal confirmation for $${payment.amount.toLocaleString()} to ${payment.clientName || 'Client'}.`,
      'payment'
    );

    return receipt;
  };

  // ==========================================
  // PARTNER ACTIONS (Direct Database Operations)
  // ==========================================
  const addPartnerAgency = (
    partnerData: Omit<PartnerAgency, 'id' | 'createdAt' | 'totalReferredLeads' | 'totalCommissionEarned' | 'totalCommissionPaid'>
  ): PartnerAgency => {
    const tempId = `partner-${Date.now()}`;
    const newPartner: PartnerAgency = {
      ...partnerData,
      id: tempId,
      totalReferredLeads: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      createdAt: new Date().toISOString(),
    };

    setPartnerAgencies((prev) => [newPartner, ...prev]);
    logActivity('New Partner Agency Added', `${newPartner.name} added to agency network.`, 'partner');

    createLivePartner(partnerData).then((saved) => {
      if (saved) {
        setPartnerAgencies((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
      }
    });

    return newPartner;
  };

  const updatePartnerAgency = (id: string, updates: Partial<PartnerAgency>) => {
    setPartnerAgencies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    updateLivePartner(id, updates);
  };

  const deletePartnerAgency = (id: string) => {
    setPartnerAgencies((prev) => prev.filter((p) => p.id !== id));
    deleteLivePartner(id);
  };

  // ==========================================
  // SETTINGS & SYSTEM ACTIONS
  // ==========================================
  const updateSettings = (updates: Partial<AgencySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    logActivity('Agency Settings Updated', 'System configuration and preferences saved.', 'ai');
  };

  const resetToSeedData = async () => {
    setLeads([]);
    setClients([]);
    setProjects([]);
    setPayments([]);
    setPartnerAgencies([]);
    setActivityLogs([]);
    setSettings(INITIAL_SETTINGS);
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    await refreshData();
    logActivity('CRM Cache Cleared', 'Reloaded fresh records directly from Supabase database.', 'ai');
  };

  const exportBackupJSON = (): string => {
    const backup = {
      leads,
      clients,
      projects,
      payments,
      partnerAgencies,
      activityLogs,
      settings,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.leads) setLeads(data.leads);
      if (data.clients) setClients(data.clients);
      if (data.projects) setProjects(data.projects);
      if (data.payments) setPayments(data.payments);
      if (data.partnerAgencies) setPartnerAgencies(data.partnerAgencies);
      if (data.activityLogs) setActivityLogs(data.activityLogs);
      if (data.settings) setSettings(data.settings);
      logActivity('Data Backup Restored', 'CRM data successfully imported from backup file.', 'ai');
      return true;
    } catch (err) {
      console.error('Backup import error:', err);
      return false;
    }
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        clients,
        projects,
        payments,
        partnerAgencies,
        activityLogs,
        leadActivities,
        settings,
        isHydrated,
        isLoading,
        refreshData,
        addLead,
        updateLead,
        deleteLead,
        updateLeadStatus,
        generateLeadPayPalLink,
        convertLeadToClient,
        transferLeadToPartner,
        addLeadActivity,
        addClient,
        updateClient,
        deleteClient,
        toggleOnboardingItem,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addMilestone,
        deleteMilestone,
        addPayment,
        updatePaymentStatus,
        deletePayment,
        sendPaymentReceipt,
        addPartnerAgency,
        updatePartnerAgency,
        deletePartnerAgency,
        updateSettings,
        resetToSeedData,
        exportBackupJSON,
        importBackupJSON,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isMobileNavOpen,
        toggleMobileNav,
        setIsMobileNavOpen,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}

