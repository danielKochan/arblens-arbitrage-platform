-- Location: supabase/migrations/20250809175749_arblens_core.sql
-- Schema Analysis: Fresh project, no existing schema
-- Integration Type: Complete new arbitrage platform schema
-- Module: ArbLens - Cross-exchange arbitrage platform

-- 1. Types and Enums
CREATE TYPE public.venue_type AS ENUM ('prediction_market', 'sports_betting', 'crypto_exchange');
CREATE TYPE public.venue_status AS ENUM ('active', 'paused', 'disabled', 'maintenance');
CREATE TYPE public.market_status AS ENUM ('active', 'suspended', 'settled', 'cancelled');
CREATE TYPE public.opportunity_status AS ENUM ('active', 'expired', 'insufficient_liquidity', 'executed');
CREATE TYPE public.user_role AS ENUM ('admin', 'pro_user', 'basic_user');
CREATE TYPE public.alert_status AS ENUM ('active', 'paused', 'triggered', 'expired');
CREATE TYPE public.alert_type AS ENUM ('email', 'telegram', 'webhook');
CREATE TYPE public.api_key_tier AS ENUM ('free', 'pro', 'partner');

-- 2. Core Tables - User Management
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'basic_user'::public.user_role,
    timezone TEXT DEFAULT 'Asia/Jerusalem',
    is_active BOOLEAN DEFAULT true,
    subscription_tier public.api_key_tier DEFAULT 'free'::public.api_key_tier,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Venue Management
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    venue_type public.venue_type NOT NULL,
    api_url TEXT,
    websocket_url TEXT,
    fee_bps INTEGER DEFAULT 0, -- basis points (100 = 1%)
    min_trade_size DECIMAL(18,8),
    max_trade_size DECIMAL(18,8),
    supports_websocket BOOLEAN DEFAULT false,
    requires_auth BOOLEAN DEFAULT false,
    geo_restrictions TEXT[], -- array of country codes
    status public.venue_status DEFAULT 'active'::public.venue_status,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Market Data
CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL, -- venue's internal market ID
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    event_date TIMESTAMPTZ,
    resolution_date TIMESTAMPTZ,
    yes_price DECIMAL(10,4),
    no_price DECIMAL(10,4),
    yes_liquidity DECIMAL(18,2) DEFAULT 0,
    no_liquidity DECIMAL(18,2) DEFAULT 0,
    volume_24h DECIMAL(18,2) DEFAULT 0,
    tick_size DECIMAL(10,4) DEFAULT 0.01,
    market_url TEXT,
    status public.market_status DEFAULT 'active'::public.market_status,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(venue_id, external_id)
);

-- 5. Market Pair Matching
CREATE TABLE public.market_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_a_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    market_b_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    is_manual_override BOOLEAN DEFAULT false,
    manually_approved_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(market_a_id, market_b_id)
);

-- 6. Arbitrage Opportunities
CREATE TABLE public.arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES public.market_pairs(id) ON DELETE CASCADE,
    gross_spread_pct DECIMAL(8,4) NOT NULL,
    net_spread_pct DECIMAL(8,4) NOT NULL,
    expected_profit_pct DECIMAL(8,4) NOT NULL,
    expected_profit_usd DECIMAL(18,2),
    max_tradable_amount DECIMAL(18,2),
    venue_a_side TEXT NOT NULL, -- 'yes' or 'no'
    venue_b_side TEXT NOT NULL, -- 'yes' or 'no'
    venue_a_price DECIMAL(10,4) NOT NULL,
    venue_b_price DECIMAL(10,4) NOT NULL,
    venue_a_liquidity DECIMAL(18,2),
    venue_b_liquidity DECIMAL(18,2),
    risk_level TEXT DEFAULT 'medium', -- low, medium, high
    status public.opportunity_status DEFAULT 'active'::public.opportunity_status,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. API Key Management
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- hashed API key
    key_prefix TEXT NOT NULL, -- first 8 chars for display
    tier public.api_key_tier NOT NULL DEFAULT 'free'::public.api_key_tier,
    rate_limit_per_minute INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Alert Rules
CREATE TABLE public.alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_spread_pct DECIMAL(8,4) DEFAULT 2.0,
    min_liquidity_usd DECIMAL(18,2) DEFAULT 1000,
    venue_filter TEXT[], -- array of venue names
    category_filter TEXT[],
    alert_types public.alert_type[] DEFAULT '{email}',
    email_address TEXT,
    telegram_chat_id TEXT,
    webhook_url TEXT,
    status public.alert_status DEFAULT 'active'::public.alert_status,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Alert Triggers (Log)
CREATE TABLE public.alert_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.arbitrage_opportunities(id) ON DELETE CASCADE,
    alert_type public.alert_type NOT NULL,
    recipient TEXT NOT NULL, -- email/chat_id/webhook_url
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivery_status TEXT DEFAULT 'sent', -- sent, failed, delivered
    error_message TEXT
);

-- 10. System Settings
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, setting_key)
);

-- 11. Backtests
CREATE TABLE public.backtests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    min_spread_pct DECIMAL(8,4) DEFAULT 1.0,
    min_liquidity_usd DECIMAL(18,2) DEFAULT 500,
    venue_filter TEXT[],
    total_opportunities INTEGER DEFAULT 0,
    profitable_opportunities INTEGER DEFAULT 0,
    total_profit_pct DECIMAL(10,4) DEFAULT 0,
    total_profit_usd DECIMAL(18,2) DEFAULT 0,
    max_drawdown_pct DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_venues_status ON public.venues(status);
