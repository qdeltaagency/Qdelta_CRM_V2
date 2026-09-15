import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/table';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Immutable audit trail of lead conversions, project stage changes, and payments."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Related Entity</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmptyState
            title="No activity recorded yet"
            description="System events like lead updates, conversions, and payments will be logged here."
            colSpan={4}
          />
        </TableBody>
      </Table>
    </div>
  );
}
