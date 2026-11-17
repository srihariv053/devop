// ==============================================================================
// SubSentry AI - Price Increase Detector
// Analyzes subscription history & transaction spikes
// ==============================================================================

import { Subscription, Transaction, PriceChangeAlert } from '../types';
import { normalizeMerchant } from './merchantNormalizer';

export function detectPriceIncreases(
  subscriptions: Subscription[],
  transactions: Transaction[]
): PriceChangeAlert[] {
  const alerts: PriceChangeAlert[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;

    // Find all debits matching this subscription's merchant
    const subNorm = normalizeMerchant(sub.name).normalizedName.toLowerCase();

    const matchingTx = transactions
      .filter((t) => {
        if (t.transactionType !== 'debit') return false;
        const txNorm = normalizeMerchant(t.rawDescription || t.normalizedMerchant).normalizedName.toLowerCase();
        return txNorm === subNorm;
      })
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    if (matchingTx.length >= 2) {
      const olderTx = matchingTx[matchingTx.length - 2];
      const latestTx = matchingTx[matchingTx.length - 1];

      // Check if price increased
      if (latestTx.amount > olderTx.amount) {
        const diff = latestTx.amount - olderTx.amount;
        const pct = Math.round((diff / olderTx.amount) * 100);

        // Filter out trivial fluctuations under 2%
        if (pct >= 2) {
          alerts.push({
            id: `alert-inc-${sub.id}-${latestTx.id}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            previousAmount: olderTx.amount,
            newAmount: latestTx.amount,
            difference: diff,
            percentageIncrease: pct,
            detectedDate: latestTx.transactionDate,
            acknowledged: false
          });
        }
      }
    } else if (matchingTx.length === 1) {
      // Compare transaction with registered subscription amount
      const latestTx = matchingTx[0];
      if (latestTx.amount > sub.amount) {
        const diff = latestTx.amount - sub.amount;
        const pct = Math.round((diff / sub.amount) * 100);
        if (pct >= 2) {
          alerts.push({
            id: `alert-inc-${sub.id}-${latestTx.id}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            previousAmount: sub.amount,
            newAmount: latestTx.amount,
            difference: diff,
            percentageIncrease: pct,
            detectedDate: latestTx.transactionDate,
            acknowledged: false
          });
        }
      }
    }
  }

  return alerts;
}
