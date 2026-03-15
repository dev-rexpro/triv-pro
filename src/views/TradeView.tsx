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
import { IoClose as XIcon } from 'react-icons/io5';
import { RiShare2Line } from 'react-icons/ri';
import { FiEdit2, FiUpload as FiUploadLine } from 'react-icons/fi';
import { formatCurrency, getCurrencySymbol, formatPrice, formatAbbreviated } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import useExchangeStore from '../stores/useExchangeStore';
import SuccessDialog from '../components/SuccessDialog';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import LeverageBottomSheet from '../components/LeverageBottomSheet';
import FuturesTPSLSheet from '../components/FuturesTPSLSheet';
import SpotTPSLSheet from '../components/SpotTPSLSheet';
import SpotCostPriceSheet from '../components/SpotCostPriceSheet';
import SharePnLSheet from '../components/SharePnLSheet';
import FuturesCloseSheet from '../components/FuturesCloseSheet';
import FuturesCloseAllModal from '../components/FuturesCloseAllModal';
import CoinIcon from '../components/CoinIcon';
const RealChart = React.lazy(() => import('../components/RealChart'));
import trivLogo from '../assets/triv-logo.svg';
import { useOrderBookSocket } from '../hooks/useOrderBookSocket';
import { useTickerSocket } from '../hooks/useTickerSocket';

