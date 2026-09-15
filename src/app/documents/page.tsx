import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/table';
import { Plus } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Proposals, client agreements, NDAs, invoices, and handover assets."
        action={
          <Button size="sm" variant="default">
            <Plus className="w-3.5 h-3.5" />
            Upload Document
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmptyState
            title="No documents generated"
            description="Proposals, invoices, and client agreements will be listed here."
            colSpan={6}
          />
        </TableBody>
      </Table>
    </div>
  );
}
