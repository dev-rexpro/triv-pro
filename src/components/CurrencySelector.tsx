// @ts-nocheck
import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import type { CurrencyCode } from '../types';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';

const CURRENCIES: CurrencyCode[] = ['USD', 'USDT', 'BTC', 'IDR'];

interface CurrencySelectorProps {
    className?: string;
}

const CurrencySelector = ({ className = '' }: CurrencySelectorProps) => {
    const { currency, setCurrency } = useExchangeStore();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm font-bold text-[var(--text-primary)] flex items-center"
            >
                {currency} <ChevronDown size={16} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)] z-[90] py-1 min-w-[80px]">
                        {CURRENCIES.map(c => (
                            <button
                                key={c}
                                onClick={() => { setCurrency(c); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors ${currency === c ? 'text-[var(--text-primary)] font-bold bg-[var(--bg-secondary)]' : 'text-[var(--text-secondary)]'
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CurrencySelector;
