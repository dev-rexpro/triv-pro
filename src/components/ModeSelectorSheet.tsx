import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiActivity, FiCreditCard } from 'react-icons/fi';
import { IoIosClose } from 'react-icons/io';

interface ModeSelectorSheetProps {
    isOpen: boolean;
    onClose: () => void;
    currentMode: string;
    onSelect: (mode: string) => void;
}

const ModeSelectorSheet: React.FC<ModeSelectorSheetProps> = ({ isOpen, onClose, currentMode, onSelect }) => {
    const modes = [
        {
            id: 'pay',
            name: 'Pay',
            description: 'The new money app',
            icon: FiDollarSign,
            color: 'text-slate-900',
            bgColor: 'bg-white'
        },
        {
            id: 'exchange',
            name: 'Exchange',
            description: 'Advanced trading tools',
            icon: FiActivity,
            color: 'text-slate-900',
            bgColor: 'bg-white'
        },
        {
            id: 'web3',
            name: 'Web3',
            description: 'Decentralized trading and marketplace',
            icon: FiCreditCard,
            color: 'text-slate-900',
            bgColor: 'bg-white'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[1001] px-6 pt-2 pb-10"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">Select your mode</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            {modes.map((mode) => {
                                const isSelected = mode.id === currentMode.toLowerCase();
                                return (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            onSelect(mode.name);
                                            onClose();
                                        }}
                                        className={`flex items-center gap-4 py-2.5 px-4 rounded-lg border-2 transition-all text-left ${isSelected
                                            ? 'border-slate-900 bg-white shadow-sm'
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`${mode.color} flex items-center justify-center`}>
                                            <mode.icon size={26} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[17px] font-medium text-slate-900">{mode.name}</div>
                                            <div className="text-sm text-slate-500 font-normal">{mode.description}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ModeSelectorSheet;
