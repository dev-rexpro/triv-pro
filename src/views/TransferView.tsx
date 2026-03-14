import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiChevronLeft as ChevronLeft } from 'react-icons/fi';
import { LuFileClock as HistoryIcon } from 'react-icons/lu';
import { TbArrowsSort as SwapIcon } from 'react-icons/tb';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';

const TransferView = () => {
    const { setActivePage, wallets, addTransaction, setWallets } = useExchangeStore();

    type TargetWallet = 'spot' | 'futures' | 'earn';
    const [fromAccount, setFromAccount] = useState<TargetWallet>('spot');
    const [toAccount, setToAccount] = useState<TargetWallet>('futures');
    const [selectedCoin, setSelectedCoin] = useState('USDT');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

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

    const handleSimulateTransfer = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        if (numAmount > availableBalance) {
            useExchangeStore.getState().showToast('Insufficient Balance', `You don't have enough ${selectedCoin} in your ${formatWalletName(fromAccount)} wallet.`, 'error');
            return;
        }

        setIsSimulating(true);
        try {
            const success = await useExchangeStore.getState().performInternalTransfer(
                selectedCoin,
                fromAccount,
                toAccount,
                numAmount
            );

            if (success) {
                useExchangeStore.getState().showToast('Transfer Successful', `Moved ${numAmount} ${selectedCoin}\nfrom ${formatWalletName(fromAccount)} to ${formatWalletName(toAccount)}.`, 'success');
                setActivePage('assets');
                setAmount('');
            } else {
                useExchangeStore.getState().showToast('Transfer Failed', 'An error occurred during the transfer. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Transfer failed:', error);
            useExchangeStore.getState().showToast('Error', 'An unexpected error occurred.', 'error');
        } finally {
            setIsSimulating(false);
        }
    };

    const formatWalletName = (w: TargetWallet) => w === 'spot' ? 'Funding' : w === 'futures' ? 'Trading' : 'Earn';

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-primary)] z-[1100] flex flex-col px-4 pb-0 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-6 bg-[var(--bg-primary)] z-10 sticky pt-safe top-0">
                <button
                    onClick={() => window.history.back()}
                    className="p-1 -ml-1 text-[var(--text-primary)]"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[19px] text-[var(--text-primary)]">
                    Transfer
                </div>
                <button
                    onClick={() => setActivePage('trade-history')}
                    className="p-1 text-[var(--text-primary)]"
                >
                    <HistoryIcon size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                {/* Account Selection Box */}
                <div className="relative mb-8 pt-2">
                    <div className="space-y-1">
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5 flex flex-col justify-center h-[72px]">
                            <span className="text-[13px] text-[var(--text-tertiary)] font-medium mb-1">From</span>
                            <span className="text-[17px] font-bold text-[var(--text-primary)]">{formatWalletName(fromAccount)}</span>
                        </div>
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5 flex flex-col justify-center h-[72px]">
                            <span className="text-[13px] text-[var(--text-tertiary)] font-medium mb-1">To</span>
                            <span className="text-[17px] font-bold text-[var(--text-primary)]">{formatWalletName(toAccount)}</span>
                        </div>
                    </div>

                    {/* Centric Swap Button */}
                    <button
                        onClick={handleSwapAccounts}
                        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform z-10"
                    >
                        <SwapIcon size={22} />
                    </button>
                </div>

                {/* Asset Selection */}
                <div className="mb-8">
                    <label className="block text-[15px] font-bold text-[var(--text-primary)] mb-3 ml-1">Asset</label>
                    <div
                        onClick={() => setIsCoinDrawerOpen(true)}
                        className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5 flex items-center justify-between cursor-pointer active:bg-[#edf0f3] transition-colors h-[54px]"
                    >
                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{selectedCoin}</span>
                        <ChevronDown size={24} />
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-2">
                    <label className="block text-[15px] font-bold text-[var(--text-primary)] mb-3 ml-1">Amount</label>
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5 flex items-center justify-between h-[54px] relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="bg-transparent border-none outline-none text-[16px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] flex-1 h-full"
                        />
                        <div className="flex items-center gap-3">
                            <span className="text-[15px] font-bold text-[var(--text-secondary)]">{selectedCoin}</span>
                            <button
                                onClick={handleMaxAmount}
                                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-3 py-1.5 rounded-full text-[12px] font-bold active:scale-95 transition-transform"
                            >
                                Max
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 ml-1 text-[13px] text-[var(--text-tertiary)] font-medium tracking-tight">
                        <div className="mt-3 ml-1 text-[13px] text-[var(--text-tertiary)] font-medium tracking-tight">
                            Available {availableBalance.toFixed(8).replace(/\.?0+$/, '')} {selectedCoin}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Button */}
            <div className="p-4 bg-[var(--bg-primary)] pb-10">
                <button
                    onClick={handleSimulateTransfer}
                    disabled={!amount || isSimulating || parseFloat(amount) > availableBalance}
                    className={`w-full h-14 rounded-full font-bold text-[17px] transition-all ${(amount && parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance)
                        ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] active:scale-[0.98]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                        }`}
                >
                    {isSimulating ? 'Processing...' : 'Confirm'}
                </button>
            </div>

            {/* Coin Selector Drawer */}
            <AnimatePresence>
                {isCoinDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                            onClick={() => setIsCoinDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] rounded-t-[32px] z-[501] overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="w-12 h-1.5 bg-[var(--bg-secondary)] rounded-full mx-auto mt-3 mb-1" />
                            <div className="flex items-center justify-center py-4 font-bold text-[18px] text-[var(--text-primary)]">
                                Select Asset
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 pb-10">
                                {availableCoins.map(coin => (
                                    <div
                                        key={coin.symbol}
                                        className="p-4 px-5 cursor-pointer active:bg-[var(--bg-hover)] flex items-center justify-between rounded-2xl"
                                        onClick={() => { setSelectedCoin(coin.symbol); setIsCoinDrawerOpen(false); }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <CoinIcon symbol={coin.symbol} size={8} />
                                            <span className="font-bold text-[17px] text-[var(--text-primary)]">{coin.symbol}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[15px] text-[var(--text-primary)]">
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

        </motion.div>
    );
};

export default TransferView;
