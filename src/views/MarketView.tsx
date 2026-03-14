// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useThrottledOrder } from '../hooks/useThrottledOrder';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import MarketRow from '../components/MarketRow';
import {
    FiSearch as Search,
} from 'react-icons/fi';
import { TbFilter2Cog } from 'react-icons/tb';
import { GrDocumentTime as AlarmClock } from 'react-icons/gr';
import {
    MdLocalFireDepartment as Flame,
    MdEditNote,
    MdOutlineArrowDropUp as ArrowDropUp,
    MdOutlineArrowDropDown as ArrowDropDown,
} from 'react-icons/md';
import MarketOverview from '../components/MarketOverview';
import AnimatedPlaceholder from '../components/AnimatedPlaceholder';

const FILTERS = ['All', 'Hot', 'Top', 'New', 'Gainers', 'Losers', 'MCap', 'Turnover'];

const MarketView = () => {
    const markets = useExchangeStore(state => state.markets);
    const futuresMarkets = useExchangeStore(state => state.futuresMarkets);
    const favorites = useExchangeStore(state => state.favorites);
    const favoriteGroups = useExchangeStore(state => state.favoriteGroups);
    const hiddenGroups = useExchangeStore(state => state.hiddenGroups);
    const addFavoriteGroup = useExchangeStore(state => state.addFavoriteGroup);
    const deleteFavoriteGroup = useExchangeStore(state => state.deleteFavoriteGroup);
    const setActivePage = useExchangeStore(state => state.setActivePage);
    const setSearchOpen = useExchangeStore(state => state.setSearchOpen);
    const setManageGroupsOpen = useExchangeStore(state => state.setManageGroupsOpen);
    const [mainTab, setMainTab] = useState('Marketplace');
    const [subTab, setSubTab] = useState('Futures');
    const [filter, setFilter] = useState('All');
    const [direction, setDirection] = useState(0);
    const [isFavSheetOpen, setIsFavSheetOpen] = useState(false);
    const [manualSort, setManualSort] = useState<{ column: 'name' | 'turnover' | 'price' | 'change', order: 'asc' | 'desc' } | null>(null);
    const parentRef = React.useRef<HTMLDivElement>(null);
    const isInteracting = React.useRef(false);
    const interactionTimeout = React.useRef<any>(null);

    const handleInteraction = useCallback(() => {
        isInteracting.current = true;
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            isInteracting.current = false;
        }, 30000); // Resume 30s after last interaction
    }, []);


    const updateFilter = (newFilter: string) => {
        const newIndex = FILTERS.indexOf(newFilter);
        const currentIndex = FILTERS.indexOf(filter);
        if (newIndex !== currentIndex) {
            setDirection(newIndex > currentIndex ? 1 : -1);
            setFilter(newFilter);
            setManualSort(null);
        }
    };

    const handleSwipe = (dir: number) => {
        if (mainTab === 'Favorites') return;
        const currentIndex = FILTERS.indexOf(filter);
        const nextIndex = currentIndex + dir;
        if (nextIndex >= 0 && nextIndex < FILTERS.length) {
            setDirection(dir);
            setFilter(FILTERS[nextIndex]);
            setManualSort(null);
        }
    };

    const handleSortClick = (column: 'name' | 'turnover' | 'price' | 'change') => {
        if (manualSort?.column === column) {
            setManualSort({
                column,
                order: manualSort.order === 'asc' ? 'desc' : 'asc'
            });
        } else {
            setManualSort({
                column,
                order: column === 'name' ? 'asc' : 'desc'
            });
        }
    };

    // Reset subTab when mainTab changes
    useEffect(() => {
        if (mainTab === 'Favorites') {
            setSubTab('All');
        } else {
            setSubTab('Futures');
        }
    }, [mainTab]);

    const sortedSymbols = useMemo(() => {
        if (mainTab === 'Favorites') {
            const combined = [...markets, ...futuresMarkets];
            const resolveMarket = (fav: string) => {
                if (fav.includes(':')) {
                    const [sym, type] = fav.split(':');
                    return combined.find(m => m.symbol === sym && (type === 'futures' ? m.isFutures : !m.isFutures));
                }
                return combined.find(m => m.symbol === fav);
            };

            let symbolList: string[] = [];
            if (subTab === 'All') {
                symbolList = favorites;
            } else if (subTab === 'Futures') {
                symbolList = favorites.filter(f => {
                    const m = resolveMarket(f);
                    return m && m.isFutures;
                });
            } else if (subTab === 'Spot') {
                symbolList = favorites.filter(f => {
                    const m = resolveMarket(f);
                    return m && !m.isFutures;
                });
            } else {
                symbolList = favoriteGroups[subTab] || [];
            }
            return symbolList;
        }

        let list = subTab === 'Futures' ? [...futuresMarkets] : [...markets];

        if (manualSort) {
            list.sort((a, b) => {
                let diff = 0;
                switch (manualSort.column) {
                    case 'name':
                        diff = a.symbol.localeCompare(b.symbol);
                        break;
                    case 'price':
                        diff = parseFloat(a.lastPrice) - parseFloat(b.lastPrice);
                        break;
                    case 'change':
                        diff = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent);
                        break;
                    case 'turnover':
                        diff = parseFloat(a.quoteVolume) - parseFloat(b.quoteVolume);
                        break;
                }
                const res = manualSort.order === 'asc' ? diff : -diff;
                // Stable fallback to symbol alphabetical if tie
                return res !== 0 ? res : a.symbol.localeCompare(b.symbol);
            });
        } else {
            switch (filter) {
                case 'Hot':
                    list.sort((a, b) => {
                        const scoreA = parseFloat(a.quoteVolume) * (1 + Math.abs(parseFloat(a.priceChangePercent)) / 20);
                        const scoreB = parseFloat(b.quoteVolume) * (1 + Math.abs(parseFloat(b.priceChangePercent)) / 20);
                        const diff = scoreB - scoreA;
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
                    break;
                case 'Top':
                case 'Turnover':
                    list.sort((a, b) => {
                        const diff = parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
                    break;
                case 'New':
                    // For 'New', we'll use a fixed order (reverse of initial list) but ensure it's stable
                    list = list.reverse().slice(0, 100);
                    break;
                case 'Gainers':
                    list.sort((a, b) => {
                        const diff = parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent);
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
                    break;
                case 'Losers':
                    list.sort((a, b) => {
                        const diff = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent);
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
                    break;
                case 'MCap':
                    list.sort((a, b) => {
                        const capA = parseFloat(a.lastPrice) * parseFloat(a.quoteVolume);
                        const capB = parseFloat(b.lastPrice) * parseFloat(b.quoteVolume);
                        const diff = capB - capA;
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
                    break;
                default:
                    list.sort((a, b) => {
                        const diff = parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
                        return diff !== 0 ? diff : a.symbol.localeCompare(b.symbol);
                    });
            }
        }

        return list.slice(0, 50).map(m => m.isFutures ? `${m.symbol}:futures` : `${m.symbol}:spot`);
    }, [markets, futuresMarkets, favorites, favoriteGroups, mainTab, subTab, filter, manualSort]);

    const stableSymbols = useThrottledOrder(sortedSymbols, isInteracting, [mainTab, subTab, filter, manualSort], 30000);

    const filtered = useMemo(() => {
        const combined = [...markets, ...futuresMarkets];
        return stableSymbols.map(id => {
            if (id.includes(':')) {
                const [sym, type] = id.split(':');
                return combined.find(m => m.symbol === sym && (type === 'futures' ? m.isFutures : !m.isFutures));
            }
            // Backward compatibility for old favorites or if sortedSymbols somehow returns just symbol
            return combined.find(m => m.symbol === id);
        }).filter(Boolean) as MarketData[];
    }, [stableSymbols, markets, futuresMarkets]);


    const rowVirtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // Estimate height of MarketRow
        overscan: 5,
    });

    const handleAddGroup = useCallback(() => {
        const name = window.prompt("Enter new group name:");
        if (name) addFavoriteGroup(name);
    }, [addFavoriteGroup]);

    const handleCoinClick = useCallback((coin: any) => {
        useExchangeStore.setState({ selectedCoin: coin.symbol });
        setActivePage(coin.isFutures ? 'futures' : 'trade');
    }, [setActivePage]);

    return (
        <div className="pb-24 bg-[var(--bg-primary)] min-h-screen font-sans">
            <div className="p-4 pt-[calc(16px+var(--safe-area-top))] flex gap-4 items-center">
                <div className="relative flex-1 flex items-center bg-[var(--bg-secondary)] rounded-full px-4 py-2.5 cursor-pointer h-[40px]" onClick={() => setSearchOpen(true)}>
                    <Search className="text-[var(--text-tertiary)] mr-2" size={18} />
                    <AnimatedPlaceholder className="ml-0" />
                </div>
                <div className="relative">
                    <AlarmClock size={20} strokeWidth={1.5} className="text-[var(--text-primary)]" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]" />
                </div>
            </div>

            <div className="px-4 pt-1 flex items-center mb-4">
                <div className="flex gap-5 text-[18px] font-medium text-[var(--text-tertiary)] overflow-x-auto no-scrollbar">
                    {['Favorites', 'Marketplace', 'Overview'].map((t) => (
                        <span
                            key={t}
                            onClick={() => setMainTab(t)}
                            className={`cursor-pointer whitespace-nowrap transition-colors ${mainTab === t ? 'text-[var(--text-primary)] font-bold' : ''}`}
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {mainTab !== 'Overview' && (
                <div className="px-4 flex items-center justify-between mb-4">
                    <div className="flex gap-6 text-[15px] font-bold text-[var(--text-tertiary)] overflow-x-auto no-scrollbar">
                        {mainTab === 'Favorites' ? (
                            ['All', 'Futures', 'Spot', ...Object.keys(favoriteGroups)].filter(g => !hiddenGroups.includes(g)).map(g => (
                                <span
                                    key={g}
                                    onClick={() => setSubTab(g)}
                                    className={`cursor-pointer pb-2 whitespace-nowrap transition-all ${subTab === g ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] font-bold' : ''}`}
                                >
                                    {g}
                                </span>
                            ))
                        ) : (
                            ['Futures', 'Spot'].map(t => (
                                <span
                                    key={t}
                                    onClick={() => setSubTab(t)}
                                    className={`cursor-pointer pb-2 ${subTab === t ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]' : ''}`}
                                >
                                    {t}
                                </span>
                            ))
                        )}
                    </div>
                    {mainTab === 'Favorites' && (
                        <div className="flex items-center gap-2">
                            <MdEditNote size={24} className="text-[var(--text-tertiary)] mb-2 cursor-pointer" onClick={() => setManageGroupsOpen(true)} />
                        </div>
                    )}
                </div>
            )}

            {mainTab !== 'Favorites' && mainTab !== 'Overview' && (
                <div className="px-4 flex items-center justify-between mb-2 overflow-hidden relative">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar items-center pr-10 w-full py-1">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => updateFilter(f)}
                                className={`relative text-[13px] whitespace-nowrap px-3 py-0.5 transition-all outline-none ${filter === f ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-medium'}`}
                            >
                                {filter === f && (
                                    <motion.div
                                        layoutId="activeFilter"
                                        className="absolute inset-0 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-strong)]"
                                        transition={{ type: "spring", bounce: 0.1, duration: 0.25 }}
                                    />
                                )}
                                <span className={`relative ${filter === f ? 'z-10' : ''}`}>{f}</span>
                            </button>
                        ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pl-6 flex items-center justify-center shrink-0 pr-4">
                        <TbFilter2Cog size={18} className="text-[var(--text-primary)]" />
                    </div>
                </div>
            )}

            {mainTab === 'Overview' ? (
                <MarketOverview />
            ) : (
                <>
                    <div className="px-4 flex justify-between items-center text-[12px] font-bold text-[var(--text-tertiary)] mb-2 mt-4 select-none">
                        <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors" onClick={() => handleSortClick('name')}>
                                <span className={manualSort?.column === 'name' ? 'text-[var(--text-primary)]' : ''}>Name</span>
                                <div className="flex flex-col -space-y-3 opacity-50">
                                    <ArrowDropUp size={18} className={manualSort?.column === 'name' && manualSort.order === 'asc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                    <ArrowDropDown size={18} className={manualSort?.column === 'name' && manualSort.order === 'desc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                </div>
                            </div>
                            <span className="text-[var(--text-tertiary)] mx-0.5">/</span>
                            <div className="flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors" onClick={() => handleSortClick('turnover')}>
                                <span className={manualSort?.column === 'turnover' ? 'text-[var(--text-primary)]' : ''}>Turnover</span>
                                <div className="flex flex-col -space-y-3 opacity-50">
                                    <ArrowDropUp size={18} className={manualSort?.column === 'turnover' && manualSort.order === 'asc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                    <ArrowDropDown size={18} className={manualSort?.column === 'turnover' && manualSort.order === 'desc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors" onClick={() => handleSortClick('price')}>
                                <span className={manualSort?.column === 'price' ? 'text-[var(--text-primary)]' : ''}>Last price</span>
                                <div className="flex flex-col -space-y-3 opacity-50">
                                    <ArrowDropUp size={18} className={manualSort?.column === 'price' && manualSort.order === 'asc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                    <ArrowDropDown size={18} className={manualSort?.column === 'price' && manualSort.order === 'desc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                </div>
                            </div>
                            <div className="w-[72px] flex items-center justify-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors" onClick={() => handleSortClick('change')}>
                                <span className={manualSort?.column === 'change' ? 'text-[var(--text-primary)]' : ''}>Change</span>
                                <div className="flex flex-col -space-y-3 opacity-50">
                                    <ArrowDropUp size={18} className={manualSort?.column === 'change' && manualSort.order === 'asc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                    <ArrowDropDown size={18} className={manualSort?.column === 'change' && manualSort.order === 'desc' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)]'} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={parentRef}
                        className="px-4 pb-4 overflow-y-auto relative min-h-[400px] touch-pan-y no-scrollbar"
                        style={{ height: 'calc(100vh - 300px)' }}
                        onScroll={handleInteraction}
                        onTouchStart={handleInteraction}
                        onTouchMove={handleInteraction}
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const coin = filtered[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <MarketRow
                                            coin={coin}
                                            showPerp={!!coin.isFutures}
                                            onClick={() => handleCoinClick(coin)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MarketView;
