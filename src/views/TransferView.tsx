import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft as ChevronLeft } from 'react-icons/fi';
import { IoIosSwap as SwapIcon } from 'react-icons/io';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import SuccessDialog from '../components/SuccessDialog';

const TransferView = () => {
    const { setActivePage, wallets, addTransaction, setWallets } = useExchangeStore();

    type TargetWallet = 'spot' | 'futures' | 'earn';
    const [fromAccount, setFromAccount] = useState<TargetWallet>('spot');
    const [toAccount, setToAccount] = useState<TargetWallet>('futures');
    const [selectedCoin, setSelectedCoin] = useState('USDT');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

    // Coin Drawer State
    const [isCoinDrawerOpen, setIsCoinDrawerOpen] = useState(false);

    // Available balance calculation
    const availableBalance = wallets[fromAccount][selectedCoin] || 0;

    // Filter coins to only those that exist in the fromAccount (and always show USDT)
    const availableCoins = useMemo(() => {
        const balances = wallets[fromAccount] || {};
        const coins = new Set(Object.keys(balances).filter(symbol => balances[symbol] > 0));
        coins.add('USDT'); // Always ensure USDT is available for transfer
        return Array.from(coins).map(symbol => ({ symbol, balance: balances[symbol] || 0 }));
    }, [wallets, fromAccount]);

    const handleSwapAccounts = () => {
        setFromAccount(toAccount);
        setToAccount(fromAccount);
        setAmount('');
        // Ensure the selected coin exists in the new 'from' account, or fallback to USDT
        const newFromBalances = wallets[toAccount] || {};
        if (!newFromBalances[selectedCoin] && selectedCoin !== 'USDT') {
            setSelectedCoin('USDT');
        }
    };

    const handleMaxAmount = () => {
        setAmount(availableBalance.toString());
    };

    const handleSimulateTransfer = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        if (numAmount > availableBalance) {
            alert(`Insufficient balance in ${fromAccount} account.`);
            return;
        }

        setIsSimulating(true);
        setTimeout(() => {
            // Add transaction record
            const txId = 'TR' + Date.now().toString(36).toUpperCase();
            addTransaction({
                id: txId,
                type: 'Transfer',
                currency: selectedCoin,
                amount: numAmount,
                from: fromAccount,
                to: toAccount,
                status: 'Completed',
                timestamp: Date.now()
            });

            // Update Mock Wallets
            const w = { ...wallets };
            w[fromAccount] = { ...w[fromAccount] };
            w[toAccount] = { ...w[toAccount] };

            w[fromAccount][selectedCoin] -= numAmount;
            w[toAccount][selectedCoin] = (w[toAccount][selectedCoin] || 0) + numAmount;

            setWallets(w);

            setIsSimulating(false);
            setSuccessDialog({
                isOpen: true,
                message: `Moved ${numAmount} ${selectedCoin}\nfrom ${fromAccount} to ${toAccount}.`
            });
        }, 1000); // Shorter delay for instant transfers
    };

    const handleSuccessClose = () => {
        setSuccessDialog({ isOpen: false, message: '' });
        setActivePage('assets');
        setAmount('');
    };

    const formatWalletName = (w: TargetWallet) => w === 'spot' ? 'Funding' : w === 'futures' ? 'Trading' : 'Earn';

    return (
        <div className="fixed inset-0 bg-[#FDFDFD] z-[300] flex flex-col px-4 pb-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between py-4 bg-[#FDFDFD] z-10 sticky pt-safe top-0 border-b border-transparent">
                <button
                    onClick={() => window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-slate-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-slate-900">
                    Transfer
                </div>
                <div className="w-8 flex justify-end">
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-6">

                {/* Visual Transfer Box */}
                <div className="relative mb-6 mx-2">
                    <div className="bg-[#F5F7F9] rounded-xl flex flex-col mb-1 overflow-hidden relative border border-slate-100/50">
                        <div className="p-4 border-b border-white flex">
                            <div className="w-[80px] text-sm text-slate-500 font-medium">From</div>
                            <div className="font-bold text-[15px] text-slate-900">{formatWalletName(fromAccount)}</div>
                        </div>
                        <div className="p-4 flex">
                            <div className="w-[80px] text-sm text-slate-500 font-medium">To</div>
                            <div className="font-bold text-[15px] text-slate-900">{formatWalletName(toAccount)}</div>
                        </div>

                        {/* Swap Button Absolute Center */}
                        <div
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 shadow-sm flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform z-10"
                            onClick={handleSwapAccounts}
                        >
                            <span className="rotate-90"><SwapIcon size={18} /></span>
                        </div>

                        {/* Connecting Line styling to match mockup */}
                        <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-300 flex flex-col justify-between items-center z-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        </div>
                    </div>
                </div>

                <div className="mx-2 mb-6">
                    <div className="text-[13px] font-medium text-slate-900 mb-2">Asset</div>
                    <div
                        className="bg-[#F5F7F9] rounded-xl p-4 flex justify-between items-center cursor-pointer"
                        onClick={() => setIsCoinDrawerOpen(true)}
                    >
                        <div className="flex items-center gap-2">
                            <CoinIcon symbol={selectedCoin} size={6} />
                            <span className="font-bold text-[15px] text-slate-900">{selectedCoin}</span>
                        </div>
                        <span className="text-slate-400"><ChevronDown size={22} /></span>
                    </div>
                </div>

                <div className="mx-2 mb-8">
                    <div className="text-[13px] font-medium text-slate-900 mb-2">Amount</div>
                    <div className="bg-[#F5F7F9] rounded-xl p-4 flex flex-col relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-transparent border-none text-[16px] font-bold text-slate-900 outline-none placeholder:text-slate-300 mb-2"
                            placeholder="Enter amount"
                        />
                        <div className="absolute right-4 top-4 flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-500">{selectedCoin}</span>
                            <button onClick={handleMaxAmount} className="bg-slate-900 text-white text-[12px] font-bold px-3 py-1 rounded-full active:scale-95">Max</button>
                        </div>
                        <div className="text-[12px] text-slate-500 font-medium">
                            Available {availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {selectedCoin}
                        </div>
                    </div>
                </div>

            </div>

            <div className="p-4 bg-[#FDFDFD] border-t border-slate-100 pb-8 z-20">
                <button
                    onClick={handleSimulateTransfer}
                    disabled={!amount || isSimulating || parseFloat(amount) > availableBalance}
                    className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${(amount && parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance) ? 'bg-[#121212] text-white active:bg-black' : 'bg-slate-100 text-slate-400'}`}
                >
                    {isSimulating ? 'Processing...' : 'Confirm'}
                </button>
            </div>

            {/* Simple Coin Drawer */}
            <AnimatePresence>
                {isCoinDrawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[500]" onClick={() => setIsCoinDrawerOpen(false)} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[501] overflow-hidden flex flex-col max-h-[70vh]"
                        >
                            <div className="flex items-center justify-center py-4 border-b border-slate-100 font-bold text-[17px] text-slate-900">
                                Select Asset
                            </div>

                            <div className="p-2 pb-8 overflow-y-auto">
                                {availableCoins.map(coin => (
                                    <div key={coin.symbol} className="p-4 cursor-pointer active:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between" onClick={() => { setSelectedCoin(coin.symbol); setIsCoinDrawerOpen(false); }}>
                                        <div className="flex items-center gap-3">
                                            <CoinIcon symbol={coin.symbol} size={6} />
                                            <span className="font-bold text-[16px] text-slate-900">{coin.symbol}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[14px] text-slate-900">
                                                {coin.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <SuccessDialog
                isOpen={successDialog.isOpen}
                title="Transfer Successful"
                message={successDialog.message}
                onClose={handleSuccessClose}
            />
        </div>
    );
};

export default TransferView;
