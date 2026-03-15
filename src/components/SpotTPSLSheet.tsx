import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX as Close, FiChevronRight as ChevronRight, FiInfo as Info } from 'react-icons/fi';
import useExchangeStore from '../stores/useExchangeStore';
import { formatPrice as globalFormatPrice, getPrecisionForPrice } from '../utils/format';
import CoinIcon from './CoinIcon';
import Decimal from 'decimal.js';

const SpotTPSLSheet = () => {
    const { 
        isSpotTPSLSheetOpen, 
        setSpotTPSLSheetOpen, 
        activeSpotTPSLAsset, 
        markets, 
        spotSymbols,
        marketConfigs,
        wallets, 
        setSpotTPSL,
        showToast 
    } = useExchangeStore();

    const [tpLimitOrder, setTpLimitOrder] = useState(false);
    const [slLimitOrder, setSlLimitOrder] = useState(false);
    const [tpTriggerPrice, setTpTriggerPrice] = useState('');
    const [slTriggerPrice, setSlTriggerPrice] = useState('');
    const [tpChangePercent, setTpChangePercent] = useState('');
    const [slChangePercent, setSlChangePercent] = useState('');
    const [amount, setAmount] = useState('');
    const [amountSlider, setAmountSlider] = useState(0);

    const symbol = activeSpotTPSLAsset ? `${activeSpotTPSLAsset.symbol}USDT` : '';
    const coin = activeSpotTPSLAsset?.symbol || '';
    
    const market = useMemo(() => markets.find(m => m.symbol === symbol), [markets, symbol]);
    const lastPrice = market ? parseFloat(market.lastPrice) : 0;
    const availableCoin = activeSpotTPSLAsset?.amount || 0;
    const costBasisValue = useExchangeStore.getState().spotCostBasis[activeSpotTPSLAsset?.symbol || ''] || lastPrice;

    const precision = useMemo(() => {
        // Use marketConfigs as primary if available
        if (marketConfigs[symbol]) {
            return marketConfigs[symbol].pricePrecision;
        }

        if (market?.pricePrecision) return market.pricePrecision;
        const symbolInfo = spotSymbols.find(s => s.symbol === symbol);
        if (symbolInfo?.pricePrecision) return symbolInfo.pricePrecision;
        return getPrecisionForPrice(lastPrice);
    }, [market, spotSymbols, symbol, lastPrice, marketConfigs]);
    const formatPrice = useCallback((price: number | string) => {
        return globalFormatPrice(price, precision);
    }, [precision]);

    const updateTPByPercent = useCallback((percent: number) => {
        setTpChangePercent(percent.toString());
        const trigger = new Decimal(costBasisValue).times(1 + percent / 100).toNumber();
        setTpTriggerPrice(formatPrice(trigger));
    }, [costBasisValue]);

    const updateSLByPercent = useCallback((percent: number) => {
        setSlChangePercent(percent.toString());
        const trigger = new Decimal(costBasisValue).times(1 - percent / 100).toNumber();
        setSlTriggerPrice(formatPrice(trigger));
    }, [costBasisValue]);

    const updateAmountByPercent = useCallback((percent: number) => {
        setAmountSlider(percent);
        setAmount((availableCoin * (percent / 100)).toFixed(8));
    }, [availableCoin]);

    useEffect(() => {
        if (isSpotTPSLSheetOpen) {
            setAmount('');
            setAmountSlider(0);
            setTpTriggerPrice('');
            setSlTriggerPrice('');
            setTpChangePercent('');
            setSlChangePercent('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSpotTPSLSheetOpen]);

    const handleConfirm = () => {
        if (!activeSpotTPSLAsset) return;
        
        const tp = tpTriggerPrice ? parseFloat(tpTriggerPrice) : null;
        const sl = slTriggerPrice ? parseFloat(slTriggerPrice) : null;
        const amt = amount ? parseFloat(amount) : 0;

        setSpotTPSL(activeSpotTPSLAsset.symbol, tp, sl, amt);
        showToast('TP/SL Set', `Take Profit and Stop Loss set for ${coin}`, 'success');
        setSpotTPSLSheetOpen(false);
    };

    return (
        <AnimatePresence>
            {isSpotTPSLSheetOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={() => setSpotTPSLSheetOpen(false)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] flex flex-col px-6 pt-2 pb-10 max-h-[85vh] overflow-y-auto no-scrollbar"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">TP/SL</h2>
                            <button onClick={() => setSpotTPSLSheetOpen(false)} className="text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] p-1 rounded-full transition-colors">
                                <Close size={24} />
                            </button>
                        </div>
                        <div className="text-[12px] font-bold text-[var(--text-primary)] mb-3 uppercase">{coin}/USDT</div>

                        {/* Price Stats */}
                        <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPrice(costBasisValue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Last price</span>
                                <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPrice(lastPrice)}</span>
                            </div>
                        </div>

                        {/* Take Profit Section */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[14px] font-bold text-[var(--text-primary)]">Take profit</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" checked={tpLimitOrder} onChange={() => setTpLimitOrder(!tpLimitOrder)} className="w-3.5 h-3.5 accent-[var(--green)]" />
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">Limit order</span>
                                </label>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-[1.5] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                    <input type="text" value={tpTriggerPrice} onChange={e => setTpTriggerPrice(e.target.value)} placeholder="Trigger price" className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:font-normal" />
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-bold">USDT</span>
                                </div>
                                <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                    <input type="text" value={tpChangePercent} onChange={e => setTpChangePercent(e.target.value)} placeholder="Change" className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full text-right placeholder:font-normal" />
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-bold ml-0.5">%</span>
                                </div>
                            </div>
                            {/* Percentage Slider TP */}
                            <div className="relative h-[20px] mb-4 flex items-center px-2">
                                <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                    <div className="h-full transition-all duration-75 bg-[var(--text-primary)]" style={{ width: `${(parseFloat(tpChangePercent) || 0) / 25 * 100}%` }} />
                                </div>
                                <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                    {[0, 5, 10, 15, 20, 25].map(val => (
                                        <div key={val} className="flex flex-col items-center relative">
                                            <div 
                                                onClick={() => updateTPByPercent(val)}
                                                className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 cursor-pointer pointer-events-auto bg-[var(--bg-primary)] ${(parseFloat(tpChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                            />
                                            <span className="text-[9px] text-[var(--text-tertiary)] font-medium absolute top-3.5 whitespace-nowrap">{val}%</span>
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="range" min="0" max="25" step="0.1"
                                    value={parseFloat(tpChangePercent) || 0} 
                                    onChange={e => updateTPByPercent(parseFloat(e.target.value))} 
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                />
                            </div>
                        </div>

                        {/* Stop Loss Section */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[14px] font-bold text-[var(--text-primary)]">Stop loss</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" checked={slLimitOrder} onChange={() => setSlLimitOrder(!slLimitOrder)} className="w-3.5 h-3.5 accent-[var(--red)]" />
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">Limit order</span>
                                </label>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-[1.5] bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                    <input type="text" value={slTriggerPrice} onChange={e => setSlTriggerPrice(e.target.value)} placeholder="Trigger price" className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:font-normal" />
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-bold">USDT</span>
                                </div>
                                <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 flex justify-between items-center h-[44px]">
                                    <input type="text" value={slChangePercent} onChange={e => setSlChangePercent(e.target.value)} placeholder="Change" className="bg-transparent text-[14px] font-bold text-[var(--text-primary)] outline-none w-full text-right placeholder:font-normal" />
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-bold ml-0.5">%</span>
                                </div>
                            </div>
                            {/* Percentage Slider SL */}
                            <div className="relative h-[20px] mb-4 flex items-center px-2">
                                <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                    <div className="h-full transition-all duration-75 bg-[var(--text-primary)]" style={{ width: `${(parseFloat(slChangePercent) || 0) / 10 * 100}%` }} />
                                </div>
                                <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                    {[0, 2, 4, 6, 8, 10].map(val => (
                                        <div key={val} className="flex flex-col items-center relative">
                                            <div 
                                                onClick={() => updateSLByPercent(val)}
                                                className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 cursor-pointer pointer-events-auto bg-[var(--bg-primary)] ${(parseFloat(slChangePercent) || 0) >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
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
                        <div className="mb-4">
                            <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col mb-2.5">
                                <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight mb-0.5">Amount ({coin})</span>
                                <div className="text-[15px] font-bold text-[var(--text-primary)]">{amountSlider}%</div>
                            </div>
                            {/* Amount Slider */}
                            <div className="relative h-[20px] mb-4 flex items-center px-2">
                                <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                    <div className="h-full transition-all duration-75 bg-[var(--text-primary)]" style={{ width: `${amountSlider}%` }} />
                                </div>
                                <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                    {[0, 25, 50, 75, 100].map(val => (
                                        <div 
                                            key={val} 
                                            onClick={() => updateAmountByPercent(val)}
                                            className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 cursor-pointer pointer-events-auto bg-[var(--bg-primary)] ${amountSlider >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`} 
                                        />
                                    ))}
                                </div>
                                <input 
                                    type="range" min="0" max="100" value={amountSlider} 
                                    onChange={e => updateAmountByPercent(parseInt(e.target.value))} 
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-50 left-0" 
                                />
                            </div>
                        </div>

                        {/* Stats & Button */}
                        <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase">Available</span>
                                <span className="text-[12px] font-bold text-[var(--text-primary)]">{availableCoin.toFixed(8)} {coin}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase">Max sell</span>
                                <span className="text-[12px] font-bold text-[var(--text-primary)]">{(availableCoin * lastPrice).toLocaleString(undefined, { maximumFractionDigits: 1 })} USDT</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleConfirm}
                            className="w-full py-3.5 bg-[var(--red)] text-white text-[16px] font-bold rounded-[24px] shadow-lg active:scale-[0.98] transition-all"
                        >
                            Sell {coin}
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SpotTPSLSheet;
