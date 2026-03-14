import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose as XIcon } from 'react-icons/io5';
import useExchangeStore from '../stores/useExchangeStore';
import Decimal from 'decimal.js';
import { formatPrice } from '../utils/format';

interface FuturesCloseSheetProps {
    isOpen: boolean;
    onClose: () => void;
    position: any;
}

const FuturesCloseSheet: React.FC<FuturesCloseSheetProps> = ({
    isOpen,
    onClose,
    position
}) => {
    const { closeFuturesPosition, markets, futuresMarkets } = useExchangeStore();
    const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
    const [priceInput, setPriceInput] = useState('');
    const [amountPercent, setAmountPercent] = useState(100);
    const [amountInput, setAmountInput] = useState('100%');
    const [isPriceFocused, setIsPriceFocused] = useState(false);

    useEffect(() => {
        if (isOpen && position) {
            setPriceInput(position.markPrice?.toString() || '');
            setAmountPercent(100);
            setAmountInput('100%');
            setOrderType('Market');
        }
    }, [isOpen, position]);

    if (!position) return null;

    const currentPrice = position.markPrice || position.entryPrice;
    const targetPrice = orderType === 'Market' ? currentPrice : parseFloat(priceInput) || currentPrice;
    const amountToClose = (position.size * amountPercent) / 100;

    // Estimate PnL
    // PnL = (ClosePrice - EntryPrice) * Size * (Side === 'Buy' ? 1 : -1)
    const sideMultiplier = position.side === 'Buy' ? 1 : -1;
    const estPnLRaw = (targetPrice - position.entryPrice) * amountToClose * sideMultiplier;
    
    // Fee estimate (proportional)
    const notionalValue = amountToClose * targetPrice;
    const estFee = notionalValue * 0.0005;
    const estPnL = estPnLRaw - estFee;

    const handlePercentageChange = (percent: number) => {
        setAmountPercent(percent);
        setAmountInput(`${percent}%`);
    };

    const handleConfirm = () => {
        closeFuturesPosition(position.id, amountToClose, orderType === 'Limit' ? parseFloat(priceInput) : undefined);
        onClose();
    };

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
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] px-6 pt-2 pb-10"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Close</h2>
                            <button onClick={onClose} className="p-1">
                                <span className="text-[var(--text-tertiary)]">
                                    <XIcon size={24} />
                                </span>
                            </button>
                        </div>

                        {/* Position Summary Sub-header */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[15px] font-bold text-[var(--text-primary)]">{position.symbol} Perp</span>
                            <span className={`text-[11px] font-bold px-1.5 py-[2px] rounded-[2px] ${position.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'}`}>
                                {position.side === 'Buy' ? 'Buy' : 'Sell'}
                            </span>
                            <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px] capitalize">
                                {position.marginMode}
                            </span>
                            <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">
                                {position.leverage}x
                            </span>
                        </div>

                        {/* Price Input Area */}
                        <div className="space-y-4 mb-6">
                            <div className="flex gap-2">
                                <div className={`flex-1 bg-[var(--input-bg)] rounded-lg px-3 h-[52px] flex flex-col justify-center border transition-colors ${isPriceFocused ? 'border-[var(--text-primary)]' : 'border-transparent'}`}>
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium leading-none mb-1">Price (USDT)</span>
                                    {orderType === 'Market' ? (
                                        <div className="font-bold text-[var(--text-primary)] text-[16px]">Market price</div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="bg-transparent font-bold text-[var(--text-primary)] text-[16px] outline-none w-full p-0 leading-none"
                                            value={priceInput}
                                            onChange={(e) => setPriceInput(e.target.value)}
                                            onFocus={() => setIsPriceFocused(true)}
                                            onBlur={() => setIsPriceFocused(false)}
                                        />
                                    )}
                                </div>
                                <button 
                                    className={`px-4 h-[52px] rounded-lg font-bold text-[14px] transition-colors ${orderType === 'Market' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]' : 'bg-[var(--input-bg)] text-[var(--text-secondary)]'}`}
                                    onClick={() => setOrderType(orderType === 'Market' ? 'Limit' : 'Market')}
                                >
                                    Market
                                </button>
                            </div>
                            <div className="text-[13px] font-medium px-1">
                                <span className="text-[var(--text-tertiary)]">Last price </span>
                                <span className="text-[var(--text-primary)] border-b border-dashed border-[var(--text-tertiary)]">
                                    {formatPrice(position.markPrice)} USDT
                                </span>
                            </div>
                        </div>

                        {/* Amount Input Area */}
                        <div className="space-y-4 mb-8">
                            <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[52px] flex flex-col justify-center">
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium leading-none mb-1">Amount ({position.symbol.replace('USDT', '')})</span>
                                <input
                                    type="text"
                                    className="bg-transparent font-bold text-[var(--text-primary)] text-[16px] outline-none w-full p-0 leading-none"
                                    value={amountInput}
                                    readOnly
                                />
                            </div>

                            {/* Percentage Slider (5 dots) */}
                            <div className="relative w-full h-8 flex items-center px-[6px]">
                                <div className="absolute left-[6px] right-[6px] h-[4px] bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--text-primary)] transition-all duration-150" style={{ width: `${amountPercent}%` }} />
                                </div>
                                <div className="absolute left-[6px] right-[6px] flex justify-between items-center h-full z-10 pointer-events-none">
                                    {[0, 25, 50, 75, 100].map(val => (
                                        <div
                                            key={val}
                                            onClick={() => handlePercentageChange(val)}
                                            className={`w-[13px] h-[13px] rounded-full border-[2.5px] z-20 transition-all cursor-pointer pointer-events-auto shadow-sm ${amountPercent >= val ? 'bg-[var(--text-primary)] border-[var(--text-primary)] scale-110' : 'bg-[var(--bg-primary)] border-[var(--border-strong)]'}`}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="range" min="0" max="100" step="25" value={amountPercent}
                                    onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-30 left-0"
                                />
                            </div>

                            <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] font-medium text-[var(--text-tertiary)]">Size {position.size} {position.symbol.replace('USDT', '')}</span>
                                <div className="text-[13px] font-medium">
                                    <span className="text-[var(--text-tertiary)] mr-1">Estimated PnL</span>
                                    <span className={`${estPnL >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'} border-b border-dashed ${estPnL >= 0 ? 'border-[var(--green)]' : 'border-[var(--red)]'}`}>
                                        {estPnL >= 0 ? '+' : ''}{estPnL.toFixed(2)} USDT
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={amountPercent === 0}
                            className={`w-full py-4 rounded-full font-bold flex flex-col items-center justify-center transition-all active:scale-[0.98] ${amountPercent === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#f4516c] text-white shadow-lg'}`}
                        >
                            <span className="text-[17px]">Close</span>
                            <span className="text-[12px] opacity-90 font-medium leading-none mt-0.5">≈ {amountToClose.toFixed(2)} {position.symbol.replace('USDT', '')}</span>
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FuturesCloseSheet;
