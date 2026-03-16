import React, { useState, useEffect, useMemo } from 'react';
import {
    LuChevronDown as ChevronDown,
    LuMoveHorizontal as MoreHorizontal,
    LuAlignRight as AlignRight,
    LuCheck as Check,
    LuChevronRight as ChevronRight,
    LuInfo as Info,
    LuActivity as Activity,
    LuFileText as FileText,
    LuLayoutGrid as LayoutGrid,
    LuCompass as Compass
} from 'react-icons/lu';
import { HiOutlineChartBar as BarChart2, HiOutlineChartPie as PieChart } from 'react-icons/hi2';
import { MdOutlineArrowDropDown as ArrowDropDown } from 'react-icons/md';
import { formatPrice, formatAbbreviated } from '../utils/format';
import { useOrderBookSocket } from '../hooks/useOrderBookSocket';
import { useTickerSocket } from '../hooks/useTickerSocket';
import useExchangeStore from '../stores/useExchangeStore';
import RealChart from '../components/RealChart';
import { AssetPositionCard } from '../components/TradeCards';
import type { Asset } from '../types';

const baseUrl = 'https://api.binance.com';
const prefix = '/api/v3';
const currentSymbol = 'BTCUSDT';
const activeInterval = '1h';

export default function SpotTradeView() {
    const { 
        openOrders, spotTPSL, positions, wallets, spotCostBasis, spotSymbols, setSpotTradeSheetOpen 
    } = useExchangeStore();

    const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
    const wsTicker = useTickerSocket(currentSymbol, 'spot');
    const { orderBook: wsOrderBook } = useOrderBookSocket(currentSymbol, 'spot');
    
    const [priceInput, setPriceInput] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [tickSize, setTickSize] = useState<number>(0.001);
    const [precision, setPrecision] = useState<number>(0.001);
    const [isPrecisionSheetOpen, setIsPrecisionSheetOpen] = useState(false);

    // UI states
    const [sliderPercent, setSliderPercent] = useState(0);
    const [isMarginEnabled, setIsMarginEnabled] = useState(false);
    const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
    const [isCurrentSymbolChecked, setIsCurrentSymbolChecked] = useState(false);
    const [orderBookView, setOrderBookView] = useState<'both' | 'buy' | 'sell'>('both');
    const [isMiniChartOpen, setIsMiniChartOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'positions' | 'bots'>('orders');
    const [klines, setKlines] = useState<any[]>([]);

    const MAX_BTC = 0.0554000;

    const currentPriceNum = parseFloat(priceInput) || 0;

    const ticker = useMemo(() => {
        if (!wsTicker) return null;
        return {
            ...wsTicker,
            lastPrice: wsTicker.lastPrice.toString(),
            priceChangePercent: wsTicker.priceChangePercent.toString()
        };
    }, [wsTicker]);

    const pricePrecision = useMemo(() => {
        if (tickSize && tickSize > 0) {
            const str = tickSize.toString();
            if (str.includes('e-')) return parseInt(str.split('e-')[1], 10);
            const parts = str.split('.');
            return parts.length > 1 ? parts[1].length : 0;
        }

        const info = (spotSymbols || []).find(s => s.symbol === currentSymbol);
        if (info && info.pricePrecision !== 8) return info.pricePrecision; // 8 is often a generic quote precision
        
        // Fallback heuristic matching format.ts
        const lastPriceNum = ticker ? parseFloat(ticker.lastPrice) : 0;
        const p = Math.abs(lastPriceNum);
        if (p >= 1000) return 1;
        if (p >= 100) return 2;
        if (p >= 10) return 3;
        if (p >= 1) return 4;
        if (p >= 0.1) return 5;
        if (p >= 0.01) return 6;
        if (p >= 0.001) return 7;
        return 8;
    }, [currentSymbol, spotSymbols, ticker, tickSize]);

    const orderBook = useMemo(() => ({
        bids: wsOrderBook.bids.map(b => ({ price: parseFloat(b[0]), amount: parseFloat(b[1]) })),
        asks: wsOrderBook.asks.map(a => ({ price: parseFloat(a[0]), amount: parseFloat(a[1]) })).reverse()
    }), [wsOrderBook]);

    // Auto-fill price input saat pertama kali buka koin
    useEffect(() => {
        if (ticker?.lastPrice && priceInput === '') {
            setPriceInput(formatInput(parseFloat(ticker.lastPrice).toString()));
        }
    }, [ticker?.lastPrice, priceInput]);

    const dynamicPrecisions = useMemo(() => {
        if (tickSize && tickSize > 0) {
            return [
                tickSize,
                tickSize * 10,
                tickSize * 100,
                tickSize * 1000
            ].map(v => parseFloat(v.toPrecision(10)));
        }

        const p = currentPriceNum || 0;
        if (p < 0.00001) return [0.00000001, 0.0000001, 0.000001, 0.00001];
        if (p < 0.001) return [0.000001, 0.00001, 0.0001, 0.001];
        if (p < 0.1) return [0.0001, 0.001, 0.01, 0.1];
        if (p < 10) return [0.001, 0.01, 0.1, 1];
        if (p < 500) return [0.01, 0.1, 1, 10];
        if (p < 5000) return [0.1, 1, 10, 100];
        return [0.1, 1, 10, 100];
    }, [currentPriceNum, tickSize]);

    useEffect(() => {
        if (!dynamicPrecisions.includes(precision) || (tickSize && precision < tickSize)) {
            setPrecision(dynamicPrecisions[0]);
        }
    }, [dynamicPrecisions, precision, tickSize]);

    const precisionDecimals = useMemo(() => {
        if (precision >= 1) return 0;
        const str = precision.toString();
        if (str.includes('e-')) {
            return parseInt(str.split('e-')[1], 10);
        }
        return str.split('.')[1]?.length || 0;
    }, [precision]);

    const aggregateOrderBook = (data: any[], type: 'buy' | 'sell') => {
        if (!data || data.length === 0) return [];
        const grouped: { [key: string]: number } = {};
        data.forEach(item => {
            const p = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const groupedPrice = type === 'buy'
                ? Math.floor(p / precision) * precision
                : Math.ceil(p / precision) * precision;
            const priceKey = groupedPrice.toFixed(precisionDecimals);
            grouped[priceKey] = (grouped[priceKey] || 0) + (typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount);
        });
        return Object.entries(grouped)
            .map(([price, amount]) => ({ price: parseFloat(price), amount }))
            .sort((a, b) => type === 'buy' ? b.price - a.price : a.price - b.price);
    };

    useEffect(() => {
        const fetchKlines = async (interval: string) => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/klines?symbol=${currentSymbol}&interval=${interval}&limit=100`);
                const data = await res.json();
                const formatted = data.map((d: any) => ({
                    time: d[0] / 1000,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4])
                }));
                setKlines(formatted);
            } catch (err) { }
        };

        const fetchExchangeInfo = async () => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/exchangeInfo?symbol=${currentSymbol}`);
                const data = await res.json();
                const symbolInfo = data.symbols?.[0];
                if (symbolInfo) {
                    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
                    if (priceFilter && priceFilter.tickSize) {
                        setTickSize(parseFloat(priceFilter.tickSize));
                    }
                }
            } catch (err) { }
        };

        fetchExchangeInfo();
        fetchKlines(activeInterval);
    }, []);



    const handleTradeSideSwitch = (side: 'buy' | 'sell') => {
        setTradeSide(side);
    };

    const formatInput = (val: string) => {
        if (!val) return '';
        const parts = val.replace(/,/g, '').split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        setPriceInput(formatInput(raw));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        const formatted = formatInput(raw);
        setAmountInput(formatted);
        const numVal = parseFloat(raw);
        if (raw && !isNaN(numVal)) {
            const pct = Math.min(100, Math.max(0, (numVal / MAX_BTC) * 100));
            setSliderPercent(pct);
        } else {
            setSliderPercent(0);
        }
    };

    const updateAmountByPercent = (pct: number) => {
        setSliderPercent(pct);
        if (pct === 0) {
            setAmountInput('');
        } else {
            setAmountInput(formatInput((MAX_BTC * (pct / 100)).toFixed(8)));
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pct = parseInt(e.target.value);
        updateAmountByPercent(pct);
    };

    const cycleOrderBookView = () => {
        setOrderBookView(prev => {
            if (prev === 'both') return 'buy';
            if (prev === 'buy') return 'sell';
            return 'both';
        });
    };

    const aggregatedAsks = aggregateOrderBook(orderBook.asks, 'sell');
    const aggregatedBids = aggregateOrderBook(orderBook.bids, 'buy');

    const isPositive = ticker ? parseFloat(ticker.priceChangePercent) >= 0 : true;

    const availableValue = tradeSide === 'buy'
        ? (MAX_BTC * currentPriceNum).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' USDT'
        : MAX_BTC.toFixed(7) + ' BTC';

    const maxBuySellValue = MAX_BTC.toFixed(8) + ' BTC';

    const totalUsdt = amountInput && !isNaN(parseFloat(amountInput.replace(/,/g, '')))
        ? (parseFloat(amountInput.replace(/,/g, '')) * currentPriceNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '';

    const renderSvgChart = (customHeight?: number) => {
        if (!klines || klines.length === 0) return null;
        const width = 400;
        const height = customHeight || 320;
        const padding = customHeight ? 5 : 20;
        const drawableHeight = height - padding * 2;

        const minPrice = Math.min(...klines.map(d => d.low));
        const maxPrice = Math.max(...klines.map(d => d.high));
        const range = maxPrice - minPrice || 1;
        const candleWidth = width / klines.length;
        const getY = (price: number) => height - padding - ((price - minPrice) / range) * drawableHeight;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                {klines.map((d, i) => {
                    const x = i * candleWidth;
                    const yOpen = getY(d.open);
                    const yClose = getY(d.close);
                    const yHigh = getY(d.high);
                    const yLow = getY(d.low);
                    const isUp = d.close >= d.open;
                    const color = isUp ? '#10b981' : '#ef4444';
                    const rectY = Math.min(yOpen, yClose);
                    const rectHeight = Math.max(Math.abs(yOpen - yClose), 1);
                    return (
                        <g key={i}>
                            <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1" />
                            <rect x={x + candleWidth * 0.1} y={rectY} width={candleWidth * 0.8} height={rectHeight} fill={color} />
                        </g>
                    );
                })}
            </svg>
        );
    };

    const halfListCount = isTpSlEnabled ? 8 : 6;
    const fullListCount = isTpSlEnabled ? 16 : 12;
    const askLimit = orderBookView === 'sell' ? fullListCount : halfListCount;
    const bidLimit = orderBookView === 'buy' ? fullListCount : halfListCount;

    return (
        <div className="flex justify-center bg-[var(--bg-secondary)] min-h-screen" style={{ fontFamily: "'OKX Sans', sans-serif" }}>
            <style>
                {`
          @font-face {
            font-family: 'OKX Sans';
            src: url('https://www.okx.com/cdn/assets/okfe/libs/fonts/OKX_Sans/Regular.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out forwards;
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
            </style>

            <div className="w-full max-w-md bg-[var(--bg-primary)] min-h-screen shadow-xl relative pb-[120px] flex flex-col mx-auto overflow-x-hidden">

                {/* Top Header Tabs */}
                <div className="px-4 pt-4 pb-2 bg-[var(--bg-primary)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5 text-[15px]">
                            <span className="font-bold text-[var(--text-primary)] border-b-2 border-gray-900 pb-1">Spot</span>
                            <span className="font-semibold text-[var(--text-tertiary)] pb-1">Futures</span>
                            <span className="font-semibold text-[var(--text-tertiary)] pb-1">Bots</span>
                            <span className="font-semibold text-[var(--text-tertiary)] pb-1">Convert</span>
                        </div>
                        <div className="text-[var(--text-primary)]"><AlignRight size={20} /></div>
                    </div>
                </div>

                {/* Symbol Header */}
                <div className="px-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)] sticky top-0 z-30 h-[52px]">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-bold text-[var(--text-primary)] leading-none">{currentSymbol.replace('USDT', '/USDT')}</h1>
                        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-bold px-1.5 py-[1px] rounded-[4px] leading-none mt-0.5">10x</span>
                        <div className="text-[var(--text-secondary)] mt-0.5"><ArrowDropDown size={24} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-[var(--text-primary)] cursor-pointer"><Activity size={20} /></div>
                        <div className="text-[var(--text-primary)]"><MoreHorizontal size={20} /></div>
                    </div>
                </div>

                <div className="flex">
                    {/* Left Panel: Trade Inputs */}
                    <div className="w-[58%] p-3 pr-2 flex flex-col gap-1.5">
                        <div className="flex rounded-[8px] bg-[var(--bg-secondary)] p-[3px] mb-1">
                            <button
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${tradeSide === 'buy' ? 'bg-[var(--green)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                                onClick={() => handleTradeSideSwitch('buy')}
                            >
                                Buy
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${tradeSide === 'sell' ? 'bg-[var(--red)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                                onClick={() => handleTradeSideSwitch('sell')}
                            >
                                Sell
                            </button>
                        </div>

                        <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex items-center justify-between cursor-pointer border border-transparent hover:border-[var(--border-color)]">
                            <span className="font-semibold text-[14px] text-[var(--text-primary)] flex items-center gap-1.5">
                                Limit order <div className="text-[var(--text-primary)]"><Check size={18} /></div>
                            </span>
                            <div className="text-[var(--text-secondary)] flex items-center"><ArrowDropDown size={24} /></div>
                        </div>

                        <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex flex-col justify-center border border-transparent focus-within:border-[var(--border-strong)] transition-colors">
                            <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Price (USDT)</span>
                            <input
                                type="text"
                                className="bg-transparent font-medium text-[var(--text-primary)] text-[15px] outline-none w-full p-0 leading-none"
                                value={priceInput}
                                onChange={handlePriceInputChange}
                            />
                        </div>

                        <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex flex-col justify-center border border-transparent focus-within:border-[var(--border-strong)] transition-colors relative cursor-text">
                            {amountInput ? (
                                <div className="flex flex-col w-full z-10">
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Amount (BTC)</span>
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[15px] outline-none w-full p-0 leading-none"
                                        value={amountInput}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-between items-center w-full relative">
                                    <span className="text-[14px] text-[var(--text-secondary)] font-medium">Amount</span>
                                    <span className="text-[14px] text-[var(--text-secondary)] font-medium">BTC</span>
                                    <input
                                        type="text"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                                        value={amountInput}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Precision Slider */}
                        <div className="relative w-full h-8 flex items-center mb-1.5 mt-0.5 px-[6px]">
                            <div className="absolute left-[6px] right-[6px] h-[3px] bg-[var(--bg-secondary)]">
                                <div className="h-full transition-all duration-75 bg-[var(--text-primary)]" style={{ width: `${sliderPercent}%` }} />
                            </div>
                            <div className="absolute left-[6px] right-[6px] flex justify-between items-center h-full z-40 pointer-events-none">
                                {[0, 25, 50, 75, 100].map(val => (
                                    <div
                                        key={val}
                                        onClick={() => updateAmountByPercent(val)}
                                        className={`w-[11px] h-[11px] rounded-full border-[2px] z-50 transition-colors duration-75 cursor-pointer pointer-events-auto bg-[var(--bg-primary)] ${sliderPercent >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`}
                                    />
                                ))}
                            </div>
                            <input
                                type="range" min="0" max="100" value={sliderPercent}
                                onChange={handleSliderChange}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-30 left-0"
                            />
                            <div
                                className="absolute w-[15px] h-[15px] bg-[var(--bg-primary)] border-[3.5px] border-[var(--text-primary)] rounded-full z-60 pointer-events-none transition-all duration-75 shadow-sm"
                                style={{
                                    left: `calc(11.5px + (${sliderPercent} / 100) * (100% - 23px))`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>

                        <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-2 flex flex-col justify-center relative">
                            {totalUsdt && amountInput ? (
                                <div className="flex flex-col w-full z-10">
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Total (USDT)</span>
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[15px] outline-none w-full p-0 leading-none pointer-events-none"
                                        value={totalUsdt}
                                        readOnly
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-between items-center w-full pointer-events-none z-10">
                                    <span className="text-[14px] text-[var(--text-secondary)] font-medium">Total</span>
                                    <span className="text-[14px] text-[var(--text-secondary)] font-medium">USDT</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-[12px] mb-1 px-1">
                            <span className="text-[var(--text-tertiary)] font-medium">Available</span>
                            <span className="font-semibold text-[var(--text-secondary)] text-[11px]">{availableValue}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px] mb-2 px-1">
                            <span className="text-[var(--text-tertiary)] font-medium">Max {tradeSide}</span>
                            <span className="font-semibold text-[var(--text-secondary)] text-[11px]">{maxBuySellValue}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3 px-1 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}>
                                <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center border-2 ${isTpSlEnabled ? 'border-gray-900 bg-[var(--bg-primary)]' : 'border-gray-400'}`}>
                                    {isTpSlEnabled && <div className="text-[var(--text-primary)] flex items-center"><Check size={12} /></div>}
                                </div>
                                <span className="text-[13px] font-medium text-[var(--text-secondary)] border-b border-dashed border-gray-400 leading-none pb-[1px]">TP/SL</span>
                            </label>
                        </div>

                        {isTpSlEnabled && (
                            <div className="animate-in fade-in duration-300">
                                <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[44px] mb-2 flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">TP trigger price</span>
                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">USDT</span>
                                </div>
                                <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[44px] mb-4 flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">SL trigger price</span>
                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">USDT</span>
                                </div>
                            </div>
                        )}

                        <button className={`w-full h-[40px] rounded-full font-bold text-white text-[15px] mt-auto shadow-sm ${tradeSide === 'buy' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`}>
                            {tradeSide === 'buy' ? 'Buy BTC' : 'Sell BTC'}
                        </button>
                    </div>

                    {/* Right Panel: Order Book */}
                    <div className="w-[42%] p-3 pl-2 flex flex-col text-[11px]">
                        <div className="flex items-center justify-end gap-2 mb-3">
                            <span className="text-[var(--text-primary)] text-[13px] font-medium">Margin</span>
                            <div
                                className={`w-[34px] h-[18px] rounded-full flex items-center p-[2px] cursor-pointer ${isMarginEnabled ? 'bg-[var(--green)] justify-end' : 'bg-gray-300 justify-start'}`}
                                onClick={() => setIsMarginEnabled(!isMarginEnabled)}
                            >
                                <div className="w-[14px] h-[14px] bg-[var(--bg-primary)] rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="flex justify-between text-[var(--text-tertiary)] mb-1.5 text-[11px] font-medium px-1">
                            <span>Price<br />(USDT)</span>
                            <span className="text-right">Amount<br />(BTC)</span>
                        </div>

                        {(orderBookView === 'both' || orderBookView === 'sell') && (
                            <div className="flex flex-col flex-1 justify-end relative gap-[1px]">
                                {(() => {
                                    const maxAmount = Math.max(...aggregatedAsks.slice(-askLimit).map(a => a.amount), 1);

                                    return aggregatedAsks.slice(-askLimit).map((ask: any, i: number) => (
                                        <div key={`ask-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => setPriceInput(formatInput(ask.price.toFixed(precisionDecimals)))}>
                                            <div className="absolute right-0 top-0 h-full bg-[var(--red-bg)] transition-all duration-300" style={{ width: `${(ask.amount / maxAmount) * 100}%` }} />
                                            <span className="text-[var(--red)] font-medium relative z-10 text-[12px] tracking-tight">
                                                {formatPrice(ask.price, pricePrecision)}
                                            </span>
                                            <span className="text-[var(--text-secondary)] relative z-10 text-[12px] font-medium tracking-tight">
                                                {ask.amount >= 1 ? ask.amount.toFixed(2) : ask.amount.toFixed(5)}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        <div className="py-2 my-0.5 relative group">
                            <div className="flex items-center justify-between px-1">
                                <span className={`text-[18px] font-bold ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                    {ticker ? formatPrice(ticker.lastPrice) : '--'}
                                </span>
                                <div className="text-[var(--text-tertiary)] flex items-center"><ChevronRight size={16} /></div>
                            </div>
                            <div className="text-[var(--text-secondary)] text-[11px] px-1 mt-0.5 font-medium">
                                ≈${ticker ? formatPrice(ticker.lastPrice) : '--'}
                                <span className={isPositive ? 'text-[var(--green)] ml-1' : 'text-[var(--red)] ml-1'}>
                                    {ticker ? `${parseFloat(ticker.priceChangePercent) > 0 ? '+' : ''}${parseFloat(ticker.priceChangePercent).toFixed(2)}%` : ''}
                                </span>
                            </div>
                        </div>

                        {(orderBookView === 'both' || orderBookView === 'buy') && (
                            <div className="flex flex-col flex-1 relative gap-[1px]">
                                {(() => {
                                    const maxAmount = Math.max(...aggregatedBids.slice(0, bidLimit).map(b => b.amount), 1);

                                    return aggregatedBids.slice(0, bidLimit).map((bid: any, i: number) => (
                                        <div key={`bid-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => setPriceInput(formatInput(bid.price.toFixed(precisionDecimals)))}>
                                            <div className="absolute right-0 top-0 h-full bg-[var(--green-bg)] transition-all duration-300" style={{ width: `${(bid.amount / maxAmount) * 100}%` }} />
                                            <span className="text-[var(--green)] font-medium relative z-10 text-[12px] tracking-tight">
                                                {formatPrice(bid.price, pricePrecision)}
                                            </span>
                                            <span className="text-[var(--text-secondary)] relative z-10 text-[12px] font-medium tracking-tight">
                                                {bid.amount >= 1 ? bid.amount.toFixed(2) : bid.amount.toFixed(5)}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        {(() => {
                            let buyRatio = 50;
                            const topBids = orderBook.bids.slice(0, 20);
                            const topAsks = orderBook.asks.slice(0, 20);

                            if (topBids.length > 0 && topAsks.length > 0) {
                                const totalBids = topBids.reduce((acc, curr: any) => acc + curr.amount, 0);
                                const totalAsks = topAsks.reduce((acc, curr: any) => acc + curr.amount, 0);
                                const total = totalBids + totalAsks;
                                if (total > 0) buyRatio = (totalBids / total) * 100;
                            }
                            const buyDisplay = Math.round(buyRatio);
                            const sellDisplay = 100 - buyDisplay;

                            return (
                                <div className="flex mt-2 mb-3 h-[24px] text-[12px] px-1 w-full gap-[2px]">
                                    <div className="bg-[var(--green-bg)] text-[var(--green)] h-full flex items-center px-1 font-medium relative transition-all duration-300" style={{ width: `${buyRatio}%`, clipPath: 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)', borderRadius: '4px 0 0 4px' }}>
                                        <span className="border border-[var(--green)] rounded-[3px] px-[4px] mr-1 bg-transparent text-[13px] font-medium leading-tight pb-[1px]">B</span> {buyDisplay}%
                                    </div>
                                    <div className="bg-[var(--red-bg)] text-[var(--red)] h-full flex items-center justify-end px-1.5 font-medium relative pr-[26px] transition-all duration-300" style={{ width: `${100 - buyRatio}%`, clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%)', borderRadius: '0 4px 4px 0' }}>
                                        {sellDisplay}%
                                        <span className="border border-[var(--red)] rounded-[3px] px-[4px] ml-1 bg-transparent text-[13px] font-medium leading-tight pb-[1px] absolute right-1">S</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex items-center gap-1.5 px-1">
                            <div
                                className="flex-1 flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 h-[26px] rounded-[6px] text-[13px] font-semibold text-[var(--text-secondary)] cursor-pointer"
                                onClick={() => setIsPrecisionSheetOpen(true)}
                            >
                                {precision} <div className="text-[var(--text-tertiary)]"><ArrowDropDown size={24} /></div>
                            </div>
                            <div
                                className="w-[26px] h-[26px] shrink-0 flex flex-col items-center justify-center gap-[4px] border border-[var(--border-color)] rounded-[6px] bg-[var(--bg-secondary)] cursor-pointer"
                                onClick={cycleOrderBookView}
                            >
                                {orderBookView === 'both' && (
                                    <><div className="w-[14px] h-[5px] bg-[var(--red)]" /><div className="w-[14px] h-[5px] bg-[var(--green)]" /></>
                                )}
                                {orderBookView === 'buy' && (
                                    <><div className="w-[14px] h-[5px] bg-[var(--green)]" /><div className="w-[14px] h-[5px] bg-[var(--green)]" /></>
                                )}
                                {orderBookView === 'sell' && (
                                    <><div className="w-[14px] h-[5px] bg-[var(--red)]" /><div className="w-[14px] h-[5px] bg-[var(--red)]" /></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders/Positions Tabs */}
                <div className="border-b border-[var(--border-color)] px-4 flex items-center gap-3 overflow-x-auto no-scrollbar sticky top-[52px] z-20 bg-[var(--bg-primary)] h-[48px]">
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'orders' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <span className="text-[15px]">
                            Orders ({
                                openOrders.filter(o => !isCurrentSymbolChecked || o.symbol === currentSymbol).length +
                                spotTPSL.filter(s => !isCurrentSymbolChecked || s.symbol === currentSymbol.replace('USDT', '')).length +
                                positions.filter(p => (!isCurrentSymbolChecked || p.symbol === currentSymbol) && (p.tpPrice || p.slPrice)).length
                            })
                        </span>
                        <div className="text-[var(--text-tertiary)]"><ArrowDropDown size={20} /></div>
                    </div>
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'positions' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
                        onClick={() => setActiveTab('positions')}
                    >
                        <span className="text-[15px]">
                            Positions ({
                                positions.filter(p => !isCurrentSymbolChecked || p.symbol === currentSymbol).length +
                                Object.entries(wallets?.spot || {})
                                    .filter(([symbol, amount]) => {
                                        if (amount <= 0) return false;
                                        if (isCurrentSymbolChecked && symbol !== currentSymbol.replace('USDT', '')) return false;

                                        const hasCost = spotCostBasis?.[symbol] && spotCostBasis[symbol] > 0;
                                        return !!hasCost;
                                    }).length
                            })
                        </span>
                        <div className="text-[var(--text-tertiary)]"><ArrowDropDown size={20} /></div>
                    </div>
                    <div
                        className={`flex items-center h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'bots' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
                        onClick={() => setActiveTab('bots')}
                    >
                        <span className="text-[15px]">Bots (0)</span>
                    </div>
                    <span className="font-semibold text-[15px] text-[var(--text-secondary)] flex items-center h-full shrink-0">Bots (0)</span>
                    <div className="ml-auto sticky right-0 bg-[var(--bg-primary)] pl-2 flex items-center h-full shrink-0">
                        <div className="text-[var(--text-primary)] flex items-center"><FileText size={20} /></div>
                    </div>
                </div>

                {/* Symbol filter & Cancel buttons */}
                <div className="px-4 py-2.5 flex items-center justify-between relative z-10 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCurrentSymbolChecked(!isCurrentSymbolChecked)}>
                        <div className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-[1.5px] transition-colors ${isCurrentSymbolChecked ? 'border-gray-900 bg-gray-900' : 'border-[var(--border-strong)] bg-[var(--bg-primary)]'}`}>
                            {isCurrentSymbolChecked && <div className="text-white flex items-center"><Check size={12} /></div>}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">Current symbol</span>
                    </label>
                    <button className="bg-[var(--input-bg)] text-[#cccccc] text-[12px] font-semibold px-3 py-1.5 rounded-full cursor-not-allowed" disabled>
                        Cancel all
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-screen relative z-0 bg-[var(--bg-primary)]">                    {activeTab === 'orders' && (
                        <div className="flex flex-col">
                            {/* Spot Limit Orders */}
                            {openOrders
                                .filter(order => !isCurrentSymbolChecked || order.symbol === currentSymbol)
                                .map((order) => (
                                    <div key={order.id} className="p-4 border-b border-[var(--border-color)]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{order.symbol.replace('USDT', '/USDT')}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer" onClick={() => (useExchangeStore.getState() as any).cancelSpotOrder(order.id)}>Cancel</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-4">
                                            <span className="bg-[var(--green-bg)] text-[var(--green)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{order.type}</span>
                                            <span className={`${order.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{order.side}</span>
                                            <span className="text-[11px] text-[var(--text-tertiary)] font-medium ml-1">Limit Order</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <div>
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">Amount ({order.symbol.replace('USDT', '')})</p>
                                                <p className="text-[15px] font-bold text-[var(--text-primary)]">{order.amount}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Filled (%)</p>
                                                <p className="text-[15px] font-bold text-[var(--text-primary)]">{order.filled}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Price</p>
                                                <p className="text-[15px] font-bold text-[var(--text-primary)]">{formatPrice(order.price)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Spot TP/SL */}
                            {spotTPSL
                                .filter(s => !isCurrentSymbolChecked || s.symbol === currentSymbol.replace('USDT', ''))
                                .map(s => (
                                    <div key={`tpsl-spot-${s.symbol}`} className="p-4 border-b border-[var(--border-color)]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{s.symbol}/USDT</h4>
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer" onClick={() => (useExchangeStore.getState() as any).setSpotTPSL(s.symbol, null, null, 0)}>Cancel</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-4">
                                            <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">TPSL</span>
                                            <span className="bg-[var(--red-bg)] text-[var(--red)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Sell</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium">TP Trigger</p>
                                                <p className="text-[15px] font-bold text-[var(--green)]">{s.tpPrice || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium">SL Trigger</p>
                                                <p className="text-[15px] font-bold text-[var(--red)]">{s.slPrice || '--'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-[var(--text-tertiary)] font-medium">Amount</p>
                                                <p className="text-[15px] font-bold">{s.amount}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Empty state if nothing */}
                            {(openOrders.filter(o => !isCurrentSymbolChecked || o.symbol === currentSymbol).length === 0 &&
                                spotTPSL.filter(s => !isCurrentSymbolChecked || s.symbol === currentSymbol.replace('USDT', '')).length === 0) && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                    <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center relative mb-6">
                                        <div className="absolute -left-1 bottom-4 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                        <div className="absolute -left-1 bottom-9 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                        <div className="w-14 h-14 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-primary)] shadow-sm z-10">
                                            <span className="text-[var(--text-tertiary)] text-2xl font-light">!</span>
                                        </div>
                                    </div>
                                    <span className="text-[16px] text-[var(--text-tertiary)] font-medium">No open orders</span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'positions' && (
                        <div className="flex flex-col">
                            {Object.entries(wallets?.spot || {})
                                .filter(([symbol, amount]) => {
                                    if (amount <= 0) return false;
                                    if (isCurrentSymbolChecked && symbol !== currentSymbol.replace('USDT', '')) return false;
                                    const hasCost = spotCostBasis?.[symbol] && spotCostBasis[symbol] > 0;
                                    return !!hasCost;
                                })
                                .map(([symbol, amount]) => {
                                    const balanceStr = amount.toString();
                                    const costPrice = spotCostBasis?.[symbol] || 0;
                                    const lastPrice = ticker?.lastPrice ? parseFloat(ticker.lastPrice) : costPrice;
                                    const value = amount * lastPrice;
                                    const pnl = (lastPrice - costPrice) * amount;
                                    const pnlPercent = costPrice > 0 ? (pnl / (costPrice * amount)) * 100 : 0;

                                    return (
                                        <AssetPositionCard
                                            key={symbol}
                                            symbol={symbol}
                                            amount={amount}
                                            lastPrice={lastPrice}
                                        />
                                    );
                                })}
                            {Object.entries(wallets?.spot || {}).filter(([symbol, amount]) => {
                                if (amount <= 0) return false;
                                if (isCurrentSymbolChecked && symbol !== currentSymbol.replace('USDT', '')) return false;
                                const hasCost = spotCostBasis?.[symbol] && spotCostBasis[symbol] > 0;
                                return !!hasCost;
                            }).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                    <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center relative mb-6">
                                        <div className="w-14 h-14 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-primary)] shadow-sm z-10">
                                            <span className="text-[var(--text-tertiary)] text-2xl font-light">!</span>
                                        </div>
                                    </div>
                                    <span className="text-[16px] text-[var(--text-tertiary)] font-medium">No open positions</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mini Chart Drawer */}
                <div className={`fixed w-full max-w-md bg-[var(--bg-primary)] transition-all duration-300 border-t border-[var(--border-color)] z-40 ${isMiniChartOpen ? 'h-[280px] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]' : 'h-[44px]'}`} style={{ bottom: 'calc(65px + var(--safe-area-bottom))' }}>
                    <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer"
                        onClick={() => setIsMiniChartOpen(!isMiniChartOpen)}
                    >
                        <span className="text-[14px] font-bold text-[var(--text-primary)]">{currentSymbol.replace('USDT', '/USDT')} chart</span>
                        <div className={`text-[var(--text-secondary)] transition-transform flex items-center ${isMiniChartOpen ? '' : 'rotate-180'}`}><ChevronDown size={20} /></div>
                    </div>
                    {isMiniChartOpen && (
                        <div className="px-4 pb-2 animate-in fade-in">
                            <div className="flex items-center gap-4 text-[13px] font-semibold text-[var(--text-secondary)] mb-2 border-b border-[var(--border-color)] pb-2">
                                <span>5m</span><span>15m</span>
                                <span className="text-[var(--text-primary)] font-bold border-b-2 border-gray-900 pb-2 -mb-2">1h</span>
                                <span>4h</span>
                                <span>More <div className="inline-flex items-center"><ArrowDropDown size={28} /></div></span>
                            </div>
                            <div className="h-[200px] w-full relative bg-[var(--bg-primary)]">
                                <div className="absolute top-2 left-0 z-10 opacity-[0.03] pointer-events-none w-full h-full flex justify-center items-center">
                                    <h1 className="text-[100px] font-black text-[var(--text-primary)]">OKX</h1>
                                </div>
                                <RealChart data={klines} height={200} pricePrecision={pricePrecision} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 w-full max-w-md bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex items-center justify-between px-6 py-2 z-50 h-[65px]">
                    <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] opacity-60 w-12 cursor-pointer">
                        <div className="text-[var(--text-tertiary)]"><LayoutGrid size={22} /></div>
                        <span className="text-[10px] font-medium">OKX</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] w-12 cursor-pointer">
                        <div className="text-[var(--text-tertiary)]"><BarChart2 size={22} /></div>
                        <span className="text-[10px] font-medium">Markets</span>
                    </div>
                    <div className="relative -top-5 bg-[var(--bg-primary)] rounded-full p-[3px]">
                        <div className="bg-[#111] text-white w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold shadow-md cursor-pointer">
                            <div className="flex flex-col -space-y-1 items-center justify-center">
                                <div className="rotate-180"><ChevronDown size={20} /></div>
                                <ChevronDown size={20} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--text-primary)] absolute -bottom-4 left-1/2 transform -translate-x-1/2">Trade</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] w-12 cursor-pointer">
                        <div className="text-[var(--text-tertiary)]"><Compass size={22} /></div>
                        <span className="text-[10px] font-medium">Explore</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] w-12 cursor-pointer">
                        <div className="text-[var(--text-tertiary)]"><PieChart size={22} /></div>
                        <span className="text-[10px] font-medium">Assets</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
