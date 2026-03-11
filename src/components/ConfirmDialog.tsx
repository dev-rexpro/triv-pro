import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, onConfirm, onCancel,
    confirmText = 'Confirm', cancelText = 'Cancel'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-[28px] p-6 w-full max-w-[320px] relative z-10 flex flex-col items-center text-center shadow-2xl"
                    >
                        <h3 className="font-bold text-[20px] text-[var(--text-primary)] mb-2">{title}</h3>
                        <p className="text-[14px] text-[var(--text-secondary)] font-medium mb-8 whitespace-pre-line leading-relaxed">{message}</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={onCancel} className="flex-1 py-3.5 rounded-full font-bold text-[15px] bg-[var(--bg-secondary)] text-[var(--text-primary)] active:scale-95 transition-transform">
                                {cancelText}
                            </button>
                            <button onClick={onConfirm} className="flex-1 py-3.5 rounded-full font-bold text-[15px] bg-[#FF4D5B] text-white active:scale-95 transition-transform">
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
