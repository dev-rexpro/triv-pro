import type { ExchangeRates, CurrencyCode } from '../types';
import Decimal from 'decimal.js';

/**
 * Rounds a value using Decimal.js precision.
 * type 'crypto' → up to 8 decimals, trimmed; type 'fiat' → exactly 2 decimals.
 */
export const formatPrecise = (value: number, type: 'crypto' | 'fiat' = 'fiat'): string => {
    try {
        const d = new Decimal(value);
        if (type === 'crypto') {
            return d.toDecimalPlaces(8, Decimal.ROUND_DOWN).toFixed();
        }
        return d.toFixed(2, Decimal.ROUND_DOWN);
    } catch {
        return type === 'fiat' ? Number(value).toFixed(2) : String(value);
    }
};

/**
 * Safely rounds a number to N decimal places using Decimal.js.
 */
export const roundToFixed = (value: number, decimals = 2): number => {
    try {
        return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_DOWN).toNumber();
    } catch {
        return parseFloat(value.toFixed(decimals));
    }
};

export const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num === 0) return '0.00';
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (num >= 50) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    if (num >= 1) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (num >= 0.1) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 });
    if (num >= 0.01) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    if (num >= 0.0001) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 10 });
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

    switch (currency) {
        case 'IDR':
            return `Rp${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        case 'BTC':
            return `₿${(amount * rate).toFixed(8)}`;
        case 'USDT':
            return `${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
        case 'USD':
        default:
            return `$${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};

export const getCurrencySymbol = (currency: CurrencyCode): string => {
    switch (currency) {
        case 'IDR': return 'Rp ';
        case 'BTC': return '$';
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
