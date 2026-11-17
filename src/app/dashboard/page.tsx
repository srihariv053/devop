'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  TrendingDown,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Plus,
  UploadCloud,
  CopyX,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

import { Shell } from '@/components/layout/Shell';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { db } from '@/lib/storage/db';
import { Subscription, Mandate, DuplicateGroup, PriceChangeAlert, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils/formatters';
import { computeSavingsSummary, computeCategorySpending } from '@/lib/algorithms/savingsCalculator';

const CATEGORY_COLORS: Record<string, string> = {
  Streaming: '#6366F1',
  Music: '#06B6D4',
  Software: '#8B5CF6',
  'Food delivery': '#F59E0B',
  Shopping: '#EC4899',
  'Cloud storage': '#3B82F6',
  Fitness: '#10B981',
  Finance: '#14B8A6',
  Education: '#F97316',
  Utilities: '#64748B',
  Other: '#94A3B8'
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceChangeAlert[]>([]);

  useEffect(() => {
    db.initialize();
    loadData();
    setMounted(true);

    const onUpdate = () => loadData();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadData = () => {
    setCurrency(db.getCurrency());
    setSubscriptions(db.getSubscriptions());
    setMandates(db.getMandates());
    setDuplicates(db.getDuplicates());
    setPriceAlerts(db.getPriceChanges().filter((p) => !p.acknowledged));
  };

  if (!mounted) return null;

  const summary = computeSavingsSummary(subscriptions, mandates, duplicates);
  const categorySpending = computeCategorySpending(subscriptions);

  // Upcoming debits within next 14 days
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
  const upcomingDebits = activeSubs
    .map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      date: s.nextBillingDate,
      paymentMethod: s.paymentMethodName || 'Direct Mandate',
      daysInfo: getDaysUntil(s.nextBillingDate),
      isTrial: s.status === 'trial'
    }))
    .sort((a, b) => a.daysInfo.days - b.daysInfo.days)
    .slice(0, 5);

  // Monthly vs Annual Trend Mock Data for Indian context
  const trendData = [
    { month: 'Jun', spend: Math.round(summary.totalMonthlySpend * 0.88) },
    { month: 'Jul', spend: Math.round(summary.totalMonthlySpend * 0.92) },
    { month: 'Aug', spend: Math.round(summary.totalMonthlySpend * 0.95) },
    { month: 'Sep', spend: Math.round(summary.totalMonthlySpend * 0.98) },
    { month: 'Oct', spend: Math.round(summary.totalMonthlySpend * 0.99) },
    { month: 'Nov (Current)', spend: summary.totalMonthlySpend }
  ];

  return (
    <Shell
      title="Financial Executive Dashboard"
      subtitle="Complete overview of recurring commitments, auto-debits, and savings opportunities"
    >
      <div className="space-y-8">
        {/* Urgent Action Banners (if any duplicates or price hikes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priceAlerts.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-rose-800/80 bg-rose-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-900/60 p-2 text-rose-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-200">
                    Price Increase Detected ({priceAlerts.length})
                  </div>
                  <p className="text-[11px] text-rose-300/80">
                    {priceAlerts[0].subscriptionName} increased by +{priceAlerts[0].percentageIncrease}% (+{formatCurrency(priceAlerts[0].difference, currency)}/mo).
                  </p>
                </div>
              </div>
              <Link
                href="/price-alerts"
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-white"
              >
                <span>Review</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-amber-800/80 bg-amber-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-900/60 p-2 text-amber-300">
                  <CopyX className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-200">
                    Duplicate Subscriptions ({duplicates.length})
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    Saving opportunity: {formatCurrency(summary.duplicateWasteMonthly, currency)}/month in redundant charges.
                  </p>
                </div>
              </div>
              <Link
                href="/duplicates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-white"
              >
                <span>Audit</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Monthly Recurring"
            value={formatCurrency(summary.totalMonthlySpend, currency)}
            subtitle="Normalized monthly commitment"
            icon={CreditCard}
            iconColor="text-primary"
            variant="primary"
          />

          <StatCard
            title="Total Annual Run-Rate"
            value={formatCurrency(summary.totalAnnualSpend, currency)}
            subtitle="Annualized expenditure"
            icon={Calendar}
            iconColor="text-secondary"
          />

          <StatCard
            title="Active Commitments"
            value={`${summary.activeCount} Subs + ${summary.mandateCount} Mandates`}
            subtitle="Monitored payment streams"
            icon={ShieldCheck}
            iconColor="text-emerald-400"
            variant="success"
          />

          <StatCard
            title="Potential Annual Savings"
            value={formatCurrency(summary.potentialAnnualSavings, currency)}
            subtitle={`${formatCurrency(summary.potentialMonthlySavings, currency)}/mo recoverable`}
            icon={TrendingDown}
            iconColor="text-emerald-400"
            variant="success"
          />
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Quick Actions:</span>
            <span className="text-xs text-slate-400">Streamline recurring payment management</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Subscription</span>
            </Link>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <UploadCloud className="h-3.5 w-3.5 text-secondary" />
              <span>Import Bank CSV</span>
            </Link>
            <Link
              href="/ai-insights"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/60 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>SubSentry Intelligence</span>
            </Link>
          </div>
        </div>

        {/* Charts Section: Spending Trends & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Bar Chart */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-surface p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Spending Trajectory</h3>
                <p className="text-xs text-slate-400">Past 6 months recurring expenditure pattern</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                <span>Monthly Total</span>
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2742" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2742' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2742' }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151C2F',
                      borderColor: '#232D48',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), 'Outlay']}
                  />
                  <Bar dataKey="spend" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="rounded-xl border border-slate-800 bg-surface p-6 flex flex-col justify-between">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">Normalized spend by category</p>
            </div>

            <div className="my-2 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    dataKey="monthlyAmount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category] || '#6366F1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151C2F',
                      borderColor: '#232D48',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => formatCurrency(Number(val), currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {categorySpending.slice(0, 4).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6366F1' }}
                    />
                    <span className="text-slate-300">{cat.category}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatCurrency(cat.monthlyAmount, currency)} ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Upcoming Debits & Top Cost Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Payments Schedule */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-surface p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Debits & Renewals</h3>
                <p className="text-xs text-slate-400">Next auto-debits scheduled across mandates & cards</p>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Full Calendar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-800/80">
              {upcomingDebits.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No upcoming debits scheduled</p>
              ) : (
                upcomingDebits.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-bold text-xs">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{item.name}</span>
                          {item.isTrial && <Badge variant="warning" size="sm">Trial Ending</Badge>}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.paymentMethod}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {formatCurrency(item.amount, currency)}
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          item.daysInfo.isUrgent ? 'text-amber-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {item.daysInfo.label} ({formatDate(item.date, 'dd MMM')})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Intelligence Spotlight */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-surface to-slate-900 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">SubSentry Intelligence</span>
              </div>
              <h4 className="text-sm font-bold text-white">Automated Financial Audit</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                You have <strong>{subscriptions.length} recurring services</strong> and{' '}
                <strong>{mandates.length} registered auto-debits</strong>. Your highest cost driver is{' '}
                <strong>{summary.topExpensiveSubscription?.name || 'SaaS'}</strong> at{' '}
                {formatCurrency(summary.topExpensiveSubscription?.amount || 0, currency)}/mo.
              </p>
              {summary.potentialAnnualSavings > 0 && (
                <div className="mt-4 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
                  <div className="text-xs font-bold text-emerald-300">Optimization Opportunity</div>
                  <p className="mt-0.5 text-[11px] text-emerald-400/90">
                    Cancel identified duplicate services to recover up to{' '}
                    <strong>{formatCurrency(summary.potentialAnnualSavings, currency)}</strong> this year.
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/ai-insights"
              className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
            >
              <span>Ask SubSentry Intelligence</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
