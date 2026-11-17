// ==============================================================================
// SubSentry AI - Formatting Utilities
// High-precision formatting for Indian Currency (INR ₹) & International Standards
// ==============================================================================

import { CurrencyCode } from '../types';
import { format, differenceInDays, isPast, isToday } from 'date-fns';

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  showDecimals: boolean = false
): string {
  const symbolMap: Record<CurrencyCode, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = symbolMap[currency] || '₹';

  if (currency === 'INR') {
    // Format using Indian Numbering System (Lakhs, Crores)
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    }).format(amount);
    return `${symbol}${formatted}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function formatDate(dateString: string, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return format(d, formatStr);
  } catch {
    return dateString;
  }
}

export function getDaysUntil(dateString: string): {
  days: number;
  label: string;
  isUrgent: boolean;
  isOverdue: boolean;
} {
  if (!dateString) {
    return { days: 999, label: 'No date', isUrgent: false, isOverdue: false };
  }

  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = differenceInDays(target, now);

  if (isToday(target)) {
    return { days: 0, label: 'Today', isUrgent: true, isOverdue: false };
  }

  if (diff < 0) {
    return { days: Math.abs(diff), label: `${Math.abs(diff)}d overdue`, isUrgent: true, isOverdue: true };
  }

  if (diff === 1) {
    return { days: 1, label: 'Tomorrow', isUrgent: true, isOverdue: false };
  }

  return {
    days: diff,
    label: `In ${diff} days`,
    isUrgent: diff <= 3,
    isOverdue: false
  };
}

export function maskMandateRef(ref: string): string {
  if (!ref) return 'MND-***-XXXX';
  if (ref.length <= 8) return ref;
  const start = ref.slice(0, 4);
  const end = ref.slice(-4);
  return `${start}•••${end}`;
}
