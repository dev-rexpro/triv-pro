-- TRIV Exchange Initial Schema

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    country TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets Table (Multi-wallet architecture)
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

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'trade', 'stake')),
    amount DECIMAL(30, 18) NOT NULL,
    currency TEXT NOT NULL,
    from_wallet TEXT, -- 'funding', 'trading', etc.
    to_wallet TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Spot Orders Table
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

-- Futures Positions Table
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

-- Internal Transfer RPC (Atomic)
CREATE OR REPLACE FUNCTION internal_transfer(
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
    -- 1. Get/Lock source wallet
    SELECT id INTO v_from_wallet_id FROM public.wallets 
    WHERE user_id = p_user_id AND type = p_from_type AND coin_symbol = p_coin
    FOR UPDATE;

    IF v_from_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Source wallet not found';
    END IF;

    -- 2. Check balance
    IF (SELECT balance FROM public.wallets WHERE id = v_from_wallet_id) < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 3. Get/Create destination wallet
    INSERT INTO public.wallets (user_id, type, coin_symbol, balance)
    VALUES (p_user_id, p_to_type, p_coin, 0)
    ON CONFLICT (user_id, type, coin_symbol) DO NOTHING;

    SELECT id INTO v_to_wallet_id FROM public.wallets
    WHERE user_id = p_user_id AND type = p_to_type AND coin_symbol = p_coin;

    -- 4. Execute atomic transfer
    UPDATE public.wallets SET balance = balance - p_amount, updated_at = NOW() WHERE id = v_from_wallet_id;
    UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = v_to_wallet_id;

    -- 5. Record transaction
    INSERT INTO public.transactions (user_id, type, amount, currency, from_wallet, to_wallet, status)
    VALUES (p_user_id, 'transfer', p_amount, p_coin, p_from_type, p_to_type, 'completed');
END;
$$ LANGUAGE plpgsql;
