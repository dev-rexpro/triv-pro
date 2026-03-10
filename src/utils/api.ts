import type { MarketData, ExchangeRates } from '../types';

// Coin name mapping for name-based search (common name -> symbol prefix)
export const COIN_NAME_MAP: Record<string, string> = {
    bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA', ripple: 'XRP',
    stellar: 'XLM', dogecoin: 'DOGE', polkadot: 'DOT', polygon: 'MATIC', avalanche: 'AVAX',
    chainlink: 'LINK', litecoin: 'LTC', uniswap: 'UNI', cosmos: 'ATOM', near: 'NEAR',
    tron: 'TRX', shiba: 'SHIB', pepe: 'PEPE', arbitrum: 'ARB', optimism: 'OP',
    filecoin: 'FIL', aave: 'AAVE', maker: 'MKR', injective: 'INJ', aptos: 'APT',
    sui: 'SUI', celestia: 'TIA', sei: 'SEI', bonk: 'BONK', render: 'RNDR',
    fantom: 'FTM', hedera: 'HBAR', vechain: 'VET', algorand: 'ALGO', sandbox: 'SAND',
    mana: 'MANA', decentraland: 'MANA', axie: 'AXS', gala: 'GALA', enjin: 'ENJ',
    theta: 'THETA', iota: 'IOTA', neo: 'NEO', zilliqa: 'ZIL', dash: 'DASH',
    bnb: 'BNB', binance: 'BNB', tether: 'USDT', toncoin: 'TON', kaspa: 'KAS',
    fetch: 'FET', worldcoin: 'WLD', jupiter: 'JUP', jito: 'JTO', pyth: 'PYTH',
    wif: 'WIF', floki: 'FLOKI', memecoin: 'MEME', blur: 'BLUR', starknet: 'STRK',
    mantle: 'MNT', beam: 'BEAM', ronin: 'RON', immutable: 'IMX', lido: 'LDO',
    pendle: 'PENDLE', renzo: 'REZ', ethena: 'ENA', ondo: 'ONDO', wormhole: 'W',
    bittensor: 'TAO', arweave: 'AR', eigenlayer: 'EIGEN', hyperliquid: 'HYPE',
};

// Represents a single Binance symbol entry from exchangeInfo
export interface BinanceSymbolInfo {
    symbol: string;      // e.g. 'BTCUSDT'
    baseAsset: string;   // e.g. 'BTC'
    quoteAsset: string;  // e.g. 'USDT'
    type: 'spot' | 'futures';
}

// Fetch ALL active Spot + Futures symbols from exchangeInfo
export const fetchExchangeInfo = async (): Promise<{ spotSymbols: BinanceSymbolInfo[]; futuresSymbols: BinanceSymbolInfo[] }> => {
    const [spot, futures] = await Promise.all([
        fetch('https://api.binance.com/api/v3/exchangeInfo').then(r => r.json()),
        fetch('https://fapi.binance.com/fapi/v1/exchangeInfo').then(r => r.json())
    ]);

    const spotSymbols: BinanceSymbolInfo[] = spot.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
        .map((s: any) => ({
            symbol: s.symbol,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            type: 'spot' as const
        }));

    const futuresSymbols: BinanceSymbolInfo[] = futures.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
        .map((s: any) => ({
            symbol: s.symbol,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            type: 'futures' as const
        }));

    return { spotSymbols, futuresSymbols };
};

export const fetchBinanceTicker = async (): Promise<MarketData[]> => {
    const r = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const d = await r.json();
    return d
        .filter((p: any) => p.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
};

export const fetchBinanceFuturesTicker = async (): Promise<MarketData[]> => {
    const r = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    const d = await r.json();
    return d
        .filter((p: any) => p.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
};

export const fetchSingleTicker = async (symbol: string, type: 'spot' | 'futures'): Promise<MarketData | null> => {
    try {
        const base = type === 'futures' ? 'https://fapi.binance.com/fapi/v1' : 'https://api.binance.com/api/v3';
        const r = await fetch(`${base}/ticker/24hr?symbol=${symbol}`);
        if (!r.ok) return null;
        return await r.json();
    } catch {
        return null;
    }
};

export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
    try {
        const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const d = await r.json();
        return d.rates;
    } catch {
        return { USD: 1, USDT: 1, IDR: 16300, BTC: 0.000015 };
    }
};

export const searchDexScreener = async (query: string): Promise<any[]> => {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
    const data = await res.json();
    return data.pairs || [];
};

// Fetch candlestick (kline) data for charts
export const fetchKlines = async (
    symbol: string,
    interval: string = '1h',
    limit: number = 200,
    type: 'spot' | 'futures' = 'spot'
): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> => {
    const base = type === 'futures' ? 'https://fapi.binance.com/fapi/v1' : 'https://api.binance.com/api/v3';
    const r = await fetch(`${base}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const d = await r.json();
    return d.map((k: any) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
    }));
};

// Fetch order book depth data
export const fetchOrderBook = async (
    symbol: string,
    limit: number = 20,
    type: 'spot' | 'futures' = 'spot'
): Promise<{ bids: [string, string][]; asks: [string, string][] }> => {
    const base = type === 'futures' ? 'https://fapi.binance.com/fapi/v1' : 'https://api.binance.com/api/v3';
    const r = await fetch(`${base}/depth?symbol=${symbol}&limit=${limit}`);
    const d = await r.json();
    return { bids: d.bids || [], asks: d.asks || [] };
};
