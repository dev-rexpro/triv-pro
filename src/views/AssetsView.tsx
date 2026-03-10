// @ts-nocheck
import React, { useState, useMemo } from 'react';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import CurrencySelector from '../components/CurrencySelector';
import ConfirmDialog from '../components/ConfirmDialog';
import { convertAmount } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck as Check, FiChevronRight as ChevronRight, FiSearch as Search,
    FiEye as Eye, FiEyeOff as EyeOff, FiArrowRight as ArrowRight,
    FiCalendar as CalendarDays, FiBriefcase as Briefcase, FiDollarSign as CircleDollarSign,
    FiDownload as ArrowDownToLine, FiUpload as ArrowUpFromLine,
    FiRepeat as ArrowRightLeft, FiRefreshCcw as RefreshCcw, FiTrendingUp as LineChart,
} from 'react-icons/fi';
import { TbFilter2Cog } from 'react-icons/tb';
import { GrDocumentTime as History, GrDocumentTime as AlarmClock } from 'react-icons/gr';
import { RiHistoryLine, RiCustomerService2Line, RiArrowRightSLine, RiEyeLine, RiEyeOffLine, RiCoinLine } from 'react-icons/ri';
import { BiLogOut } from 'react-icons/bi';
import { LuTimerReset as TimerReset } from 'react-icons/lu';
import { FaCoins as Coins } from 'react-icons/fa';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import { RiPlayListAddFill as MoreHorizontal } from 'react-icons/ri';
import { AutoShrink } from '../components/AutoShrink';
import { SlotTicker } from '../components/SlotTicker';

