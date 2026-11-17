import test from 'node:test';
import assert from 'node:assert';
import { detectRecurringPatterns } from '../src/lib/algorithms/recurringDetector';
import { Transaction } from '../src/lib/types';

test('Recurring Detector flags exact monthly debits with High confidence', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'test-user',
      transactionDate: '2026-09-20',
      rawDescription: 'POS NETFLIX MUMBAI',
      normalizedMerchant: 'Netflix',
      amount: 649,
      currency: 'INR',
      transactionType: 'debit',
      category: 'Streaming',
      paymentMethod: 'Card',
      statementSource: 'HDFC_CSV',
      isRecurringCandidate: true,
      createdAt: '2026-09-20T00:00:00Z'
    },
    {
      id: 'tx-2',
      userId: 'test-user',
      transactionDate: '2026-10-20',
      rawDescription: 'POS NETFLIX MUMBAI',
      normalizedMerchant: 'Netflix',
      amount: 649,
      currency: 'INR',
      transactionType: 'debit',
      category: 'Streaming',
      paymentMethod: 'Card',
      statementSource: 'HDFC_CSV',
      isRecurringCandidate: true,
      createdAt: '2026-10-20T00:00:00Z'
    },
    {
      id: 'tx-3',
      userId: 'test-user',
      transactionDate: '2026-11-20',
      rawDescription: 'POS NETFLIX MUMBAI',
      normalizedMerchant: 'Netflix',
      amount: 649,
      currency: 'INR',
      transactionType: 'debit',
      category: 'Streaming',
      paymentMethod: 'Card',
      statementSource: 'HDFC_CSV',
      isRecurringCandidate: true,
      createdAt: '2026-11-20T00:00:00Z'
    }
  ];

  const detections = detectRecurringPatterns(transactions, 'test-user');
  assert.strictEqual(detections.length, 1);
  const det = detections[0];
  assert.strictEqual(det.merchantName, 'Netflix');
  assert.strictEqual(det.detectedAmount, 649);
  assert.strictEqual(det.suggestedFrequency, 'monthly');
  assert.strictEqual(det.confidenceScore, 'HIGH');
  assert.ok(det.confidencePercentage >= 80);
});

test('Recurring Detector ignores credit deposits', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-cr-1',
      userId: 'test-user',
      transactionDate: '2026-10-01',
      rawDescription: 'SALARY CREDIT EMPLOYER',
      normalizedMerchant: 'Salary',
      amount: 150000,
      currency: 'INR',
      transactionType: 'credit',
      category: 'Finance',
      paymentMethod: 'NEFT',
      statementSource: 'HDFC_CSV',
      isRecurringCandidate: false,
      createdAt: '2026-10-01T00:00:00Z'
    }
  ];

  const detections = detectRecurringPatterns(transactions, 'test-user');
  assert.strictEqual(detections.length, 0);
});
