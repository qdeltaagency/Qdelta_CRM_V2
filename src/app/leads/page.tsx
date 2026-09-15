'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { LeadsTable } from '@/components/leads/leads-table';
import { LeadsStatsBar } from '@/components/leads/leads-stats-bar';
import { LeadFormModal } from '@/components/leads/lead-form-modal';
import { EditLeadModal } from '@/components/leads/edit-lead-modal';
import { LeadDetailsSheet } from '@/components/leads/lead-details-sheet';
import { ActivitySheet } from '@/components/common/activity-sheet';
import { Lead, getLeads } from '@/lib/leads-service';
import { useToast } from '@/components/ui/toast';
import { Plus, RefreshCw, Activity, Search } from 'lucide-react';

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = React.useState<Lead | null>(null);
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);

  // Filter tabs & search state (All Leads is default)
  const [activeTab, setActiveTab] = React.useState<'all' | 'new' | 'converted'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Activity Sheet State
  const [activityEntity, setActivityEntity] = React.useState<{ id: string | null; name: string } | null>(null);

  const loadLeads = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);

      setSelectedLeadForDetails((prev) => {
        if (!prev) return null;
        return data.find((l) => l.id === prev.id) || null;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not fetch leads from database.';
      toast({
        type: 'error',
        title: 'Error loading leads',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadLeads(true);
  }, [loadLeads]);

  // Tab counts
  const newCount = React.useMemo(() => leads.filter((l) => l.status !== 'converted').length, [leads]);
  const convertedCount = React.useMemo(() => leads.filter((l) => l.status === 'converted').length, [leads]);
  const allCount = leads.length;

  // Filtered leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // 1. Tab filter
      if (activeTab === 'new' && lead.status === 'converted') return false;
      if (activeTab === 'converted' && lead.status !== 'converted') return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesCompany = (lead.company || '').toLowerCase().includes(query);
        const matchesEmail = lead.email.toLowerCase().includes(query);
        const matchesService = (lead.service || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesEmail && !matchesService) {
          return false;
        }
      }

      return true;
    });
  }, [leads, activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads Pipeline"
        description="Track incoming inquiries, outreach status, commercial terms, and qualification pipeline."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
              onClick={() => setActivityEntity({ id: null, name: 'All Leads' })}
              title="Open Global Activity Log"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Activity Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLeads(true)}
              disabled={isLoading}
              title="Refresh leads list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Top Stats Bar */}
      <LeadsStatsBar
        leads={leads}
        activeTab={activeTab}
        onTabSelect={(tab) => setActiveTab(tab)}
      />

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Segmented Pipeline Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>All Leads</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'all'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {allCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'new' ? 'all' : 'new')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>New / Active</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'new'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {newCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'converted' ? 'all' : 'converted')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'converted'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Converted</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'converted'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {convertedCount}
            </span>
          </button>
        </div>

        {/* Real-Time Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, company, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Leads Table */}
      <LeadsTable
        leads={filteredLeads}
        isLoading={isLoading}
        onViewLead={(lead) => setSelectedLeadForDetails(lead)}
        onEditLead={(lead) => setEditingLead(lead)}
        onRefresh={loadLeads}
      />

      {/* Add Lead Modal */}
      <LeadFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadLeads}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={Boolean(editingLead)}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSuccess={loadLeads}
      />

      {/* Lead Details Right-Side Drawer */}
      <LeadDetailsSheet
        isOpen={Boolean(selectedLeadForDetails)}
        lead={selectedLeadForDetails}
        onClose={() => setSelectedLeadForDetails(null)}
        onEdit={(lead) => setEditingLead(lead)}
        onOpenActivity={(leadId, leadName) => setActivityEntity({ id: leadId, name: leadName })}
        onRefresh={loadLeads}
      />

      {/* Activity Sheet */}
      <ActivitySheet
        isOpen={Boolean(activityEntity)}
        onClose={() => setActivityEntity(null)}
        entityId={activityEntity?.id || null}
        entityType="lead"
        entityName={activityEntity?.name}
      />
    </div>
  );
}
