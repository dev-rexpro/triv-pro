import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiHelpCircle } from 'react-icons/fi';
import { LuFileClock as HistoryIcon } from 'react-icons/lu';
import { TbArrowsSort as SwapIcon } from 'react-icons/tb';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import { BsCheckCircleFill } from 'react-icons/bs';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import SearchOverlay from '../components/SearchOverlay';

const ConvertView = () => {
    const { setActivePage, wallets, markets, addTrade, setWallets } = useExchangeStore();

    const [activeTab, setActiveTab] = useState<'Instant' | 'Limit'>('Instant');
    const [fromAsset, setFromAsset] = useState('USDT');
    const [toAsset, setToAsset] = useState('BTC');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [isFromDrawerOpen, setIsFromDrawerOpen] = useState(false);
    const [isToDrawerOpen, setIsToDrawerOpen] = useState(false);

    const getConversionRate = (from: string, to: string) => {
        if (from === to) return 1;
        const getPriceInUsdt = (s: string) => {
            if (s === 'USDT') return 1;
            const m = markets.find(m => m.symbol === `${s}USDT`);
            return m ? parseFloat(m.lastPrice) : 0;
        };
        const fromPrice = getPriceInUsdt(from);
        const toPrice = getPriceInUsdt(to);
        if (fromPrice === 0 || toPrice === 0) return 0;
        return fromPrice / toPrice;
    };

    const conversionRate = useMemo(() => getConversionRate(fromAsset, toAsset), [fromAsset, toAsset, markets]);

    const handleFromAmountChange = (val: string) => {
        setFromAmount(val);
        if (!val || conversionRate === 0) {
            setToAmount('');
        } else {
            setToAmount((parseFloat(val) * conversionRate).toFixed(8).replace(/\.?0+$/, ''));
        }
    };

    const handleSwapAssets = () => {
        const temp = fromAsset;
        setFromAsset(toAsset);
        setToAsset(temp);
        setFromAmount('');
        setToAmount('');
    };

    const handleMax = () => {
        const balance = wallets.spot[fromAsset] || 0;
        handleFromAmountChange(balance.toString());
    };

    const handleConvert = () => {
        const amount = parseFloat(fromAmount);
        if (isNaN(amount) || amount <= 0) return;
        const balance = wallets.spot[fromAsset] || 0;
        if (amount > balance) return;

        setIsSimulating(true);
        setTimeout(() => {
            const finalToAmount = amount * conversionRate;
            const w = { ...wallets };
            w.spot = { ...w.spot };
            w.spot[fromAsset] -= amount;
            w.spot[toAsset] = (w.spot[toAsset] || 0) + finalToAmount;
            setWallets(w);

            addTrade({
                id: `CONV-${Date.now()}`,
                pair: `${fromAsset}/${toAsset}`,
                side: 'Buy',
                type: 'Market',
                price: conversionRate,
                amount: finalToAmount,
                total: amount,
                timestamp: Date.now()
            });

            // Log this conversion as a "Transfer" in the asset history
            useExchangeStore.getState().addTransaction({
                id: `CONV-TX-${Date.now()}`,
                type: 'Transfer',
                status: 'Completed',
                amount: amount,
                currency: fromAsset,
                from: 'Spot',
                to: 'Spot', // Technically it's an exchange, but history tracks movement
                timestamp: Date.now()
            });

            setIsSimulating(false);
            useExchangeStore.getState().showToast('Conversion Successful', `Successfully converted ${amount} ${fromAsset} to ${finalToAmount.toFixed(6)} ${toAsset}.`, 'success');
            setFromAmount('');
            setToAmount('');
        }, 1200);
    };

    const fromBalance = wallets.spot[fromAsset] || 0;
    const toBalance = wallets.spot[toAsset] || 0;

    // Filter available assets for "From" to only show owned coins
    const ownedAssets = useMemo(() => {
        return Object.entries(wallets.spot || {})
            .filter(([_, balance]) => balance > 0)
            .map(([symbol]) => symbol);
    }, [wallets.spot]);



    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-primary)] z-[300] flex flex-col px-4 pb-0 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-6 bg-[var(--bg-primary)] z-10 sticky pt-safe top-0">
                <button onClick={() => window.history.back()} className="p-1 -ml-1 text-[var(--text-primary)]">
                    <ChevronLeft size={28} />
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-[19px] text-[var(--text-primary)]">Convert</span>
                    <span className="bg-[#EBF3FA] text-[#3189C6] text-[11px] font-bold px-1.5 py-0.5 rounded">0 Fees</span>
                </div>
                <button className="p-1 text-[var(--text-primary)]">
                    <FiHelpCircle size={24} />
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-8 mb-6 px-1">
                <button
                    onClick={() => setActiveTab('Instant')}
                    className={`text-[17px] font-bold transition-all relative pb-2 ${activeTab === 'Instant' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                >
                    Instant
                    {activeTab === 'Instant' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[var(--text-primary)] rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('Limit')}
                    className={`text-[17px] font-bold transition-all relative pb-2 ${activeTab === 'Limit' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                >
                    Limit
                    {activeTab === 'Limit' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[var(--text-primary)] rounded-full" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                <div className="relative mb-6">
                    <div className="space-y-1">
                        {/* From Section */}
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[13px] text-[var(--text-tertiary)] font-medium">From</span>
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Available {fromBalance.toFixed(8).replace(/\.?0+$/, '')} {fromAsset}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div onClick={() => setIsFromDrawerOpen(true)} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                                    <CoinIcon symbol={fromAsset} size={6} />
                                    <span className="text-[18px] font-bold text-[var(--text-primary)]">{fromAsset}</span>
                                    <div className="text-[var(--text-tertiary)] mt-0.5"><ChevronDown size={22} /></div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <input
                                        type="number"
                                        value={fromAmount}
                                        onChange={(e) => handleFromAmountChange(e.target.value)}
                                        placeholder="0"
                                        className="bg-transparent border-none text-right outline-none text-[20px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-32"
                                    />
                                    <button onClick={handleMax} className="text-[var(--text-primary)] text-[13px] font-extrabold mt-0.5 whitespace-nowrap">Max.</button>
                                </div>
                            </div>
                        </div>

                        {/* To Section */}
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 pl-5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[13px] text-[var(--text-tertiary)] font-medium">To</span>
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Available {toBalance.toFixed(8).replace(/\.?0+$/, '')} {toAsset}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div onClick={() => setIsToDrawerOpen(true)} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                                    <CoinIcon symbol={toAsset} size={6} />
                                    <span className="text-[18px] font-bold text-[var(--text-primary)]">{toAsset}</span>
                                    <div className="text-[var(--text-tertiary)] mt-0.5"><ChevronDown size={22} /></div>
                                </div>
                                <div className="flex flex-col items-end pt-1">
                                    <span className={`text-[20px] font-bold ${toAmount ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                                        {toAmount || '0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Centric Swap Button */}
                    <button
                        onClick={handleSwapAssets}
                        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all hover:scale-105 z-20"
                    >
                        <SwapIcon size={22} />
                    </button>
                </div>

                {/* Conversion Rate */}
                <div className="mt-8 text-center px-4">
                    <p className="text-[13px] text-[var(--text-tertiary)] font-medium tracking-tight">
                        Rate: 1 {fromAsset} ≈ {conversionRate ? conversionRate.toFixed(8).replace(/\.?0+$/, '') : '--'} {toAsset}
                    </p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="p-4 bg-[var(--bg-primary)] pb-10 flex flex-col items-center gap-4">
                <button
                    onClick={() => setActivePage('trade-history')}
                    className="flex items-center gap-2 text-[var(--text-tertiary)] font-bold text-[14px] mb-2"
                >
                    <HistoryIcon size={18} />
                    Convert Orders
                </button>

                {fromAmount && parseFloat(fromAmount) > fromBalance ? (
                    <button className="w-full h-14 rounded-full bg-[var(--bg-secondary)] text-[var(--text-tertiary)] font-bold text-[17px] cursor-not-allowed">
                        Insufficient balance
                    </button>
                ) : (
                    <button
                        onClick={handleConvert}
                        disabled={!fromAmount || isSimulating || parseFloat(fromAmount) <= 0}
                        className={`w-full h-14 rounded-full font-bold text-[17px] transition-all ${(fromAmount && parseFloat(fromAmount) > 0)
                            ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] active:scale-[0.98]'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                            }`}
                    >
                        {isSimulating ? 'Converting...' : 'Preview Conversion'}
                    </button>
                )}
            </div>

            {/* Asset Selectors */}
            <AnimatePresence>
                {isFromDrawerOpen && (
                    <AssetSelectorOverlay
                        onClose={() => setIsFromDrawerOpen(false)}
                        onSelect={(asset) => {
                            setFromAsset(asset);
                            setIsFromDrawerOpen(false);
                            setFromAmount('');
                            setToAmount('');
                        }}
                        selectedAsset={fromAsset}
                        assets={ownedAssets}
                        showPrices={false}
                    />
                )}
                {isToDrawerOpen && (
                    <SearchOverlay
                        mode="selectSpot"
                        onSelect={(asset) => {
                            setToAsset(asset);
                            setIsToDrawerOpen(false);
                            setFromAmount('');
                            setToAmount('');
                        }}
                        onClose={() => setIsToDrawerOpen(false)}
                    />
                )}
            </AnimatePresence>

        </motion.div>
    );
};

