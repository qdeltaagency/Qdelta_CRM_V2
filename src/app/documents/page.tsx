'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/table';
import {
  DocumentRecord,
  DocumentType,
  getDocuments,
  deleteDocument,
  updateDocumentStatus,
} from '@/lib/documents-service';
import { getProjects, ProjectItem } from '@/lib/projects-service';
import { GenerateDocumentModal } from '@/components/projects/generate-document-modal';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  Search,
  FileText,
  FileCheck,
  Receipt,
  DollarSign,
  Shield,
  Layers,
  Copy,
  ExternalLink,
  Eye,
  Trash2,
  Send,
  Sparkles,
  Check,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([]);
  const [projects, setProjects] = React.useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTypeFilter, setActiveTypeFilter] = React.useState<string>('all');
  const [activeCardFilter, setActiveCardFilter] = React.useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = React.useState(false);
  const [selectedProjectForGen, setSelectedProjectForGen] = React.useState<ProjectItem | null>(null);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [docsData, projectsData] = await Promise.all([
        getDocuments(),
        getProjects(),
      ]);
      setDocuments(docsData);
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProjectForGen) {
        setSelectedProjectForGen(projectsData[0]);
      }
    } catch (err) {
      console.error('Failed to load documents data:', err);
      toast({
        type: 'error',
        title: 'Loading Error',
        description: 'Failed to fetch studio documents registry.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectForGen, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const copyPublicLink = (token: string) => {
    const fullUrl = `${window.location.origin}/doc/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      type: 'info',
      title: 'Link Copied',
      description: 'Public document link copied to clipboard.',
    });
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast({
        type: 'success',
        title: 'Document Deleted',
        description: `Removed "${doc.name}" from registry.`,
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Could not delete document.',
      });
    }
  };

  const handleSendEmail = async (doc: DocumentRecord) => {
    const clientEmail = doc.clients?.email || doc.metadata?.client_email;
    if (!clientEmail) {
      toast({
        type: 'error',
        title: 'No Email Found',
        description: 'This document does not have a client email associated with it.',
      });
      return;
    }

    setActionLoadingId(doc.id);
    try {
      const publicUrl = `${window.location.origin}/doc/${doc.public_token}`;
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document_notification',
          to: clientEmail,
          projectId: doc.project_id,
          clientId: doc.client_id,
          documentId: doc.id,
          data: {
            clientName: doc.clients?.name || doc.metadata?.client_name || 'Client',
            companyName: doc.clients?.company || doc.metadata?.client_company || '',
            projectTitle: doc.projects?.name || doc.metadata?.project_name || 'Project Deliverable',
            documentType: doc.type,
            documentTitle: doc.name,
            documentUrl: publicUrl,
            amount: doc.metadata?.milestone_amount || doc.metadata?.agreed_value,
            currency: doc.metadata?.currency || 'USD',
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: 'success',
          title: 'Email Sent',
          description: data.message || `Dispatched document link to ${clientEmail}`,
        });
        loadData();
      } else {
        throw new Error(data.error || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Email Error',
        description: err?.message || 'Could not send document email.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Card filter toggle logic
  const handleCardClick = (filterKey: string) => {
    if (activeCardFilter === filterKey) {
      setActiveCardFilter(null);
    } else {
      setActiveCardFilter(filterKey);
      setActiveTypeFilter('all');
    }
  };

  // Calculations for Metrics
  const totalDocsCount = documents.length;
  const proposalsCount = documents.filter((d) => d.type === 'proposal').length;
  const invoicesCount = documents.filter((d) => d.type === 'invoice' || d.type === 'receipt').length;
  const agreementsCount = documents.filter(
    (d) => d.type === 'agreement' || d.type === 'client_agreement' || d.type === 'nda' || d.type === 'handover'
  ).length;

  // Filtered Documents
  const filteredDocuments = documents.filter((doc) => {
    // Card Filter
    if (activeCardFilter === 'proposals' && doc.type !== 'proposal') return false;
    if (activeCardFilter === 'invoices' && doc.type !== 'invoice' && doc.type !== 'receipt') return false;
    if (
      activeCardFilter === 'agreements' &&
      doc.type !== 'agreement' &&
      doc.type !== 'client_agreement' &&
      doc.type !== 'nda' &&
      doc.type !== 'handover'
    )
      return false;

    // Type Filter Tabs
    if (activeTypeFilter !== 'all' && doc.type !== activeTypeFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = doc.name.toLowerCase().includes(q);
      const clientMatch = (doc.clients?.name || doc.metadata?.client_name || '').toLowerCase().includes(q);
      const companyMatch = (doc.clients?.company || doc.metadata?.client_company || '').toLowerCase().includes(q);
      const projectMatch = (doc.projects?.name || doc.metadata?.project_name || '').toLowerCase().includes(q);
      const tokenMatch = doc.public_token.toLowerCase().includes(q);
      return nameMatch || clientMatch || companyMatch || projectMatch || tokenMatch;
    }

    return true;
  });

  const getTypeBadgeStyle = (type: DocumentType) => {
    switch (type) {
      case 'proposal':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'invoice':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'receipt':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'agreement':
      case 'client_agreement':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'nda':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'handover':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Documents & Legal Assets"
        description="Dynamic studio document generator, client portals, signed agreements, and Resend automated delivery."
        action={
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              if (projects.length > 0 && !selectedProjectForGen) {
                setSelectedProjectForGen(projects[0]);
              }
              setIsGenerateModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Document
          </Button>
        }
      />

      {/* Metric Summary Cards with Toggleable Filtering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <button
          type="button"
          onClick={() => handleCardClick('all')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            activeCardFilter === 'all'
              ? 'bg-indigo-600/15 border-indigo-500/80 shadow-md ring-1 ring-indigo-500'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Registry</span>
            <div className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{totalDocsCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Active Studio Documents</p>
          </div>
        </button>

        {/* Card 2: Proposals */}
        <button
          type="button"
          onClick={() => handleCardClick('proposals')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            activeCardFilter === 'proposals'
              ? 'bg-indigo-600/15 border-indigo-500/80 shadow-md ring-1 ring-indigo-500'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Proposals & Pitches</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{proposalsCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Technical & Scope Proposals</p>
          </div>
        </button>

        {/* Card 3: Invoices & Receipts */}
        <button
          type="button"
          onClick={() => handleCardClick('invoices')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            activeCardFilter === 'invoices'
              ? 'bg-amber-500/15 border-amber-500/80 shadow-md ring-1 ring-amber-500'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Invoices & Receipts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{invoicesCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Billing & Payment Proofs</p>
          </div>
        </button>

        {/* Card 4: Agreements & NDAs */}
        <button
          type="button"
          onClick={() => handleCardClick('agreements')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            activeCardFilter === 'agreements'
              ? 'bg-blue-500/15 border-blue-500/80 shadow-md ring-1 ring-blue-500'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Agreements & Legal</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{agreementsCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">MSAs, NDAs & Handovers</p>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/80">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, client, project, or token..."
            className="pl-9 bg-zinc-950/60 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 h-9"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'proposal', label: 'Proposals' },
            { key: 'invoice', label: 'Invoices' },
            { key: 'receipt', label: 'Receipts' },
            { key: 'agreement', label: 'Agreements' },
            { key: 'nda', label: 'NDAs' },
            { key: 'handover', label: 'Handovers' },
          ].map((tab) => {
            const isActive = activeTypeFilter === tab.key && !activeCardFilter;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTypeFilter(tab.key);
                  setActiveCardFilter(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-800/80 bg-zinc-900/60">
              <TableHead className="text-zinc-400 font-semibold text-xs py-3.5">Document Details</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs">Type</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs">Client & Project</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs">Created</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-500 text-xs">
                  Loading studio documents registry...
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableEmptyState
                title="No documents found"
                description={
                  searchQuery
                    ? 'No documents matched your search criteria.'
                    : 'Click "Generate Document" to create your first client-ready document.'
                }
                colSpan={6}
              />
            ) : (
              filteredDocuments.map((doc) => {
                const docUrl = `/doc/${doc.public_token}`;
                const isCopied = copiedToken === doc.public_token;
                const clientName = doc.clients?.name || doc.metadata?.client_name || 'Direct Client';
                const clientCompany = doc.clients?.company || doc.metadata?.client_company;
                const projectName = doc.projects?.name || doc.metadata?.project_name || 'Design Sprint';
                const isActing = actionLoadingId === doc.id;

                return (
                  <TableRow
                    key={doc.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Document Title & Token */}
                    <TableCell className="py-3.5">
                      <div className="space-y-0.5 max-w-[280px]">
                        <span className="font-semibold text-xs text-white block truncate">
                          {doc.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                          <span>Token:</span>
                          <span className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-300 truncate max-w-[130px]">
                            {doc.public_token}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getTypeBadgeStyle(
                          doc.type
                        )}`}
                      >
                        {doc.type}
                      </span>
                    </TableCell>

                    {/* Client & Project */}
                    <TableCell>
                      <div className="space-y-0.5 max-w-[220px]">
                        <span className="text-xs font-medium text-zinc-200 block truncate">
                          {clientCompany ? `${clientCompany} (${clientName})` : clientName}
                        </span>
                        <span className="text-[11px] text-zinc-400 block truncate font-mono">
                          {projectName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-xs text-zinc-400 font-mono">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPublicLink(doc.public_token)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          title="Copy Public Link"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        {/* Send Email */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendEmail(doc)}
                          disabled={isActing}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                          title="Email to Client"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>

                        {/* View in Public Portal */}
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 px-2.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-200 font-medium gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>

                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc)}
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Global Document Generator Modal */}
      {selectedProjectForGen && (
        <GenerateDocumentModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          project={selectedProjectForGen}
          onDocumentGenerated={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
            toast({
              type: 'success',
              title: 'Document Generated',
              description: `Generated "${newDoc.name}" with public link.`,
            });
          }}
        />
      )}
    </div>
  );
}
