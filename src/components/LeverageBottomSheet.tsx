// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose as XIcon } from 'react-icons/io5';
import { FiPlus, FiMinus } from 'react-icons/fi';

interface LeverageBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    currentLeverage: number;
    onLeverageChange: (leverage: number) => void;
    maxLeverage?: number;
    availableBalance: number;
    currentPrice: number;
    symbol: string;
    mmr?: number;
    side?: 'buy' | 'sell';
}

const LeverageBottomSheet: React.FC<LeverageBottomSheetProps> = ({
    isOpen,
    onClose,
    currentLeverage,
    onLeverageChange,
    maxLeverage = 100,
    availableBalance,
    currentPrice,
    symbol,
    mmr = 0.005,
    side = 'buy'
}) => {
    const [tempLeverage, setTempLeverage] = useState(currentLeverage);

    useEffect(() => {
        if (isOpen) {
            setTempLeverage(currentLeverage);
        }
    }, [isOpen, currentLeverage]);

    const presets = useMemo(() => {
        const standardPresets = [5, 10, 20, 30, 50, 75, 100, 125];
        const filtered = standardPresets.filter(p => p <= maxLeverage);
        if (filtered.length === 0 || !filtered.includes(maxLeverage)) {
            if (!filtered.includes(maxLeverage)) {
                filtered.push(maxLeverage);
            }
        }
        return Array.from(new Set(filtered)).sort((a, b) => a - b);
    }, [maxLeverage]);

    const handleAdjust = (delta: number) => {
        const next = Math.max(1, Math.min(maxLeverage, tempLeverage + delta));
        setTempLeverage(next);
    };

    const maxPositionSize = (availableBalance * tempLeverage).toFixed(2);
    
    // Real calculation: Margin = Notional / Leverage
    // Here we show margin for the MAX position possible
    const marginRequired = availableBalance.toFixed(2); 

    // Liq price calc: 
    // Long: Entry * (1 - 1/Lev + MMR)
    // Short: Entry * (1 + 1/Lev - MMR)
    const dMMR = mmr;
    const estLiqPrice = side === 'buy'
        ? (currentPrice * (1 - 1 / tempLeverage + dMMR)).toFixed(2)
        : (currentPrice * (1 + 1 / tempLeverage - dMMR)).toFixed(2);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[var(--overlay-bg)] z-[1000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] px-6 pt-3 pb-8"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Adjust leverage</h2>
                            <button onClick={onClose} className="p-1">
                                <span className="w-6 h-6 text-[var(--text-tertiary)] flex items-center justify-center">
                                    <XIcon size={24} />
                                </span>
                            </button>
                        </div>

                        {/* Current Display */}
                        <div className="flex flex-col items-center mb-4">
                            <span className="text-[13px] text-[var(--text-secondary)] font-medium mb-1">
                                Current <span className="text-[var(--text-primary)] font-medium">{currentLeverage}x</span>
                            </span>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleAdjust(-1)}
                                    className="w-10 h-10 rounded-[12px] bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-transform"
                                >
                                    <span className="flex items-center justify-center">
                                        <FiMinus size={20} style={{ strokeWidth: '2.5px' }} />
                                    </span>
                                </button>

                                <div className="flex items-baseline gap-1">
                                    <span className="text-[42px] font-medium text-[var(--text-primary)] leading-none tracking-tight">
                                        {tempLeverage.toFixed(2)}
                                    </span>
                                    <span className="text-[16px] font-medium text-[var(--text-primary)] mb-1.5">x</span>
                                </div>

                                <button
                                    onClick={() => handleAdjust(1)}
                                    className="w-10 h-10 rounded-[12px] bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-transform"
                                >
                                    <span className="flex items-center justify-center">
                                        <FiPlus size={20} style={{ strokeWidth: '2.5px' }} />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full p-1 mb-4 overflow-hidden">
                            {presets.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setTempLeverage(p)}
                                    className={`flex-1 py-1 text-[13px] font-medium rounded-full transition-all duration-200 ${tempLeverage === p
                                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                >
                                    {p}x
                                </button>
                            ))}
                        </div>

                        {/* Stats Information */}
                        <div className="bg-[var(--bg-secondary)] rounded-[12px] p-3 flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-start">
                                <span className="text-[12px] text-[var(--text-secondary)] font-medium leading-[1.2] max-w-[180px]">
                                    Max position size
                                </span>
                                <span className="text-[12px] text-[var(--text-primary)] font-medium">{maxPositionSize} USDT</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[var(--text-secondary)] font-medium">Margin required</span>
                                <span className="text-[12px] text-[var(--text-primary)] font-medium">{marginRequired} USDT</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[var(--text-secondary)] font-medium">Est. liq. price</span>
                                <span className="text-[12px] text-[var(--text-primary)] font-medium">₮{estLiqPrice}</span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={() => {
                                onLeverageChange(tempLeverage);
                                onClose();
                            }}
                            className="w-full py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold text-[16px] shadow-sm transform transition-all active:scale-[0.98] active:brightness-95 h-[50px] flex items-center justify-center"
                        >
                            Confirm
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LeverageBottomSheet;
