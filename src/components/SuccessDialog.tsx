import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck as Check } from 'react-icons/fi';

interface SuccessDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, title, message, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-[28px] p-6 w-full max-w-[320px] relative z-10 flex flex-col items-center text-center shadow-2xl"
                    >
                        <div className="w-20 h-20 rounded-full bg-[#E5F9F1] text-[#00C076] flex items-center justify-center mb-5">
                            <Check size={40} />
                        </div>
                        <h3 className="font-bold text-[22px] text-slate-900 mb-2">{title}</h3>
                        <p className="text-[14px] text-slate-500 font-medium mb-8 whitespace-pre-line leading-relaxed">{message}</p>
                        <button onClick={onClose} className="w-full py-4 rounded-full font-bold text-[16px] bg-[#121212] text-white active:scale-95 transition-transform">
                            Done
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SuccessDialog;
