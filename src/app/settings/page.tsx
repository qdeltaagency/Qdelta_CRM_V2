'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { FormGroup, FormLabel, Input } from '@/components/ui/form';
import { CRMSelect } from '@/components/ui/crm-select';

export default function SettingsPage() {
  const [currency, setCurrency] = React.useState('USD');

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Agency workspace configurations and payment provider integrations."
      />

      {/* General Agency Info */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Agency Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup>
            <FormLabel>Agency Name</FormLabel>
            <Input defaultValue="Q Delta Digital Studio" />
          </FormGroup>

          <FormGroup>
            <FormLabel>Default Currency</FormLabel>
            <CRMSelect
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'INR', label: 'INR (₹)' },
              ]}
            />
          </FormGroup>
        </div>
      </div>

      {/* Payment Structure Info */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Payment Structure Policy
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Default milestone breakdown automatically configured for all new projects.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Milestone 1</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">30% Upfront</p>
          </div>
          <div className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Milestone 2</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">35% Mid-Dev</p>
          </div>
          <div className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Milestone 3</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">35% Final</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm">Save Changes</Button>
      </div>
    </div>
  );
}
