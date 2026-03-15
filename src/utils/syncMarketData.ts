import { supabase } from './supabase';

export const syncMarketConfigsFromBinance = async () => {
    try {
        console.log('Starting market configs synchronization...');
        
        // Fetch exchange info for price precision
        const infoRes = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
        const infoData = await infoRes.json();

        // Fetch leverage brackets for max leverage and MMR
        const bracketRes = await fetch('https://fapi.binance.com/fapi/v1/leverageBracket');
        const bracketData = await bracketRes.json();

        const configsToUpsert = [];

        for (const bracket of bracketData) {
            const symbol = bracket.symbol;
            
            const coinInfo = infoData.symbols.find((s: any) => s.symbol === symbol);
            if (!coinInfo) continue;

            // Typically the first bracket (bracket 1) has the lowest position value and highest leverage
            const firstBracket = bracket.brackets.find((b: any) => b.bracket === 1);
            if (!firstBracket) continue;

            configsToUpsert.push({
                symbol: symbol,
                price_precision: coinInfo.pricePrecision,
                max_leverage: firstBracket.initialLeverage,
                maint_margin_ratio: firstBracket.maintMarginRatio,
                updated_at: new Date().toISOString()
            });
        }

        if (configsToUpsert.length === 0) {
            console.warn('No market configurations found to sync.');
            return false;
        }

        const { error } = await supabase
            .from('market_configs')
            .upsert(configsToUpsert, { onConflict: 'symbol' });

        if (error) {
            console.error('Supabase upsert error:', error);
            throw error;
        }
        
        console.log(`Successfully synchronized ${configsToUpsert.length} market configurations!`);
        return true;
    } catch (error) {
        console.error('Failed to sync market data:', error);
        return false;
    }
};
