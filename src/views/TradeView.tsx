// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    FiCheck as Check,
    FiInfo as Info,
    FiChevronRight as ChevronRight,
} from 'react-icons/fi';
import { GrDocumentTime as History } from 'react-icons/gr';
import { LuCirclePlus, LuChevronUp, LuChevronDown as PairChevronDown } from 'react-icons/lu';
import {
    MdOutlineArrowDropDown as ArrowDropDown,
    MdOutlineArrowDropUp as ArrowDropUp,
    MdOutlineCandlestickChart as CandlestickChart
} from 'react-icons/md';
import { RiPlayListAddFill as MoreHorizontal } from 'react-icons/ri';
import { PiDotsSixBold as AlignRight } from 'react-icons/pi';
import { IoClose as XIcon, IoShareOutline as FiShare2 } from 'react-icons/io5';
import { FiEdit2, FiUpload as FiUploadLine } from 'react-icons/fi';
import { formatCurrency, getCurrencySymbol, formatPrice } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import useExchangeStore from '../stores/useExchangeStore';
import SuccessDialog from '../components/SuccessDialog';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import LeverageBottomSheet from '../components/LeverageBottomSheet';
const RealChart = React.lazy(() => import('../components/RealChart'));
import trivLogo from '../assets/triv-logo.svg';

