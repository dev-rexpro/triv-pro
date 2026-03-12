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
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none flex justify-center px-4 pt-[calc(1.5rem + var(--safe-area-top))]">
            <AnimatePresence>
                {toastMessage?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -80, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9, transition: { duration: 0.15 } }}
                        transition={{ 
                            type: "spring", 
                            damping: 20, 
                            stiffness: 260,
                            mass: 0.8
                        }}
                        key="global-toast"
                        className="bg-[var(--bg-card)]/90 backdrop-blur-xl text-[var(--text-primary)] border border-[var(--border-color)] p-4 rounded-2xl shadow-[var(--shadow-toast)] flex items-center gap-3 pointer-events-auto max-w-[calc(100vw-32px)] w-full sm:max-w-md shadow-2xl"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 [&>svg]:stroke-[2.5] ${toastMessage.type === 'success' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'}`}>
                            {toastMessage.type === 'success' ? (
                                <Check size={20} />
                            ) : (
                                <XIcon size={20} />
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-[15px] leading-tight mb-0.5 truncate">{toastMessage.title}</span>
                            <span className="text-[13px] text-[var(--text-secondary)] leading-snug line-clamp-2">{toastMessage.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalToast;
