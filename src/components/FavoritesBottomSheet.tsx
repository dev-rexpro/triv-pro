// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { TbCheck } from 'react-icons/tb';
import { MdEditNote } from 'react-icons/md';

interface FavoritesBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selected: string;
    onSelect: (val: string) => void;
    options?: string[];
}

const FavoritesBottomSheet = ({ isOpen, onClose, selected, onSelect, options = ['All', 'Futures', 'Spot'] }: FavoritesBottomSheetProps) => {
    const { setManageGroupsOpen } = useExchangeStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[1001] flex flex-col px-6 pt-2 pb-10 max-h-[70vh]"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[20px] font-semibold text-slate-900">Favorites</h2>
                            <MdEditNote size={24} className="text-slate-900 cursor-pointer" onClick={() => {
                                setManageGroupsOpen(true);
                                onClose();
                            }} />
                        </div>

                        <div className="space-y-6 overflow-y-auto no-scrollbar">
                            {options.map(opt => (
                                <div
                                    key={opt}
                                    onClick={() => onSelect(opt)}
                                    className="flex justify-between items-center cursor-pointer active:opacity-70"
                                >
                                    <span className={`text-[17px] text-slate-900 ${selected === opt ? 'font-medium' : 'font-normal'}`}>{opt}</span>
                                    {selected === opt && (
                                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                            <TbCheck size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FavoritesBottomSheet;
