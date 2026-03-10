// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { searchDexScreener, COIN_NAME_MAP } from '../utils/api';
import CoinIcon from './CoinIcon';
import { FiSearch as Search, FiStar as Star } from 'react-icons/fi';
import { RiDeleteBin7Line as Trash2 } from 'react-icons/ri';
import { LuChevronDown } from 'react-icons/lu';
import AnimatedPlaceholder from './AnimatedPlaceholder';
import { useThrottledOrder } from '../hooks/useThrottledOrder';

const SearchOverlay = () => {
    const { searchQuery, setSearchQuery, setSearchOpen, history, clearHistory, addToHistory, markets, futuresMarkets, spotSymbols, futuresSymbols, favorites, toggleFavorite, rates, currency, setActivePage, setTradeType } = useExchangeStore();
    const [dexResults, setDexResults] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const isInteracting = React.useRef(false);
    const interactionTimeout = React.useRef<any>(null);

    const handleInteraction = useCallback(() => {
        isInteracting.current = true;
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            isInteracting.current = false;
        }, 30000); // Resume 30s after last interaction
    }, []);

    const sortedTop10Symbols = useMemo(() => markets.slice(0, 10).map(m => m.symbol), [markets]);
    const top10Symbols = useThrottledOrder(sortedTop10Symbols, isInteracting, [], 30000);
    const top10 = useMemo(() => top10Symbols.map(sym => markets.find(m => m.symbol === sym)).filter(Boolean), [top10Symbols, markets]);

    // Build ticker lookup maps for fast price enrichment
    const spotTickerMap = useMemo(() => {
        const map: Record<string, any> = {};
        markets.forEach(m => { map[m.symbol] = m; });
        return map;
    }, [markets]);

    const futuresTickerMap = useMemo(() => {
        const map: Record<string, any> = {};
        futuresMarkets.forEach(m => { map[m.symbol] = m; });
        return map;
    }, [futuresMarkets]);

    // Resolve name-based queries (e.g. 'stellar' -> 'XLM')
    const resolvedQuery = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return '';
        const mapped = COIN_NAME_MAP[q];
        if (mapped) return mapped.toLowerCase();
        for (const [name, symbol] of Object.entries(COIN_NAME_MAP)) {
            if (name.startsWith(q) || q.startsWith(name)) return symbol.toLowerCase();
        }
        return q;
    }, [searchQuery]);

    // Search against ALL spot symbols from exchangeInfo
    const sortedSpotResultSymbols = useMemo(() => {
        if (searchQuery.trim().length === 0) return [];
        const q = searchQuery.toLowerCase();
        const matched = spotSymbols.filter(s => {
            const sym = s.symbol.toLowerCase();
            const base = s.baseAsset.toLowerCase();
            const quote = s.quoteAsset.toLowerCase();
            return sym.includes(q) || base.includes(q) || sym.includes(resolvedQuery) || base.includes(resolvedQuery);
        });
        return matched.sort((a, b) => {
            const aT = spotTickerMap[a.symbol];
            const bT = spotTickerMap[b.symbol];
            if (aT && !bT) return -1;
            if (!aT && bT) return 1;
            if (aT && bT) {
                const volA = parseFloat(aT.quoteVolume || '0');
                const volB = parseFloat(bT.quoteVolume || '0');
                if (volB !== volA) return volB - volA;
            }
            return a.symbol.localeCompare(b.symbol);
        }).map(s => s.symbol);
    }, [searchQuery, resolvedQuery, spotSymbols, spotTickerMap]);

    const spotResultSymbols = useThrottledOrder(sortedSpotResultSymbols, isInteracting, [searchQuery, activeTab], 30000);
    const spotResults = useMemo(() => {
        return spotResultSymbols.map(sym => {
            const base = spotSymbols.find(s => s.symbol === sym);
            return base ? { ...base, ticker: spotTickerMap[sym] || null } : null;
        }).filter(Boolean);
    }, [spotResultSymbols, spotSymbols, spotTickerMap]);


    // Search against ALL futures symbols from exchangeInfo
    const sortedFuturesResultSymbols = useMemo(() => {
        if (searchQuery.trim().length === 0) return [];
        const q = searchQuery.toLowerCase();
        const matched = futuresSymbols.filter(s => {
            const sym = s.symbol.toLowerCase();
            const base = s.baseAsset.toLowerCase();
            return sym.includes(q) || base.includes(q) || sym.includes(resolvedQuery) || base.includes(resolvedQuery);
        });
        return matched.sort((a, b) => {
            const aT = futuresTickerMap[a.symbol];
            const bT = futuresTickerMap[b.symbol];
            if (aT && !bT) return -1;
            if (!aT && bT) return 1;
            if (aT && bT) {
                const volA = parseFloat(aT.quoteVolume || '0');
                const volB = parseFloat(bT.quoteVolume || '0');
                if (volB !== volA) return volB - volA;
            }
            return a.symbol.localeCompare(b.symbol);
        }).map(s => s.symbol);
    }, [searchQuery, resolvedQuery, futuresSymbols, futuresTickerMap]);

    const futuresResultSymbols = useThrottledOrder(sortedFuturesResultSymbols, isInteracting, [searchQuery, activeTab], 30000);
    const futuresResults = useMemo(() => {
        return futuresResultSymbols.map(sym => {
            const base = futuresSymbols.find(s => s.symbol === sym);
            return base ? { ...base, ticker: futuresTickerMap[sym] || null } : null;
        }).filter(Boolean);
    }, [futuresResultSymbols, futuresSymbols, futuresTickerMap]);

    useEffect(() => {
        if (searchQuery.length > 2) {
            setIsTyping(true);
            const timer = setTimeout(async () => {
                try {
                    const results = await searchDexScreener(searchQuery);
                    setDexResults(results);
                    // Save to search history when user searches
                    addToHistory(searchQuery);
                } catch (e) { }
                setIsTyping(false);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setDexResults([]);
        }
    }, [searchQuery, addToHistory]);

    const handleCancel = useCallback(() => {
        window.history.back();
    }, []);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-[300] flex flex-col"
        >
            <div className="p-4 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={18} strokeWidth={2.5} />
                    <input
                        autoFocus
                        className="w-full bg-[#F5F7F9] border-none rounded-full py-2.5 pl-11 pr-4 text-[15px] font-medium placeholder:text-transparent focus:ring-0 focus:outline-none"
                        placeholder=""
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {!searchQuery && (
                        <div className="absolute left-11 top-1/2 -translate-y-1/2 right-4 h-full">
                            <AnimatedPlaceholder />
                        </div>
                    )}
                    {isTyping && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <button onClick={handleCancel} className="text-[15px] font-bold text-slate-900">Cancel</button>
            </div>

            {searchQuery.length > 0 && (
                <div className="border-b border-slate-100 flex gap-6 px-5 overflow-x-auto no-scrollbar items-center">
                    {['All', 'Spot', 'Futures', 'DEX', 'Bots', 'Traders', 'Feed'].map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`pb-3 pt-2 text-[15px] font-bold whitespace-nowrap ${activeTab === t ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 font-medium'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            <div
                className="flex-1 overflow-y-auto px-5 py-4 touch-pan-y"
                onScroll={handleInteraction}
                onTouchStart={handleInteraction}
                onTouchMove={handleInteraction}
            >
                {searchQuery.length === 0 ? (
                    <>
                        {history.length > 0 && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-[18px] text-slate-900 tracking-tight">Search history</h3>
                                    <button onClick={clearHistory}><Trash2 size={20} className="text-slate-400 hover:text-red-500 transition-colors" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {history.slice(0, isHistoryExpanded ? 20 : 5).map((item, idx) => (
                                        <div key={idx} className="px-3.5 py-1.5 bg-[#F5F7F9] rounded-2xl text-[12px] font-semibold text-slate-800 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSearchQuery(item)}>
                                            {item}
                                        </div>
                                    ))}
                                    {history.length > 5 && (
                                        <button
                                            className="px-3 py-1.5 bg-[#F5F7F9] rounded-2xl text-[12px] font-semibold text-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                        >
                                            <LuChevronDown size={18} strokeWidth={1.5} className={`transition-transform duration-200 ${isHistoryExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-bold text-[18px] text-slate-900 tracking-tight mb-6">Popular searches</h3>
                            <div className="space-y-6">
                                {top10.map((coin: any, i: number) => {
                                    const isFav = favorites.includes(coin.symbol);
                                    return (
                                        <div key={coin.symbol} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className={`font-medium text-sm w-4 ${i < 3 ? 'text-[#e9ba3b]' : 'text-slate-400'}`}>{i + 1}</span>
                                                <CoinIcon symbol={coin.symbol} size={8} />
                                                <div className="font-bold text-slate-900 text-[15px] leading-none">{coin.symbol.replace('USDT', '')}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-semibold text-[15px] text-slate-900 leading-tight">{coin.lastPrice >= 10 ? parseFloat(coin.lastPrice).toLocaleString() : parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                                                    <div className={`text-[11px] font-semibold ${parseFloat(coin.priceChangePercent) >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]'}`}>
                                                        {parseFloat(coin.priceChangePercent) >= 0 ? '+' : ''}{parseFloat(coin.priceChangePercent).toFixed(2)}%
                                                    </div>
                                                </div>
                                                {isFav ? (
                                                    <Star size={20} className="text-[#e9ba3b]" fill="currentColor" onClick={(e) => { e.stopPropagation(); toggleFavorite(coin.symbol); }} />
                                                ) : (
                                                    <Star size={20} className="text-slate-400" onClick={(e) => { e.stopPropagation(); toggleFavorite(coin.symbol); }} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-8">
                        {/* Spot Section */}
                        {(activeTab === 'All' || activeTab === 'Spot') && spotResults.length > 0 && (
                            <div>
                                {activeTab === 'All' && <h3 className="font-bold text-[16px] text-slate-900 mb-4">Spot</h3>}
                                <div className="space-y-6">
                                    {spotResults.slice(0, activeTab === 'All' ? 3 : 50).map((item: any) => {
                                        const isFav = favorites.includes(item.symbol);
                                        const t = item.ticker;
                                        const price = t ? parseFloat(t.lastPrice) : null;
                                        const change = t ? parseFloat(t.priceChangePercent) : null;
                                        return (
                                            <div key={`spot-${item.symbol}`} className="flex items-center justify-between cursor-pointer" onClick={() => {
                                                useExchangeStore.setState({ selectedCoin: item.symbol });
                                                setTradeType('spot');
                                                setActivePage('chart-trade');
                                                setSearchOpen(false);
                                                setSearchQuery('');
                                            }}>
                                                <div className="flex items-center gap-3">
                                                    <CoinIcon symbol={item.baseAsset} size={8} />
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-[15px] text-slate-900 uppercase">{item.baseAsset}</span>
                                                        <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">/{item.quoteAsset}</span>
                                                        {item.quoteAsset === 'USDT' && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-[2px] rounded leading-none">5x</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {price !== null ? (
                                                        <div className="text-right">
                                                            <div className="font-semibold text-[15px] text-slate-900 leading-tight">{price >= 10 ? price.toLocaleString() : price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
                                                            <div className={`text-[12px] font-semibold flex justify-end ${change >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]'}`}>
                                                                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right text-slate-400 text-[13px] font-medium">—</div>
                                                    )}
                                                    <Star size={18} className={isFav ? "text-[#e9ba3b]" : "text-slate-300"} fill={isFav ? "currentColor" : "none"} onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {activeTab === 'All' && spotResults.length > 3 && (
                                    <button className="w-full mt-4 py-2.5 bg-[#F5F7F9] rounded-[14px] text-[14px] font-bold text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setActiveTab('Spot')}>Show more</button>
                                )}
                            </div>
                        )}

                        {/* Futures Section */}
                        {(activeTab === 'All' || activeTab === 'Futures') && futuresResults.length > 0 && (
                            <div>
                                {activeTab === 'All' && <h3 className="font-bold text-[16px] text-slate-900 mb-4">Futures</h3>}
                                <div className="space-y-6">
                                    {futuresResults.slice(0, activeTab === 'All' ? 3 : 50).map((item: any) => {
                                        const isFav = favorites.includes(item.symbol);
                                        const t = item.ticker;
                                        const price = t ? parseFloat(t.lastPrice) : null;
                                        const change = t ? parseFloat(t.priceChangePercent) : null;
                                        return (
                                            <div key={`fut-${item.symbol}`} className="flex items-center justify-between cursor-pointer" onClick={() => {
                                                useExchangeStore.setState({ selectedCoin: item.symbol });
                                                setTradeType('futures');
                                                setActivePage('chart-trade');
                                                setSearchOpen(false);
                                                setSearchQuery('');
                                            }}>
                                                <div className="flex items-center gap-3">
                                                    <CoinIcon symbol={item.baseAsset} size={8} />
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-[15px] text-slate-900 uppercase">{item.symbol}</span>
                                                        <span className="text-[11px] font-bold text-orange-500 bg-[#FFF8E6] px-1.5 py-0.5 rounded leading-none">Perp</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {price !== null ? (
                                                        <div className="text-right">
                                                            <div className="font-semibold text-[15px] text-slate-900 leading-tight">{price >= 10 ? price.toLocaleString() : price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
                                                            <div className={`text-[12px] font-semibold flex justify-end ${change >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]'}`}>
                                                                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right text-slate-400 text-[13px] font-medium">—</div>
                                                    )}
                                                    <Star size={18} className={isFav ? "text-[#e9ba3b]" : "text-slate-300"} fill={isFav ? "currentColor" : "none"} onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {activeTab === 'All' && futuresResults.length > 3 && (
                                    <button className="w-full mt-4 py-2.5 bg-[#F5F7F9] rounded-[14px] text-[14px] font-bold text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setActiveTab('Futures')}>Show more</button>
                                )}
                            </div>
                        )}

                        {/* DEX Section */}
                        {(activeTab === 'All' || activeTab === 'DEX') && dexResults.length > 0 && (
                            <div>
                                {activeTab === 'All' && <h3 className="font-bold text-[16px] text-slate-900 mb-4">DEX</h3>}
                                <div className="space-y-6">
                                    {dexResults.slice(0, activeTab === 'All' ? 3 : undefined).map((pair: any, idx: number) => {
                                        const idrRate = rates?.IDR || 16300;
                                        const activeCurr = currency === 'BTC' ? 'USD' : currency; // fallback to USD if BTC

                                        const price = activeCurr === 'IDR' ? parseFloat(pair.priceUsd) * idrRate : parseFloat(pair.priceUsd);
                                        const liq = activeCurr === 'IDR' ? parseFloat(pair.liquidity?.usd || 0) * idrRate : parseFloat(pair.liquidity?.usd || 0);
                                        const vol = activeCurr === 'IDR' ? parseFloat(pair.volume?.h24 || 0) * idrRate : parseFloat(pair.volume?.h24 || 0);

                                        const prefix = activeCurr === 'IDR' ? 'Rp' : (activeCurr === 'USDT' ? '₮' : '$');

                                        const mc = activeCurr === 'IDR' ? parseFloat(pair.fdv || pair.marketCap || 0) * idrRate : parseFloat(pair.fdv || pair.marketCap || 0);

                                        const formatValue = (val: number) => {
                                            if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
                                            if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
                                            if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
                                            return `$${val.toFixed(2)}`;
                                        };

                                        const truncAddr = pair.pairAddress ? `${pair.pairAddress.slice(0, 4)}...${pair.pairAddress.slice(-4)}` : '';
                                        const chainName = pair.chainId?.includes('solana') ? 'Solana' : pair.chainId?.includes('ethereum') ? 'Ethereum' : pair.chainId?.includes('bsc') ? 'BSC' : pair.chainId || '';

                                        return (
                                            <div key={`dex-${pair.pairAddress}-${idx}`} className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <CoinIcon symbol={pair.baseToken.symbol} iconUrl={pair.info?.imageUrl} size={10} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-0.5 text-left">
                                                            <span className="font-bold text-slate-900 text-[15px] truncate max-w-[100px]">{pair.baseToken.name || pair.baseToken.symbol}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{chainName}</span>
                                                            {pair.info?.imageUrl && <span className="text-[10px]">🟢</span>}
                                                            <span className="text-[10px]">⚡</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-medium text-left mb-0.5">{truncAddr}</div>
                                                        <div className="text-[11px] text-slate-400 font-medium text-left">
                                                            {pair.liquidity?.usd ? `LIQ ${formatValue(liq)}` : ''}{pair.liquidity?.usd && mc ? '  |  ' : ''}{mc ? `MC ${formatValue(mc)}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end shrink-0 overflow-hidden">
                                                    <div className="font-bold text-slate-900 text-[15px] truncate w-full text-right leading-tight">
                                                        {price < 0.01
                                                            ? price.toLocaleString(undefined, { maximumSignificantDigits: 4 })
                                                            : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                                                        }
                                                    </div>
                                                    <div className={`text-[12px] font-semibold truncate w-full text-right ${pair.priceChange?.h24 >= 0 ? 'text-[#00C076]' : 'text-[#FF4D5B]'}`}>
                                                        {pair.priceChange?.h24 >= 0 ? '+' : ''}{parseFloat(pair.priceChange?.h24 || 0).toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {activeTab === 'All' && dexResults.length > 3 && (
                                    <button className="w-full mt-4 py-2.5 bg-[#F5F7F9] rounded-[14px] text-[14px] font-bold text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setActiveTab('DEX')}>Show more</button>
                                )}
                            </div>
                        )}

                        {dexResults.length === 0 && spotResults.length === 0 && futuresResults.length === 0 && !isTyping && (
                            <div className="text-center text-slate-400 mt-10">No results found</div>
                        )}
                        {isTyping && spotResults.length === 0 && futuresResults.length === 0 && dexResults.length === 0 && (
                            <div className="text-center text-slate-400 mt-10">Searching...</div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SearchOverlay;
