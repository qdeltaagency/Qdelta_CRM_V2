'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Briefcase,
  CreditCard,
  Sparkles,
  Zap,
  Bot,
  Plus,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import { useCRM } from '@/lib/store';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { leads, clients, projects, payments } = useCRM();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(query.toLowerCase())) ||
      l.serviceType.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredClients = clients.filter(
    (c) =>
      c.organizationName.toLowerCase().includes(query.toLowerCase()) ||
      c.primaryContactName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 3);

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div
        className="w-full max-w-xl rounded-[12px] border border-zinc-200 dark:border-[#2C2C31] bg-white dark:bg-[#1C1C1F] shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-zinc-200 dark:border-[#2C2C31] flex items-center gap-3">
          <Search className="h-4.5 w-4.5 text-zinc-400 dark:text-[#71717A] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search leads, clients, projects, payments or actions (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs text-zinc-900 dark:text-[#F5F5F5] placeholder:text-zinc-400 dark:placeholder:text-[#71717A] outline-none font-medium bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 dark:text-[#71717A] hover:text-zinc-900 dark:hover:text-[#F5F5F5] text-[10px] font-mono font-medium border border-zinc-200 dark:border-[#2C2C31] bg-zinc-100 dark:bg-[#232327] px-1.5 py-0.5"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Actions */}
          <div>
            <span className="px-3 py-1 text-[10px] font-medium text-zinc-400 dark:text-[#71717A] uppercase tracking-wider font-mono block">
              Quick Actions
            </span>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => navigateTo('/leads')}
                className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left text-zinc-900 dark:text-[#F5F5F5] font-normal cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[6px] bg-indigo-50 text-indigo-600 dark:bg-[#8B7CFF]/15 dark:text-[#8B7CFF]">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">Create New Lead</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-[#71717A]">/leads</span>
              </button>

              <button
                onClick={() => navigateTo('/ai-studio')}
                className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left text-zinc-900 dark:text-[#F5F5F5] font-normal cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[6px] bg-indigo-50 text-indigo-600 dark:bg-[#8B7CFF]/15 dark:text-[#8B7CFF]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">Generate AI SOW / Scope</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-[#71717A]">/ai-studio</span>
              </button>

              <button
                onClick={() => navigateTo('/payments')}
                className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left text-zinc-900 dark:text-[#F5F5F5] font-normal cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[6px] bg-amber-50 text-amber-600 dark:bg-[#F5B74F]/15 dark:text-[#F5B74F]">
                    <Zap className="h-3.5 w-3.5 fill-amber-500 dark:fill-[#F5B74F]" />
                  </div>
                  <span className="font-medium">PayPal Payment Link Generator</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-[#71717A]">/payments</span>
              </button>
            </div>
          </div>

          {/* Leads Matches */}
          {filteredLeads.length > 0 && (
            <div>
              <span className="px-3 py-1 text-[10px] font-medium text-zinc-400 dark:text-[#71717A] uppercase tracking-wider font-mono block">
                Leads & Inquiries
              </span>
              <div className="space-y-0.5 mt-1">
                {filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigateTo('/leads')}
                    className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-[#F5F5F5] block">{lead.name}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">{lead.company || lead.serviceType}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-[#A99CFF]">
                      ${lead.quoteAmount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients Matches */}
          {filteredClients.length > 0 && (
            <div>
              <span className="px-3 py-1 text-[10px] font-medium text-zinc-400 dark:text-[#71717A] uppercase tracking-wider font-mono block">
                Active Clients
              </span>
              <div className="space-y-0.5 mt-1">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => navigateTo('/clients')}
                    className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-[#F5F5F5] block">{client.organizationName}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">{client.primaryContactName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-[#232327] dark:text-[#A1A1AA] dark:border-[#2C2C31]">
                      {client.tier}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Matches */}
          {filteredProjects.length > 0 && (
            <div>
              <span className="px-3 py-1 text-[10px] font-medium text-zinc-400 dark:text-[#71717A] uppercase tracking-wider font-mono block">
                Delivery Projects
              </span>
              <div className="space-y-0.5 mt-1">
                {filteredProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => navigateTo('/projects')}
                    className="w-full p-2.5 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-[#232327] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-[#F5F5F5] block">{proj.title}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">{proj.clientName}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-zinc-500 dark:text-[#A1A1AA]">
                      {proj.progressPercent}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#2C2C31] bg-zinc-50 dark:bg-[#171719] flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#71717A] font-mono">
          <span>Navigation: <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80 border border-zinc-300 dark:bg-[#232327] dark:border-[#2C2C31]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80 border border-zinc-300 dark:bg-[#232327] dark:border-[#2C2C31]">↓</kbd> to select</span>
          <span>Open: <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80 border border-zinc-300 dark:bg-[#232327] dark:border-[#2C2C31]">↵</kbd></span>
        </div>
      </div>
    </div>
  );
}
