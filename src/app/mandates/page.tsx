'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  ExternalLink,
  Info,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  Download,
  Building2,
  Smartphone,
  ShieldAlert
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { db } from '@/lib/storage/db';
import { Mandate, MandateType, MandateStatus, CurrencyCode, BillingFrequency } from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil, maskMandateRef } from '@/lib/utils/formatters';
import { exportMandatesCsv } from '@/lib/utils/exportUtils';

const MANDATE_TYPES: { type: MandateType; label: string; icon: any }[] = [
  { type: 'upi_autopay', label: 'UPI AutoPay (GPay/PhonePe)', icon: Smartphone },
  { type: 'credit_card_si', label: 'Credit Card Standing Instruction', icon: CreditCard },
  { type: 'debit_card_si', label: 'Debit Card Recurring (SI)', icon: CreditCard },
  { type: 'bank_si', label: 'Bank Standing Instruction (Direct Debit)', icon: Building2 },
  { type: 'emi', label: 'Loan / EMI Auto-Debit', icon: Building2 },
  { type: 'insurance', label: 'Insurance Premium NACH/Mandate', icon: ShieldCheck },
  { type: 'utility_autopay', label: 'Broadband / Utility Bill AutoPay', icon: Smartphone },
  { type: 'other', label: 'Other Recurring Mandate', icon: ShieldCheck }
];

