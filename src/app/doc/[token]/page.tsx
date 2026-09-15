'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DocumentRecord, updateDocumentStatus } from '@/lib/documents-service';
import { renderDocumentHtml, DocumentData } from '@/lib/document-templates';
import {
  Printer,
  Share2,
  CheckCircle2,
  Lock,
  ArrowRight,
  Download,
  FileCheck,
  Building2,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicDocumentPage() {
  const params = useParams();
  const token = params?.token as string;

  const [document, setDocument] = React.useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const loadDocument = React.useCallback(async () => {
    if (!token || !supabase) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          projects (
            id,
            name,
            stage,
            agreed_value,
            currency,
            client_id
          ),
          clients (
            id,
            name,
            company,
            email,
            phone,
            country
          )
        `)
        .eq('public_token', token)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage('This document link is invalid, expired, or has been revoked.');
        return;
      }

      setDocument(data as DocumentRecord);
    } catch (err: unknown) {
      setErrorMessage('Unable to securely load document details.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcceptDocument = async () => {
    if (!document) return;
    setIsAccepting(true);
    try {
      const updated = await updateDocumentStatus(document.id, 'accepted', {
        accepted_via: 'public_portal',
        accepted_at: new Date().toISOString(),
        accepted_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      });
      setDocument(updated);
    } catch (err) {
      console.error('Failed to accept document:', err);
      alert('Could not record document acceptance. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Securing document connection...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !document) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl border border-zinc-800 bg-[#121215] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Document Not Accessible</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {errorMessage || 'The requested document could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  // Construct DocumentData payload for template renderer
  const docMeta = document.metadata || {};
  const templateData: DocumentData = {
    documentId: document.id,
    documentNumber: docMeta.document_number || `DOC-${document.id.substring(0, 8).toUpperCase()}`,
    documentType: document.type as any,
    title: document.name,
    createdDate: document.created_at,
    dueDate: docMeta.due_date,
    paidDate: docMeta.paid_at,
    clientName: document.clients?.name || docMeta.client_name || 'Client',
    clientCompany: document.clients?.company || docMeta.client_company,
    clientEmail: document.clients?.email || docMeta.client_email,
    clientPhone: document.clients?.phone || docMeta.client_phone,
    clientCountry: document.clients?.country || docMeta.client_country,
    projectName: document.projects?.name || docMeta.project_name || 'Design & Engineering Sprint',
    serviceType: docMeta.service_type || 'Full-Stack Development & Architecture',
    requirements: docMeta.requirements,
    timeline: docMeta.timeline || '2 - 4 Weeks Sprint',
    agreedValue: docMeta.agreed_value || document.projects?.agreed_value || 0,
    currency: docMeta.currency || document.projects?.currency || 'USD',
    milestoneNumber: docMeta.milestone_number,
    milestonePercentage: docMeta.milestone_percentage,
    milestoneAmount: docMeta.milestone_amount,
    paymentLink: docMeta.payment_link,
    transactionRef: docMeta.transaction_ref,
    notes: docMeta.notes,
  };

  const renderedHtml = renderDocumentHtml(templateData);

  const isAcceptable =
    (document.type === 'proposal' ||
      document.type === 'agreement' ||
      document.type === 'client_agreement' ||
      document.type === 'nda' ||
      document.type === 'handover') &&
    document.status !== 'accepted' &&
    document.status !== 'completed';

  const isAccepted = document.status === 'accepted' || document.status === 'completed';
  const hasPaymentLink = docMeta.payment_link && document.type === 'invoice';

  return (
    <div className="min-h-screen w-full bg-[#0c0c0e] text-zinc-100 flex flex-col items-center py-6 px-3 sm:px-6 font-sans">
      {/* Floating Action Controls Bar (Hidden during printing) */}
      <nav className="print:hidden w-full max-w-[860px] mb-6 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate max-w-[200px] sm:max-w-[320px]">
                {document.name}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  document.status === 'accepted' || document.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : document.status === 'sent'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {document.status}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block font-mono">
              {document.projects?.name ? `Project: ${document.projects.name}` : 'Qdelta Studio Official Record'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPaymentLink && (
            <a
              href={docMeta.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-md transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Pay Invoice Online
            </a>
          )}

          {isAcceptable && (
            <Button
              size="sm"
              onClick={handleAcceptDocument}
              disabled={isAccepting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5" />
              {isAccepting ? 'Confirming...' : 'Accept & Sign Document'}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? 'Copied' : 'Share Link'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print / PDF
          </Button>
        </div>
      </nav>

      {/* Acceptance Confirmation Banner */}
      {isAccepted && (
        <div className="print:hidden w-full max-w-[860px] mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              This document has been <strong>Officially Accepted</strong> and recorded in the project registry.
            </span>
          </div>
          {docMeta.accepted_at && (
            <span className="text-[10px] text-emerald-400/80 font-mono">
              Accepted on {new Date(docMeta.accepted_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Document Canvas Container */}
      <div className="w-full max-w-[860px] shadow-2xl rounded-2xl overflow-hidden print:p-0 print:shadow-none print:max-w-none print:w-full">
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>

      {/* Footer (Hidden during printing) */}
      <footer className="print:hidden mt-8 text-center text-[11px] text-zinc-500 font-mono">
        © {new Date().getFullYear()} Qdelta Studio • Cryptographically verified document portal
      </footer>
    </div>
  );
}
