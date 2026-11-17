'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, Lock, Mail, User, Globe } from 'lucide-react';
import { db } from '@/lib/storage/db';
import { CurrencyCode } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      db.initialize();
      db.updateProfile({
        fullName: fullName || 'New SubSentry User',
        email: email || 'user@example.com',
        defaultCurrency: currency
      });
      db.setCurrency(currency);
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-surface p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-xl shadow-primary/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Create your Account</h2>
          <p className="mt-1 text-xs text-slate-400">
            Audit your subscriptions & recurring debits in one place
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arjun Mehta"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arjun@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Primary Currency</label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white focus:border-primary focus:outline-none"
              >
                <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