CREATE INDEX idx_markets_venue_id ON public.markets(venue_id);
CREATE INDEX idx_markets_status_updated ON public.markets(status, last_updated);
CREATE INDEX idx_market_pairs_confidence ON public.market_pairs(confidence_score DESC);
CREATE INDEX idx_opportunities_spread ON public.arbitrage_opportunities(net_spread_pct DESC);
CREATE INDEX idx_opportunities_status_created ON public.arbitrage_opportunities(status, created_at DESC);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_rules_user_status ON public.alert_rules(user_id, status);
CREATE INDEX idx_alert_triggers_sent_at ON public.alert_triggers(sent_at DESC);
CREATE INDEX idx_system_settings_user_key ON public.system_settings(user_id, setting_key);
CREATE INDEX idx_backtests_user_created ON public.backtests(user_id, created_at DESC);

-- 13. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;

-- 14. Helper Functions (Create before RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- 15. RLS Policies

-- Pattern 1: Core user table (user_profiles)
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 4: Public read, admin write for venues
CREATE POLICY "public_can_read_venues"
ON public.venues
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_venues"
ON public.venues
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Pattern 4: Public read for markets and opportunities (for preview/demo)
CREATE POLICY "public_can_read_markets"
ON public.markets
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_markets"
ON public.markets
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "public_can_read_market_pairs"
ON public.market_pairs
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_market_pairs"
ON public.market_pairs
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "public_can_read_arbitrage_opportunities"
ON public.arbitrage_opportunities
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_arbitrage_opportunities"
ON public.arbitrage_opportunities
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Pattern 2: Simple user ownership for user-specific data
CREATE POLICY "users_manage_own_api_keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_alert_rules"
ON public.alert_rules
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_alert_triggers"
ON public.alert_triggers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.alert_rules ar 
        WHERE ar.id = alert_rule_id 
        AND ar.user_id = auth.uid()
    )
);

CREATE POLICY "users_manage_own_system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_backtests"
ON public.backtests
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 16. Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'basic_user')::public.user_role
  );  
  RETURN NEW;
END;
$$;

-- 17. Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. Mock Data for Demo
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    polymarket_id UUID := gen_random_uuid();
    kalshi_id UUID := gen_random_uuid();
    manifold_id UUID := gen_random_uuid();
    market1_id UUID := gen_random_uuid();
    market2_id UUID := gen_random_uuid();
    market3_id UUID := gen_random_uuid();
    pair1_id UUID := gen_random_uuid();
    opp1_id UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@arblens.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Admin User", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@arblens.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Pro User", "role": "pro_user"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create venues
    INSERT INTO public.venues (id, name, venue_type, api_url, fee_bps, supports_websocket, status) VALUES
        (polymarket_id, 'Polymarket', 'prediction_market'::public.venue_type, 'https://clob.polymarket.com', 200, true, 'active'::public.venue_status),
        (kalshi_id, 'Kalshi', 'prediction_market'::public.venue_type, 'https://trading-api.kalshi.com', 100, true, 'active'::public.venue_status),
        (manifold_id, 'Manifold Markets', 'prediction_market'::public.venue_type, 'https://api.manifold.markets', 0, false, 'active'::public.venue_status);

    -- Create markets
    INSERT INTO public.markets (id, venue_id, external_id, title, category, yes_price, no_price, yes_liquidity, no_liquidity, status) VALUES
        (market1_id, polymarket_id, 'poly_trump_2024', 'Trump wins 2024 Presidential Election', 'Politics', 0.52, 0.48, 150000.00, 125000.00, 'active'::public.market_status),
        (market2_id, kalshi_id, 'kalshi_presid_trump', 'Donald Trump to be elected President in 2024', 'Politics', 0.54, 0.46, 85000.00, 95000.00, 'active'::public.market_status),
        (market3_id, manifold_id, 'man_btc_100k', 'Bitcoin to reach 100k by end of 2024', 'Crypto', 0.25, 0.75, 50000.00, 150000.00, 'active'::public.market_status);

    -- Create market pair
    INSERT INTO public.market_pairs (id, market_a_id, market_b_id, confidence_score, is_manual_override) VALUES
        (pair1_id, market1_id, market2_id, 95, false);

    -- Create arbitrage opportunity
    INSERT INTO public.arbitrage_opportunities (id, pair_id, gross_spread_pct, net_spread_pct, expected_profit_pct, expected_profit_usd, max_tradable_amount, venue_a_side, venue_b_side, venue_a_price, venue_b_price, venue_a_liquidity, venue_b_liquidity, status) VALUES
        (opp1_id, pair1_id, 3.85, 2.45, 2.45, 2450.00, 100000.00, 'yes', 'no', 0.52, 0.46, 150000.00, 95000.00, 'active'::public.opportunity_status);

    -- Create API key for pro user
    INSERT INTO public.api_keys (user_id, key_name, key_hash, key_prefix, tier, rate_limit_per_minute) VALUES
        (user_uuid, 'Main API Key', 'hashed_key_value_here', 'arb_12ab', 'pro'::public.api_key_tier, 300);

    -- Create alert rule
    INSERT INTO public.alert_rules (user_id, name, min_spread_pct, min_liquidity_usd, alert_types, email_address) VALUES
        (user_uuid, 'High Profit Alerts', 2.0, 10000.00, '{email,telegram}', 'user@arblens.com');

    -- Create system settings
    INSERT INTO public.system_settings (user_id, setting_key, setting_value) VALUES
        (user_uuid, 'dashboard_refresh_interval', '{"value": 30, "unit": "seconds"}'),
        (user_uuid, 'default_filters', '{"min_spread": 1.5, "venues": ["Polymarket", "Kalshi"], "categories": []}'),
        (admin_uuid, 'admin_notifications', '{"email_alerts": true, "system_maintenance": true}');

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;