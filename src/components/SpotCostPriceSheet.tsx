import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX as Close } from 'react-icons/fi';
import useExchangeStore from '../stores/useExchangeStore';
import { formatPrice } from '../utils/format';

const SpotCostPriceSheet = () => {
    const { 
        isSpotCostPriceSheetOpen, 
        setSpotCostPriceSheetOpen, 
        activeSpotCostPriceAsset, 
        markets, 
        setSpotCostPrice,
        showToast 
    } = useExchangeStore();

    const [inputValue, setInputValue] = useState('');

    const symbol = activeSpotCostPriceAsset ? `${activeSpotCostPriceAsset.symbol}USDT` : 'BTCUSDT';
    const coin = activeSpotCostPriceAsset?.symbol || 'BTC';
    
    const market = useMemo(() => markets.find(m => m.symbol === symbol), [markets, symbol]);
    const lastPrice = market ? parseFloat(market.lastPrice) : 0;
    const balance = activeSpotCostPriceAsset?.balance || 0;

    useEffect(() => {
        if (isSpotCostPriceSheetOpen && activeSpotCostPriceAsset) {
            setInputValue(activeSpotCostPriceAsset.costPrice.toString());
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSpotCostPriceSheetOpen, activeSpotCostPriceAsset]);

    const updatedPnl = useMemo(() => {
        const costPrice = parseFloat(inputValue);
        if (isNaN(costPrice) || costPrice <= 0) return null;
        return (lastPrice - costPrice) * balance;
    }, [inputValue, lastPrice, balance]);

    const updatedPnlPercent = useMemo(() => {
        const costPrice = parseFloat(inputValue);
        if (isNaN(costPrice) || costPrice <= 0) return null;
        return ((lastPrice - costPrice) / costPrice) * 100;
    }, [inputValue, lastPrice]);

    const handleConfirm = async () => {
        const price = parseFloat(inputValue);
        if (isNaN(price) || price <= 0) return;

        await setSpotCostPrice(coin, price);
        showToast('Cost Price Updated', `Cost price for ${coin} updated to $${formatPrice(price)}`, 'success');
        setSpotCostPriceSheetOpen(false);
    };

    return (
        <AnimatePresence>
            {isSpotCostPriceSheetOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={() => setSpotCostPriceSheetOpen(false)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] flex flex-col px-6 pt-2 pb-6"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="text-[18px] font-medium text-[var(--text-primary)]">Update cost price</h2>
                            <button onClick={() => setSpotCostPriceSheetOpen(false)} className="text-[var(--text-tertiary)] p-1">
                                <Close size={24} />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
                            The system will update the cost price based on what you enter. Once updated, the cost price can't be reverted.
                        </p>

                        {/* Input Field */}
                        <div className="relative mb-4">
                            <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-3 flex justify-between items-center group focus-within:ring-1 focus-within:ring-[var(--text-primary)] transition-all">
                                <input 
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Cost price"
                                    className="bg-transparent text-[15px] font-medium text-[var(--text-primary)] outline-none w-full placeholder:font-normal placeholder:text-[var(--text-tertiary)]"
                                />
                                <span className="text-[14px] text-[var(--text-tertiary)] font-medium ml-2">USD</span>
                            </div>
                        </div>

                        {/* PnL Preview */}
                        <div className="space-y-1.5 mb-5">
                            <div className="flex justify-start gap-2 items-center text-[13px]">
                                <span className="text-[var(--text-tertiary)] font-medium">Updated PnL</span>
                                <span className={`font-medium ${updatedPnl === null ? 'text-[var(--text-tertiary)]' : (updatedPnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}`}>
                                    {updatedPnl === null ? '--' : `${updatedPnl >= 0 ? '+' : ''}$${Math.abs(updatedPnl).toFixed(2)}`}
                                </span>
                            </div>
                            <div className="flex justify-start gap-2 items-center text-[13px]">
                                <span className="text-[var(--text-tertiary)] font-medium">Updated PnL%</span>
                                <span className={`font-medium ${updatedPnlPercent === null ? 'text-[var(--text-tertiary)]' : (updatedPnlPercent >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}`}>
                                    {updatedPnlPercent === null ? '--' : `${updatedPnlPercent >= 0 ? '+' : ''}${updatedPnlPercent.toFixed(2)}%`}
                                </span>
                            </div>
                        </div>

                        {/* Footer Link */}
                        <p className="text-[12px] text-[var(--text-tertiary)] mb-5 font-medium">
                            Go to <span className="text-[var(--text-primary)] border-b border-[var(--text-primary)] cursor-pointer">trading history</span> for more records.
                        </p>

                        {/* Confirm Button */}
                        <button 
                            onClick={handleConfirm}
                            disabled={!inputValue || parseFloat(inputValue) <= 0}
                            className="w-full py-3.5 text-[15px] font-medium rounded-full transition-all active:scale-[0.98]"
                            style={{ backgroundColor: (inputValue && parseFloat(inputValue) > 0) ? 'var(--text-primary)' : 'var(--bg-secondary)', color: (inputValue && parseFloat(inputValue) > 0) ? 'var(--bg-primary)' : 'var(--text-tertiary)' }}
                        >
                            Confirm
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SpotCostPriceSheet;
