import test from 'node:test';
import assert from 'node:assert';
import { parseStatementCsv } from '../src/lib/algorithms/statementParsers';

test('Statement Parser parses Indian bank statement CSV properly', async () => {
  const csv = `Date,Narration,Chq./Ref.No.,Withdrawal Amt.,Deposit Amt.,Closing Balance
18/11/2026,POS 4029 GOOGLE*YOUTUBE PREMIUM MUMBAI IN,REF99012,299.00,,45210.50
15/11/2026,UPI/432091/DISNEY HOTSTAR/BANGALORE,UPI9012,899.00,,45509.50
01/11/2026,SALARY DEPOSIT,SAL001,,150000.00,85807.50`;

  const result = await parseStatementCsv(csv, 'usr-test', 'INR');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.totalParsed, 3);
  assert.strictEqual(result.totalDebits, 2);
  assert.strictEqual(result.bankDetected, 'HDFC Bank');

  const youtubeTx = result.transactions.find((t) => t.normalizedMerchant === 'YouTube Premium');
  assert.ok(youtubeTx);
  assert.strictEqual(youtubeTx.amount, 299);
  assert.strictEqual(youtubeTx.transactionType, 'debit');
});
