import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FiChevronLeft as ChevronLeft } from 'react-icons/fi';
import { FaCcVisa as Visa, FaCcMastercard as Mastercard, FaCcAmex as Amex } from 'react-icons/fa';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';


const CardDepositView = () => {
    const { setActivePage, addTransaction, setWallets, wallets } = useExchangeStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCard, setSelectedCard] = useState('');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);


    const cards = [
        { id: 'visa', name: 'Visa', icon: Visa, color: 'text-blue-600' },
        { id: 'mc', name: 'Mastercard', icon: Mastercard, color: 'text-orange-500' },
        { id: 'amex', name: 'American Express', icon: Amex, color: 'text-sky-500' },
    ];

    const handleSimulateDeposit = () => {
        const numAmount = parseFloat(amount);
        if (!selectedCard || isNaN(numAmount) || numAmount <= 0) return;

        setIsSimulating(true);
        setTimeout(() => {
            // Add transaction
            const txId = 'CD' + Date.now().toString(36).toUpperCase();
            addTransaction({
                id: txId,
                type: 'Deposit',
                currency: 'USDT', // We convert USD -> USDT for mock balance 
                amount: numAmount,
                network: selectedCard,
                status: 'Completed',
                timestamp: Date.now()
            });

            // Update Mock Wallets
            const w = { ...wallets };
            w.spot = { ...w.spot };
            w.spot.USDT = (w.spot.USDT || 0) + numAmount;
            setWallets(w);

            setIsSimulating(false);
            useExchangeStore.getState().showToast('Card Deposit Simulated!', `Bought ${numAmount} USDT using ${selectedCard}.`, 'success');
            setActivePage('assets');
        }, 1500);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-primary)] z-[1100] flex flex-col pt-safe px-4 pb-0 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-4 sticky top-0 bg-[var(--bg-primary)] z-10">
                <button
                    onClick={() => step > 1 ? setStep(1) : window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-[var(--text-primary)]"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-[var(--text-primary)] absolute left-1/2 -translate-x-1/2">
                    {step === 1 ? 'Credit/Debit Card' : 'Buy USDT'}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Step 1: Select Card Type */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">

                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-4">Select Card Provider</div>

                    <div className="space-y-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => { setSelectedCard(card.name); setStep(2); }}
                                className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-2xl cursor-pointer active:bg-[var(--bg-hover)] shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center ${card.color}`}>
                                        <card.icon size={24} />
                                    </div>
                                    <div className="font-bold text-[15px] text-[var(--text-primary)]">{card.name}</div>
                                </div>
                                <div className="w-4 h-4 rounded-full border border-[var(--border-strong)] flex justify-center items-center">
                                    {selectedCard === card.name && <div className="w-2.5 h-2.5 bg-[var(--text-primary)] rounded-full" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 mt-8 flex items-start gap-3">
                        <span>💡</span>
                        <div className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            Card payments are processed instantly. Please ensure your card supports 3D Secure authentication.
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 2: Amount & Confirm */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2 flex flex-col h-full">

                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <div className={`w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center shadow-sm ${cards.find(m => m.name === selectedCard)?.color}`}>
                            {React.createElement(cards.find(m => m.name === selectedCard)?.icon || Visa, { size: 24 })}
                        </div>
                        <div>
                            <div className="font-bold text-[15px] text-[var(--text-primary)]">{selectedCard}</div>
                            <div className="text-[12px] text-[var(--text-secondary)] font-medium">Link new card at checkout</div>
                        </div>
                    </div>

                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-3">You pay (USD)</div>
                    <div className="relative mb-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)] border-none rounded-2xl py-4 px-4 text-2xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                            placeholder={"0.00"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-3 py-1 rounded-full shadow-sm">
                            USD
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-4 text-[var(--text-tertiary)]">
                        <div className="flex-1 h-px bg-[var(--bg-secondary)]"></div>
                        <div className="w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-secondary)]">↓</div>
                        <div className="flex-1 h-px bg-[var(--bg-secondary)]"></div>
                    </div>

                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-3">You receive</div>
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex justify-between items-center shadow-inner">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">{(parseFloat(amount || '0') * 0.98).toFixed(2)}</span>
                        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1 rounded-full font-bold text-[var(--text-primary)] shadow-sm">
                            <CoinIcon symbol="USDT" size={5} /> USDT
                        </div>
                    </div>

                    <div className="text-[11px] text-[var(--text-tertiary)] font-medium text-center mt-3">
                        Includes 2.0% processing fee
                    </div>

                    <div className="mt-auto pb-8 pt-8">
                        <button
                            onClick={handleSimulateDeposit}
                            disabled={!amount || isSimulating}
                            className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${!amount || isSimulating ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]' : 'bg-[#00C076] text-white active:bg-[var(--green)]'}`}
                        >
                            {isSimulating ? 'Processing...' : `Buy USDT with ${selectedCard}`}
                        </button>
                    </div>
                </motion.div>
            )}

        </motion.div>
    );
};

export default CardDepositView;
