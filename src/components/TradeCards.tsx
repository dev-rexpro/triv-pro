// @ts-nocheck
import React, { useMemo } from 'react';
import CoinIcon from './CoinIcon';
import { formatPrice } from '../utils/format';
import {
    FiChevronRight as ChevronRight,
    FiShare2 as Share,
    FiEdit2 as Edit2,
} from 'react-icons/fi';
import useExchangeStore from '../stores/useExchangeStore';
import type { Asset } from '../types';

// ─── AssetPositionCard ──────────────────────────────────
interface AssetPositionCardProps {
    symbol: string;
    amount: number;
    lastPrice: number;
}

export const AssetPositionCard = React.memo(({ symbol, amount, lastPrice }: AssetPositionCardProps) => {
    const { setSpotTradeSheetOpen } = useExchangeStore();
    const randomGain = useMemo(() => 3 + Math.random() * 4, []);
    const costPrice = lastPrice / (1 + randomGain);
    const pnl = (lastPrice - costPrice) * amount;
    const pnlPercent = randomGain * 100;

    return (
        <div className="mb-8 border-b border-[var(--border-color)] pb-6 last:border-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                    <CoinIcon symbol={symbol} size={6} />
                    <span className="font-bold text-[18px] text-[var(--text-primary)] tracking-tight">{symbol}</span>
                    <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-b border-dashed border-[var(--tag-border)] pb-0.5">
                        <span className="text-[var(--green)] font-bold text-[14px]">+{formatPrice(pnl)}</span>
                        <span className="text-[var(--green)] font-bold text-[14px]">({pnlPercent.toFixed(2)}%)</span>
                    </div>
                    <Share size={16} className="text-[var(--text-tertiary)]" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1 border-b border-dashed border-slate-200 inline-block">Equity</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)] leading-tight">{amount.toFixed(4)}</div>
                    <button 
                    className="flex-1 py-1.5 bg-[#1b1b1b] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                    onClick={() => {
                        const asset: Asset = {
                            symbol: symbol,
                            balance: amount,
                            usdValue: amount * lastPrice,
                            price: lastPrice,
                            type: 'spot',
                            pnl: pnl,
                            pnlPercent: pnlPercent,
                            costPrice: costPrice
                        };
                        setSpotTradeSheetOpen(true, asset);
                    }}
                >
                    Buy/Sell
                </button>
                </div>
                <div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1 border-b border-dashed border-slate-200 inline-block">Cost price</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)] leading-tight">
                        ${formatPrice(costPrice)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1 border-b border-dashed border-slate-200 inline-block">Last price</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)]">${formatPrice(lastPrice)}</div>
                </div>
            </div>

            <div>
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1 border-b border-dashed border-slate-200 inline-block">Balance</div>
                <div className="font-bold text-[16px] text-[var(--text-primary)] leading-tight">{amount.toFixed(4)}</div>
                <div className="text-[12px] text-[var(--text-tertiary)] font-medium">${formatPrice(amount * lastPrice)}</div>
            </div>

            <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-[var(--bg-secondary)] py-2.5 rounded-full text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">TP/SL</button>
                <button className="flex-1 bg-[var(--bg-secondary)] py-2.5 rounded-full text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">Buy/Sell</button>
            </div>
        </div>
    );
});

AssetPositionCard.displayName = 'AssetPositionCard';


// ─── PendingOrderCard ──────────────────────────────────
interface PendingOrderCardProps {
    order: any;
}

export const PendingOrderCard = React.memo(({ order }: PendingOrderCardProps) => {
    const isBuy = order.side === 'Buy';
    const sideColor = isBuy ? 'text-[var(--green)] bg-[#00C076]/10' : 'text-[var(--red)] bg-[#FF4D5B]/10';

    return (
        <div className="mb-6 border-b border-[var(--border-color)] pb-6 last:border-0">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-[16px] text-[var(--text-primary)] tracking-tight">{order.symbol}</span>
                    <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-center gap-4 text-[13px] font-medium text-[var(--text-secondary)]">
                    <Edit2 size={14} className="text-[var(--text-primary)]" />
                    <div className="h-3 w-[1px] bg-[var(--bg-secondary)]"></div>
                    <span>Chase</span>
                    <div className="h-3 w-[1px] bg-[var(--bg-secondary)]"></div>
                    <span>Cancel</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-bold ${sideColor} px-1.5 py-0.5 rounded`}>Limit</span>
                <span className={`text-[11px] font-bold ${sideColor} px-1.5 py-0.5 rounded`}>{order.side}</span>
                <span className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">Isolated</span>
                <span className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">100x</span>
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] ml-1">{order.time}</span>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1">Order amount ({order.coin})</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)]">{order.amount}</div>
                </div>
                <div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1">Filled ({order.coin})</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)]">{order.filled}</div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1">Order price</div>
                    <div className="font-bold text-[16px] text-[var(--text-primary)]">{order.price}</div>
                </div>
            </div>
        </div>
    )
});

PendingOrderCard.displayName = 'PendingOrderCard';
