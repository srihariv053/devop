// ==============================================================================
// SubSentry AI - Unified Storage & Database Access Layer
// High-fidelity persistent storage with full Supabase PostgreSQL schema parity
// ==============================================================================

import {
  UserProfile,
  PaymentMethod,
  Subscription,
  Mandate,
  Transaction,
  RecurringDetection,
  PriceChangeAlert,
  NotificationItem,
  DuplicateGroup,
  CurrencyCode
} from '../types';

import {
  SEED_PROFILE,
  SEED_PAYMENT_METHODS,
  SEED_SUBSCRIPTIONS,
  SEED_MANDATES,
  SEED_TRANSACTIONS,
  SEED_PRICE_CHANGES,
  SEED_NOTIFICATIONS
} from './seedData';

import { detectRecurringPatterns } from '../algorithms/recurringDetector';
import { detectDuplicates } from '../algorithms/duplicateDetector';
import { detectPriceIncreases } from '../algorithms/priceIncreaseDetector';

const STORAGE_KEYS = {
  PROFILE: 'subsentry_profile',
  PAYMENT_METHODS: 'subsentry_payment_methods',
  SUBSCRIPTIONS: 'subsentry_subscriptions',
  MANDATES: 'subsentry_mandates',
  TRANSACTIONS: 'subsentry_transactions',
  RECURRING_DETECTIONS: 'subsentry_recurring_detections',
  PRICE_CHANGES: 'subsentry_price_changes',
  NOTIFICATIONS: 'subsentry_notifications',
  USER_CURRENCY: 'subsentry_user_currency'
};

