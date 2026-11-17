// ==============================================================================
// SubSentry AI - Savings Analyzer & Expenditure Engine
// Pure deterministic calculations for financial truth & savings opportunities
// ==============================================================================

import { Subscription, Mandate, DuplicateGroup, SavingsAuditSummary, SubscriptionCategory } from '../types';

export function calculateMonthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'quarterly':
      return amount / 3;
    case 'half-yearly':
      return amount / 6;
    case 'annually':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
}

export function calculateAnnualEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'half-yearly':
      return amount * 2;
    case 'annually':
    default:
      return amount;
  }
}

export function computeSavingsSummary(
  subscriptions: Subscription[],
  mandates: Mandate[],
  duplicates: DuplicateGroup[]
): SavingsAuditSummary {
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial'
  );

  let totalMonthlySpend = 0;
  let topExpensiveSub: { name: string; amount: number } | null = null;
  let maxMonthlyRate = 0;

  for (const sub of activeSubs) {
    const monthlyRate = calculateMonthlyEquivalent(sub.amount, sub.billingFrequency);
    totalMonthlySpend += monthlyRate;

    if (monthlyRate > maxMonthlyRate) {
      maxMonthlyRate = monthlyRate;
      topExpensiveSub = { name: sub.name, amount: Math.round(monthlyRate) };
    }
  }

  // Include fixed recurring mandates (e.g. broadband, gym, insurance)
  const activeMandates = mandates.filter((m) => m.status === 'active');
  for (const mandate of activeMandates) {
    // Only add mandates that aren't already represented in subscriptions to avoid double counting
    const alreadyTracked = activeSubs.some(
      (s) => s.name.toLowerCase().includes(mandate.merchantName.toLowerCase())
    );
    if (!alreadyTracked && mandate.amountLimit > 0) {
      const mandateMonthly = calculateMonthlyEquivalent(mandate.amountLimit, mandate.frequency);
      totalMonthlySpend += mandateMonthly;
    }
  }

  // Potential duplicate waste monthly
  const duplicateWasteMonthly = duplicates.reduce((acc, d) => acc + d.totalMonthlyWaste, 0);

  // Unused or idle subscription estimate:
  // e.g., Subscriptions in trial ending soon or user marked low-engagement / paused
  const trialSubs = subscriptions.filter((s) => s.status === 'trial');
  const trialWasteMonthly = trialSubs.reduce(
    (acc, s) => acc + calculateMonthlyEquivalent(s.amount, s.billingFrequency),
    0
  );

  const potentialMonthlySavings = Math.round(duplicateWasteMonthly + trialWasteMonthly);
  const potentialAnnualSavings = Math.round(potentialMonthlySavings * 12);

  return {
    totalMonthlySpend: Math.round(totalMonthlySpend),
    totalAnnualSpend: Math.round(totalMonthlySpend * 12),
    potentialMonthlySavings,
    potentialAnnualSavings,
    duplicateWasteMonthly: Math.round(duplicateWasteMonthly),
    unusedOrIdleMonthly: Math.round(trialWasteMonthly),
    topExpensiveSubscription: topExpensiveSub,
    activeCount: activeSubs.length,
    mandateCount: activeMandates.length
  };
}

export function computeCategorySpending(
  subscriptions: Subscription[]
): { category: SubscriptionCategory; monthlyAmount: number; percentage: number }[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
  const totals: { [key in SubscriptionCategory]?: number } = {};
  let overall = 0;

  for (const sub of activeSubs) {
    const monthly = calculateMonthlyEquivalent(sub.amount, sub.billingFrequency);
    totals[sub.category] = (totals[sub.category] || 0) + monthly;
    overall += monthly;
  }

  if (overall === 0) return [];

  const result = Object.entries(totals).map(([category, amount]) => ({
    category: category as SubscriptionCategory,
    monthlyAmount: Math.round(amount!),
    percentage: Math.round(((amount || 0) / overall) * 100)
  }));

  return result.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}
