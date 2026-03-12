-- TRIV Exchange Full Combined Initialization
-- 1. Initial Schema
-- 2. Schema Permissions (Fix 403)
-- 3. RLS Policies (Fix 403 on Upsert/Update)
-- 4. Utility RPCs (Internal Transfer & Full Reset)

-- ==========================================
-- 0. Helper Functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 1. Profiles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    country TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-seed 500 USDT on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, type, coin_symbol, balance)
    VALUES (NEW.id, 'funding', 'USDT', 500)
    ON CONFLICT (user_id, type, coin_symbol) DO NOTHING;

    INSERT INTO public.transactions (user_id, type, amount, currency, to_wallet, status)
    VALUES (NEW.id, 'deposit', 500, 'USDT', 'funding', 'completed');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 2. Wallets Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('funding', 'trading', 'earn')),
    coin_symbol TEXT NOT NULL,
    balance DECIMAL(30, 18) DEFAULT 0,
    locked_balance DECIMAL(30, 18) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type, coin_symbol)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_wallets
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 3. Transactions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'trade', 'stake')),
    amount DECIMAL(30, 18) NOT NULL,
    currency TEXT NOT NULL,
    from_wallet TEXT, 
    to_wallet TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4. Spot Orders Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders_spot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    type TEXT NOT NULL CHECK (type IN ('limit', 'market')),
    price DECIMAL(30, 18),
    amount DECIMAL(30, 18) NOT NULL,
    filled DECIMAL(30, 18) DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders_spot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders_spot FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders_spot FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders_spot FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON public.orders_spot FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. Futures Positions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.positions_futures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    margin_type TEXT CHECK (margin_type IN ('isolated', 'cross')),
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    entry_price DECIMAL(30, 18) NOT NULL,
    size DECIMAL(30, 18) NOT NULL,
    liquidation_price DECIMAL(30, 18),
    margin DECIMAL(30, 18) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.positions_futures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions" ON public.positions_futures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON public.positions_futures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.positions_futures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.positions_futures FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 6. RPC: Internal Transfer
-- ==========================================
CREATE OR REPLACE FUNCTION public.internal_transfer(
    p_user_id UUID,
    p_coin TEXT,
    p_from_type TEXT,
    p_to_type TEXT,
    p_amount DECIMAL
) RETURNS VOID AS $$
DECLARE
    v_from_wallet_id UUID;
    v_to_wallet_id UUID;
BEGIN
    SELECT id INTO v_from_wallet_id FROM public.wallets 
    WHERE user_id = p_user_id AND type = p_from_type AND coin_symbol = p_coin
    FOR UPDATE;

    IF v_from_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Source wallet not found';
    END IF;

    IF (SELECT balance FROM public.wallets WHERE id = v_from_wallet_id) < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    INSERT INTO public.wallets (user_id, type, coin_symbol, balance)
    VALUES (p_user_id, p_to_type, p_coin, 0)
    ON CONFLICT (user_id, type, coin_symbol) DO NOTHING;

    SELECT id INTO v_to_wallet_id FROM public.wallets
    WHERE user_id = p_user_id AND type = p_to_type AND coin_symbol = p_coin;

    UPDATE public.wallets SET balance = balance - p_amount, updated_at = NOW() WHERE id = v_from_wallet_id;
    UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = v_to_wallet_id;

    INSERT INTO public.transactions (user_id, type, amount, currency, from_wallet, to_wallet, status)
    VALUES (p_user_id, 'transfer', p_amount, p_coin, p_from_type, p_to_type, 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. RPC: Full Reset User Data
-- ==========================================
CREATE OR REPLACE FUNCTION public.full_reset_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.transactions WHERE user_id = p_user_id;
    DELETE FROM public.orders_spot WHERE user_id = p_user_id;
    DELETE FROM public.positions_futures WHERE user_id = p_user_id;
    DELETE FROM public.wallets WHERE user_id = p_user_id;
    
    INSERT INTO public.wallets (user_id, type, coin_symbol, balance)
    VALUES (p_user_id, 'funding', 'USDT', 500);

    INSERT INTO public.transactions (user_id, type, amount, currency, to_wallet, status)
    VALUES (p_user_id, 'deposit', 500, 'USDT', 'funding', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. Schema Permissions (Final Fix)
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
