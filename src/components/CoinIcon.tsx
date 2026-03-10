// @ts-nocheck
import React, { useState } from 'react';

interface CoinIconProps {
    symbol: string;
    size?: number;
    iconUrl?: string;
}

const CoinIcon = React.memo(({ symbol, size = 10, iconUrl }: CoinIconProps) => {
    const [errorCount, setErrorCount] = useState(0);

    React.useEffect(() => {
        setErrorCount(0);
    }, [symbol, iconUrl]);

    const clean = (symbol === 'USDT' || symbol === 'USDC') ? symbol.toLowerCase() : symbol?.replace('USDT', '').toLowerCase();

    // Size mapping for tailwind (since tailwind 4 might not pick up dynamic classes)
    const pixelSize = size * 4; // Assuming standard spacing scale (w-10 = 40px)

    const fallbacks = [
        iconUrl,
        `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${clean}.svg`,
        `https://static.okx.com/cdn/oksupport/asset/currency/icon/${clean}.png`, // OKX CDN
        `https://assets.coincap.io/assets/icons/${clean}@2x.png`, // CoinCap CDN
    ].filter(Boolean);

    const src = errorCount < fallbacks.length ? fallbacks[errorCount] : null;

    return (
        <div
            className="flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-slate-50"
            style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        >
            {src ? (
                <img
                    src={src}
                    onError={() => setErrorCount(prev => prev + 1)}
                    className="w-full h-full object-cover"
                    alt={symbol}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                    {clean?.substring(0, 2)}
                </div>
            )}
        </div>
    );
});

CoinIcon.displayName = 'CoinIcon';

export default CoinIcon;
