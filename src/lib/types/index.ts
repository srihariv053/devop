// ==============================================================================
// SubSentry AI - Core TypeScript Types & Interfaces
// ==============================================================================

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type BillingFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'annually'
  | 'custom';

export type SubscriptionCategory =
  | 'Entertainment'
  | 'Streaming'
  | 'Music'
  | 'Software'
  | 'Cloud storage'
  | 'Education'
  | 'Shopping'
  | 'Fitness'
  | 'Food delivery'
  | 'Utilities'
  | 'Finance'
  | 'Other';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'payment_failed';

export type MandateType =
  | 'upi_autopay'
  | 'credit_card_si'
  | 'debit_card_si'
  | 'bank_si'
  | 'emi'
  | 'insurance'
  | 'utility_autopay'
  | 'other';

export type MandateStatus = 'active' | 'paused' | 'revoked' | 'expired';

export type ConfidenceScore = 'HIGH' | 'MEDIUM' | 'LOW';

export type DetectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  defaultCurrency: CurrencyCode;
  timezone: string;
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string; // e.g. "HDFC Millennia Credit Card", "GPay (Axis UPI AutoPay)"
  type: 'upi_autopay' | 'credit_card' | 'debit_card' | 'standing_instruction' | 'net_banking';
  bankOrProvider: string; // HDFC, ICICI, SBI, Axis, PhonePe, Paytm, etc.
  maskedIdentifier: string; // "•••• 8821" or "user@okhdfcbank"
  expiryDate?: string;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string; // "Netflix Premium"
  serviceProvider: string; // "Netflix Inc"
  category: SubscriptionCategory;
  amount: number;
  currency: CurrencyCode;
  billingFrequency: BillingFrequency;
  billingStartDate: string;
  nextBillingDate: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  accountNickname?: string; // "Personal", "Family Shared"
  status: SubscriptionStatus;
  trialEndDate?: string;
  cancellationUrl?: string;
  cancellationInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mandate {
  id: string;
  userId: string;
  merchantName: string;
  mandateRefMasked: string; // "UMN: MND-***-8821"
  mandateType: MandateType;
  amountLimit: number; // e.g., ₹1500 limit or ₹450 fixed
  frequency: BillingFrequency | 'as_presented';
  startDate: string;
  expiryDate?: string;
  nextExpectedDebit?: string;
  paymentSource: string; // "HDFC Bank A/c •••• 4029"
  status: MandateStatus;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  transactionDate: string; // YYYY-MM-DD
  rawDescription: string;
  normalizedMerchant: string;
  amount: number;
  currency: CurrencyCode;
  transactionType: 'debit' | 'credit';
  category: SubscriptionCategory;
  paymentMethod: string;
  statementSource: string; // 'HDFC_CSV', 'ICICI_CSV', 'MANUAL_IMPORT', etc.
  isRecurringCandidate: boolean;
  createdAt: string;
}

export interface RecurringDetection {
  id: string;
  userId: string;
  merchantName: string;
  suggestedCategory: SubscriptionCategory;
  detectedAmount: number;
  currency: CurrencyCode;
  suggestedFrequency: BillingFrequency;
  confidenceScore: ConfidenceScore;
  confidencePercentage: number;
  reason: string;
  matchedTransactionIds: string[];
  matchedCount: number;
  status: DetectionStatus;
  lastDetectedDate: string;
  averageIntervalDays: number;
  convertedSubscriptionId?: string;
  createdAt: string;
}

export interface DuplicateGroup {
  id: string;
  merchantNormalized: string;
  reason: string;
  totalMonthlyWaste: number;
  subscriptions: Subscription[];
}

export interface PriceChangeAlert {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  previousAmount: number;
  newAmount: number;
  difference: number;
  percentageIncrease: number;
  detectedDate: string;
  acknowledged: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'UPCOMING_PAYMENT' | 'PRICE_INCREASE' | 'DUPLICATE_WARNING' | 'TRIAL_EXPIRING' | 'MANDATE_ALERT';
  severity: 'info' | 'warning' | 'danger' | 'success';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface SavingsAuditSummary {
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  duplicateWasteMonthly: number;
  unusedOrIdleMonthly: number;
  topExpensiveSubscription: { name: string; amount: number } | null;
  activeCount: number;
  mandateCount: number;
}
