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
import { formatPrice } from '../utils/format';

const baseUrl = 'https://api.binance.com';
const prefix = '/api/v3'; // Or '/fapi/v1' for futures
const currentSymbol = 'BTCUSDT';
const activeInterval = '1h';


export default function SpotTradeView() {
    const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
    const [ticker, setTicker] = useState<any>(null);
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
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
    const [klines, setKlines] = useState<any[]>([]);

    const MAX_BTC = 0.0554000;

    const currentPriceNum = parseFloat(priceInput) || 0;

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
        const fetchTicker = async () => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/ticker/24hr?symbol=${currentSymbol}`);
                const data = await res.json();
                setTicker(data);
                if (priceInput === '') { // Changed from '0' to '' for initial state
                    setPriceInput(data.lastPrice);
                }
            } catch (err) { }
        };

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

        const fetchOrderBook = async () => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/depth?symbol=${currentSymbol}&limit=1000`);
                const data = await res.json();
                setOrderBook({
                    bids: data.bids.map((b: any) => ({ price: parseFloat(b[0]), amount: parseFloat(b[1]) })),
                    asks: data.asks.map((a: any) => ({ price: parseFloat(a[0]), amount: parseFloat(a[1]) })).reverse()
                });
            } catch (err) { }
        };

        const fetchExchangeInfo = async () => {
            try {
                const res = await fetch(`${baseUrl}${prefix === '/api/v3' ? '/api/v3' : '/fapi/v1'}/exchangeInfo?symbol=${currentSymbol}`);
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
        fetchTicker();
        fetchKlines(activeInterval);
        fetchOrderBook();

        const interval = setInterval(() => {
            fetchTicker();
            fetchOrderBook();
        }, 2000);

        return () => clearInterval(interval);
    }, []);



    const handleTradeSideSwitch = (side: 'buy' | 'sell') => {
        setTradeSide(side);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAmountInput(val);
        if (val && !isNaN(parseFloat(val))) {
            const pct = Math.min(100, Math.max(0, (parseFloat(val) / MAX_BTC) * 100));
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
            setAmountInput((MAX_BTC * (pct / 100)).toFixed(8));
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

    const totalUsdt = amountInput && !isNaN(parseFloat(amountInput))
        ? (parseFloat(amountInput) * currentPriceNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

    const halfListCount = isTpSlEnabled ? 9 : 7;
    const fullListCount = isTpSlEnabled ? 18 : 14;
    const askLimit = orderBookView === 'sell' ? fullListCount : halfListCount;
    const bidLimit = orderBookView === 'buy' ? fullListCount : halfListCount;

    return (
        <div className="flex justify-center bg-gray-100 min-h-screen" style={{ fontFamily: "'OKX Sans', sans-serif" }}>
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

            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-[120px] flex flex-col mx-auto overflow-x-hidden">

                {/* Top Header Tabs */}
                <div className="px-4 pt-4 pb-2 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5 text-[15px]">
                            <span className="font-bold text-gray-900 border-b-2 border-gray-900 pb-1">Spot</span>
                            <span className="font-semibold text-gray-400 pb-1">Futures</span>
                            <span className="font-semibold text-gray-400 pb-1">Bots</span>
                            <span className="font-semibold text-gray-400 pb-1">Convert</span>
                        </div>
                        <div className="text-gray-800"><AlignRight size={20} /></div>
                    </div>
                </div>

                {/* Symbol Header */}
                <div className="px-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-30 h-[52px]">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-bold text-gray-900 leading-none">BTC/USDT</h1>
                        <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-1.5 py-[1px] rounded-[4px] leading-none mt-0.5">10x</span>
                        <div className="text-gray-500 mt-0.5"><ArrowDropDown size={24} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-gray-800 cursor-pointer"><Activity size={20} /></div>
                        <div className="text-gray-800"><MoreHorizontal size={20} /></div>
                    </div>
                </div>

                <div className="flex">
                    {/* Left Panel: Trade Inputs */}
                    <div className="w-[58%] p-3 pr-2 border-r border-gray-50 flex flex-col">
                        <div className="flex rounded-[8px] bg-gray-100 p-[3px] mb-4">
                            <button
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${tradeSide === 'buy' ? 'bg-[#20b26c] text-white shadow-sm' : 'text-gray-500'}`}
                                onClick={() => handleTradeSideSwitch('buy')}
                            >
                                Buy
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${tradeSide === 'sell' ? 'bg-[#ef454a] text-white shadow-sm' : 'text-gray-500'}`}
                                onClick={() => handleTradeSideSwitch('sell')}
                            >
                                Sell
                            </button>
                        </div>

                        <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-3 flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200">
                            <span className="font-semibold text-[14px] text-gray-800 flex items-center gap-1.5">
                                Limit order <div className="text-gray-900"><Check size={20} /></div>
                            </span>
                            <div className="text-gray-600 flex items-center"><ArrowDropDown size={28} /></div>
                        </div>

                        <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-3 flex flex-col justify-center border border-transparent focus-within:border-gray-300 transition-colors">
                            <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Price (USDT)</span>
                            <input
                                type="text"
                                className="bg-transparent font-semibold text-gray-900 text-[15px] outline-none w-full p-0 leading-none"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                            />
                        </div>

                        <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-3 flex flex-col justify-center border border-transparent focus-within:border-gray-300 transition-colors relative cursor-text">
                            {amountInput ? (
                                <div className="flex flex-col w-full z-10">
                                    <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Amount (BTC)</span>
                                    <input
                                        type="text"
                                        className="bg-transparent font-semibold text-gray-900 text-[15px] outline-none w-full p-0 leading-none"
                                        value={amountInput}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-between items-center w-full relative">
                                    <span className="text-[14px] text-gray-500 font-medium">Amount</span>
                                    <span className="text-[14px] text-gray-500 font-medium">BTC</span>
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
                            <div className="absolute left-[6px] right-[6px] h-[3px] bg-gray-200">
                                <div className="h-full transition-all duration-75 bg-gray-800" style={{ width: `${sliderPercent}%` }} />
                            </div>
                            <div className="absolute left-[6px] right-[6px] flex justify-between items-center h-full z-40 pointer-events-none">
                                {[0, 25, 50, 75, 100].map(val => (
                                    <div
                                        key={val}
                                        onClick={() => updateAmountByPercent(val)}
                                        className={`w-[11px] h-[11px] rounded-full border-[2px] z-50 transition-colors duration-75 cursor-pointer pointer-events-auto bg-white ${sliderPercent >= val ? 'border-gray-800' : 'border-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <input
                                type="range" min="0" max="100" value={sliderPercent}
                                onChange={handleSliderChange}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-30 left-0"
                            />
                            <div
                                className="absolute w-[15px] h-[15px] bg-white border-[3.5px] border-gray-800 rounded-full z-60 pointer-events-none transition-all duration-75 shadow-sm"
                                style={{
                                    left: `calc(11.5px + (${sliderPercent} / 100) * (100% - 23px))`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>

                        <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-4 flex flex-col justify-center relative">
                            {totalUsdt && amountInput ? (
                                <div className="flex flex-col w-full z-10">
                                    <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Total (USDT)</span>
                                    <input
                                        type="text"
                                        className="bg-transparent font-semibold text-gray-900 text-[15px] outline-none w-full p-0 leading-none pointer-events-none"
                                        value={totalUsdt}
                                        readOnly
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-between items-center w-full pointer-events-none z-10">
                                    <span className="text-[14px] text-gray-500 font-medium">Total</span>
                                    <span className="text-[14px] text-gray-500 font-medium">USDT</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-[12px] mb-1 px-1">
                            <span className="text-gray-400 font-medium">Available</span>
                            <span className="font-semibold text-gray-700">{availableValue}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px] mb-4 px-1">
                            <span className="text-gray-400 font-medium">Max {tradeSide}</span>
                            <span className="font-semibold text-gray-700">{maxBuySellValue}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3 px-1 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}>
                                <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center border-2 ${isTpSlEnabled ? 'border-gray-900 bg-white' : 'border-gray-400'}`}>
                                    {isTpSlEnabled && <div className="text-gray-900 flex items-center"><Check size={12} /></div>}
                                </div>
                                <span className="text-[13px] font-medium text-gray-600 border-b border-dashed border-gray-400 leading-none pb-[1px]">TP/SL</span>
                            </label>
                        </div>

                        {isTpSlEnabled && (
                            <div className="animate-in fade-in duration-300">
                                <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-2 flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-gray-500">TP trigger price</span>
                                    <span className="text-[13px] font-semibold text-gray-800">USDT</span>
                                </div>
                                <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-4 flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-gray-500">SL trigger price</span>
                                    <span className="text-[13px] font-semibold text-gray-800">USDT</span>
                                </div>
                            </div>
                        )}

                        <button className={`w-full py-3 rounded-xl font-bold text-white text-[16px] mt-auto shadow-sm ${tradeSide === 'buy' ? 'bg-[#20b26c]' : 'bg-[#ef454a]'}`}>
                            {tradeSide === 'buy' ? 'Buy BTC' : 'Sell BTC'}
                        </button>
                    </div>

                    {/* Right Panel: Order Book */}
                    <div className="w-[42%] p-3 pl-2 flex flex-col text-[11px]">
                        <div className="flex items-center justify-end gap-2 mb-3">
                            <span className="text-gray-800 text-[13px] font-medium">Margin</span>
                            <div
                                className={`w-[34px] h-[18px] rounded-full flex items-center p-[2px] cursor-pointer ${isMarginEnabled ? 'bg-[#20b26c] justify-end' : 'bg-gray-300 justify-start'}`}
                                onClick={() => setIsMarginEnabled(!isMarginEnabled)}
                            >
                                <div className="w-[14px] h-[14px] bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="flex justify-between text-gray-400 mb-1.5 text-[11px] font-medium px-1">
                            <span>Price<br />(USDT)</span>
                            <span className="text-right">Amount<br />(BTC)</span>
                        </div>

                        {(orderBookView === 'both' || orderBookView === 'sell') && (
                            <div className="flex flex-col flex-1 justify-end relative gap-[1px]">
                                {(() => {
                                    let totalAsks = 0;
                                    const asksWithDepth = [...aggregatedAsks].reverse().map(ask => {
                                        totalAsks += ask.amount;
                                        return { ...ask, depth: totalAsks };
                                    }).reverse();
                                    const maxDAsks = totalAsks > 0 ? totalAsks : 1;

                                    return asksWithDepth.slice(-askLimit).map((ask: any, i: number) => (
                                        <div key={`ask-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-slate-50" onClick={() => setPriceInput(ask.price.toString())}>
                                            <div className="absolute right-0 top-0 h-full bg-[#ffecec] transition-all duration-300" style={{ width: `${(ask.depth / maxDAsks) * 100}%` }} />
                                            <span className="text-[#ef454a] font-medium relative z-10 text-[12px] tracking-tight">
                                                {ask.price.toLocaleString('en-US', { minimumFractionDigits: precisionDecimals, maximumFractionDigits: precisionDecimals })}
                                            </span>
                                            <span className="text-gray-700 relative z-10 text-[12px] font-medium tracking-tight">
                                                {ask.amount >= 1 ? ask.amount.toFixed(2) : ask.amount.toFixed(5)}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        <div className="py-2 my-0.5 relative group">
                            <div className="flex items-center justify-between px-1">
                                <span className={`text-[18px] font-bold ${isPositive ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>
                                    {ticker ? formatPrice(ticker.lastPrice) : '--'}
                                </span>
                                <div className="text-gray-400 flex items-center"><ChevronRight size={16} /></div>
                            </div>
                            <div className="text-gray-500 text-[11px] px-1 mt-0.5 font-medium">
                                ≈${ticker ? formatPrice(ticker.lastPrice) : '--'}
                                <span className={isPositive ? 'text-[#20b26c] ml-1' : 'text-[#ef454a] ml-1'}>
                                    {ticker ? `${parseFloat(ticker.priceChangePercent) > 0 ? '+' : ''}${parseFloat(ticker.priceChangePercent).toFixed(2)}%` : ''}
                                </span>
                            </div>
                        </div>

                        {(orderBookView === 'both' || orderBookView === 'buy') && (
                            <div className="flex flex-col flex-1 relative gap-[1px]">
                                {(() => {
                                    let totalBids = 0;
                                    const bidsWithDepth = aggregatedBids.map(bid => {
                                        totalBids += bid.amount;
                                        return { ...bid, depth: totalBids };
                                    });
                                    const maxDBids = totalBids > 0 ? totalBids : 1;

                                    return bidsWithDepth.slice(0, bidLimit).map((bid: any, i: number) => (
                                        <div key={`bid-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-slate-50" onClick={() => setPriceInput(bid.price.toString())}>
                                            <div className="absolute right-0 top-0 h-full bg-[#e5f7ed] transition-all duration-300" style={{ width: `${(bid.depth / maxDBids) * 100}%` }} />
                                            <span className="text-[#20b26c] font-medium relative z-10 text-[12px] tracking-tight">
                                                {bid.price.toLocaleString('en-US', { minimumFractionDigits: precisionDecimals, maximumFractionDigits: precisionDecimals })}
                                            </span>
                                            <span className="text-gray-700 relative z-10 text-[12px] font-medium tracking-tight">
                                                {bid.amount >= 1 ? bid.amount.toFixed(2) : bid.amount.toFixed(5)}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        {(() => {
                            let buyRatio = 50;
                            if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
                                const totalBids = orderBook.bids.reduce((acc, curr: any) => acc + curr.amount, 0);
                                const totalAsks = orderBook.asks.reduce((acc, curr: any) => acc + curr.amount, 0);
                                const total = totalBids + totalAsks;
                                if (total > 0) buyRatio = (totalBids / total) * 100;
                            }
                            const buyDisplay = Math.round(buyRatio);
                            const sellDisplay = 100 - buyDisplay;

                            return (
                                <div className="flex mt-2 mb-3 h-[24px] text-[13px] px-1 w-full gap-[2px]">
                                    <div className="bg-[#e5f7ed] text-[#20b26c] h-full flex items-center px-1 font-medium relative transition-all duration-300" style={{ width: `${buyRatio}%`, clipPath: 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)', borderRadius: '4px 0 0 4px' }}>
                                        <span className="border border-[#20b26c] rounded-[3px] px-[4px] mr-1.5 bg-transparent text-[11px] leading-tight pb-[1px]">B</span> {buyDisplay}%
                                    </div>
                                    <div className="bg-[#ffecec] text-[#ef454a] h-full flex items-center justify-end px-1.5 font-medium relative pr-[26px] transition-all duration-300" style={{ width: `${100 - buyRatio}%`, clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%)', borderRadius: '0 4px 4px 0' }}>
                                        {sellDisplay}%
                                        <span className="border border-[#ef454a] rounded-[3px] px-[4px] ml-1.5 bg-transparent text-[11px] leading-tight pb-[1px] absolute right-1">S</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex items-center gap-1.5 px-1">
                            <div
                                className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-100 px-2 h-[26px] rounded-[6px] text-[13px] font-semibold text-gray-600 cursor-pointer"
                                onClick={() => setIsPrecisionSheetOpen(true)}
                            >
                                {precision} <div className="text-gray-400"><ArrowDropDown size={24} /></div>
                            </div>
                            <div
                                className="w-[26px] h-[26px] shrink-0 flex flex-col items-center justify-center gap-[4px] border border-gray-100 rounded-[6px] bg-gray-50 cursor-pointer"
                                onClick={cycleOrderBookView}
                            >
                                {orderBookView === 'both' && (
                                    <><div className="w-[14px] h-[5px] bg-[#ef454a]" /><div className="w-[14px] h-[5px] bg-[#20b26c]" /></>
                                )}
                                {orderBookView === 'buy' && (
                                    <><div className="w-[14px] h-[5px] bg-[#20b26c]" /><div className="w-[14px] h-[5px] bg-[#20b26c]" /></>
                                )}
                                {orderBookView === 'sell' && (
                                    <><div className="w-[14px] h-[5px] bg-[#ef454a]" /><div className="w-[14px] h-[5px] bg-[#ef454a]" /></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders/Positions Tabs */}
                <div className="border-b border-gray-100 px-4 flex items-center gap-3 overflow-x-auto no-scrollbar sticky top-[52px] z-20 bg-white h-[48px]">
                    <span className="font-bold text-[15px] text-gray-900 flex items-center gap-1 h-full shrink-0">Orders (0) <div className="text-gray-400"><ArrowDropDown size={20} /></div></span>
                    <span className="font-semibold text-[15px] text-gray-500 flex items-center gap-1 h-full shrink-0">Positions (0) & assets <div className="text-gray-400"><ArrowDropDown size={20} /></div></span>
                    <span className="font-semibold text-[15px] text-gray-500 flex items-center h-full shrink-0">Bots (0)</span>
                    <div className="ml-auto sticky right-0 bg-white pl-2 flex items-center h-full shrink-0">
                        <div className="text-gray-800 flex items-center"><FileText size={20} /></div>
                    </div>
                </div>

                {/* Symbol filter & Cancel buttons */}
                <div className="px-4 py-2.5 flex items-center justify-between relative z-10 bg-white border-b border-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCurrentSymbolChecked(!isCurrentSymbolChecked)}>
                        <div className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-[1.5px] transition-colors ${isCurrentSymbolChecked ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'}`}>
                            {isCurrentSymbolChecked && <div className="text-white flex items-center"><Check size={12} /></div>}
                        </div>
                        <span className="text-[13px] font-medium text-gray-800">Current symbol</span>
                    </label>
                    <button className="bg-[#f5f5f5] text-[#cccccc] text-[12px] font-semibold px-3 py-1.5 rounded-full cursor-not-allowed" disabled>
                        Cancel all
                    </button>
                </div>

                {/* Empty state placeholder */}
                <div className="flex justify-center py-10 relative z-10 bg-white flex-1 min-h-[300px]">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center relative mt-6">
                        <div className="absolute -left-1 bottom-4 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                        <div className="absolute -left-1 bottom-9 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                        <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm z-10">
                            <span className="text-gray-300 text-2xl font-light">!</span>
                        </div>
                        <div className="absolute right-0 top-0 w-2.5 h-2.5 border-[1.5px] border-gray-400 rotate-45" />
                    </div>
                </div>

                {/* Mini Chart Drawer */}
                <div className={`fixed bottom-[65px] w-full max-w-md bg-white transition-all duration-300 border-t border-gray-100 z-40 ${isMiniChartOpen ? 'h-[280px] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]' : 'h-[44px]'}`}>
                    <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer"
                        onClick={() => setIsMiniChartOpen(!isMiniChartOpen)}
                    >
                        <span className="text-[14px] font-bold text-gray-900">BTC/USDT chart</span>
                        <div className={`text-gray-500 transition-transform flex items-center ${isMiniChartOpen ? '' : 'rotate-180'}`}><ChevronDown size={20} /></div>
                    </div>
                    {isMiniChartOpen && (
                        <div className="px-4 pb-2 animate-in fade-in">
                            <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-500 mb-2 border-b border-gray-100 pb-2">
                                <span>5m</span><span>15m</span>
                                <span className="text-gray-900 font-bold border-b-2 border-gray-900 pb-2 -mb-2">1h</span>
                                <span>4h</span>
                                <span>More <div className="inline-flex items-center"><ArrowDropDown size={28} /></div></span>
                            </div>
                            <div className="h-[200px] w-full relative bg-white">
                                <div className="absolute top-2 left-0 z-10 opacity-[0.03] pointer-events-none w-full h-full flex justify-center items-center">
                                    <h1 className="text-[100px] font-black text-gray-900">OKX</h1>
                                </div>
                                {renderSvgChart(200)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex items-center justify-between px-6 py-2 z-50 h-[65px]">
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400 opacity-60 w-12 cursor-pointer">
                        <div className="text-gray-400"><LayoutGrid size={22} /></div>
                        <span className="text-[10px] font-medium">OKX</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400 w-12 cursor-pointer">
                        <div className="text-gray-400"><BarChart2 size={22} /></div>
                        <span className="text-[10px] font-medium">Markets</span>
                    </div>
                    <div className="relative -top-5 bg-white rounded-full p-[3px]">
                        <div className="bg-[#111] text-white w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold shadow-md cursor-pointer">
                            <div className="flex flex-col -space-y-1 items-center justify-center">
                                <div className="rotate-180"><ChevronDown size={20} /></div>
                                <ChevronDown size={20} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-900 absolute -bottom-4 left-1/2 transform -translate-x-1/2">Trade</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400 w-12 cursor-pointer">
                        <div className="text-gray-400"><Compass size={22} /></div>
                        <span className="text-[10px] font-medium">Explore</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400 w-12 cursor-pointer">
                        <div className="text-gray-400"><PieChart size={22} /></div>
                        <span className="text-[10px] font-medium">Assets</span>
                    </div>
                </div>
            </div>
        </div >
    );
}
