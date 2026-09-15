'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormGroup, FormLabel, Input, Textarea, FormError } from '@/components/ui/form';
import { CRMSelect } from '@/components/ui/crm-select';
import { CountrySelect } from '@/components/common/country-select';
import { Client, getClients } from '@/lib/clients-service';
import {
  CreateLeadInput,
  createLead,
  LeadSourceType,
  LeadSourcePlatform,
  SERVICE_OPTIONS,
  SOURCE_PLATFORM_OPTIONS,
  CURRENCY_OPTIONS,
  getCurrencyForCountry,
} from '@/lib/leads-service';
import { useToast } from '@/components/ui/toast';
import { User, Building, Mail, Check, X, Sparkles, ArrowRight } from 'lucide-react';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeadFormModal({ isOpen, onClose, onSuccess }: LeadFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Directory clients for smart autocomplete
  const [clients, setClients] = React.useState<Client[]>([]);
  const [activeField, setActiveField] = React.useState<'email' | 'company' | null>(null);
  const [dismissedExactMatchId, setDismissedExactMatchId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<CreateLeadInput>({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    service: '',
    requirements: '',
    notes: '',
    source_type: undefined,
    source_platform: null,
    custom_source: '',
    client_type: 'new',
    existing_client_id: null,
    budget: undefined,
    currency: 'USD',
    timeline: '',
  });

  // Load client directory on open for instantaneous 0ms latency matching
  React.useEffect(() => {
    if (isOpen) {
      getClients()
        .then((data) => setClients(data))
        .catch((err) => console.error('Error loading clients for autocomplete:', err));

      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        country: '',
        service: '',
        requirements: '',
        notes: '',
        source_type: undefined,
        source_platform: null,
        custom_source: '',
        client_type: 'new',
        existing_client_id: null,
        budget: undefined,
        currency: 'USD',
        timeline: '',
      });
      setActiveField(null);
      setDismissedExactMatchId(null);
      setError(null);
    }
  }, [isOpen]);

  // Find linked client object if lead is linked
  const linkedClient = React.useMemo(() => {
    if (!formData.existing_client_id) return null;
    return clients.find((c) => c.id === formData.existing_client_id) || null;
  }, [clients, formData.existing_client_id]);

  // Filter autocomplete suggestions based on active typing
  const autocompleteSuggestions = React.useMemo(() => {
    if (formData.existing_client_id) return [];

    const emailQuery = (formData.email || '').trim().toLowerCase();
    const companyQuery = (formData.company || '').trim().toLowerCase();

    if (activeField === 'email') {
      if (emailQuery.length < 2) return [];
      return clients
        .filter((c) => c.email?.toLowerCase().includes(emailQuery) || c.name.toLowerCase().includes(emailQuery))
        .slice(0, 4);
    }

    if (activeField === 'company') {
      if (companyQuery.length < 2) return [];
      return clients
        .filter((c) => (c.company && c.company.toLowerCase().includes(companyQuery)) || c.name.toLowerCase().includes(companyQuery))
        .slice(0, 4);
    }

    return [];
  }, [clients, formData.email, formData.company, formData.existing_client_id, activeField]);

  // Exact match detection for fallback card
  const exactMatchClient = React.useMemo(() => {
    if (formData.existing_client_id) return null;

    const email = (formData.email || '').trim().toLowerCase();
    const company = (formData.company || '').trim().toLowerCase();

    if (email && email.includes('@')) {
      const match = clients.find((c) => c.email?.toLowerCase() === email);
      if (match && match.id !== dismissedExactMatchId) return match;
    }

    if (company && company.length >= 3) {
      const match = clients.find((c) => c.company?.toLowerCase() === company);
      if (match && match.id !== dismissedExactMatchId) return match;
    }

    return null;
  }, [clients, formData.email, formData.company, formData.existing_client_id, dismissedExactMatchId]);

  // Select client from autocomplete or fallback card
  const handleSelectClient = (client: Client) => {
    setFormData((prev) => ({
      ...prev,
      client_type: 'existing',
      existing_client_id: client.id,
      name: prev.name.trim() ? prev.name : client.name,
      company: client.company || prev.company || '',
      email: client.email || prev.email || '',
      phone: client.phone || prev.phone || '',
      country: client.country || prev.country || '',
      currency: client.country ? getCurrencyForCountry(client.country) : prev.currency || 'USD',
      // Note: service remains untouched so user can choose whatever new service is requested
    }));
    setActiveField(null);
  };

  // Unlink client
  const handleUnlinkClient = () => {
    setFormData((prev) => ({
      ...prev,
      client_type: 'new',
      existing_client_id: null,
    }));
  };

  const handleChange = (
    field: keyof CreateLeadInput,
    value: unknown
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'country' && typeof value === 'string' && value) {
        updated.currency = getCurrencyForCountry(value);
      }
      if (field === 'source_type' && value === 'website') {
        updated.source_platform = null;
        updated.custom_source = '';
      }
      if (field === 'source_platform' && value !== 'other') {
        updated.custom_source = '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields (everything except Requirements & Internal Notes)
    if (!formData.name?.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.company?.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!formData.email?.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!formData.phone?.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!formData.country?.trim()) {
      setError('Country is required.');
      return;
    }
    if (!formData.service?.trim()) {
      setError('Please select a service.');
      return;
    }
    if (!formData.source_type) {
      setError('Source Type is required.');
      return;
    }
    if (formData.source_type === 'manual' && !formData.source_platform) {
      setError('Please select a source platform.');
      return;
    }
    if (formData.source_type === 'manual' && formData.source_platform === 'other' && !formData.custom_source?.trim()) {
      setError('Please specify the custom source details.');
      return;
    }
    if (!formData.currency?.trim()) {
      setError('Currency is required.');
      return;
    }
    if (!formData.budget || Number(formData.budget) <= 0) {
      setError('Budget is required and must be greater than 0.');
      return;
    }
    if (!formData.timeline?.trim()) {
      setError('Project timeline is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createLead(formData);
      toast({
        type: 'success',
        title: 'Lead Added',
        description: `Lead "${formData.name.trim()}" created successfully.`,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create lead.';
      setError(message);
      toast({
        type: 'error',
        title: 'Creation Failed',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Lead"
      description="Enter lead details, attribution, and project requirements."
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-lead-form"
            variant="default"
            size="sm"
            isLoading={isSubmitting}
          >
            Create Lead
          </Button>
        </>
      }
    >
      <form id="add-lead-form" onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
        {error && <FormError>{error}</FormError>}

        {/* Subtle Linked Client Tag */}
        {formData.existing_client_id && (
          <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/20 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                Linked to existing client:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {linkedClient?.name || formData.name}
              </span>
              {linkedClient?.company && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  ({linkedClient.company})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleUnlinkClient}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 ml-2"
            >
              <X className="w-3 h-3" />
              <span>Unlink</span>
            </button>
          </div>
        )}

        {/* Contact & Lead Details */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Lead Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup>
              <FormLabel required htmlFor="lead-name">
                Full Name
              </FormLabel>
              <Input
                id="lead-name"
                placeholder="e.g. Alex Morgan"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                autoComplete="off"
                required
              />
            </FormGroup>

            {/* Company with Smart Autocomplete */}
            <div className="relative">
              <FormGroup>
                <FormLabel required htmlFor="lead-company">
                  Company
                </FormLabel>
                <Input
                  id="lead-company"
                  placeholder="e.g. Acme Studio"
                  value={formData.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  onFocus={() => setActiveField('company')}
                  onBlur={() => {
                    setTimeout(() => setActiveField((prev) => (prev === 'company' ? null : prev)), 200);
                  }}
                  autoComplete="off"
                  required
                />
              </FormGroup>

              {/* Company Autocomplete Dropdown */}
              {activeField === 'company' && autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden animate-fade-in divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  <div className="p-1.5 px-2.5 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span>Existing Clients</span>
                    <span>Click to Autofill Contact</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
                    {autocompleteSuggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectClient(client);
                        }}
                        className="flex w-full items-center justify-between p-2 rounded-md text-xs text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {client.company || client.name}
                            </span>
                            {client.company && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                ({client.name})
                              </span>
                            )}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-600 group-hover:text-white text-zinc-600 dark:text-zinc-400 transition-colors shrink-0">
                          Autofill Contact →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email with Smart Autocomplete */}
            <div className="relative">
              <FormGroup>
                <FormLabel required htmlFor="lead-email">
                  Email
                </FormLabel>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="alex@acme.com"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => setActiveField('email')}
                  onBlur={() => {
                    setTimeout(() => setActiveField((prev) => (prev === 'email' ? null : prev)), 200);
                  }}
                  autoComplete="off"
                  required
                />
              </FormGroup>

              {/* Email Autocomplete Dropdown */}
              {activeField === 'email' && autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden animate-fade-in divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  <div className="p-1.5 px-2.5 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span>Existing Clients</span>
                    <span>Click to Autofill Contact</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
                    {autocompleteSuggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectClient(client);
                        }}
                        className="flex w-full items-center justify-between p-2 rounded-md text-xs text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {client.name}
                            </span>
                            {client.company && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                                <Building className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                {client.company}
                              </span>
                            )}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <Mail className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-600 group-hover:text-white text-zinc-600 dark:text-zinc-400 transition-colors shrink-0">
                          Autofill Contact →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormGroup>
              <FormLabel required htmlFor="lead-phone">
                Phone
              </FormLabel>
              <Input
                id="lead-phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                autoComplete="off"
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel required htmlFor="lead-country">
                Country
              </FormLabel>
              <CountrySelect
                value={formData.country || ''}
                onChange={(val) => handleChange('country', val)}
                placeholder="Select or search country..."
              />
            </FormGroup>

            <FormGroup>
              <FormLabel required htmlFor="lead-service">
                Service
              </FormLabel>
              <CRMSelect
                id="lead-service"
                value={formData.service || ''}
                options={SERVICE_OPTIONS}
                placeholder="Select requested service..."
                onChange={(val) => handleChange('service', val)}
              />
            </FormGroup>
          </div>
        </div>

        {/* Fallback Clean Card when exact match detected (Linear / Stripe Style) */}
        {exactMatchClient && !activeField && (
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs shrink-0">
                {exactMatchClient.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {exactMatchClient.name}
                  </span>
                  {exactMatchClient.company && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      • {exactMatchClient.company}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                  {exactMatchClient.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 px-2.5 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer shadow-none"
                onClick={() => handleSelectClient(exactMatchClient)}
              >
                <span>Use this client</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                onClick={() => setDismissedExactMatchId(exactMatchClient.id)}
              >
                Create new instead
              </Button>
            </div>
          </div>
        )}

        {/* Source & Attribution */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Source & Attribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup>
              <FormLabel required htmlFor="lead-source-type">
                Source Type
              </FormLabel>
              <CRMSelect
                id="lead-source-type"
                value={formData.source_type || ''}
                placeholder="Select source type..."
                options={[
                  { value: 'manual', label: 'Manual Entry' },
                  { value: 'website', label: 'Website Ingestion' },
                ]}
                onChange={(val) => handleChange('source_type', val as LeadSourceType)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel required htmlFor="lead-source-platform">
                Source Platform
              </FormLabel>
              <CRMSelect
                id="lead-source-platform"
                value={formData.source_platform || ''}
                placeholder={
                  !formData.source_type
                    ? 'Select source type first...'
                    : formData.source_type === 'website'
                    ? 'Direct Web Form'
                    : 'Select source platform...'
                }
                disabled={!formData.source_type || formData.source_type === 'website'}
                options={
                  formData.source_type === 'website'
                    ? [{ value: '', label: 'Direct Web Form' }]
                    : SOURCE_PLATFORM_OPTIONS
                }
                onChange={(val) =>
                  handleChange('source_platform', val as LeadSourcePlatform)
                }
              />
            </FormGroup>

            {formData.source_type === 'manual' && formData.source_platform === 'other' && (
              <div className="sm:col-span-2">
                <FormGroup>
                  <FormLabel required htmlFor="lead-custom-source">
                    Custom Source Input
                  </FormLabel>
                  <Input
                    id="lead-custom-source"
                    placeholder="Enter custom source (e.g. Podcast, Event, Twitter DM...)"
                    value={formData.custom_source || ''}
                    onChange={(e) => handleChange('custom_source', e.target.value)}
                    required
                  />
                </FormGroup>
              </div>
            )}
          </div>
        </div>

        {/* Commercial & Timeline */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Commercial & Timeline
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormGroup>
              <FormLabel required htmlFor="lead-currency">
                Currency
              </FormLabel>
              <CRMSelect
                id="lead-currency"
                value={formData.currency || 'USD'}
                options={CURRENCY_OPTIONS}
                onChange={(val) => handleChange('currency', val)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel required htmlFor="lead-budget">
                Budget
              </FormLabel>
              <Input
                id="lead-budget"
                type="number"
                min="1"
                placeholder="5000"
                value={formData.budget ? formData.budget : ''}
                onChange={(e) =>
                  handleChange('budget', e.target.value === '' ? undefined : Number(e.target.value))
                }
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel required htmlFor="lead-timeline">
                Timeline (e.g. 2 weeks, 1 month)
              </FormLabel>
              <Input
                id="lead-timeline"
                placeholder="e.g. 2 weeks, 1 month"
                value={formData.timeline || ''}
                onChange={(e) => handleChange('timeline', e.target.value)}
                required
              />
            </FormGroup>
          </div>
        </div>

        {/* Requirements & Internal Notes (Optional) */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
          <FormGroup>
            <FormLabel htmlFor="lead-requirements">
              Requirements <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span>
            </FormLabel>
            <Textarea
              id="lead-requirements"
              rows={2}
              placeholder="Project scope, design requirements, key deliverables..."
              value={formData.requirements || ''}
              onChange={(e) => handleChange('requirements', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="lead-notes">
              Internal Notes <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span>
            </FormLabel>
            <Textarea
              id="lead-notes"
              rows={2}
              placeholder="Internal notes, communication background..."
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </FormGroup>
        </div>
      </form>
    </Modal>
  );
}
