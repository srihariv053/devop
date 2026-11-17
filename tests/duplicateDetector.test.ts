import test from 'node:test';
import assert from 'node:assert';
import { detectDuplicates } from '../src/lib/algorithms/duplicateDetector';
import { Subscription } from '../src/lib/types';

test('Duplicate Detector flags multiple active accounts of same service provider', () => {
  const subs: Subscription[] = [
    {
      id: 'sub-1',
      userId: 'test-user',
      name: 'Spotify Family Plan',
      serviceProvider: 'Spotify India',
      category: 'Music',
      amount: 179,
      currency: 'INR',
      billingFrequency: 'monthly',
      billingStartDate: '2024-01-01',
      nextBillingDate: '2026-12-01',
      paymentMethodName: 'HDFC Card',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'sub-2',
      userId: 'test-user',
      name: 'Spotify Individual Plan',
      serviceProvider: 'Spotify India',
      category: 'Music',
      amount: 119,
      currency: 'INR',
      billingFrequency: 'monthly',
      billingStartDate: '2023-01-01',
      nextBillingDate: '2026-12-05',
      paymentMethodName: 'Axis UPI',
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ];

  const duplicates = detectDuplicates(subs);
  assert.strictEqual(duplicates.length, 1);
  assert.ok(duplicates[0].totalMonthlyWaste > 0);
  assert.strictEqual(duplicates[0].subscriptions.length, 2);
});

test('Duplicate Detector ignores cancelled subscriptions', () => {
  const subs: Subscription[] = [
    {
      id: 'sub-1',
      userId: 'test-user',
      name: 'Netflix Premium',
      serviceProvider: 'Netflix',
      category: 'Streaming',
      amount: 649,
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
      name: 'Netflix Basic Old',
      serviceProvider: 'Netflix',
      category: 'Streaming',
      amount: 199,
      currency: 'INR',
      billingFrequency: 'monthly',
      billingStartDate: '2023-01-01',
      nextBillingDate: '2026-12-05',
      status: 'cancelled',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ];

  const duplicates = detectDuplicates(subs);
  assert.strictEqual(duplicates.length, 0);
});
