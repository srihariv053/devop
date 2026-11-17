'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  CopyX,
  Calendar,
  AlertCircle
} from 'lucide-react';

import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/storage/db';
import { CurrencyCode } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  timestamp: string;
}

const SUGGESTED_QUERIES = [
  'Analyze my recurring expenses.',
  'Which subscriptions cost me the most?',
  'Find subscriptions I might have forgotten.',
  'Identify possible duplicate payments.',
  'Show my upcoming deductions.',
  'How much can I save annually?',
  'Which expenses increased recently?'
];

export default function AiInsightsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.initialize();
    setCurrency(db.getCurrency());

    // Initial greeting from SubSentry Intelligence
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `👋 Hello! I am **SubSentry Intelligence**, your personal recurring finance auditor.

I have audited your active subscriptions, UPI AutoPay mandates, and historical transaction statements. All my analysis is grounded directly in your stored financial data—with zero made-up numbers.

What would you like me to analyze today? You can click any suggested question below or type your own.`,
        source: 'SubSentry Grounded AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Collect current snapshot of truth
      const subs = db.getSubscriptions();
      const mandates = db.getMandates();
      const tx = db.getTransactions();
      const dups = db.getDuplicates();
      const priceAlerts = db.getPriceChanges().filter((p) => !p.acknowledged);

      const res = await fetch('/api/ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          subscriptions: subs,
          mandates,
          transactions: tx,
          duplicates: dups,
          priceAlerts,
          currency
        })
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Analysis completed based on your stored transactions.',
        source: data.source === 'gemini' ? 'Google Gemini 1.5' : 'Deterministic Grounded AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Unable to complete AI audit request: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Shell
      title="SubSentry Intelligence AI"
      subtitle="AI-powered financial auditor analyzing recurring expenses, duplicate leakages, and savings opportunities"
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] rounded-2xl border border-slate-800 bg-surface overflow-hidden shadow-2xl">
        {/* Chat Top Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">SubSentry Intelligence</span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                  Financial Truth Grounded
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Deterministic calculations • Strict privacy • No synthetic transactions
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-300">Default Currency: {currency}</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-white shadow">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-5 py-4 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div
                  className={`mt-2.5 flex items-center justify-between text-[10px] ${
                    msg.role === 'user' ? 'text-primary-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.source && (
                    <span className="font-semibold text-cyan-400/90">{msg.source}</span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Auditing recurring ledger & synthesizing financial advice...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Query Chips */}
        <div className="border-t border-slate-800/80 bg-slate-950/40 px-6 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              Prompts:
            </span>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 hover:border-primary hover:text-white transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t border-slate-800 bg-slate-900/80 p-4 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything about your recurring expenses, upcoming mandates, or potential savings..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 px-4 text-xs text-white placeholder-slate-400 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Shell>
  );
}
