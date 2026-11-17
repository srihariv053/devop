'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { db } from '@/lib/storage/db';
import { Transaction, CurrencyCode } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { parseStatementCsv, ParseResult } from '@/lib/algorithms/statementParsers';
import { exportTransactionsCsv } from '@/lib/utils/exportUtils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // CSV Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseFeedback, setParseFeedback] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.initialize();
    loadTransactions();

    const onUpdate = () => loadTransactions();
    window.addEventListener('subsentry_db_updated', onUpdate);
    return () => window.removeEventListener('subsentry_db_updated', onUpdate);
  }, []);

  const loadTransactions = () => {
    setTransactions(db.getTransactions());
    setCurrency(db.getCurrency());
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setParseFeedback(null);

    try {
      const text = await file.text();
      const profile = db.getProfile();
      const result = await parseStatementCsv(text, profile.id, currency);

      setParseFeedback(result);

      if (result.success && result.transactions.length > 0) {
        db.addTransactions(result.transactions);
        loadTransactions();
        window.dispatchEvent(new Event('subsentry_db_updated'));
      }
    } catch (err: any) {
      setParseFeedback({
        success: false,
        bankDetected: 'Error',
        transactions: [],
        errors: [err.message || 'Failed to read file.'],
        totalParsed: 0,
        totalDebits: 0
      });
    } finally {
      setIsParsing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Sample CSV generator for testing
  const handleDownloadSampleCsv = () => {
    const sample = `Date,Narration,Chq./Ref.No.,Withdrawal Amt.,Deposit Amt.,Closing Balance
18/11/2026,POS 4029 GOOGLE*YOUTUBE PREMIUM MUMBAI IN,REF99012,299.00,,45210.50
15/11/2026,UPI/432091/DISNEY HOTSTAR/BANGALORE,UPI9012,899.00,,45509.50
10/11/2026,SWIGGY ONE MEMBERSHIP HYDERABAD,REF8821,899.00,,46408.50
05/11/2026,ACH DR/HDFC HOME LOAN EMI/SI-48201,SI48201,38500.00,,47307.50
01/11/2026,UPI/AUTOPAY/JIO FIBER BROADBAND/MUMBAI,UPI8812,1179.00,,85807.50
25/10/2026,UPI/429810/SPOTIFY INDIA/MANDATE,UPI7712,179.00,,86986.50
20/10/2026,POS 4029 NETFLIX MUMBAI IN,REF6612,649.00,,87165.50
19/10/2026,POS 3042 OPENAI*CHATGPT SUBSCRIPTION,REF5512,1999.00,,87814.50
18/10/2026,POS 4029 GOOGLE*YOUTUBE PREMIUM MUMBAI IN,REF4412,189.00,,89813.50
10/10/2026,UPI/428190/GOOGLE ONE STORAGE/AUTOPAY,UPI3312,650.00,,90002.50
25/09/2026,UPI/421092/SPOTIFY INDIA/MANDATE,UPI2212,179.00,,90652.50
20/09/2026,POS 4029 NETFLIX MUMBAI IN,REF1112,649.00,,90831.50
19/09/2026,POS 3042 OPENAI*CHATGPT SUBSCRIPTION,REF0012,1999.00,,91480.50`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_hdfc_bank_statement.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.rawDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.normalizedMerchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'ALL' || t.transactionType === filterType;
    return matchSearch && matchType;
  });

  return (
    <Shell
      title="Bank Statement Import & Transaction Ledger"
      subtitle="Parse standard CSV statements from HDFC, ICICI, SBI, Axis, or generic banks with automatic merchant normalization"
    >
      <div className="space-y-6">
        {/* CSV Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-slate-700 bg-surface/60 hover:border-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-primary">
            {isParsing ? (
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-7 w-7 text-primary" />
            )}
          </div>

          <h3 className="mt-4 text-base font-bold text-white">
            {isParsing ? 'Parsing and Normalizing Statement...' : 'Drop your Bank / Card CSV Statement here'}
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Supports HDFC Bank, ICICI Bank, State Bank of India (SBI), Axis Bank, or standard generic CSV exports.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
            >
              Browse CSV File
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadSampleCsv();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download Indian Bank Sample CSV</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {parseFeedback && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              parseFeedback.success
                ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-800/80 bg-rose-950/20 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {parseFeedback.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                )}
                <span>
                  {parseFeedback.success
                    ? `Successfully imported ${parseFeedback.totalParsed} transactions (${parseFeedback.bankDetected})`
                    : 'Import Error'}
                </span>
              </div>
              {parseFeedback.success && (
                <Link
                  href="/recurring"
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-white"
                >
                  <span>Review Detected Recurring Payments</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            {parseFeedback.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-1 text-[11px] text-rose-300/80">
                {parseFeedback.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search narration, merchant, or category..."
              className="w-full rounded-lg border border-slate-700 bg-surface py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="debit">Debits Only (Withdrawals)</option>
              <option value="credit">Credits Only (Deposits)</option>
            </select>

            <button
              onClick={() => exportTransactionsCsv(filtered)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-surface shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileSpreadsheet}
                title="No transactions found"
                description="Import your bank statement CSV file above to populate the ledger."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Raw Bank Narration</th>
                    <th className="px-6 py-3.5">Normalized Merchant</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Statement Source</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-center">Cadence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-3.5 font-medium text-slate-300 whitespace-nowrap">
                        {formatDate(tx.transactionDate, 'dd MMM yyyy')}
                      </td>

                      <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px] max-w-xs truncate" title={tx.rawDescription}>
                        {tx.rawDescription}
                      </td>

                      <td className="px-6 py-3.5 font-semibold text-white">
                        {tx.normalizedMerchant}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          {tx.category}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                        {tx.statementSource}
                      </td>

                      <td
                        className={`px-6 py-3.5 text-right font-bold whitespace-nowrap ${
                          tx.transactionType === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {tx.transactionType === 'debit' ? '-' : '+'}
                        {formatCurrency(tx.amount, currency)}
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        {tx.isRecurringCandidate ? (
                          <Badge variant="cyan" size="sm">
                            Recurring
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">One-off</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
