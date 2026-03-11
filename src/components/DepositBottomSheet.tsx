import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX as Close, FiDownload as ArrowDown, FiCreditCard as CreditCard } from 'react-icons/fi';
import { BsBank as Bank } from 'react-icons/bs';
import useExchangeStore from '../stores/useExchangeStore';

const DepositBottomSheet = () => {
    const { isDepositOptionOpen, setDepositOptionOpen, setActivePage } = useExchangeStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isDepositOptionOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setTimeout(() => setIsVisible(false), 300);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isDepositOptionOpen]);

    if (!isVisible && !isDepositOptionOpen) return null;

    const handleSelect = (page: string) => {
        window.history.back();
        setTimeout(() => setActivePage(page), 200);
    };

    return (
        <AnimatePresence>
            {isDepositOptionOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                        onClick={() => window.history.back()}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-card)] rounded-t-[24px] z-[501] flex flex-col max-h-[85vh] px-6 pt-2 pb-6"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">Deposit</h2>
                            <button onClick={() => window.history.back()} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-tertiary)]">
                                <Close size={22} />
                            </button>
                        </div>

                        <div className="overflow-y-auto no-scrollbar">
                            <div className="text-[13px] font-medium text-[var(--text-tertiary)] mb-4">I have crypto assets</div>

                            <div className="flex items-center justify-between py-2.5 px-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg mb-6 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" onClick={() => handleSelect('deposit-crypto')}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center text-[var(--text-primary)]">
                                        <ArrowDown size={26} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-[17px] text-[var(--text-primary)]">Deposit Crypto</div>
                                        <div className="text-sm text-[var(--text-tertiary)] font-normal">Deposit crypto assets via the blockchain</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-[13px] font-medium text-[var(--text-tertiary)] mb-4">I don't have crypto assets</div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2.5 px-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" onClick={() => handleSelect('deposit-fiat')}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center text-[var(--text-primary)]">
                                            <Bank size={26} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-[17px] text-[var(--text-primary)] flex items-center gap-2">
                                                Fiat Deposit <span className="text-[10px] bg-[#00C076] text-white px-1.5 py-0.5 rounded leading-none uppercase">0% Fees</span>
                                            </div>
                                            <div className="text-sm text-[var(--text-tertiary)] font-normal mt-0.5">Fast and free deposit via SEPA & PIX</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-2.5 px-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" onClick={() => handleSelect('deposit-card')}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center text-[var(--text-primary)]">
                                            <CreditCard size={26} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-[17px] text-[var(--text-primary)]">Credit/Debit Card</div>
                                            <div className="text-sm text-[var(--text-tertiary)] font-normal mt-0.5">Buy crypto via VISA/Mastercard</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-center text-[12px] text-[var(--text-tertiary)] font-medium flex items-center justify-center gap-1.5 flex-col pb-2">
                                <div className="flex items-center justify-center gap-4 mb-2 opacity-60">
                                    <span className="font-bold tracking-widest text-[var(--text-secondary)]">FIREBLOCKS</span>
                                    <span className="font-bold tracking-widest text-[var(--text-secondary)]">ELLIPTIC</span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                    <span>🛡️</span> Your funds and payment profile are securely protected.
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DepositBottomSheet;
