// @ts-nocheck
import React from 'react';

interface TradingViewChartProps {
    symbol: string;
    interval?: string;
}

const TradingViewChart = ({ symbol, interval = '15m' }: TradingViewChartProps) => {
    return (
        <div className="w-full h-[300px] bg-[var(--bg-secondary)] rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,80 L10,75 L20,85 L30,60 L40,65 L50,40 L60,45 L70,20 L80,25 L90,5 L100,10" fill="none" stroke="#00C076" strokeWidth="1" />
                    <path d="M0,90 L10,85 L20,95 L30,70 L40,75 L50,50 L60,55 L70,30 L80,35 L90,15 L100,20" fill="none" stroke="#FF4D5B" strokeWidth="1" />
                </svg>
            </div>
            <div className="text-center z-10">
                <div className="text-[var(--text-tertiary)] text-[12px] font-medium mb-1">{symbol} ({interval})</div>
                <div className="text-[var(--text-tertiary)] text-[11px]">Chart mockup area</div>
            </div>

            {/* Mock Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none">
                {[...Array(36)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-[var(--border-color)]/50"></div>
                ))}
            </div>
        </div>
    );
};

export default TradingViewChart;
