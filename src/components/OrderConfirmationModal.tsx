import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

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
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative bg-white w-full max-w-[500px] rounded-t-[24px] px-6 pt-2 pb-10 shadow-2xl z-20"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[20px] font-semibold text-gray-900">Order confirmation</h3>
                            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                                <IoClose size={24} />
                            </button>
                        </div>

                        {/* Symbol & Side & Leverage */}
                        <div className="flex items-center gap-2 mb-8">
                            <span className="text-[18px] font-bold text-gray-900">
                                {isFutures ? `${symbol} Perpetual` : `${symbol.replace('USDT', '')}/USDT`}
                            </span>
                            <span className={`px-2 py-0.5 rounded-[4px] text-[12px] font-bold ${isBuy ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'
                                }`}>
                                {side}
                            </span>
                            {isFutures && leverage && (
                                <span className="px-2 py-0.5 rounded-[4px] text-[12px] font-bold bg-[#f3f4f6] text-gray-500">
                                    {leverage}x
                                </span>
                            )}
                        </div>

                        {/* Details Table */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[15px] font-medium text-gray-400">Order price</span>
                                <span className="text-[16px] font-bold text-gray-900">{price}</span>
                            </div>

                            {isFutures ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-gray-400">Amount</span>
                                        <span className="text-[16px] font-bold text-gray-900">{amount} BTC</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-gray-400">Type</span>
                                        <span className="text-[16px] font-bold text-gray-900">{type}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-gray-400">Liq. price</span>
                                        <span className="text-[16px] font-bold text-gray-900">{liqPrice} USDT</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[15px] font-medium text-gray-400 mt-1">Price gap</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[16px] font-bold text-gray-900">{priceGap}%</span>
                                            <span className="text-[13px] font-medium text-gray-400">{priceGapUsdt} USDT</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-gray-400">Total</span>
                                        <span className="text-[16px] font-bold text-gray-900">{total} USDT</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[15px] font-medium text-gray-400">Type</span>
                                        <span className="text-[16px] font-bold text-gray-900">{type}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Note */}
                        <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-10">
                            Note: The final amount and price of the market order will depend on the actual transaction.
                        </p>

                        {/* Don't show again checkbox */}
                        <label className="flex items-center gap-3 mb-8 cursor-pointer select-none text-gray-900">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                                className="w-[18px] h-[18px] rounded border-gray-300 text-gray-900 focus:ring-0 accent-gray-900"
                            />
                            <span className="text-[15px] font-medium">Don't show again</span>
                        </label>

                        {/* Confirm Button */}
                        <button
                            onClick={() => onConfirm(dontShowAgain)}
                            className={`w-full py-4 rounded-full font-bold text-[17px] text-white shadow-lg active:scale-[0.98] transition-all ${isBuy ? 'bg-[#20b26c] shadow-green-100' : 'bg-[#ef454a] shadow-red-100'
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
