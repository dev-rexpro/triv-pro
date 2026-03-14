import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import MarketRow from '../components/MarketRow';
import CurrencySelector from '../components/CurrencySelector';
import FavoritesBottomSheet from '../components/FavoritesBottomSheet';
import { SlotTicker } from '../components/SlotTicker';
import { convertAmount } from '../utils/format';
import trivLogo from '../assets/triv-logo.svg';
import ojkLogo from '../assets/ojk.png';
import bappebtiLogo from '../assets/bappebti.png';
import {
    FiSearch as Search,
    FiMenu as Menu,
    FiBell as Bell,
    FiEye as Eye,
    FiEyeOff as EyeOff,
    FiGift as Gift,
    FiGrid as Grid,
    FiChevronRight as ChevronRight,
} from 'react-icons/fi';
import { TbFilter2Cog } from 'react-icons/tb';
import {
    MdLocalFireDepartment as Flame,
    MdOutlineArrowDropUp as ChevronUp,
    MdOutlineArrowDropDown as ChevronDown,
} from 'react-icons/md';
import { IoTicketOutline as Ticket } from 'react-icons/io5';
import { PiHeadset as Headphones } from 'react-icons/pi';
import { LuUser as User, LuChevronUp, LuChevronDown } from 'react-icons/lu';
import { BiCoinStack } from 'react-icons/bi';
import {
    RiTelegramFill,
    RiYoutubeFill,
    RiFacebookBoxFill,
    RiInstagramFill,
    RiTiktokFill
} from 'react-icons/ri';
import { HiOutlineArrowDownTray as ArrowDownTray, HiOutlineArrowUpTray as ArrowUpTray, HiOutlineArrowsRightLeft as ArrowsRightLeft, HiOutlineChartBar as ChartBar } from 'react-icons/hi2';
import { PnLChart } from '../components/PnLChart';
import { AutoShrink } from '../components/AutoShrink';
import { formatCurrency, getCurrencySymbol, formatPrice } from '../utils/format';
import ModeSelectorSheet from '../components/ModeSelectorSheet';
import AnimatedPlaceholder from '../components/AnimatedPlaceholder';
import { useThrottledOrder } from '../hooks/useThrottledOrder';
import { motion, AnimatePresence } from 'framer-motion';

