-- ==============================================================================
-- SubSentry AI - PostgreSQL / Supabase Schema Definition & Migrations
-- Personal Subscription & Auto-Debit Auditor
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    default_currency TEXT NOT NULL DEFAULT 'INR', -- INR, USD, EUR, GBP
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    monthly_budget NUMERIC(12, 2) DEFAULT 15000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "HDFC Millennia Credit Card", "Google Pay UPI (Axis)"
    type TEXT NOT NULL, -- 'upi_autopay', 'credit_card', 'debit_card', 'standing_instruction', 'net_banking', 'other'
    bank_or_provider TEXT NOT NULL, -- HDFC, SBI, ICICI, Axis, PhonePe, Paytm, etc.
    masked_identifier TEXT NOT NULL, -- e.g. "•••• 8821" or "user@okhdfcbank"
    expiry_date TEXT, -- MM/YY if card
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Netflix Premium", "Spotify Family", "ChatGPT Plus"
    service_provider TEXT NOT NULL, -- "Netflix Inc", "Spotify India", "OpenAI"
    category TEXT NOT NULL, -- 'Entertainment', 'Streaming', 'Music', 'Software', 'Cloud storage', 'Education', 'Shopping', 'Fitness', 'Food delivery', 'Utilities', 'Finance', 'Other'
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_frequency TEXT NOT NULL DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly', 'half-yearly', 'annually', 'custom'
    billing_start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    account_nickname TEXT, -- "Family Shared", "Work", "Personal"
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'paused', 'cancelled', 'expired', 'payment_failed'
    trial_end_date DATE,
    cancellation_url TEXT,
    cancellation_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUTO-DEBIT MANDATES TABLE
CREATE TABLE IF NOT EXISTS public.mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    mandate_ref_masked TEXT NOT NULL, -- UMN / Mandate ID masked, e.g. "MND-***-9024"
    mandate_type TEXT NOT NULL, -- 'upi_autopay', 'credit_card_si', 'e_mandate', 'bank_si', 'emi', 'insurance'
    amount_limit NUMERIC(10, 2) NOT NULL, -- Cap or exact debit amount
    frequency TEXT NOT NULL, -- 'as_presented', 'monthly', 'quarterly', 'half-yearly', 'annually'
    start_date DATE NOT NULL,
    expiry_date DATE,
    next_expected_debit DATE,
    payment_source TEXT NOT NULL, -- Bank name or VPA, e.g. "ICICI Bank A/C ...4029"
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'revoked', 'expired'
    user_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    raw_description TEXT NOT NULL,
    normalized_merchant TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    transaction_type TEXT NOT NULL DEFAULT 'debit', -- 'debit', 'credit'
    category TEXT NOT NULL DEFAULT 'Other',
    payment_method TEXT,
    statement_source TEXT, -- 'HDFC_CSV', 'ICICI_CSV', 'SBI_CSV', 'MANUAL'
    is_recurring_candidate BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RECURRING DETECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.recurring_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    suggested_category TEXT NOT NULL,
    detected_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    suggested_frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'weekly', 'annually'
    confidence_score TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    confidence_percentage INTEGER NOT NULL DEFAULT 85,
    reason TEXT NOT NULL,
    matched_transaction_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CONVERTED'
    last_detected_date DATE NOT NULL,
    converted_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PRICE CHANGES TABLE
CREATE TABLE IF NOT EXISTS public.price_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    previous_amount NUMERIC(10, 2) NOT NULL,
    new_amount NUMERIC(10, 2) NOT NULL,
    difference NUMERIC(10, 2) NOT NULL,
    percentage_increase NUMERIC(5, 2) NOT NULL,
    detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MERCHANT ALIASES TABLE
CREATE TABLE IF NOT EXISTS public.merchant_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_pattern TEXT NOT NULL UNIQUE,
    normalized_name TEXT NOT NULL,
    default_category TEXT NOT NULL,
    default_cancellation_url TEXT,
    logo_slug TEXT
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'UPCOMING_PAYMENT', 'PRICE_INCREASE', 'DUPLICATE_WARNING', 'TRIAL_EXPIRING', 'MANDATE_ALERT'
    severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'danger', 'success'
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    remind_7_days BOOLEAN NOT NULL DEFAULT true,
    remind_3_days BOOLEAN NOT NULL DEFAULT true,
    remind_1_day BOOLEAN NOT NULL DEFAULT true,
    remind_on_day BOOLEAN NOT NULL DEFAULT true,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    price_increase_threshold_pct NUMERIC(4, 2) DEFAULT 5.00,
    theme TEXT NOT NULL DEFAULT 'dark',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'CREATE_SUBSCRIPTION', 'REVOKE_MANDATE', 'IMPORT_STATEMENT', etc.
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subs_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_next_billing ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_mandates_user_id ON public.mandates(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_recur_user_status ON public.recurring_detections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifs_user_read ON public.notifications(user_id, is_read);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper policy macro: users can only manage their own rows
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own mandates" ON public.mandates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recurring detections" ON public.recurring_detections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own price changes" ON public.price_changes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Merchant Aliases is shared read-only
ALTER TABLE public.merchant_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on merchant aliases" ON public.merchant_aliases FOR SELECT USING (true);
