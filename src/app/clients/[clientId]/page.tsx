'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '@/components/ui/table';
import { ProjectDetailsSheet } from '@/components/projects/project-details-sheet';
import { MilestoneStepper } from '@/components/common/milestone-stepper';
import { ActivitySheet } from '@/components/common/activity-sheet';
import { ClientWorkspaceData, ClientProject, getClientWorkspace } from '@/lib/clients-service';
import { ProjectItem, ProjectStage } from '@/lib/projects-service';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Activity,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function ClientWorkspacePage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const { toast } = useToast();

  const [client, setClient] = React.useState<ClientWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActivityOpen, setIsActivityOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<ClientProject | null>(null);
  const [activityProject, setActivityProject] = React.useState<{ id: string | null; name: string } | null>(null);

  const loadClient = React.useCallback(async (showLoading = false) => {
    if (!clientId) {
      return;
    }
    if (showLoading) setIsLoading(true);
    try {
      const data = await getClientWorkspace(clientId);
      setClient(data);

      setSelectedProject((prev) => {
        if (!prev) return null;
        return data?.projects.find((p) => p.id === prev.id) || null;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch client workspace.';
      toast({
        type: 'error',
        title: 'Error loading workspace',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);

  React.useEffect(() => {
    loadClient(true);
  }, [loadClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Client container not found.</p>
        <Link href="/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  const currencySymbol =
    client.currency === 'INR' ? '₹' : client.currency === 'EUR' ? '€' : client.currency === 'GBP' ? '£' : '$';

  const formatValue = (amount?: number | null) => {
    if (!amount || Number(amount) === 0) return '—';
    return `${currencySymbol}${Number(amount).toLocaleString()}`;
  };

  // Convert selected client project to ProjectItem format for ProjectDetailsSheet
  const selectedProjectItem: ProjectItem | null = selectedProject
    ? {
        id: selectedProject.id,
        name: selectedProject.name,
        service_type: selectedProject.service_type,
        stage: selectedProject.stage as ProjectStage,
        agreed_value: selectedProject.agreed_value,
        currency: selectedProject.currency || client.currency,
        timeline: selectedProject.timeline,
        requirements: selectedProject.requirements,
        domain_status: selectedProject.domain_status,
        created_at: selectedProject.created_at,
        is_draft: selectedProject.is_draft,
        client_id: client.id,
        lead_id: client.lead_id,
        clients: {
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
        },
        payment_milestones: selectedProject.payment_milestones as any,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Clients</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
          onClick={() => setIsActivityOpen(true)}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          Activity Log
        </Button>
      </div>

      {/* Header Container */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {client.name}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            {client.company && (
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {client.company}
              </p>
            )}
          </div>

          {/* Contact Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            {client.email && (
              <span className="inline-flex items-center gap-1.5 p-1.5 px-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="inline-flex items-center gap-1.5 p-1.5 px-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 font-mono">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                {client.phone}
              </span>
            )}
            {client.country && (
              <span className="inline-flex items-center gap-1.5 p-1.5 px-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {client.country}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1. Top Metrics (5 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Total Projects
          </span>
          <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 block">
            {client.total_projects}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Active Projects
          </span>
          <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
            {client.active_projects}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Completed Projects
          </span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {client.completed_projects}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Total Revenue (LTV)
          </span>
          <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 block">
            {currencySymbol}{client.total_revenue.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Active Project Value
          </span>
          <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 block">
            {currencySymbol}{client.active_value.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Milestone Summary Container */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          Milestone Summary Across Projects
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                Initial (30%)
              </span>
              <span className="text-[10px] text-zinc-400">Initial deposit phase</span>
            </div>
            <span className="text-sm font-bold font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              {client.milestone_summary.milestone_1_count}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                Mid Review (35%)
              </span>
              <span className="text-[10px] text-zinc-400">Design & development approval</span>
            </div>
            <span className="text-sm font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {client.milestone_summary.milestone_2_count}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                Final Delivery (35%)
              </span>
              <span className="text-[10px] text-zinc-400">Final handover and completion</span>
            </div>
            <span className="text-sm font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {client.milestone_summary.milestone_3_count}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Project Table / List View (No cards, Clean & Compact) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Client Projects
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage projects for this client container. Click &quot;Open →&quot; to inspect and edit project details.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Milestones</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!client.projects || client.projects.length === 0) ? (
              <TableEmptyState
                title="No projects registered"
                description="Projects attached to this client will appear here."
                colSpan={7}
              />
            ) : (
              client.projects.map((proj) => (
                <TableRow key={proj.id}>
                  {/* 1. Project Name */}
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex flex-col">
                      <span className="font-medium">{proj.name}</span>
                      {proj.requirements && (
                        <span className="text-[11px] text-zinc-400 font-normal truncate max-w-[240px]">
                          {proj.requirements}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 2. Service */}
                  <TableCell className="text-zinc-700 dark:text-zinc-300 text-xs">
                    {proj.service_type || '—'}
                  </TableCell>

                  {/* 3. Stage (Read-only status badge) */}
                  <TableCell>
                    <StatusBadge status={proj.stage} />
                  </TableCell>

                  {/* 4. Milestone Stepper */}
                  <TableCell>
                    <MilestoneStepper
                      milestones={proj.payment_milestones || []}
                      currency={proj.currency}
                      variant="compact"
                      size="sm"
                    />
                  </TableCell>

                  {/* 5. Timeline */}
                  <TableCell className="text-zinc-600 dark:text-zinc-400 text-xs">
                    {proj.timeline || '—'}
                  </TableCell>

                  {/* 6. Value */}
                  <TableCell className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                    {formatValue(proj.agreed_value)}
                  </TableCell>

                  {/* 7. Action: Open Project in Right Sidebar Drawer */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs gap-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                      onClick={() => setSelectedProject(proj)}
                      title="Open Project Sidebar"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Project Details Sidebar Drawer (Stays on client page, editing happens here) */}
      <ProjectDetailsSheet
        isOpen={Boolean(selectedProjectItem)}
        project={selectedProjectItem}
        onClose={() => setSelectedProject(null)}
        onOpenActivity={(pId, pName) => setActivityProject({ id: pId, name: pName })}
        onRefresh={() => loadClient(false)}
      />

      {/* Client Activity Sheet */}
      <ActivitySheet
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        entityId={client.id}
        entityType="client"
        entityName={client.name}
      />

      {/* Project Activity Sheet */}
      <ActivitySheet
        isOpen={Boolean(activityProject)}
        onClose={() => setActivityProject(null)}
        entityId={activityProject?.id || null}
        entityType="project"
        entityName={activityProject?.name}
      />
    </div>
  );
}
