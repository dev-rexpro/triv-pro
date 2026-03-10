import { UnifiedCoin } from '../types';

// Caches for optimization
let binanceExchangeInfoCache: any[] | null = null;
let lastExchangeInfoFetch = 0;

export const fetchCoinData = async (query: string): Promise<UnifiedCoin> => {
    const q = query.trim();
    if (!q) throw new Error("Empty query");

    // 1. Is it a Contract Address? (starts with 0x or very long)
    const isAddress = q.startsWith('0x') || q.length > 20 || q.length > 40; // simple heuristic for ETH/SOL/BSC addresses

    if (!isAddress) {
        // STRATEGY 1: Binance Local List / Ticker
        const upperQ = q.toUpperCase();
        const symbolToTest = upperQ.endsWith('USDT') ? upperQ : `${upperQ}USDT`;

        try {
            const binanceData = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbolToTest}`);
            if (binanceData.ok) {
                const res = await binanceData.json();
                return {
                    id: res.symbol,
                    name: upperQ.replace('USDT', ''), // simple name fallback
                    symbol: res.symbol,
                    price: parseFloat(res.lastPrice),
                    change24h: parseFloat(res.priceChangePercent),
                    volume24h: parseFloat(res.quoteVolume),
                    source: 'BINANCE',
                    icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${upperQ.replace('USDT', '').toLowerCase()}.png`
                };
            }
        } catch (e) {
            console.warn(`Binance fetch failed for ${symbolToTest}, falling back to DEX...`);
        }
    }

    // STRATEGY 2: DexScreener Fallback
    try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`);
        if (dexRes.ok) {
            const dexData = await dexRes.json();
            // Get the most liquid pair
            const pairs = dexData.pairs || [];
            if (pairs.length > 0) {
                const bestPair = pairs.sort((a: any, b: any) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0))[0];
                return {
                    id: bestPair.baseToken.address,
                    name: bestPair.baseToken.name,
                    symbol: bestPair.baseToken.symbol,
                    price: parseFloat(bestPair.priceUsd),
                    change24h: parseFloat(bestPair.priceChange?.h24 || 0),
                    volume24h: parseFloat(bestPair.volume?.h24 || 0),
                    source: 'DEXSCREENER',
                    icon: bestPair.info?.imageUrl || ''
                };
            }
        }
    } catch (e) {
        console.error("DexScreener fetch failed", e);
    }

    throw new Error(`Coin ${query} not found in Binance or DexScreener`);
};
