'use client';

import * as React from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_OPTIONS,
  updateLeadStatus,
} from '@/lib/leads-service';
import { useToast } from '@/components/ui/toast';
import {
  Globe,
  MessageCircle,
  Instagram,
  Linkedin,
  Mail,
  Users,
  Tag,
  Eye,
  Edit2,
} from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onRefresh: () => void;
}

export function LeadsTable({
  leads,
  isLoading,
  onViewLead,
  onEditLead,
  onRefresh,
}: LeadsTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    if (lead.status === newStatus) return;

    setUpdatingId(lead.id);
    const oldStatus = lead.status;

    try {
      await updateLeadStatus(lead.id, newStatus, lead.name, oldStatus);
      toast({
        type: 'success',
        title: 'Status Updated',
        description: `Lead status changed to "${newStatus}".`,
      });
      onRefresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update status.';
      toast({
        type: 'error',
        title: 'Update Error',
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const renderSourceIcon = (lead: Lead) => {
    if (lead.source_type === 'website') {
      return (
        <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
          <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Website</span>
        </span>
      );
    }

    const platform = lead.source_platform;
    let icon = <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    let label = 'Manual';

    switch (platform) {
      case 'whatsapp':
        icon = <MessageCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = 'WhatsApp';
        break;
      case 'linkedin':
        icon = <Linkedin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = 'LinkedIn';
        break;
      case 'instagram':
        icon = <Instagram className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = 'Instagram';
        break;
      case 'email':
        icon = <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = 'Email';
        break;
      case 'referral':
        icon = <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = 'Referral';
        break;
      case 'other':
        icon = <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
        label = lead.custom_source || 'Other';
        break;
      default:
        label = 'Manual';
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
        {icon}
        <span className="capitalize">{label}</span>
      </span>
    );
  };

  const clientLeadCountMap = React.useMemo(() => {
    const map = new Map<string, { count: number; leadIds: string[] }>();
    leads.forEach((l) => {
      const key = (l.email || l.company || l.name).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { count: 0, leadIds: [] });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      entry.leadIds.push(l.id);
    });
    return map;
  }, [leads]);

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead / Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Service & Value</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-4 w-20 ml-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-6 w-24 ml-auto bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead / Contact</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Service & Value</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length === 0 ? (
          <TableEmptyState
            title="No leads found in this view"
            description="Inquiries matching your selected filter will appear here."
            colSpan={7}
          />
        ) : (
          leads.map((lead) => {
            const isUpdating = updatingId === lead.id;
            const isConverted = lead.status === 'converted';

            // Repeat client analysis
            const clientKey = (lead.email || lead.company || lead.name).trim().toLowerCase();
            const clientStats = clientLeadCountMap.get(clientKey);
            const isRepeatLead = (clientStats?.count || 0) > 1;
            const isExistingClient =
              lead.client_type === 'existing' ||
              Boolean(lead.existing_client_id) ||
              Boolean(lead.existing_client);

            // Format budget & currency
            const budgetVal = Number(lead.agreed_project_value || lead.estimated_budget) || 0;
            const currencySymbol =
              lead.currency === 'INR'
                ? '₹'
                : lead.currency === 'EUR'
                ? '€'
                : lead.currency === 'GBP'
                ? '£'
                : '$';

            return (
              <TableRow
                key={lead.id}
                className={isRepeatLead ? 'bg-purple-500/[0.015] dark:bg-purple-500/[0.02]' : ''}
                onClick={() => onViewLead(lead)}
              >
                {/* 1. Lead / Contact */}
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold">{lead.name}</span>
                      {isExistingClient && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          Existing Client
                        </span>
                      )}
                      {isRepeatLead && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                          Repeat Lead
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-normal font-mono">
                      {lead.email}
                    </span>
                  </div>
                </TableCell>

                {/* 2. Company */}
                <TableCell className="text-zinc-600 dark:text-zinc-400 font-medium">
                  {lead.company || '—'}
                </TableCell>

                {/* 3. Service & Value */}
                <TableCell className="text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                      {lead.service || '—'}
                    </span>
                    {budgetVal > 0 && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {currencySymbol}
                        {budgetVal.toLocaleString()} {lead.currency || 'USD'}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 4. Source (Platform Icon) */}
                <TableCell className="text-xs">
                  {renderSourceIcon(lead)}
                </TableCell>

                {/* 5. Status with Inline Selector */}
                <TableCell>
                  {isConverted ? (
                    <StatusBadge status={lead.status} />
                  ) : (
                    <div className="w-32" onClick={(e) => e.stopPropagation()}>
                      <CRMSelect
                        value={lead.status}
                        disabled={isUpdating}
                        size="xs"
                        variant="table"
                        options={LEAD_STATUS_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        onChange={(newVal) =>
                          handleStatusChange(lead, newVal as LeadStatus)
                        }
                      />
                    </div>
                  )}
                </TableCell>

                {/* 6. Created Date */}
                <TableCell className="text-right text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                  {formatDate(lead.created_at)}
                </TableCell>

                {/* 7. Actions: View Details + Edit */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                      onClick={() => onViewLead(lead)}
                      title="Open Lead Sidebar Drawer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs cursor-pointer"
                      onClick={() => onEditLead(lead)}
                      title="Edit Lead"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
