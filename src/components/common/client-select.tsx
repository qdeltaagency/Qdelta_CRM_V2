'use client';

import * as React from 'react';
import { User } from 'lucide-react';
import { Client, getClients } from '@/lib/clients-service';
import { CRMSelect, CRMSelectOption } from '@/components/ui/crm-select';

interface ClientSelectProps {
  value?: string | null;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ClientSelect({
  value,
  onChange,
  placeholder = 'Search existing client by name or email...',
  className = '',
  disabled = false,
}: ClientSelectProps) {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await getClients();
        if (isMounted) setClients(data);
      } catch (err) {
        console.error('Failed to load clients in select:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const options: CRMSelectOption[] = React.useMemo(() => {
    return clients.map((c) => ({
      value: c.id,
      label: c.company ? `${c.name} (${c.company})` : c.name,
      description: c.email || undefined,
      icon: <User className="w-3.5 h-3.5" />,
    }));
  }, [clients]);

  const handleChange = (selectedId: string) => {
    if (!selectedId) {
      onChange(null);
      return;
    }
    const found = clients.find((c) => c.id === selectedId) || null;
    onChange(found);
  };

  return (
    <CRMSelect
      value={value || ''}
      onChange={handleChange}
      options={options}
      placeholder={isLoading ? 'Loading client accounts...' : placeholder}
      searchPlaceholder="Search name, company, or email..."
      searchable
      clearable
      disabled={disabled || isLoading}
      className={className}
    />
  );
}

