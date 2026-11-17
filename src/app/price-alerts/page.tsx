'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { db } from '@/lib/storage/db';
import { PriceChangeAlert, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceChangeAlert[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  useEffect(() => {
    db.initialize();
    loadAlerts();

    const onUpdate = () => loadAlerts();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadAlerts = () => {
    setAlerts(db.getPriceChanges());
    setCurrency(db.getCurrency());
  };

  const handleAcknowledge = (id: string) => {
    db.acknowledgePriceChange(id);
    loadAlerts();
    window.dispatchEvent(new Event('subsentry_db_updated'));
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <Shell
      title="Subscription Price Increase Detector"
      subtitle="Detect unexpected price spikes, revised tier pricing, and deviations from expected debit amounts"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/20 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-900/60 p-2.5 text-rose-300">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Autonomous Price Spike Surveillance
              </h4>
              <p className="mt-1 text-xs text-rose-200/90 max-w-2xl leading-relaxed">
                Service providers frequently revise subscription fees without clear notice. SubSentry
                compares historical statement debits with your registered amounts to catch silent hikes immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Active Price Hikes */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Price Increase Alerts ({activeAlerts.length})
            </h3>
          </div>

          {activeAlerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No unexpected price increases detected"
              description="All current debit deductions match their anticipated subscription baselines."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-rose-900/60 bg-surface p-6 shadow-md transition hover:border-rose-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {alert.subscriptionName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Detected on {formatDate(alert.detectedDate, 'dd MMMM yyyy')}
                        </span>
                      </div>
                      <Badge variant="danger" size="md">
                        +{alert.percentageIncrease}% Surge
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Previous Charge</div>
                        <div className="mt-1 font-semibold text-slate-300">
                          {formatCurrency(alert.previousAmount, currency)}
                        </div>
                      </div>

                      <div className="border-x border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">New Charge</div>
                        <div className="mt-1 font-bold text-white">
                          {formatCurrency(alert.newAmount, currency)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-rose-400 uppercase">Increase</div>
                        <div className="mt-1 font-bold text-rose-400">
                          +{formatCurrency(alert.difference, currency)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                      SubSentry identified a debit of <strong>{formatCurrency(alert.newAmount, currency)}</strong>,
                      which exceeds the previous billing charge of <strong>{formatCurrency(alert.previousAmount, currency)}</strong> by{' '}
                      <strong>{alert.percentageIncrease}%</strong> (+{formatCurrency(alert.difference, currency)}/mo).
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href="/subscriptions"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View in Subscriptions
                    </Link>

                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historical Acknowledged Increases */}
        {acknowledgedAlerts.length > 0 && (
          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Acknowledged Price Increases ({acknowledgedAlerts.length})
            </h4>
            <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-surface">
              {acknowledgedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 flex items-center justify-between text-xs text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white">{alert.subscriptionName}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Old: {formatCurrency(alert.previousAmount, currency)} ➔ New:{' '}
                        {formatCurrency(alert.newAmount, currency)}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Acknowledged • {formatDate(alert.detectedDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
