// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { fetchSingleTicker, fetchKlines } from '../utils/api';
import { formatPrice } from '../utils/format';
import RealChart from '../components/RealChart';
import { useOrderBookSocket } from '../hooks/useOrderBookSocket';
import { useTickerSocket } from '../hooks/useTickerSocket';
import {
    FiChevronLeft as ChevronLeft,
    FiStar as Star,
    FiShare2 as Share2,
    FiGrid as GridIcon,
    FiRepeat as Repeat,
    FiBell as BellPlus,
    FiInfo as Info,
    FiVolume2 as Volume2,
    FiX as XIcon,
    FiActivity as Activity,
    FiSettings as Settings,
    FiMaximize2 as Maximize2,
    FiMinimize2 as Minimize2,
    FiLayout as LayoutGrid,
    FiRefreshCw as RefreshCw,
    FiGlobe as Globe,
    FiGithub as Github,
    FiFileText as FileText,
    FiMonitor as Monitor,
    FiPenTool as PenTool
} from 'react-icons/fi';
import { RxTriangleDown as ChevronDown } from 'react-icons/rx';
import { MdOutlineArrowDropDown as ArrowDropDown } from 'react-icons/md';
import { LuPencilRuler, LuChartNoAxesCombined, LuBolt } from "react-icons/lu";
import trivLogo from '../assets/triv-logo.svg';

const INTERVALS = ['5m', '15m', '1h', '4h', '1D'];

