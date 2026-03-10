export interface MarketData {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
    [key: string]: any;
}

export interface Asset {
    symbol: string;
    amount: number;
    valueUsdt: number;
}

export interface ExchangeRates {
    USD: number;
    USDT: number;
    IDR: number;
    BTC: number;
    [key: string]: number;
}

export interface FavoriteGroups {
    [groupName: string]: string[];
}

// ---- DEMO TRADING ENGINE TYPES ----

export interface UnifiedCoin {
    id: string; // Symbol for CEX (e.g., BTCUSDT) or Contract Address for DEX
    name: string;
    symbol: string; // Base symbol (e.g., BTC, RIVER)
    price: number;
    change24h: number;
    volume24h: number;
    source: 'BINANCE' | 'DEXSCREENER';
    icon: string;
}

export interface WalletBalances {
    [currency: string]: number; // e.g., { USDT: 5000, BTC: 0.1 }
}

export interface TransactionRecord {
    id: string;
    type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Earn';
    status: 'Pending' | 'On Process' | 'Completed' | 'Failed';
    amount: number;
    currency: string;
    network?: string;
    timestamp: number;
    from?: string; // e.g., 'Spot'
    to?: string;   // e.g., 'Futures'
}

export interface TradeRecord {
    id: string;
    timestamp: number;
    pair: string; // e.g., BTCUSDT
    side: 'Buy' | 'Sell';
    price: number;
    amount: number;
    total: number;
    type: 'Market' | 'Limit';
}

export interface PendingOrder {
    id: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    time: number;
    amount: number;
    filled: number;
    price: number;
    type: 'Limit';
}

export interface FuturesPosition {
    id: string;
    pair: string;
    side: 'Long' | 'Short';
    size: number;
    margin: number;
    entryPrice: number;
    leverage: number;
    liqPrice?: number;
    unrealizedPnl?: number; // Calculated dynamically
}

export type CurrencyCode = 'USD' | 'USDT' | 'BTC' | 'IDR';
