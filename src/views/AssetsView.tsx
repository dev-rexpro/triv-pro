// @ts-nocheck
import React, { useState, useMemo } from 'react';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import CurrencySelector from '../components/CurrencySelector';
import ConfirmDialog from '../components/ConfirmDialog';
import { convertAmount, getCurrencySymbol } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck as Check, FiChevronRight as ChevronRight, FiSearch as Search,
    FiEye as Eye, FiEyeOff as EyeOff, FiArrowRight as ArrowRight,
    FiCalendar as CalendarDays, FiBriefcase as Briefcase, FiDollarSign as CircleDollarSign,
    FiDownload as ArrowDownToLine, FiUpload as ArrowUpFromLine,
    FiRepeat as ArrowRightLeft, FiRefreshCcw as RefreshCcw, FiTrendingUp as LineChart,
    FiEdit2 as FiEdit
} from 'react-icons/fi';
import { TbFilter2Cog } from 'react-icons/tb';
import { GrDocumentTime as History, GrDocumentTime as AlarmClock } from 'react-icons/gr';
import { RiHistoryLine, RiCustomerService2Line, RiArrowRightSLine, RiEyeLine, RiEyeOffLine, RiCoinLine } from 'react-icons/ri';
import { BiLogOut } from 'react-icons/bi';
import { LuTimerReset as TimerReset, LuArrowLeftRight } from 'react-icons/lu';
import { FaCoins as Coins } from 'react-icons/fa';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import { RiPlayListAddFill as MoreHorizontal } from 'react-icons/ri';
import { AutoShrink } from '../components/AutoShrink';
import { SlotTicker } from '../components/SlotTicker';

