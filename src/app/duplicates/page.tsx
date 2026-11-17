'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CopyX,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  HelpCircle,
  PiggyBank
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { db } from '@/lib/storage/db';
import { DuplicateGroup, Subscription, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<Subscription | null>(null);

  useEffect(() => {
    db.initialize();
    loadDuplicates();

    const onUpdate = () => loadDuplicates();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadDuplicates = () => {
    setDuplicates(db.getDuplicates());
    setCurrency(db.getCurrency());
  };

  const handleResolveDuplicate = (subToCancel: Subscription) => {
    if (
      confirm(
        `Are you sure you want to mark "${subToCancel.name}" as cancelled to resolve this duplicate?`
      )
    ) {
      db.updateSubscription(subToCancel.id, { status: 'cancelled' });
      loadDuplicates();
      window.dispatchEvent(new Event('subsentry_db_updated'));
      alert(`"${subToCancel.name}" marked as cancelled. Your monthly savings have been updated.`);
    }
  };

  const totalMonthlyWaste = duplicates.reduce((acc, d) => acc + d.totalMonthlyWaste, 0);

  return (
    <Shell
      title="Duplicate Subscription Detector"
      subtitle="Identify redundant multi-instrument subscriptions and overlapping category services"
    >
      <div className="space-y-6">
        {/* Savings Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-amber-800/80 bg-amber-950/20 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-900/60 p-2.5 text-amber-300">
              <CopyX className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {duplicates.length > 0
                  ? `${duplicates.length} Potential Duplicate Group(s) Detected`
                  : 'Zero Duplicate Subscriptions Found'}
              </h4>
              <p className="mt-1 text-xs text-amber-200/90 max-w-2xl leading-relaxed">
                Paying for the same provider across multiple cards or holding overlapping services
                silently wastes money. Review the flagged groups below to consolidate or cancel.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-slate-900/80 border border-amber-800/60 p-3.5 text-right">
            <div className="text-[11px] text-slate-400">Recoverable Waste:</div>
            <div className="text-xl font-bold text-amber-300">
              {formatCurrency(totalMonthlyWaste, currency)}/mo
            </div>
            <div className="text-[10px] text-slate-400">
              ({formatCurrency(totalMonthlyWaste * 12, currency)}/year)
            </div>
          </div>
        </div>

        {/* Duplicate Groups List */}
        {duplicates.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Clean Subscription Portfolio!"
            description="No redundant or overlapping subscriptions were found across your active accounts."
          />
        ) : (
          <div className="space-y-6">
            {duplicates.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-800 bg-surface p-6 shadow-md transition hover:border-slate-700"
              >
                {/* Group Title & Reason */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{group.merchantNormalized}</h3>
                      <Badge variant="warning" size="sm">
                        Duplicate Conflict
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{group.reason}</p>
                  </div>

                  <div className="text-sm font-bold text-rose-400 sm:text-right">
                    <span>Waste: +{formatCurrency(group.totalMonthlyWaste, currency)}/mo</span>
                  </div>
                </div>

                {/* Subscriptions in Conflict */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.subscriptions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Option {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{sub.name}</h4>
                            <div className="text-[11px] text-slate-400">
                              {sub.serviceProvider} • {sub.accountNickname || 'Personal'}
                            </div>
                          </div>
                          <Badge variant={sub.status === 'active' ? 'success' : 'default'} size="sm">
                            {sub.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Billed Amount:</span>
                            <span className="font-bold text-white">
                              {formatCurrency(sub.amount, currency)}/{sub.billingFrequency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Payment Instrument:</span>
                            <span className="text-slate-300">
                              {sub.paymentMethodName || 'Registered Mandate'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Next Renewal:</span>
                            <span className="text-slate-300">
                              {formatDate(sub.nextBillingDate, 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedSubForCancel(sub)}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Cancellation Steps</span>
                        </button>

                        <button
                          onClick={() => handleResolveDuplicate(sub)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Cancel This One</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Guide Modal */}
        {selectedSubForCancel && (
          <Modal
            isOpen={!!selectedSubForCancel}
            onClose={() => setSelectedSubForCancel(null)}
            title={`Cancel ${selectedSubForCancel.name}`}
            subtitle="Verified cancellation instructions to resolve duplicate billing"
            maxWidth="md"
          >
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-900/80 p-3.5 text-xs text-slate-300 leading-relaxed border border-slate-800">
                {selectedSubForCancel.cancellationInstructions ||
                  'Log into the provider account settings and turn off auto-renewal, or revoke the mandate in your bank/UPI app.'}
              </div>

              {selectedSubForCancel.cancellationUrl && (
                <a
                  href={selectedSubForCancel.cancellationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition"
                >
                  <span>Go to Provider Cancellation Page</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