export default function MandatesPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMandate, setEditingMandate] = useState<Mandate | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    merchantName: '',
    mandateRefMasked: '',
    mandateType: 'upi_autopay' as MandateType,
    amountLimit: 1500,
    frequency: 'monthly' as BillingFrequency | 'as_presented',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    nextExpectedDebit: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    paymentSource: 'HDFC Bank (•••• 4029)',
    status: 'active' as MandateStatus,
    userNotes: ''
  });

  useEffect(() => {
    db.initialize();
    loadMandates();

    const onUpdate = () => loadMandates();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadMandates = () => {
    setMandates(db.getMandates());
    setCurrency(db.getCurrency());
  };

  const handleOpenAdd = () => {
    setEditingMandate(null);
    setFormData({
      merchantName: '',
      mandateRefMasked: `MND-***-${Math.floor(1000 + Math.random() * 9000)}`,
      mandateType: 'upi_autopay',
      amountLimit: 1500,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      nextExpectedDebit: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      paymentSource: 'HDFC Bank (•••• 4029)',
      status: 'active',
      userNotes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mandate: Mandate) => {
    setEditingMandate(mandate);
    setFormData({
      merchantName: mandate.merchantName,
      mandateRefMasked: mandate.mandateRefMasked,
      mandateType: mandate.mandateType,
      amountLimit: mandate.amountLimit,
      frequency: mandate.frequency,
      startDate: mandate.startDate,
      expiryDate: mandate.expiryDate || '',
      nextExpectedDebit: mandate.nextExpectedDebit || '',
      paymentSource: mandate.paymentSource,
      status: mandate.status,
      userNotes: mandate.userNotes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove mandate record for ${name}?`)) {
      db.deleteMandate(id);
      loadMandates();
      window.dispatchEvent(new Event('subsentry_db_updated'));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchantName.trim() || formData.amountLimit <= 0) {
      alert('Please provide merchant name and debit limit.');
      return;
    }

    if (editingMandate) {
      db.updateMandate(editingMandate.id, formData);
    } else {
      db.addMandate(formData);
    }

    setIsModalOpen(false);
    loadMandates();
    window.dispatchEvent(new Event('subsentry_db_updated'));
  };

  const filteredMandates = mandates.filter((m) => {
    const matchSearch =
      m.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mandateRefMasked.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.paymentSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedType === 'ALL' || m.mandateType === selectedType;
    const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <Shell
      title="Auto-Debit Auditor & Mandates"
      subtitle="Monitor recurring bank mandates, UPI AutoPay limits, and standing instructions with zero credential risk"
    >
      <div className="space-y-6">
        {/* Compliance & Security Disclosure Banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  RBI Compliant Mandate Transparency & Account Aggregator Ready
                </h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-3xl">
                  SubSentry AI records and audits authorized recurring debit mandates manually and via
                  statement imports. <strong>We never collect or store banking passwords, OTPs, UPI PINs, or card CVVs.</strong> Future live bank sync is designed strictly via RBI-licensed Account Aggregators (Sahamati / Setu / OneMoney).
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-[11px] font-semibold text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Zero Credential Storage</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search, Filter & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mandates by merchant, masked ID, or source..."
              className="w-full rounded-lg border border-slate-700 bg-surface py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Mandate Types</option>
              {MANDATE_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>

            <button
              onClick={() => exportMandatesCsv(filteredMandates)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Mandates</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
            >
              <Plus className="h-4 w-4" />
              <span>Record Auto-Debit Mandate</span>
            </button>
          </div>
        </div>

        {/* Mandate Cards Grid */}
        {filteredMandates.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No auto-debit mandates found"
            description="Record your UPI AutoPay mandates or bank standing instructions to prevent unexpected debits."
            actionLabel="Record Mandate"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMandates.map((mandate) => {
              const daysInfo = mandate.nextExpectedDebit
                ? getDaysUntil(mandate.nextExpectedDebit)
                : null;
              const typeInfo =
                MANDATE_TYPES.find((t) => t.type === mandate.mandateType) || MANDATE_TYPES[0];
              const Icon = typeInfo.icon;

              return (
                <div
                  key={mandate.id}
                  className="rounded-xl border border-slate-800 bg-surface p-5 shadow-sm transition hover:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-slate-800 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {mandate.merchantName}
                          </h4>
                          <span className="text-[10px] text-slate-400">{typeInfo.label}</span>
                        </div>
                      </div>
                      <Badge
                        variant={mandate.status === 'active' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {mandate.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Debit Limit / Amount */}
                    <div className="mt-4 rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400">Debit Limit / Amount:</span>
                        <span className="text-base font-bold text-white">
                          {formatCurrency(mandate.amountLimit, currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Frequency:</span>
                        <span className="capitalize font-medium text-slate-300">
                          {mandate.frequency}
                        </span>
                      </div>
                    </div>

                    {/* Details List */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Masked Mandate URN:</span>
                        <span className="font-mono text-slate-300 text-[11px]">
                          {maskMandateRef(mandate.mandateRefMasked)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Payment Source:</span>
                        <span className="font-medium text-slate-300">{mandate.paymentSource}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Next Expected Debit:</span>
                        <span className="font-medium text-white">
                          {mandate.nextExpectedDebit
                            ? `${formatDate(mandate.nextExpectedDebit, 'dd MMM yyyy')} (${daysInfo?.label})`
                            : 'As presented'}
                        </span>
                      </div>

                      {mandate.userNotes && (
                        <p className="mt-2 text-[11px] text-slate-400 italic bg-slate-800/30 p-2 rounded">
                          "{mandate.userNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Created {formatDate(mandate.startDate, 'dd MMM yyyy')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(mandate)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-primary transition"
                        title="Edit mandate"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mandate.id, mandate.merchantName)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                        title="Delete mandate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingMandate ? 'Edit Auto-Debit Mandate' : 'Record Auto-Debit Mandate'}
          subtitle="Keep a verified log of authorized bank standing instructions and UPI AutoPay limits"
          maxWidth="lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">Merchant / Beneficiary Name *</label>
              <input
                type="text"
                required
                value={formData.merchantName}
                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                placeholder="e.g. Google Pay UPI - Spotify, HDFC Home Loan EMI"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Mandate Type</label>
                <select
                  value={formData.mandateType}
                  onChange={(e) => setFormData({ ...formData, mandateType: e.target.value as MandateType })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  {MANDATE_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Masked Reference / UMN</label>
                <input
                  type="text"
                  value={formData.mandateRefMasked}
                  onChange={(e) => setFormData({ ...formData, mandateRefMasked: e.target.value })}
                  placeholder="e.g. MND-***-8821 or UMN: 40291"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Debit Cap / Limit ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amountLimit}
                  onChange={(e) => setFormData({ ...formData, amountLimit: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annually">Annually</option>
                  <option value="as_presented">As Presented (Variable)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Payment Source (Bank A/C or Card)</label>
                <input
                  type="text"
                  value={formData.paymentSource}
                  onChange={(e) => setFormData({ ...formData, paymentSource: e.target.value })}
                  placeholder="e.g. HDFC Salary A/C (•••• 4029)"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Next Expected Debit Date</label>
                <input
                  type="date"
                  value={formData.nextExpectedDebit}
                  onChange={(e) => setFormData({ ...formData, nextExpectedDebit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Notes & Purpose</label>
              <textarea
                rows={2}
                value={formData.userNotes}
                onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
                placeholder="e.g. Mandate created for 1Gbps Fiber connection, can be revoked in PhonePe"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
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
                {editingMandate ? 'Save Changes' : 'Record Mandate'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
