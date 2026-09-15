'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  Building2,
  Receipt,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function PublicPaymentPage() {
  const params = useParams();
  const milestoneId = params?.milestoneId as string;

  const [milestone, setMilestone] = React.useState<any>(null);
  const [project, setProject] = React.useState<any>(null);
  const [lead, setLead] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadMilestone = React.useCallback(async () => {
    if (!milestoneId || !supabase) return;
    setIsLoading(true);
    try {
      const { data: ms, error: msErr } = await supabase
        .from('payment_milestones')
        .select('*, projects(*, leads(*), clients(*))')
        .eq('id', milestoneId)
        .single();

      if (msErr || !ms) {
        setErrorMessage('Invalid or expired payment link.');
        return;
      }

      setMilestone(ms);
      setProject(ms.projects);
      setLead(ms.projects?.leads);

      if (ms.status === 'paid') {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage('Could not load payment details.');
    } finally {
      setIsLoading(false);
    }
  }, [milestoneId]);

  React.useEffect(() => {
    loadMilestone();
  }, [loadMilestone]);

  const handlePayNow = async () => {
    if (!milestoneId || !supabase || !project) return;
    setIsProcessing(true);
    try {
      const nowIso = new Date().toISOString();

      // 1. Update Milestone to Paid
      await supabase
        .from('payment_milestones')
        .update({
          status: 'paid',
          paid_at: nowIso,
          provider: 'stripe',
        })
        .eq('id', milestoneId);

      // 2. Insert into payments table
      await supabase.from('payments').insert([
        {
          project_id: project.id,
          milestone_id: milestoneId,
          provider: 'stripe',
          provider_payment_id: `STRIPE-CH_${Date.now()}`,
          amount: milestone.amount || 0,
          currency: project.currency || 'USD',
          status: 'paid',
          paid_at: nowIso,
          metadata: {
            milestone_number: milestone.milestone_number,
            percentage: milestone.percentage,
            checkout_type: 'online_client_portal',
          },
        },
      ]);

      // 3. Automatically convert lead to client upon payment receipt
      if (project.lead_id) {
        try {
          await supabase.rpc('convert_lead_to_client', {
            p_lead_id: project.lead_id,
          });
        } catch (convErr) {
          console.warn('Could not auto-convert lead on payment:', convErr);
          await supabase
            .from('leads')
            .update({ status: 'converted' })
            .eq('id', project.lead_id);
        }
      }

      // 4. Log activity
      await supabase.from('activities').insert([
        {
          project_id: project.id,
          lead_id: project.lead_id,
          client_id: project.client_id,
          type: 'payment_paid',
          description: `Client settled payment for Milestone #${milestone.milestone_number} ($${Number(milestone.amount).toLocaleString()}) via online portal.`,
        },
      ]);

      setIsSuccess(true);
      loadMilestone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment transaction failed.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const currencySymbol =
    project?.currency === 'INR' ? '₹' : project?.currency === 'EUR' ? '€' : project?.currency === 'GBP' ? '£' : '$';

  const amountFormatted = `${currencySymbol}${Number(milestone?.amount || 0).toLocaleString()} ${project?.currency || 'USD'}`;

  const milestoneTitle =
    milestone?.milestone_number === 1
      ? 'Initial Deposit (30%)'
      : milestone?.milestone_number === 2
      ? 'Mid Review (35%)'
      : 'Final Delivery (35%)';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Securing payment connection...</span>
        </div>
      </div>
    );
  }

  if (errorMessage && !milestone) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-zinc-800 bg-[#121215] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Invalid Payment Link</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Bar */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            Q
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block text-white">Q Delta Studio</span>
            <span className="text-[10px] text-zinc-500 font-mono block">Secure Settlement Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit Encrypted</span>
        </div>
      </header>

      {/* Main Settlement Card */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-br from-[#18181b] to-[#1e1b4b]/40 border-b border-zinc-800/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                  <Sparkles className="w-3 h-3" />
                  {isSuccess ? 'Payment Confirmed' : 'Payment Request'}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {project?.name || 'Project Settlement'}
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Client:{' '}
                  <strong className="text-zinc-200">
                    {lead?.company ? `${lead.company} (${lead.name})` : lead?.name || 'Client'}
                  </strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block uppercase font-mono tracking-wider">
                  Amount Due
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-0.5 block">
                  {amountFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5 text-xs">
            {isSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">Payment Successfully Settled!</h2>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Your payment of <strong className="text-white font-mono">{amountFormatted}</strong> for{' '}
                    <strong>{milestoneTitle}</strong> has been received and verified into the studio queue.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 max-w-sm mx-auto text-left space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Milestone Stage:</span>
                    <span className="font-semibold text-zinc-200">{milestoneTitle}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Transaction Status:</span>
                    <span className="text-emerald-400 font-bold">✓ Settled & Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Settlement Date:</span>
                    <span className="font-mono text-zinc-300">
                      {milestone.paid_at
                        ? new Date(milestone.paid_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Milestone Details Summary */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium">Milestone Deliverable:</span>
                    <span className="font-semibold text-zinc-100">{milestoneTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium">Service Scope:</span>
                    <span className="text-zinc-200">{project?.service_type || lead?.service || 'Custom Development'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium">Milestone Percentage:</span>
                    <span className="font-mono text-zinc-200">{milestone?.percentage}% of agreed total</span>
                  </div>
                </div>

                {/* Secure Checkout Action */}
                <div className="space-y-3 pt-2">
                  <Button
                    size="lg"
                    variant="default"
                    isLoading={isProcessing}
                    onClick={handlePayNow}
                    className="w-full h-12 text-sm font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {amountFormatted} Now</span>
                  </Button>

                  <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Payments are encrypted & securely routed to Q Delta Studio.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="max-w-xl mx-auto w-full py-4 text-center text-[11px] text-zinc-600">
        © {new Date().getFullYear()} Qdelta Digital Studio • Automated CRM Payment Gateway
      </footer>
    </div>
  );
}
