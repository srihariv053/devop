// ==============================================================================
// SubSentry AI - SubSentry Intelligence AI Engine
// Powered by Gemini API with strict deterministic financial grounding & local heuristic fallback
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, Mandate, Transaction, DuplicateGroup, PriceChangeAlert } from '@/lib/types';
import { calculateMonthlyEquivalent } from '@/lib/algorithms/savingsCalculator';

interface AiAuditPayload {
  prompt: string;
  subscriptions: Subscription[];
  mandates: Mandate[];
  transactions: Transaction[];
  duplicates: DuplicateGroup[];
  priceAlerts: PriceChangeAlert[];
  currency?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AiAuditPayload = await req.json();
    const { prompt, subscriptions, mandates, transactions, duplicates, priceAlerts, currency = 'INR' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Compute Deterministic Totals to Ground AI
    const activeSubs = (subscriptions || []).filter((s) => s.status === 'active' || s.status === 'trial');
    const totalMonthlySpend = activeSubs.reduce(
      (sum, s) => sum + calculateMonthlyEquivalent(s.amount, s.billingFrequency),
      0
    );
    const totalAnnualSpend = totalMonthlySpend * 12;

    const duplicateWasteMonthly = (duplicates || []).reduce((sum, d) => sum + d.totalMonthlyWaste, 0);

    const sortedSubs = [...activeSubs].sort(
      (a, b) =>
        calculateMonthlyEquivalent(b.amount, b.billingFrequency) -
        calculateMonthlyEquivalent(a.amount, a.billingFrequency)
    );

    const top3 = sortedSubs.slice(0, 3).map((s) => ({
      name: s.name,
      monthly: Math.round(calculateMonthlyEquivalent(s.amount, s.billingFrequency)),
      frequency: s.billingFrequency
    }));

    const upcoming7Days = activeSubs.filter((s) => {
      const diff = (new Date(s.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    });

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Call Gemini API
      try {
        const systemPrompt = `You are "SubSentry Intelligence", an expert personal financial auditor specializing in subscription optimization, auto-debits, and UPI AutoPay/mandate audit.
CRITICAL RULES:
1. Always base all figures strictly on the verified financial context provided below. DO NOT invent fake numbers or merchants.
2. Deterministic Financial Truth:
   - Currency: ${currency}
   - Active Subscriptions: ${activeSubs.length}
   - Total Monthly Commitment: ${currency} ${Math.round(totalMonthlySpend)}
   - Total Annual Recurring: ${currency} ${Math.round(totalAnnualSpend)}
   - Top Cost Drivers: ${top3.map((s) => `${s.name} (${currency} ${s.monthly}/mo)`).join(', ')}
   - Identified Duplicate Waste: ${currency} ${Math.round(duplicateWasteMonthly)}/month
   - Active Auto-Debit Mandates: ${(mandates || []).length}
   - Detected Price Hikes: ${(priceAlerts || []).map((p) => `${p.subscriptionName} (+${p.percentageIncrease}%, +${currency} ${p.difference})`).join(', ') || 'None'}
3. Provide crisp, professional, actionable fintech advice in clean markdown.`;

        const userMessage = `User question: "${prompt}"

Verified Context:
Active Subscriptions List: ${JSON.stringify(
          activeSubs.map((s) => ({
            name: s.name,
            amount: s.amount,
            freq: s.billingFrequency,
            next: s.nextBillingDate,
            category: s.category
          }))
        )}
Mandates: ${JSON.stringify(
          (mandates || []).map((m) => ({
            merchant: m.merchantName,
            type: m.mandateType,
            limit: m.amountLimit,
            next: m.nextExpectedDebit
          }))
        )}
Duplicates: ${JSON.stringify((duplicates || []).map((d) => ({ name: d.merchantNormalized, waste: d.totalMonthlyWaste, reason: d.reason })))}
Price Alerts: ${JSON.stringify(priceAlerts || [])}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: userMessage }
                  ]
                }
              ]
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({ reply: replyText, source: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local heuristic intelligence:', err);
      }
    }

    // High-Precision Local Heuristic Engine Fallback
    const localReply = generateDeterministicInsight(prompt.toLowerCase(), {
      currency,
      activeSubs,
      totalMonthlySpend: Math.round(totalMonthlySpend),
      totalAnnualSpend: Math.round(totalAnnualSpend),
      duplicateWasteMonthly: Math.round(duplicateWasteMonthly),
      top3,
      upcoming7Days,
      duplicates: duplicates || [],
      priceAlerts: priceAlerts || [],
      mandates: mandates || []
    });

    return NextResponse.json({ reply: localReply, source: 'local_intelligence' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function generateDeterministicInsight(query: string, data: any): string {
  const {
    currency,
    activeSubs,
    totalMonthlySpend,
    totalAnnualSpend,
    duplicateWasteMonthly,
    top3,
    upcoming7Days,
    duplicates,
    priceAlerts,
    mandates
  } = data;

  const sym = currency === 'INR' ? '₹' : '$';

  if (query.includes('analyze') || query.includes('overview') || query.includes('where is my money')) {
    return `### 🔍 Executive Recurring Expense Audit

Here is a verified breakdown of your recurring financial commitments:

- **Total Monthly Outlay:** **${sym}${totalMonthlySpend.toLocaleString('en-IN')}**
- **Annual Run Rate:** **${sym}${totalAnnualSpend.toLocaleString('en-IN')}** across **${activeSubs.length} active subscriptions** and **${mandates.length} auto-debit mandates**.
- **Identified Potential Savings:** **${sym}${(duplicateWasteMonthly * 12).toLocaleString('en-IN')}/year** by eliminating redundant duplicate services.

#### 🏆 Top 3 Monthly Cost Drivers:
${top3.map((s: any, idx: number) => `${idx + 1}. **${s.name}**: ${sym}${s.monthly.toLocaleString('en-IN')}/mo (${s.frequency})`).join('\n')}

${duplicates.length > 0 ? `> ⚠️ **Duplicate Warning:** We found **${duplicates.length} duplicate group(s)** currently leaking **${sym}${duplicateWasteMonthly.toLocaleString('en-IN')}/month**.` : ''}

${priceAlerts.length > 0 ? `> 📈 **Price Increase Alert:** ${priceAlerts.length} subscription(s) have increased in price recently.` : ''}`;
  }

  if (query.includes('cost') || query.includes('expensive') || query.includes('most')) {
    return `### 💰 Highest-Cost Recurring Commitments

Your top subscriptions by monthly normalized cost are:

${top3.map((s: any, i: number) => `**${i + 1}. ${s.name}**\n- Monthly Cost: **${sym}${s.monthly.toLocaleString('en-IN')}**\n- Annual Impact: **${sym}${(s.monthly * 12).toLocaleString('en-IN')}**\n- Billing Cadence: ${s.frequency}\n`).join('\n')}

💡 *Optimization Tip:* For high-cost tools like ${top3[0]?.name || 'SaaS'}, check if an annual plan offers 15–20% discounts, or if you can share family slots.`;
  }

  if (query.includes('duplicate') || query.includes('redundant')) {
    if (duplicates.length === 0) {
      return `### ✅ No Duplicate Subscriptions Detected\n\nYour active subscriptions and auto-debit mandates show no overlapping merchants or competing redundant services at this time.`;
    }

    return `### ⚠️ Identified Duplicate & Overlapping Subscriptions

You currently have **${duplicates.length} redundant subscription group(s)** costing **${sym}${duplicateWasteMonthly.toLocaleString('en-IN')}/month** (**${sym}${(duplicateWasteMonthly * 12).toLocaleString('en-IN')}/year**):

${duplicates.map((d: any) => `- **${d.merchantNormalized}** (Waste: **${sym}${d.totalMonthlyWaste}/mo**)\n  *Reason:* ${d.reason}`).join('\n\n')}

👉 *Recommendation:* Visit the **Duplicates** tab to review and cancel the redundant accounts.`;
  }

  if (query.includes('save') || query.includes('savings') || query.includes('reduce')) {
    const annualSavings = duplicateWasteMonthly * 12;
    return `### 💡 Actionable Annual Savings Plan

By implementing targeted audits, you can unlock up to **${sym}${annualSavings.toLocaleString('en-IN')} in annual savings**:

1. **Eliminate Redundant Subscriptions:**
   - Identified monthly waste: **${sym}${duplicateWasteMonthly.toLocaleString('en-IN')}/mo**
   - Annual recovered capital: **${sym}${annualSavings.toLocaleString('en-IN')}**
2. **Review Free Trials:**
   - Always cancel trials before auto-debit triggers; cancellation instructions are available in your Subscriptions view.
3. **Audit High-Limit Mandates:**
   - Check UPI AutoPay mandates in PhonePe/Google Pay with open limits exceeding your normal monthly plan.`;
  }

  if (query.includes('upcoming') || query.includes('next') || query.includes('deduction')) {
    if (upcoming7Days.length === 0) {
      return `### 📅 Upcoming Auto-Debits\n\nNo subscriptions or auto-debits are scheduled within the next 7 days. Your next major cycle starts shortly. Check the **Payment Calendar** for full visibility.`;
    }

    return `### 📅 Auto-Debits Scheduled in the Next 7 Days

${upcoming7Days.map((s: any) => `- **${s.name}**: ${sym}${s.amount} due on **${s.nextBillingDate}** via ${s.paymentMethodName || 'Registered Mandate'}`).join('\n')}

🔔 Make sure your linked bank account or card has sufficient balance to prevent mandate bounce charges.`;
  }

  if (query.includes('price') || query.includes('increase') || query.includes('hike')) {
    if (priceAlerts.length === 0) {
      return `### 🛡️ Price Increase Audit\n\nAll your recurring charges currently match their baseline expected amounts. No price hikes were detected in your latest transactions.`;
    }

    return `### 📈 Detected Subscription Price Increases

${priceAlerts.map((p: any) => `- **${p.subscriptionName}**: Increased by **+${p.percentageIncrease}%** (+${sym}${p.difference}). Old: ${sym}${p.previousAmount} ➔ New: ${sym}${p.newAmount} (Detected on ${p.detectedDate})`).join('\n')}

👉 *Recommendation:* Check if the service updated terms or if you were moved to a different tier without notification.`;
  }

  // Fallback intelligent summary
  return `### 🤖 SubSentry Intelligence Audit

Based on your actual stored portfolio:
- **Active Subscriptions:** ${activeSubs.length} services totaling **${sym}${totalMonthlySpend.toLocaleString('en-IN')}/mo** (**${sym}${totalAnnualSpend.toLocaleString('en-IN')}/yr**).
- **Auto-Debit Mandates:** ${mandates.length} registered mandates.
- **Top Cost Driver:** **${top3[0]?.name || 'N/A'}** (${sym}${top3[0]?.monthly || 0}/mo).
${duplicates.length > 0 ? `- **Duplicate Alerts:** ${duplicates.length} duplicate group(s) wasting ${sym}${duplicateWasteMonthly}/mo.` : '- **Duplicates:** None identified.'}
${priceAlerts.length > 0 ? `- **Price Hikes:** ${priceAlerts.length} service(s) increased in cost.` : ''}

You can ask me to:
- *"Analyze my recurring expenses"*
- *"Which subscriptions cost me the most?"*
- *"Identify possible duplicate payments"*
- *"Show my upcoming deductions"*
- *"How much can I save annually?"*`;
}
