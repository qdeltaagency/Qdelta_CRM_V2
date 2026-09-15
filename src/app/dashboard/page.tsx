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
import { getLeads, Lead } from '@/lib/leads-service';
import { getClients, Client } from '@/lib/clients-service';
import { getProjects, ProjectItem } from '@/lib/projects-service';
import { getProjectPaymentGroups } from '@/lib/payments-service';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  RefreshCw,
  Users,
  Briefcase,
  Layers,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    activeLeads: 0,
    activeClients: 0,
    ongoingProjects: 0,
    pendingMilestones: 0,
  });
  const [recentProjects, setRecentProjects] = React.useState<ProjectItem[]>([]);

  const loadDashboardData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [leadsData, clientsData, projectsData, paymentsData] = await Promise.all([
        getLeads().catch(() => [] as Lead[]),
        getClients().catch(() => [] as Client[]),
        getProjects().catch(() => [] as ProjectItem[]),
        getProjectPaymentGroups().catch(() => ({ groups: [], summary: { readyToCollect: 0, awaitingPayment: 0, overdueCount: 0, overdueAmount: 0, collectedThisMonth: 0 } })),
      ]);

      const activeLeads = leadsData.filter((l) => l.status !== 'converted' && l.status !== 'lost').length;
      const activeClients = clientsData.filter((c) => c.status === 'active').length;
      const ongoingProjects = projectsData.filter((p) => p.stage !== 'completed').length;
      const pendingMilestones = (paymentsData?.summary?.readyToCollect || 0) + (paymentsData?.summary?.awaitingPayment || 0);

      setStats({
        activeLeads,
        activeClients: activeClients || clientsData.length,
        ongoingProjects,
        pendingMilestones,
      });

      // Sort recent projects by creation date descending
      const sortedProjects = [...projectsData].sort(
        (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setRecentProjects(sortedProjects.slice(0, 5));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not fetch dashboard data.';
      toast({
        type: 'error',
        title: 'Error loading dashboard',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="High-level agency overview and operational health."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadDashboardData(true)}
              disabled={isLoading}
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/leads">
              <Button size="sm" variant="default">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Lead
              </Button>
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/leads"
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Active Leads
            </p>
            <Users className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {isLoading ? (
              <span className="inline-block w-8 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              stats.activeLeads
            )}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            Pipeline in progress <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/clients"
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Active Clients
            </p>
            <Briefcase className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {isLoading ? (
              <span className="inline-block w-8 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              stats.activeClients
            )}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            Retained & accounts <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/projects"
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Ongoing Projects
            </p>
            <Layers className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {isLoading ? (
              <span className="inline-block w-8 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              stats.ongoingProjects
            )}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            Active production <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/payments"
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Pending Milestones
            </p>
            <Clock className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {isLoading ? (
              <span className="inline-block w-8 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              stats.pendingMilestones
            )}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            Ready & awaiting unlock <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>
      </div>

      {/* Recent Activity / Pipeline Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
            Recent Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium flex items-center gap-1"
          >
            View all projects
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                    <span>Loading projects...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : recentProjects.length === 0 ? (
              <TableEmptyState
                title="No projects currently active"
                description="Converted leads and newly created projects will appear here."
                colSpan={6}
              />
            ) : (
              recentProjects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span>{project.name}</span>
                      {project.is_draft && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Draft
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {project.clients?.name || '—'}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {project.service_type || 'Custom Service'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.stage} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-medium">
                    {project.currency || 'USD'} {Number(project.agreed_value || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/projects">
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Open
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
