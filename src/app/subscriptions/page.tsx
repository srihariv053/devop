'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  CreditCard,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  Download
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { db } from '@/lib/storage/db';
import {
  Subscription,
  SubscriptionCategory,
  BillingFrequency,
  SubscriptionStatus,
  CurrencyCode
} from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils/formatters';
import { calculateAnnualEquivalent } from '@/lib/algorithms/savingsCalculator';
import { exportSubscriptionsCsv } from '@/lib/utils/exportUtils';

const ALL_CATEGORIES: SubscriptionCategory[] = [
  'Entertainment',
  'Streaming',
  'Music',
  'Software',
  'Cloud storage',
  'Education',
  'Shopping',
  'Fitness',
  'Food delivery',
  'Utilities',
  'Finance',
  'Other'
];

const ALL_FREQUENCIES: BillingFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'half-yearly',
  'annually',
  'custom'
];

const ALL_STATUSES: SubscriptionStatus[] = [
  'active',
  'trial',
  'paused',
  'cancelled',
  'expired',
  'payment_failed'
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'date-asc' | 'name-asc'>('amount-desc');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Cancellation Guide Modal
  const [cancellationModalSub, setCancellationModalSub] = useState<Subscription | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    serviceProvider: '',
    category: 'Streaming' as SubscriptionCategory,
    amount: 499,
    currency: 'INR' as CurrencyCode,
    billingFrequency: 'monthly' as BillingFrequency,
    billingStartDate: new Date().toISOString().split('T')[0],
    nextBillingDate: new Date().toISOString().split('T')[0],
    paymentMethodName: 'HDFC Millennia Credit Card (•••• 8821)',
    accountNickname: 'Personal',
    status: 'active' as SubscriptionStatus,
    trialEndDate: '',
    cancellationUrl: '',
    cancellationInstructions: '',
    notes: ''
  });

  useEffect(() => {
    db.initialize();
    loadSubs();

    const onUpdate = () => loadSubs();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadSubs = () => {
    setSubscriptions(db.getSubscriptions());
    setCurrency(db.getCurrency());
  };

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      serviceProvider: '',
      category: 'Streaming',
      amount: 499,
      currency: currency,
      billingFrequency: 'monthly',
      billingStartDate: new Date().toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      paymentMethodName: 'HDFC Millennia Credit Card (•••• 8821)',
      accountNickname: 'Personal',
      status: 'active',
      trialEndDate: '',
      cancellationUrl: '',
      cancellationInstructions: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      serviceProvider: sub.serviceProvider,
      category: sub.category,
      amount: sub.amount,
      currency: sub.currency,
      billingFrequency: sub.billingFrequency,
      billingStartDate: sub.billingStartDate,
      nextBillingDate: sub.nextBillingDate,
      paymentMethodName: sub.paymentMethodName || '',
      accountNickname: sub.accountNickname || '',
      status: sub.status,
      trialEndDate: sub.trialEndDate || '',
      cancellationUrl: sub.cancellationUrl || '',
      cancellationInstructions: sub.cancellationInstructions || '',
      notes: sub.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      db.deleteSubscription(id);
      loadSubs();
      window.dispatchEvent(new Event('subsentry_db_updated'));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.amount <= 0) {
      alert('Please provide a valid subscription name and amount.');
      return;
    }

    if (editingSub) {
      db.updateSubscription(editingSub.id, formData);
    } else {
      db.addSubscription(formData);
    }

    setIsModalOpen(false);
    loadSubs();
    window.dispatchEvent(new Event('subsentry_db_updated'));
  };

  // Filter & Sort Logic
  const filteredSubs = subscriptions
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.serviceProvider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.accountNickname && s.accountNickname.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'date-asc') {
        return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
      }
      return 0;
    });

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'warning';
      case 'paused':
        return 'info';
      case 'payment_failed':
        return 'danger';
      case 'cancelled':
      case 'expired':
      default:
        return 'default';
    }
  };

  return (
    <Shell
      title="Subscription Manager"
      subtitle="Complete ledger of recurring subscriptions, cancellation guidance, and yearly cost analysis"
    >
      <div className="space-y-6">
        {/* Top Controls: Search, Filters, Add Button */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriptions by name, provider, nickname..."
              className="w-full rounded-lg border border-slate-700 bg-surface py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="amount-desc">Highest Price First</option>
              <option value="amount-asc">Lowest Price First</option>
              <option value="date-asc">Next Renewal Date</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={() => exportSubscriptionsCsv(filteredSubs)}
              title="Export filtered subscriptions to CSV"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            {/* Add Subscription Button */}
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-surface shadow-sm">
          {filteredSubs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CreditCard}
                title="No subscriptions found"
                description={
                  searchQuery || selectedCategory !== 'ALL'
                    ? 'No subscriptions match your search or filter criteria.'
                    : 'Get started by creating your first subscription entry.'
                }
                actionLabel="Add Subscription"
                onAction={handleOpenAdd}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Subscription</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Amount & Frequency</th>
                    <th className="px-6 py-3.5">Yearly Cost</th>
                    <th className="px-6 py-3.5">Next Renewal</th>
                    <th className="px-6 py-3.5">Payment Method</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSubs.map((sub) => {
                    const daysInfo = getDaysUntil(sub.nextBillingDate);
                    const yearly = calculateAnnualEquivalent(sub.amount, sub.billingFrequency);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{sub.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {sub.serviceProvider} {sub.accountNickname ? `• ${sub.accountNickname}` : ''}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                            {sub.category}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-white">
                            {formatCurrency(sub.amount, currency)}
                          </div>
                          <div className="text-[11px] text-slate-400 capitalize">
                            /{sub.billingFrequency}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-300">
                          {formatCurrency(yearly, currency)}/yr
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-white">
                            {formatDate(sub.nextBillingDate)}
                          </div>
                          <div
                            className={`text-[11px] font-medium ${
                              daysInfo.isUrgent ? 'text-amber-400 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {daysInfo.label}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          <div className="max-w-[140px] truncate" title={sub.paymentMethodName}>
                            {sub.paymentMethodName || 'Direct Auto-Debit'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(sub.status)} size="sm">
                            {sub.status.toUpperCase()}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Cancellation instructions guide button */}
                            <button
                              onClick={() => setCancellationModalSub(sub)}
                              title="Cancellation instructions & link"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              title="Edit subscription"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-primary transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(sub.id, sub.name)}
                              title="Delete subscription"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSub ? 'Edit Subscription' : 'Add New Subscription'}
          subtitle="Configure billing frequency, recurring amount, payment instrument, and cancellation details"
          maxWidth="xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Subscription Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Netflix 4K, Spotify Family"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Service Provider</label>
                <input
                  type="text"
                  value={formData.serviceProvider}
                  onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                  placeholder="e.g. Netflix Inc, OpenAI"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as SubscriptionCategory })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Billing Frequency</label>
                <select
                  value={formData.billingFrequency}
                  onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value as BillingFrequency })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  {ALL_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Next Billing Date *</label>
                <input
                  type="date"
                  required
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Payment Instrument</label>
                <input
                  type="text"
                  value={formData.paymentMethodName}
                  onChange={(e) => setFormData({ ...formData, paymentMethodName: e.target.value })}
                  placeholder="e.g. HDFC Credit Card (•••• 8821), GPay UPI"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Account Nickname</label>
                <input
                  type="text"
                  value={formData.accountNickname}
                  onChange={(e) => setFormData({ ...formData, accountNickname: e.target.value })}
                  placeholder="e.g. Personal, Family, Work"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Cancellation Portal URL</label>
              <input
                type="url"
                value={formData.cancellationUrl}
                onChange={(e) => setFormData({ ...formData, cancellationUrl: e.target.value })}
                placeholder="https://service.com/account/cancel"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Cancellation Instructions & Notes</label>
              <textarea
                rows={2}
                value={formData.cancellationInstructions}
                onChange={(e) => setFormData({ ...formData, cancellationInstructions: e.target.value })}
                placeholder="Steps to cancel or disable mandate in UPI app or web settings..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
              >
                {editingSub ? 'Save Changes' : 'Create Subscription'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Cancellation Guide Modal */}
        {cancellationModalSub && (
          <Modal
            isOpen={!!cancellationModalSub}
            onClose={() => setCancellationModalSub(null)}
            title={`Cancellation Guide: ${cancellationModalSub.name}`}
            subtitle="Verified steps to terminate recurring debits or revoke mandates"
            maxWidth="md"
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-3.5 text-xs text-amber-200">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Mandate Cancellation Notice
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-300/90">
                  Per RBI regulations, if this subscription is linked to a UPI AutoPay or e-Mandate,
                  you can also revoke the mandate directly from your bank or UPI app (PhonePe, Google
                  Pay, BHIM) at no cost.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  Direct Instructions:
                </h5>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed bg-slate-900/70 rounded-lg p-3 border border-slate-800">
                  {cancellationModalSub.cancellationInstructions ||
                    'Visit the service portal settings page and select "Cancel Subscription" or "Manage Plan".'}
                </p>
              </div>

              {cancellationModalSub.cancellationUrl && (
                <div>
                  <a
                    href={cancellationModalSub.cancellationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition shadow"
                  >
                    <span>Open Provider Cancellation Page</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
