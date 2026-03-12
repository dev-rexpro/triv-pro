import React from 'react';
import CoinIcon from './CoinIcon';
import useExchangeStore from '../stores/useExchangeStore';
import { formatCurrency, getCurrencySymbol, formatPrice } from '../utils/format';

interface MarketRowProps {
    coin: any;
    showPerp?: boolean;
    onClick?: () => void;
}

const MarketRow = React.memo(({ coin, showPerp = true, onClick }: MarketRowProps) => {
    const { currency: globalCurrency, rates } = useExchangeStore();
    const currency = (globalCurrency === 'BTC' || globalCurrency === 'USDT') ? 'USD' : globalCurrency;
    const changePercent = parseFloat(coin.priceChangePercent);
    const isPositive = changePercent >= 0;

    return (
        <div
            onClick={onClick}
            className="flex justify-between items-center py-3 last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors -mx-4 px-4"
        >
            <div className="flex items-center gap-3">
                <CoinIcon symbol={coin.symbol} size={8} />
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[15px] text-[var(--text-primary)] uppercase">{showPerp ? coin.symbol : coin.symbol.replace('USDT', '')}</span>
                        {showPerp ? (
                            <span className="text-[10px] bg-[#faad14]/15 text-[#faad14] px-1.5 py-[2px] rounded font-bold uppercase leading-none">Perp</span>
                        ) : (
                            <span className="text-[12px] text-[var(--text-tertiary)] font-medium">/USDT</span>
                        )}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5 flex items-center gap-1">
                        <span className="text-[var(--text-tertiary)]">{getCurrencySymbol(currency)}</span>
                        {((parseFloat(coin.quoteVolume) * (rates[currency] || 1)) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-medium text-[15px] text-[var(--text-primary)]">{formatPrice(coin.lastPrice)}</div>
                    <div className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5">{formatCurrency(parseFloat(coin.lastPrice), currency, rates)}</div>
                </div>
                <div className={`w-[72px] py-2 rounded-md text-[13px] font-bold text-center text-white ${isPositive ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`}>
                    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
            </div>
        </div>
    );
});

MarketRow.displayName = 'MarketRow';

export default MarketRow;
