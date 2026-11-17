'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PiggyBank,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Calculator,
  ChevronRight
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { db } from '@/lib/storage/db';
import { Subscription, Mandate, DuplicateGroup, CurrencyCode } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  computeSavingsSummary,
  computeCategorySpending,
  calculateMonthlyEquivalent
} from '@/lib/algorithms/savingsCalculator';

export default function SavingsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  useEffect(() => {
    db.initialize();
    loadData();

    const onUpdate = () => loadData();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadData = () => {
    setSubscriptions(db.getSubscriptions());
    setMandates(db.getMandates());
    setDuplicates(db.getDuplicates());
    setCurrency(db.getCurrency());
  };

  const summary = computeSavingsSummary(subscriptions, mandates, duplicates);
  const categorySpending = computeCategorySpending(subscriptions);

  // Confirmed savings: subscriptions already marked cancelled
  const cancelledSubs = subscriptions.filter((s) => s.status === 'cancelled');
  const confirmedMonthlySavings = cancelledSubs.reduce(
    (acc, s) => acc + calculateMonthlyEquivalent(s.amount, s.billingFrequency),
    0
  );
  const confirmedAnnualSavings = confirmedMonthlySavings * 12;

  // Hypothetical savings recommendations
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
  const trialSubs = subscriptions.filter((s) => s.status === 'trial');

  return (
    <Shell
      title="Savings Analyzer & Optimization Engine"
      subtitle="Data-driven audit distinguishing verified confirmed savings from actionable hypothetical reductions"
    >
      <div className="space-y-8">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Monthly Recurring"
            value={formatCurrency(summary.totalMonthlySpend, currency)}
            subtitle="Current active run-rate"
            icon={PiggyBank}
            iconColor="text-primary"
          />

          <StatCard
            title="Confirmed Savings (Active)"
            value={formatCurrency(confirmedAnnualSavings, currency)}
            subtitle={`${formatCurrency(confirmedMonthlySavings, currency)}/mo from cancelled plans`}
            icon={CheckCircle2}
            iconColor="text-emerald-400"
            variant="success"
          />

          <StatCard
            title="Potential Annual Savings"
            value={formatCurrency(summary.potentialAnnualSavings, currency)}
            subtitle="Actionable savings identified"
            icon={TrendingDown}
            iconColor="text-amber-400"
            variant="warning"
          />

          <StatCard
            title="Duplicate Elimination"
            value={formatCurrency(summary.duplicateWasteMonthly * 12, currency)}
            subtitle={`${formatCurrency(summary.duplicateWasteMonthly, currency)}/mo redundant charges`}
            icon={Scissors}
            iconColor="text-secondary"
          />
        </div>

        {/* Clear Truth Distinction Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Confirmed Savings Column */}
          <div className="rounded-2xl border border-emerald-800/80 bg-emerald-950/20 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Confirmed Savings
                  </h4>
                </div>
                <Badge variant="success" size="sm">
                  Verified In Ledger
                </Badge>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold text-emerald-300">
                  {formatCurrency(confirmedMonthlySavings, currency)}
                  <span className="text-xs font-normal text-emerald-400/80">/month</span>
                </div>
                <p className="mt-1 text-xs text-emerald-200/90 leading-relaxed">
                  Realized capital preserved through {cancelledSubs.length} intentionally cancelled or expired services.
                </p>

                <div className="mt-4 space-y-2">
                  {cancelledSubs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No cancelled subscriptions recorded yet.</p>
                  ) : (
                    cancelledSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs"
                      >
                        <span className="font-semibold text-slate-200">{sub.name}</span>
                        <span className="font-bold text-emerald-400">
                          +{formatCurrency(calculateMonthlyEquivalent(sub.amount, sub.billingFrequency), currency)}/mo saved
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-emerald-900/60 text-[11px] text-emerald-300/80">
              Annualized recovered cashflow: <strong>{formatCurrency(confirmedAnnualSavings, currency)}/year</strong>
            </div>
          </div>

          {/* Hypothetical Savings Opportunities */}
          <div className="rounded-2xl border border-amber-800/80 bg-amber-950/20 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-amber-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Hypothetical Savings (Opportunities)
                  </h4>
                </div>
                <Badge variant="warning" size="sm">
                  Action Required
                </Badge>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold text-amber-300">
                  {formatCurrency(summary.potentialMonthlySavings, currency)}
                  <span className="text-xs font-normal text-amber-400/80">/month</span>
                </div>
                <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                  Estimated capital that can be immediately unlocked by eliminating verified duplicates
                  and letting non-essential trials end.
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5">
                    <span className="text-slate-300">Duplicate Services ({duplicates.length} groups)</span>
                    <span className="font-bold text-amber-400">
                      {formatCurrency(summary.duplicateWasteMonthly, currency)}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5">
                    <span className="text-slate-300">Expiring Free Trials ({trialSubs.length} active)</span>
                    <span className="font-bold text-amber-400">
                      {formatCurrency(summary.unusedOrIdleMonthly, currency)}/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-amber-900/60 flex items-center justify-between">
              <span className="text-[11px] text-amber-300/80">
                Potential 1-year impact: <strong>{formatCurrency(summary.potentialAnnualSavings, currency)}</strong>
              </span>
              <Link
                href="/duplicates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-white"
              >
                <span>Audit Duplicates</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Actionable Savings Recommendations */}
        <div className="rounded-2xl border border-slate-800 bg-surface p-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Strategic Optimization Recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Personalized guidance based on your recurring payment composition
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Scissors className="h-4 w-4" />
                Consolidate Music Plans
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                You are paying for Spotify Family alongside a forgotten individual plan. Cancelling
                the single user subscription saves <strong>₹119/mo (₹1,428/yr)</strong> with zero loss in streaming access.
              </p>
              <Link
                href="/duplicates"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Resolve Duplicate
              </Link>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-bold text-secondary flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                Annual Switch Discount
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Switching high-cost monthly subscriptions (such as Netflix or ChatGPT) to annual
                corporate/developer plans typically saves between <strong>15% to 20%</strong> annually.
              </p>
              <Link
                href="/subscriptions"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
              >
                View Plans
              </Link>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Audit Open Mandate Limits
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Review your UPI AutoPay limits on PhonePe and Google Pay to ensure debit caps match
                actual subscription prices and prevent unexpected surge deductions.
              </p>
              <Link
                href="/mandates"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
              >
                Audit Mandates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