const AssetsView = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [hideZero, setHideZero] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const {
        balance, spotBalance, futuresBalance, earnBalance, todayPnl, todaySpotPnl, pnlPercent,
        assets, rates, currency, setDepositOptionOpen, setActivePage, resetWallets,
        hideBalance, setHideBalance, futuresUnrealizedPnl
    } = useExchangeStore();
    const liveSpotBalance = spotBalance;
    const totalBalance = balance;
    const pnl = activeTab === 'Spot' ? todaySpotPnl : todayPnl;
    const pnlColor = pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]';
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
        useExchangeStore.getState().showToast('Wallets Reset', 'Balances successfully reset to default', 'success');
    };

    return (
        <div className={`flex flex-col w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans ${activeTab === 'Overview' ? 'pb-[220px]' : 'pb-24'}`}>
            <div className="bg-[var(--bg-primary)] sticky top-0 z-50 pt-[var(--safe-area-top)]">
                <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex gap-5 text-[18px] font-medium text-[var(--text-tertiary)] overflow-x-auto no-scrollbar">
                        {['Overview', 'Spot', 'Futures', 'Earn'].map((tab) => (
                            <span key={tab} onClick={() => setActiveTab(tab)} className={`cursor-pointer whitespace-nowrap ${tab === activeTab ? 'text-[var(--text-primary)]' : ''}`}>{tab}</span>
                        ))}
                    </div>
                    <MoreHorizontal size={20} className="text-[var(--text-primary)]" />
                </div>
            </div>

            <div className="p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-[var(--text-secondary)] text-[13px] font-medium">
                            <span className="mr-1">{activeTab === 'Overview' ? 'Est total value' : activeTab === 'Earn' ? 'Asset Value(est.)' : `${activeTab} Value`} (</span>
                            <CurrencySelector />
                            <span>)</span>
                            {!hideBalance ? <Eye size={16} className="ml-2 cursor-pointer" onClick={() => setHideBalance(true)} /> : <EyeOff size={16} className="ml-2 cursor-pointer" onClick={() => setHideBalance(false)} />}
                        </div>
                        <div className="flex items-center text-[var(--text-tertiary)] gap-4">
                            <span className="cursor-pointer text-[var(--red)] active:scale-90 transition-transform">
                                <TimerReset size={18} onClick={() => setIsConfirmOpen(true)} />
                            </span>
                            <span className="cursor-pointer"><History size={16} onClick={() => setActivePage('history')} /></span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-[30px] font-medium text-[var(--text-primary)] leading-none tracking-tight">
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
                        <div className="text-[13px] text-[var(--text-tertiary)] font-medium mt-1.5 flex items-center">
                            {!hideBalance ? (
                                <span>≈{secondarySymbol}<SlotTicker value={displayBalance * secondaryRate} decimals={secondaryCurrency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                            ) : '******'}
                        </div>
                    </div>
                    {activeTab === 'Spot' || activeTab === 'Overview' ? (
                        <div className="flex items-center text-[12px] font-medium inline-flex cursor-pointer group">
                            <span className="text-[var(--text-tertiary)] border-b border-dashed border-[var(--border-strong)] mr-2">Today's PnL</span>
                            {!hideBalance ? (
                                <div className={`${pnlColor} flex items-center`}>
                                    <span>{pnlPrefixSymbol}{getCurrencySymbol(currency)}<SlotTicker value={Math.abs(convertedPnl)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                                    <span className="ml-1">({pnlPrefixSymbol}{Math.abs(displayPnlPercent).toFixed(2)}%)</span>
                                </div>
                            ) : <span className="text-[var(--text-tertiary)]">******</span>}
                            <ChevronRight size={12} className="text-[var(--text-tertiary)] ml-1" />
                        </div>
                    ) : activeTab === 'Futures' ? (
                        <div className="flex items-center text-[12px] font-medium inline-flex cursor-pointer group">
                            <span className="text-[var(--text-tertiary)] border-b border-dashed border-[var(--border-strong)] mr-2">Today's PnL</span>
                            {!hideBalance ? (
                                <div className={`${futuresUnrealizedPnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'} flex items-center`}>
                                    <span>{futuresUnrealizedPnl >= 0 ? '+' : '-'}{getCurrencySymbol(currency)}<SlotTicker value={Math.abs(convertAmount(futuresUnrealizedPnl, currency, rates))} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span>
                                    <span className="ml-1">({futuresUnrealizedPnl >= 0 ? '+' : '-'}{Math.abs((futuresUnrealizedPnl / futuresBalance) * 100 || 0).toFixed(2)}%)</span>
                                </div>
                            ) : <span className="text-[var(--text-tertiary)]">******</span>}
                            <ChevronRight size={12} className="text-[var(--text-tertiary)] ml-1" />
                        </div>
                    ) : (
                        <div className="flex items-center text-[12px] font-medium inline-flex group">
                            <span className="text-[var(--text-tertiary)] mr-2">Yesterday's PnL</span>
                            {!hideBalance ? <div className="text-[var(--text-secondary)] flex items-center"><span>{getCurrencySymbol(currency)}<SlotTicker value={0} decimals={currency === 'IDR' ? 0 : 2} /></span></div> : <span className="text-[var(--text-tertiary)]">******</span>}
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'Overview' ? (
                <div className="px-5 py-2"><div className="bg-[var(--bg-card)] rounded-2xl p-4 relative overflow-hidden border border-[var(--border-color)] flex justify-between items-center cursor-pointer"><div className="relative z-10"><h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-1">Earn up to 12% APY</h3><p className="text-[var(--text-secondary)] text-xs font-medium">Auto-invest and grow your portfolio.</p></div><div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center shrink-0 border border-[var(--border-color)] shadow-sm"><ArrowRight size={16} className="text-[var(--text-secondary)]" /></div></div></div>
            ) : (
                <div className={`px-5 py-2 flex ${activeTab === 'Spot' ? 'justify-between' : 'justify-around'} items-start`}>
                    {(activeTab === 'Spot' ? [{ icon: AlarmClock, label: 'Auto-Invest' }, { icon: ArrowDownToLine, label: 'Deposit' }, { icon: ArrowUpFromLine, label: 'Withdraw' }, { icon: LuArrowLeftRight, label: 'Transfer' }, { icon: ArrowRightLeft, label: 'Convert' }] : activeTab === 'Futures' ? [{ icon: ArrowDownToLine, label: 'Deposit' }, { icon: LuArrowLeftRight, label: 'Transfer' }, { icon: LineChart, label: 'PnL Analysis' }, { icon: CalendarDays, label: 'PnL Calendar' }] : [{ icon: LuArrowLeftRight, label: 'Transfer' }, { icon: Briefcase, label: 'Earn' }, { icon: CircleDollarSign, label: 'Easy Earn' }, { icon: Coins, label: 'Dual Investment' }]).map((action, idx) => (
                        <div key={idx} onClick={() => {
                            if (action.label === 'Deposit') setDepositOptionOpen(true);
                            if (action.label === 'Withdraw') setActivePage('withdraw');
                            if (action.label === 'Transfer') setActivePage('transfer');
                            if (action.label === 'Convert') setActivePage('convert');
                        }} className="flex flex-col items-center gap-2 cursor-pointer group"><div className="w-11 h-11 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--bg-hover)] transition-colors"><action.icon size={20} /></div><span className="text-[11px] font-semibold text-[var(--text-secondary)]">{action.label}</span></div>
                    ))}
                </div>
            )}

            <div className="mx-4 mt-6 border-t border-[var(--border-color)]/60"></div>

            <div className={`sticky top-[44px] z-40 bg-[var(--bg-primary)] px-4 ${activeTab === 'Earn' ? 'py-5' : 'py-4'}`}>
                <div className={`flex justify-between items-center ${activeTab === 'Earn' ? '' : 'mb-4'}`}>
                    <div className="flex gap-4">
                        {activeTab === 'Overview' ? <span className="text-[15px] font-bold text-[var(--text-primary)]">Allocation</span> : activeTab === 'Spot' ? <><span className="text-[15px] font-bold text-[var(--text-primary)]">Crypto</span><span className="text-[15px] font-bold text-[var(--text-tertiary)]">Fiat</span></> : activeTab === 'Futures' ? <><span className="text-[15px] font-medium text-[var(--text-tertiary)]">Positions</span><span className="text-[15px] font-bold text-[var(--text-primary)]">Assets</span></> : <><span className="text-[15px] font-bold text-[var(--text-primary)]">Coin</span><span className="text-[15px] font-medium text-[var(--text-tertiary)]">Product</span></>}
                    </div>
                    {activeTab === 'Spot' ? <div className="flex items-center text-[var(--text-tertiary)] text-[12px] font-medium gap-1"><History size={14} /><span>Tiny Swap</span></div> : activeTab === 'Earn' ? <div className="flex items-center text-[var(--text-tertiary)] cursor-pointer"><TbFilter2Cog size={18} /></div> : null}
                </div>

                {activeTab !== 'Earn' && activeTab !== 'Overview' && (
                    <div className="flex justify-between items-center mb-6">
                        <label className="flex items-center text-[var(--text-secondary)] text-[13px] font-medium cursor-pointer">
                            <div className={`w-4 h-4 rounded-[3px] mr-2 flex items-center justify-center border ${hideZero ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]' : 'border-[var(--border-strong)] bg-[var(--bg-card)]'}`}>{hideZero && <Check size={12} className="text-[var(--btn-primary-text)]" strokeWidth={3} />}</div>
                            <input type="checkbox" className="hidden" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
                            Hide 0 balance assets
                        </label>
                        <Search size={16} className="text-[var(--text-tertiary)]" />
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

        </div>
    );
};

const AssetList = React.memo(({ activeTab, setActiveTab, hideBalance, liveSpotBalance, futuresBalance, earnBalance, filteredAssets, hideZero, currency, rates, futuresUnrealizedPnl }: any) => {
    const { spotCostBasis, markets, setSpotCostPrice } = useExchangeStore();
    const [editingCoin, setEditingCoin] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const secondaryCurrency = currency === 'IDR' ? 'USD' : 'IDR';
    const secondaryRate = rates?.[secondaryCurrency] || (secondaryCurrency === 'IDR' ? 16300 : 1);
    const secondarySymbol = secondaryCurrency === 'IDR' ? 'Rp' : '$';

    const primarySymbol = currency === 'IDR' ? 'Rp' : (currency === 'BTC' ? '₿' : (currency === 'USDT' ? '₮' : '$'));
    const primaryRate = rates?.[currency] || 1;

    const handleEditCost = (coin: string, currentPrice: number) => {
        setEditingCoin(coin);
        setEditValue(currentPrice ? currentPrice.toString() : '');
    };

    const saveCostPrice = async () => {
        if (editingCoin) {
            await setSpotCostPrice(editingCoin, parseFloat(editValue) || 0);
            setEditingCoin(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {activeTab === 'Overview' ? <>
                {[{ name: 'Spot', balance: liveSpotBalance }, { name: 'Futures', balance: futuresBalance + futuresUnrealizedPnl }, { name: 'Earn', balance: earnBalance }].map(port => (
                    <div key={`port-${port.name}`} className="flex justify-between items-center cursor-pointer" onClick={() => setActiveTab(port.name)}>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-sm">{port.name[0]}</div><div className="flex flex-col"><span className="font-bold text-[15px] text-[var(--text-primary)]">{port.name}</span></div></div>
                        <div className="flex flex-col items-end"><span className="font-bold text-[15px] text-[var(--text-primary)] tabular-nums">{!hideBalance ? (currency === 'IDR' ? (port.balance * rates?.IDR).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : port.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '******'}</span><span className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">{!hideBalance ? <span>{secondarySymbol}<SlotTicker value={port.balance * secondaryRate} decimals={secondaryCurrency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}</span></div>
                    </div>
                ))}
            </> : activeTab === 'Spot' ? filteredAssets.map((asset: any) => {
                const market = markets.find(m => m.symbol === `${asset.symbol}USDT`);
                const lastPrice = market ? parseFloat(market.lastPrice) : 0;
                const costPrice = spotCostBasis[asset.symbol] || 0;
                
                const hasPnl = asset.symbol !== 'USDT' && costPrice > 0;
                const pnlValue = hasPnl ? (lastPrice - costPrice) * asset.amount : 0;
                const pnlPercent = hasPnl ? ((lastPrice - costPrice) / costPrice) * 100 : 0;
                const isPositive = pnlValue >= 0;

                return (
                    <div key={asset.symbol} className="bg-[var(--bg-card)] border border-[var(--border-color)]/40 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                        {/* Header: Coin and ROI */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <CoinIcon symbol={asset.symbol} size={6} />
                                <span className="font-bold text-[16px] text-[var(--text-primary)] uppercase">{asset.symbol}</span>
                                <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
                            </div>
                            {hasPnl && !hideBalance && (
                                <div className={`text-[13px] font-bold ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                    {isPositive ? '+' : ''}{pnlValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                </div>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Equity</span>
                                <span className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums">
                                    {!hideBalance ? asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '******'}
                                </span>
                                <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                                    {!hideBalance ? `$${asset.valueUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '******'}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Cost price</span>
                                <div className="flex items-center gap-1 group">
                                    {editingCoin === asset.symbol ? (
                                        <input
                                            autoFocus
                                            className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[14px] font-bold border-none outline-none rounded px-1"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveCostPrice}
                                            onKeyDown={(e) => e.key === 'Enter' && saveCostPrice()}
                                        />
                                    ) : (
                                        <>
                                            <span className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums">
                                                {costPrice > 0 ? `$${costPrice.toLocaleString()}` : '--'}
                                            </span>
                                            <FiEdit 
                                                size={12} 
                                                className="text-[var(--text-tertiary)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" 
                                                onClick={() => handleEditCost(asset.symbol, costPrice)}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Last price</span>
                                <span className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums">
                                    ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Balance & Buttons */}
                        <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]/20">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Balance</span>
                                <span className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums">
                                    {!hideBalance ? asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '******'}
                                </span>
                                <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                                    {!hideBalance ? `$${asset.valueUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '******'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {asset.symbol !== 'USDT' && (
                                    <button className="px-5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[12px] font-bold rounded-lg transition-colors">TP/SL</button>
                                )}
                                <button className="px-5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[12px] font-bold rounded-lg transition-colors">Buy/sell</button>
                            </div>
                        </div>
                    </div>
                );
            }) : activeTab === 'Futures' ? <>
                {(!hideZero || futuresBalance > 0) && (
                    <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center gap-3">
                            <CoinIcon symbol="USDT" size={8} />
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] text-[var(--text-primary)]">USDT</span>
                                <span className="text-[11px] text-[var(--text-tertiary)] font-medium whitespace-nowrap">Equity (Wallet + PnL)</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-[15px] text-[var(--text-primary)] tabular-nums">
                                {!hideBalance ? (futuresBalance + futuresUnrealizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '******'}
                            </span>
                            <span className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">
                                {!hideBalance ? <span>{primarySymbol}<SlotTicker value={(futuresBalance + futuresUnrealizedPnl) * (currency === 'IDR' ? rates?.IDR : 1)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}
                            </span>
                        </div>
                    </div>
                )}
                {hideZero ? null : ['BTC', 'ETH', 'SOL', 'ADA'].map(sym => (
                    <div key={`fut-zero-${sym}`} className="flex justify-between items-center cursor-pointer"><div className="flex items-center gap-3"><CoinIcon symbol={sym} size={8} /><div className="flex flex-col"><span className="font-bold text-[15px] text-[var(--text-primary)]">{sym}</span></div></div><div className="flex flex-col items-end"><span className="font-bold text-[15px] text-[var(--text-primary)] tabular-nums">{!hideBalance ? '0.00000000' : '******'}</span><span className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">{!hideBalance ? <span>{primarySymbol}<SlotTicker value={0} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" /></span> : '******'}</span></div></div>
                ))}
            </> : activeTab === 'Earn' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-10 h-12 border-2 border-[var(--border-strong)] rounded-md flex flex-col items-start justify-center p-2 mb-4 relative bg-transparent"><div className="w-5 h-[2px] bg-[var(--border-strong)] rounded-full mb-1.5"></div><div className="w-3 h-[2px] bg-[var(--border-strong)] rounded-full"></div></div><span className="text-[var(--text-tertiary)] text-[13px] font-medium mb-3">No active subscriptions.</span><div className="flex items-center text-[var(--text-primary)] text-[15px] font-bold cursor-pointer group"><span className="group-hover:underline">Go to Earn</span><ArrowRight size={16} className="ml-1" strokeWidth={2.5} /></div></div>
            ) : <div className="text-[var(--text-tertiary)] text-center py-4 text-sm font-medium">No assets to display for {activeTab}.</div>}
        </div>
    );
});

AssetList.displayName = 'AssetList';

export default AssetsView;
