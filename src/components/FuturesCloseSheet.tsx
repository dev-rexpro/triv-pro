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
    const { closeFuturesPosition, futuresMarkets } = useExchangeStore();
    const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
    const [priceInput, setPriceInput] = useState('');
    const [amountPercent, setAmountPercent] = useState(100);
    const [isPriceFocused, setIsPriceFocused] = useState(false);

    const market = futuresMarkets.find(m => m.symbol === position?.symbol);
    const precision = market?.pricePrecision || 2;

    useEffect(() => {
        if (isOpen && position) {
            setPriceInput(position.markPrice?.toString() || '');
            setAmountPercent(100);
            setOrderType('Market');
        }
    }, [isOpen, position]);

    if (!position) return null;

    const currentPrice = position.markPrice || position.entryPrice;
    const targetPrice = orderType === 'Market' ? currentPrice : parseFloat(priceInput) || currentPrice;
    const amountToClose = (position.size * amountPercent) / 100;

    const sideMultiplier = position.side === 'Buy' ? 1 : -1;
    const estPnLRaw = (targetPrice - position.entryPrice) * amountToClose * sideMultiplier;
    
    const notionalValue = amountToClose * targetPrice;
    const estFee = notionalValue * 0.0005;
    const estPnL = estPnLRaw - estFee;

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
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] px-6 pt-2 pb-4"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-[17px] font-bold text-[var(--text-primary)]">Close Position</h2>
                            <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors translate-x-1">
                                <XIcon size={24} />
                            </button>
                        </div>

                        {/* Position Summary */}
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-[14px] font-bold text-[var(--text-primary)] uppercase">{position.symbol}</span>
                            <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${position.side === 'Buy' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'}`}>
                                {position.side === 'Buy' ? 'Long' : 'Short'}
                            </span>
                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                {position.leverage}x
                            </span>
                        </div>

                        {/* Price Area */}
                        <div className="space-y-2 mb-3">
                            <div className="flex gap-2">
                                <div className={`flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 flex flex-col justify-center h-[42px] border transition-colors ${isPriceFocused ? 'border-[var(--text-primary)]' : 'border-transparent'}`}>
                                    {orderType === 'Market' ? (
                                        <div className="text-[14px] font-medium text-[var(--text-tertiary)]">Market Price</div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="number"
                                                className="bg-transparent font-medium text-[var(--text-primary)] text-[14px] outline-none w-full p-0"
                                                value={priceInput}
                                                onChange={(e) => setPriceInput(e.target.value)}
                                                onFocus={() => setIsPriceFocused(true)}
                                                onBlur={() => setIsPriceFocused(false)}
                                                placeholder="Price"
                                            />
                                            <span className="text-[12px] text-[var(--text-secondary)] font-medium ml-2">USDT</span>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className={`flex-1 h-[42px] rounded-xl font-medium text-[14px] border transition-colors ${orderType === 'Market' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-strong)]' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-transparent'}`}
                                    onClick={() => setOrderType(orderType === 'Market' ? 'Limit' : 'Market')}
                                >
                                    Market
                                </button>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Last price</span>
                                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                                    {formatPrice(position.markPrice)} USDT
                                </span>
                            </div>
                        </div>

                        {/* Amount Area */}
                        <div className="space-y-3 mb-6">
                            <div className="bg-[var(--bg-secondary)] rounded-xl px-4 flex items-center h-[42px] justify-between">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase tracking-tight">Amount</span>
                                <div className="text-[14px] font-medium text-[var(--text-primary)]">{amountPercent}%</div>
                            </div>

                            {/* Slider */}
                            <div className="relative h-[20px] mb-4 flex items-center px-2">
                                <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                    <div 
                                        className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                        style={{ width: `${amountPercent}%` }} 
                                    />
                                </div>
                                <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                    {[0, 25, 50, 75, 100].map(val => (
                                        <div key={val} className="flex flex-col items-center relative">
                                            <div 
                                                className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${amountPercent >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAmountPercent(val);
                                                }}
                                                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                            />
                                            <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="range" min="0" max="100" step="1"
                                    value={amountPercent} 
                                    onChange={e => setAmountPercent(parseInt(e.target.value))} 
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                />
                            </div>

                            <div className="space-y-1.5 px-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Size</span>
                                    <span className="text-[11px] font-medium text-[var(--text-primary)]">{position.size} {position.symbol.replace('USDT', '')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Est. PnL</span>
                                    <span className={`text-[11px] font-medium ${estPnL >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                        {estPnL >= 0 ? '+' : ''}{estPnL.toFixed(2)} USDT
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={amountPercent === 0}
                            className={`w-full py-2.5 rounded-[20px] font-bold text-[15px] transition-all active:scale-[0.98] ${amountPercent === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#f4516c] text-white shadow-sm'}`}
                        >
                            Confirm
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FuturesCloseSheet;