const HomeView = () => {
    const balance = useExchangeStore(state => state.balance);
    const todayPnl = useExchangeStore(state => state.todayPnl);
    const pnlPercent = useExchangeStore(state => state.pnlPercent);
    const markets = useExchangeStore(state => state.markets);
    const futuresMarkets = useExchangeStore(state => state.futuresMarkets);
    const setActivePage = useExchangeStore(state => state.setActivePage);
    const setSearchOpen = useExchangeStore(state => state.setSearchOpen);
    const homeFilter = useExchangeStore(state => state.homeFilter);
    const setHomeFilter = useExchangeStore(state => state.setHomeFilter);
    const favorites = useExchangeStore(state => state.favorites);
    const favoriteGroups = useExchangeStore(state => state.favoriteGroups);
    const hiddenGroups = useExchangeStore(state => state.hiddenGroups);
    const globalCurrency = useExchangeStore(state => state.currency);
    const rates = useExchangeStore(state => state.rates);
    const setDepositOptionOpen = useExchangeStore(state => state.setDepositOptionOpen);
    const hideBalance = useExchangeStore(state => state.hideBalance);
    const setHideBalance = useExchangeStore(state => state.setHideBalance);
    const getPnLForTimeframe = useExchangeStore(state => state.getPnLForTimeframe);
    const currency = (globalCurrency === 'BTC' || globalCurrency === 'USDT') ? 'USD' : globalCurrency;
    const [isFavSheetOpen, setIsFavSheetOpen] = useState(false);
    const [favSubFilter, setFavSubFilter] = useState('All');
    const [isPnlExpanded, setIsPnlExpanded] = useState(false);
    const [pnlTimeframe, setPnlTimeframe] = useState('1D');
    const [isModeSheetOpen, setIsModeSheetOpen] = useState(false);
    const [currentMode, setCurrentMode] = useState('Exchange');
    const sortedSymbols = useMemo(() => {
        let list = [...markets];
        switch (homeFilter) {
            case 'Favorites': {
                const combined = [...markets, ...futuresMarkets];
                const resolveMarket = (fav: string) => {
                    if (fav.includes(':')) {
                        const [sym, type] = fav.split(':');
                        return combined.find(m => m.symbol === sym && (type === 'futures' ? m.isFutures : !m.isFutures));
                    }
                    return combined.find(m => m.symbol === fav);
                };

                if (favSubFilter === 'All') return favorites;
                if (favSubFilter === 'Futures') return favorites.filter(f => resolveMarket(f)?.isFutures);
                if (favSubFilter === 'Spot') return favorites.filter(f => !resolveMarket(f)?.isFutures);

                const groupSymbols = favoriteGroups[favSubFilter] || [];
                return favorites.filter(f => groupSymbols.includes(f));
            }
            case 'Hot':
                return list.sort((a, b) => {
                    const diff = parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
                    return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                }).map(m => m.symbol);
            case 'New':
                return list.slice().reverse().slice(0, 10).map(m => m.symbol);
            case 'Popular':
            case 'Highest Volume':
                return list.sort((a, b) => {
                    const diff = parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
                    return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                }).map(m => m.symbol);
            case 'Gainers':
                return list.sort((a, b) => {
                    const diff = parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent);
                    return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                }).map(m => m.symbol);
            case 'Losers':
                return list.sort((a, b) => {
                    const diff = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent);
                    return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                }).map(m => m.symbol);
            default:
                return list.sort((a, b) => a.symbol.localeCompare(b.symbol)).map(m => m.symbol);
        }
    }, [markets, futuresMarkets, homeFilter, favorites, favSubFilter]);

    const isInteracting = React.useRef(false);
    const interactionTimeout = React.useRef<any>(null);

    const handleInteraction = useCallback(() => {
        isInteracting.current = true;
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            isInteracting.current = false;
        }, 30000); // Resume 30s after last interaction
    }, []);

    const stableSymbols = useThrottledOrder(sortedSymbols, isInteracting, [homeFilter, favSubFilter], 30000);

    const filteredMarkets = useMemo(() => {
        const combined = [...markets, ...futuresMarkets];
        return stableSymbols.map(id => {
            if (id.includes(':')) {
                const [sym, type] = id.split(':');
                return combined.find(m => m.symbol === sym && (type === 'futures' ? m.isFutures : !m.isFutures));
            }
            return combined.find(m => m.symbol === id);
        }).filter(Boolean) as any;
    }, [stableSymbols, markets, futuresMarkets]);

    const handleCoinClick = useCallback((coin: any) => {
        useExchangeStore.setState({ selectedCoin: coin.symbol });
        setActivePage(coin.isFutures ? 'futures' : 'trade');
    }, [setActivePage]);

    const displayBalance = useMemo(() => convertAmount(balance, currency, rates), [balance, currency, rates]);

    const currentPnlData = useMemo(() => {
        const pnl = getPnLForTimeframe(pnlTimeframe);
        return {
            value: pnl.value,
            displayValue: convertAmount(Math.abs(pnl.value), currency, rates),
            percent: pnl.percent,
            hasData: pnl.hasData
        };
    }, [getPnLForTimeframe, pnlTimeframe, currency, rates, balance, todayPnl]);

    // Check which timeframes have snapshot data available
    const timeframeAvailability = useMemo(() => {
        return ['1D', '1W', '1M', '6M', '1Y'].reduce((acc, tf) => {
            acc[tf] = getPnLForTimeframe(tf).hasData;
            return acc;
        }, {} as Record<string, boolean>);
    }, [getPnLForTimeframe, balance]);

    const displayPnl = currentPnlData.displayValue;
    const pnlPercentDisplay = currentPnlData.percent;
    const hasPnlData = currentPnlData.hasData;

    // Safety: if current timeframe has no data, fall back to 1D
    useEffect(() => {
        if (timeframeAvailability[pnlTimeframe] === false) {
            setPnlTimeframe('1D');
        }
    }, [timeframeAvailability, pnlTimeframe]);

    const noiseFactors = useMemo(() => {
        let pointsCount = 30;
        let volatility = 0.02;

        switch (pnlTimeframe) {
            case '1D': pointsCount = 48; volatility = 0.002; break;
            case '1W': pointsCount = 56; volatility = 0.006; break;
            case '1M': pointsCount = 60; volatility = 0.012; break;
            case '6M': pointsCount = 90; volatility = 0.03; break;
            case '1Y': pointsCount = 120; volatility = 0.06; break;
        }

        const factors = new Array(pointsCount).fill(1);
        let currentFactor = 1;
        for (let i = pointsCount - 2; i >= 0; i--) {
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            currentFactor = currentFactor / change;
            factors[i] = currentFactor;
        }
        return factors;
    }, [pnlTimeframe]);

    const chartData = useMemo(() => {
        const endValue = parseFloat(String(displayBalance).replace(/,/g, '')) || 0;
        const pnlValue = parseFloat(String(displayPnl).replace(/,/g, '')) * (currentPnlData.value >= 0 ? 1 : -1) || 0;

        const pointsCount = noiseFactors.length;
        const result = new Array(pointsCount).fill(0);
        result[pointsCount - 1] = endValue;

        for (let i = 0; i < pointsCount - 1; i++) {
            result[i] = Math.max(0, noiseFactors[i] * endValue);
        }

        if (pnlTimeframe === '1D') {
            const startValue = endValue - pnlValue;
            const generatedStart = result[0];
            const generatedDiff = endValue - generatedStart;
            const actualDiff = endValue - startValue;

            for (let i = 0; i < pointsCount - 1; i++) {
                const ratio = (result[i] - generatedStart) / (generatedDiff || 1);
                result[i] = startValue + (ratio * actualDiff);
            }
        }

        return result;
    }, [displayBalance, displayPnl, todayPnl, pnlTimeframe, noiseFactors]);

    const chartColor = useMemo(() => {
        return currentPnlData.value >= 0 ? '#00C076' : '#FF4D5B';
    }, [currentPnlData.value]);

    const formatLabel = (val: number) => {
        return currency === 'IDR' ? `Rp${val.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : `$${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="pb-20 font-sans text-[var(--text-primary)] bg-[var(--bg-primary)]">
            <div className="sticky top-0 z-50 bg-[var(--bg-primary)] flex justify-between items-center px-4 pt-[calc(16px+var(--safe-area-top))] pb-4">
                <div className="flex items-center">
                    <img src={trivLogo} alt="Triv" className="h-7" />
                </div>
                <div
                    onClick={() => setIsModeSheetOpen(true)}
                    className="bg-[var(--bg-secondary)] w-[140px] py-1 px-4 rounded-full flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                    <span className="text-[14px] font-bold text-[var(--text-primary)]">{currentMode}</span>
                    <div className="text-[var(--text-secondary)] flex items-center"><ChevronDown size={20} /></div>
                </div>
                <div className="flex gap-4 text-[var(--text-primary)]">
                    <button><Headphones size={24} /></button>
                    <button className="active:scale-95 transition-transform" onClick={() => setActivePage('profile')}><User size={24} /></button>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 touch-pan-y"
                onScroll={handleInteraction}
                onTouchStart={handleInteraction}
                onTouchMove={handleInteraction}
            >
                <div className="relative mb-4" onClick={() => setSearchOpen(true)}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        <Search size={18} />
                    </div>
                    <div className="w-full bg-[var(--bg-secondary)] border-none rounded-full py-3 pl-11 pr-4 h-[40px] flex items-center">
                        <AnimatedPlaceholder className="ml-0" />
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm font-medium mb-1">
                        Est total value
                        <button onClick={() => setHideBalance(!hideBalance)} className="p-0.5 hover:bg-[var(--bg-hover)] rounded transition-colors">
                            {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="flex flex-col mb-4">
                        <div className="flex justify-between items-end mb-2 gap-4">
                            <div className="flex-1 min-w-0 max-w-[calc(100%-110px)]">
                                <div className="flex items-baseline gap-1 mb-1">
                                    <div className="inline-flex items-baseline min-w-0">
                                        <AutoShrink>
                                            {hideBalance ? (
                                                <span className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] leading-none">******</span>
                                            ) : (
                                                <SlotTicker
                                                    value={displayBalance}
                                                    decimals={currency === 'IDR' ? 0 : 2}
                                                    className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] leading-none"
                                                />
                                            )}
                                        </AutoShrink>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <CurrencySelector />
                                    </div>
                                </div>
                                <div className="text-sm font-medium flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                    <span className="text-[var(--text-secondary)] whitespace-nowrap">
                                        {pnlTimeframe === '1D' ? "Today's" : pnlTimeframe} PnL
                                    </span>
                                    <div className={`flex flex-wrap items-baseline gap-x-1.5 ${currentPnlData.value >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                                        {hideBalance ? (
                                            <span className="font-bold">******</span>
                                        ) : !hasPnlData ? (
                                            <span className="text-[15px] font-bold text-[var(--text-tertiary)] leading-none">—</span>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium leading-none">
                                                    {currentPnlData.value >= 0 ? '+' : '-'}{getCurrencySymbol(currency)}<SlotTicker value={Math.abs(displayPnl)} decimals={currency === 'IDR' ? 0 : 2} className="inline-flex" />
                                                </span>
                                                <span className="text-sm font-medium leading-none">
                                                    ({currentPnlData.value >= 0 ? '+' : ''}{Number(pnlPercentDisplay).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%)
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`w-20 h-8 overflow-visible mt-0 -translate-y-2 cursor-pointer transition-opacity duration-300 flex-shrink-0 flex items-end ${isPnlExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                onClick={() => setIsPnlExpanded(true)}
                            >
                                <PnLChart
                                    data={chartData}
                                    color={chartColor}
                                    width={80}
                                    height={32}
                                    showDots={true}
                                />
                            </div>
                        </div>

                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${isPnlExpanded ? 'max-h-[350px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}
                        >
                            <div className="flex justify-between text-xs text-[var(--text-tertiary)] font-medium mb-2 px-1">
                                <span>
                                    {pnlTimeframe === '1D' ? new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString() :
                                        pnlTimeframe === '1W' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                                            pnlTimeframe === '1M' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                                                pnlTimeframe === '6M' ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                                                    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-center -mx-4 h-[180px] items-center mb-6">
                                <PnLChart
                                    data={chartData}
                                    color={chartColor}
                                    width={360}
                                    height={160}
                                    showDots={true}
                                    minLabel={formatLabel(Math.min(...chartData))}
                                    maxLabel={formatLabel(Math.max(...chartData))}
                                />
                            </div>
                            <div className="flex justify-center gap-1 bg-[var(--bg-card)] mx-4 relative z-10">
                                {['1D', '1W', '1M', '6M', '1Y'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={(e) => { e.stopPropagation(); if (timeframeAvailability[tf]) setPnlTimeframe(tf); }}
                                        disabled={!timeframeAvailability[tf]}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors ${!timeframeAvailability[tf]
                                            ? 'text-[var(--text-tertiary)] cursor-not-allowed'
                                            : tf === pnlTimeframe
                                                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-center mt-6 h-8 cursor-pointer items-end" onClick={(e) => { e.stopPropagation(); setIsPnlExpanded(false); }}>
                                <div className="text-[var(--text-tertiary)]">
                                    <LuChevronUp size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button onClick={() => setDepositOptionOpen(true)} className="flex-1 bg-[var(--bg-secondary)] py-2.5 rounded-full font-bold text-[var(--text-primary)] text-sm">Deposit</button>
                        <button onClick={() => setActivePage('trade')} className="flex-1 bg-[var(--btn-primary-bg)] py-2.5 rounded-full font-bold text-[var(--btn-primary-text)] text-sm">Trade</button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Earn', icon: <div className="relative"><span className="text-[var(--text-primary)]"><BiCoinStack size={28} /></span><div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--bg-card)] rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-[var(--text-primary)] rounded-full" /></div></div> },
                        { label: 'Rewards', icon: <div className="text-[var(--text-primary)]"><Ticket size={28} /></div> },
                        { label: 'Referral', icon: <div className="text-[var(--text-primary)]"><Gift size={28} /></div> },
                        { label: 'More', icon: <div className="text-[var(--text-primary)]"><Grid size={28} /></div> }
                    ].map(item => (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                            <div className="h-8 flex items-center justify-center">{item.icon}</div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="relative w-12 h-12 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setActivePage('profile')}
                        >
                            <div className="absolute inset-0 border border-slate-200 rounded-full" />
                            <div className="absolute inset-1 border border-slate-200 rounded-full" />
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center z-10">
                                <div className="text-white"><User size={16} /></div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-black rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[8px] text-white font-bold z-20">T</div>
                            <div className="absolute top-0 left-0 w-3 h-3 bg-black rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[6px] text-white font-bold z-20">S</div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-[var(--text-primary)]">Prefer Refer</div>
                            <div className="text-xs text-[var(--text-secondary)] leading-snug mt-0.5">Refer friends & earn a reward of up to $100<br />USDT trading bonus</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-[var(--text-tertiary)] self-start mt-1">3/7</div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-6 text-sm font-medium text-[var(--text-secondary)] overflow-x-auto no-scrollbar items-center">
                            {['Favorites', 'Hot', 'New', 'Gainers', 'Losers'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setHomeFilter(tab)}
                                    className={`whitespace-nowrap relative ${homeFilter === tab ? 'text-[var(--text-primary)] font-bold' : ''}`}
                                >
                                    {tab === 'Favorites' ? (
                                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${homeFilter === tab ? 'bg-[var(--bg-secondary)]' : ''}`}>
                                            {favSubFilter === 'All' ? 'Favorites' : favSubFilter}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHomeFilter('Favorites');
                                                    setIsFavSheetOpen(true);
                                                }}
                                                className="p-0.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors flex items-center justify-center -mr-1"
                                            >
                                                <div className="flex items-center justify-center w-5 h-5"><ChevronDown size={20} /></div>
                                            </div>
                                        </div>
                                    ) : tab}
                                    {tab === 'New' && <div className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                </button>
                            ))}
                        </div>
                        <span className="text-[var(--text-tertiary)]"><TbFilter2Cog size={18} /></span>
                    </div>

                    <div className="mt-2 space-y-1">
                        {filteredMarkets.slice(0, 7).map(coin => (
                            <MarketRow
                                key={`${coin.symbol}-${coin.isFutures}`}
                                coin={coin}
                                showPerp={!!coin.isFutures}
                                onClick={() => handleCoinClick(coin)}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setActivePage('market')}
                        className="w-full py-3 mt-2 text-[14px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        View more
                    </button>
                </div>

                <NewsSection />
            </div>

            <FavoritesBottomSheet
                isOpen={isFavSheetOpen}
                onClose={() => setIsFavSheetOpen(false)}
                selected={favSubFilter}
                onSelect={(val) => {
                    setFavSubFilter(val);
                    setIsFavSheetOpen(false);
                }}
                options={['All', 'Futures', 'Spot', ...Object.keys(favoriteGroups)].filter(g => !hiddenGroups?.includes(g))}
            />

            <ModeSelectorSheet
                isOpen={isModeSheetOpen}
                onClose={() => setIsModeSheetOpen(false)}
                currentMode={currentMode}
                onSelect={(mode) => setCurrentMode(mode)}
            />

            <footer className="mt-0 mb-4 px-4 pb-10 flex flex-col items-center text-center">
                <div className="flex flex-col items-center gap-3 mb-10">
                    <span className="text-[13px] font-medium text-[var(--text-tertiary)]">Licensed and supervised by</span>
                    <div className="flex items-center gap-8 opacity-60">
                        <img src={ojkLogo} alt="OJK" className="h-8 w-auto object-contain dark:invert" style={{ filter: 'var(--logo-filter, grayscale(1) brightness(0))' }} />
                        <img src={bappebtiLogo} alt="BAPPEBTI" className="h-7 w-auto object-contain dark:invert" style={{ filter: 'var(--logo-filter, grayscale(1) brightness(0))' }} />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--text-tertiary)]">Find Us</span>
                    <div className="flex items-center gap-5">
                        <a href="#" className="text-[var(--text-secondary)] opacity-50 hover:scale-110 active:scale-95 transition-transform">
                            <RiTelegramFill size={36} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] opacity-50 hover:scale-110 active:scale-95 transition-transform">
                            <RiYoutubeFill size={36} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] opacity-50 hover:scale-110 active:scale-95 transition-transform">
                            <RiFacebookBoxFill size={36} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] opacity-50 hover:scale-110 active:scale-95 transition-transform">
                            <RiTiktokFill size={36} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] opacity-50 hover:scale-110 active:scale-95 transition-transform">
                            <RiInstagramFill size={36} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const NewsSection = () => {
    const [activeNewsTab, setActiveNewsTab] = useState('Announcements');
    const tabs = ['Announcements', 'Promotions', 'Events'];

    const { setActivePage } = useExchangeStore();

    const announcements = [
        { id: 1, title: 'TRV Pro Lists ETH Layer 2 (L2) with Zero Fees', time: '2h ago', tag: 'New Listing' },
        { id: 2, title: 'System Upgrade Notice: Ongoing Maintenance', time: '5h ago', tag: 'System' },
        { id: 3, title: 'Binance Smart Chain (BSC) Wallet Maintenance', time: '1d ago', tag: 'Network' },
        { id: 4, title: 'New Trading Pair: SOL/USDT Now Live', time: '2d ago', tag: 'Trade' },
        { id: 5, title: 'Important: Identity Verification Level 3 Upgrade', time: '3d ago', tag: 'KYC' },
    ];

    const events = [
        { id: 1, title: 'Spring Trading Competition: Win $50,000', state: 'Live', players: '12,430' },
        { id: 2, title: 'Staking Gala: 28% APY on Native Tokens', state: 'Soon', players: '5,800' },
        { id: 3, title: 'Jakarta Community Meetup: Crypto & Coffee', state: 'Register', players: '450' },
    ];

    const promotions = [
        { id: 1, color: 'bg-gradient-to-br from-indigo-500 to-purple-600', title: 'Trade & Win $10,000', description: 'Join our exclusive trading competition! Top 100 traders will share a massive $10,000 USDT prize pool based on trading volume.' },
        { id: 2, color: 'bg-gradient-to-br from-emerald-500 to-teal-600', title: 'Stake BTC. Earn 12% APY', description: 'High-yield staking is here. Lock your BTC for 30 days and enjoy a premium 12% APY with daily reward distributions.' },
        { id: 3, color: 'bg-gradient-to-br from-amber-500 to-orange-600', title: 'New Listing: ETH Layer 2', description: 'Experience the future of Ethereum with zero gas fees. Start trading ETH L2 tokens now and enjoy 0% maker fees for 7 days.' },
    ];

    const [currentPromo, setCurrentPromo] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPromo(prev => (prev + 1) % promotions.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [promotions.length]);

    return (
        <div className="mt-8 mb-6">
            <div className="flex gap-6 text-sm font-medium text-[var(--text-secondary)] overflow-x-auto no-scrollbar items-center mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveNewsTab(tab)}
                        className={`whitespace-nowrap relative ${activeNewsTab === tab ? 'text-[var(--text-primary)] font-bold' : ''}`}
                    >
                        <div className={`px-3 py-2 rounded-full transition-colors ${activeNewsTab === tab ? 'bg-[var(--bg-secondary)]' : ''}`}>
                            {tab}
                        </div>
                    </button>
                ))}
            </div>

            <div className="h-[270px] relative">
                <AnimatePresence mode="popLayout">
                    {activeNewsTab === 'Announcements' && (
                        <motion.div
                            key="announcements"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4 w-full absolute top-0 left-0"
                        >
                            {announcements.map(item => (
                                <div key={item.id} className="flex flex-col gap-1 cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{item.tag}</span>
                                        <span className="text-[11px] text-[var(--text-tertiary)] font-medium">{item.time}</span>
                                    </div>
                                    <h4 className="text-[14px] font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--text-primary)] transition-colors">{item.title}</h4>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeNewsTab === 'Promotions' && (
                        <motion.div
                            key="promotions"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="relative w-full absolute top-0 left-0"
                        >
                            <div className="overflow-hidden rounded-xl aspect-[21/10] relative group mx-1">
                                <motion.div
                                    key={currentPromo}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.x < -50) setCurrentPromo(prev => (prev + 1) % promotions.length);
                                        if (info.offset.x > 50) setCurrentPromo(prev => (prev - 1 + promotions.length) % promotions.length);
                                    }}
                                    initial={{ opacity: 0, x: '100%' }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: '-100%' }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className={`w-full h-full ${promotions[currentPromo].color} flex flex-col justify-center px-8 text-white absolute inset-0 cursor-grab active:cursor-grabbing`}
                                >
                                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                                    <span className="text-[12px] font-bold uppercase tracking-wider opacity-80 mb-1">Featured</span>
                                    <h3 className="text-[20px] font-black leading-tight max-w-[200px] drop-shadow-sm">
                                        {promotions[currentPromo].title}
                                    </h3>
                                    <div className="mt-4">
                                        <button className="bg-[var(--bg-card)] text-[var(--text-primary)] text-[11px] font-bold px-4 py-1.5 rounded-full">Apply Now</button>
                                    </div>
                                </motion.div>
                                <div className="absolute bottom-3 left-6 flex gap-1.5 z-20">
                                    {promotions.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPromo(idx)}
                                            className={`w-1 h-1 rounded-full transition-all ${currentPromo === idx ? 'bg-[var(--bg-card)] w-4' : 'bg-[var(--overlay-bg)]'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 px-1 flex flex-col gap-1">
                                <h4 className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">
                                    {promotions[currentPromo].title}
                                </h4>
                                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                    {promotions[currentPromo].description}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {activeNewsTab === 'Events' && (
                        <motion.div
                            key="events"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3 w-full absolute top-0 left-0"
                        >
                            {events.map(item => (
                                <div key={item.id} className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                                    <div>
                                        <h4 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">{item.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${item.state === 'Live' ? 'bg-[#e5f7ed] text-[#20b26c]' : item.state === 'Soon' ? 'bg-[#fff7e6] text-[#ff9900]' : 'bg-blue-50 text-blue-600'}`}>
                                                {item.state}
                                            </span>
                                            <span className="text-[11px] text-[var(--text-tertiary)] font-medium">{item.players} participants</span>
                                        </div>
                                    </div>
                                    <div className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors flex items-center"><ChevronRight size={20} /></div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={() => setActivePage('market')}
                className="w-full py-3 mt-8 text-[14px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            >
                View more
            </button>
        </div>
    );
};

export default HomeView;