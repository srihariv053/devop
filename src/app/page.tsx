'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Calendar,
  Lock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-surface/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">SubSentry</span>
            <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover transition"
          >
            <span>Live Dashboard Demo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Intelligent Auto-Debit & Recurring Commitment Auditor</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Stop Silent Bank Drains.{' '}
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-secondary bg-clip-text text-transparent">
            Audit Every Auto-Debit.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          From Indian UPI AutoPay mandates and credit card standing instructions to international
          SaaS and streaming services—discover where your money goes, eliminate hidden duplicates,
          and catch sneaky price increases.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/20 hover:bg-primary-hover transition"
          >
            <span>Launch Live Auditor</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 bg-surface px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Explore Sandbox Data
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <ShieldCheck className="h-6 w-6 text-secondary mb-3" />
            <h3 className="text-sm font-semibold text-white">UPI & Mandate Auditor</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Track PhonePe, Google Pay, and bank standing instructions with clear masked references.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <TrendingDown className="h-6 w-6 text-success mb-3" />
            <h3 className="text-sm font-semibold text-white">Duplicate & Price Hike Alerts</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Instantly catch redundant multi-instrument subscriptions and sudden plan revisions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <Sparkles className="h-6 w-6 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-white">SubSentry Intelligence AI</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Ask natural-language questions grounded strictly in your verified financial data.
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            No Bank Credentials Stored
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Row Level Security Isolation
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Deterministic Financial Truth
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        SubSentry AI © 2026. Built for secure personal finance and recurring subscription auditing.
      </footer>
    </div>
  );
}
