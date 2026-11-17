// ==============================================================================
// SubSentry AI - Recurring Detection Engine
// Pattern identification using interval mathematics, amount consistency, and merchant clustering
// ==============================================================================

import { Transaction, RecurringDetection, BillingFrequency, ConfidenceScore } from '../types';
import { normalizeMerchant } from './merchantNormalizer';

interface DetectionCandidateGroup {
  merchantKey: string;
  normalizedMerchant: string;
  transactions: Transaction[];
}

export function detectRecurringPatterns(
  transactions: Transaction[],
  userId: string
): RecurringDetection[] {
  // Only debits are considered for subscriptions/recurring outlays
  const debits = transactions.filter((t) => t.transactionType === 'debit' && t.amount > 0);

  // Group transactions by normalized merchant name
  const groups: { [key: string]: DetectionCandidateGroup } = {};

  for (const tx of debits) {
    const normalized = normalizeMerchant(tx.rawDescription || tx.normalizedMerchant);
    const key = normalized.normalizedName.toLowerCase();

    if (!groups[key]) {
      groups[key] = {
        merchantKey: key,
        normalizedMerchant: normalized.normalizedName,
        transactions: []
      };
    }
    groups[key].transactions.push(tx);
  }

  const detections: RecurringDetection[] = [];

  for (const group of Object.values(groups)) {
    // Sort chronologically
    const sortedTx = [...group.transactions].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    const normInfo = normalizeMerchant(group.normalizedMerchant);
    const count = sortedTx.length;

    // If only 1 transaction, check if it's an explicit known subscription merchant
    if (count === 1) {
      if (normInfo.isProbableSubscription) {
        const singleTx = sortedTx[0];
        detections.push({
          id: `det-${Math.random().toString(36).substring(2, 9)}`,
          userId,
          merchantName: group.normalizedMerchant,
          suggestedCategory: normInfo.category,
          detectedAmount: singleTx.amount,
          currency: singleTx.currency || 'INR',
          suggestedFrequency: 'monthly',
          confidenceScore: 'MEDIUM',
          confidencePercentage: 65,
          reason: `Matched known subscription service (${group.normalizedMerchant}) from single statement debit.`,
          matchedTransactionIds: [singleTx.id],
          matchedCount: 1,
          status: 'PENDING',
          lastDetectedDate: singleTx.transactionDate,
          averageIntervalDays: 30,
          createdAt: new Date().toISOString()
        });
      }
      continue;
    }

    // Multiple transactions: analyze intervals and amount consistency
    const intervals: number[] = [];
    for (let i = 1; i < count; i++) {
      const d1 = new Date(sortedTx[i - 1].transactionDate).getTime();
      const d2 = new Date(sortedTx[i].transactionDate).getTime();
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        intervals.push(diffDays);
      }
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((acc, curr) => acc + curr, 0) / intervals.length
      : 30;

    // Check amount variance
    const amounts = sortedTx.map((t) => t.amount);
    const avgAmount = amounts.reduce((acc, curr) => acc + curr, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    const isExactAmount = maxAmount === minAmount;
    const isCloseAmount = (maxAmount - minAmount) / avgAmount <= 0.15; // Within 15% (e.g. slight tax/FX fluctuation)

    // Detect frequency
    let frequency: BillingFrequency = 'monthly';
    let freqScore = 0;

    if (avgInterval >= 5 && avgInterval <= 9) {
      frequency = 'weekly';
      freqScore = 25;
    } else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'monthly';
      freqScore = 35;
    } else if (avgInterval >= 80 && avgInterval <= 100) {
      frequency = 'quarterly';
      freqScore = 30;
    } else if (avgInterval >= 170 && avgInterval <= 195) {
      frequency = 'half-yearly';
      freqScore = 25;
    } else if (avgInterval >= 340 && avgInterval <= 390) {
      frequency = 'annually';
      freqScore = 30;
    } else {
      frequency = 'monthly'; // default baseline
      freqScore = 15;
    }

    // Calculate confidence percentage
    let confidencePoints = 0;
    if (normInfo.isProbableSubscription) confidencePoints += 30;
    if (isExactAmount) confidencePoints += 35;
    else if (isCloseAmount) confidencePoints += 20;
    confidencePoints += freqScore;
    if (count >= 3) confidencePoints += 15;

    let confidenceScore: ConfidenceScore = 'LOW';
    if (confidencePoints >= 75) confidenceScore = 'HIGH';
    else if (confidencePoints >= 50) confidenceScore = 'MEDIUM';

    let reason = '';
    if (isExactAmount) {
      reason = `Recurring exact ₹${avgAmount.toFixed(2)} detected ${count} times (~${Math.round(avgInterval)} day intervals).`;
    } else if (isCloseAmount) {
      reason = `Consistent charges (~₹${avgAmount.toFixed(2)}) detected ${count} times with slight variance.`;
    } else {
      reason = `Repeated transactions at ${group.normalizedMerchant} over ${count} dates.`;
    }

    if (normInfo.isProbableSubscription) {
      reason += ` Confirmed known subscription merchant.`;
    }

    const latestTx = sortedTx[sortedTx.length - 1];

    detections.push({
      id: `det-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      merchantName: group.normalizedMerchant,
      suggestedCategory: normInfo.category,
      detectedAmount: latestTx.amount,
      currency: latestTx.currency || 'INR',
      suggestedFrequency: frequency,
      confidenceScore,
      confidencePercentage: Math.min(confidencePoints, 99),
      reason,
      matchedTransactionIds: sortedTx.map((t) => t.id),
      matchedCount: count,
      status: 'PENDING',
      lastDetectedDate: latestTx.transactionDate,
      averageIntervalDays: Math.round(avgInterval),
      createdAt: new Date().toISOString()
    });
  }

  // Sort descending by confidence score and amount
  return detections.sort((a, b) => b.confidencePercentage - a.confidencePercentage);
}
