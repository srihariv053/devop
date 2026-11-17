// ==============================================================================
// SubSentry AI - Bank Statement & CSV Parser
// Supports Indian Banks (HDFC, ICICI, SBI, Axis, Kotak) & Standard Generic CSV formats
// ==============================================================================

import Papa from 'papaparse';
import { Transaction, CurrencyCode } from '../types';
import { normalizeMerchant } from './merchantNormalizer';

export interface ParseResult {
  success: boolean;
  bankDetected: string;
  transactions: Transaction[];
  errors: string[];
  totalParsed: number;
  totalDebits: number;
}

export function parseStatementCsv(
  csvContent: string,
  userId: string,
  currency: CurrencyCode = 'INR'
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (!rows || rows.length === 0) {
          resolve({
            success: false,
            bankDetected: 'Unknown',
            transactions: [],
            errors: ['The uploaded CSV file is empty or missing headers.'],
            totalParsed: 0,
            totalDebits: 0
          });
          return;
        }

        const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());

        // Detect Bank Flavor
        let bank = 'Generic Bank Statement';
        if (headers.some((h) => h.includes('narration') || h.includes('chq./ref.no.'))) {
          bank = 'HDFC Bank';
        } else if (headers.some((h) => h.includes('transaction remarks') || h.includes('withdrawal amount (inr )'))) {
          bank = 'ICICI Bank';
        } else if (headers.some((h) => h.includes('txn date') || h.includes('ref no./cheque no.'))) {
          bank = 'SBI Bank';
        } else if (headers.some((h) => h.includes('particulars') && h.includes('tran date'))) {
          bank = 'Axis Bank';
        }

        const parsedTransactions: Transaction[] = [];
        const errors: string[] = [];

        rows.forEach((row, idx) => {
          try {
            // Find Date Column
            const dateKey = Object.keys(row).find((k) => {
              const lower = k.toLowerCase();
              return lower.includes('date') || lower.includes('txn date') || lower.includes('value date');
            });
            const rawDate = dateKey ? row[dateKey]?.trim() : '';

            // Find Description / Narration Column
            const descKey = Object.keys(row).find((k) => {
              const lower = k.toLowerCase();
              return (
                lower.includes('narration') ||
                lower.includes('description') ||
                lower.includes('particulars') ||
                lower.includes('remarks') ||
                lower.includes('details')
              );
            });
            const rawDesc = descKey ? row[descKey]?.trim() : '';

            // Find Debit Amount Column
            const debitKey = Object.keys(row).find((k) => {
              const lower = k.toLowerCase();
              return lower.includes('debit') || lower.includes('withdrawal') || lower.includes('dr');
            });

            // Find Credit Amount Column
            const creditKey = Object.keys(row).find((k) => {
              const lower = k.toLowerCase();
              return lower.includes('credit') || lower.includes('deposit') || lower.includes('cr');
            });

            // Find General Amount Column (if single amount column exists)
            const genericAmountKey = Object.keys(row).find((k) => {
              const lower = k.toLowerCase();
              return lower === 'amount' || lower === 'txn amount';
            });

            if (!rawDesc) return;

            let amount = 0;
            let type: 'debit' | 'credit' = 'debit';

            if (debitKey && row[debitKey] && parseFloat(cleanNumeric(row[debitKey])) > 0) {
              amount = parseFloat(cleanNumeric(row[debitKey]));
              type = 'debit';
            } else if (creditKey && row[creditKey] && parseFloat(cleanNumeric(row[creditKey])) > 0) {
              amount = parseFloat(cleanNumeric(row[creditKey]));
              type = 'credit';
            } else if (genericAmountKey && row[genericAmountKey]) {
              const val = cleanNumeric(row[genericAmountKey]);
              const num = parseFloat(val);
              if (num < 0) {
                amount = Math.abs(num);
                type = 'debit';
              } else {
                amount = num;
                // If type indicator column exists
                const typeColKey = Object.keys(row).find((k) => k.toLowerCase().includes('type'));
                if (typeColKey && row[typeColKey]?.toLowerCase().includes('cr')) {
                  type = 'credit';
                } else {
                  type = 'debit';
                }
              }
            }

            if (amount <= 0 || isNaN(amount)) return;

            // Normalize Date into YYYY-MM-DD
            const formattedDate = parseFlexibleDate(rawDate);
            const normalized = normalizeMerchant(rawDesc);

            parsedTransactions.push({
              id: `tx-csv-${idx}-${Math.random().toString(36).substring(2, 7)}`,
              userId,
              transactionDate: formattedDate,
              rawDescription: rawDesc,
              normalizedMerchant: normalized.normalizedName,
              amount: Math.round(amount * 100) / 100,
              currency,
              transactionType: type,
              category: normalized.category,
              paymentMethod: bank,
              statementSource: `${bank}_CSV`,
              isRecurringCandidate: normalized.isProbableSubscription,
              createdAt: new Date().toISOString()
            });
          } catch (e: any) {
            errors.push(`Row ${idx + 1}: ${e.message}`);
          }
        });

        resolve({
          success: parsedTransactions.length > 0,
          bankDetected: bank,
          transactions: parsedTransactions,
          errors,
          totalParsed: parsedTransactions.length,
          totalDebits: parsedTransactions.filter((t) => t.transactionType === 'debit').length
        });
      },
      error: (err: any) => {
        resolve({
          success: false,
          bankDetected: 'Unknown',
          transactions: [],
          errors: [err.message],
          totalParsed: 0,
          totalDebits: 0
        });
      }
    });
  });
}

function cleanNumeric(val: string): string {
  if (!val) return '0';
  return val.replace(/[^0-9.-]/g, '');
}

function parseFlexibleDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];

  // Try standard split: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const parts = raw.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      // Assume Indian format: DD/MM/YYYY or DD-MM-YY
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }

  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}
