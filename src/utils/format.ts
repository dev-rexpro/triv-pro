import type { ExchangeRates, CurrencyCode } from '../types';
import Decimal from 'decimal.js';

/**
 * LOGIKA ENGINE EXCHANGE:
 * Semakin murah harga koin, presisi desimal (Tick Size) harus semakin panjang.
 */
export const getPrecisionForPrice = (price: number): number => {
    const p = Math.abs(price);
    if (p >= 1000) return 2;     // BTC, ETH (contoh: 65000.50)
    if (p >= 50) return 3;       // SOL, LTC (contoh: 145.125)
    if (p >= 1) return 4;        // ADA, MATIC (contoh: 1.1234)
    if (p >= 0.1) return 5;      // DOGE, TRX (contoh: 0.09452)
    if (p >= 0.001) return 6;    // Koin micin standar
    if (p >= 0.00001) return 8;  // Koin meme (SHIB)
    return 10;                   // Koin PEPE dll
};

/**
 * Rounds a value safely. Smart detect if type is 'auto'.
 */
export const formatPrecise = (value: number, type: 'crypto' | 'fiat' | 'auto' = 'auto'): string => {
    try {
        const d = new Decimal(value);
        if (type === 'fiat') return d.toFixed(2, Decimal.ROUND_DOWN);
        if (type === 'crypto') return d.toDecimalPlaces(8, Decimal.ROUND_DOWN).toFixed();
        
        // Auto-detect untuk engine trading
        const precision = getPrecisionForPrice(value);
        return d.toDecimalPlaces(precision, Decimal.ROUND_DOWN).toFixed();
    } catch {
        return type === 'fiat' ? Number(value).toFixed(2) : String(value);
    }
};

/**
 * Safely rounds a number. Jika decimals tidak diisi, otomatis ikutin standar harga koin.
 */
export const roundToFixed = (value: number, decimals?: number): number => {
    try {
        const numValue = new Decimal(value);
        const targetDecimals = decimals !== undefined ? decimals : getPrecisionForPrice(value);
        return numValue.toDecimalPlaces(targetDecimals, Decimal.ROUND_DOWN).toNumber();
    } catch {
        return parseFloat(Number(value).toFixed(decimals || 2));
    }
};

export const formatPrice = (price: string | number, enforcePrecision?: number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num === 0) return '0.00';
    
    // Kalau komponen maksa presisi tertentu, pake itu
    if (enforcePrecision !== undefined) {
        return num.toLocaleString('en-US', { minimumFractionDigits: enforcePrecision, maximumFractionDigits: enforcePrecision });
    }

    // Kalau nggak, deteksi otomatis
    const precision = getPrecisionForPrice(num);
    return num.toLocaleString('en-US', { 
        minimumFractionDigits: precision < 4 ? 2 : precision, 
        maximumFractionDigits: precision 
    });
};

export const formatVolume = (volume: string | number): string => {
    const num = typeof volume === 'string' ? parseFloat(volume) : volume;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
    return num.toLocaleString();
};

export const formatAbbreviated = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    if (num >= 1) return num.toFixed(2);
    return num.toFixed(5);
};

export const formatPercent = (percent: string | number): string => {
    const num = typeof percent === 'string' ? parseFloat(percent) : percent;
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const formatCurrency = (
    amount: number,
    currency: CurrencyCode,
    rates: ExchangeRates
): string => {
    const rate = rates[currency] || 1;
    const converted = amount * rate;

    switch (currency) {
        case 'IDR':
            return `Rp${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        case 'BTC':
            return `₿${converted.toFixed(8)}`;
        case 'USDT':
            return `${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
        case 'USD':
        default:
            return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};

export const getCurrencySymbol = (currency: CurrencyCode): string => {
    switch (currency) {
        case 'IDR': return 'Rp ';
        case 'BTC': return '₿';
        case 'USDT': return '$';
        case 'USD':
        default: return '$';
    }
};

export const convertAmount = (
    amountUsdt: number,
    targetCurrency: CurrencyCode,
    rates: ExchangeRates
): number => {
    const rate = rates[targetCurrency] || 1;
    return amountUsdt * rate;
};