const AssetsView = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [hideZero, setHideZero] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const {
        balance, spotBalance, futuresBalance, earnBalance, todayPnl, todaySpotPnl, pnlPercent,
        assets, rates, currency, setDepositOptionOpen, setActivePage, resetWallets,
        hideBalance, setHideBalance, futuresUnrealizedPnl
    } = useExchangeStore();
    const liveSpotBalance = spotBalance;
    const totalBalance = balance;
    const pnl = activeTab === 'Spot' ? todaySpotPnl : todayPnl;
    const pnlColor = pnl >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]';
    const pnlPrefixSymbol = pnl >= 0 ? '+' : '-';

    // Calculate Spot-specific percentage if in Spot tab
    const openingSpotBalance = spotBalance - todaySpotPnl;
    const spotPnlPercent = openingSpotBalance > 0 ? (todaySpotPnl / openingSpotBalance) * 100 : 0;
    const displayPnlPercent = activeTab === 'Spot' ? spotPnlPercent : pnlPercent;

    const sortedAssets = [...assets].sort((a, b) => b.valueUsdt - a.valueUsdt);
    const filteredAssets = hideZero ? sortedAssets.filter(a => a.valueUsdt > 0) : sortedAssets;
    const liveFuturesBalance = futuresBalance + futuresUnrealizedPnl;
    const displayBalance = activeTab === 'Overview' ? totalBalance : activeTab === 'Spot' ? liveSpotBalance : activeTab === 'Futures' ? liveFuturesBalance : 0;
    const convertedBalance = useMemo(() => convertAmount(displayBalance, currency, rates), [displayBalance, currency, rates]);
    const convertedPnl = useMemo(() => convertAmount(pnl, currency, rates), [pnl, currency, rates]);
    const secondaryCurrency = currency === 'IDR' ? 'USD' : 'IDR';
    const secondaryRate = rates?.[secondaryCurrency] || (secondaryCurrency === 'IDR' ? 16300 : 1);
    const secondarySymbol = secondaryCurrency === 'IDR' ? 'Rp' : '$';

    const handleConfirmReset = () => {
        setIsConfirmOpen(false);
        resetWallets();
        setToastMessage('Balances successfully reset to default');
        setTimeout(() => setToastMessage(''), 3000);
    };

    return (
        <div className={`flex flex-col w-full min-h-screen bg-[#FDFDFD] text-slate-900 font-sans ${activeTab === 'Overview' ? 'pb-[220px]' : 'pb-24'}`}>
            <div className="bg-[#FDFDFD] sticky top-0 z-50 pt-[var(--safe-area-top)]">
                <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex gap-5 text-[18px] font-medium text-slate-400 overflow-x-auto no-scrollbar">
                        {['Overview', 'Spot', 'Futures', 'Earn'].map((tab) => (
                            <span key={tab} onClick={() => setActiveTab(tab)} className={`cursor-pointer whitespace-nowrap ${tab === activeTab ? 'text-slate-900' : ''}`}>{tab}</span>
                        ))}
                    </div>
                    <MoreHorizontal size={20} className="text-slate-900" />
                </div>
            </div>

            <div className="p-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-slate-500 text-[13px] font-medium">
                            <span className="mr-1">{activeTab === 'Overview' ? 'Est total value' : activeTab === 'Earn' ? 'Asset Value(est.)' : `${activeTab} Value`} (</span>
                            <CurrencySelector />
                            <span>)</span>
                            {!hideBalance ? <Eye size={16} className="ml-2 cursor-pointer" onClick={() => setHideBalance(true)} /> : <EyeOff size={16} className="ml-2 cursor-pointer" onClick={() => setHideBalance(false)} />}
                        </div>
                        <div className="flex items-center text-slate-400 gap-4">
                            <span className="cursor-pointer text-[#FF4D5B] active:scale-90 transition-transform">
                                <TimerReset size={18} onClick={() => setIsConfirmOpen(true)} />
                            </span>
                            <span className="cursor-pointer"><History size={16} onClick={() => setActivePage('history')} /></span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-[30px] font-medium text-slate-900 leading-none tracking-tight">
                            <AutoShrink>
                                {!hideBalance ? (
                                    <SlotTicker
                                        value={convertedBalance}
                                        decimals={currency === 'IDR' ? 0 : 2}
                                        className="block"
                                    />
                                ) : (
                                    <span className="block">******</span>
                                )}
                            </AutoShrink>
                        </div>
                        <div className="text-[13px] text-slate-400 font-medium mt-1.5 flex items-center">
                            {!hideBalance ? (
                                <span>≈{secondarySymbol}<SlotTicker value={displayBalance * secondaryRate} decimals={secondaryCurrency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                            ) : '******'}
                        </div>
                    </div>
                    {activeTab === 'Spot' || activeTab === 'Overview' ? (
                        <div className="flex items-center text-[12px] font-medium inline-flex cursor-pointer group">
                            <span className="text-slate-400 border-b border-dashed border-slate-300 mr-2">Today's PnL</span>
                            {!hideBalance ? (
                                <div className={`${pnlColor} flex items-center`}>
                                    <span>{pnlPrefixSymbol}<SlotTicker value={Math.abs(convertedPnl)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                                    <span className="ml-1">({pnlPrefixSymbol}{Math.abs(displayPnlPercent).toFixed(2)}%)</span>
                                </div>
                            ) : <span className="text-slate-400">******</span>}
                            <ChevronRight size={12} className="text-slate-300 ml-1" />
                        </div>
                    ) : activeTab === 'Futures' ? (
                        <div className="flex items-center text-[12px] font-medium inline-flex cursor-pointer group">
                            <span className="text-slate-400 border-b border-dashed border-slate-300 mr-2">Today's PnL</span>
                            {!hideBalance ? (
                                <div className={`${futuresUnrealizedPnl >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]'} flex items-center`}>
                                    <span>{futuresUnrealizedPnl >= 0 ? '+' : '-'}<SlotTicker value={Math.abs(convertAmount(futuresUnrealizedPnl, currency, rates))} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                                    <span className="ml-1">({futuresUnrealizedPnl >= 0 ? '+' : '-'}{Math.abs((futuresUnrealizedPnl / futuresBalance) * 100 || 0).toFixed(2)}%)</span>
                                </div>
                            ) : <span className="text-slate-400">******</span>}
                            <ChevronRight size={12} className="text-slate-300 ml-1" />
                        </div>
                    ) : (
                        <div className="flex items-center text-[12px] font-medium inline-flex group">
                            <span className="text-slate-400 mr-2">Yesterday's PnL</span>
                            {!hideBalance ? <div className="text-slate-500 flex items-center"><span>{currency === 'IDR' ? 'Rp' : '$'}<SlotTicker value={0} decimals={currency === 'IDR' ? 0 : 2} /></span></div> : <span className="text-slate-400">******</span>}
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'Overview' ? (
                <div className="px-5 py-2"><div className="bg-white rounded-2xl p-4 relative overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex justify-between items-center cursor-pointer"><div className="relative z-10"><h3 className="text-[17px] font-bold text-slate-900 mb-1">Earn up to 12% APY</h3><p className="text-slate-500 text-xs font-medium">Auto-invest and grow your portfolio.</p></div><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm"><ArrowRight size={16} className="text-slate-700" /></div></div></div>
            ) : (
                <div className={`px-5 py-2 flex ${activeTab === 'Spot' ? 'justify-between' : 'justify-around'} items-start`}>
                    {(activeTab === 'Spot' ? [{ icon: AlarmClock, label: 'Auto-Invest' }, { icon: ArrowDownToLine, label: 'Deposit' }, { icon: ArrowUpFromLine, label: 'Withdraw' }, { icon: ArrowRightLeft, label: 'Transfer' }, { icon: RefreshCcw, label: 'Convert' }] : activeTab === 'Futures' ? [{ icon: ArrowDownToLine, label: 'Deposit' }, { icon: ArrowRightLeft, label: 'Transfer' }, { icon: LineChart, label: 'PnL Analysis' }, { icon: CalendarDays, label: 'PnL Calendar' }] : [{ icon: ArrowRightLeft, label: 'Transfer' }, { icon: Briefcase, label: 'Earn' }, { icon: CircleDollarSign, label: 'Easy Earn' }, { icon: Coins, label: 'Dual Investment' }]).map((action, idx) => (
                        <div key={idx} onClick={() => {
                            if (action.label === 'Deposit') setDepositOptionOpen(true);
                            if (action.label === 'Withdraw') setActivePage('withdraw');
                            if (action.label === 'Transfer') setActivePage('transfer');
                        }} className="flex flex-col items-center gap-2 cursor-pointer group"><div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors"><action.icon size={20} /></div><span className="text-[11px] font-semibold text-slate-700">{action.label}</span></div>
                    ))}
                </div>
            )}

            <div className="h-2 w-full bg-slate-50/50 mt-4 border-y border-slate-100/50"></div>

            <div className={`sticky top-[44px] z-40 bg-[#FDFDFD] px-4 ${activeTab === 'Earn' ? 'py-5' : 'py-4'}`}>
                <div className={`flex justify-between items-center ${activeTab === 'Earn' ? '' : 'mb-4'}`}>
                    <div className="flex gap-4">
                        {activeTab === 'Overview' ? <span className="text-[15px] font-bold text-slate-900">Allocation</span> : activeTab === 'Spot' ? <><span className="text-[15px] font-bold text-slate-900">Crypto</span><span className="text-[15px] font-bold text-slate-300">Fiat</span></> : activeTab === 'Futures' ? <><span className="text-[15px] font-medium text-slate-400">Positions</span><span className="text-[15px] font-bold text-slate-900">Assets</span></> : <><span className="text-[15px] font-bold text-slate-900">Coin</span><span className="text-[15px] font-medium text-slate-400">Product</span></>}
                    </div>
                    {activeTab === 'Spot' ? <div className="flex items-center text-slate-400 text-[12px] font-medium gap-1"><History size={14} /><span>Tiny Swap</span></div> : activeTab === 'Earn' ? <div className="flex items-center text-slate-400 cursor-pointer"><TbFilter2Cog size={18} /></div> : null}
                </div>

                {activeTab !== 'Earn' && activeTab !== 'Overview' && (
                    <div className="flex justify-between items-center mb-6">
                        <label className="flex items-center text-slate-500 text-[13px] font-medium cursor-pointer">
                            <div className={`w-4 h-4 rounded-[3px] mr-2 flex items-center justify-center border ${hideZero ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>{hideZero && <Check size={12} className="text-white" strokeWidth={3} />}</div>
                            <input type="checkbox" className="hidden" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
                            Hide 0 balance assets
                        </label>
                        <Search size={16} className="text-slate-400" />
                    </div>
                )}

                <AssetList
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    hideBalance={hideBalance}
                    liveSpotBalance={liveSpotBalance}
                    futuresBalance={futuresBalance}
                    earnBalance={earnBalance}
                    filteredAssets={filteredAssets}
                    hideZero={hideZero}
                    currency={currency}
                    rates={rates}
                    futuresUnrealizedPnl={futuresUnrealizedPnl}
                />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Reset Balances"
                message="Are you sure you want to reset balances to default (500 USDT Spot)?"
                onConfirm={handleConfirmReset}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText="Reset"
            />

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-[#121212] flex items-center gap-2 text-white px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[1000] text-[13px] font-bold whitespace-nowrap"
                    >
                        <Check size={16} className="text-[#00C076]" />
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AssetList = React.memo(({ activeTab, setActiveTab, hideBalance, liveSpotBalance, futuresBalance, earnBalance, filteredAssets, hideZero, currency, rates, futuresUnrealizedPnl }: any) => {
    const secondaryCurrency = currency === 'IDR' ? 'USD' : 'IDR';
    const secondaryRate = rates?.[secondaryCurrency] || (secondaryCurrency === 'IDR' ? 16300 : 1);
    const secondarySymbol = secondaryCurrency === 'IDR' ? 'Rp' : '$';

    const primarySymbol = currency === 'IDR' ? 'Rp' : (currency === 'BTC' ? '₿' : (currency === 'USDT' ? '₮' : '$'));
    const primaryRate = rates?.[currency] || 1;

    return (
        <div className="flex flex-col gap-6">
            {activeTab === 'Overview' ? <>
                {[{ name: 'Spot', balance: liveSpotBalance }, { name: 'Futures', balance: futuresBalance + futuresUnrealizedPnl }, { name: 'Earn', balance: earnBalance }].map(port => (
                    <div key={`port-${port.name}`} className="flex justify-between items-center cursor-pointer" onClick={() => setActiveTab(port.name)}>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">{port.name[0]}</div><div className="flex flex-col"><span className="font-bold text-[15px] text-slate-900">{port.name}</span></div></div>
                        <div className="flex flex-col items-end"><span className="font-bold text-[15px] text-slate-900 tabular-nums">{!hideBalance ? (currency === 'IDR' ? (port.balance * rates?.IDR).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : port.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '******'}</span><span className="text-[12px] text-slate-400 font-medium tabular-nums mt-0.5">{!hideBalance ? <span>{secondarySymbol}<SlotTicker value={port.balance * secondaryRate} decimals={secondaryCurrency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}</span></div>
                    </div>
                ))}
            </> : activeTab === 'Spot' ? filteredAssets.map((asset: any) => (
                <div key={asset.symbol} className="flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-3">
                        <CoinIcon symbol={asset.symbol} size={8} />
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[15px] text-slate-900 uppercase">{asset.symbol === 'USDT' ? 'USDT' : asset.symbol}</span>
                            {asset.symbol !== 'USDT' && <span className="text-[12px] text-slate-300 font-medium">/USDT</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end"><span className="font-bold text-[15px] text-slate-900 tabular-nums">{!hideBalance ? (asset.symbol === 'BTC' ? asset.amount.toFixed(8) : asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })) : '******'}</span><span className="text-[12px] text-slate-400 font-medium tabular-nums mt-0.5">{!hideBalance ? <span>{primarySymbol}<SlotTicker value={asset.valueUsdt * (currency === 'IDR' ? rates?.IDR : 1)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}</span></div>
                </div>
            )) : activeTab === 'Futures' ? <>
                {(!hideZero || futuresBalance > 0) && (
                    <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center gap-3">
                            <CoinIcon symbol="USDT" size={8} />
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] text-slate-900">USDT</span>
                                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Equity (Wallet + PnL)</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-[15px] text-slate-900 tabular-nums">
                                {!hideBalance ? (futuresBalance + futuresUnrealizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '******'}
                            </span>
                            <span className="text-[12px] text-slate-400 font-medium tabular-nums mt-0.5">
                                {!hideBalance ? <span>{primarySymbol}<SlotTicker value={(futuresBalance + futuresUnrealizedPnl) * (currency === 'IDR' ? rates?.IDR : 1)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}
                            </span>
                        </div>
                    </div>
                )}
                {hideZero ? null : ['BTC', 'ETH', 'SOL', 'ADA'].map(sym => (
                    <div key={`fut-zero-${sym}`} className="flex justify-between items-center cursor-pointer"><div className="flex items-center gap-3"><CoinIcon symbol={sym} size={8} /><div className="flex flex-col"><span className="font-bold text-[15px] text-slate-900">{sym}</span></div></div><div className="flex flex-col items-end"><span className="font-bold text-[15px] text-slate-900 tabular-nums">{!hideBalance ? '0.00000000' : '******'}</span><span className="text-[12px] text-slate-400 font-medium tabular-nums mt-0.5">{!hideBalance ? <span>{primarySymbol}<SlotTicker value={0} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}</span></div></div>
                ))}
            </> : activeTab === 'Earn' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-10 h-12 border-2 border-slate-300 rounded-md flex flex-col items-start justify-center p-2 mb-4 relative bg-transparent"><div className="w-5 h-[2px] bg-slate-300 rounded-full mb-1.5"></div><div className="w-3 h-[2px] bg-slate-300 rounded-full"></div></div><span className="text-slate-400 text-[13px] font-medium mb-3">No active subscriptions.</span><div className="flex items-center text-slate-900 text-[15px] font-bold cursor-pointer group"><span className="group-hover:underline">Go to Earn</span><ArrowRight size={16} className="ml-1" strokeWidth={2.5} /></div></div>
            ) : <div className="text-slate-400 text-center py-4 text-sm font-medium">No assets to display for {activeTab}.</div>}
        </div>
    );
});

AssetList.displayName = 'AssetList';

export default AssetsView;
