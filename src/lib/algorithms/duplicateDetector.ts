// ==============================================================================
// SubSentry AI - Duplicate Subscription Detector
// Identifies overlapping, redundant, and multi-instrument recurring commitments
// ==============================================================================

import { Subscription, DuplicateGroup } from '../types';
import { normalizeMerchant } from './merchantNormalizer';

export function detectDuplicates(subscriptions: Subscription[]): DuplicateGroup[] {
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial'
  );

  const groups: { [key: string]: Subscription[] } = {};

  for (const sub of activeSubs) {
    const norm = normalizeMerchant(sub.name).normalizedName.toLowerCase();
    if (!groups[norm]) {
      groups[norm] = [];
    }
    groups[norm].push(sub);
  }

  const duplicates: DuplicateGroup[] = [];

  // 1. Exact merchant match across multiple entries (e.g. 2 Netflix accounts or 2 Spotify plans)
  for (const [normKey, subList] of Object.entries(groups)) {
    if (subList.length > 1) {
      // Calculate monthly waste: sum of all except the lowest-cost base one
      const sortedByAmount = [...subList].sort((a, b) => a.amount - b.amount);
      const redundant = sortedByAmount.slice(1);
      const monthlyWaste = redundant.reduce((sum, s) => {
        if (s.billingFrequency === 'annually') return sum + s.amount / 12;
        if (s.billingFrequency === 'quarterly') return sum + s.amount / 3;
        return sum + s.amount;
      }, 0);

      const paymentMethods = Array.from(new Set(subList.map((s) => s.paymentMethodName || 'Unknown')));
      const reason = paymentMethods.length > 1
        ? `Identified multiple active subscriptions for ${subList[0].serviceProvider || subList[0].name} billed on different instruments (${paymentMethods.join(', ')}).`
        : `Identified ${subList.length} active subscriptions for ${subList[0].serviceProvider || subList[0].name}.`;

      duplicates.push({
        id: `dup-${Math.random().toString(36).substring(2, 9)}`,
        merchantNormalized: subList[0].name,
        reason,
        totalMonthlyWaste: Math.round(monthlyWaste),
        subscriptions: subList
      });
    }
  }

  // 2. Overlapping category duplicates (e.g., Multiple Music apps like Spotify + Apple Music simultaneously, or Swiggy One + Zomato Gold)
  const categoryGroups: { [key: string]: Subscription[] } = {};
  for (const sub of activeSubs) {
    if (sub.category === 'Music' || sub.category === 'Cloud storage') {
      if (!categoryGroups[sub.category]) categoryGroups[sub.category] = [];
      categoryGroups[sub.category].push(sub);
    }
  }

  for (const [category, catSubs] of Object.entries(categoryGroups)) {
    // Only if they are distinct merchants
    const distinctMerchants = new Set(catSubs.map((s) => normalizeMerchant(s.name).normalizedName));
    if (distinctMerchants.size > 1 && catSubs.length > 1) {
      // Check if we haven't already flagged them in merchant group
      const alreadyFlagged = duplicates.some((d) =>
        catSubs.some((s) => d.subscriptions.some((ds) => ds.id === s.id))
      );

      if (!alreadyFlagged) {
        const sortedByAmount = [...catSubs].sort((a, b) => a.amount - b.amount);
        const cheapest = sortedByAmount[0];
        const secondary = sortedByAmount.slice(1);
        const monthlyWaste = secondary.reduce((sum, s) => {
          if (s.billingFrequency === 'annually') return sum + s.amount / 12;
          return sum + s.amount;
        }, 0);

        duplicates.push({
          id: `dup-cat-${Math.random().toString(36).substring(2, 9)}`,
          merchantNormalized: `${category} Overlap (${catSubs.map((s) => s.name).join(' & ')})`,
          reason: `You are paying for multiple competing ${category.toLowerCase()} services (${catSubs.map((s) => s.name).join(', ')}). Consolidating into one could save money.`,
          totalMonthlyWaste: Math.round(monthlyWaste),
          subscriptions: catSubs
        });
      }
    }
  }

  return duplicates;
}
