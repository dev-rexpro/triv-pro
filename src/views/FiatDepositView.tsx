import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft as ChevronLeft, FiSearch as Search, FiCheck as Check } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import { BsBank2 as Bank, BsWallet2 as Wallet, BsShop as Shop, BsQrCodeScan as QrCode } from 'react-icons/bs';
import SuccessDialog from '../components/SuccessDialog';

const FiatDepositView = () => {
    const { setActivePage, addTransaction, setWallets, wallets } = useExchangeStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedFiat, setSelectedFiat] = useState<'IDR' | 'USD'>('IDR');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

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
        setTimeout(() => {
            // Add transaction
            const txId = 'FD' + Date.now().toString(36).toUpperCase();
            addTransaction({
                id: txId,
                type: 'Deposit',
                currency: 'USDT', // We convert Fiat -> USDT for mock balance 
                amount: selectedFiat === 'IDR' ? (numAmount / 16300) : numAmount,
                network: selectedMethod,
                status: 'Completed',
                timestamp: Date.now()
            });

            // Update Mock Wallets
            const w = { ...wallets };
            w.spot = { ...w.spot };
            w.spot.USDT = (w.spot.USDT || 0) + (selectedFiat === 'IDR' ? (numAmount / 16300) : numAmount);
            setWallets(w);

            setIsSimulating(false);
            setSuccessDialog({
                isOpen: true,
                message: `Amount: ${numAmount} ${selectedFiat}\nMethod: ${selectedMethod}\nCredited as USDT to Spot Wallet.`
            });
        }, 1500);
    };

    const handleSuccessClose = () => {
        setSuccessDialog({ isOpen: false, message: '' });
        setActivePage('assets');
    };

    return (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col pt-safe px-4 pb-0 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between py-4 sticky top-0 bg-white z-10">
                <button
                    onClick={() => step > 1 ? setStep(1) : window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-slate-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-slate-900 absolute left-1/2 -translate-x-1/2">
                    {step === 1 ? 'Fiat Deposit' : 'Deposit Details'}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Step 1: Select Fiat & Method */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">

                    <div className="flex justify-between items-center mb-6 bg-[#F5F7F9] p-1 rounded-xl">
                        {(['IDR', 'USD'] as const).map(fiat => (
                            <button
                                key={fiat}
                                onClick={() => setSelectedFiat(fiat)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${selectedFiat === fiat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                            >
                                {fiat}
                            </button>
                        ))}
                    </div>

                    <div className="font-bold text-[15px] text-slate-900 mb-4">Select payment method</div>

                    <div className="space-y-4">
                        {activeMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => { setSelectedMethod(method.name); setStep(2); }}
                                className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl cursor-pointer active:bg-slate-50 shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                        <method.icon size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[15px] text-slate-900">{method.name}</div>
                                        <div className="text-[13px] text-slate-400 font-medium">{method.desc}</div>
                                    </div>
                                </div>
                                <div className="w-4 h-4 rounded-full border border-slate-300 flex justify-center items-center">
                                    {selectedMethod === method.name && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 2: Amount & Confirm */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2 flex flex-col h-full">

                    <div className="bg-[#F5F7F9] rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm">
                            {React.createElement(activeMethods.find(m => m.name === selectedMethod)?.icon || Bank, { size: 18 })}
                        </div>
                        <div>
                            <div className="font-bold text-[15px] text-slate-900">{selectedMethod}</div>
                            <div className="text-[12px] text-slate-500 font-medium">Fee: 0 {selectedFiat}</div>
                        </div>
                    </div>

                    <div className="font-bold text-[15px] text-slate-900 mb-3">Amount</div>
                    <div className="relative mb-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-[#F5F7F9] border-none rounded-2xl py-4 px-4 text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
                            placeholder={"0.00"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm">
                            {selectedFiat}
                        </div>
                    </div>
                    <div className="text-[13px] text-slate-400 font-medium mb-10 px-1 flex justify-between">
                        <span>Min: {selectedFiat === 'IDR' ? '150,000' : '10'} {selectedFiat}</span>
                        <span>Receive ≈ {(parseFloat(amount || '0') / (selectedFiat === 'IDR' ? 16300 : 1)).toFixed(2)} USDT</span>
                    </div>

                    <div className="mt-auto pb-8">
                        <button
                            onClick={handleSimulateDeposit}
                            disabled={!amount || isSimulating}
                            className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${!amount || isSimulating ? 'bg-slate-200 text-slate-400' : 'bg-[#00C076] text-white active:bg-[#00a666]'}`}
                        >
                            {isSimulating ? 'Processing...' : 'Simulate Deposit'}
                        </button>
                    </div>
                </motion.div>
            )}

            <SuccessDialog
                isOpen={successDialog.isOpen}
                title="Fiat Deposit Simulated!"
                message={successDialog.message}
                onClose={handleSuccessClose}
            />
        </div>
    );
};

export default FiatDepositView;
