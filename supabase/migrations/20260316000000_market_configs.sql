CREATE TABLE IF NOT EXISTS public.market_configs (
    symbol TEXT PRIMARY KEY,
    price_precision INTEGER DEFAULT 2,
    max_leverage INTEGER DEFAULT 20,
    maint_margin_ratio NUMERIC(10, 4) DEFAULT 0.005,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_configs ENABLE ROW LEVEL SECURITY;

-- Drop existings policies if they exist to avoid errors on reapplying
DROP POLICY IF EXISTS "Anyone can view market configs" ON public.market_configs;
DROP POLICY IF EXISTS "Authenticated users can insert/update configs" ON public.market_configs;

CREATE POLICY "Anyone can view market configs" ON public.market_configs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert/update configs" ON public.market_configs FOR ALL USING (auth.role() = 'authenticated');
