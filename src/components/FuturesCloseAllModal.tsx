import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useExchangeStore from '../stores/useExchangeStore';

interface FuturesCloseAllModalProps {
    isOpen: boolean;
    onClose: () => void;
    position: any;
}

const FuturesCloseAllModal: React.FC<FuturesCloseAllModalProps> = ({
    isOpen,
    onClose,
    position
}) => {
    const { closeFuturesPosition } = useExchangeStore();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!position) return null;

    const handleConfirm = () => {
        // In a real app, we would save the dontShowAgain preference to local storage
        closeFuturesPosition(position.id);
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
                        className="fixed inset-0 bg-[var(--overlay-bg)] z-[2000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                        animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                        exit={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 w-[90%] max-w-[340px] bg-[var(--bg-primary)] rounded-[24px] z-[2001] overflow-hidden shadow-2xl"
                    >
                        <div className="p-6">
                            <p className="text-[17px] leading-[1.4] text-[var(--text-primary)] font-bold mb-4">
                                <span className="text-[#3b82f6]">Close all</span> of your <span className="text-[#111111]">{position.symbol} Perp</span> <span className={`${position.side === 'Buy' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{position.side} {position.leverage}x</span> position at market price?
                            </p>
                            
                            <p className="text-[14px] leading-[1.5] text-[var(--text-secondary)] font-medium mb-6">
                                If there are Pending reduce-only orders in the opposite direction of the position, they will be canceled before executing this request.
                            </p>

                            <label className="flex items-center gap-2 cursor-pointer mb-2" onClick={() => setDontShowAgain(!dontShowAgain)}>
                                <div className={`w-5 h-5 rounded-[4px] flex items-center justify-center border transition-colors ${dontShowAgain ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`}>
                                    {dontShowAgain && (
                                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span className="text-[14px] font-medium text-[var(--text-primary)]">Don't show again</span>
                            </label>
                        </div>

                        <div className="flex border-t border-[var(--border-color)] h-14">
                            <button
                                className="flex-1 text-[16px] font-bold text-[var(--text-primary)] border-r border-[var(--border-color)] active:bg-[var(--bg-hover)] transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 text-[16px] font-bold text-[var(--text-primary)] active:bg-[var(--bg-hover)] transition-colors"
                                onClick={handleConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FuturesCloseAllModal;
