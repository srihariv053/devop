'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { db } from '@/lib/storage/db';
import { CurrencyCode, NotificationItem, UserProfile } from '@/lib/types';
import { SEED_PROFILE } from '@/lib/storage/seedData';

interface ShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ title, subtitle, children }) => {
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [profile, setProfile] = useState<UserProfile>(SEED_PROFILE);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState({
    duplicates: 0,
    priceAlerts: 0,
    pendingDetections: 0
  });

  const refreshState = () => {
    db.initialize();
    const curr = db.getCurrency();
    setCurrencyState(curr);
    setProfile(db.getProfile());
    setNotifications(db.getNotifications());

    const dups = db.getDuplicates();
    const prices = db.getPriceChanges().filter((p) => !p.acknowledged);
    const detections = db.getRecurringDetections().filter((d) => d.status === 'PENDING');

    setCounts({
      duplicates: dups.length,
      priceAlerts: prices.length,
      pendingDetections: detections.length
    });
  };

  useEffect(() => {
    refreshState();
    setMounted(true);

    const handleStorageUpdate = () => refreshState();
    window.addEventListener('subsentry_db_updated', handleStorageUpdate);
    return () => window.removeEventListener('subsentry_db_updated', handleStorageUpdate);
  }, []);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    db.setCurrency(newCurrency);
    setCurrencyState(newCurrency);
    window.dispatchEvent(new Event('subsentry_db_updated'));
  };

  const handleResetData = () => {
    if (confirm('Reset SubSentry demonstration data back to default initial state?')) {
      db.resetToDefaults();
      refreshState();
      window.dispatchEvent(new Event('subsentry_db_updated'));
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium">Loading SubSentry AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar counts={counts} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
          notifications={notifications}
          profile={profile}
          onResetData={handleResetData}
        />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};
