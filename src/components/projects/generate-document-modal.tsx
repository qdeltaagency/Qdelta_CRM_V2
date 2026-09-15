'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentType, createDocument, DocumentRecord } from '@/lib/documents-service';
import {
  FileText,
  FileCheck,
  Receipt,
  Shield,
  Send,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  Layers,
} from 'lucide-react';

interface ProjectLike {
  id: string;
  name: string;
  stage?: string;
  agreed_value?: number;
  currency?: string;
  client_id?: string | null;
  lead_id?: string | null;
  clients?: {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
  } | null;
  client_name?: string;
  client_company?: string | null;
  client_email?: string | null;
  service_type?: string | null;
  requirements?: string | null;
  timeline?: string | null;
}

interface GenerateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectLike | null;
  onDocumentGenerated?: (doc: DocumentRecord) => void;
}

const DOCUMENT_TYPES: {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}[] = [
  {
    type: 'proposal',
    label: 'Proposal & Scope',
    description: 'Technical scope, timeline, milestones & architectural design plan',
    icon: FileText,
    badge: 'Pre-Kickoff',
  },
  {
    type: 'invoice',
    label: 'Milestone Invoice',
    description: 'Official invoice for scheduled milestone deposits or sprint payments',
    icon: DollarSign,
    badge: 'Billing',
  },
  {
    type: 'receipt',
    label: 'Payment Receipt',
    description: 'Cryptographic proof of milestone settlement and payment confirmation',
    icon: Receipt,
    badge: 'Settlement',
  },
  {
    type: 'agreement',
    label: 'Client Agreement (MSA)',
    description: 'Master Services Agreement covering deliverables, terms & IP transfer',
    icon: FileCheck,
    badge: 'Legal',
  },
  {
    type: 'nda',
    label: 'Non-Disclosure (NDA)',
    description: 'Mutual confidentiality and trade-secret protection agreement',
    icon: Shield,
    badge: 'Confidentiality',
  },
  {
    type: 'handover',
    label: 'Final Handover Sign-Off',
    description: 'Production sign-off, repository handover, and asset transfer protocol',
    icon: Layers,
    badge: 'Delivery',
  },
];

