'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Building2,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { db } from '@/lib/storage/db';
import { Subscription, Mandate, Transaction, DuplicateGroup, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  computeSavingsSummary,
  computeCategorySpending,
  calculateAnnualEquivalent,
  calculateMonthlyEquivalent
} from '@/lib/algorithms/savingsCalculator';
import {
  exportSubscriptionsCsv,
  exportMandatesCsv,
  exportTransactionsCsv,
  exportDetectionsCsv
} from '@/lib/utils/exportUtils';

export default function ReportsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [activeReportTab, setActiveReportTab] = useState<'MONTHLY' | 'ANNUAL' | 'CATEGORY' | 'MANDATES'>('MONTHLY');

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
    setTransactions(db.getTransactions());
    setDuplicates(db.getDuplicates());
    setCurrency(db.getCurrency());
  };

  const summary = computeSavingsSummary(subscriptions, mandates, duplicates);
  const categories = computeCategorySpending(subscriptions);
  const profile = db.getProfile();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Shell
      title="Financial Audit Reports & Exports"
      subtitle="Comprehensive audit statements, category distributions, and printable export packages"
    >
      <div className="space-y-6">
        {/* Controls Bar: Report Tabs & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-800 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'MONTHLY', label: 'Monthly Financial Audit' },
              { id: 'ANNUAL', label: 'Annual Subscription Report' },
              { id: 'CATEGORY', label: 'Category Spending Report' },
              { id: 'MANDATES', label: 'Auto-Debit Mandates Audit' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeReportTab === tab.id
                    ? 'bg-primary text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={() => {
                if (activeReportTab === 'MANDATES') exportMandatesCsv(mandates);
                else exportSubscriptionsCsv(subscriptions);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Report Document Canvas (Printable Styled Card) */}
        <div className="rounded-2xl border border-slate-800 bg-surface p-8 shadow-xl print:border-none print:bg-white print:text-black">
          {/* Official Document Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white print:text-black">
                  SubSentry AI
                </span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary print:border print:border-black">
                  OFFICIAL AUDIT REPORT
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 print:text-gray-600">
                Personal Recurring Financial Commitments & Mandate Ledger
              </p>
            </div>

            <div className="text-right text-xs">
              <div className="font-semibold text-white print:text-black">{profile.fullName}</div>
              <div className="text-[11px] text-slate-400 print:text-gray-600">
                Report Date: {formatDate(new Date().toISOString(), 'dd MMMM yyyy')}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">
                Auditor Hash: SUB-{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Report Metadata Summary Metrics */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-900/60 p-4 border border-slate-800 print:border print:border-gray-300 print:bg-gray-50">
            <div>
              <div className="text-[11px] text-slate-400 print:text-gray-600 uppercase">
                Monthly Total
              </div>
              <div className="mt-0.5 text-lg font-bold text-white print:text-black">
                {formatCurrency(summary.totalMonthlySpend, currency)}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 print:text-gray-600 uppercase">
                Annual Run-Rate
              </div>
              <div className="mt-0.5 text-lg font-bold text-white print:text-black">
                {formatCurrency(summary.totalAnnualSpend, currency)}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 print:text-gray-600 uppercase">
                Monitored Accounts
              </div>
              <div className="mt-0.5 text-lg font-bold text-white print:text-black">
                {summary.activeCount} Active Subs
              </div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-400 print:text-green-700 uppercase">
                Identified Savings
              </div>
              <div className="mt-0.5 text-lg font-bold text-emerald-400 print:text-green-700">
                {formatCurrency(summary.potentialAnnualSavings, currency)}/yr
              </div>
            </div>
          </div>

          {/* TAB 1: Monthly Financial Audit */}
          {activeReportTab === 'MONTHLY' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                Active Monthly Recurring Commitments
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:text-black">
                  <thead className="border-b border-slate-800 print:border-black text-[11px] font-semibold text-slate-400 print:text-gray-700 uppercase">
                    <tr>
                      <th className="py-2.5">Service Provider</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Frequency</th>
                      <th className="py-2.5">Payment Instrument</th>
                      <th className="py-2.5 text-right">Raw Amount</th>
                      <th className="py-2.5 text-right">Monthly Equivalent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {subscriptions
                      .filter((s) => s.status === 'active' || s.status === 'trial')
                      .map((sub) => {
                        const monthlyVal = calculateMonthlyEquivalent(sub.amount, sub.billingFrequency);
                        return (
                          <tr key={sub.id}>
                            <td className="py-2.5 font-semibold text-white print:text-black">
                              {sub.name}
                            </td>
                            <td className="py-2.5 text-slate-300 print:text-gray-700">{sub.category}</td>
                            <td className="py-2.5 capitalize text-slate-300 print:text-gray-700">
                              {sub.billingFrequency}
                            </td>
                            <td className="py-2.5 text-slate-400 print:text-gray-600">
                              {sub.paymentMethodName || 'Direct'}
                            </td>
                            <td className="py-2.5 text-right text-slate-300 print:text-gray-800">
                              {formatCurrency(sub.amount, currency)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-white print:text-black">
                              {formatCurrency(monthlyVal, currency)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-700 print:border-black font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 text-right text-white print:text-black">
                        Total Monthly Outflow:
                      </td>
                      <td className="py-3 text-right text-base text-primary print:text-black">
                        {formatCurrency(summary.totalMonthlySpend, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Annual Subscription Report */}
          {activeReportTab === 'ANNUAL' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                Annual Cost Projection & Renewals
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:text-black">
                  <thead className="border-b border-slate-800 print:border-black text-[11px] font-semibold text-slate-400 print:text-gray-700 uppercase">
                    <tr>
                      <th className="py-2.5">Subscription</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Next Renewal</th>
                      <th className="py-2.5">Account Nickname</th>
                      <th className="py-2.5 text-right">Annual Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {subscriptions.map((sub) => {
                      const annualVal = calculateAnnualEquivalent(sub.amount, sub.billingFrequency);
                      return (
                        <tr key={sub.id}>
                          <td className="py-2.5 font-semibold text-white print:text-black">
                            {sub.name}
                          </td>
                          <td className="py-2.5 text-slate-300 print:text-gray-700">{sub.category}</td>
                          <td className="py-2.5 text-slate-300 print:text-gray-700">
                            {formatDate(sub.nextBillingDate)}
                          </td>
                          <td className="py-2.5 text-slate-400 print:text-gray-600">
                            {sub.accountNickname || 'Personal'}
                          </td>
                          <td className="py-2.5 text-right font-bold text-white print:text-black">
                            {formatCurrency(annualVal, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-700 print:border-black font-bold">
                    <tr>
                      <td colSpan={4} className="py-3 text-right text-white print:text-black">
                        Total Annual Outflow:
                      </td>
                      <td className="py-3 text-right text-base text-secondary print:text-black">
                        {formatCurrency(summary.totalAnnualSpend, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Category Spending Report */}
          {activeReportTab === 'CATEGORY' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                Category Spending Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:text-black">
                  <thead className="border-b border-slate-800 print:border-black text-[11px] font-semibold text-slate-400 print:text-gray-700 uppercase">
                    <tr>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5 text-right">Monthly Spend</th>
                      <th className="py-2.5 text-right">Annual Projection</th>
                      <th className="py-2.5 text-right">Share of Outlay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {categories.map((cat) => (
                      <tr key={cat.category}>
                        <td className="py-2.5 font-semibold text-white print:text-black">
                          {cat.category}
                        </td>
                        <td className="py-2.5 text-right text-slate-300 print:text-gray-800">
                          {formatCurrency(cat.monthlyAmount, currency)}
                        </td>
                        <td className="py-2.5 text-right text-slate-300 print:text-gray-800">
                          {formatCurrency(cat.monthlyAmount * 12, currency)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-primary print:text-black">
                          {cat.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Mandates Audit */}
          {activeReportTab === 'MANDATES' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                Auto-Debit Mandate Ledger
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:text-black">
                  <thead className="border-b border-slate-800 print:border-black text-[11px] font-semibold text-slate-400 print:text-gray-700 uppercase">
                    <tr>
                      <th className="py-2.5">Merchant</th>
                      <th className="py-2.5">Mandate Type</th>
                      <th className="py-2.5">Masked Ref</th>
                      <th className="py-2.5">Payment Source</th>
                      <th className="py-2.5 text-right">Limit / Amount</th>
                      <th className="py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {mandates.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 font-semibold text-white print:text-black">
                          {m.merchantName}
                        </td>
                        <td className="py-2.5 capitalize text-slate-300 print:text-gray-700">
                          {m.mandateType.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400 print:text-gray-600">
                          {m.mandateRefMasked}
                        </td>
                        <td className="py-2.5 text-slate-300 print:text-gray-700">{m.paymentSource}</td>
                        <td className="py-2.5 text-right font-bold text-white print:text-black">
                          {formatCurrency(m.amountLimit, currency)}
                        </td>
                        <td className="py-2.5 text-center capitalize text-emerald-400 print:text-black">
                          {m.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Footer Disclaimer */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-[10px] text-slate-400 print:text-gray-500 leading-relaxed">
            Report generated securely by SubSentry AI. Financial calculations are deterministic and based on
            verified user subscriptions and statement records. No banking passwords or live credentials are stored.
          </div>
        </div>
      </div>
    </Shell>
  );
}
