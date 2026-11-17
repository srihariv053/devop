import test from 'node:test';
import assert from 'node:assert';
import {
  calculateMonthlyEquivalent,
  calculateAnnualEquivalent,
  computeSavingsSummary,
  computeCategorySpending
} from '../src/lib/algorithms/savingsCalculator';
import { Subscription, Mandate } from '../src/lib/types';

test('Monthly Equivalent calculates correctly across billing cadences', () => {
  assert.strictEqual(calculateMonthlyEquivalent(1200, 'annually'), 100);
  assert.strictEqual(calculateMonthlyEquivalent(300, 'quarterly'), 100);
  assert.strictEqual(calculateMonthlyEquivalent(600, 'half-yearly'), 100);
  assert.strictEqual(calculateMonthlyEquivalent(500, 'monthly'), 500);
});

test('Annual Equivalent calculates correctly across billing cadences', () => {
  assert.strictEqual(calculateAnnualEquivalent(100, 'monthly'), 1200);
  assert.strictEqual(calculateAnnualEquivalent(500, 'quarterly'), 2000);
  assert.strictEqual(calculateAnnualEquivalent(1500, 'annually'), 1500);
});

test('Compute Savings Summary calculates total commitments', () => {
  const subs: Subscription[] = [
    {
      id: 'sub-1',
      userId: 'test-user',
      name: 'Netflix',
      serviceProvider: 'Netflix',
      category: 'Streaming',
      amount: 600,
      currency: 'INR',
      billingFrequency: 'monthly',
      billingStartDate: '2024-01-01',
      nextBillingDate: '2026-12-01',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'sub-2',
      userId: 'test-user',
      name: 'Amazon Prime',
      serviceProvider: 'Amazon',
      category: 'Shopping',
      amount: 1200,
      currency: 'INR',
      billingFrequency: 'annually',
      billingStartDate: '2024-01-01',
      nextBillingDate: '2026-12-01',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ];

  const mandates: Mandate[] = [];
  const duplicates: any[] = [];

  const summary = computeSavingsSummary(subs, mandates, duplicates);
  // Netflix = 600/mo, Prime = 1200/yr = 100/mo. Total monthly = 700
  assert.strictEqual(summary.totalMonthlySpend, 700);
  assert.strictEqual(summary.totalAnnualSpend, 8400);
  assert.strictEqual(summary.activeCount, 2);
});