class SubSentryDatabase {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Generic localStorage reader
  private get<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  // Generic localStorage writer
  private set<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to persist to storage [${key}]:`, e);
    }
  }

  // Initialize DB with seed data if fresh
  public initialize(): void {
    if (!this.isBrowser()) return;

    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults(): void {
    if (!this.isBrowser()) return;
    this.set(STORAGE_KEYS.PROFILE, SEED_PROFILE);
    this.set(STORAGE_KEYS.PAYMENT_METHODS, SEED_PAYMENT_METHODS);
    this.set(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
    this.set(STORAGE_KEYS.MANDATES, SEED_MANDATES);
    this.set(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    this.set(STORAGE_KEYS.PRICE_CHANGES, SEED_PRICE_CHANGES);
    this.set(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    this.set(STORAGE_KEYS.USER_CURRENCY, 'INR');

    // Generate initial detections
    const detections = detectRecurringPatterns(SEED_TRANSACTIONS, SEED_PROFILE.id);
    this.set(STORAGE_KEYS.RECURRING_DETECTIONS, detections);
  }

  // --- Profile & Currency ---
  public getProfile(): UserProfile {
    return this.get<UserProfile>(STORAGE_KEYS.PROFILE, SEED_PROFILE);
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.set(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  public getCurrency(): CurrencyCode {
    return this.get<CurrencyCode>(STORAGE_KEYS.USER_CURRENCY, 'INR');
  }

  public setCurrency(currency: CurrencyCode): void {
    this.set(STORAGE_KEYS.USER_CURRENCY, currency);
    this.updateProfile({ defaultCurrency: currency });
  }

  // --- Subscriptions ---
  public getSubscriptions(): Subscription[] {
    return this.get<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
  }

  public addSubscription(sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Subscription {
    const profile = this.getProfile();
    const subs = this.getSubscriptions();
    const newSub: Subscription = {
      ...sub,
      id: `sub-${Math.random().toString(36).substring(2, 9)}`,
      userId: profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    subs.unshift(newSub);
    this.set(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return newSub;
  }

  public updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
    const subs = this.getSubscriptions();
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return null;

    subs[index] = {
      ...subs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return subs[index];
  }

  public deleteSubscription(id: string): boolean {
    const subs = this.getSubscriptions();
    const filtered = subs.filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.SUBSCRIPTIONS, filtered);
    return true;
  }

  // --- Auto-Debit Mandates ---
  public getMandates(): Mandate[] {
    return this.get<Mandate[]>(STORAGE_KEYS.MANDATES, SEED_MANDATES);
  }

  public addMandate(mandate: Omit<Mandate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Mandate {
    const profile = this.getProfile();
    const list = this.getMandates();
    const newMandate: Mandate = {
      ...mandate,
      id: `mnd-${Math.random().toString(36).substring(2, 9)}`,
      userId: profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newMandate);
    this.set(STORAGE_KEYS.MANDATES, list);
    return newMandate;
  }

  public updateMandate(id: string, updates: Partial<Mandate>): Mandate | null {
    const list = this.getMandates();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.MANDATES, list);
    return list[index];
  }

  public deleteMandate(id: string): boolean {
    const list = this.getMandates();
    const filtered = list.filter((m) => m.id !== id);
    this.set(STORAGE_KEYS.MANDATES, filtered);
    return true;
  }

  // --- Transactions ---
  public getTransactions(): Transaction[] {
    return this.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
  }

  public addTransactions(newTransactions: Transaction[]): void {
    const existing = this.getTransactions();
    const merged = [...newTransactions, ...existing];
    this.set(STORAGE_KEYS.TRANSACTIONS, merged);

    // Re-run recurring detection
    const profile = this.getProfile();
    const newDetections = detectRecurringPatterns(merged, profile.id);
    this.set(STORAGE_KEYS.RECURRING_DETECTIONS, newDetections);

    // Re-run price increase detection
    const subs = this.getSubscriptions();
    const priceAlerts = detectPriceIncreases(subs, merged);
    this.set(STORAGE_KEYS.PRICE_CHANGES, priceAlerts);
  }

  // --- Recurring Detections ---
  public getRecurringDetections(): RecurringDetection[] {
    return this.get<RecurringDetection[]>(STORAGE_KEYS.RECURRING_DETECTIONS, []);
  }

  public updateRecurringDetectionStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'CONVERTED'): void {
    const list = this.getRecurringDetections();
    const item = list.find((d) => d.id === id);
    if (item) {
      item.status = status;
      this.set(STORAGE_KEYS.RECURRING_DETECTIONS, list);
    }
  }

  public convertDetectionToSubscription(detectionId: string): Subscription | null {
    const list = this.getRecurringDetections();
    const det = list.find((d) => d.id === detectionId);
    if (!det) return null;

    // Create subscription
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    const newSub = this.addSubscription({
      name: det.merchantName,
      serviceProvider: det.merchantName,
      category: det.suggestedCategory,
      amount: det.detectedAmount,
      currency: det.currency,
      billingFrequency: det.suggestedFrequency,
      billingStartDate: det.lastDetectedDate || new Date().toISOString().split('T')[0],
      nextBillingDate: nextDate.toISOString().split('T')[0],
      status: 'active',
      notes: `Converted from auto-detected transaction pattern (${det.reason})`
    });

    det.status = 'CONVERTED';
    det.convertedSubscriptionId = newSub.id;
    this.set(STORAGE_KEYS.RECURRING_DETECTIONS, list);

    return newSub;
  }

  // --- Payment Methods ---
  public getPaymentMethods(): PaymentMethod[] {
    return this.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, SEED_PAYMENT_METHODS);
  }

  // --- Price Changes & Alerts ---
  public getPriceChanges(): PriceChangeAlert[] {
    return this.get<PriceChangeAlert[]>(STORAGE_KEYS.PRICE_CHANGES, SEED_PRICE_CHANGES);
  }

  public acknowledgePriceChange(id: string): void {
    const list = this.getPriceChanges();
    const alert = list.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      this.set(STORAGE_KEYS.PRICE_CHANGES, list);
    }
  }

  // --- Duplicates ---
  public getDuplicates(): DuplicateGroup[] {
    const subs = this.getSubscriptions();
    return detectDuplicates(subs);
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const notif = list.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }
}

export const db = new SubSentryDatabase();
