'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/storage/db';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('arjun.mehta@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      db.initialize();
      router.push('/dashboard');
    }, 600);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    db.resetToDefaults();
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-surface p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-xl shadow-primary/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Welcome to SubSentry AI
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to audit your subscriptions, auto-debits & mandates
          </p>
        </div>

        {/* 1-Click Demo Sandbox Pill */}
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-white">Instant Demo Sandbox</div>
              <p className="mt-0.5 text-[11px] text-slate-300">
                Preloaded with realistic Indian UPI AutoPay, bank mandates & OTT subscriptions.
              </p>
              <button
                onClick={handleDemoAccess}
                disabled={isLoading}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-hover transition"
              >
                <span>Launch Demo Environment</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Standard Auth Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <a href="#" className="text-[11px] text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying...' : 'Sign In with Email'}
          </button>
        </form>

        {/* Security Disclaimers */}
        <div className="space-y-1.5 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Row Level Security (RLS) data isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Never asks for banking passwords, OTPs, or UPI PINs</span>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