export function GenerateDocumentModal({
  isOpen,
  onClose,
  project,
  onDocumentGenerated,
}: GenerateDocumentModalProps) {
  const [selectedType, setSelectedType] = React.useState<DocumentType>('proposal');
  const [documentTitle, setDocumentTitle] = React.useState('');
  const [agreedValue, setAgreedValue] = React.useState<number>(0);
  const [currency, setCurrency] = React.useState('USD');
  const [milestonePercentage, setMilestonePercentage] = React.useState<number>(30);
  const [timeline, setTimeline] = React.useState('2 - 4 Weeks');
  const [serviceType, setServiceType] = React.useState('Full-Stack Web & AI Application');
  const [notes, setNotes] = React.useState('');
  const [sendEmailImmediately, setSendEmailImmediately] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function getDefaultTitle(type: DocumentType, projName: string): string {
    const year = new Date().getFullYear();
    switch (type) {
      case 'proposal':
        return `Project Proposal — ${projName}`;
      case 'invoice':
        return `Invoice #${year}-${Math.floor(100 + Math.random() * 900)} — ${projName}`;
      case 'receipt':
        return `Payment Receipt — ${projName}`;
      case 'agreement':
      case 'client_agreement':
        return `Master Services Agreement — ${projName}`;
      case 'nda':
        return `Mutual Non-Disclosure Agreement — ${projName}`;
      case 'handover':
        return `Project Handover & Delivery Sign-Off — ${projName}`;
      default:
        return `Document — ${projName}`;
    }
  }

  // Sync default values when modal opens or project changes
  React.useEffect(() => {
    if (project) {
      const val = project.agreed_value || 0;
      setAgreedValue(val);
      setCurrency(project.currency || 'USD');
      setTimeline(project.timeline || '2 - 4 Weeks');
      setServiceType(project.service_type || 'Full-Stack Web & AI Application');
      setDocumentTitle(getDefaultTitle(selectedType, project.name));
    }
  }, [project, selectedType]);

  const handleTypeChange = (type: DocumentType) => {
    setSelectedType(type);
    if (project) {
      setDocumentTitle(getDefaultTitle(type, project.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const clientName =
        project.clients?.name || project.client_name || 'Client';
      const clientCompany =
        project.clients?.company || project.client_company || '';
      const clientEmail =
        project.clients?.email || project.client_email || '';

      const milestoneAmount = Math.round((agreedValue * milestonePercentage) / 100);
      const docNumber = `QD-${selectedType.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const metadata: Record<string, any> = {
        document_number: docNumber,
        project_name: project.name,
        client_name: clientName,
        client_company: clientCompany,
        client_email: clientEmail,
        client_phone: project.clients?.phone,
        client_country: project.clients?.country,
        service_type: serviceType,
        agreed_value: agreedValue,
        currency,
        timeline,
        notes,
        milestone_percentage: milestonePercentage,
        milestone_amount: milestoneAmount,
        created_at: new Date().toISOString(),
      };

      if (selectedType === 'invoice') {
        metadata.due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      if (selectedType === 'receipt') {
        metadata.paid_at = new Date().toISOString();
        metadata.transaction_ref = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      }

      const createdDoc = await createDocument({
        name: documentTitle || getDefaultTitle(selectedType, project.name),
        type: selectedType,
        project_id: project.id,
        client_id: project.client_id || project.clients?.id || null,
        lead_id: project.lead_id || null,
        status: 'generated',
        metadata,
      });

      // Dispatch automated email if requested and client email is available
      if (sendEmailImmediately && clientEmail) {
        try {
          const publicDocUrl = `${window.location.origin}/doc/${createdDoc.public_token}`;
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'document_notification',
              to: clientEmail,
              projectId: project.id,
              clientId: project.client_id,
              documentId: createdDoc.id,
              data: {
                clientName,
                companyName: clientCompany,
                projectTitle: project.name,
                documentType: selectedType,
                documentTitle: createdDoc.name,
                documentUrl: publicDocUrl,
                amount: selectedType === 'invoice' || selectedType === 'receipt' ? milestoneAmount : agreedValue,
                currency,
                customMessage: notes || undefined,
              },
            }),
          });
        } catch (mailErr) {
          console.warn('Could not dispatch automated document email:', mailErr);
        }
      }

      if (onDocumentGenerated) {
        onDocumentGenerated(createdDoc);
      }

      onClose();
    } catch (err: any) {
      console.error('Error generating document:', err);
      setError(err?.message || 'Failed to generate document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Studio Document"
      description="Create dynamic, client-ready PDF documents with instant public links and automated Resend delivery."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
          >
            {isSubmitting ? (
              <>Generating Document...</>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document Type Selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Select Document Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOCUMENT_TYPES.map((item) => {
                const isSelected = selectedType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleTypeChange(item.type)}
                    className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-white truncate">
                          {item.label}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Title */}
          <div className="space-y-1.5">
            <label htmlFor="docTitle" className="block text-xs text-zinc-300">
              Document Display Name
            </label>
            <Input
              id="docTitle"
              value={documentTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentTitle(e.target.value)}
              placeholder="e.g. Technical Proposal — Qdelta Studio"
              className="bg-zinc-950/60 border-zinc-800 text-xs text-white placeholder:text-zinc-600"
              required
            />
          </div>

          {/* Dynamic Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agreedValue" className="block text-xs text-zinc-300">
                Project Agreed Value ({currency})
              </label>
              <Input
                id="agreedValue"
                type="number"
                value={agreedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreedValue(Number(e.target.value))}
                className="bg-zinc-950/60 border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="timeline" className="block text-xs text-zinc-300">
                Sprint Timeline
              </label>
              <Input
                id="timeline"
                value={timeline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeline(e.target.value)}
                placeholder="e.g. 2 - 4 Weeks"
                className="bg-zinc-950/60 border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          {(selectedType === 'invoice' || selectedType === 'receipt') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-300">
                  Milestone Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  {[30, 35, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMilestonePercentage(pct)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium border transition-colors cursor-pointer ${
                        milestonePercentage === pct
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-300">Calculated Amount</label>
                <div className="text-base font-bold text-emerald-400 font-mono py-1">
                  ${Math.round((agreedValue * milestonePercentage) / 100).toLocaleString()} {currency}
                </div>
              </div>
            </div>
          )}

          {/* Service & Scope Description */}
          <div className="space-y-1.5">
            <label htmlFor="serviceType" className="block text-xs text-zinc-300">
              Service Pillar / Scope
            </label>
            <Input
              id="serviceType"
              value={serviceType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceType(e.target.value)}
              placeholder="e.g. Full-Stack Web & AI Application"
              className="bg-zinc-950/60 border-zinc-800 text-xs text-white"
            />
          </div>

          {/* Notes / Custom Terms */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs text-zinc-300">
              Custom Terms / Notes (Included in generated PDF & Email)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any specific deliverables, milestones, or instructions..."
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Email Notification Option */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">
                Send Transactional Email via Resend
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Recipient:{' '}
                <strong className="text-zinc-200">
                  {project?.clients?.email || project?.client_email || 'No email associated'}
                </strong>
              </span>
            </div>
            <input
              type="checkbox"
              checked={sendEmailImmediately}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendEmailImmediately(e.target.checked)}
              disabled={!(project?.clients?.email || project?.client_email)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
