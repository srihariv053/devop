'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Globe,
  Bell,
  ShieldCheck,
  Building2,
  Lock,
  RefreshCw,
  Save,
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { db } from '@/lib/storage/db';
import { UserProfile, CurrencyCode } from '@/lib/types';
import { SEED_PROFILE } from '@/lib/storage/seedData';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(SEED_PROFILE);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [reminders, setReminders] = useState({
    d7: true,
    d3: true,
    d1: true,
    d0: true
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    db.initialize();
    setProfile(db.getProfile());
    setCurrency(db.getCurrency());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateProfile(profile);
    db.setCurrency(currency);
    setSaveSuccess(true);
    window.dispatchEvent(new Event('subsentry_db_updated'));
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to restore default demonstration data?')) {
      db.resetToDefaults();
      setProfile(db.getProfile());
      setCurrency(db.getCurrency());
      window.dispatchEvent(new Event('subsentry_db_updated'));
      alert('Data reset to demonstration seed defaults.');
    }
  };

  return (
    <Shell
      title="Settings & Financial Preferences"
      subtitle="Configure profile parameters, notification triggers, currency formats, and security policies"
    >
      <div className="max-w-4xl space-y-8">
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        {/* Profile & Currency Form */}
        <div className="rounded-2xl border border-slate-800 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              User Profile & Default Currency
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Monthly Budget Cap ({currency})
                </label>
                <input
                  type="number"
                  value={profile.monthlyBudget}
                  onChange={(e) =>
                    setProfile({ ...profile, monthlyBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Reminder Configuration */}
        <div className="rounded-2xl border border-slate-800 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Bell className="h-5 w-5 text-secondary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Auto-Debit & Renewal Reminders
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { id: 'd7', label: 'Send reminder 7 days before auto-debit' },
              { id: 'd3', label: 'Send reminder 3 days before auto-debit' },
              { id: 'd1', label: 'Send urgent reminder 1 day before debit' },
              { id: 'd0', label: 'Notify on the morning of payment execution' }
            ].map((r) => (
              <label key={r.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(reminders as any)[r.id]}
                  onChange={(e) => setReminders({ ...reminders, [r.id]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-0"
                />
                <span className="text-xs text-slate-300">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* RBI Account Aggregator Framework Disclosure */}
        <div className="rounded-2xl border border-slate-800 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Bank Integration Architecture (Account Aggregator)
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              In accordance with RBI data security regulations, SubSentry AI operates on an
              explicit <strong>Zero Credential Policy</strong>. We do not support screenscraping or
              collecting net banking passwords or OTPs.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-200">Supported Ingestion Methods:</div>
              <div>• Manual entry with guided mandate references</div>
              <div>• Local CSV statement imports (HDFC, ICICI, SBI, Axis, and Generic format)</div>
              <div>
                • Future Live Sync: Authorized API connection via RBI Account Aggregators (Sahamati / Setu / OneMoney)
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="rounded-2xl border border-rose-900/40 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-rose-900/30 pb-4">
            <Trash2 className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
              Data Management & Demo Sandbox
            </h3>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">Reset Demo Environment</div>
              <p className="text-[11px] text-slate-400">
                Restore sample Indian subscriptions, UPI AutoPay mandates, and statements back to original state.
              </p>
            </div>

            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
