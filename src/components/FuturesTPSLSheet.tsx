import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX as Close, FiChevronRight as ChevronRight, FiInfo as Info } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import { getPrecisionForPrice } from '../utils/format';
import CoinIcon from './CoinIcon';
import Decimal from 'decimal.js';

const FuturesTPSLSheet = () => {
    const { 
        isFuturesTPSLSheetOpen, 
        setFuturesTPSLSheetOpen, 
        activeFuturesPosition, 
        futuresMarkets,
        futuresSymbols,
        setFuturesTPSL,
        showToast
    } = useExchangeStore();

    const [activeTab, setActiveTab] = useState<'partial' | 'entire' | 'trailing'>('partial');
    const [tpTriggerPrice, setTpTriggerPrice] = useState('');
    const [tpChangePercent, setTpChangePercent] = useState('');
    const [slTriggerPrice, setSlTriggerPrice] = useState('');
    const [slChangePercent, setSlChangePercent] = useState('');
    const [amountPercent, setAmountPercent] = useState(100);
    const [tpPriceType, setTpPriceType] = useState('Last');
    const [slPriceType, setSlPriceType] = useState('Last');
    const [variance, setVariance] = useState('');
    const [useActivationPrice, setUseActivationPrice] = useState(false);
    const [activationPrice, setActivationPrice] = useState('');

    const market = useMemo(() => 
        futuresMarkets.find(m => m.symbol === activeFuturesPosition?.symbol), 
        [futuresMarkets, activeFuturesPosition]
    );

    const currentMarkPrice = market ? parseFloat(market.lastPrice) : (activeFuturesPosition?.markPrice || 0);
    const entryPrice = activeFuturesPosition?.entryPrice || 0;
    const side = activeFuturesPosition?.side || 'Buy';
    
    useEffect(() => {
        if (isFuturesTPSLSheetOpen) {
            setTpTriggerPrice('');
            setSlTriggerPrice('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isFuturesTPSLSheetOpen]);

    const precision = useMemo(() => {
        if (market?.pricePrecision) return market.pricePrecision;
        const symbolInfo = futuresSymbols.find(s => s.symbol === activeFuturesPosition?.symbol);
        if (symbolInfo?.pricePrecision) return symbolInfo.pricePrecision;
        return getPrecisionForPrice(currentMarkPrice);
    }, [market, futuresSymbols, activeFuturesPosition?.symbol, currentMarkPrice]);

    const formatPrice = useCallback((price: number | string) => {
        if (typeof price === 'string') price = parseFloat(price);
        if (isNaN(price)) return '';
        return price.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
    }, [precision]);

    const isLong = side === 'Buy';

    const updateTPByPercent = useCallback((percent: number) => {
        setTpChangePercent(percent.toString());
        const trigger = new Decimal(entryPrice).times(1 + (isLong ? percent : -percent) / 100).toNumber();
        setTpTriggerPrice(formatPrice(trigger));
    }, [entryPrice, isLong, formatPrice]);

    const updateSLByPercent = useCallback((percent: number) => {
        setSlChangePercent(percent.toString());
        const trigger = new Decimal(entryPrice).times(1 + (isLong ? -percent : percent) / 100).toNumber();
        setSlTriggerPrice(formatPrice(trigger));
    }, [entryPrice, isLong, formatPrice]);

    const handleConfirm = () => {
        if (!activeFuturesPosition) return;

        const tp = tpTriggerPrice ? parseFloat(tpTriggerPrice) : null;
        const sl = slTriggerPrice ? parseFloat(slTriggerPrice) : null;

        setFuturesTPSL(activeFuturesPosition.id, tp, sl);
        showToast('TP/SL Activated', `Orders placed for ${activeFuturesPosition.symbol}`, 'success');
        setFuturesTPSLSheetOpen(false);
    };

    return (
        <AnimatePresence>
            {isFuturesTPSLSheetOpen && activeFuturesPosition && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={() => setFuturesTPSLSheetOpen(false)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] flex flex-col px-6 pt-2 pb-10 h-[750px]"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-1.5">
                            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">TP/SL</h2>
                            <button onClick={() => setFuturesTPSLSheetOpen(false)} className="text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] p-1 rounded-full transition-colors flex items-center justify-center">
                                <Close size={24} />
                            </button>
                        </div>

                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[15px] font-bold text-[var(--text-primary)] uppercase">{activeFuturesPosition.symbol} Perpetual</span>
                                <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${side === 'Buy' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'}`}>
                                    {side === 'Buy' ? 'Buy' : 'Sell'}
                                </span>
                                <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                    {activeFuturesPosition.leverage}x
                                </span>
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Entry price</span>
                                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPrice(entryPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Last price</span>
                                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPrice(currentMarkPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Est liquidation price</span>
                                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPrice(activeFuturesPosition.liqPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="text-[10px] text-[#f5a623] font-medium leading-[1.4] mb-3 px-0">
                            In a fast-moving market, it is not advised to set the SL trigger price close to the estimated liquidation price.
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] mb-3 relative">
                            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pr-10">
                                <button 
                                    onClick={() => setActiveTab('partial')}
                                    className={`pb-2.5 text-[14px] font-bold whitespace-nowrap transition-all relative ${activeTab === 'partial' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                                >
                                    Partial position
                                    {activeTab === 'partial' && <motion.div layoutId="futuresTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('entire')}
                                    className={`pb-2.5 text-[14px] font-bold whitespace-nowrap transition-all relative ${activeTab === 'entire' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                                >
                                    Entire position
                                    {activeTab === 'entire' && <motion.div layoutId="futuresTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('trailing')}
                                    className={`pb-2.5 text-[14px] font-bold whitespace-nowrap transition-all relative ${activeTab === 'trailing' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                                >
                                    Trailing stop
                                    {activeTab === 'trailing' && <motion.div layoutId="futuresTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />}
                                </button>
                            </div>
                            <div className="mb-2.5 text-[var(--text-tertiary)] flex items-center shrink-0">
                                <Info size={16} />
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1">
                            {activeTab === 'partial' && (
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    {/* TP Limit Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-1 cursor-pointer group">
                                                <span className="text-[14px] font-bold text-[var(--text-primary)]">TP limit</span>
                                                <div className="text-[var(--text-tertiary)] flex items-center">
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <input 
                                                    type="number" 
                                                    value={tpTriggerPrice} 
                                                    onChange={e => setTpTriggerPrice(e.target.value)} 
                                                    placeholder="Order price" 
                                                    className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:text-[var(--text-tertiary)] placeholder:font-normal" 
                                                />
                                                <span className="text-[12px] text-[var(--text-secondary)] font-bold ml-2">USDT</span>
                                            </div>
                                            <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Change</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <input 
                                                        type="number" 
                                                        value={tpChangePercent} 
                                                        onChange={e => updateTPByPercent(parseFloat(e.target.value) || 0)} 
                                                        className="bg-transparent text-[13px] font-bold text-[var(--text-primary)] outline-none w-8 text-right" 
                                                    />
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* TP Slider */}
                                        <div className="relative h-[20px] mb-5 flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${Math.min(100, (parseFloat(tpChangePercent) || 0) / 25 * 100)}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 5, 10, 15, 20, 25].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${(parseFloat(tpChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateTPByPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                        <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="25" step="0.5"
                                                value={parseFloat(tpChangePercent) || 0} 
                                                onChange={e => updateTPByPercent(parseFloat(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                    </div>

                                    {/* Stop Loss Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[14px] font-bold text-[var(--text-primary)]">Stop loss</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <div className="w-3.5 h-3.5 border border-[var(--border-strong)] rounded-[2px] flex items-center justify-center">
                                                    <input type="checkbox" className="hidden" />
                                                </div>
                                                <span className="text-[11px] text-[var(--text-secondary)] font-medium">Limit order</span>
                                            </label>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <input 
                                                    type="number" 
                                                    value={slTriggerPrice} 
                                                    onChange={e => setSlTriggerPrice(e.target.value)} 
                                                    placeholder="Trigger price" 
                                                    className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:text-[var(--text-tertiary)] placeholder:font-normal" 
                                                />
                                                <div className="flex items-center gap-0.5 ml-2">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Last</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Change</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <input 
                                                        type="number" 
                                                        value={slChangePercent} 
                                                        onChange={e => updateSLByPercent(parseFloat(e.target.value) || 0)} 
                                                        className="bg-transparent text-[13px] font-bold text-[var(--text-primary)] outline-none w-8 text-right" 
                                                    />
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* SL Slider */}
                                        <div className="relative h-[20px] mb-6 flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${Math.min(100, (parseFloat(slChangePercent) || 0) / 10 * 100)}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 2, 4, 6, 8, 10].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${(parseFloat(slChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateSLByPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                        <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" step="0.1"
                                                value={parseFloat(slChangePercent) || 0} 
                                                onChange={e => updateSLByPercent(parseFloat(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                    </div>

                                    {/* Amount Section */}
                                    <div>
                                        <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col mb-2.5">
                                            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight mb-0.5">Amount ({activeFuturesPosition.symbol.split('USDT')[0]})</span>
                                            <div className="text-[15px] font-bold text-[var(--text-primary)]">{amountPercent}%</div>
                                        </div>
                                        {/* Amount Slider */}
                                        <div className="relative h-[20px] flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${amountPercent}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 25, 50, 75, 100].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${amountPercent >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAmountPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="100"
                                                value={amountPercent} 
                                                onChange={e => setAmountPercent(parseInt(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                        <div className="space-y-1 mt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Size {activeFuturesPosition.size.toFixed(2)} {activeFuturesPosition.symbol.split('USDT')[0]}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Order amount {(activeFuturesPosition.size * amountPercent / 100).toFixed(2)} {activeFuturesPosition.symbol.split('USDT')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'entire' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* Entire Position Content */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[14px] font-bold text-[var(--text-primary)]">Take profit</span>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <input 
                                                    type="number" 
                                                    value={tpTriggerPrice} 
                                                    onChange={e => setTpTriggerPrice(e.target.value)} 
                                                    placeholder="Trigger price" 
                                                    className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:text-[var(--text-tertiary)] placeholder:font-normal" 
                                                />
                                                <div className="flex items-center gap-0.5 ml-2">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Last</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Change</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <input 
                                                        type="number" 
                                                        value={tpChangePercent} 
                                                        onChange={e => updateTPByPercent(parseFloat(e.target.value) || 0)} 
                                                        className="bg-transparent text-[13px] font-bold text-[var(--text-primary)] outline-none w-8 text-right" 
                                                    />
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* TP Slider */}
                                        <div className="relative h-[20px] mb-6 flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${Math.min(100, (parseFloat(tpChangePercent) || 0) / 25 * 100)}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 5, 10, 15, 20, 25].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${(parseFloat(tpChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateTPByPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                        <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="25" step="0.5"
                                                value={parseFloat(tpChangePercent) || 0} 
                                                onChange={e => updateTPByPercent(parseFloat(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                    </div>

                                    {/* Stop Loss Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[14px] font-bold text-[var(--text-primary)]">Stop loss</span>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <input 
                                                    type="number" 
                                                    value={slTriggerPrice} 
                                                    onChange={e => setSlTriggerPrice(e.target.value)} 
                                                    placeholder="Trigger price" 
                                                    className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:text-[var(--text-tertiary)] placeholder:font-normal" 
                                                />
                                                <div className="flex items-center gap-0.5 ml-2">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Last</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">Change</span>
                                                    <ChevronDown size={18} />
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <input 
                                                        type="number" 
                                                        value={slChangePercent} 
                                                        onChange={e => updateSLByPercent(parseFloat(e.target.value) || 0)} 
                                                        className="bg-transparent text-[13px] font-bold text-[var(--text-primary)] outline-none w-8 text-right" 
                                                    />
                                                    <span className="text-[12px] text-[var(--text-secondary)] font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* SL Slider */}
                                        <div className="relative h-[20px] mb-6 flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${Math.min(100, (parseFloat(slChangePercent) || 0) / 10 * 100)}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 2, 4, 6, 8, 10].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${(parseFloat(slChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateSLByPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                        <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" step="0.1"
                                                value={parseFloat(slChangePercent) || 0} 
                                                onChange={e => updateSLByPercent(parseFloat(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'trailing' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* Trailing Stop Content */}
                                    <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex justify-between items-center h-[44px]">
                                        <span className="text-[14px] font-bold text-[var(--text-primary)]">Percentage</span>
                                        <ChevronDown size={22} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-[1.8] bg-[var(--bg-secondary)] rounded-xl px-4 py-3 flex justify-between items-center h-[44px]">
                                            <input 
                                                type="number" 
                                                value={variance} 
                                                onChange={e => setVariance(e.target.value)} 
                                                placeholder="Variance" 
                                                className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:text-[var(--text-tertiary)] placeholder:font-normal" 
                                            />
                                            <span className="text-[13px] text-[var(--text-secondary)] font-bold">%</span>
                                        </div>
                                        <button onClick={() => setVariance('5')} className="flex-1 bg-[var(--bg-secondary)] rounded-xl h-[44px] text-[14px] font-bold text-[var(--text-primary)]">5%</button>
                                        <button onClick={() => setVariance('10')} className="flex-1 bg-[var(--bg-secondary)] rounded-xl h-[44px] text-[14px] font-bold text-[var(--text-primary)]">10%</button>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                        <div className={`w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-colors ${useActivationPrice ? 'bg-[var(--green)] border-[var(--green)]' : 'border-[var(--border-strong)] bg-transparent'}`}>
                                            <input type="checkbox" checked={useActivationPrice} onChange={e => setUseActivationPrice(e.target.checked)} className="hidden" />
                                            {useActivationPrice && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-[11px] text-[var(--text-secondary)] font-medium">Activation price</span>
                                    </label>
                                    
                                    {/* Amount Section */}
                                    <div className="pt-1">
                                        <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col mb-2.5">
                                            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-0.5">Amount ({activeFuturesPosition.symbol.split('USDT')[0]})</span>
                                            <div className="text-[15px] font-bold text-[var(--text-primary)]">{amountPercent}%</div>
                                        </div>
                                        {/* Amount Slider */}
                                        <div className="relative h-[20px] flex items-center px-2">
                                            <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                                <div 
                                                    className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" 
                                                    style={{ width: `${amountPercent}%` }} 
                                                />
                                            </div>
                                            <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                                {[0, 25, 50, 75, 100].map(val => (
                                                    <div key={val} className="flex flex-col items-center relative">
                                                        <div 
                                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${amountPercent >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAmountPercent(val);
                                                            }}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <input 
                                                type="range" min="0" max="100"
                                                value={amountPercent} 
                                                onChange={e => setAmountPercent(parseInt(e.target.value))} 
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                            />
                                        </div>
                                        <div className="space-y-1 mt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Size {activeFuturesPosition.size.toFixed(2)} {activeFuturesPosition.symbol.split('USDT')[0]}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Order amount {(activeFuturesPosition.size * amountPercent / 100).toFixed(2)} {activeFuturesPosition.symbol.split('USDT')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <div className="mt-4">
                            <button 
                                onClick={handleConfirm}
                                className="w-full py-3.5 bg-[var(--green)] text-white rounded-[24px] text-[16px] font-bold active:scale-[0.98] transition-all"
                            >
                                Confirm
                            </button>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FuturesTPSLSheet;
