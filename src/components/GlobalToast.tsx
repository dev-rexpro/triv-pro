import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiCheck as Check, FiX as XIcon } from 'react-icons/fi';
import useExchangeStore from '../stores/useExchangeStore';

const GlobalToast: React.FC = () => {
    const { toastMessage, hideToast } = useExchangeStore();

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (toastMessage?.isOpen) {
            timer = setTimeout(() => {
                hideToast();
            }, 3000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [toastMessage?.isOpen, hideToast]);

    return (
        <AnimatePresence>
            {toastMessage?.isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    key="global-toast"
                    className="fixed top-4 left-4 right-4 z-[9999] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] p-4 rounded-xl shadow-[var(--shadow-toast)] flex items-start gap-3 pointer-events-none mx-auto max-w-md"
                    style={{ paddingTop: 'calc(1rem + var(--safe-area-top))' }}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 [&>svg]:stroke-[3] ${toastMessage.type === 'success' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'}`}>
                        {toastMessage.type === 'success' ? (
                            <Check size={18} />
                        ) : (
                            <XIcon size={18} />
                        )}
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="font-bold text-[15px] leading-tight mb-1">{toastMessage.title}</span>
                        <span className="text-[13px] text-[var(--text-secondary)] leading-snug whitespace-pre-line">{toastMessage.message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalToast;
