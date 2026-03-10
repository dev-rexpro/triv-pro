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
                className="text-sm font-bold text-slate-900 flex items-center"
            >
                {currency} <ChevronDown size={16} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-[90] py-1 min-w-[80px]">
                        {CURRENCIES.map(c => (
                            <button
                                key={c}
                                onClick={() => { setCurrency(c); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors ${currency === c ? 'text-slate-900 font-bold bg-slate-50' : 'text-slate-600'
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
