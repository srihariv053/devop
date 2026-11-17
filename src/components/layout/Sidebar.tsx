'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  Receipt,
  ScanLine,
  Calendar,
  Sparkles,
  CopyX,
  TrendingUp,
  PiggyBank,
  FileBarChart,
  Settings,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  counts?: {
    duplicates: number;
    priceAlerts: number;
    pendingDetections: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ counts }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { label: 'Auto-Debit Auditor', href: '/mandates', icon: ShieldCheck },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    {
      label: 'Recurring Detection',
      href: '/recurring',
      icon: ScanLine,
      badge: counts?.pendingDetections ? `${counts.pendingDetections}` : undefined,
      badgeVariant: 'bg-primary text-white'
    },
    { label: 'Payment Calendar', href: '/calendar', icon: Calendar },
    {
      label: 'AI Insights',
      href: '/ai-insights',
      icon: Sparkles,
      badge: 'AI',
      badgeVariant: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
    },
    {
      label: 'Duplicates',
      href: '/duplicates',
      icon: CopyX,
      badge: counts?.duplicates ? `${counts.duplicates}` : undefined,
      badgeVariant: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      label: 'Price Alerts',
      href: '/price-alerts',
      icon: TrendingUp,
      badge: counts?.priceAlerts ? `${counts.priceAlerts}` : undefined,
      badgeVariant: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    },
    { label: 'Savings Analyzer', href: '/savings', icon: PiggyBank },
    { label: 'Reports & Export', href: '/reports', icon: FileBarChart },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-surface">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">SubSentry</span>
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              AI
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Recurring & Mandate Auditor</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${item.badgeVariant}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Indian Fintech Compliance & Security Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg border border-slate-800 bg-background/50 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">RBI e-Mandate Aware</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            UPI AutoPay & Card Mandates monitored securely without storing bank credentials.
          </p>
        </div>
      </div>
    </aside>
  );
};
