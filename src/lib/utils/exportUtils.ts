// ==============================================================================
// SubSentry AI - Export Utilities
// CSV Exporter and Report Exporter
// ==============================================================================

import Papa from 'papaparse';
import { Subscription, Mandate, Transaction, RecurringDetection } from '../types';

export function exportToCsv(data: any[], filename: string): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSubscriptionsCsv(subscriptions: Subscription[]): void {
  const formatted = subscriptions.map((s) => ({
    'Subscription Name': s.name,
    'Service Provider': s.serviceProvider,
    'Category': s.category,
    'Amount': s.amount,
    'Currency': s.currency,
    'Billing Frequency': s.billingFrequency,
    'Next Billing Date': s.nextBillingDate,
    'Payment Method': s.paymentMethodName || 'Not specified',
    'Account Nickname': s.accountNickname || 'Personal',
    'Status': s.status,
    'Trial End Date': s.trialEndDate || 'N/A',
    'Cancellation Link': s.cancellationUrl || 'N/A'
  }));

  exportToCsv(formatted, 'SubSentry_Subscriptions');
}

export function exportMandatesCsv(mandates: Mandate[]): void {
  const formatted = mandates.map((m) => ({
    'Merchant Name': m.merchantName,
    'Mandate Type': m.mandateType,
    'Masked Reference': m.mandateRefMasked,
    'Debit Limit / Amount': m.amountLimit,
    'Frequency': m.frequency,
    'Start Date': m.startDate,
    'Expiry Date': m.expiryDate || 'Perpetual',
    'Next Debit Date': m.nextExpectedDebit || 'As Presented',
    'Payment Source': m.paymentSource,
    'Status': m.status
  }));

  exportToCsv(formatted, 'SubSentry_AutoDebits_Mandates');
}

export function exportTransactionsCsv(transactions: Transaction[]): void {
  const formatted = transactions.map((t) => ({
    'Transaction Date': t.transactionDate,
    'Raw Description': t.rawDescription,
    'Normalized Merchant': t.normalizedMerchant,
    'Amount': t.amount,
    'Currency': t.currency,
    'Type': t.transactionType,
    'Category': t.category,
    'Payment Method / Bank': t.paymentMethod,
    'Statement Source': t.statementSource
  }));

  exportToCsv(formatted, 'SubSentry_Transactions');
}

export function exportDetectionsCsv(detections: RecurringDetection[]): void {
  const formatted = detections.map((d) => ({
    'Merchant': d.merchantName,
    'Category': d.suggestedCategory,
    'Detected Amount': d.detectedAmount,
    'Currency': d.currency,
    'Suggested Frequency': d.suggestedFrequency,
    'Confidence Score': d.confidenceScore,
    'Confidence Percentage': `${d.confidencePercentage}%`,
    'Status': d.status,
    'Reason': d.reason,
    'Last Detected Date': d.lastDetectedDate
  }));

  exportToCsv(formatted, 'SubSentry_Recurring_Audit');
}
