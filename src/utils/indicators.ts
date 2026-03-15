/**
 * Calculation utilities for Technical Indicators
 */

/**
 * Simple Moving Average (SMA)
 */
export const calculateSMA = (data: any[], period: number) => {
    const sma: any[] = [];
    if (data.length < period) return sma;

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        sma.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return sma;
};

/**
 * Exponential Moving Average (EMA)
 */
export const calculateEMA = (data: any[], period: number) => {
    const ema: any[] = [];
    if (data.length === 0) return ema;

    const k = 2 / (period + 1);
    let prevEma = data[0].close;

    // Initial EMA is just the first price (or SMA if we wanted to be more precise)
    ema.push({ time: data[0].time, value: prevEma });

    for (let i = 1; i < data.length; i++) {
        prevEma = (data[i].close - prevEma) * k + prevEma;
        ema.push({
            time: data[i].time,
            value: prevEma
        });
    }
    return ema;
};

/**
 * Bollinger Bands (BOLL)
 */
export const calculateBollingerBands = (data: any[], period: number, stdDev: number = 2) => {
    const upper: any[] = [];
    const middle: any[] = [];
    const lower: any[] = [];

    if (data.length < period) return { upper, middle, lower };

    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
        const avg = sum / period;
        
        const squareDiffs = slice.map(s => Math.pow(s.close - avg, 2));
        const variance = squareDiffs.reduce((acc, curr) => acc + curr, 0) / period;
        const sd = Math.sqrt(variance);

        middle.push({ time: data[i].time, value: avg });
        upper.push({ time: data[i].time, value: avg + stdDev * sd });
        lower.push({ time: data[i].time, value: avg - stdDev * sd });
    }

    return { upper, middle, lower };
};

/**
 * Volume (VOL)
 */
export const calculateVolume = (data: any[]) => {
    return data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(32, 178, 108, 0.3)' : 'rgba(239, 69, 74, 0.3)'
    }));
};

/**
 * Parabolic SAR
 */
export const calculateSAR = (data: any[], step: number = 0.02, maxStep: number = 0.2) => {
    const sar: any[] = [];
    if (data.length < 2) return sar;

    let isLong = data[1].close > data[0].close;
    let extremePoint = isLong ? data[0].high : data[0].low;
    let accelerationFactor = step;
    let currentSar = isLong ? data[0].low : data[0].high;

    sar.push({ time: data[0].time, value: currentSar });

    for (let i = 1; i < data.length; i++) {
        const nextSar = currentSar + accelerationFactor * (extremePoint - currentSar);
        
        if (isLong) {
            if (data[i].low < nextSar) {
                isLong = false;
                currentSar = extremePoint;
                extremePoint = data[i].low;
                accelerationFactor = step;
            } else {
                currentSar = nextSar;
                if (data[i].high > extremePoint) {
                    extremePoint = data[i].high;
                    accelerationFactor = Math.min(accelerationFactor + step, maxStep);
                }
            }
        } else {
            if (data[i].high > nextSar) {
                isLong = true;
                currentSar = extremePoint;
                extremePoint = data[i].high;
                accelerationFactor = step;
            } else {
                currentSar = nextSar;
                if (data[i].low < extremePoint) {
                    extremePoint = data[i].low;
                    accelerationFactor = Math.min(accelerationFactor + step, maxStep);
                }
            }
        }

        sar.push({ time: data[i].time, value: currentSar });
    }
    return sar;
};

/**
 * ATR (Average True Range) helper
 */
const calculateATR = (data: any[], period: number) => {
    const tr: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const hl = data[i].high - data[i].low;
        const hpc = Math.abs(data[i].high - data[i - 1].close);
        const lpc = Math.abs(data[i].low - data[i - 1].close);
        tr.push(Math.max(hl, hpc, lpc));
    }

    const atr: any[] = [];
    let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push({ time: data[period].time, value: sum / period });

    for (let i = period + 1; i < data.length; i++) {
        const prevAtr = atr[atr.length - 1].value;
        const currentAtr = (prevAtr * (period - 1) + tr[i - 1]) / period;
        atr.push({ time: data[i].time, value: currentAtr });
    }
    return atr;
};

/**
 * Supertrend
 */
export const calculateSupertrend = (data: any[], period: number = 10, multiplier: number = 3) => {
    const atr = calculateATR(data, period);
    const supertrend: any[] = [];
    
    if (atr.length === 0) return supertrend;

    let prevUpper = 0;
    let prevLower = 0;
    let prevTrend = 1; // 1 for up, -1 for down
    let prevSupertrend = 0;

    // Find the starting index in data that matches the first ATR entry
    const startIdx = data.findIndex(d => d.time === atr[0].time);

    for (let i = 0; i < atr.length; i++) {
        const currentData = data[startIdx + i];
        const currentAtr = atr[i].value;
        const hl2 = (currentData.high + currentData.low) / 2;

        let upper = hl2 + multiplier * currentAtr;
        let lower = hl2 - multiplier * currentAtr;

        if (i > 0) {
            const prevClose = data[startIdx + i - 1].close;
            upper = (upper < prevUpper || prevClose > prevUpper) ? upper : prevUpper;
            lower = (lower > prevLower || prevClose < prevLower) ? lower : prevLower;
        }

        let trend = prevTrend;
        if (prevTrend === 1 && currentData.close < lower) trend = -1;
        else if (prevTrend === -1 && currentData.close > upper) trend = 1;

        const val = trend === 1 ? lower : upper;
        
        supertrend.push({
            time: currentData.time,
            value: val,
            color: trend === 1 ? '#20b26c' : '#ef454a'
        });

        prevUpper = upper;
        prevLower = lower;
        prevTrend = trend;
        prevSupertrend = val;
    }

    return supertrend;
};

/**
 * Support & Resistance (RESIST)
 */
export const calculateSupportResistance = (data: any[]) => {
    const levels: any[] = [];
    if (data.length < 20) return levels;

    // Simplified: Find local peaks and valleys in the last 100 bars
    const window = 5;
    const recentData = data.slice(-100);
    
    for (let i = window; i < recentData.length - window; i++) {
        const current = recentData[i];
        const left = recentData.slice(i - window, i);
        const right = recentData.slice(i + 1, i + window + 1);

        // Peak (Resistance)
        if (left.every(d => d.high < current.high) && right.every(d => d.high < current.high)) {
            levels.push({ time: current.time, value: current.high, type: 'resistance' });
        }
        // Valley (Support)
        if (left.every(d => d.low > current.low) && right.every(d => d.low > current.low)) {
            levels.push({ time: current.time, value: current.low, type: 'support' });
        }
    }

    return levels;
};

/**
 * Envelope
 */
export const calculateEnvelope = (data: any[], period: number = 20, percent: number = 2.5) => {
    const sma = calculateSMA(data, period);
    const upper: any[] = [];
    const lower: any[] = [];

    sma.forEach(s => {
        upper.push({ time: s.time, value: s.value * (1 + percent / 100) });
        lower.push({ time: s.time, value: s.value * (1 - percent / 100) });
    });

    return { upper, lower };
};