const AssetSelectorOverlay = ({ onClose, onSelect, selectedAsset, assets, showPrices }: { onClose: () => void, onSelect: (asset: string) => void, selectedAsset: string, assets: string[], showPrices: boolean }) => {
    const [search, setSearch] = useState('');
    const { markets } = useExchangeStore();

    const filteredAssets = assets.filter(a =>
        a.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-card)] z-[500] flex flex-col pt-safe overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center px-4 py-4 gap-4">
                <button onClick={onClose} className="p-1 -ml-1 text-[var(--text-primary)]">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-[19px] font-bold text-[var(--text-primary)]">Select Asset</h2>
            </div>

            {/* Search Bar */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search asset"
                        className="w-full bg-[var(--bg-secondary)] rounded-full py-3.5 pl-11 pr-4 text-[15px] font-medium placeholder:text-[var(--text-tertiary)] outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-10">
                {filteredAssets.length > 0 ? filteredAssets.map(asset => {
                    const market = markets.find(m => m.symbol === `${asset}USDT`);
                    const price = market ? parseFloat(market.lastPrice) : null;
                    const change = market ? parseFloat(market.priceChangePercent) : null;

                    return (
                        <div
                            key={asset}
                            className={`p-4 px-3 cursor-pointer flex items-center justify-between rounded-2xl transition-colors ${selectedAsset === asset ? 'bg-[var(--bg-secondary)]' : 'active:bg-[var(--bg-hover)]'}`}
                            onClick={() => onSelect(asset)}
                        >
                            <div className="flex items-center gap-3.5">
                                <CoinIcon symbol={asset} size={10} />
                                <div className="flex flex-col">
                                    <span className="font-bold text-[16px] text-[var(--text-primary)] leading-none mb-1">{asset}</span>
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Spot</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {showPrices && price !== null && (
                                    <div className="text-right">
                                        <div className="font-bold text-[15px] text-[var(--text-primary)] leading-none mb-1">
                                            {price >= 1 ? price.toLocaleString() : price.toFixed(6)}
                                        </div>
                                        <div className={`text-[12px] font-bold ${change >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-20 text-[var(--text-tertiary)] font-medium text-[15px]">No assets found</div>
                )}
            </div>
        </motion.div>
    );
};

export default ConvertView;
