import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { FiCheck as Check } from 'react-icons/fi';

interface OrderConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dontShowAgain: boolean) => void;
    symbol: string;
    side: 'Buy' | 'Sell';
    price: string | number;
    amount: string | number;
    total: string | number;
    type: string;
    // Futures-specific props
    isFutures?: boolean;
    leverage?: number | string;
    liqPrice?: string | number;
    priceGap?: string | number;
    priceGapUsdt?: string | number;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
    isOpen, onClose, onConfirm,
    symbol, side, price, amount, total, type,
    isFutures = false, leverage, liqPrice, priceGap, priceGapUsdt
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const isBuy = side === 'Buy';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative bg-[var(--bg-card)] w-full max-w-[500px] rounded-t-[24px] px-6 pt-2 pb-10 shadow-2xl z-20"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[20px] font-semibold text-[var(--text-primary)]">Order confirmation</h3>
                            <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                                <IoClose size={24} />
                            </button>
                        </div>

                        {/* Symbol & Side & Leverage */}
                        <div className="flex items-center gap-2 mb-8">
                            <span className="text-[18px] font-bold text-[var(--text-primary)]">
                                {isFutures ? `${symbol} Perpetual` : `${symbol.replace('USDT', '')}/USDT`}
                            </span>
                            <span className={`px-2 py-0.5 rounded-[4px] text-[12px] font-bold ${isBuy ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'
                                }`}>
                                {side}
                            </span>
                            {isFutures && leverage && (
                                <span className="px-2 py-0.5 rounded-[4px] text-[12px] font-bold bg-[#f3f4f6] text-[var(--text-secondary)]">
                                    {leverage}x
                                </span>
                            )}
                        </div>

                        {/* Details Table */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Order price</span>
                                <span className="text-[16px] font-bold text-[var(--text-primary)]">{price}</span>
                            </div>

                            {isFutures ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Amount</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{amount} BTC</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Type</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{type}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Liq. price</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{liqPrice} USDT</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)] mt-1">Price gap</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[16px] font-bold text-[var(--text-primary)]">{priceGap}%</span>
                                            <span className="text-[13px] font-medium text-[var(--text-tertiary)]">{priceGapUsdt} USDT</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Total</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{total} USDT</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-[var(--text-tertiary)]">Type</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{type}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Note */}
                        <p className="text-[13px] text-[var(--text-tertiary)] font-medium leading-relaxed mb-10">
                            Note: The final amount and price of the market order will depend on the actual transaction.
                        </p>

                        {/* Don't show again checkbox */}
                        <label className="flex items-center gap-3 mb-8 cursor-pointer select-none text-[var(--text-primary)]" onClick={() => setDontShowAgain(!dontShowAgain)}>
                            <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center border transition-colors ${dontShowAgain ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]' : 'border-[var(--border-strong)] bg-[var(--bg-card)]'}`}>
                                {dontShowAgain && <Check size={14} className="text-[var(--btn-primary-text)]" />}
                            </div>
                            <span className="text-[15px] font-medium">Don't show again</span>
                        </label>

                        {/* Confirm Button */}
                        <button
                            onClick={() => onConfirm(dontShowAgain)}
                            className={`w-full py-4 rounded-full font-bold text-[17px] text-white shadow-xl active:scale-[0.98] transition-all ${isBuy ? 'bg-[var(--green)]' : 'bg-[var(--red)]'
                                }`}
                        >
                            Confirm
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OrderConfirmationModal;
