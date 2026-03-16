import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiSearch as Search, FiCheck as Check } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import { BsBank2 as Bank, BsWallet2 as Wallet, BsShop as Shop, BsQrCodeScan as QrCode } from 'react-icons/bs';

const FiatDepositView = () => {
    const { setActivePage, addTransaction, setWallets, wallets } = useExchangeStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedFiat, setSelectedFiat] = useState<'IDR' | 'USD'>('IDR');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    const methodsIDR = [
        { id: 'bank', name: 'Online Bank Transfer', desc: 'BCA, BNI, BRI, Mandiri, Permata', icon: Bank },
        { id: 'wallet', name: 'Digital Wallet', desc: 'Dana, Gopay, OVO', icon: Wallet },
        { id: 'store', name: 'Convenience Store', desc: 'Alfamart, Indomaret', icon: Shop },
        { id: 'qris', name: 'QRIS', desc: 'Scan to pay instantly', icon: QrCode },
    ];

    const methodsUSD = [
        { id: 'sepa', name: 'SEPA Transfer', desc: '1-2 business days', icon: Bank },
        { id: 'swift', name: 'SWIFT Transfer', desc: '3-5 business days', icon: Bank },
    ];

    const activeMethods = selectedFiat === 'IDR' ? methodsIDR : methodsUSD;

    const handleSimulateDeposit = () => {
        const numAmount = parseFloat(amount);
        if (!selectedMethod || isNaN(numAmount) || numAmount <= 0) return;

        setIsSimulating(true);

        const store = useExchangeStore.getState();
        const lockedReceived = selectedFiat === 'IDR' ? (numAmount / 16300) : numAmount;
        const delayMs = Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000;
        const delaySeconds = Math.round(delayMs / 1000);

        store.showToast(
            'Deposit Initiated', 
            `Your fiat deposit of ${numAmount} ${selectedFiat} is being processed.`, 
            'success'
        );

        setTimeout(() => {
            store.showToast(
                'Deposit Processing', 
                `Expected arrival: ~${delaySeconds}s via ${selectedMethod}`, 
                'info'
            );
        }, 1500);

        setIsSimulating(false);
        store.setActivePage('assets');

        setTimeout(() => {
            const currentStore = useExchangeStore.getState();
            const txId = 'FD' + Date.now().toString(36).toUpperCase();
            
            currentStore.addTransaction({
                id: txId,
                type: 'Deposit',
                currency: 'USDT',
                amount: lockedReceived,
                network: selectedMethod,
                status: 'Completed',
                timestamp: Date.now()
            });

            const currentWallets = currentStore.wallets;
            const w = JSON.parse(JSON.stringify(currentWallets));
            w.spot.USDT = (w.spot.USDT || 0) + lockedReceived;
            currentStore.setWallets(w);
            
            if (currentStore.user) {
                currentStore.syncWalletsToSupabase();
            }

            currentStore.showToast(
                'Deposit Success!', 
                `${lockedReceived.toFixed(2)} USDT has been credited to your Spot Wallet.`, 
                'success'
            );
        }, delayMs);
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
                    {step === 1 ? 'Fiat Deposit' : 'Deposit Details'}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Step 1: Select Fiat & Method */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">

                    <div className="flex justify-between items-center mb-6 bg-[var(--bg-secondary)] p-1 rounded-xl">
                        {(['IDR', 'USD'] as const).map(fiat => (
                            <button
                                key={fiat}
                                onClick={() => setSelectedFiat(fiat)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${selectedFiat === fiat ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
                            >
                                {fiat}
                            </button>
                        ))}
                    </div>

                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-4">Select payment method</div>

                    <div className="space-y-4">
                        {activeMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => { setSelectedMethod(method.name); setStep(2); }}
                                className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-2xl cursor-pointer active:bg-[var(--bg-hover)] shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)]">
                                        <method.icon size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[15px] text-[var(--text-primary)]">{method.name}</div>
                                        <div className="text-[13px] text-[var(--text-tertiary)] font-medium">{method.desc}</div>
                                    </div>
                                </div>
                                <div className="w-4 h-4 rounded-full border border-[var(--border-strong)] flex justify-center items-center">
                                    {selectedMethod === method.name && <div className="w-2.5 h-2.5 bg-[var(--text-primary)] rounded-full" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 2: Amount & Confirm */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2 flex flex-col h-full">

                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                            {React.createElement(activeMethods.find(m => m.name === selectedMethod)?.icon || Bank, { size: 18 })}
                        </div>
                        <div>
                            <div className="font-bold text-[15px] text-[var(--text-primary)]">{selectedMethod}</div>
                            <div className="text-[12px] text-[var(--text-secondary)] font-medium">Fee: 0 {selectedFiat}</div>
                        </div>
                    </div>

                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-3">Amount</div>
                    <div className="relative mb-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)] border-none rounded-2xl py-4 px-4 text-2xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                            placeholder={"0.00"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-3 py-1 rounded-full shadow-sm">
                            {selectedFiat}
                        </div>
                    </div>
                    <div className="text-[13px] text-[var(--text-tertiary)] font-medium mb-10 px-1 flex justify-between">
                        <span>Min: {selectedFiat === 'IDR' ? '150,000' : '10'} {selectedFiat}</span>
                        <span>Receive ≈ {(parseFloat(amount || '0') / (selectedFiat === 'IDR' ? 16300 : 1)).toFixed(2)} USDT</span>
                    </div>

                    <div className="mt-auto pb-8">
                        <button
                            onClick={handleSimulateDeposit}
                            disabled={!amount || isSimulating}
                            className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${!amount || isSimulating ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]' : 'bg-[#00C076] text-white active:bg-[var(--green)]'}`}
                        >
                            {isSimulating ? 'Processing...' : 'Simulate Deposit'}
                        </button>
                    </div>
                </motion.div>
            )}

        </motion.div>
    );
};

export default FiatDepositView;
