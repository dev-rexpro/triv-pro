// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
}

const LeverageBottomSheet: React.FC<LeverageBottomSheetProps> = ({
    isOpen,
    onClose,
    currentLeverage,
    onLeverageChange,
    maxLeverage = 100,
    availableBalance,
    currentPrice,
    symbol
}) => {
    const [tempLeverage, setTempLeverage] = useState(currentLeverage);

    useEffect(() => {
        if (isOpen) {
            setTempLeverage(currentLeverage);
        }
    }, [isOpen, currentLeverage]);

    const presets = [5, 10, 20, 30, 50, 75, 100];

    const handleAdjust = (delta: number) => {
        const next = Math.max(1, Math.min(maxLeverage, tempLeverage + delta));
        setTempLeverage(next);
    };

    const maxPositionSize = (availableBalance * tempLeverage).toFixed(0);
    const marginRequired = (availableBalance > 0 ? availableBalance / 10 : 0).toFixed(0); // Dummy calc to match UI
    // Liq price calc: Price * (1 - 1/leverage) for long roughly
    const estLiqPrice = (currentPrice * (1 - 1 / tempLeverage)).toFixed(0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-[1001] px-6 pt-2 pb-10"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[20px] font-semibold text-[#111111]">Adjust leverage</h2>
                            <button onClick={onClose} className="p-1">
                                <span className="w-6 h-6 text-[#999999] flex items-center justify-center">
                                    <XIcon size={24} />
                                </span>
                            </button>
                        </div>

                        {/* Current Display */}
                        <div className="flex flex-col items-center mb-8">
                            <span className="text-[14px] text-[#999999] font-medium mb-1">
                                Current <span className="text-[#111111] font-bold">{currentLeverage}x</span>
                            </span>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleAdjust(-1)}
                                    className="w-10 h-10 rounded-[12px] bg-[#f5f5f5] flex items-center justify-center text-[#111111] active:scale-95 transition-transform"
                                >
                                    <span className="flex items-center justify-center">
                                        <FiMinus size={20} style={{ strokeWidth: '2.5px' }} />
                                    </span>
                                </button>

                                <div className="flex items-baseline gap-1">
                                    <span className="text-[48px] font-bold text-[#111111] leading-none tracking-tight">
                                        {tempLeverage.toFixed(2)}
                                    </span>
                                    <span className="text-[18px] font-medium text-[#111111] mb-1.5">x</span>
                                </div>

                                <button
                                    onClick={() => handleAdjust(1)}
                                    className="w-10 h-10 rounded-[12px] bg-[#f5f5f5] flex items-center justify-center text-[#111111] active:scale-95 transition-transform"
                                >
                                    <span className="flex items-center justify-center">
                                        <FiPlus size={20} style={{ strokeWidth: '2.5px' }} />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="flex items-center justify-between bg-white border border-[#eeeeee] rounded-full p-1 mb-8 overflow-hidden">
                            {presets.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setTempLeverage(p)}
                                    className={`flex-1 py-2 text-[14px] font-bold rounded-full transition-all duration-200 ${tempLeverage === p
                                        ? 'bg-[#111111] text-white shadow-sm'
                                        : 'text-[#111111] hover:bg-gray-50'
                                        }`}
                                >
                                    {p}x
                                </button>
                            ))}
                        </div>

                        {/* Stats Information */}
                        <div className="bg-[#f9f9f9] rounded-[16px] p-5 flex flex-col gap-4 mb-10">
                            <div className="flex justify-between items-start">
                                <span className="text-[14px] text-[#888888] font-medium leading-[1.2] max-w-[180px]">
                                    Max position size at adjusted leverage
                                </span>
                                <span className="text-[14px] text-[#111111] font-bold">{maxPositionSize} USDT</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-[#888888] font-medium">Margin required</span>
                                <span className="text-[14px] text-[#111111] font-bold">{marginRequired} USDT</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-[#888888] font-medium">Estimated liquidation price</span>
                                <span className="text-[14px] text-[#111111] font-bold">₮{estLiqPrice}</span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={() => {
                                onLeverageChange(tempLeverage);
                                onClose();
                            }}
                            className="w-full py-4.5 bg-[#2b6a15] text-white rounded-full font-bold text-[16px] shadow-sm transform transition-all active:scale-[0.98] active:brightness-95 h-[56px] flex items-center justify-center"
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
