'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
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
import { StatusBadge } from '@/components/ui/badge';
import { CRMSelect } from '@/components/ui/crm-select';
import { ProjectDetailsSheet } from '@/components/projects/project-details-sheet';
import { MilestoneStepper } from '@/components/common/milestone-stepper';
import { ActivitySheet } from '@/components/common/activity-sheet';
import {
  ProjectItem,
  ProjectStage,
  PROJECT_STAGES,
  getProjects,
  updateProjectStage,
} from '@/lib/projects-service';
import { useToast } from '@/components/ui/toast';
import {
  RefreshCw,
  ArrowRight,
  Eye,
  Activity,
  ExternalLink,
  FolderKanban,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = React.useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<ProjectItem | null>(null);
  const [activityProject, setActivityProject] = React.useState<{ id: string | null; name: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'all' | 'delivery' | 'review' | 'completed'>('all');

  const loadProjects = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);

      setSelectedProject((prev) => {
        if (!prev) return null;
        return data.find((p) => p.id === prev.id) || null;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not fetch active projects.';
      toast({
        type: 'error',
        title: 'Error loading projects',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadProjects(true);
  }, [loadProjects]);

  const handleStageChange = async (project: ProjectItem, newStage: ProjectStage) => {
    if (project.stage === newStage) return;
    setUpdatingId(project.id);

    try {
      await updateProjectStage(project, newStage);
      toast({
        type: 'success',
        title: 'Stage Updated',
        description: `Project moved to stage: "${newStage}".`,
      });
      loadProjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stage.';
      toast({
        type: 'error',
        title: 'Gated Action',
        description: msg,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatValue = (amount?: number | null, currency = 'USD') => {
    if (!amount || Number(amount) === 0) return '—';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  const totalCount = projects.length;
  const deliveryCount = React.useMemo(
    () => projects.filter((p) => ['planning', 'design', 'development'].includes(p.stage)).length,
    [projects]
  );
  const reviewCount = React.useMemo(
    () => projects.filter((p) => ['client_review', 'ready_for_delivery', 'handover'].includes(p.stage)).length,
    [projects]
  );
  const completedCount = React.useMemo(
    () => projects.filter((p) => p.stage === 'completed').length,
    [projects]
  );

  const filteredProjects = React.useMemo(() => {
    if (activeTab === 'delivery') {
      return projects.filter((p) => ['planning', 'design', 'development'].includes(p.stage));
    }
    if (activeTab === 'review') {
      return projects.filter((p) => ['client_review', 'ready_for_delivery', 'handover'].includes(p.stage));
    }
    if (activeTab === 'completed') {
      return projects.filter((p) => p.stage === 'completed');
    }
    return projects;
  }, [projects, activeTab]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description="Active delivery pipeline, stage progression gates, domain verification, and client project portfolios."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
              onClick={() => setActivityProject({ id: null, name: 'All Projects' })}
              title="Open Global Activity Log"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Activity Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProjects(true)}
              disabled={isLoading}
              title="Refresh projects list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Link href="/leads">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <span>Pipeline / Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Project Summary Cards (Interactive Toggle Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-500/10 dark:bg-blue-950/30 shadow-xs'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total Projects
            </span>
            <div className="p-1.5 rounded-lg border bg-blue-500/10 border-blue-500/20">
              <FolderKanban className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalCount}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            All registered client delivery builds
          </p>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'delivery' ? 'all' : 'delivery')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'delivery'
              ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 shadow-xs'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              In Delivery
            </span>
            <div className="p-1.5 rounded-lg border bg-amber-500/10 border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {deliveryCount}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            Planning, Design & Development
          </p>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'review' ? 'all' : 'review')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'review'
              ? 'border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/30 shadow-xs'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              In Review & Handover
            </span>
            <div className="p-1.5 rounded-lg border bg-indigo-500/10 border-indigo-500/20">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {reviewCount}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            Client review, QA & Milestone 2/3 gates
          </p>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-xs'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Completed
            </span>
            <div className="p-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {completedCount}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            Handed over & fully completed
          </p>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start text-xs font-medium">
        {[
          { key: 'all', label: 'All Projects', count: totalCount, badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
          { key: 'delivery', label: 'In Delivery', count: deliveryCount, badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
          { key: 'review', label: 'Review & Gate', count: reviewCount, badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
          { key: 'completed', label: 'Completed', count: completedCount, badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              if (tab.key === 'all') {
                setActiveTab('all');
              } else {
                setActiveTab(activeTab === tab.key ? 'all' : (tab.key as any));
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key ? tab.badgeColor : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Agreed Value</TableHead>
            <TableHead>Stage (Gated)</TableHead>
            <TableHead>Payment Milestones</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [1, 2, 3].map((idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-6 w-20 ml-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))
          ) : filteredProjects.length === 0 ? (
            <TableEmptyState
              title={activeTab === 'all' ? 'No active projects yet' : 'No projects in this stage'}
              description={
                activeTab === 'all'
                  ? 'Projects originate automatically when a lead is converted.'
                  : `There are currently no projects matching the "${activeTab}" filter.`
              }
              colSpan={8}
              action={
                <Link href="/leads">
                  <Button size="sm" variant="default" className="gap-1.5">
                    View Leads Pipeline
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              }
            />
          ) : (
            filteredProjects.map((project) => {
              const client = project.clients;
              const isUpdating = updatingId === project.id;

              return (
                <TableRow key={project.id}>
                  {/* 1. Project */}
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex flex-col">
                      <span className="font-medium">{project.name}</span>
                      {project.requirements && (
                        <span className="text-[11px] text-zinc-400 font-normal truncate max-w-[200px]">
                          {project.requirements}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 2. Client */}
                  <TableCell className="text-zinc-700 dark:text-zinc-300">
                    <div className="flex flex-col">
                      {project.client_id ? (
                        <Link
                          href={`/clients/${project.client_id}`}
                          className="font-medium hover:underline inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100"
                        >
                          <span>{client?.name || '—'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </Link>
                      ) : (
                        <span className="font-medium">{client?.name || '—'}</span>
                      )}
                      {client?.company && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                          {client.company}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 3. Service */}
                  <TableCell className="text-zinc-700 dark:text-zinc-300 text-xs">
                    {project.service_type || '—'}
                  </TableCell>

                  {/* 4. Value */}
                  <TableCell className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                    {formatValue(project.agreed_value, project.currency)}
                  </TableCell>

                  {/* 5. Stage Dropdown Selector (Clean Single Control) */}
                  <TableCell>
                    <div className="w-36">
                      <CRMSelect
                        value={project.stage}
                        disabled={isUpdating}
                        size="xs"
                        variant="table"
                        options={PROJECT_STAGES.map((s) => ({
                          value: s.value,
                          label: s.label,
                        }))}
                        onChange={(newVal) =>
                          handleStageChange(project, newVal as ProjectStage)
                        }
                      />
                    </div>
                  </TableCell>

                  {/* 6. Milestone Stepper */}
                  <TableCell>
                    <MilestoneStepper
                      milestones={project.payment_milestones || []}
                      currency={project.currency}
                      variant="compact"
                      size="sm"
                    />
                  </TableCell>

                  {/* 7. Timeline */}
                  <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {project.timeline || '—'}
                  </TableCell>

                  {/* 8. Actions: View Project Sidebar */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Project Details Sidebar Drawer */}
      <ProjectDetailsSheet
        isOpen={Boolean(selectedProject)}
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenActivity={(pId, pName) => setActivityProject({ id: pId, name: pName })}
        onRefresh={() => loadProjects(false)}
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
