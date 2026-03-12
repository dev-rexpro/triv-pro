CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    country TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('funding', 'trading', 'earn')),
    coin_symbol TEXT NOT NULL,
    balance NUMERIC(20, 8) DEFAULT 0,
    locked_balance NUMERIC(20, 8) DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'trade', 'stake')),
    amount NUMERIC(20, 8) NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.orders_spot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    type TEXT NOT NULL CHECK (type IN ('limit', 'market')),
    price NUMERIC(20, 8),
    amount NUMERIC(20, 8) NOT NULL,
    filled NUMERIC(20, 8) DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders_spot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders_spot FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders_spot FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders_spot FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON public.orders_spot FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.positions_futures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    margin_type TEXT CHECK (margin_type IN ('isolated', 'cross')),
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    entry_price NUMERIC(20, 8) NOT NULL,
    size NUMERIC(20, 8) NOT NULL,
    liquidation_price NUMERIC(20, 8),
    margin NUMERIC(20, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.positions_futures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions" ON public.positions_futures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON public.positions_futures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.positions_futures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.positions_futures FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.internal_transfer(
    p_user_id UUID,
    p_coin TEXT,
    p_from_type TEXT,
    p_to_type TEXT,
    p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_from_balance NUMERIC(20, 8);
    v_to_balance NUMERIC(20, 8);
    v_amount NUMERIC(20, 8) := ROUND(p_amount, 8);
BEGIN
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized transfer attempt';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
    END IF;

    IF v_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be greater than zero';
    END IF;

    UPDATE public.wallets 
    SET balance = balance - v_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND type = p_from_type AND coin_symbol = p_coin AND balance >= v_amount
    RETURNING balance INTO v_from_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source wallet (%) not found or insufficient balance for %', p_from_type, p_coin;
    END IF;

    INSERT INTO public.wallets (user_id, type, coin_symbol, balance)
    VALUES (p_user_id, p_to_type, p_coin, v_amount)
    ON CONFLICT (user_id, type, coin_symbol) 
    DO UPDATE SET balance = wallets.balance + EXCLUDED.balance, updated_at = NOW()
    RETURNING balance INTO v_to_balance;

    INSERT INTO public.transactions (user_id, type, amount, currency, from_wallet, to_wallet, status)
    VALUES (p_user_id, 'transfer', v_amount, p_coin, p_from_type, p_to_type, 'completed');

    RETURN jsonb_build_object(
        'success', true,
        'from_type', p_from_type,
        'from_balance', v_from_balance,
        'to_type', p_to_type,
        'to_balance', v_to_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.full_reset_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized reset attempt';
    END IF;

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

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- ==========================================
-- 9. Futures History Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.history_futures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    margin_type TEXT,
    side TEXT,
    entry_price NUMERIC(20, 8),
    close_price NUMERIC(20, 8),
    size NUMERIC(20, 8),
    margin NUMERIC(20, 8),
    pnl NUMERIC(20, 8),
    time_opened TIMESTAMPTZ,
    time_closed TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.history_futures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own futures history" ON public.history_futures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own futures history" ON public.history_futures FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 10. Realtime Replication
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders_spot;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions_futures;
