import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiSearch as Search, FiCopy as Copy, FiMaximize as Maximize } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import SuccessDialog from '../components/SuccessDialog';

const WithdrawalView = () => {
    const { setActivePage, wallets, addTransaction, setWallets, rates } = useExchangeStore();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

    // Filter coins to ONLY those owned in the Spot wallet
    const availableCoins = useMemo(() => {
        const spotBalances = wallets.spot;
        return Object.keys(spotBalances)
            .filter(symbol => spotBalances[symbol] > 0)
            .filter(symbol => symbol.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(symbol => ({ symbol, balance: spotBalances[symbol] }));
    }, [wallets, searchQuery]);

    const handleMaxAmount = () => {
        if (!selectedCoin) return;
        setAmount(wallets.spot[selectedCoin].toString());
    };

    const networks = [
        { id: 'TRC20', name: 'Tron (TRC20)', time: '~ 1 minute', min: '1.00', fee: '1.00' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', time: '~ 3 minutes', min: '0.01', fee: '0.29' },
        { id: 'ERC20', name: 'Ethereum (ERC20)', time: '~ 7 minutes', min: '10.00', fee: '4.50' },
        { id: 'SOL', name: 'Solana', time: '~ 2 minutes', min: '0.01', fee: '0.80' },
    ];

    const activeNetwork = networks.find(n => n.id === selectedNetwork);

    const handleSimulateWithdrawal = () => {
        const numAmount = parseFloat(amount);
        if (!selectedCoin || !selectedNetwork || isNaN(numAmount) || numAmount <= 0) return;

        const spotBal = wallets.spot[selectedCoin] || 0;
        if (numAmount > spotBal) {
            alert('Insufficient balance in Spot account.');
            return;
        }

        setIsSimulating(true);
        setTimeout(() => {
            // Add transaction record
            const txId = 'WD' + Date.now().toString(36).toUpperCase();
            addTransaction({
                id: txId,
                type: 'Withdrawal',
                currency: selectedCoin,
                amount: numAmount,
                network: selectedNetwork,
                status: 'Completed',
                timestamp: Date.now()
            });

            // Update Mock Wallets
            const w = { ...wallets };
            w.spot = { ...w.spot };
            w.spot[selectedCoin] -= numAmount;
            setWallets(w);

            setIsSimulating(false);
            setSuccessDialog({
                isOpen: true,
                message: `Withdrew ${numAmount} ${selectedCoin} via ${selectedNetwork}.`
            });
        }, 1500);
    };

    const handleSuccessClose = () => {
        setSuccessDialog({ isOpen: false, message: '' });
        setActivePage('assets');
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-[300] flex flex-col pt-safe px-4 pb-0 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-4 sticky top-0 bg-white z-10">
                <button
                    onClick={() => step > 1 ? setStep(step - 1 as 1 | 2) : window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-slate-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-slate-900 absolute left-1/2 -translate-x-1/2">
                    {step === 1 ? 'Withdraw Crypto' : step === 2 ? 'Select network' : `Withdraw ${selectedCoin}`}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Step 1: Select Crypto from Spot Wallet */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">
                    <div className="relative mb-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={18} /></div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F5F7F9] border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder="Search coin"
                        />
                    </div>

                    <div className="font-bold text-[15px] text-slate-900 mb-4">Spot Wallet Assets</div>

                    {availableCoins.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-medium text-sm">
                            No assets available for withdrawal in Spot wallet.
                        </div>
                    ) : (
                        <div className="space-y-1 pb-10">
                            {availableCoins.map((coin) => (
                                <div
                                    key={coin.symbol}
                                    onClick={() => { setSelectedCoin(coin.symbol); setStep(2); }}
                                    className="flex items-center justify-between py-3 cursor-pointer active:bg-slate-50 border-b border-slate-50 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <CoinIcon symbol={coin.symbol} size={8} />
                                        <div className="font-bold text-[15px] text-slate-900">{coin.symbol}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[14px] text-slate-900">
                                            {coin.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Step 2: Select Network */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">
                    <div className="bg-[#FFF8E6] text-orange-600 rounded-2xl p-4 mb-6 text-sm font-medium leading-relaxed flex gap-3">
                        <span className="text-xl">⚠️</span>
                        Please ensure the withdrawal network matches the deposit network. Transacting on the wrong network will result in lost funds.
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-4 px-1">
                        <span>Network</span>
                        <span>Fee / Arrival time</span>
                    </div>

                    <div className="space-y-4 pb-10">
                        {networks.map((net) => (
                            <div
                                key={net.id}
                                onClick={() => { setSelectedNetwork(net.id); setStep(3); }}
                                className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 cursor-pointer active:bg-slate-50 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                                        {net.id.slice(0, 3)}
                                    </div>
                                    <span className="font-bold text-[15px] text-slate-900">{net.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-[13px] text-slate-900">{net.fee} {selectedCoin}</div>
                                    <div className="text-[11px] text-slate-400 font-medium">{net.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 3: Withdrawal Form */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-6 flex flex-col h-full relative pb-safe">
                    <div className="flex-1 pb-32">

                        <div className="font-bold text-[14px] text-slate-900 mb-2">Address</div>
                        <div className="relative mb-6">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-[#F5F7F9] border border-transparent focus:border-slate-300 rounded-xl py-3.5 pl-4 pr-12 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                placeholder={`Enter ${selectedCoin} address`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Maximize size={18} />
                            </div>
                        </div>

                        <div className="font-bold text-[14px] text-slate-900 mb-2">Network</div>
                        <div
                            className="w-full bg-[#F5F7F9] rounded-xl py-3.5 px-4 mb-6 flex justify-between items-center cursor-pointer"
                            onClick={() => setStep(2)}
                        >
                            <span className="font-bold text-[14px] text-slate-900">{activeNetwork?.name}</span>
                            <span className="text-slate-400"><ChevronDown size={20} /></span>
                        </div>

                        <div className="font-bold text-[14px] text-slate-900 mb-2 flex justify-between">
                            <span>Withdrawal Amount</span>
                            <span className="text-slate-400 font-medium text-xs">Available: {wallets.spot[selectedCoin!]} {selectedCoin}</span>
                        </div>
                        <div className="relative mb-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#F5F7F9] border-none rounded-xl py-3.5 pl-4 pr-24 text-[16px] font-bold text-slate-900 outline-none placeholder:text-slate-300"
                                placeholder={"0.00"}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-slate-500 font-bold text-sm border-r border-slate-300 pr-2">{selectedCoin}</span>
                                <button onClick={handleMaxAmount} className="font-bold text-sm text-[#00C076] pr-2">MAX</button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-[12px] font-medium text-slate-500 mt-6 px-1">
                            <span>Network fee</span>
                            <span>{activeNetwork?.fee} {selectedCoin}</span>
                        </div>

                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8 z-20">
                        <div className="flex justify-between items-start mb-4 px-1">
                            <span className="text-[13px] text-slate-500 font-medium">Receive amount</span>
                            <div className="text-right">
                                <div className="font-bold text-[20px] text-slate-900 leading-none">
                                    {Math.max(0, parseFloat(amount || '0') - parseFloat(activeNetwork?.fee || '0')).toFixed(4)} {selectedCoin}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSimulateWithdrawal}
                            disabled={!amount || !address || isSimulating || parseFloat(amount) <= parseFloat(activeNetwork?.fee || '0')}
                            className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${(!amount || !address || isSimulating) ? 'bg-slate-200 text-slate-400' : 'bg-[#121212] text-white active:bg-black'}`}
                        >
                            {isSimulating ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                </motion.div>
            )}

            <SuccessDialog
                isOpen={successDialog.isOpen}
                title="Withdrawal Successful"
                message={successDialog.message}
                onClose={handleSuccessClose}
            />
        </motion.div>
    );
};

export default WithdrawalView;
