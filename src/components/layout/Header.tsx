'use client';

import React, { useState } from 'react';
import { Bell, RefreshCw, ChevronDown, Check, Globe } from 'lucide-react';
import { CurrencyCode, NotificationItem, UserProfile } from '@/lib/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  notifications: NotificationItem[];
  profile: UserProfile;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currency,
  onCurrencyChange,
  notifications,
  profile,
  onResetData
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' }
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-surface/90 px-8 backdrop-blur-md">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Demo Mode Badge with Reset Action */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/40 px-2.5 py-1">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-slate-300">Live Demo</span>
          <button
            onClick={onResetData}
            title="Reset data to default demonstration state"
            className="ml-1 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600 transition"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{currency}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700 bg-surface p-1.5 shadow-xl z-50">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    onCurrencyChange(c.code);
                    setShowCurrencyMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    currency === c.code
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{c.symbol}</span>
                    <span>{c.code}</span>
                  </span>
                  {currency === c.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-700/80 bg-slate-800/60 p-2 text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700 bg-surface p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">Alerts & Reminders</span>
                <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
              </div>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No new alerts</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-lg border p-2.5 text-xs transition ${
                        notif.severity === 'danger'
                          ? 'border-rose-900/60 bg-rose-950/20 text-rose-200'
                          : notif.severity === 'warning'
                          ? 'border-amber-900/60 bg-amber-950/20 text-amber-200'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-white">{notif.title}</div>
                      <div className="mt-1 text-[11px] leading-tight text-slate-300">
                        {notif.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-xs font-bold text-white shadow-inner">
            {profile.fullName?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-white leading-tight">
              {profile.fullName || 'User'}
            </div>
            <div className="text-[10px] text-slate-400">{profile.timezone}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
