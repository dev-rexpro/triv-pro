export interface MarketData {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
    isFutures?: boolean;
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
    type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Trade' | 'Earn' | 'Stake';
    status: 'Pending' | 'On Process' | 'Completed' | 'Failed';
    amount: number;
    currency: string;
    network?: string;
    timestamp: number;
    from?: string;
    to?: string;
}

export interface TradeRecord {
    id: string;
    timestamp: number;
    symbol: string;
    pair?: string;
    side: 'Buy' | 'Sell';
    price: number;
    amount: number;
    fee?: number;
    pnl?: number;
    total?: number;
    type: 'Market' | 'Limit' | 'Liquidation';
}

export interface PendingOrder {
    id: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    timestamp: number;
    amount: number;
    filled: number;
    price: number;
    type: 'Limit' | 'Market';
}

export interface TriggerOrder {
    id: string;
    price: number;
    amount: number;
}

export interface TrailingStop {
    activationPrice: number;
    callbackRate: number;
    watermarkPrice: number;
    isActive: boolean;
}

export interface FuturesPosition {
    id: string;
    symbol: string;
    pair: string;
    side: 'Buy' | 'Sell' | 'Long' | 'Short';
    size: number;
    margin: number;
    entryPrice: number;
    markPrice?: number;
    leverage: number;
    liqPrice: number;
    pnl: number;
    pnlPercent: number;
    marginMode: 'Isolated' | 'Cross' | string;
    tpPrice?: number | null;
    slPrice?: number | null;
    tpOrders?: TriggerOrder[];
    slOrders?: TriggerOrder[];
    trailingStop?: TrailingStop;
}

export interface PositionHistoryRecord {
    id: string;
    pair: string;
    side: 'Buy' | 'Sell' | 'Long' | 'Short';
    size: number;
    margin: number;
    entryPrice: number;
    markPrice: number;
    leverage: number;
    pnl: number;
    pnlPercent: number;
    timeOpened: number;
    timeClosed: number;
    marginMode: string;
}

export interface SpotTPSL {
    symbol: string;
    tpPrice: number | null;
    slPrice: number | null;
    amount: number;
}

export type CurrencyCode = 'USD' | 'USDT' | 'BTC' | 'IDR';
