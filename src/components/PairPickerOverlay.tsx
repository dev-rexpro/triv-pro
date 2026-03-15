// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { formatPrice } from '../utils/format';
import { FiSearch as Search, FiStar as Star } from 'react-icons/fi';

const QUOTE_TABS = ['USDT', 'USDC', 'BNB', 'BTC', 'ETH', 'USD'];

const PairPickerOverlay = () => {
    const { spotSymbols, futuresSymbols, markets, futuresMarkets, tradeType, favorites, toggleFavorite, setPairPickerOpen, setActivePage } = useExchangeStore();
    const [query, setQuery] = useState('');
    const [activeQuote, setActiveQuote] = useState('USDT');
    const [sortBy, setSortBy] = useState<'vol' | 'name'>('vol');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const isFutures = tradeType === 'futures';

    // Build ticker map
    const tickerMap = useMemo(() => {
        const map: Record<string, any> = {};
        const source = isFutures ? futuresMarkets : markets;
        source.forEach(m => { map[m.symbol] = m; });
        return map;
    }, [markets, futuresMarkets, isFutures]);

    // Filter symbols
    const filteredList = useMemo(() => {
        const symbols = isFutures ? futuresSymbols : spotSymbols;
        const q = query.toLowerCase();

        let filtered = symbols.filter(s => {
            // Filter by quote asset tab
            if (s.quoteAsset !== activeQuote) return false;
            // Filter by search query
            if (q && !s.symbol.toLowerCase().includes(q) && !s.baseAsset.toLowerCase().includes(q)) return false;
            return true;
        });

        // Enrich with ticker data
        const enriched = filtered.map(s => ({
            ...s,
            ticker: tickerMap[s.symbol] || null,
        }));

        // Sort
        enriched.sort((a, b) => {
            if (sortBy === 'vol') {
                const aVol = a.ticker ? parseFloat(a.ticker.quoteVolume || '0') : 0;
                const bVol = b.ticker ? parseFloat(b.ticker.quoteVolume || '0') : 0;
                return sortDir === 'desc' ? bVol - aVol : aVol - bVol;
            } else {
                const comparison = a.baseAsset.localeCompare(b.baseAsset);
                return sortDir === 'desc' ? -comparison : comparison;
            }
        });

        return enriched;
    }, [spotSymbols, futuresSymbols, isFutures, query, activeQuote, tickerMap, sortBy, sortDir]);

    const handleSelect = useCallback((symbol: string) => {
        useExchangeStore.setState({ selectedCoin: symbol });
        window.history.back();
    }, []);

    const toggleSort = (type: 'vol' | 'name') => {
        if (sortBy === type) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(type);
            setSortDir('desc');
        }
    };

    const formatVol = (v: number) => {
        if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
        return v.toFixed(2);
    };


    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-card)] z-[300] flex flex-col"
        >
            {/* Search */}
            <div className="p-4 pb-2">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-[14px] placeholder:text-[var(--text-tertiary)] outline-none font-medium h-[40px]"
                    />
                </div>
            </div>

            {/* Quote asset tabs */}
            <div className="flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar items-center">
                <button
                    className={`px-2.5 py-1 rounded-md text-[12px] font-bold whitespace-nowrap ${!QUOTE_TABS.includes(activeQuote) ? 'bg-slate-900 text-white' : 'text-[var(--text-tertiary)]'}`}
                >
                    <Star size={14} />
                </button>
                {QUOTE_TABS.map(q => (
                    <button
                        key={q}
                        onClick={() => setActiveQuote(q)}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-bold whitespace-nowrap ${activeQuote === q ? 'bg-slate-900 text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Column headers */}
            <div className="flex px-4 py-2 text-[11px] text-[var(--text-tertiary)] font-medium border-b border-[var(--border-color)]">
                <div className="flex-1 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('name')}>
                    Name {sortBy === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'} / Vol {sortBy === 'vol' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                </div>
                <div className="text-right cursor-pointer" onClick={() => toggleSort('vol')}>
                    Last Price / 24h Chg
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4">
                {filteredList.length === 0 ? (
                    <div className="text-center text-[var(--text-tertiary)] mt-10 text-[13px]">No pairs found</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredList.map((item) => {
                            const isFav = favorites.includes(item.symbol);
                            const t = item.ticker;
                            const price = t ? parseFloat(t.lastPrice) : null;
                            const change = t ? parseFloat(t.priceChangePercent) : null;
                            const vol = t ? parseFloat(t.quoteVolume || '0') : 0;

                            return (
                                <div
                                    key={item.symbol}
                                    className="flex items-center py-3 cursor-pointer"
                                    onClick={() => handleSelect(item.symbol)}
                                >
                                    <Star
                                        size={16}
                                        className={`shrink-0 mr-3 ${(favorites.includes(item.symbol) || favorites.includes(`${item.symbol}:${isFutures ? 'futures' : 'spot'}`)) ? 'text-[#e9ba3b]' : 'text-[var(--text-tertiary)]'}`}
                                        fill={(favorites.includes(item.symbol) || favorites.includes(`${item.symbol}:${isFutures ? 'futures' : 'spot'}`)) ? 'currentColor' : 'none'}
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(`${item.symbol}:${isFutures ? 'futures' : 'spot'}`); }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-[14px] text-[var(--text-primary)]">{item.baseAsset}</span>
                                            <span className="text-[11px] text-[var(--text-tertiary)] font-medium">/{item.quoteAsset}</span>
                                            {isFutures && <span className="text-[10px] font-bold text-[#faad14] bg-[#faad14]/15 px-1.5 py-[2px] rounded uppercase leading-none">Perp</span>}
                                            {!isFutures && <span className="text-[10px] font-bold text-slate-400 bg-slate-400/10 px-1.5 py-[2px] rounded uppercase leading-none">Spot</span>}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-tertiary)] font-medium">
                                            Vol {formatVol(vol)}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {price !== null ? (
                                            <>
                                                <div className="text-[14px] font-bold text-[var(--text-primary)]">{formatPrice(price)}</div>
                                                <div className={`text-[11px] font-semibold ${change >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-[13px] text-[var(--text-tertiary)]">—</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Close button */}
            <div className="p-4 border-t border-[var(--border-color)]">
                <button
                    className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl text-[14px] font-bold text-[var(--text-secondary)]"
                    onClick={() => window.history.back()}
                >
                    Cancel
                </button>
            </div>
        </motion.div>
    );
};

export default PairPickerOverlay;