const ChartTradeView = () => {
    const { selectedCoin, tradeType, setActivePage, setSearchOpen, favorites, toggleFavorite, markets, futuresMarkets } = useExchangeStore();
    const [interval, setInterval_] = useState('1h');
    const [activeTab, setActiveTab] = useState('Chart');
    const [infoTab, setInfoTab] = useState('Crypto info');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedTicker, setFetchedTicker] = useState<any>(null);
    const [isChartExpanded, setIsChartExpanded] = useState(false);
    const [klines, setKlines] = useState<any[]>([]);
    const [coinInfo, setCoinInfo] = useState<any>(null);
    const [coinInfoLoading, setCoinInfoLoading] = useState(false);

    const isFutures = tradeType === 'futures';
    const { orderBook } = useOrderBookSocket(selectedCoin, isFutures ? 'futures' : 'spot', 10);
    const isFav = favorites.includes(selectedCoin) || favorites.includes(`${selectedCoin}:${isFutures ? 'futures' : 'spot'}`);

    // Extract base asset dynamically
    const baseAsset = useMemo(() => {
        const quotes = ['USDT', 'USDC', 'BUSD', 'TUSD', 'FDUSD', 'BTC', 'ETH', 'BNB'];
        for (const q of quotes) {
            if (selectedCoin.endsWith(q)) return selectedCoin.slice(0, -q.length);
        }
        return selectedCoin;
    }, [selectedCoin]);

    // Get ticker data
    const ticker = useMemo(() => {
        const source = isFutures ? futuresMarkets : markets;
        return source.find(m => m.symbol === selectedCoin) || fetchedTicker || null;
    }, [selectedCoin, isFutures, markets, futuresMarkets, fetchedTicker]);

    // Fetch missing ticker if needed
    useEffect(() => {
        const source = isFutures ? futuresMarkets : markets;
        if (!source.find(m => m.symbol === selectedCoin)) {
            let cancelled = false;
            fetchSingleTicker(selectedCoin, tradeType).then(d => {
                if (!cancelled && d) setFetchedTicker(d);
            });
            return () => { cancelled = true; };
        } else {
            setFetchedTicker(null);
        }
    }, [selectedCoin, isFutures, markets, futuresMarkets, tradeType]);

    // Live Ticker over WebSocket
    const liveTicker = useTickerSocket(selectedCoin, tradeType, {
        lastPrice: ticker ? parseFloat(ticker.lastPrice) : 0,
        priceChange: ticker ? parseFloat(ticker.priceChange) : 0,
        priceChangePercent: ticker ? parseFloat(ticker.priceChangePercent) : 0,
        high24: ticker ? parseFloat(ticker.highPrice) : 0,
        low24: ticker ? parseFloat(ticker.lowPrice) : 0,
        vol24: ticker ? parseFloat(ticker.volume) : 0,
        turnover24: ticker ? parseFloat(ticker.quoteVolume) : 0,
    });

    const lastPrice = liveTicker?.lastPrice || (ticker ? parseFloat(ticker.lastPrice) : 0);
    const priceChange = liveTicker?.priceChangePercent || (ticker ? parseFloat(ticker.priceChangePercent) : 0);
    const high24 = liveTicker?.high24 || (ticker ? parseFloat(ticker.highPrice) : 0);
    const low24 = liveTicker?.low24 || (ticker ? parseFloat(ticker.lowPrice) : 0);
    const vol24 = liveTicker?.vol24 || (ticker ? parseFloat(ticker.volume) : 0);
    const turnover24 = liveTicker?.turnover24 || (ticker ? parseFloat(ticker.quoteVolume) : 0);

    // Symbol mapping for TradingView
    const tvSymbol = useMemo(() => {
        // Remove 'USDT' or other quotes to get the base, but actually TradingView wants the full symbol
        const symbol = selectedCoin;
        return isFutures ? `BINANCE:${symbol}.P` : `BINANCE:${symbol}`;
    }, [selectedCoin, isFutures]);

    // Interval mapping for TradingView -> Actually now for Binance API
    const apiInterval = useMemo(() => {
        const map: any = { '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': '1d' };
        return map[interval] || '1h';
    }, [interval]);

    // Fetch Klines
    useEffect(() => {
        let cancelled = false;
        fetchKlines(selectedCoin, apiInterval, 500, tradeType).then(data => {
            if (!cancelled) setKlines(data);
        });
        return () => { cancelled = true; };
    }, [selectedCoin, apiInterval, tradeType]);



    const formatVol = (v: number) => {
        if (!v) return '0';
        if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
        return v.toFixed(2);
    };

    const formatMcap = (v: number) => {
        if (!v) return '--';
        if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
        if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
        return `$${v.toLocaleString()}`;
    };

    // Fetch CoinGecko info when baseAsset changes
    useEffect(() => {
        if (!baseAsset) return;
        let cancelled = false;
        setCoinInfo(null);
        setCoinInfoLoading(true);

        const fetch_ = async () => {
            try {
                // 1. Search for CoinGecko ID
                const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${baseAsset.toLowerCase()}`);
                const searchData = await searchRes.json();
                const coin = searchData?.coins?.find((c: any) =>
                    c.symbol.toLowerCase() === baseAsset.toLowerCase()
                ) || searchData?.coins?.[0];
                if (!coin || cancelled) return;

                // 2. Fetch full detail
                const detailRes = await fetch(
                    `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
                );
                const detail = await detailRes.json();
                if (!cancelled) setCoinInfo(detail);
            } catch { } finally {
                if (!cancelled) setCoinInfoLoading(false);
            }
        };
        fetch_();
        return () => { cancelled = true; };
    }, [baseAsset]);

    const isPositive = priceChange >= 0;

    // Helpers for CoinGecko data
    const cgMarketCap = coinInfo?.market_data?.market_cap?.usd;
    const cgMcapRank = coinInfo?.market_cap_rank;
    const cgCircSupply = coinInfo?.market_data?.circulating_supply;
    const cgTotalSupply = coinInfo?.market_data?.total_supply;
    const cgMaxSupply = coinInfo?.market_data?.max_supply;
    const cgAth = coinInfo?.market_data?.ath?.usd;
    const cgAthDate = coinInfo?.market_data?.ath_date?.usd;
    const cgAtl = coinInfo?.market_data?.atl?.usd;
    const cgAtlDate = coinInfo?.market_data?.atl_date?.usd;
    const cgGenesis = coinInfo?.genesis_date;
    const cgDesc = coinInfo?.description?.en?.replace(/<[^>]+>/g, '') || '';
    const cgWebsite = coinInfo?.links?.homepage?.[0];
    const cgExplorer = coinInfo?.links?.blockchain_site?.find((s: string) => s);
    const cgGithub = coinInfo?.links?.repos_url?.github?.[0];
    const cgWhitepaper = coinInfo?.links?.whitepaper;
    const cgTwitter = coinInfo?.links?.twitter_screen_name ? `https://x.com/${coinInfo.links.twitter_screen_name}` : null;
    const cgFullName = coinInfo?.name || baseAsset;
    const cgThumb = coinInfo?.image?.small;



    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col min-h-screen bg-white pb-20 relative overflow-x-hidden"
        >
            {/* Header */}
            <div className={`px-4 pt-4 pb-2 sticky top-0 bg-white ${isChartExpanded ? 'z-[80]' : 'z-20'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <ChevronLeft className="w-6 h-6 text-gray-800 cursor-pointer" onClick={() => isChartExpanded ? setIsChartExpanded(false) : window.history.back()} />
                        <div>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSearchOpen(true)}>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{selectedCoin.replace('USDT', '/USDT')}</h1>
                                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Spot</span>
                                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">10x</span>
                                <ArrowDropDown className="w-6 h-6 text-slate-500 mt-0.5" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[12px] font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatPrice(lastPrice)}
                                </span>
                                <span className={`text-[12px] font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Star
                            className={`w-5 h-5 cursor-pointer ${isFav ? 'text-yellow-500' : 'text-gray-800'}`}
                            fill={isFav ? 'currentColor' : 'none'}
                            onClick={() => toggleFavorite(`${selectedCoin}:${isFutures ? 'futures' : 'spot'}`)}
                        />
                        <Share2 className="w-5 h-5 text-gray-800 cursor-pointer" />
                    </div>
                </div>

                {!isChartExpanded && (
                    <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-gray-200">
                        {['Chart', 'Info', 'Data'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 whitespace-nowrap text-[14px] font-semibold transition-colors ${activeTab === tab ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full">
                {activeTab === 'Chart' && (
                    <div>
                        {/* Price Info Bar */}
                        {!isChartExpanded && (
                            <>
                                <div className="px-4 py-3 pb-4 border-b border-slate-50 flex justify-between items-start w-full">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[28px] font-bold tracking-tight leading-none ${isPositive ? 'text-[#00C076]' : 'text-[#FF4D5B]'}`}>
                                                {formatPrice(lastPrice)}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 text-[12px] mt-1.5 flex items-center gap-2 font-medium">
                                            <span>≈${formatPrice(lastPrice)}</span>
                                            <span className={isPositive ? 'text-[#00C076]' : 'text-[#FF4D5B]'}>
                                                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                            </span>
                                        </div>
                                        {isFutures && (
                                            <div className="text-slate-500 text-[11px] mt-0.5 font-medium">
                                                Mark price <span className="text-slate-700">{formatPrice(lastPrice)}</span>
                                            </div>
                                        )}
                                        {cgMcapRank && (
                                            <div className="flex items-center gap-1 mt-2.5 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-max">
                                                <span className="font-bold">🏆 No. {cgMcapRank}</span> <span className="text-orange-200">|</span> Market Cap Rank
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-[10px] text-right mt-1">
                                        <div className="text-slate-400">24h high</div>
                                        <div className="text-slate-800 font-bold">{formatPrice(high24)}</div>
                                        <div className="text-slate-400">24h low</div>
                                        <div className="text-slate-800 font-bold">{formatPrice(low24)}</div>
                                        <div className="text-slate-400">24h vol ({baseAsset})</div>
                                        <div className="text-slate-800 font-bold">{formatVol(vol24)}</div>
                                        <div className="text-slate-400">24h vol (USDT)</div>
                                        <div className="text-slate-800 font-bold">{formatVol(turnover24)}</div>
                                    </div>
                                </div>

                                <div className="px-4 py-2 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-600 border-y border-slate-100">
                                    <div className="flex items-center gap-2 truncate pr-4 font-medium">
                                        <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">Explosions were heard from many countries where US military..</span>
                                    </div>
                                    <XIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-pointer" />
                                </div>

                                <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 text-[12px] text-slate-500 font-medium">
                                    <div className="flex gap-4">
                                        {INTERVALS.map((iv) => (
                                            <button key={iv} onClick={() => setInterval_(iv)} className={interval === iv ? 'text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-full' : ''}>{iv}</button>
                                        ))}
                                        <button className="flex items-center gap-0.5">More <ArrowDropDown className="w-7 h-7 mt-0.5" /></button>
                                        <button>Mcap</button>
                                    </div>
                                    <div className="flex gap-4 text-slate-700">
                                        <Activity className="w-4 h-4 cursor-pointer" />
                                        <Settings className="w-4 h-4 cursor-pointer" />
                                    </div>
                                </div>
                            </>
                        )}

                        <AnimatePresence>
                            {isChartExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="fixed top-[72px] bottom-[calc(70px+var(--safe-area-bottom))] left-0 right-0 z-[60] bg-white flex flex-col"
                                >
                                    {/* Chart Area */}
                                    <div className="flex-1 relative w-full overflow-hidden min-h-0">
                                        <div className="absolute inset-0">
                                            <RealChart
                                                data={klines}
                                                pricePrecision={lastPrice > 1 ? 2 : 4}
                                            />
                                        </div>

                                        {/* Watermark Logo */}
                                        <div className="absolute pointer-events-none z-10 opacity-[0.08] bottom-4 left-12">
                                            <img src={trivLogo} alt="Triv Watermark" className="h-8" />
                                        </div>

                                        <button
                                            onClick={() => setIsChartExpanded(false)}
                                            className="absolute bottom-4 left-4 p-1.5 bg-white/80 border border-slate-200 rounded shadow-sm z-20 hover:bg-white transition-colors"
                                        >
                                            <Minimize2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>

                                    {/* Interval Selector (Fixed Height) */}
                                    <div className="h-[48px] bg-white border-t border-gray-100 flex items-center justify-between px-4 text-[12px] text-gray-500 font-bold shrink-0">
                                        <div className="flex gap-5">
                                            {INTERVALS.map((iv) => (
                                                <button key={iv} onClick={() => setInterval_(iv)} className={interval === iv ? 'text-gray-900 bg-gray-100 px-2 py-1 rounded-[6px]' : ''}>{iv}</button>
                                            ))}
                                            <button className="flex items-center gap-0.5">More <ArrowDropDown className="w-7 h-7" /></button>
                                            <button>Mcap</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isChartExpanded && (
                            <div className="relative px-1">
                                <div className="w-full h-[320px] overflow-hidden relative">
                                    <RealChart
                                        data={klines}
                                        height={320}
                                        pricePrecision={lastPrice > 1 ? 2 : 4}
                                    />

                                    {/* Watermark Logo */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-[0.1] -translate-y-8">
                                        <img src={trivLogo} alt="Triv Watermark" className="w-48" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsChartExpanded(true)}
                                    className="absolute bottom-4 left-4 p-1.5 bg-white/80 border border-slate-200 rounded shadow-sm z-10 hover:bg-white transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}

                        {!isChartExpanded && (
                            <>
                                {/* Order Book Section Header */}
                                <div className="px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar border-b border-slate-100 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                                    <button>VOL</button>
                                    <button>MA</button>
                                    <button className="text-slate-900 font-bold border-b border-slate-900 -mb-3 pb-3">EMA</button>
                                    <button>BOLL</button>
                                    <button>SAR</button>
                                    <button>RESIST</button>
                                    <button>SUPERTREND</button>
                                    <button>Envelope</button>
                                </div>

                                {/* Order Book */}
                                <div className="px-4 mt-2">
                                    <div className="flex gap-6 border-b border-slate-100">
                                        {['Order book', 'Depth', 'Last trades', 'Market events'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`pb-2 text-[14px] font-semibold transition-colors ${tab === 'Order book' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between text-[11px] text-slate-400 py-3 font-medium">
                                        <div>Buy ({baseAsset})</div>
                                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">0.1 <ArrowDropDown className="w-7 h-7" /></div>
                                        <div>Sell ({baseAsset})</div>
                                    </div>

                                    <div className="flex gap-2 text-[11px] pb-6">
                                        <div className="flex-1 space-y-[2px]">
                                            {orderBook.bids.slice(0, 10).map(([price, qty], i) => {
                                                const maxQty = Math.max(...orderBook.bids.slice(0, 10).map(b => parseFloat(b[1])), 0.0001);
                                                const pct = (parseFloat(qty) / maxQty) * 100;
                                                return (
                                                    <div key={i} className="flex justify-between relative h-5 items-center">
                                                        <div className="absolute right-0 top-0 h-full bg-[#00C076] opacity-[0.12]" style={{ width: `${pct}%` }}></div>
                                                        <span className="text-slate-600 relative z-10">{parseFloat(qty).toFixed(3)}</span>
                                                        <span className="text-[#00C076] font-medium relative z-10">{formatPrice(parseFloat(price))}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex-1 space-y-[2px]">
                                            {orderBook.asks.slice(0, 10).map(([price, qty], i) => {
                                                const maxQty = Math.max(...orderBook.asks.slice(0, 10).map(a => parseFloat(a[1])), 0.0001);
                                                const pct = (parseFloat(qty) / maxQty) * 100;
                                                return (
                                                    <div key={i} className="flex justify-between relative h-5 items-center">
                                                        <div className="absolute left-0 top-0 h-full bg-[#FF4D5B] opacity-[0.12]" style={{ width: `${pct}%` }}></div>
                                                        <span className="text-[#FF4D5B] font-medium relative z-10">{formatPrice(parseFloat(price))}</span>
                                                        <span className="text-slate-600 relative z-10">{parseFloat(qty).toFixed(3)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Info' && !isChartExpanded && (
                    <div className="px-4 py-4">
                        <div className="flex gap-4 border-b border-slate-100 pb-2 mb-5">
                            {['Crypto info', 'Trading rules', 'Funding rate'].map((t, i) => (
                                <span key={t} className={`text-[13px] font-bold cursor-pointer ${infoTab === t ? 'text-slate-900 bg-slate-100/80 px-3 py-1 rounded-full' : 'text-slate-400 py-1'}`}
                                    onClick={() => setInfoTab(t)}>{t}</span>
                            ))}
                        </div>

                        {coinInfoLoading ? (
                            <div className="flex flex-col gap-3 animate-pulse">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-4 bg-slate-100 rounded w-full" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 mb-6">
                                    {cgThumb ? (
                                        <img src={cgThumb} alt={baseAsset} className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ background: 'linear-gradient(135deg, #627eea, #4a5fa8)' }}>
                                            {baseAsset.substring(0, 3)}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-bold text-[18px] text-slate-900 tracking-tight">{baseAsset}</span>
                                        <span className="text-[14px] text-slate-500 ml-1.5 font-medium">{cgFullName !== baseAsset ? cgFullName : ''}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                    {[
                                        { label: 'Market cap ranking', value: cgMcapRank ? `No. ${cgMcapRank}` : '--' },
                                        { label: 'Market cap', value: formatMcap(cgMarketCap) },
                                        { label: 'Circulating supply', value: cgCircSupply ? `${cgCircSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${baseAsset}` : '--' },
                                        { label: 'Max supply', value: cgMaxSupply ? `${cgMaxSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${baseAsset}` : cgTotalSupply ? `${cgTotalSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${baseAsset}` : '∞' },
                                        { label: 'All-time high', value: cgAth ? `$${Number(cgAth).toLocaleString('en-US', { maximumFractionDigits: 6 })}${cgAthDate ? `\n(${new Date(cgAthDate).toLocaleDateString('en-US', { day:'2-digit', month:'2-digit', year:'numeric' })})` : ''}` : '--' },
                                        { label: 'All-time low', value: cgAtl ? `$${Number(cgAtl).toLocaleString('en-US', { maximumFractionDigits: 6 })}${cgAtlDate ? `\n(${new Date(cgAtlDate).toLocaleDateString('en-US', { day:'2-digit', month:'2-digit', year:'numeric' })})` : ''}` : '--' },
                                        { label: 'Launch date', value: cgGenesis || '--' },
                                        { label: 'Fully diluted valuation', value: coinInfo?.market_data?.fully_diluted_valuation?.usd ? formatMcap(coinInfo.market_data.fully_diluted_valuation.usd) : '--' },
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <div className="text-[11px] text-slate-500 mb-0.5">{item.label}</div>
                                            <div className="text-[13px] font-bold text-slate-900 whitespace-pre-line leading-tight">{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {cgDesc && (
                                    <div className="mt-8">
                                        <h3 className="font-bold text-[18px] text-slate-900 mb-2">About {cgFullName}</h3>
                                        <p className="text-[13px] text-slate-600 leading-relaxed mb-1 line-clamp-5">
                                            {cgDesc}
                                        </p>
                                        <span className="text-[13px] text-slate-900 font-bold cursor-pointer">Show more <ArrowDropDown size={14} className="inline align-middle" /></span>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-wrap gap-2 pb-6">
                                    {cgTwitter && <a href={cgTwitter} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-bold text-slate-700">𝕏 X</a>}
                                    {cgExplorer && <a href={cgExplorer} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-bold text-slate-700">🌐 Block explorer</a>}
                                    {cgGithub && <a href={cgGithub} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-bold text-slate-700">⌨️ GitHub</a>}
                                    {cgWhitepaper && <a href={cgWhitepaper} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-bold text-slate-700">📄 Whitepaper</a>}
                                    {cgWebsite && <a href={cgWebsite} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-bold text-slate-700">🖥️ Official website</a>}
                                    {!cgTwitter && !cgExplorer && !cgGithub && !cgWhitepaper && !cgWebsite && (
                                        <span className="text-slate-400 text-[12px]">No links available</span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Data' && !isChartExpanded && (
                    <div className="px-4 py-4 bg-slate-50 min-h-full">
                        {isFutures ? (
                            <div className="space-y-4 pb-8">
                                {/* Open Interest */}
                                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <h3 className="font-bold text-[16px] text-slate-900 tracking-tight">Open interest</h3>
                                        <Info size={14} className="text-slate-400" />
                                    </div>
                                    <div className="flex gap-2.5 mb-6">
                                        {['5m', '15m', '1h', '4h', '1D'].map((t, i) => (
                                            <span key={t} className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</span>
                                        ))}
                                    </div>
                                    <div className="h-[140px] flex items-end justify-between gap-[2px] mt-2 relative">
                                        {/* Mock line overlay (rough svg) */}
                                        <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            <path d="M0,80 L10,75 L20,85 L30,50 L40,40 L50,45 L60,30 L70,30 L80,20 L90,25 L100,10" fill="none" stroke="#64748b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} className="bg-[#f5b041] w-full rounded-t-sm opacity-80" style={{ height: `${30 + Math.random() * 50}%` }} />
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2">
                                        <span>09:50</span><span>10:40</span><span>11:30</span><span>12:20</span>
                                    </div>
                                    <div className="flex gap-4 mt-5 text-[11px] font-medium text-slate-500 justify-center">
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#f5b041] rounded-[2px]" /> Open interest</div>
                                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-[2px] bg-slate-500" /> Open interest (notional value)</div>
                                    </div>
                                </div>

                                {/* Funding Rate */}
                                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-6">
                                        <h3 className="font-bold text-[16px] text-slate-900 tracking-tight">Funding rate</h3>
                                        <Info size={14} className="text-slate-400" />
                                    </div>
                                    <div className="h-[140px] relative mt-2">
                                        <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-slate-300" />
                                        {/* Mock positive/negative chart line */}
                                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            {/* Green parts (above 50) */}
                                            <path d="M0,50 L5,20 L10,50 M30,50 L35,10 L40,50 L45,30 L50,50 L55,20 L60,50 M65,50 L70,30 L75,10 L80,50 M85,50 L90,20 L95,50" fill="none" stroke="#00C076" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                            {/* Red parts (below 50) */}
                                            <path d="M10,50 L15,80 L20,60 L25,90 L30,50 M40,50 L45,70 L50,50 M60,50 L65,70 L70,50 M80,50 L85,90 L90,50 L95,80 L100,50" fill="none" stroke="#FF4D5B" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2">
                                        <span>01/31</span><span>02/06</span><span>02/13</span><span>02/20</span><span>02/26</span>
                                    </div>
                                    <div className="flex gap-4 mt-5 text-[11px] font-medium text-slate-500 justify-center">
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-[2px] bg-[#00C076]" /> Positive</div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-[2px] bg-[#FF4D5B]" /> Negative</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 mt-10 text-[14px]">
                                Market data analytics available only for Futures pairs.
                            </div>
                        )}
                    </div>
                )}

                {/* Trade tab removed as requested */}
            </div>

            {/* Bottom bar */}
            <div className={`fixed bottom-0 w-full max-w-md border-t border-slate-100 px-4 pt-3 pb-[calc(10px+var(--safe-area-bottom))] flex items-center justify-between gap-4 z-[70] ${isChartExpanded ? 'bg-[#fcfcfc]' : 'bg-white'}`}>
                <button
                    className="flex-1 max-w-[200px] bg-black text-white font-bold py-3 rounded-full text-[15px] text-center active:scale-[0.98] transition-all whitespace-nowrap"
                    onClick={() => {
                        useExchangeStore.setState({ selectedCoin, activePage: isFutures ? 'futures' : 'trade' });
                    }}
                >
                    Trade
                </button>

                <div className="flex gap-6 pr-2 items-center translate-y-1">
                    <div className="flex flex-col items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-900 transition-colors group">
                        <LuPencilRuler className="w-6 h-6 text-slate-900" />
                        <span className="text-[10px] font-medium text-slate-400">Drawings</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-900 transition-colors group">
                        <LuChartNoAxesCombined className="w-6 h-6 text-slate-900" />
                        <span className="text-[10px] font-medium text-slate-400">Indicators</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-slate-500 relative cursor-pointer hover:text-slate-900 transition-colors group">
                        <LuBolt className="w-6 h-6 text-slate-900" />
                        <span className="text-[10px] font-medium text-slate-400">Settings</span>
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </div>
                </div>
            </div>
        </motion.div >
    );
};

export default ChartTradeView;
