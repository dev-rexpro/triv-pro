import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX as Close, FiChevronRight as ChevronRight, FiInfo as Info } from 'react-icons/fi';
import useExchangeStore from '../stores/useExchangeStore';
import { formatPrice } from '../utils/format';
import CoinIcon from './CoinIcon';
import Decimal from 'decimal.js';

const SpotTradeSheet = () => {
    const { 
        isSpotTradeSheetOpen, 
        setSpotTradeSheetOpen, 
        activeSpotAsset, 
        markets, 
        wallets, 
        placeSpotOrder,
        spotCostBasis
    } = useExchangeStore();

    const [side, setSide] = useState<'buy' | 'sell'>('sell');
    const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [sliderPercent, setSliderPercent] = useState(0);

    const symbol = activeSpotAsset ? `${activeSpotAsset.symbol}USDT` : 'BTCUSDT';
    const coin = activeSpotAsset?.symbol || 'BTC';
    
    const market = useMemo(() => markets.find(m => m.symbol === symbol), [markets, symbol]);
    const lastPrice = market ? parseFloat(market.lastPrice) : 0;
    const costPrice = activeSpotAsset ? (spotCostBasis[activeSpotAsset.symbol] || lastPrice) : 0;

    const availableUsdt = wallets.spot.USDT || 0;
    const availableCoin = activeSpotAsset?.amount || 0;

    useEffect(() => {
        if (isSpotTradeSheetOpen) {
            setPrice(lastPrice.toString());
            setAmount('');
            setSliderPercent(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSpotTradeSheetOpen, lastPrice]);

    const totalUsdt = useMemo(() => {
        const p = orderType === 'Market' ? lastPrice : parseFloat(price) || 0;
        const a = parseFloat(amount) || 0;
        return formatPrice(p * a);
    }, [orderType, lastPrice, price, amount]);

    const maxAmount = side === 'buy' 
        ? (lastPrice > 0 ? (availableUsdt / lastPrice) : 0)
        : availableCoin;

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setSliderPercent(val);
        const calculatedAmount = (maxAmount * (val / 100)).toFixed(side === 'buy' ? 6 : 4);
        setAmount(calculatedAmount === '0.000000' || calculatedAmount === '0.0000' ? '' : calculatedAmount);
    }, [maxAmount, side]);

    const updateAmountByPercent = useCallback((val: number) => {
        setSliderPercent(val);
        const calculatedAmount = (maxAmount * (val / 100)).toFixed(side === 'buy' ? 6 : 4);
        setAmount(calculatedAmount === '0.000000' || calculatedAmount === '0.0000' ? '' : calculatedAmount);
    }, [maxAmount, side]);

    const handleConfirm = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        if (orderType === 'Limit' && (!price || parseFloat(price) <= 0)) {
            const { showToast } = useExchangeStore.getState();
            showToast('Invalid Price', 'Please enter a valid limit price', 'error');
            return;
        }
        
        placeSpotOrder({
            symbol,
            side: side === 'buy' ? 'Buy' : 'Sell',
            type: orderType,
            price: orderType === 'Market' ? lastPrice : parseFloat(price),
            amount: parseFloat(amount),
            marginMode: 'isolated',
            leverage: 1
        });
        
        setSpotTradeSheetOpen(false);
    };

    return (
        <AnimatePresence>
            {isSpotTradeSheetOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[1000]"
                        onClick={() => setSpotTradeSheetOpen(false)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[1001] flex flex-col px-6 pt-2 pb-10 h-auto"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-1 bg-[var(--bg-secondary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[18px] font-bold text-[var(--text-primary)] uppercase">{coin}/USDT</h2>
                            <button onClick={() => setSpotTradeSheetOpen(false)} className="text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] p-1 rounded-full transition-colors flex items-center justify-center">
                                <Close size={24} />
                            </button>
                        </div>

                        {/* Price Stats */}
                        <div className="space-y-1.5 mb-3.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Cost price</span>
                                <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                    {formatPrice(costPrice)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Last price</span>
                                <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                    {formatPrice(lastPrice)}
                                </span>
                            </div>
                        </div>

                        {/* Side Tabs - Copied style from TradeView */}
                        <div className="flex rounded-[8px] bg-[var(--bg-secondary)] p-[3px] mb-3">
                            <button 
                                onClick={() => setSide('buy')}
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${side === 'buy' ? 'bg-[var(--green)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                            >
                                Buy
                            </button>
                            <button 
                                onClick={() => setSide('sell')}
                                className={`flex-1 py-1.5 text-[14px] font-bold rounded-[6px] transition-colors ${side === 'sell' ? 'bg-[var(--red)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                            >
                                Sell
                            </button>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-2 mb-3.5">
                            {/* Price Input */}
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col items-start h-[48px]">
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight mb-0.5">Price (USDT)</span>
                                    <input 
                                        type="number" 
                                        value={orderType === 'Market' ? '' : price}
                                        placeholder={orderType === 'Market' ? 'Market price' : 'Enter price'}
                                        disabled={orderType === 'Market'}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="bg-transparent text-[15px] font-bold text-[var(--text-primary)] outline-none w-full disabled:opacity-50 placeholder:font-normal"
                                    />
                                </div>
                                <button 
                                    onClick={() => setOrderType(orderType === 'Market' ? 'Limit' : 'Market')}
                                    className={`px-4 rounded-xl text-[14px] font-bold transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)] h-[48px]`}
                                >
                                    Market
                                </button>
                            </div>

                            {/* Amount & Total Inputs */}
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col items-start h-[48px] relative">
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight mb-0.5">Amount</span>
                                    <div className="flex items-center w-full">
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAmount(val);
                                                const num = parseFloat(val);
                                                if (num > 0 && maxAmount > 0) {
                                                    setSliderPercent(Math.min(100, (num / maxAmount) * 100));
                                                } else {
                                                    setSliderPercent(0);
                                                }
                                            }}
                                            placeholder="0.00"
                                            className="bg-transparent text-[15px] font-bold text-[var(--text-primary)] outline-none w-full placeholder:font-normal"
                                        />
                                        <span className="text-[13px] font-bold text-[var(--text-tertiary)] ml-1">{coin}</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-2 flex flex-col items-start h-[48px] relative">
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight mb-0.5">Total</span>
                                    <div className="flex items-center w-full">
                                        <div className="bg-transparent text-[15px] font-bold text-[var(--text-primary)] w-full truncate">{totalUsdt}</div>
                                        <span className="text-[13px] font-bold text-[var(--text-tertiary)] ml-1">USDT</span>
                                    </div>
                                </div>
                            </div>

                             {/* Slider - Copied style from TradeView */}
                             <div className="px-1 pt-2 pb-1 mb-2">
                                <div className="relative h-[20px] flex items-center px-2">
                                    <div className="absolute left-2 right-2 h-[2px] bg-[var(--border-strong)]/30 rounded-full">
                                        <div className="h-full transition-all duration-75 bg-[var(--text-primary)] rounded-full" style={{ width: `${sliderPercent}%` }} />
                                    </div>
                                    <div className="absolute left-2 right-2 flex justify-between items-center h-full z-40 pointer-events-none">
                                        {[0, 25, 50, 75, 100].map(val => (
                                            <div
                                                key={val}
                                                className={`w-2 h-2 rounded-full border-2 z-50 transition-colors duration-75 bg-[var(--bg-primary)] ${sliderPercent >= val ? 'border-[var(--text-primary)]' : 'border-[var(--border-strong)]'}`}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={sliderPercent}
                                        onChange={handleSliderChange}
                                        className="absolute w-full h-full opacity-0 cursor-pointer z-30 left-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Available & Max */}
                        <div className="space-y-1 mb-3.5 px-0.5">
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-tight">Available</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {side === 'buy' 
                                        ? `${availableUsdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USDT`
                                        : `${availableCoin.toFixed(8)} ${coin}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-tight">Max {side}</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {side === 'buy' ? coin : 'USDT'}
                                </span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button 
                            onClick={handleConfirm}
                            disabled={!amount || parseFloat(amount) <= 0}
                            className={`w-full py-3.5 rounded-[24px] text-[16px] font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${side === 'buy' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`}
                        >
                            {side === 'buy' ? `Buy ${coin}` : `Sell ${coin}`}
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SpotTradeSheet;
