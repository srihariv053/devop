'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bell
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { db } from '@/lib/storage/db';
import { Subscription, Mandate, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils/formatters';

interface CalendarEventItem {
  id: string;
  name: string;
  dateStr: string;
  amount: number;
  type: 'subscription' | 'mandate' | 'trial';
  source: string;
  category: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEventItem[]>([]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());

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
    setCurrency(db.getCurrency());
  };

  // Build list of calendar events
  const allEvents: CalendarEventItem[] = [];

  subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .forEach((s) => {
      allEvents.push({
        id: s.id,
        name: s.name,
        dateStr: s.nextBillingDate,
        amount: s.amount,
        type: s.status === 'trial' ? 'trial' : 'subscription',
        source: s.paymentMethodName || 'Direct Card',
        category: s.category
      });
    });

  mandates
    .filter((m) => m.status === 'active' && m.nextExpectedDebit)
    .forEach((m) => {
      // Avoid duplicate display if already mapped
      const alreadyIncluded = allEvents.some(
        (e) => e.name.toLowerCase().includes(m.merchantName.toLowerCase())
      );
      if (!alreadyIncluded) {
        allEvents.push({
          id: m.id,
          name: m.merchantName,
          dateStr: m.nextExpectedDebit!,
          amount: m.amountLimit,
          type: 'mandate',
          source: m.paymentSource,
          category: 'Finance'
        });
      }
    });

  // Filter events
  const filteredEvents = allEvents.filter((e) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'TRIAL') return e.type === 'trial';
    if (selectedFilter === 'MANDATE') return e.type === 'mandate';
    if (selectedFilter === 'SUBSCRIPTION') return e.type === 'subscription';
    return true;
  });

  // Monthly Calendar math
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter((e) => {
      try {
        const eventDate = parseISO(e.dateStr);
        return isSameDay(eventDate, date);
      } catch {
        return false;
      }
    });
  };

  // Next 14 days chronological timeline
  const timelineEvents = [...filteredEvents]
    .map((e) => ({
      ...e,
      daysInfo: getDaysUntil(e.dateStr)
    }))
    .sort((a, b) => a.daysInfo.days - b.daysInfo.days)
    .slice(0, 8);

  return (
    <Shell
      title="Upcoming Payment Calendar & Timeline"
      subtitle="Track upcoming renewals, auto-debit executions, trial expiries, and reminders"
    >
      <div className="space-y-6">
        {/* Reminder Settings Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-800 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Active Reminder Windows</span>
              <p className="text-[11px] text-slate-400">
                Configured notifications: 7 Days Prior • 3 Days Prior • 1 Day Prior • On Debit Date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'SUBSCRIPTION', 'MANDATE', 'TRIAL'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedFilter === f
                    ? 'bg-primary text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All Events' : f === 'TRIAL' ? 'Free Trials' : `${f.charAt(0) + f.slice(1).toLowerCase()}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Monthly Calendar + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-surface p-6 shadow-sm">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days Grid */}
            <div className="mt-2 grid grid-cols-7 gap-1">
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const hasEvents = dayEvents.length > 0;
                const isSelected = isSameDay(day, activeDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setActiveDate(day);
                      setSelectedDateEvents(dayEvents);
                    }}
                    className={`min-h-[72px] rounded-xl p-2 text-left transition flex flex-col justify-between border ${
                      isSelected
                        ? 'border-primary bg-primary/15'
                        : isTodayDate
                        ? 'border-slate-600 bg-slate-800/50'
                        : 'border-slate-800/50 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isTodayDate ? 'text-primary' : 'text-slate-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {hasEvents && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>

                    {hasEvents && (
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight ${
                              ev.type === 'trial'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                : ev.type === 'mandate'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                                : 'bg-primary/20 text-primary-200 border border-primary/30'
                            }`}
                            title={`${ev.name} (${formatCurrency(ev.amount, currency)})`}
                          >
                            {ev.name}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[8px] text-slate-400 pl-1 font-bold">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline View & Day Inspector */}
          <div className="space-y-6">
            {/* Selected Date Inspector */}
            <div className="rounded-2xl border border-slate-800 bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">
                  Debits on {format(activeDate, 'dd MMM yyyy')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {getEventsForDay(activeDate).length} event(s)
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {getEventsForDay(activeDate).length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No debits scheduled for this day.
                  </p>
                ) : (
                  getEventsForDay(activeDate).map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{ev.name}</span>
                        <span className="text-primary font-bold">
                          {formatCurrency(ev.amount, currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{ev.source}</span>
                        <span className="capitalize">{ev.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chronological Next Due Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-secondary" />
                  Next Due (Chronological)
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-800/80">
                {timelineEvents.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.type === 'trial' && (
                          <Badge variant="warning" size="sm">Trial Expiry</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.source}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white">
                        {formatCurrency(item.amount, currency)}
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          item.daysInfo.isUrgent ? 'text-amber-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {item.daysInfo.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
