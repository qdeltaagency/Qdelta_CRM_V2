import { Lead, Client, Project, Payment, PartnerAgency, ActivityLog, AgencySettings } from './types';

export const INITIAL_SETTINGS: AgencySettings = {
  paypalHandle: 'qdeltastudio',
  defaultCurrency: 'USD',
  companyName: 'Qdelta Digital Studio',
  agencyContactEmail: 'hello@qdelta.io',
  n8nLeadWebhookUrl: '',
  n8nPaymentWebhookUrl: '',
  n8nOnboardingWebhookUrl: '',
};

export const INITIAL_PARTNER_AGENCIES: PartnerAgency[] = [];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

