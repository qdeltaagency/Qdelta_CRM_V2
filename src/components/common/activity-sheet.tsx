'use client';

import * as React from 'react';
import { Sheet } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  Layers,
  ArrowRight,
  Activity as ActivityIcon,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  client_id: string | null;
  project_id: string | null;
  lead_id: string | null;
  type: string;
  description: string;
  created_at: string;
}

interface ActivitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  entityType: 'lead' | 'client' | 'project';
  entityName?: string;
}

export function ActivitySheet({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
}: ActivitySheetProps) {
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchActivities = React.useCallback(async () => {
    if (!entityId || !supabase) return;

    setIsLoading(true);
    try {
      let query = supabase.from('activities').select('*').order('created_at', { ascending: false });

      if (entityType === 'lead') {
        query = query.eq('lead_id', entityId);
      } else if (entityType === 'client') {
        query = query.eq('client_id', entityId);
      } else if (entityType === 'project') {
        query = query.eq('project_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities((data as ActivityItem[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching activities:', err);
      toast({
        type: 'error',
        title: 'Error loading activities',
        description: err instanceof Error ? err.message : 'Failed to load timeline.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, toast]);

  React.useEffect(() => {
    if (isOpen && entityId) {
      fetchActivities();
    }
  }, [isOpen, entityId, fetchActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <UserCheck className="w-3.5 h-3.5 text-blue-500" />;
      case 'converted':
      case 'lead_converted':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'payment_created':
      case 'payment_paid':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
      case 'stage_changed':
      case 'project_created':
        return <Layers className="w-3.5 h-3.5 text-purple-500" />;
      case 'document_generated':
        return <FileText className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <ActivityIcon className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Activity Timeline"
      description={entityName ? `Audit log for ${entityName}` : 'System & audit timeline'}
      width="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300">No activity logged yet</p>
            <p className="mt-0.5 text-[11px]">System events will appear here automatically.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-6">
            {activities.map((item) => (
              <div key={item.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-0.5 h-6 w-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  {getActivityIcon(item.type)}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
