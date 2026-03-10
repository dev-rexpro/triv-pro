// @ts-nocheck
import React, { useMemo } from 'react';
import CoinIcon from './CoinIcon';
import {
    FiChevronRight as ChevronRight,
    FiShare2 as Share,
    FiEdit2 as Edit2,
} from 'react-icons/fi';

// ─── AssetPositionCard ──────────────────────────────────
interface AssetPositionCardProps {
    symbol: string;
    amount: number;
    lastPrice: number;
}

export const AssetPositionCard = React.memo(({ symbol, amount, lastPrice }: AssetPositionCardProps) => {
    const randomGain = useMemo(() => 3 + Math.random() * 4, []);
    const costPrice = lastPrice / (1 + randomGain);
    const pnl = (lastPrice - costPrice) * amount;
    const pnlPercent = randomGain * 100;

    return (
        <div className="mb-8 border-b border-slate-50 pb-6 last:border-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                    <CoinIcon symbol={symbol} size={6} />
                    <span className="font-bold text-[18px] text-slate-900 tracking-tight">{symbol}</span>
                    <ChevronRight size={16} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-b border-dashed border-[#00C076] pb-0.5">
                        <span className="text-[#00C076] font-bold text-[14px]">+{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[#00C076] font-bold text-[14px]">({pnlPercent.toFixed(2)}%)</span>
                    </div>
                    <Share size={16} className="text-slate-400" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1 border-b border-dashed border-slate-200 inline-block">Equity</div>
                    <div className="font-bold text-[16px] text-slate-900 leading-tight">{amount.toFixed(4)}</div>
                    <div className="text-[12px] text-slate-400 font-medium">${(amount * lastPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                </div>
                <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1 border-b border-dashed border-slate-200 inline-block">Cost price</div>
                    <div className="font-bold text-[16px] text-slate-900 leading-tight">
                        ${costPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-400 mb-1 border-b border-dashed border-slate-200 inline-block">Last price</div>
                    <div className="font-bold text-[16px] text-slate-900">${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1 border-b border-dashed border-slate-200 inline-block">Balance</div>
                <div className="font-bold text-[16px] text-slate-900 leading-tight">{amount.toFixed(4)}</div>
                <div className="text-[12px] text-slate-400 font-medium">${(amount * lastPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
            </div>

            <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-[#F5F7F9] py-2.5 rounded-full text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors">TP/SL</button>
                <button className="flex-1 bg-[#F5F7F9] py-2.5 rounded-full text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors">Buy/Sell</button>
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
    const sideColor = isBuy ? 'text-[#00C076] bg-[#00C076]/10' : 'text-[#FF4D5B] bg-[#FF4D5B]/10';

    return (
        <div className="mb-6 border-b border-slate-50 pb-6 last:border-0">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-[16px] text-slate-900 tracking-tight">{order.symbol}</span>
                    <ChevronRight size={16} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
                    <Edit2 size={14} className="text-slate-900" />
                    <div className="h-3 w-[1px] bg-slate-200"></div>
                    <span>Chase</span>
                    <div className="h-3 w-[1px] bg-slate-200"></div>
                    <span>Cancel</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-bold ${sideColor} px-1.5 py-0.5 rounded`}>Limit</span>
                <span className={`text-[11px] font-bold ${sideColor} px-1.5 py-0.5 rounded`}>{order.side}</span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Isolated</span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">100x</span>
                <span className="text-[11px] font-medium text-slate-400 ml-1">{order.time}</span>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Order amount ({order.coin})</div>
                    <div className="font-bold text-[16px] text-slate-900">{order.amount}</div>
                </div>
                <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Filled ({order.coin})</div>
                    <div className="font-bold text-[16px] text-slate-900">{order.filled}</div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Order price</div>
                    <div className="font-bold text-[16px] text-slate-900">{order.price}</div>
                </div>
            </div>
        </div>
    )
});

PendingOrderCard.displayName = 'PendingOrderCard';
