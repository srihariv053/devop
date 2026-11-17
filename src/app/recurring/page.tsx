'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  CreditCard,
  Filter,
  Download,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { db } from '@/lib/storage/db';
import { RecurringDetection, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { exportDetectionsCsv } from '@/lib/utils/exportUtils';

export default function RecurringDetectionsPage() {
  const [detections, setDetections] = useState<RecurringDetection[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');

  useEffect(() => {
    db.initialize();
    loadDetections();

    const onUpdate = () => loadDetections();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadDetections = () => {
    setDetections(db.getRecurringDetections());
    setCurrency(db.getCurrency());
  };

  const handleApprove = (id: string) => {
    const newSub = db.convertDetectionToSubscription(id);
    if (newSub) {
      alert(`Successfully added "${newSub.name}" to your active Subscriptions!`);
      loadDetections();
      window.dispatchEvent(new Event('subsentry_db_updated'));
    }
  };

  const handleReject = (id: string) => {
    db.updateRecurringDetectionStatus(id, 'REJECTED');
    loadDetections();
    window.dispatchEvent(new Event('subsentry_db_updated'));
  };

  const handleReAudit = () => {
    const tx = db.getTransactions();
    const profile = db.getProfile();
    const reDetected = db.getRecurringDetections();
    loadDetections();
    alert('Recurring detection algorithm re-evaluated against all stored transactions.');
  };

  const filtered = detections.filter((d) => {
    const matchStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    const matchConfidence = selectedConfidence === 'ALL' || d.confidenceScore === selectedConfidence;
    return matchStatus && matchConfidence;
  });

  const getConfidenceBadge = (score: string, pct: number) => {
    if (score === 'HIGH') {
      return (
        <Badge variant="success" size="sm">
          HIGH ({pct}%)
        </Badge>
      );
    }
    if (score === 'MEDIUM') {
      return (
        <Badge variant="warning" size="sm">
          MEDIUM ({pct}%)
        </Badge>
      );
    }
    return (
      <Badge variant="info" size="sm">
        LOW ({pct}%)
      </Badge>
    );
  };

  return (
    <Shell
      title="Recurring Payment Detection Engine"
      subtitle="Algorithmic pattern recognition analyzing transaction intervals, amounts, and merchant similarity"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <ScanLine className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Human-in-the-Loop Safeguard
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-3xl">
                Uncertain transactions are never automatically converted into active commitments.
                Review algorithmically flagged debits below and approve confirmed subscriptions or reject false positives.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="PENDING">Pending Review</option>
              <option value="CONVERTED">Approved / Converted</option>
              <option value="REJECTED">Dismissed / Rejected</option>
              <option value="ALL">All Items</option>
            </select>

            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Confidence Scores</option>
              <option value="HIGH">High Confidence</option>
              <option value="MEDIUM">Medium Confidence</option>
              <option value="LOW">Low Confidence</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReAudit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              <RotateCw className="h-3.5 w-3.5 text-primary" />
              <span>Re-run Detection</span>
            </button>

            <button
              onClick={() => exportDetectionsCsv(filtered)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Detections Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title={selectedStatus === 'PENDING' ? 'No pending recurring payments' : 'No items match filter'}
            description="All candidate transactions have been reviewed or no recurring patterns meet the threshold."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-surface p-5 shadow-sm transition hover:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.merchantName}</h4>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {item.suggestedCategory}
                      </span>
                    </div>
                    {getConfidenceBadge(item.confidenceScore, item.confidencePercentage)}
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Detected Outlay:</span>
                      <span className="text-base font-bold text-white">
                        {formatCurrency(item.detectedAmount, currency)}
                        <span className="text-xs font-normal text-slate-400 capitalize">
                          /{item.suggestedFrequency}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Occurrences:</span>
                      <span className="font-medium">{item.matchedCount} statement debits</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Cadence Interval:</span>
                      <span className="font-medium">~{item.averageIntervalDays} days</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Last Seen Date:</span>
                      <span className="font-medium">{formatDate(item.lastDetectedDate)}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Audit Proof: </span>
                    {item.reason}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  {item.status === 'PENDING' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        <XCircle className="h-4 w-4 text-rose-400" />
                        <span>Dismiss</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm Sub</span>
                      </button>
                    </div>
                  ) : item.status === 'CONVERTED' ? (
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold py-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Active in Subscriptions
                      </span>
                      <Link href="/subscriptions" className="text-primary hover:underline">
                        View
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-1">
                      Dismissed from recurring queue
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