const TradeView = () => {
    const setActivePage = useExchangeStore(state => state.setActivePage);
    const wallets = useExchangeStore(state => state.wallets);
    const markets = useExchangeStore(state => state.markets);
    const openOrders = useExchangeStore(state => state.openOrders);
    const positions = useExchangeStore(state => state.positions);
    const spotCostBasis = useExchangeStore(state => state.spotCostBasis);
    const placeSpotOrder = useExchangeStore(state => state.placeSpotOrder);
    const cancelSpotOrder = useExchangeStore(state => state.cancelSpotOrder);
    const placeFuturesOrder = useExchangeStore(state => state.placeFuturesOrder);
    const closeFuturesPosition = useExchangeStore(state => state.closeFuturesPosition);
    const showOrderConfirmation = useExchangeStore(state => state.showOrderConfirmation);
    const setShowOrderConfirmation = useExchangeStore(state => state.setShowOrderConfirmation);
    const closeAll = useExchangeStore(state => state.closeAll);
    const tradeType = useExchangeStore(state => state.tradeType);
    const setTradeType = useExchangeStore(state => state.setTradeType);
    const selectedCoin = useExchangeStore(state => state.selectedCoin);
    const setSearchOpen = useExchangeStore(state => state.setSearchOpen);
    const futuresSymbols = useExchangeStore(state => state.futuresSymbols);
    const nextFundingTime = useExchangeStore(state => state.nextFundingTime);
    const fundingRate = useExchangeStore(state => state.fundingRate);
    const setSpotTradeSheetOpen = useExchangeStore(state => state.setSpotTradeSheetOpen);
    const setFuturesTPSLSheetOpen = useExchangeStore(state => state.setFuturesTPSLSheetOpen);
    const setSpotTPSLSheetOpen = useExchangeStore(state => state.setSpotTPSLSheetOpen);
    const isSpotCostPriceSheetOpen = useExchangeStore(state => state.isSpotCostPriceSheetOpen);
    const activeSpotCostPriceAsset = useExchangeStore(state => state.activeSpotCostPriceAsset);
    const setSpotCostPriceSheetOpen = useExchangeStore(state => state.setSpotCostPriceSheetOpen);
    const isSharePnLSheetOpen = useExchangeStore(state => state.isSharePnLSheetOpen);
    const activeShareData = useExchangeStore(state => state.activeShareData);
    const setSharePnLSheetOpen = useExchangeStore(state => state.setSharePnLSheetOpen);
    const spotTPSL = useExchangeStore(state => state.spotTPSL);
    const setFuturesTPSL = useExchangeStore(state => state.setFuturesTPSL);
    const setSpotTPSL = useExchangeStore(state => state.setSpotTPSL);
    const cancelAllOrders = useExchangeStore(state => state.cancelAllOrders);
    const showToast = useExchangeStore(state => state.showToast);
    const spotSymbols = useExchangeStore(state => state.spotSymbols);

    const [activeTopTab, setActiveTopTab] = useState<'Spot' | 'Futures' | 'Bots' | 'Convert'>(tradeType === 'futures' ? 'Futures' : 'Spot');
    const currentSymbol = selectedCoin || 'BTCUSDT';

    const tradingSymbol = useMemo(() => {
        if (activeTopTab !== 'Futures') return currentSymbol;
        const exists = (futuresSymbols || []).some(s => s.symbol === currentSymbol);
        if (exists) return currentSymbol;
        const base = currentSymbol.replace('USDT', '');
        const mapped = `1000${base}USDT`;
        const mappedExists = (futuresSymbols || []).some(s => s.symbol === mapped);
        if (mappedExists) return mapped;
        return currentSymbol;
    }, [activeTopTab, currentSymbol, futuresSymbols]);

    const baseCoin = tradingSymbol.replace('USDT', '');
    const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
    const [priceInput, setPriceInput] = useState('0');
    const [amountInput, setAmountInput] = useState('');
    const [sliderPercent, setSliderPercent] = useState(0);
    const [isMarginEnabled, setIsMarginEnabled] = useState(false);
    const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
    const [tpInput, setTpInput] = useState('');
    const [slInput, setSlInput] = useState('');
    const [isTpFocused, setIsTpFocused] = useState(false);
    const [isSlFocused, setIsSlFocused] = useState(false);
    const tpInputRef = useRef<HTMLInputElement>(null);
    const slInputRef = useRef<HTMLInputElement>(null);
    const [isCurrentSymbolChecked, setIsCurrentSymbolChecked] = useState(false);
    const [orderBookView, setOrderBookView] = useState<'both' | 'buy' | 'sell'>('both');
    const [isMiniChartOpen, setIsMiniChartOpen] = useState(false);
    const [klines, setKlines] = useState<any[]>([]);
    const [precision, setPrecision] = useState(0.1);
    const [tickSize, setTickSize] = useState<number | null>(null);
    const [stepSize, setStepSize] = useState<number | null>(null);
    const [isPrecisionSheetOpen, setIsPrecisionSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'positions' | 'bots'>('orders');
    const [assetFilter, setAssetFilter] = useState<'All' | 'Positions' | 'Assets'>('All');
    const [isAssetFilterSheetOpen, setIsAssetFilterSheetOpen] = useState(false);
    const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'TP/SL'>('Limit');
    const [isOrderTypeSheetOpen, setIsOrderTypeSheetOpen] = useState(false);
    const [isReduceOnly, setIsReduceOnly] = useState(false);
    const [isCloseAllConfirmOpen, setIsCloseAllConfirmOpen] = useState(false);
    const [marginMode, setMarginMode] = useState<'Isolated' | 'Cross'>('Isolated');
    const [leverage, setLeverage] = useState(50);
    const [isMarginModeSheetOpen, setIsMarginModeSheetOpen] = useState(false);
    const [isLeverageSheetOpen, setIsLeverageSheetOpen] = useState(false);
    const [activeInterval, setActiveInterval] = useState('1h');
    const [isPriceFocused, setIsPriceFocused] = useState(false);
    const priceInputRef = useRef(priceInput);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);
    const [isCloseSheetOpen, setIsCloseSheetOpen] = useState(false);
    const [isPositionCloseModalOpen, setIsPositionCloseModalOpen] = useState(false);
    const [selectedPositionForClose, setSelectedPositionForClose] = useState<any>(null);
    const [isPriceAuto, setIsPriceAuto] = useState(true);
    const { setSelectedCoin } = useExchangeStore();

    const handleNavigateToTrade = (symbol: string, type: 'spot' | 'futures') => {
        setTradeType(type);
        setSelectedCoin(symbol);
        setActiveTopTab(type === 'futures' ? 'Futures' : 'Spot');
        setActivePage(type === 'futures' ? 'futures' : 'trade');
        window.scrollTo(0, 0);
    };

    const wsType = activeTopTab === 'Futures' ? 'futures' : 'spot';
    const wsTicker = useTickerSocket(tradingSymbol, wsType);
    const { orderBook: wsOrderBook } = useOrderBookSocket(tradingSymbol, wsType);
 
    // Compat with existing code (mapping numeric/array types)
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

        const source = activeTopTab === 'Futures' ? futuresSymbols : spotSymbols;
        const info = (source || []).find(s => s.symbol === tradingSymbol);
        if (info) return info.pricePrecision;
        
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
    }, [tradingSymbol, activeTopTab, spotSymbols, futuresSymbols, ticker, tickSize]);

    const orderBook = useMemo(() => ({
        bids: wsOrderBook.bids.map(b => ({ price: parseFloat(b[0]), amount: parseFloat(b[1]) })),
        asks: wsOrderBook.asks.map(a => ({ price: parseFloat(a[0]), amount: parseFloat(a[1]) })).reverse()
    }), [wsOrderBook]);

    // Auto-fill price input saat pertama kali buka koin (Reactive from WebSocket)
    useEffect(() => {
        if (ticker?.lastPrice && !isPriceFocused && isPriceAuto && (priceInputRef.current === '0' || priceInputRef.current === '')) {
            setPriceInput(formatInput(ticker.lastPrice.toString()));
        }
    }, [ticker?.lastPrice, isPriceFocused, isPriceAuto]);

    const precisionDecimals = useMemo(() => {
        if (precision >= 1) return 0;
        const str = precision.toString();
        if (str.includes('e-')) {
            return parseInt(str.split('e-')[1], 10);
        }
        return str.split('.')[1]?.length || 0;
    }, [precision]);

    // Intelligent Auto-Fetch logic for Limit orders
    useEffect(() => {
        if (isPriceAuto && ticker?.lastPrice && orderType === 'Limit' && !isPriceFocused) {
            const mPrice = parseFloat(ticker.lastPrice);
            // Buy slightly below, Sell slightly above (0.02% offset)
            const offset = mPrice * 0.0002;
            const autoPrice = tradeSide === 'buy' ? mPrice - offset : mPrice + offset;

            setPriceInput(formatInput(autoPrice.toFixed(precisionDecimals)));
        }
    }, [ticker?.lastPrice, isPriceAuto, orderType, tradeSide, precisionDecimals, isPriceFocused]);

    // Keep ref in sync for the interval closure
    useEffect(() => {
        priceInputRef.current = priceInput;
    }, [priceInput]);

    const handleClosePosition = (posId: string, symbol: string) => {
        closeFuturesPosition(posId);
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
    const totalUnrealizedPnlValue = (positions || []).reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const currentEquityValue = (wallets?.futures?.USDT || 0) + totalUnrealizedPnlValue;
    const totalLockedMargin = (positions || []).reduce((sum, pos) => sum + pos.margin, 0);
    const availableFuturesUSDT = Math.max(0, currentEquityValue - totalLockedMargin);

    const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 72000;
    const futuresFeeRate = 0.0005; // Matches store/useExchangeStore.ts
    const maxBuySellFutures = availableFuturesUSDT / (currentPrice * (1 / leverage + futuresFeeRate));
    
    const rawFuturesAmount = (sliderPercent / 100) * maxBuySellFutures;
    const step = stepSize || 0.0001;
    const currentFuturesAmount = Math.floor(rawFuturesAmount / step) * step;
    const currentFuturesCost = (sliderPercent / 100) * availableFuturesUSDT;

    const liqPriceLong = currentPrice * (1 - 1 / leverage);
    const liqPriceShort = currentPrice * (1 + 1 / leverage);

    const [secondsRemaining, setSecondsRemaining] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            const diff = Math.max(0, Math.floor((nextFundingTime - Date.now()) / 1000));
            setSecondsRemaining(diff);
        }, 1000);
        return () => clearInterval(timer);
    }, [nextFundingTime]);

    useEffect(() => {
        const baseUrl = activeTopTab === 'Futures' ? 'https://fapi.binance.com' : 'https://api.binance.com';
        const prefix = activeTopTab === 'Futures' ? '/fapi/v1' : '/api/v3';

        const fetchKlines = async (interval: string) => {
            try {
                const res = await fetch(`${baseUrl}${prefix}/klines?symbol=${tradingSymbol}&interval=${interval}&limit=100`);
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
                const res = await fetch(`${baseUrl}${prefix}/exchangeInfo?symbol=${tradingSymbol}`);
                const data = await res.json();

                // Safety: Find the specific symbol instead of assuming index 0
                const symbolInfo = data.symbols?.find((s: any) => s.symbol === tradingSymbol);

                if (symbolInfo) {
                    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
                    if (priceFilter && priceFilter.tickSize) {
                        setTickSize(parseFloat(priceFilter.tickSize));
                    }
                    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
                    if (lotSizeFilter && lotSizeFilter.stepSize) {
                        setStepSize(parseFloat(lotSizeFilter.stepSize));
                    }
                }
            } catch (err) { }
        };

        fetchExchangeInfo();
        fetchKlines(activeInterval);

        // Kita tidak perlu lagi setInterval untuk Ticker & OrderBook karena sudah di-handle oleh WebSocket!
    }, [activeInterval, activeTopTab, tradingSymbol]);

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
        setTickSize(null); // Clear tickSize so the fetch in the other effect updates it correctly
        setIsPriceAuto(true); // Reset auto-fetch on symbol/tab change
        setTpInput('');
        setSlInput('');
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

        const { p, a, side, tpPrice, slPrice } = pendingOrder;

        if (activeTopTab === 'Futures') {
            placeFuturesOrder({
                symbol: currentSymbol,
                side: (side || tradeSide) === 'buy' ? 'Buy' : 'Sell',
                type: orderType === 'TP/SL' ? 'Limit' : orderType,
                price: p,
                amount: a,
                marginMode: marginMode,
                leverage: leverage,
                tpPrice,
                slPrice
            });

        } else {
            placeSpotOrder({
                symbol: currentSymbol,
                side: (side || tradeSide) === 'buy' ? 'Buy' : 'Sell',
                type: orderType === 'TP/SL' ? 'Limit' : orderType,
                price: p,
                amount: a,
                marginMode: 'Isolated',
                leverage: 10,
                tpPrice,
                slPrice
            });
        }

        setIsConfirmModalOpen(false);
        setPendingOrder(null);
        setAmountInput('');
        setSliderPercent(0);
        setTpInput('');
        setSlInput('');
        setActiveTab('orders');
    };

    const handlePlaceOrder = (sideOverride?: 'buy' | 'sell') => {
        const actualSide = sideOverride || tradeSide;
        if (sideOverride && tradeSide !== sideOverride) {
            setTradeSide(actualSide);
        }

        const p = orderType === 'Market' ? (ticker ? parseFloat(ticker.lastPrice) : 0) : parseFloat(priceInput.replace(/,/g, ''));
        const a = parseFloat(amountInput.replace(/,/g, '')) || currentFuturesAmount;
        if (a <= 0) return;

        const tpPrice = isTpSlEnabled && tpInput ? parseFloat(tpInput) : undefined;
        const slPrice = isTpSlEnabled && slInput ? parseFloat(slInput) : undefined;

        if (activeTopTab === 'Futures' && availableFuturesUSDT <= 0) {
            alert('Insufficient Futures Margin. Please transfer USDT to your Trading account first.');
            return;
        }

        if (showOrderConfirmation) {
            setPendingOrder({ p, a, side: actualSide, tpPrice, slPrice });
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
                    leverage: leverage,
                    tpPrice,
                    slPrice
                });

            } else {
                placeSpotOrder({
                    symbol: currentSymbol,
                    side: actualSide === 'buy' ? 'Buy' : 'Sell',
                    type: orderType === 'TP/SL' ? 'Limit' : orderType,
                    price: p,
                    amount: a,
                    marginMode: 'Isolated',
                    leverage: 10,
                    tpPrice,
                    slPrice
                });
            }
            setAmountInput('');
            setSliderPercent(0);
            setTpInput('');
            setSlInput('');
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
        setIsPriceAuto(false); // Manual override
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
                        const spotFeeRate = 0.001; // Matches store/useExchangeStore.ts
                        maxAmount = price > 0 ? availableBalance / (price * (1 + spotFeeRate)) : 0;
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
            else {
                const rawVal = limit * (pct / 100);
                const step = stepSize || 0.0001;
                // Round down to nearest stepSize to avoid exceeding balance
                const rounded = Math.floor(rawVal / step) * step;
                const decimals = step < 1 ? step.toString().split('.')[1]?.length || 0 : 0;
                setAmountInput(formatInput(rounded.toFixed(decimals)));
            }
        } else {
            if (availableBalance > 0) {
                let maxAmount = availableBalance;
                if (tradeSide === 'buy') {
                    const price = parseFloat(priceInput.replace(/,/g, '')) || 0;
                    const spotFeeRate = 0.001; // Matches store/useExchangeStore.ts
                    maxAmount = price > 0 ? availableBalance / (price * (1 + spotFeeRate)) : 0;
                }
                const val = maxAmount * (pct / 100);
                const step = stepSize || 0.00000001;
                const rounded = Math.floor(val / step) * step;
                const decimals = step < 1 ? step.toString().split('.')[1]?.length || 0 : 0;
                setAmountInput(pct === 0 ? '' : formatInput(rounded.toFixed(decimals)));
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

    // Auto-adjust precision when symbol or market changes
    useEffect(() => {
        if (dynamicPrecisions.length > 0) {
            setPrecision(dynamicPrecisions[0]);
        }
    }, [dynamicPrecisions, currentSymbol, activeTopTab]);


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
        ? formatPrice(parseFloat(amountInput.replace(/,/g, '')) * currentPriceNum)
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
        ? (isTpSlEnabled ? 9 : 7)
        : (isTpSlEnabled ? 7 : 5);
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
        <div className="flex flex-col bg-[var(--bg-primary)] min-h-screen relative pb-[120px]">
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

            <div className="bg-[var(--bg-primary)] shrink-0 pt-[var(--safe-area-top)]">
                <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex gap-5 text-[18px] font-medium text-[var(--text-tertiary)] overflow-x-auto no-scrollbar">
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
                                className={`cursor-pointer whitespace-nowrap transition-all ${activeTopTab === t ? 'text-[var(--text-primary)]' : ''}`}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                    <MoreHorizontal size={20} className="text-[var(--text-primary)]" />
                </div>
            </div>

            {/* Symbol Header */}
            <div className="px-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)] sticky top-0 z-[100] h-[52px]" style={{ transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-2 cursor-pointer h-full" onClick={() => setSearchOpen(true)}>
                    <h1 className="text-[18px] font-bold text-[var(--text-primary)] leading-none uppercase">{activeTopTab === 'Futures' ? currentSymbol : currentSymbol.replace('USDT', '/USDT')}</h1>
                    {activeTopTab === 'Futures' ? (
                        <span className="bg-[#faad14]/10 text-[#faad14] text-[10px] font-bold px-1.5 py-[2px] rounded-[4px] leading-none">Perp</span>
                    ) : (
                        <span className="bg-slate-400/10 text-slate-400 text-[10px] font-bold px-1.5 py-[2px] rounded-[4px] leading-none">10x</span>
                    )}
                    <ArrowDropDown className="w-6 h-6 text-[var(--text-secondary)] mt-0.5" />
                </div>
                <div className="flex items-center gap-4">
                    <CandlestickChart className="w-7 h-7 text-[var(--text-primary)] cursor-pointer" onClick={() => setActivePage('chart-trade')} />
                    <AlignRight className="w-7 h-7 text-[var(--text-primary)]" />
                </div>
            </div>

            <div className="flex items-stretch px-3 py-3">
                {/* Left Panel: Trade Inputs */}
                <div className="w-[58%] pr-1 flex flex-col gap-1.5">
                    {activeTopTab === 'Futures' ? (
                        <>
                            <div className="flex gap-2">
                                <div
                                    className="flex-1 bg-[var(--input-bg)] h-[32px] rounded-md flex items-center justify-between px-2 cursor-pointer"
                                    onClick={() => setIsMarginModeSheetOpen(true)}
                                >
                                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{marginMode}</span>
                                    <ArrowDropDown className="w-7 h-7 text-[var(--text-secondary)]" />
                                </div>
                                <div
                                    className="flex-1 bg-[var(--input-bg)] h-[32px] rounded-md flex items-center justify-between px-2 cursor-pointer"
                                    onClick={() => setIsLeverageSheetOpen(true)}
                                >
                                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{leverage}x</span>
                                    <ArrowDropDown className="w-7 h-7 text-[var(--text-secondary)]" />
                                </div>
                            </div>
                            <div
                                className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] flex items-center justify-between cursor-pointer border border-transparent hover:border-[var(--border-color)]"
                                onClick={() => setIsOrderTypeSheetOpen(true)}
                            >
                                <span className="font-semibold text-[14px] text-[var(--text-primary)] flex items-center gap-1.5">
                                    {orderType === 'Market' ? 'Market order' : orderType === 'Limit' ? 'Limit order' : 'TP/SL'} <Info className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                                </span>
                                <ArrowDropDown className="w-7 h-7 text-[var(--text-secondary)]" />
                            </div>

                            <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] flex flex-col justify-center border border-transparent focus-within:border-[var(--border-strong)] transition-colors">
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Price (USDT)</span>
                                {orderType === 'Market' ? (
                                    <div className="font-semibold text-[var(--text-tertiary)] text-[15px]">Market price</div>
                                ) : (
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[15px] outline-none w-full p-0 leading-none"
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

                            <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex items-center justify-between cursor-pointer border border-transparent hover:border-[var(--border-color)]" onClick={() => setIsOrderTypeSheetOpen(true)}>
                                <span className="font-semibold text-[14px] text-[var(--text-primary)] flex items-center gap-1.5">
                                    {orderType === 'Market' ? 'Market order' : orderType === 'Limit' ? 'Limit order' : 'TP/SL'} <span className="text-[10px] text-[var(--text-tertiary)]"><Info className="inline w-3 h-3" /></span>
                                </span>
                                <ArrowDropDown className="w-7 h-7 text-[var(--text-secondary)]" />
                            </div>

                            <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex flex-col justify-center border border-transparent focus-within:border-[var(--border-strong)] transition-colors">
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Price (USDT)</span>
                                {orderType === 'Market' ? (
                                    <div className="font-semibold text-[var(--text-tertiary)] text-[15px]">Market price</div>
                                ) : (
                                    <input
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[15px] outline-none w-full p-0 leading-none"
                                        value={priceInput}
                                        onChange={handlePriceInputChange}
                                        onFocus={() => setIsPriceFocused(true)}
                                        onBlur={() => setIsPriceFocused(false)}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1 flex flex-col justify-center border border-transparent focus-within:border-[var(--border-strong)] transition-colors relative cursor-text">
                        {amountInput ? (
                            <div className="flex flex-col w-full z-10">
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mb-0.5">Amount ({baseCoin})</span>
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
                                <span className="text-[14px] text-[var(--text-secondary)] font-medium">{baseCoin}</span>
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

                    {activeTopTab === 'Spot' && (
                        <>
                            <div className="bg-[var(--input-bg)] rounded-lg px-3 h-[40px] mb-1.5 flex flex-col justify-center relative">
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
                                <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1">
                                    {displayAvailable} {currentAsset} <LuCirclePlus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[12px] mb-2 px-1">
                                <span className="text-[var(--text-tertiary)] font-medium">Max {tradeSide}</span>
                                <span className="font-medium text-[var(--text-secondary)]">{formatAbbreviated(parseFloat(maxBuySellValue))} {baseCoin}</span>
                            </div>
                        </>
                    )}

                    {activeTopTab === 'Futures' && (
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-medium px-1 mb-1">
                            <span>Available</span>
                            <span
                                className="text-[var(--text-primary)] font-bold flex items-center gap-1 cursor-pointer"
                                onClick={() => setActivePage('Assets')}
                            >
                                {availableFuturesUSDT.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT <LuCirclePlus className="w-3 h-3 text-[var(--text-secondary)]" />
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col gap-2.5 px-1 mt-1 mb-2">
                        {activeTopTab === 'Futures' && (
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsReduceOnly(!isReduceOnly)}>
                                <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${isReduceOnly ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]' : 'border-[var(--border-strong)] bg-[var(--bg-card)]'}`}>
                                    {isReduceOnly && <Check size={12} className="text-[var(--btn-primary-text)]" strokeWidth={3} />}
                                </div>
                                <span className="text-[13px] font-medium text-[var(--text-secondary)] border-b border-dashed border-[var(--text-tertiary)] pb-[1px] leading-none transition-colors group-hover:text-[var(--text-primary)]">Reduce-only</span>
                            </label>
                        )}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}>
                                <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${isTpSlEnabled ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]' : 'border-[var(--border-strong)] bg-[var(--bg-card)]'}`}>
                                    {isTpSlEnabled && <Check size={12} className="text-[var(--btn-primary-text)]" strokeWidth={3} />}
                                </div>
                                <span className="text-[13px] font-medium text-[var(--text-secondary)] border-b border-dashed border-[var(--text-tertiary)] pb-[1px] leading-none transition-colors group-hover:text-[var(--text-primary)]">TP/SL</span>
                            </label>
                            {isTpSlEnabled && (
                                <button
                                    className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-0.5"
                                    onClick={() => {
                                        if (activeTopTab === 'Futures') {
                                            setFuturesTPSLSheetOpen(true);
                                        } else {
                                            setSpotTPSLSheetOpen(true, { symbol: baseCoin, amount: 0 });
                                        }
                                    }}
                                >
                                    Advanced <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {isTpSlEnabled && (
                        <div className="animate-in fade-in duration-300 pb-2">
                            {/* TP Input */}
                            <div className={`bg-[var(--input-bg)] rounded-lg px-3 transition-shadow duration-200 border cursor-text h-[40px] mb-1.5 relative flex items-center ${isTpFocused ? 'border-[var(--text-primary)]' : 'border-transparent'}`}
                                onClick={() => tpInputRef.current?.focus()}
                            >
                                <div className={`flex flex-col w-full transition-opacity duration-200 ${(isTpFocused || tpInput) ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-medium mb-0">TP price (USDT)</span>
                                    <input
                                        ref={tpInputRef}
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[14px] outline-none w-full p-0 leading-none"
                                        value={tpInput}
                                        onFocus={() => setIsTpFocused(true)}
                                        onBlur={() => setIsTpFocused(false)}
                                        onChange={(e) => setTpInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                    />
                                </div>
                                <div className={`flex items-center justify-between w-full transition-opacity duration-200 ${(!isTpFocused && !tpInput) ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
                                    <span className="text-[14px] text-[var(--text-tertiary)] font-medium">TP price</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[14px] font-medium text-[var(--text-primary)]">USDT</span>
                                        <ArrowDropDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                                    </div>
                                </div>
                            </div>

                            {/* SL Input */}
                            <div className={`bg-[var(--input-bg)] rounded-lg px-3 transition-shadow duration-200 border cursor-text h-[40px] mb-1.5 relative flex items-center ${isSlFocused ? 'border-[var(--text-primary)]' : 'border-transparent'}`}
                                onClick={() => slInputRef.current?.focus()}
                            >
                                <div className={`flex flex-col w-full transition-opacity duration-200 ${(isSlFocused || slInput) ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-medium mb-0">SL price (USDT)</span>
                                    <input
                                        ref={slInputRef}
                                        type="text"
                                        className="bg-transparent font-medium text-[var(--text-primary)] text-[14px] outline-none w-full p-0 leading-none"
                                        value={slInput}
                                        onFocus={() => setIsSlFocused(true)}
                                        onBlur={() => setIsSlFocused(false)}
                                        onChange={(e) => setSlInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                    />
                                </div>
                                <div className={`flex items-center justify-between w-full transition-opacity duration-200 ${(!isSlFocused && !slInput) ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
                                    <span className="text-[14px] text-[var(--text-tertiary)] font-medium">SL price</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[14px] font-medium text-[var(--text-primary)]">USDT</span>
                                        <ArrowDropDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-auto">
                        {activeTopTab === 'Futures' ? (
                            <>
                                <div className="flex flex-col gap-1 text-[11px] px-1 mb-1.5">
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Max buy</span><span className="text-[var(--text-primary)] font-bold">{formatAbbreviated(maxBuySellFutures)} {baseCoin}</span></div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Cost</span><span className="text-[var(--text-primary)] font-bold">{currentFuturesCost.toFixed(2)} USDT</span></div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Liq. price</span><span className="text-[var(--text-primary)] font-bold">{sliderPercent > 0 ? formatPrice(liqPriceLong) : '--'}</span></div>
                                </div>
                                <button className="w-full h-[40px] rounded-full font-bold text-white bg-[var(--green)] flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-sm mb-1" onClick={() => handlePlaceOrder('buy')}>
                                    <span className="text-[14px] leading-tight">Buy (Long) {leverage}x</span>
                                    {sliderPercent > 0 && <span className="text-[10px] opacity-90 font-medium leading-tight">≈{formatAbbreviated(currentFuturesAmount)} {baseCoin}</span>}
                                </button>
                                <div className="flex flex-col gap-1 text-[11px] px-1 mt-1 mb-1.5">
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Max sell</span><span className="text-[var(--text-primary)] font-bold">{formatAbbreviated(maxBuySellFutures)} {baseCoin}</span></div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Cost</span><span className="text-[var(--text-primary)] font-bold">{currentFuturesCost.toFixed(2)} USDT</span></div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]"><span>Liq. price</span><span className="text-[var(--text-primary)] font-bold">{sliderPercent > 0 ? formatPrice(liqPriceShort) : '--'}</span></div>
                                </div>
                                <button className="w-full h-[40px] rounded-full font-bold text-white bg-[var(--red)] flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-sm" onClick={() => handlePlaceOrder('sell')}>
                                    <span className="text-[14px] leading-tight">Sell (Short) {leverage}x</span>
                                    {sliderPercent > 0 && <span className="text-[10px] opacity-90 font-medium leading-tight">≈{formatAbbreviated(currentFuturesAmount)} {baseCoin}</span>}
                                </button>
                            </>
                        ) : (
                            <button
                                className={`w-full h-[40px] rounded-full font-bold text-white text-[15px] shadow-sm ${tradeSide === 'buy' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`}
                                onClick={() => handlePlaceOrder()}
                            >
                                {tradeSide === 'buy' ? `Buy ${baseCoin}` : `Sell ${baseCoin}`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Order Book */}
                <div className="w-[42%] pl-1 flex flex-col text-[11px]">
                    <div className="flex items-center justify-end gap-2 mb-3 min-h-[30px]">
                        {activeTopTab === 'Spot' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--text-primary)] text-[13px] font-medium">Margin</span>
                                <div
                                    className={`w-[34px] h-[18px] rounded-full flex items-center p-[2px] cursor-pointer ${isMarginEnabled ? 'bg-[var(--green)] justify-end' : 'bg-gray-300 justify-start'}`}
                                    onClick={() => setIsMarginEnabled(!isMarginEnabled)}
                                >
                                    <div className="w-[14px] h-[14px] bg-[var(--bg-primary)] rounded-full shadow-sm" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-right leading-tight">
                                <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Funding rate / Countdown</div>
                                <div className="text-[10px] text-[var(--text-primary)] font-bold">{(fundingRate * 100).toFixed(4)}% / {formatTime(secondsRemaining)}</div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between text-[var(--text-tertiary)] mb-1.5 text-[11px] font-medium px-1">
                        <span>Price<br />(USDT)</span>
                        <span className="text-right">Amount<br />({baseCoin})</span>
                    </div>

                    {(() => {
                        const maxAmount = Math.max(...currentAsks.map(a => a.amount), 1);

                        return (orderBookView === 'both' || orderBookView === 'sell') && (
                            <div className="flex flex-col flex-1 justify-end relative gap-[1px]">
                                {currentAsks.map((ask: any, i: number) => (
                                    <div key={`ask-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => {
                                        setPriceInput(formatInput(ask.price.toFixed(precisionDecimals)));
                                        setIsPriceAuto(false);
                                    }}>
                                        <div className="absolute right-0 top-0 h-full bg-[var(--red-bg)] transition-all duration-300" style={{ width: `${(ask.amount / maxAmount) * 100}%` }} />
                                        <span className="text-[var(--red)] font-medium relative z-10 text-[12px] tracking-tight">
                                            {formatPrice(ask.price, pricePrecision)}
                                        </span>
                                        <span className="text-[var(--text-secondary)] relative z-10 text-[12px] font-medium tracking-tight">
                                            {formatAbbreviated(ask.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="py-2 my-0.5 relative group">
                        <div className="flex items-center justify-between px-1">
                            <span className={`text-[18px] font-bold ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                {ticker ? formatPrice(ticker.lastPrice, pricePrecision) : '--'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                        </div>
                        <div className="text-[var(--text-secondary)] text-[11px] px-1 mt-0.5 font-medium">
                            ≈${ticker ? formatPrice(ticker.lastPrice, pricePrecision) : '--'}
                            <span className={isPositive ? 'text-[var(--green)] ml-1' : 'text-[var(--red)] ml-1'}>
                                {ticker ? `${parseFloat(ticker.priceChangePercent) > 0 ? '+' : ''}${parseFloat(ticker.priceChangePercent).toFixed(2)}%` : ''}
                            </span>
                        </div>
                    </div>

                    {(() => {
                        const maxAmount = Math.max(...currentBids.map(b => b.amount), 1);

                        return (orderBookView === 'both' || orderBookView === 'buy') && (
                            <div className="flex flex-col flex-1 relative gap-[1px]">
                                {currentBids.map((bid: any, i: number) => (
                                    <div key={`bid-${i}`} className="flex justify-between relative h-[22px] items-center px-1 cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => {
                                        setPriceInput(formatInput(bid.price.toFixed(precisionDecimals)));
                                        setIsPriceAuto(false);
                                    }}>
                                        <div className="absolute right-0 top-0 h-full bg-[var(--green-bg)] transition-all duration-300" style={{ width: `${(bid.amount / maxAmount) * 100}%` }} />
                                        <span className="text-[var(--green)] font-medium relative z-10 text-[12px] tracking-tight">
                                            {formatPrice(bid.price, pricePrecision)}
                                        </span>
                                        <span className="text-[var(--text-secondary)] relative z-10 text-[12px] font-medium tracking-tight">
                                            {formatAbbreviated(bid.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {(() => {
                        let buyRatio = 50;
                        if (currentBids.length > 0 && currentAsks.length > 0) {
                            const totalBids = currentBids.reduce((acc, curr: any) => acc + curr.amount, 0);
                            const totalAsks = currentAsks.reduce((acc, curr: any) => acc + curr.amount, 0);
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
                                        className="h-full bg-[var(--green-bg)] transition-all duration-500 ease-in-out"
                                        style={{
                                            width: `${clampedBuyRatio}%`,
                                            clipPath: 'polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%)',
                                        }}
                                    />
                                    <div
                                        className="h-full bg-[var(--red-bg)] transition-all duration-500 ease-in-out"
                                        style={{
                                            width: `${clampedSellRatio}%`,
                                            clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%)',
                                        }}
                                    />
                                </div>

                                <div className="relative h-full flex items-center justify-between z-10 pointer-events-none">
                                    <div className="flex items-center h-full text-[var(--green)] font-medium text-[12px]">
                                        <div className="h-full w-[18px] flex items-center justify-center border border-[var(--green)] rounded-[4px] mr-1 text-[13px] bg-transparent font-medium">
                                            B
                                        </div>
                                        {Math.round(buyRatio)}%
                                    </div>

                                    <div className="flex items-center h-full text-[var(--red)] font-medium text-[12px]">
                                        {Math.round(sellRatio)}%
                                        <div className="h-full w-[18px] flex items-center justify-center border border-[var(--red)] rounded-[4px] ml-1 text-[13px] bg-transparent font-medium">
                                            S
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex items-center gap-1.5 px-1 mt-auto">
                        <div
                            className="flex-1 flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 h-[26px] rounded-[6px] text-[13px] font-semibold text-[var(--text-secondary)] cursor-pointer"
                            onClick={() => setIsPrecisionSheetOpen(true)}
                        >
                            {precision < 0.0001 ? precision.toFixed(8).replace(/\.?0+$/, "") : precision} <ArrowDropDown className="w-6 h-6 text-[var(--text-tertiary)]" />
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
            <div className="border-b border-[var(--border-color)] px-4 flex items-center justify-between sticky top-[52px] z-[90] bg-[var(--bg-primary)] h-[48px]" style={{ transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-full pr-10">
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'orders' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
                        onClick={() => {
                            setActiveTab('orders');
                            setSliderPercent(0);
                            setAmountInput('');
                        }}
                    >
                        <span className="text-[14px]">Orders ({
                            openOrders.filter(o => !isCurrentSymbolChecked || o.symbol === tradingSymbol).length +
                            spotTPSL.filter(s => !isCurrentSymbolChecked || s.symbol === baseCoin).length +
                            positions.filter(p => (!isCurrentSymbolChecked || p.symbol === tradingSymbol) && (p.tpPrice || p.slPrice)).length
                        })</span>
                        <ArrowDropDown className="w-[18px] h-[18px] mt-0.5" />
                    </div>
                    <div
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'positions' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
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
                        className={`flex items-center gap-1.5 h-full shrink-0 cursor-pointer transition-colors ${activeTab === 'bots' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}
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
                <div className="flex items-center h-full pl-2 bg-[var(--bg-primary)] relative cursor-pointer" onClick={() => setActivePage('trade-history')}>
                    <History className="w-[18px] h-[18px] text-[var(--text-primary)]" />
                </div>
            </div>

            {/* Control Row (Current symbol / Cancel all) - Root level for robust stickiness */}
            {(activeTab === 'orders' || activeTab === 'positions') && (
                <div className="px-4 py-2.5 flex items-center justify-between bg-[var(--bg-primary)] border-b border-[var(--border-color)] sticky top-[100px] z-[80]" style={{ transform: 'translateZ(0)' }}>
                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsCurrentSymbolChecked(!isCurrentSymbolChecked)}>
                        <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${isCurrentSymbolChecked ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]' : 'border-[var(--border-strong)] bg-[var(--bg-card)]'}`}>
                            {isCurrentSymbolChecked && <Check size={12} className="text-[var(--btn-primary-text)]" strokeWidth={3} />}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--text-secondary)]">Current symbol</span>
                    </label>
                    <button
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors ${(openOrders.length > 0 || spotTPSL.length > 0 || (activeTab === 'positions' && (positions.length > 0 || Object.keys(spotCostBasis).length > 0))) ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] active:bg-[var(--bg-hover)]' : 'bg-[var(--input-bg)] text-[var(--text-tertiary)] cursor-not-allowed'}`}
                        disabled={!(openOrders.length > 0 || spotTPSL.length > 0 || (activeTab === 'positions' && (positions.length > 0 || Object.keys(spotCostBasis).length > 0)))}
                        onClick={() => {
                            if (activeTab === 'positions') {
                                setIsCloseAllConfirmOpen(true);
                            } else {
                                cancelAllOrders(isCurrentSymbolChecked ? currentSymbol : undefined);
                            }
                        }}
                    >
                        {activeTab === 'positions' ? 'Close all' : 'Cancel all'}
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-screen relative z-0 bg-[var(--bg-primary)]">
                {activeTab === 'orders' && (
                    <div className="flex flex-col">

                        {/* Order Cards from Store */}
                        {openOrders
                            .filter(order => !isCurrentSymbolChecked || order.symbol === tradingSymbol)
                            .map((order) => (
                                <div key={order.id} className="p-4 border-b border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{order.symbol.replace('USDT', '/USDT')} <ChevronRight className="w-4 h-4 inline text-[var(--text-tertiary)]" /></h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FiEdit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                                            <span className="text-[var(--text-tertiary)] font-medium">|</span>
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Chase</span>
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer" onClick={() => cancelSpotOrder(order.id)}>Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="bg-[var(--green-bg)] text-[var(--green)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{order.type}</span>
                                        <span className={`${order.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{order.side}</span>
                                        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{order.marginMode} {order.leverage}x</span>
                                        <span className="text-[11px] text-[var(--text-tertiary)] font-medium ml-1">03/03, 03:04:03</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">Order amount ({order.symbol.replace('USDT', '')})</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{order.amount}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Filled ({order.symbol.replace('USDT', '')})</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{order.filled}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Order price</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{formatPrice(order.price)}</p>
                                        </div>
                                    </div>
                                    {(order.tpPrice || order.slPrice) && (
                                        <div className="mt-3 pt-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 rounded-lg p-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Attached TP/SL</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5">TP Trigger</p>
                                                    <p className="text-[13px] font-bold text-[var(--green)]">{order.tpPrice ? `${formatPrice(order.tpPrice)}` : '--'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5">SL Trigger</p>
                                                    <p className="text-[13px] font-bold text-[var(--red)]">{order.slPrice ? `${formatPrice(order.slPrice)}` : '--'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                        {/* TP/SL Triggers (Futures - Full) */}
                        {positions
                            .filter(p => (!isCurrentSymbolChecked || p.symbol === tradingSymbol) && (p.tpPrice || p.slPrice))
                            .map(p => (
                                <div key={`tpsl-fut-${p.id}`} className="p-4 border-b border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{p.symbol} Perp <ChevronRight className="w-4 h-4 inline text-[var(--text-tertiary)]" /></h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FiEdit2 className="w-4 h-4 text-[var(--text-secondary)]" onClick={() => setFuturesTPSLSheetOpen(true, p)} />
                                            <span className="text-[var(--text-tertiary)] font-medium">|</span>
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer" onClick={() => setFuturesTPSL(p.id, null, null)}>Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">TP/SL</span>
                                        <span className={`${p.side === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{p.side === 'Buy' ? 'Sell' : 'Buy'}</span>
                                        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{p.marginMode} {p.leverage}x</span>
                                        <span className="text-[11px] text-[var(--text-tertiary)] font-medium ml-1">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}, {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-y-4">
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">TP trigger</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{p.tpPrice ? `${p.tpPrice} (Last)` : '--'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">TP order</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">Market</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Order amount ({p.symbol.replace('1000', '').replace('USDT', '')})</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">All</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">SL trigger</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{p.slPrice ? `${p.slPrice} (Last)` : '--'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">SL order</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">Market</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* TP/SL Triggers (Futures - Partials) */}
                        {positions
                            .filter(p => !isCurrentSymbolChecked || p.symbol === tradingSymbol)
                            .flatMap(p => [
                                ...(p.tpOrders || []).map(tp => ({ ...tp, symbol: p.symbol, side: 'TP', positionSide: p.side })),
                                ...(p.slOrders || []).map(sl => ({ ...sl, symbol: p.symbol, side: 'SL', positionSide: p.side }))
                            ])
                            .map((trigger, idx) => (
                                <div key={`tpsl-p-${trigger.symbol}-${idx}`} className="p-4 border-b border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{trigger.symbol} Perp <ChevronRight className="w-4 h-4 inline text-[var(--text-tertiary)]" /></h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer">Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{trigger.side === 'TP' ? 'Partial TP' : 'Partial SL'}</span>
                                        <span className={`${trigger.positionSide === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{trigger.positionSide === 'Buy' ? 'Sell' : 'Buy'}</span>
                                        <span className="text-[11px] text-[var(--text-tertiary)] font-medium ml-1">Limit Order</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-y-4">
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">Trigger price</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{trigger.price}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Order type</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">Market</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Amount ({trigger.symbol.replace('USDT', '')})</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{trigger.amount}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* TP/SL Triggers (Spot) */}
                        {spotTPSL
                            .filter(s => !isCurrentSymbolChecked || s.symbol === baseCoin)
                            .map(s => (
                                <div key={`tpsl-spot-${s.symbol}`} className="p-4 border-b border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-[16px] font-bold text-[var(--text-primary)]">{s.symbol}/USDT <ChevronRight className="w-4 h-4 inline text-[var(--text-tertiary)]" /></h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FiEdit2 className="w-4 h-4 text-[var(--text-secondary)]" onClick={() => setSpotTPSLSheetOpen(true, { symbol: s.symbol, amount: s.amount })} />
                                            <span className="text-[var(--text-tertiary)] font-medium">|</span>
                                            <span className="text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer" onClick={() => setSpotTPSL(s.symbol, null, null, 0)}>Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">TP/SL</span>
                                        <span className="bg-[var(--red-bg)] text-[var(--red)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Sell</span>
                                        <span className="text-[11px] text-[var(--text-tertiary)] font-medium ml-1">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}, {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-y-4">
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">TP trigger</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{s.tpPrice ? `${s.tpPrice} (Last)` : '--'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">TP order</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">Market</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Order amount ({s.symbol})</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{s.amount}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] w-max">SL trigger</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">{s.slPrice ? `${s.slPrice} (Last)` : '--'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1 border-b border-dashed border-[var(--border-color)] mx-auto w-max">SL order</p>
                                            <p className="text-[15px] font-bold text-[var(--text-primary)]">Market</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Empty state placeholder if no orders */}
                        {(() => {
                            const filteredOrders = openOrders.filter(o => !isCurrentSymbolChecked || o.symbol === tradingSymbol);
                            const filteredSpotTPSL = spotTPSL.filter(s => !isCurrentSymbolChecked || s.symbol === baseCoin);
                            const filteredFuturesTPSL = positions.filter(p => !isCurrentSymbolChecked || p.symbol === tradingSymbol)
                                .some(p => p.tpPrice || p.slPrice || (p.tpOrders && p.tpOrders.length > 0) || (p.slOrders && p.slOrders.length > 0));

                            if (filteredOrders.length === 0 && filteredSpotTPSL.length === 0 && !filteredFuturesTPSL) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center relative mb-4">
                                    <div className="absolute -left-1 bottom-4 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                    <div className="absolute -left-1 bottom-9 w-5 h-4 bg-[#4a5568] rounded-[3px]" />
                                    <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-primary)] shadow-sm z-10">
                                        <span className="text-[var(--text-tertiary)] text-xl font-light">!</span>
                                    </div>
                                </div>
                                <span className="text-[14px] text-[var(--text-tertiary)] font-medium">No open orders</span>
                            </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {activeTab === 'positions' && (
                    <div className="flex flex-col">

                        <div className="p-4">
                            {/* Position Cards from Store */}
                            {assetFilter !== 'Assets' && positions
                                .filter(pos => !isCurrentSymbolChecked || pos.symbol === currentSymbol)
                                .map((pos) => (
                                    <div key={pos.id} className="mb-5 last:mb-0">
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between mb-1">
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                                                onClick={() => handleNavigateToTrade(pos.symbol.includes('USDT') ? pos.symbol : `${pos.symbol}USDT`, 'futures')}
                                            >
                                                <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{pos.symbol} Perp</h4>
                                                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium border-b border-dashed border-[var(--border-color)]">PnL (USDT)</p>
                                                <RiShare2Line
                                                    className="w-5 h-5 text-[var(--text-primary)] cursor-pointer active:scale-90 transition-transform"
                                                    onClick={() => setSharePnLSheetOpen(true, { symbol: pos.symbol, side: pos.side, isFutures: true, leverage: pos.leverage, entryPrice: pos.entryPrice, lastPrice: pos.markPrice, pnl: pos.pnl, pnlPercent: pos.pnlPercent })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`${pos.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{pos.side === 'Buy' ? 'Buy' : 'Sell'}</span>
                                                <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px] capitalize">{pos.marginMode}</span>
                                                <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px] flex items-center">
                                                    {pos.leverage}x <FiEdit2 className="ml-1 w-3 h-3" />
                                                </span>
                                                <div className="flex gap-[1px] ml-1">
                                                    {Array.from({ length: 5 }).map((_, i) => {
                                                        const pnlAbs = Math.abs(pos.pnlPercent);
                                                        const threshold = (i + 1) * 2; // Each bar represents 2%
                                                        const isActive = pnlAbs >= threshold || (i === 0 && pnlAbs > 0);
                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className={`w-[3px] h-3 ${isActive ? (pos.pnl >= 0 ? 'bg-[var(--green)]' : 'bg-[var(--red)]') : 'bg-[var(--bg-secondary)]'}`} 
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <p className={`text-[14px] font-semibold ${pos.pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                                            </p>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-3 gap-y-2 mb-3">
                                            <div>
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Size ({pos.symbol.replace('1000', '').replace('USDT', '')})</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.size}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max flex items-center gap-1">
                                                    Margin (USDT) <LuCirclePlus className="w-3 h-3" />
                                                </p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.margin.toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">MMR</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">
                                                    {((pos.size * pos.markPrice * 0.005) / pos.margin * 100).toFixed(2)}%
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Entry price</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{formatPrice(pos.entryPrice)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-var(--border-color) mx-auto w-max">Mark price</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{formatPrice(pos.markPrice)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-var(--border-color) ml-auto w-max">Liq. price</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{formatPrice(pos.liqPrice)}</p>
                                            </div>
                                        </div>

                                        {/* TP/SL Preview Row */}
                                        <div
                                            className="flex items-center justify-between py-1 mb-2 cursor-pointer hover:bg-black/5 rounded-md transition-colors"
                                            onClick={() => setFuturesTPSLSheetOpen(true, pos)}
                                        >
                                            <div className="flex items-center gap-1 text-[12px]">
                                                {(() => {
                                                    const tpCount = (pos.tpPrice ? 1 : 0) + (pos.tpOrders?.length || 0);
                                                    const slCount = (pos.slPrice ? 1 : 0) + (pos.slOrders?.length || 0);
                                                    const totalCount = tpCount + slCount;
                                                    
                                                    if (totalCount === 0) {
                                                        return <span className="text-[var(--text-tertiary)] font-medium">TP/SL not set</span>;
                                                    }
                                                    
                                                    return (
                                                        <>
                                                            <span className="text-[var(--text-tertiary)] font-medium">Partial position ({totalCount})</span>
                                                            <span className="text-[var(--green)]">{pos.tpPrice || (pos.tpOrders?.[0]?.price) || '--'}</span>
                                                            <span className="text-[var(--text-tertiary)]">/</span>
                                                            <span className="text-[var(--red)]">{pos.slPrice || (pos.slOrders?.[0]?.price) || '--'}</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        </div>

                                        {/* Actions Row */}
                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-[14px] hover:bg-gray-200 transition-colors"
                                                onClick={() => setFuturesTPSLSheetOpen(true, pos)}
                                            >
                                                TP/SL
                                            </button>
                                            <button
                                                className="flex-1 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-[14px] hover:bg-gray-200 transition-colors"
                                                onClick={() => {
                                                    setSelectedPositionForClose(pos);
                                                    setIsCloseSheetOpen(true);
                                                }}
                                            >
                                                Close
                                            </button>
                                            <button
                                                className="flex-1 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-[14px] hover:bg-gray-200 transition-colors whitespace-nowrap"
                                                onClick={() => {
                                                    setSelectedPositionForClose(pos);
                                                    setIsPositionCloseModalOpen(true);
                                                }}
                                            >
                                                Close all
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
                                            <div key="spot-USDT" className="mb-8 last:mb-0">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <CoinIcon symbol="USDT" size={6} />
                                                        <h4 className="text-[17px] font-bold text-[var(--text-primary)]">USDT</h4>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4 mb-3">
                                                    <div>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1">Equity</p>
                                                        <p className="text-[15px] font-medium text-[var(--text-primary)] tabular-nums">{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">${balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1">In use</p>
                                                        <p className="text-[15px] font-medium text-[var(--text-primary)] tabular-nums">0.00</p>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">$0.00</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1">Available</p>
                                                        <p className="text-[15px] font-medium text-[var(--text-primary)] tabular-nums">{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">${balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-1">Balance</p>
                                                        <p className="text-[15px] font-medium text-[var(--text-primary)] tabular-nums">{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <p className="text-[12px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">${balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
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
                                        <div key={`spot-${symbol}`} className="mb-5 last:mb-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                                                    onClick={() => handleNavigateToTrade(`${symbol}USDT`, 'spot')}
                                                >
                                                    <CoinIcon symbol={symbol} size={6} />
                                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                                                        {symbol} <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                    </h4>
                                                </div>
                                                {costPrice > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-[14px] font-semibold ${pnlAbsolute >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'} border-b border-dashed ${pnlAbsolute >= 0 ? 'border-[var(--green)]' : 'border-[var(--red)]'} pb-0.5`}>
                                                            {pnlAbsolute >= 0 ? '+' : ''}${Math.abs(pnlAbsolute).toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                        </p>
                                                        <RiShare2Line
                                                            className="w-5 h-5 text-[var(--text-primary)] cursor-pointer active:scale-90 transition-transform"
                                                            onClick={() => setSharePnLSheetOpen(true, { symbol, side: 'Buy', isFutures: false, entryPrice: costPrice, lastPrice, pnl: pnlAbsolute, pnlPercent })}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-y-2 mb-3">
                                                <div>
                                                    <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-0.5">Equity</p>
                                                    <p className="text-[14px] font-medium text-[var(--text-primary)] tabular-nums">{balance.toFixed(4)}</p>
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">${(balance * lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-0.5">Cost price</p>
                                                    <p
                                                        className="text-[14px] font-medium text-[var(--text-primary)] flex items-center justify-center gap-1 tabular-nums cursor-pointer hover:bg-[var(--bg-secondary)] rounded-md py-0.5 transition-colors"
                                                        onClick={() => setSpotCostPriceSheetOpen(true, { symbol, costPrice, balance })}
                                                    >
                                                        {costPrice > 0 ? (
                                                            <span>${formatPrice(costPrice)}</span>
                                                        ) : (
                                                            <span className="text-[var(--text-tertiary)] opacity-30 tracking-widest">____</span>
                                                        )}
                                                        <FiEdit2 className="w-3 h-3" />
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-0.5">Last price</p>
                                                    <p className="text-[14px] font-medium text-[var(--text-primary)] tabular-nums">${formatPrice(lastPrice)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] text-[var(--text-tertiary)] font-medium mb-0.5">Balance</p>
                                                    <p className="text-[14px] font-medium text-[var(--text-primary)] tabular-nums">{balance.toFixed(4)}</p>
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium tabular-nums mt-0.5">${(balance * lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>

                                            {spotTPSL.find(s => s.symbol === symbol) && (
                                                <div
                                                    className="flex items-center justify-between py-2 border-t border-[var(--border-color)] mb-4 cursor-pointer"
                                                    onClick={() => setSpotTPSLSheetOpen(true, { symbol, amount: balance })}
                                                >
                                                    <span className="text-[13px] text-[var(--text-tertiary)] font-medium">Entire position <span className="text-[var(--green)]">{spotTPSL.find(s => s.symbol === symbol)?.tpPrice || '--'}</span> / <span className="text-[var(--red)]">{spotTPSL.find(s => s.symbol === symbol)?.slPrice || '--'}</span></span>
                                                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                </div>
                                            )}

                                            <div className="flex gap-2.5">
                                                <button
                                                    className="flex-1 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-[14px]"
                                                    onClick={() => setSpotTPSLSheetOpen(true, { symbol, amount: balance })}
                                                >
                                                    TP/SL
                                                </button>
                                                <button
                                                    className="flex-1 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-[14px]"
                                                    onClick={() => setSpotTradeSheetOpen(true, { symbol, amount: balance })}
                                                >
                                                    Buy/sell
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {activeTab === 'bots' && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center relative mb-4">
                            <FileText className="w-8 h-8 text-[var(--text-tertiary)]" />
                        </div>
                        <span className="text-[14px] text-[var(--text-tertiary)] font-medium">No active bots</span>
                    </div>
                )}
            </div>

            {/* Mini Chart Drawer */}
            <div className={`fixed w-full max-w-md bg-[var(--bg-primary)] transition-all duration-300 border-t border-[var(--border-color)] z-[150] ${isMiniChartOpen ? 'h-[320px]' : 'h-[48px]'}`} style={{ bottom: 'calc(65px + var(--safe-area-bottom))' }}>
                <div
                    className="flex items-center justify-between px-4 cursor-pointer h-12 -mt-1"
                    onClick={() => setIsMiniChartOpen(!isMiniChartOpen)}
                >
                    <span className="text-[15px] font-bold text-[var(--text-primary)]">{currentSymbol.replace('USDT', '/USDT')} chart</span>
                    {isMiniChartOpen ? (
                        <PairChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                    ) : (
                        <LuChevronUp className="w-5 h-5 text-[var(--text-tertiary)]" />
                    )}
                </div>
                {isMiniChartOpen && (
                    <div className="px-1 pb-2 animate-in fade-in">
                        <div className="flex items-center gap-4 text-[13px] font-semibold text-[var(--text-secondary)] mb-2 border-b border-[var(--border-color)] px-3 pb-2">
                            {['5m', '15m', '1h', '4h'].map((int) => (
                                <span
                                    key={int}
                                    onClick={() => setActiveInterval(int)}
                                    className={`cursor-pointer transition-all ${activeInterval === int ? 'text-[var(--text-primary)] font-bold border-b-2 border-gray-900 pb-2 -mb-2' : ''}`}
                                >
                                    {int}
                                </span>
                            ))}
                            <span className="flex items-center gap-0.5">More <ArrowDropDown className="w-7 h-7" /></span>
                        </div>
                        <div className="h-[210px] w-full relative bg-[var(--bg-primary)] pb-10">
                            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-[0.05] pointer-events-none -translate-y-2">
                                <img src={trivLogo} alt="Triv" className="h-16" />
                            </div>
                            <RealChart data={klines} height={210} pricePrecision={pricePrecision} />
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
                            className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                            onClick={() => setIsPrecisionSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full mb-6" onClick={() => setIsPrecisionSheetOpen(false)} />
                                <div className="w-full flex flex-col gap-1">
                                    {dynamicPrecisions.map((val) => (
                                        <button
                                            key={val}
                                            className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${precision === val ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                                            onClick={() => {
                                                setPrecision(val);
                                                setIsPrecisionSheetOpen(false);
                                            }}
                                        >
                                            {val < 0.0001 ? val.toFixed(8).replace(/\.?0+$/, "") : val}
                                            {precision === val && (
                                                <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center">
                                                    <Check size={12} className="text-[var(--bg-primary)]" />
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
                            className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                            onClick={() => setIsOrderTypeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full mx-auto mb-6" />
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-[20px] font-semibold text-[var(--text-primary)]">Basic</span>
                                <Info className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </div>

                            <div className="flex flex-col gap-8">
                                <div
                                    className="flex items-start gap-4 cursor-pointer group"
                                    onClick={() => { setOrderType('Limit'); setIsOrderTypeSheetOpen(false); }}
                                >
                                    <div className="pt-1.5 min-w-[32px]">
                                        <svg width="32" height="20" viewBox="0 0 32 20">
                                            <line x1="0" y1="14" x2="10" y2="14" stroke="#9ca3af" strokeWidth="2" strokeDasharray="2,2" />
                                            <path d="M10 14 L16 8 L32 8" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                                            <circle cx="16" cy="8" r="3" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-[var(--text-primary)] mb-1">Limit order</h4>
                                        <p className="text-sm text-[var(--text-secondary)] font-normal leading-tight">Buy or sell at a specified price or better</p>
                                    </div>
                                    {orderType === 'Limit' && (
                                        <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-[var(--bg-primary)]" />
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
                                            <line x1="12" y1="12" x2="28" y2="4" stroke="var(--text-primary)" strokeWidth="2" />
                                            <circle cx="20" cy="8" r="3" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-[var(--text-primary)] mb-1">Market order</h4>
                                        <p className="text-sm text-[var(--text-secondary)] font-normal leading-tight">Promptly buy or sell at the best price in the current market</p>
                                    </div>
                                    {orderType === 'Market' && (
                                        <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-[var(--bg-primary)]" />
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
                                            <path d="M8 18 L16 10 L24 18" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                                            <circle cx="16" cy="10" r="3" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="2" />
                                            <circle cx="16" cy="18" r="3" fill="var(--bg-card)" stroke="var(--text-tertiary)" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-medium text-[var(--text-primary)] mb-1">TP/SL</h4>
                                        <p className="text-sm text-[var(--text-secondary)] font-normal leading-tight">Automatically place an order when the market price reaches the target price</p>
                                    </div>
                                    {orderType === 'TP/SL' && (
                                        <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center self-center">
                                            <Check size={12} className="text-[var(--bg-primary)]" />
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
                                className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                                onClick={() => setIsAssetFilterSheetOpen(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full mb-6" onClick={() => setIsAssetFilterSheetOpen(false)} />
                                    <div className="w-full flex flex-col gap-1">
                                        {['All', 'Positions', 'Assets'].map((filter) => (
                                            <button
                                                key={filter}
                                                className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${assetFilter === filter ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                                                onClick={() => {
                                                    setAssetFilter(filter as any);
                                                    setIsAssetFilterSheetOpen(false);
                                                }}
                                            >
                                                {filter}
                                                {assetFilter === filter && (
                                                    <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center">
                                                        <Check size={12} className="text-[var(--bg-primary)]" />
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
                side={(pendingOrder?.side || tradeSide) === 'buy' ? 'Buy' : 'Sell'}
                price={orderType === 'Market' ? 'Market' : formatPrice(pendingOrder?.p || 0)}
                amount={pendingOrder?.a || 0}
                total={formatPrice((pendingOrder?.p || currentPrice) * (pendingOrder?.a || 0))}
                type={activeTopTab === 'Futures' ? `Isolated-${orderType}` : orderType}
                isFutures={activeTopTab === 'Futures'}
                leverage={leverage}
                liqPrice={(pendingOrder?.side || tradeSide) === 'buy' ? formatPrice(liqPriceLong) : formatPrice(liqPriceShort)}
                priceGap={(((((pendingOrder?.side || tradeSide) === 'buy' ? liqPriceLong : liqPriceShort) / currentPrice) - 1) * 100).toFixed(2)}
                priceGapUsdt={formatPrice(((pendingOrder?.side || tradeSide) === 'buy' ? liqPriceLong : liqPriceShort) - currentPrice)}
                tpPrice={pendingOrder?.tpPrice ? formatPrice(pendingOrder.tpPrice) : undefined}
                slPrice={pendingOrder?.slPrice ? formatPrice(pendingOrder.slPrice) : undefined}
            />

            {/* Margin Mode Sheet */}
            <AnimatePresence>
                {isMarginModeSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[var(--overlay-bg)] z-[500]"
                            onClick={() => setIsMarginModeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-[24px] z-[501] px-6 pt-2 pb-10"
                        >
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full mx-auto mb-6" />
                            <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-6 px-1">Margin mode</h3>
                            <div className="flex flex-col gap-2">
                                {['Isolated', 'Cross'].map((mode) => (
                                    <button
                                        key={mode}
                                        className={`w-full py-2.5 rounded-lg text-[16px] font-medium flex items-center justify-between px-4 transition-colors ${marginMode === mode ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                                        onClick={() => { setMarginMode(mode as any); setIsMarginModeSheetOpen(false); }}
                                    >
                                        {mode}
                                        {marginMode === mode && (
                                            <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-white flex items-center justify-center">
                                                <Check size={12} className="text-[var(--bg-primary)]" />
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

            {/* TP/SL Sheets */}
            <FuturesTPSLSheet />
            <SpotTPSLSheet />
            <SpotCostPriceSheet />
            <SharePnLSheet />

            {/* Individual Position Close Components */}
            <FuturesCloseSheet
                isOpen={isCloseSheetOpen}
                onClose={() => setIsCloseSheetOpen(false)}
                position={selectedPositionForClose}
            />
            <FuturesCloseAllModal
                isOpen={isPositionCloseModalOpen}
                onClose={() => setIsPositionCloseModalOpen(false)}
                position={selectedPositionForClose}
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
                                className="fixed inset-0 bg-[var(--overlay-bg)] z-[1000]"
                                onClick={() => setIsCloseAllConfirmOpen(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                                animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                                exit={{ scale: 0.9, opacity: 0, x: '-50%', y: '-50%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed top-1/2 left-1/2 w-[90%] max-w-[340px] bg-[var(--bg-primary)] rounded-[24px] z-[1001] overflow-hidden"
                            >
                                <div className="p-6 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-[16px] leading-[1.4] text-[var(--text-primary)] font-medium px-2">
                                        Your positions will all be closed at <span className="font-bold">market price</span>, and any open orders (or reduce-only orders) will be canceled. Options won't be affected.
                                    </p>
                                </div>
                                <div className="flex border-t border-[var(--border-color)] h-14">
                                    <button
                                        className="flex-1 text-[16px] font-semibold text-[var(--text-primary)] border-r border-[var(--border-color)] active:bg-[var(--bg-hover)] transition-colors"
                                        onClick={() => setIsCloseAllConfirmOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 text-[16px] font-bold text-[var(--text-primary)] active:bg-[var(--bg-hover)] transition-colors"
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