const TradeView = () => {
    const {
        setActivePage, wallets, markets, openOrders, positions,
        spotCostBasis, placeSpotOrder, cancelSpotOrder, placeFuturesOrder,
        closeFuturesPosition, showOrderConfirmation, setShowOrderConfirmation,
        closeAll, tradeType, setTradeType, selectedCoin, setSearchOpen
    } = useExchangeStore();

    const currentSymbol = selectedCoin || 'BTCUSDT';
    const baseCoin = currentSymbol.replace('USDT', '');
    const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
    const [ticker, setTicker] = useState<any>(null);
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
    const [priceInput, setPriceInput] = useState('0');
    const [amountInput, setAmountInput] = useState('');
    const [sliderPercent, setSliderPercent] = useState(0);
    const [isMarginEnabled, setIsMarginEnabled] = useState(false);
    const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
    const [isCurrentSymbolChecked, setIsCurrentSymbolChecked] = useState(false);
    const [orderBookView, setOrderBookView] = useState<'both' | 'buy' | 'sell'>('both');
    const [isMiniChartOpen, setIsMiniChartOpen] = useState(false);
    const [klines, setKlines] = useState<any[]>([]);
    const [precision, setPrecision] = useState(0.1);
    const [tickSize, setTickSize] = useState<number | null>(null);
    const [isPrecisionSheetOpen, setIsPrecisionSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'positions' | 'bots'>('orders');
    const [assetFilter, setAssetFilter] = useState<'All' | 'Positions' | 'Assets'>('All');
    const [isAssetFilterSheetOpen, setIsAssetFilterSheetOpen] = useState(false);
    const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'TP/SL'>('Limit');
    const [isOrderTypeSheetOpen, setIsOrderTypeSheetOpen] = useState(false);

    const [activeTopTab, setActiveTopTab] = useState<'Spot' | 'Futures' | 'Bots' | 'Convert'>('Spot');
    const [isReduceOnly, setIsReduceOnly] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(8430);
    // Order Confirmation Modal State
    const [isCloseAllConfirmOpen, setIsCloseAllConfirmOpen] = useState(false);

    // Futures Specific State
    const [marginMode, setMarginMode] = useState<'Isolated' | 'Cross'>('Isolated');
    const [leverage, setLeverage] = useState(50);
    const [isMarginModeSheetOpen, setIsMarginModeSheetOpen] = useState(false);
    const [isLeverageSheetOpen, setIsLeverageSheetOpen] = useState(false);
    const [activeInterval, setActiveInterval] = useState('1h');
    const [isPriceFocused, setIsPriceFocused] = useState(false);
    const priceInputRef = useRef(priceInput);

    // Keep ref in sync for the interval closure
    useEffect(() => {
        priceInputRef.current = priceInput;
    }, [priceInput]);

    // Order Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);

    const handleClosePosition = (posId: string, symbol: string) => {
        closeFuturesPosition(posId);
        setToastMessage({
            title: 'Position Closed',
            message: `Successfully closed ${symbol} position.`
        });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Sync local activeTopTab with store's tradeType
    useEffect(() => {
        if (tradeType === 'futures') {
            setActiveTopTab('Futures');
        } else if (tradeType === 'spot') {
            setActiveTopTab('Spot');
        }
    }, [tradeType]);


    // Get current asset for max calculation
    const currentAsset = tradeSide === 'buy' ? 'USDT' : baseCoin;
    const availableBalance = wallets?.spot?.[currentAsset] || 0;

    const MAX_BTC_SPOT = 0.0554000;
    const totalLockedMargin = (positions || []).reduce((sum, pos) => sum + pos.margin, 0);
    const availableFuturesUSDT = Math.max(0, (wallets?.futures?.USDT || 0) - totalLockedMargin);

    const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 72000;
    const maxBuySellFutures = (availableFuturesUSDT * leverage) / currentPrice;
    const currentFuturesAmount = (sliderPercent / 100) * maxBuySellFutures;
    const currentFuturesCost = (sliderPercent / 100) * availableFuturesUSDT;

    const liqPriceLong = currentPrice * (1 - 1 / leverage);
    const liqPriceShort = currentPrice * (1 + 1 / leverage);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 28800));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const baseUrl = activeTopTab === 'Futures' ? 'https://fapi.binance.com' : 'https://api.binance.com';
        const prefix = activeTopTab === 'Futures' ? '/fapi/v1' : '/api/v3';

        const fetchTicker = async () => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/ticker/24hr?symbol=${currentSymbol}`);
                const data = await res.json();
                setTicker(data);
                if (!isPriceFocused && (priceInputRef.current === '0' || priceInputRef.current === '')) {
                    setPriceInput(formatInput(parseFloat(data.lastPrice).toString()));
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
    }, [activeInterval, activeTopTab, currentSymbol]);

    // Toast auto-close is handled inline where it's set

    useEffect(() => {
        if (ticker && klines.length > 0) {
            const lastCandle = klines[klines.length - 1];
            const currentPrice = parseFloat(ticker.lastPrice);
            const updatedCandle = {
                ...lastCandle,
                close: currentPrice,
                high: Math.max(lastCandle.high, currentPrice),
                low: Math.min(lastCandle.low, currentPrice)
            };
            const newKlines = [...klines.slice(0, -1), updatedCandle];
            setKlines(newKlines);
        }
    }, [ticker]);



    useEffect(() => {
        setPriceInput('0');
        setAmountInput('');
        setSliderPercent(0);
    }, [currentSymbol, activeTopTab]);

    const handleTradeSideSwitch = (side: 'buy' | 'sell') => {
        setTradeSide(side);
        setAmountInput('');
        setSliderPercent(0);
    };

    const handleFinalConfirm = (dontShowAgain: boolean) => {
        if (dontShowAgain) {
            setShowOrderConfirmation(false);
        }

        const { p, a } = pendingOrder;

        if (activeTopTab === 'Futures') {
            placeFuturesOrder({
                symbol: currentSymbol,
                side: tradeSide === 'buy' ? 'Buy' : 'Sell',
                type: orderType === 'TP/SL' ? 'Limit' : orderType,
                price: p,
                amount: a,
                marginMode: marginMode,
                leverage: leverage
            });

            setToastMessage({
                title: 'Order Placed',
                message: `Successfully placed ${tradeSide.toUpperCase()} ${a.toFixed(4)} ${baseCoin} at ${p.toLocaleString('en-US')} USDT`
            });
            setTimeout(() => setToastMessage(null), 3000);
        } else {
            placeSpotOrder({
                symbol: currentSymbol,
                side: tradeSide === 'buy' ? 'Buy' : 'Sell',
                type: orderType === 'TP/SL' ? 'Limit' : orderType,
                price: p,
                amount: a,
                marginMode: 'Isolated',
                leverage: 10
            });
        }

        setIsConfirmModalOpen(false);
        setPendingOrder(null);
        setAmountInput('');
        setSliderPercent(0);
        setActiveTab('orders');
    };

    const handlePlaceOrder = (sideOverride?: 'buy' | 'sell') => {
        const actualSide = sideOverride || tradeSide;
        if (sideOverride && tradeSide !== sideOverride) {
            setTradeSide(actualSide);
        }

        const p = orderType === 'Market' ? (ticker ? parseFloat(ticker.lastPrice) : 0) : parseFloat(priceInput);
        const a = parseFloat(amountInput) || currentFuturesAmount;
        if (a <= 0) return;

        if (activeTopTab === 'Futures' && availableFuturesUSDT <= 0) {
            alert('Insufficient Futures Margin. Please transfer USDT to your Trading account first.');
            return;
        }

        if (showOrderConfirmation) {
            setPendingOrder({ p, a });
            setIsConfirmModalOpen(true);
        } else {
            // Direct execution if preference is set
            if (activeTopTab === 'Futures') {
                placeFuturesOrder({
                    symbol: currentSymbol,
                    side: actualSide === 'buy' ? 'Buy' : 'Sell',
                    type: orderType === 'TP/SL' ? 'Limit' : orderType,
                    price: p,
                    amount: a,
                    marginMode: marginMode,
                    leverage: leverage
                });

                setToastMessage({
                    title: 'Order Placed',
                    message: `Successfully placed ${actualSide.toUpperCase()} ${a.toFixed(4)} ${baseCoin} at ${p.toLocaleString('en-US')} USDT`
                });
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                placeSpotOrder({
                    symbol: currentSymbol,
                    side: actualSide === 'buy' ? 'Buy' : 'Sell',
                    type: orderType === 'TP/SL' ? 'Limit' : orderType,
                    price: p,
                    amount: a,
                    marginMode: 'Isolated',
                    leverage: 10
                });
            }
            setAmountInput('');
            setSliderPercent(0);
            setActiveTab('orders');
        }
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
        if (!isNaN(numVal)) {
            if (activeTopTab === 'Futures') {
                const limit = maxBuySellFutures;
                if (limit > 0) setSliderPercent(Math.min(100, (numVal / limit) * 100));
                else setSliderPercent(0);
            } else {
                if (availableBalance > 0) {
                    let maxAmount = availableBalance;
                    if (tradeSide === 'buy') {
                        const price = parseFloat(priceInput.replace(/,/g, '')) || 0;
                        maxAmount = price > 0 ? availableBalance / price : 0;
                    }
                    const pct = Math.min(100, Math.max(0, (numVal / maxAmount) * 100));
                    setSliderPercent(pct);
                } else {
                    setSliderPercent(0);
                }
            }
        } else {
            setSliderPercent(0);
        }
    };

    const updateAmountByPercent = (pct: number) => {
        setSliderPercent(pct);
        if (activeTopTab === 'Futures') {
            const limit = maxBuySellFutures;
            if (pct === 0) setAmountInput('');
            else setAmountInput(formatInput((limit * (pct / 100)).toFixed(4)));
        } else {
            if (availableBalance > 0) {
                let maxAmount = availableBalance;
                if (tradeSide === 'buy') {
                    const price = parseFloat(priceInput.replace(/,/g, '')) || 0;
                    maxAmount = price > 0 ? availableBalance / price : 0;
                }
                const val = maxAmount * (pct / 100);
                setAmountInput(pct === 0 ? '' : formatInput(val.toFixed(8)));
            }
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

    const dynamicPrecisions = useMemo(() => {
        if (tickSize && tickSize > 0) {
            // Generate precisions based on real tickSize 
            // e.g. tickSize 0.00001 -> [0.00001, 0.0001, 0.001, 0.01]
            return [
                tickSize,
                tickSize * 10,
                tickSize * 100,
                tickSize * 1000
            ].map(v => parseFloat(v.toPrecision(10))); // avoid floating point math errors
        }

        // Fallback
        const p = currentPrice || 0;
        if (p < 0.00001) return [0.00000001, 0.0000001, 0.000001, 0.00001];
        if (p < 0.001) return [0.000001, 0.00001, 0.0001, 0.001];
        if (p < 0.1) return [0.0001, 0.001, 0.01, 0.1];
        if (p < 10) return [0.001, 0.01, 0.1, 1];
        if (p < 500) return [0.01, 0.1, 1, 10];
        if (p < 5000) return [0.1, 1, 10, 100];
        return [0.1, 1, 10, 100];
    }, [currentPrice, tickSize]);

    // Auto-adjust precision when symbol changes
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

    const aggregatedAsks = aggregateOrderBook(orderBook.asks, 'sell');
    const aggregatedBids = aggregateOrderBook(orderBook.bids, 'buy');

    const isPositive = ticker ? parseFloat(ticker.priceChangePercent) >= 0 : true;
    const currentPriceNum = parseFloat(priceInput.replace(/,/g, '')) || 0;

    const displayAvailable = availableBalance === 0 ? '0' : availableBalance.toLocaleString('en-US', { minimumFractionDigits: currentAsset === 'USDT' ? 2 : 4, maximumFractionDigits: 8 });

    const maxBuySellAmount = (() => {
        if (tradeSide === 'buy') {
            return currentPriceNum > 0 ? (availableBalance / currentPriceNum) : 0;
        }
        return availableBalance;
    })();

    const maxBuySellValue = maxBuySellAmount === 0 ? '0' : maxBuySellAmount.toFixed(8);

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

    const halfListCount = activeTopTab === 'Futures'
        ? (isTpSlEnabled ? 10 : 8)
        : (isTpSlEnabled ? 8 : 6);
    const fullListCount = halfListCount * 2;
    const askLimit = orderBookView === 'sell' ? fullListCount : halfListCount;
    const bidLimit = orderBookView === 'buy' ? fullListCount : halfListCount;

    const currentAsks = aggregatedAsks.slice(0, askLimit);
    const currentBids = aggregatedBids.slice(0, bidLimit);

    const maxAskAmount = currentAsks.length > 0 ? Math.max(...currentAsks.map((a: any) => a.amount)) : 1;
    const maxBidAmount = currentBids.length > 0 ? Math.max(...currentBids.map((b: any) => b.amount)) : 1;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="flex flex-col bg-[#FDFDFD] min-h-screen relative pb-[120px]">
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
          body { font-family: 'OKX Sans', sans-serif !important; }
        `}
            </style>

            <div className="bg-[#FDFDFD] shrink-0 pt-[var(--safe-area-top)]">
                <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex gap-5 text-[18px] font-medium text-slate-400 overflow-x-auto no-scrollbar">
                        {['Spot', 'Futures', 'Bots', 'Convert'].map((t) => (
                            <span
                                key={t}
                                onClick={() => {
                                    if (t === 'Convert') {
                                        setActivePage('convert');
                                        return;
                                    }
                                    setActiveTopTab(t as any);
                                    if (t === 'Spot') setTradeType('spot');
                                    if (t === 'Futures') setTradeType('futures');
                                    setSliderPercent(0);
                                    setAmountInput('');
                                }}
                                className={`cursor-pointer whitespace-nowrap transition-all ${activeTopTab === t ? 'text-slate-900' : ''}`}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                    <MoreHorizontal size={20} className="text-slate-900" />
                </div>
            </div>

            {/* Symbol Header */}
            <div className="px-4 flex items-center justify-between border-b border-gray-100 bg-[#FDFDFD] sticky top-0 z-[100] h-[52px]" style={{ transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSearchOpen(true)}>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-none">{activeTopTab === 'Futures' ? currentSymbol : currentSymbol.replace('USDT', '/USDT')}</h1>
                    {activeTopTab === 'Futures' ? (
                        <span className="bg-[#fff7e6] text-[#faad14] border border-[#ffe58f] text-[11px] font-bold px-1.5 py-[1px] rounded-[4px] leading-none mt-0.5">Perp</span>
                    ) : (
                        <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-1.5 py-[1px] rounded-[4px] leading-none mt-0.5">10x</span>
                    )}
                    <ArrowDropDown className="w-6 h-6 text-gray-500 mt-0.5" />
                </div>
                <div className="flex items-center gap-4">
                    <CandlestickChart className="w-7 h-7 text-gray-800 cursor-pointer" onClick={() => setActivePage('chart-trade')} />
                    <AlignRight className="w-7 h-7 text-gray-800" />
                </div>
            </div>

            <div className="flex">
                {/* Left Panel: Trade Inputs */}
                <div className="w-[58%] p-3 pr-2 border-r border-gray-50 flex flex-col gap-2.5">
                    {activeTopTab === 'Futures' ? (
                        <>
                            <div className="flex gap-2">
                                <div
                                    className="flex-1 bg-[#f5f5f5] h-[32px] rounded-md flex items-center justify-between px-2 cursor-pointer"
                                    onClick={() => setIsMarginModeSheetOpen(true)}
                                >
                                    <span className="text-[13px] font-bold text-gray-800">{marginMode}</span>
                                    <ArrowDropDown className="w-7 h-7 text-gray-500" />
                                </div>
                                <div
                                    className="flex-1 bg-[#f5f5f5] h-[32px] rounded-md flex items-center justify-between px-2 cursor-pointer"
                                    onClick={() => setIsLeverageSheetOpen(true)}
                                >
                                    <span className="text-[13px] font-bold text-gray-800">{leverage}x</span>
                                    <ArrowDropDown className="w-7 h-7 text-gray-500" />
                                </div>
                            </div>
                            <div
                                className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200"
                                onClick={() => setIsOrderTypeSheetOpen(true)}
                            >
                                <span className="font-semibold text-[14px] text-gray-800 flex items-center gap-1.5">
                                    {orderType === 'Market' ? 'Market order' : orderType === 'Limit' ? 'Limit order' : 'TP/SL'} <Info className="w-3.5 h-3.5 text-gray-400" />
                                </span>
                                <ArrowDropDown className="w-7 h-7 text-gray-600" />
                            </div>

                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] flex flex-col justify-center border border-transparent focus-within:border-gray-300 transition-colors">
                                <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Price (USDT)</span>
                                {orderType === 'Market' ? (
                                    <div className="font-semibold text-gray-400 text-[15px]">Market price</div>
                                ) : (
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-gray-900 text-[15px] outline-none w-full p-0 leading-none"
                                        value={priceInput}
                                        onChange={handlePriceInputChange}
                                        onFocus={() => setIsPriceFocused(true)}
                                        onBlur={() => setIsPriceFocused(false)}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex rounded-[8px] bg-gray-100 p-[3px] mb-1.5">
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

                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-1.5 flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200" onClick={() => setIsOrderTypeSheetOpen(true)}>
                                <span className="font-semibold text-[14px] text-gray-800 flex items-center gap-1.5">
                                    {orderType === 'Market' ? 'Market order' : orderType === 'Limit' ? 'Limit order' : 'TP/SL'} <Info className="w-3.5 h-3.5 text-gray-400" />
                                </span>
                                <ArrowDropDown className="w-7 h-7 text-gray-600" />
                            </div>

                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-1.5 flex flex-col justify-center border border-transparent focus-within:border-gray-300 transition-colors">
                                <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Price (USDT)</span>
                                {orderType === 'Market' ? (
                                    <div className="font-semibold text-gray-400 text-[15px]">Market price</div>
                                ) : (
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-gray-900 text-[15px] outline-none w-full p-0 leading-none"
                                        value={priceInput}
                                        onChange={handlePriceInputChange}
                                        onFocus={() => setIsPriceFocused(true)}
                                        onBlur={() => setIsPriceFocused(false)}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-1.5 flex flex-col justify-center border border-transparent focus-within:border-gray-300 transition-colors relative cursor-text">
                        {amountInput ? (
                            <div className="flex flex-col w-full z-10">
                                <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Amount ({baseCoin})</span>
                                <input
                                    type="text"
                                    className="bg-transparent font-medium text-gray-900 text-[15px] outline-none w-full p-0 leading-none"
                                    value={amountInput}
                                    onChange={handleAmountChange}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-between items-center w-full relative">
                                <span className="text-[14px] text-gray-500 font-medium">Amount</span>
                                <span className="text-[14px] text-gray-500 font-medium">{baseCoin}</span>
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

                    {activeTopTab === 'Spot' && (
                        <>
                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-2 flex flex-col justify-center relative">
                                {totalUsdt && amountInput ? (
                                    <div className="flex flex-col w-full z-10">
                                        <span className="text-[11px] text-gray-500 font-medium leading-none mb-1">Total (USDT)</span>
                                        <input
                                            type="text"
                                            className="bg-transparent font-medium text-gray-900 text-[15px] outline-none w-full p-0 leading-none pointer-events-none"
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
                                <span className="font-medium text-gray-700 flex items-center gap-1">
                                    {displayAvailable} {currentAsset} <LuCirclePlus className="w-3.5 h-3.5 text-gray-700" />
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[12px] mb-2 px-1">
                                <span className="text-gray-400 font-medium">Max {tradeSide}</span>
                                <span className="font-medium text-gray-700">{maxBuySellValue} {baseCoin}</span>
                            </div>
                        </>
                    )}

                    {activeTopTab === 'Futures' && (
                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium px-1 mb-1">
                            <span>Available</span>
                            <span
                                className="text-gray-800 font-bold flex items-center gap-1 cursor-pointer"
                                onClick={() => setActivePage('Assets')}
                            >
                                {availableFuturesUSDT.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT <LuCirclePlus className="w-3 h-3 text-gray-700" />
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col gap-2.5 px-1 mt-1 mb-2">
                        {activeTopTab === 'Futures' && (
                            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsReduceOnly(!isReduceOnly)}>
                                <div className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-2 transition-colors ${isReduceOnly ? 'border-gray-900 bg-gray-900' : 'border-gray-400'}`}>
                                    {isReduceOnly && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                </div>
                                <span className="text-[13px] font-medium text-gray-600 border-b border-dashed border-gray-400 pb-[1px] leading-none">Reduce-only</span>
                            </label>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}>
                            <div className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-2 transition-colors ${isTpSlEnabled ? 'border-gray-900 bg-gray-900' : 'border-gray-400'}`}>
                                {isTpSlEnabled && <Check className="w-3 h-3 text-white stroke-[4]" />}
                            </div>
                            <span className="text-[13px] font-medium text-gray-600 border-b border-dashed border-gray-400 pb-[1px] leading-none">TP/SL</span>
                        </label>
                    </div>

                    {isTpSlEnabled && (
                        <div className="animate-in fade-in duration-300 pb-2">
                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-2 flex items-center justify-between">
                                <span className="text-[13px] font-medium text-gray-500">TP trigger price</span>
                                <span className="text-[13px] font-semibold text-gray-800">USDT</span>
                            </div>
                            <div className="bg-[#f5f5f5] rounded-lg px-3 h-[44px] mb-2 flex items-center justify-between">
                                <span className="text-[13px] font-medium text-gray-500">SL trigger price</span>
                                <span className="text-[13px] font-semibold text-gray-800">USDT</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2mt-auto mb-2">
                        {activeTopTab === 'Futures' ? (
                            <>
                                <div className="flex flex-col gap-1 text-[11px] px-1 mb-1.5">
                                    <div className="flex justify-between text-gray-400"><span>Max buy</span><span className="text-gray-800 font-bold">{maxBuySellFutures.toFixed(4)} {baseCoin}</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Cost</span><span className="text-gray-800 font-bold">{currentFuturesCost.toFixed(2)} USDT</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Liq. price</span><span className="text-gray-800 font-bold">{sliderPercent > 0 ? liqPriceLong.toFixed(1) : '--'}</span></div>
                                </div>
                                <button className="w-full h-[44px] rounded-full font-bold text-white bg-[#20b26c] flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-sm mb-2" onClick={() => handlePlaceOrder('buy')}>
                                    <span className="text-[14px] leading-tight">Buy (Long) {leverage}x</span>
                                    {sliderPercent > 0 && <span className="text-[10px] opacity-90 font-medium leading-tight">≈{currentFuturesAmount.toFixed(4)} {baseCoin}</span>}
                                </button>
                                <div className="flex flex-col gap-1 text-[11px] px-1 mt-1 mb-1.5">
                                    <div className="flex justify-between text-gray-400"><span>Max sell</span><span className="text-gray-800 font-bold">{maxBuySellFutures.toFixed(4)} {baseCoin}</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Cost</span><span className="text-gray-800 font-bold">{currentFuturesCost.toFixed(2)} USDT</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Liq. price</span><span className="text-gray-800 font-bold">{sliderPercent > 0 ? liqPriceShort.toFixed(1) : '--'}</span></div>
                                </div>
                                <button className="w-full h-[44px] rounded-full font-bold text-white bg-[#ef454a] flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-sm" onClick={() => handlePlaceOrder('sell')}>
                                    <span className="text-[14px] leading-tight">Sell (Short) {leverage}x</span>
                                    {sliderPercent > 0 && <span className="text-[10px] opacity-90 font-medium leading-tight">≈{currentFuturesAmount.toFixed(4)} {baseCoin}</span>}
                                </button>
                            </>
                        ) : (
                            <button
                                className={`w-full h-[44px] rounded-full font-bold text-white text-[15px] mt-auto shadow-sm ${tradeSide === 'buy' ? 'bg-[#20b26c]' : 'bg-[#ef454a]'}`}
                                onClick={() => handlePlaceOrder()}
                            >
                                {tradeSide === 'buy' ? `Buy ${baseCoin}` : `Sell ${baseCoin}`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Order Book */}
                <div className="w-[42%] p-3 pl-2 flex flex-col text-[11px]">
                    <div className="flex items-center justify-end gap-2 mb-3 min-h-[30px]">
                        {activeTopTab === 'Spot' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-800 text-[13px] font-medium">Margin</span>
                                <div
                                    className={`w-[34px] h-[18px] rounded-full flex items-center p-[2px] cursor-pointer ${isMarginEnabled ? 'bg-[#20b26c] justify-end' : 'bg-gray-300 justify-start'}`}
                                    onClick={() => setIsMarginEnabled(!isMarginEnabled)}
                                >
                                    <div className="w-[14px] h-[14px] bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-right leading-tight">
                                <div className="text-[10px] text-gray-400 font-medium">Funding rate / Countdown</div>
                                <div className="text-[10px] text-gray-800 font-bold">0.003% / {formatTime(secondsRemaining)}</div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between text-gray-400 mb-1.5 text-[11px] font-medium px-1">
                        <span>Price<br />(USDT)</span>
                        <span className="text-right">Amount<br />({baseCoin})</span>
                    </div>

                    {(() => {
                        let totalAsks = 0;
                        const asksWithDepth = [...currentAsks].reverse().map(ask => {
                            totalAsks += ask.amount;
                            return { ...ask, depth: totalAsks };
                        }).reverse();
                        const maxDAsks = totalAsks > 0 ? totalAsks : 1;

                        return (orderBookView === 'both' || orderBookView === 'sell') && (
                            <div className="flex flex-col flex-1 justify-end relative gap-[1px]">
                                {asksWithDepth.map((ask: any, i: number) => (
                                    <div key={`ask-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-slate-50" onClick={() => setPriceInput(formatInput(ask.price.toFixed(precisionDecimals)))}>
                                        <div className="absolute right-0 top-0 h-full bg-[#ffecec] transition-all duration-300" style={{ width: `${(ask.depth / maxDAsks) * 100}%` }} />
                                        <span className="text-[#ef454a] font-medium relative z-10 text-[12px] tracking-tight">
                                            {ask.price.toLocaleString('en-US', { minimumFractionDigits: precisionDecimals, maximumFractionDigits: precisionDecimals })}
                                        </span>
                                        <span className="text-gray-700 relative z-10 text-[12px] font-medium tracking-tight">
                                            {ask.amount >= 1 ? ask.amount.toFixed(2) : ask.amount.toFixed(5)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="py-2 my-0.5 relative group">
                        <div className="flex items-center justify-between px-1">
                            <span className={`text-[18px] font-bold ${isPositive ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>
                                {ticker ? formatPrice(ticker.lastPrice) : '--'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-gray-500 text-[11px] px-1 mt-0.5 font-medium">
                            ≈${ticker ? formatPrice(ticker.lastPrice) : '--'}
                            <span className={isPositive ? 'text-[#20b26c] ml-1' : 'text-[#ef454a] ml-1'}>
                                {ticker ? `${parseFloat(ticker.priceChangePercent) > 0 ? '+' : ''}${parseFloat(ticker.priceChangePercent).toFixed(2)}%` : ''}
                            </span>
                        </div>
                    </div>

                    {(() => {
                        let totalBids = 0;
                        const bidsWithDepth = currentBids.map(bid => {
                            totalBids += bid.amount;
                            return { ...bid, depth: totalBids };
                        });
                        const maxDBids = totalBids > 0 ? totalBids : 1;

                        return (orderBookView === 'both' || orderBookView === 'buy') && (
                            <div className="flex flex-col flex-1 relative gap-[1px]">
                                {bidsWithDepth.map((bid: any, i: number) => (
                                    <div key={`bid-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-slate-50" onClick={() => setPriceInput(formatInput(bid.price.toFixed(precisionDecimals)))}>
                                        <div className="absolute right-0 top-0 h-full bg-[#e5f7ed] transition-all duration-300" style={{ width: `${(bid.depth / maxDBids) * 100}%` }} />
                                        <span className="text-[#20b26c] font-medium relative z-10 text-[12px] tracking-tight">
                                            {bid.price.toLocaleString('en-US', { minimumFractionDigits: precisionDecimals, maximumFractionDigits: precisionDecimals })}
                                        </span>
                                        <span className="text-gray-700 relative z-10 text-[12px] font-medium tracking-tight">
                                            {bid.amount >= 1 ? bid.amount.toFixed(2) : bid.amount.toFixed(5)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

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

                        const sellRatio = 100 - buyRatio;
                        const clampedBuyRatio = Math.max(25, Math.min(75, buyRatio));
                        const clampedSellRatio = 100 - clampedBuyRatio;

                        return (
                            <div className="relative h-[18px] w-full mt-2 mb-3 px-1">
                                <div className="absolute inset-y-0 left-1 right-1 flex gap-[1px]">
                                    <div
                                        className="h-full bg-[#e5f7ed] transition-all duration-500 ease-in-out"
                                        style={{
                                            width: `${clampedBuyRatio}%`,
                                            clipPath: 'polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%)',
                                        }}
                                    />
                                    <div
                                        className="h-full bg-[#ffecec] transition-all duration-500 ease-in-out"
                                        style={{
                                            width: `${clampedSellRatio}%`,
                                            clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%)',
                                        }}
                                    />
                                </div>

                                <div className="relative h-full flex items-center justify-between z-10 pointer-events-none">
                                    <div className="flex items-center h-full text-[#20b26c] font-bold text-[10px]">
                                        <div className="h-full w-[18px] flex items-center justify-center border border-[#20b26c] rounded-[4px] mr-2 text-[9px] bg-transparent">
                                            B
                                        </div>
                                        {Math.round(buyRatio)}%
                                    </div>

                                    <div className="flex items-center h-full text-[#ef454a] font-bold text-[10px]">
                                        {Math.round(sellRatio)}%
                                        <div className="h-full w-[18px] flex items-center justify-center border border-[#ef454a] rounded-[4px] ml-2 text-[9px] bg-transparent">
                                            S
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex items-center gap-1.5 px-1">
                        <div
                            className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-100 px-2 h-[26px] rounded-[6px] text-[13px] font-semibold text-gray-600 cursor-pointer"
                            onClick={() => setIsPrecisionSheetOpen(true)}
                        >
                            {precision} <ArrowDropDown className="w-6 h-6 text-gray-400" />
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
            <div className="border-b border-gray-100 px-4 flex items-center justify-between sticky top-[52px] z-[90] bg-white h-[48px]" style={{ transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-full pr-10">
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'orders' ? 'text-gray-900 font-bold' : 'text-gray-500 font-semibold'}`}
                        onClick={() => {
                            setActiveTab('orders');
                            setSliderPercent(0);
                            setAmountInput('');
                        }}
                    >
                        <span className="text-[14px]">Orders ({
                            openOrders.filter(o => !isCurrentSymbolChecked || o.symbol === currentSymbol).length
                        })</span>
                        <ArrowDropDown className="w-[18px] h-[18px] mt-0.5" />
                    </div>
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'positions' ? 'text-gray-900 font-bold' : 'text-gray-500 font-semibold'}`}
                        onClick={() => {
                            if (activeTab === 'positions') {
                                setIsAssetFilterSheetOpen(true);
                            } else {
                                setActiveTab('positions');
                                setSliderPercent(0);
                                setAmountInput('');
                            }
                        }}
                    >
                        <span className="text-[14px]">
                            {assetFilter === 'All' ? 'Positions & assets' : (assetFilter === 'Positions' ? 'Positions' : 'Assets')} ({
                                (assetFilter === 'Assets' ? 0 : positions.filter(p => !isCurrentSymbolChecked || p.symbol === currentSymbol).length) +
                                Object.entries(wallets?.spot || {})
                                    .filter(([symbol, amount]) => {
                                        if (symbol === 'USDT' && assetFilter === 'Positions') return false;
                                        if (amount <= 0) return false;
                                        if (isCurrentSymbolChecked && symbol !== baseCoin) return false;

                                        const hasCost = spotCostBasis?.[symbol] && spotCostBasis[symbol] > 0;
                                        if (assetFilter === 'Positions' && !hasCost) return false;
                                        if (assetFilter === 'Assets' && hasCost) return false;

                                        return true;
                                    }).length
                            })
                        </span>
                        <ArrowDropDown className="w-[18px] h-[18px] mt-0.5" />
                    </div>
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'bots' ? 'text-gray-900 font-bold' : 'text-gray-500 font-semibold'}`}
                        onClick={() => {
                            setActiveTab('bots');
                            setSliderPercent(0);
                            setAmountInput('');
                        }}
                    >
                        <span className="text-[14px]">Bots (0)</span>
                        <ArrowDropDown className="w-[18px] h-[18px] mt-0.5" />
                    </div>
                </div>
                <div className="flex items-center h-full pl-2 bg-white relative cursor-pointer" onClick={() => setActivePage('trade-history')}>
                    <History className="w-[18px] h-[18px] text-gray-800" />
                </div>
            </div>

            {/* Control Row (Current symbol / Cancel all) - Root level for robust stickiness */}
            {(activeTab === 'orders' || activeTab === 'positions') && (
                <div className="px-4 py-2.5 flex items-center justify-between bg-white border-b border-gray-50 sticky top-[100px] z-[80]" style={{ transform: 'translateZ(0)' }}>
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCurrentSymbolChecked(!isCurrentSymbolChecked)}>
                        <div className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-[1.5px] transition-colors ${isCurrentSymbolChecked ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'}`}>
                            {isCurrentSymbolChecked && <Check className="w-3 h-3 text-white stroke-[4]" />}
                        </div>
                        <span className="text-[13px] font-medium text-gray-800">Current symbol</span>
                    </label>
                    <button
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors ${(openOrders.length > 0 || (activeTab === 'positions' && (positions.length > 0 || Object.keys(spotCostBasis).length > 0))) ? 'bg-gray-100 text-gray-900 active:bg-gray-200' : 'bg-[#f5f5f5] text-[#cccccc] cursor-not-allowed'}`}
                        disabled={!(openOrders.length > 0 || (activeTab === 'positions' && (positions.length > 0 || Object.keys(spotCostBasis).length > 0)))}
                        onClick={() => setIsCloseAllConfirmOpen(true)}
                    >
                        {activeTab === 'positions' ? 'Close all' : 'Cancel all'}
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-screen relative z-0 bg-white">
                {activeTab === 'orders' && (
                    <div className="flex flex-col">

                        {/* Order Cards from Store */}
                        {openOrders
                            .filter(order => !isCurrentSymbolChecked || order.symbol === currentSymbol)
                            .map((order) => (
                                <div key={order.id} className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-[16px] font-bold text-gray-900">{order.symbol.replace('USDT', '/USDT')} <ChevronRight className="w-4 h-4 inline text-gray-400" /></h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FiEdit2 className="w-4 h-4 text-gray-600" />
                                            <span className="text-gray-400 font-medium">|</span>
                                            <span className="text-[14px] font-semibold text-gray-900">Chase</span>
                                            <span className="text-[14px] font-semibold text-gray-900 cursor-pointer" onClick={() => cancelSpotOrder(order.id)}>Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="bg-[#e5f7ed] text-[#20b26c] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{order.type}</span>
                                        <span className={`${order.side === 'Buy' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{order.side}</span>
                                        <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{order.marginMode} {order.leverage}x</span>
                                        <span className="text-[11px] text-gray-400 font-medium ml-1">03/03, 03:04:03</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div>
                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Order amount ({baseCoin})</p>
                                            <p className="text-[15px] font-bold text-gray-900">{order.amount}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Filled ({baseCoin})</p>
                                            <p className="text-[15px] font-bold text-gray-900">{order.filled}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Order price</p>
                                            <p className="text-[15px] font-bold text-gray-900">{order.price.toLocaleString('en-US')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Empty state placeholder if no orders */}
                        {openOrders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center relative mb-4">
                                    <div className="absolute -left-1 bottom-4 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                    <div className="absolute -left-1 bottom-9 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                    <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm z-10">
                                        <span className="text-gray-300 text-xl font-light">!</span>
                                    </div>
                                </div>
                                <span className="text-[14px] text-gray-400 font-medium">No open orders</span>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'positions' && (
                    <div className="flex flex-col">

                        <div className="p-4">
                            {/* Position Cards from Store */}
                            {assetFilter !== 'Assets' && positions
                                .filter(pos => !isCurrentSymbolChecked || pos.symbol === currentSymbol)
                                .map((pos) => (
                                    <div key={pos.id} className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[16px] font-bold text-gray-900">{pos.symbol} Perp</h4>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-gray-400 font-medium flex items-center gap-1 justify-end border-b border-dashed border-gray-200 w-max ml-auto">PnL (USDT) <FiShare2 className="w-3.5 h-3.5" /></p>
                                                <p className={`text-[16px] font-bold ${pos.pnl >= 0 ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>
                                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-5">
                                            <span className={`${pos.side === 'Buy' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{pos.side}</span>
                                            <span className="bg-gray-100 text-gray-500 text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{pos.marginMode}</span>
                                            <span className="bg-gray-100 text-gray-900 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px] flex items-center">{pos.leverage}x <FiEdit2 className="ml-1 w-3 h-3" /></span>
                                            <div className="flex gap-[1px] ml-1">
                                                <div className="w-[3px] h-3 bg-[#20b26c]" />
                                                <div className="w-[3px] h-3 bg-[#20b26c]" />
                                                <div className="w-[3px] h-3 bg-gray-200" />
                                                <div className="w-[3px] h-3 bg-gray-200" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-4 mb-6">
                                            <div>
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Size ({baseCoin})</p>
                                                <p className="text-[15px] font-bold text-gray-900">{pos.size}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max flex items-center">Margin (USDT) <LuCirclePlus className="ml-1 w-3 h-3" /></p>
                                                <p className="text-[15px] font-bold text-gray-900">{pos.margin.toFixed(1)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">MMR</p>
                                                <p className="text-[15px] font-bold text-gray-900">249.88%</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Entry price</p>
                                                <p className="text-[15px] font-bold text-gray-900">{pos.entryPrice.toLocaleString('en-US')}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Mark price</p>
                                                <p className="text-[15px] font-bold text-gray-900">{pos.markPrice.toLocaleString('en-US')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Liq. price</p>
                                                <p className="text-[15px] font-bold text-gray-900">{pos.liqPrice.toLocaleString('en-US')}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-900 font-bold text-[14px]">TP/SL</button>
                                            <button
                                                className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-900 font-bold text-[14px]"
                                                onClick={() => handleClosePosition(pos.id, pos.symbol)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                ))}

                            {/* Spot Assets & USDT as Cards */}
                            {Object.entries(wallets?.spot || {})
                                .filter(([symbol, balance]: [string, any]) => {
                                    if (balance <= 0) return false;
                                    if (isCurrentSymbolChecked && symbol !== baseCoin && symbol !== 'USDT') return false;

                                    const hasCost = spotCostBasis?.[symbol] && spotCostBasis[symbol] > 0;
                                    if (assetFilter === 'Positions' && !hasCost) return false;
                                    if (assetFilter === 'Assets' && hasCost && symbol !== 'USDT') return false;
                                    if (symbol === 'USDT' && assetFilter === 'Positions') return false;

                                    return true;
                                })
                                .sort(([sA], [sB]) => {
                                    // USDT always at the bottom
                                    if (sA === 'USDT') return 1;
                                    if (sB === 'USDT') return -1;

                                    const hasA = spotCostBasis?.[sA] > 0;
                                    const hasB = spotCostBasis?.[sB] > 0;

                                    // Positions first, Assets second
                                    if (hasA && !hasB) return -1;
                                    if (!hasA && hasB) return 1;
                                    return 0;
                                })
                                .map(([symbol, balance]) => {
                                    if (symbol === 'USDT') {
                                        return (
                                            <div key="spot-USDT" className="mb-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-[#26a17b] flex items-center justify-center text-[10px] text-white font-bold">T</div>
                                                        <h4 className="text-[16px] font-bold text-gray-900">USDT</h4>
                                                        <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-1 rounded-sm">Wallet</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4 mb-6">
                                                    <div>
                                                        <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Available (USDT)</p>
                                                        <p className="text-[15px] font-bold text-gray-900">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Value (USDT)</p>
                                                        <p className="text-[15px] font-bold text-gray-900">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Action</p>
                                                        <button className="text-[13px] font-bold text-[#20b26c]">Deposit</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const marketSymbol = `${symbol}USDT`;
                                    const market = markets.find(m => m.symbol === marketSymbol);
                                    const lastPrice = market ? parseFloat(market.lastPrice) : (symbol === baseCoin ? (ticker?.lastPrice || 68940.6) : 1);
                                    const costPrice = spotCostBasis?.[symbol] || 0;
                                    const pnlAbsolute = costPrice > 0 ? (lastPrice - costPrice) * balance : 0;
                                    const pnlPercent = costPrice > 0 ? ((lastPrice - costPrice) / costPrice) * 100 : 0;
                                    const hasTrade = costPrice > 0;

                                    return (
                                        <div key={`spot-${symbol}`} className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${symbol === baseCoin ? 'bg-[#f7931a]' : 'bg-[#10b981]'}`}>
                                                        {symbol[0]}
                                                    </div>
                                                    <h4 className="text-[16px] font-bold text-gray-900">{symbol}/USDT</h4>
                                                    <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-1 rounded-sm">Spot</span>
                                                </div>
                                                {hasTrade && (
                                                    <div className="text-right">
                                                        <p className="text-[12px] text-gray-400 font-medium border-b border-dashed border-gray-200 w-max ml-auto">PnL (USDT)</p>
                                                        <p className={`text-[16px] font-bold ${pnlAbsolute >= 0 ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>
                                                            {pnlAbsolute >= 0 ? '+' : ''}{pnlAbsolute.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-y-4 mb-6">
                                                <div>
                                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Amount ({symbol})</p>
                                                    <p className="text-[15px] font-bold text-gray-900">{balance.toFixed(symbol === baseCoin ? 4 : 2)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Value (USDT)</p>
                                                    <p className="text-[15px] font-bold text-gray-900">{(balance * lastPrice).toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">{hasTrade ? 'Equity' : 'Action'}</p>
                                                    {hasTrade ? <p className="text-[15px] font-bold text-gray-900">100%</p> : <button className="text-[13px] font-bold text-[#20b26c]">Trade</button>}
                                                </div>
                                                {hasTrade && (
                                                    <>
                                                        <div>
                                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Cost price</p>
                                                            <p className="text-[15px] font-bold text-gray-900">{costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Last price</p>
                                                            <p className="text-[15px] font-bold text-gray-900">{lastPrice.toLocaleString('en-US')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Action</p>
                                                            <button className="text-[13px] font-bold text-[#20b26c]">Buy/Sell</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            {hasTrade && (
                                                <div className="flex gap-2">
                                                    <button className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-900 font-bold text-[14px]">TP/SL</button>
                                                    <button className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-900 font-bold text-[14px]">Sell</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {activeTab === 'bots' && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center relative mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <span className="text-[14px] text-gray-400 font-medium">No active bots</span>
                    </div>
                )}
            </div>

            {/* Mini Chart Drawer */}
            <div className={`fixed w-full max-w-md bg-white transition-all duration-300 border-t border-gray-100 z-[150] ${isMiniChartOpen ? 'h-[320px]' : 'h-[48px]'}`} style={{ bottom: 'calc(65px + var(--safe-area-bottom))' }}>
                <div
                    className="flex items-center justify-between px-4 cursor-pointer h-12 -mt-1"
                    onClick={() => setIsMiniChartOpen(!isMiniChartOpen)}
                >
                    <span className="text-[15px] font-bold text-gray-900">{currentSymbol.replace('USDT', '/USDT')} chart</span>
                    {isMiniChartOpen ? (
                        <PairChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                        <LuChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                </div>
                {isMiniChartOpen && (
                    <div className="px-1 pb-2 animate-in fade-in">
                        <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-500 mb-2 border-b border-gray-100 px-3 pb-2">
                            {['5m', '15m', '1h', '4h'].map((int) => (
                                <span
                                    key={int}
                                    onClick={() => setActiveInterval(int)}
                                    className={`cursor-pointer transition-all ${activeInterval === int ? 'text-gray-900 font-bold border-b-2 border-gray-900 pb-2 -mb-2' : ''}`}
                                >
                                    {int}
                                </span>
                            ))}
                            <span className="flex items-center gap-0.5">More <ArrowDropDown className="w-7 h-7" /></span>
                        </div>
                        <div className="h-[210px] w-full relative bg-white pb-10">
                            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-[0.05] pointer-events-none -translate-y-2">
                                <img src={trivLogo} alt="Triv" className="h-16" />
                            </div>
                            <RealChart data={klines} height={210} />
                        </div>
                    </div>
                )}
            </div>
            {/* Precision Bottom Sheet */}
            <AnimatePresence>
                {isPrecisionSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[500]"
                            onClick={() => setIsPrecisionSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-1 bg-slate-200 rounded-full mb-6" onClick={() => setIsPrecisionSheetOpen(false)} />
                                <div className="w-full flex flex-col gap-1">
                                    {dynamicPrecisions.map((val) => (
                                        <button
                                            key={val}
                                            className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${precision === val ? 'bg-gray-50 text-gray-900' : 'text-gray-500'}`}
                                            onClick={() => {
                                                setPrecision(val);
                                                setIsPrecisionSheetOpen(false);
                                            }}
                                        >
                                            {val}
                                            {precision === val && (
                                                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Order Type Sheet */}
            <AnimatePresence>
                {isOrderTypeSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[500]"
                            onClick={() => setIsOrderTypeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-[20px] font-semibold text-slate-900">Basic</span>
                                <Info className="w-4 h-4 text-gray-300" />
                            </div>

                            <div className="flex flex-col gap-8">
                                <div
                                    className="flex items-start gap-4 cursor-pointer group"
                                    onClick={() => { setOrderType('Limit'); setIsOrderTypeSheetOpen(false); }}
                                >
                                    <div className="pt-1.5 min-w-[32px]">
                                        <svg width="32" height="20" viewBox="0 0 32 20">
                                            <line x1="0" y1="14" x2="10" y2="14" stroke="#9ca3af" strokeWidth="2" strokeDasharray="2,2" />
                                            <path d="M10 14 L16 8 L32 8" fill="none" stroke="#111827" strokeWidth="2" />
                                            <circle cx="16" cy="8" r="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-slate-900 mb-1">Limit order</h4>
                                        <p className="text-sm text-gray-500 font-normal leading-tight">Buy or sell at a specified price or better</p>
                                    </div>
                                    {orderType === 'Limit' && (
                                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="flex items-start gap-4 cursor-pointer group"
                                    onClick={() => { setOrderType('Market'); setIsOrderTypeSheetOpen(false); }}
                                >
                                    <div className="pt-1.5 min-w-[32px]">
                                        <svg width="32" height="20" viewBox="0 0 32 20">
                                            <line x1="0" y1="12" x2="12" y2="12" stroke="#9ca3af" strokeWidth="2" strokeDasharray="2,2" />
                                            <line x1="12" y1="12" x2="28" y2="4" stroke="#111827" strokeWidth="2" />
                                            <circle cx="20" cy="8" r="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-slate-900 mb-1">Market order</h4>
                                        <p className="text-sm text-gray-500 font-normal leading-tight">Promptly buy or sell at the best price in the current market</p>
                                    </div>
                                    {orderType === 'Market' && (
                                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="flex items-start gap-4 cursor-pointer group"
                                    onClick={() => { setOrderType('TP/SL'); setIsOrderTypeSheetOpen(false); }}
                                >
                                    <div className="pt-1.5 min-w-[32px]">
                                        <svg width="32" height="24" viewBox="0 0 32 24">
                                            <line x1="0" y1="18" x2="8" y2="18" stroke="#9ca3af" strokeWidth="2" strokeDasharray="2,2" />
                                            <path d="M8 18 L16 10 L24 18" fill="none" stroke="#111827" strokeWidth="2" />
                                            <circle cx="16" cy="10" r="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                                            <circle cx="16" cy="18" r="3" fill="#ffffff" stroke="#d1d5db" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-slate-900 mb-1">TP/SL</h4>
                                        <p className="text-sm text-gray-500 font-normal leading-tight">Automatically place an order when the market price reaches the target price</p>
                                    </div>
                                    {orderType === 'TP/SL' && (
                                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Asset Filter Bottom Sheet */}
            <AnimatePresence>
                {
                    isAssetFilterSheetOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 z-[500]"
                                onClick={() => setIsAssetFilterSheetOpen(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-1 bg-slate-200 rounded-full mb-6" onClick={() => setIsAssetFilterSheetOpen(false)} />
                                    <div className="w-full flex flex-col gap-1">
                                        {['All', 'Positions', 'Assets'].map((filter) => (
                                            <button
                                                key={filter}
                                                className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${assetFilter === filter ? 'bg-gray-50 text-gray-900' : 'text-gray-500'}`}
                                                onClick={() => {
                                                    setAssetFilter(filter as any);
                                                    setIsAssetFilterSheetOpen(false);
                                                }}
                                            >
                                                {filter}
                                                {assetFilter === filter && (
                                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                        <Check size={12} className="text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div >
                        </>
                    )
                }
            </AnimatePresence >

            <OrderConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleFinalConfirm}
                symbol={currentSymbol}
                side={tradeSide === 'buy' ? 'Buy' : 'Sell'}
                price={orderType === 'Market' ? 'Market' : (pendingOrder?.p || 0).toLocaleString()}
                amount={pendingOrder?.a || 0}
                total={((pendingOrder?.p || currentPrice) * (pendingOrder?.a || 0)).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                type={activeTopTab === 'Futures' ? `Isolated-${orderType}` : orderType}
                isFutures={activeTopTab === 'Futures'}
                leverage={leverage}
                liqPrice={tradeSide === 'buy' ? liqPriceLong.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : liqPriceShort.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                priceGap={((((tradeSide === 'buy' ? liqPriceLong : liqPriceShort) / currentPrice) - 1) * 100).toFixed(2)}
                priceGapUsdt={((tradeSide === 'buy' ? liqPriceLong : liqPriceShort) - currentPrice).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            />

            {/* Margin Mode Sheet */}
            <AnimatePresence>
                {isMarginModeSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[500]"
                            onClick={() => setIsMarginModeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
                            <h3 className="text-[20px] font-semibold text-gray-900 mb-6 px-1">Margin mode</h3>
                            <div className="flex flex-col gap-2">
                                {['Isolated', 'Cross'].map((mode) => (
                                    <button
                                        key={mode}
                                        className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${marginMode === mode ? 'bg-gray-50 text-gray-900' : 'text-gray-500'}`}
                                        onClick={() => { setMarginMode(mode as any); setIsMarginModeSheetOpen(false); }}
                                    >
                                        {mode}
                                        {marginMode === mode && (
                                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Leverage Sheet */}
            < LeverageBottomSheet
                isOpen={isLeverageSheetOpen}
                onClose={() => setIsLeverageSheetOpen(false)}
                currentLeverage={leverage}
                onLeverageChange={(val) => setLeverage(val)}
                maxLeverage={100}
                availableBalance={availableFuturesUSDT}
                currentPrice={currentPrice}
                symbol={currentSymbol}
            />

            {/* Close All Confirmation Modal */}
            <AnimatePresence>
                {
                    isCloseAllConfirmOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 z-[1000]"
                                onClick={() => setIsCloseAllConfirmOpen(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                                animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                                exit={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed top-1/2 left-1/2 w-[90%] max-w-[340px] bg-white rounded-[24px] z-[1001] overflow-hidden"
                            >
                                <div className="p-6 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-[16px] leading-[1.4] text-gray-900 font-medium px-2">
                                        Your positions will all be closed at <span className="font-bold">market price</span>, and any open orders (or reduce-only orders) will be canceled. Options won't be affected.
                                    </p>
                                </div>
                                <div className="flex border-t border-gray-100 h-14">
                                    <button
                                        className="flex-1 text-[16px] font-semibold text-gray-900 border-r border-gray-100 active:bg-gray-50 transition-colors"
                                        onClick={() => setIsCloseAllConfirmOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 text-[16px] font-bold text-gray-900 active:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            closeAll();
                                            setIsCloseAllConfirmOpen(false);
                                            setToastMessage({
                                                title: 'Close all successful',
                                                message: 'All positions have been closed and orders canceled.'
                                            });
                                            setTimeout(() => setToastMessage(null), 3000);
                                        }}
                                    >
                                        Close all
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default TradeView;
