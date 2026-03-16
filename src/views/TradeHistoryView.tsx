// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiShare2 } from 'react-icons/fi';
import { LuCirclePlus, LuFileSearch as FileSearch } from 'react-icons/lu';
import { FiEdit2 } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown, MdOutlineVerticalAlignTop } from 'react-icons/md';
import { TbFilter2 } from 'react-icons/tb';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';

const TradeHistoryView = () => {
    const { setActivePage, openOrders, tradeHistory, positions, wallets, spotCostBasis, markets, positionHistory, cancelSpotOrder, closeFuturesPosition, ticker, spotTPSL, setFuturesTPSL, setSpotTPSL, setPositions } = useExchangeStore();
    const [activeTab, setActiveTab] = useState<'open_orders' | 'order_history' | 'positions_assets' | 'position_history' | 'trading_history' | 'bots'>('trading_history');
    const [posAssetFilter, setPosAssetFilter] = useState<'All' | 'Position' | 'Assets'>('All');
    const [openOrderFilter, setOpenOrderFilter] = useState<'All' | 'Futures' | 'Spot'>('All');

    const tabs = [
        { id: 'open_orders', label: 'Open orders' },
        { id: 'order_history', label: 'Order history' },
        { id: 'positions_assets', label: 'Positions & assets' },
        { id: 'position_history', label: 'Position history' },
        { id: 'trading_history', label: 'Trading history' },
        { id: 'bots', label: 'Ongoing bots' }
    ];

    const formatDateTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    // TRADING HISTORY: Menampilkan eksekusi (Fill Price, Fee, PnL)
    const renderTradingHistory = () => {
        const executions = tradeHistory.filter(t => t.status !== 'Canceled' && t.status !== 'Pending');

        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-[var(--text-secondary)] font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer">All assets <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer">Instrument <ChevronDown size={16} /></span>
                    </div>
                    <TbFilter2 size={18} className="text-[var(--text-primary)] cursor-pointer" />
                </div>
                <div>
                    {executions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-[var(--text-tertiary)] text-[14px]">
                            <FileSearch size={48} className="text-[var(--text-tertiary)] mb-2" />
                            No trading history
                        </div>
                    ) : executions.map((item, idx) => {
                        const isFutures = item.symbol.includes('Perp') || String(item.id).includes('TR-F') || item.type === 'Liquidation' || ['Take Profit', 'Stop Loss', 'Trailing Stop', 'Partial TP', 'Partial SL'].includes(item.type);
                        
                        return (
                            <div key={idx} className="px-4 py-4 border-b border-gray-50 flex flex-col relative last:border-b-0">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5 flex-1 line-clamp-1">
                                        <div className="relative">
                                            <CoinIcon symbol={item.symbol.replace('USDT', '')} size={5} className="!w-[18px] !h-[18px]" />
                                        </div>
                                        <span className="font-bold text-[17px] text-[var(--text-primary)] leading-none">{item.symbol.replace('USDT', '')} {isFutures ? 'Perp' : 'Spot'}</span>
                                    </div>
                                    <span className={`font-medium text-[15px] ${(item.pnl || 0) > 0 ? 'text-[var(--green)]' : ((item.pnl || 0) < 0 ? 'text-[var(--red)]' : 'text-[var(--text-primary)]')} whitespace-nowrap`}>
                                        {item.pnl !== undefined && item.pnl !== 0 ? (item.pnl > 0 ? '+' : '') + item.pnl.toFixed(4) : '--'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className={`${item.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]`}>{item.side}</span>
                                    <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{item.type || 'Market'}</span>
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-1">{formatDateTime(item.timestamp)}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-1">
                                    <div>
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Fill Price</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Filled Amount</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.amount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Fee</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.fee ? item.fee.toFixed(6) : '0.000000'}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    // ORDER HISTORY: Menampilkan niat/perintah (Status: Liquidated, Filled, Canceled, dsb)
    const renderOrderHistory = () => {
        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-[var(--text-secondary)] font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer text-[var(--text-primary)] font-medium">Instrument <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer text-[var(--text-tertiary)] font-medium">Status <ChevronDown size={16} /></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MdOutlineVerticalAlignTop className="w-4 h-4 rotate-180 text-[var(--text-primary)]" />
                    </div>
                </div>

                <div className="pb-4">
                    {tradeHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-[var(--text-tertiary)] text-[14px]">
                            <FileSearch size={48} className="text-[var(--text-tertiary)] mb-2" />
                            No order history
                        </div>
                    ) : tradeHistory.map((item, idx) => {
                        const isLiq = item.type?.toLowerCase() === 'liquidation';
                        const isCanceled = item.status === 'Canceled';
                        const statusText = isLiq ? 'Liquidated' : (isCanceled ? 'Canceled' : (item.status || 'Filled'));
                        const statusColor = isLiq ? 'text-[var(--red)]' : (isCanceled ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]');
                        
                        return (
                            <div key={idx} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{item.symbol}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[13px] font-medium ${statusColor}`}>{statusText}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <span className={`${item.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]`}>{item.side}</span>
                                    <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{item.type || 'Market'}</span>
                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(item.timestamp)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <div>
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 w-max border-b border-dashed border-[var(--border-color)]">Order amount</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.amount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 mx-auto w-max border-b border-dashed border-[var(--border-color)]">Filled amount</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{isCanceled ? '0' : item.amount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 ml-auto w-max border-b border-dashed border-[var(--border-color)]">Order price</p>
                                        <p className={`text-[14px] font-medium text-[var(--text-primary)]`}>{item.price}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const renderOpenOrders = () => {
        const filteredOrders = openOrders.filter(order => {
            const isFutures = (order as any).leverage !== undefined;
            if (openOrderFilter === 'Futures') return isFutures;
            if (openOrderFilter === 'Spot') return !isFutures;
            return true;
        });

        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-[var(--text-secondary)] font-medium h-12">
                    <div className="flex gap-4">
                        <span
                            onClick={() => setOpenOrderFilter(openOrderFilter === 'Futures' ? 'All' : 'Futures')}
                            className={`flex items-center gap-1 cursor-pointer font-medium ${openOrderFilter === 'Futures' || openOrderFilter === 'All' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                        >
                            Futures <ChevronDown size={16} />
                        </span>
                        <span
                            onClick={() => setOpenOrderFilter(openOrderFilter === 'Spot' ? 'All' : 'Spot')}
                            className={`flex items-center gap-1 cursor-pointer font-medium ${openOrderFilter === 'Spot' || openOrderFilter === 'All' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                        >
                            Spot <ChevronDown size={16} />
                        </span>
                    </div>
                </div>

                <div className="pb-4">
                    {filteredOrders.length === 0 && 
                     positions.filter(p => (p.tpPrice || p.slPrice) && (openOrderFilter === 'All' || openOrderFilter === 'Futures')).length === 0 &&
                     spotTPSL.filter(s => (s.tpPrice || s.slPrice) && (openOrderFilter === 'All' || openOrderFilter === 'Spot')).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-[var(--text-tertiary)] text-[14px]">
                            <FileSearch size={48} className="text-[var(--text-tertiary)] mb-2" />
                            No data
                        </div>
                    ) : (
                        <>
                            {/* Standard Limit Orders */}
                            {filteredOrders.map((order, idx) => (
                                <div key={order.id || idx} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <h4 className="text-[17px] font-bold text-[var(--text-primary)] flex items-center gap-1">{order.symbol.replace('USDT', '')} {(order as any).leverage ? 'Perp' : 'Spot'}</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => cancelSpotOrder(order.id)}>Cancel</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <span className={`${order.side === 'Buy' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]`}>{order.side}</span>
                                        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{order.type}</span>
                                        <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(order.timestamp || Date.now())}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div>
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 w-max border-b border-dashed border-[var(--border-color)]">Order amount</p>
                                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{order.amount}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 mx-auto w-max border-b border-dashed border-[var(--border-color)]">Filled</p>
                                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{order.filled || 0}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 ml-auto w-max border-b border-dashed border-[var(--border-color)]">Order price</p>
                                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{order.price}</p>
                                        </div>
                                    </div>
                                    {((order as any).tpPrice || (order as any).slPrice) && (
                                        <div className="mt-3 pt-3 border-t border-gray-50 flex gap-6">
                                            {(order as any).tpPrice && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-0.5">TP Trigger</span>
                                                    <span className="text-[13px] font-bold text-[var(--green)]">{(order as any).tpPrice}</span>
                                                </div>
                                            )}
                                            {(order as any).slPrice && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-0.5">SL Trigger</span>
                                                    <span className="text-[13px] font-bold text-[var(--red)]">{(order as any).slPrice}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Futures TP/SL Triggers */}
                            {(openOrderFilter === 'All' || openOrderFilter === 'Futures') && positions
                                .filter(p => p.tpPrice || p.slPrice)
                                .map(p => (
                                    <div key={`tpsl-fut-${p.id}`} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{p.symbol.replace('USDT', '')} Perp</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => setFuturesTPSL(p.id, null, null)}>Cancel</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">TP/SL</span>
                                            <span className={`${p.side === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{p.side === 'Buy' ? 'Sell' : 'Buy'}</span>
                                            <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{p.marginMode} {p.leverage}x</span>
                                            <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(Date.now())}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-4">
                                            <div>
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">TP trigger</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">{p.tpPrice ? `${p.tpPrice} (Last)` : '--'}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">SL trigger</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">{p.slPrice ? `${p.slPrice} (Last)` : '--'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Amount</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">All</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}


                            {/* Partial TP/SL Orders (Futures) */}
                            {(openOrderFilter === 'All' || openOrderFilter === 'Futures') && positions
                                .map(p => (
                                    <React.Fragment key={`partials-${p.id}`}>
                                        {(p.tpOrders || []).map((tp, tidx) => (
                                            <div key={`tp-partial-${p.id}-${tidx}`} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{p.symbol.replace('USDT', '')} Perp</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => {
                                                            const nextTp = p.tpOrders?.filter((_, i) => i !== tidx) || [];
                                                            setPositions(positions.map(pos => pos.id === p.id ? { ...pos, tpOrders: nextTp } : pos));
                                                        }}>Cancel</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <span className="bg-[#ccfbf1] text-[#0d9488] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Partial TP</span>
                                                    <span className={`${p.side === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{p.side === 'Buy' ? 'Sell' : 'Buy'}</span>
                                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(Date.now())}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4">
                                                    <div>
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Trigger price</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{tp.price} (Last)</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Amount</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{tp.amount}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(p.slOrders || []).map((sl, sidx) => (
                                            <div key={`sl-partial-${p.id}-${sidx}`} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{p.symbol.replace('USDT', '')} Perp</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => {
                                                            const nextSl = p.slOrders?.filter((_, i) => i !== sidx) || [];
                                                            setPositions(positions.map(pos => pos.id === p.id ? { ...pos, slOrders: nextSl } : pos));
                                                        }}>Cancel</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Partial SL</span>
                                                    <span className={`${p.side === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{p.side === 'Buy' ? 'Sell' : 'Buy'}</span>
                                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(Date.now())}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4">
                                                    <div>
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Trigger price</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{sl.price} (Last)</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Amount</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{sl.amount}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {p.trailingStop && (
                                            <div key={`trailing-${p.id}`} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{p.symbol.replace('USDT', '')} Perp</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => {
                                                            setPositions(positions.map(pos => pos.id === p.id ? { ...pos, trailingStop: undefined } : pos));
                                                        }}>Cancel</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <span className="bg-[#fef9c3] text-[#854d0e] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Trailing Stop</span>
                                                    <span className={`${p.side === 'Buy' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--green-bg)] text-[var(--green)]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{p.side === 'Buy' ? 'Sell' : 'Buy'}</span>
                                                    <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(Date.now())}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4">
                                                    <div>
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Activation</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{p.trailingStop.activationPrice}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Callback</p>
                                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{p.trailingStop.callbackRate}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}

                            {/* Spot TP/SL Triggers */}
                            {(openOrderFilter === 'All' || openOrderFilter === 'Spot') && spotTPSL
                                .map(s => (
                                    <div key={`tpsl-spot-${s.symbol}`} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{s.symbol}/USDT</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] font-medium text-[var(--text-primary)] cursor-pointer" onClick={() => setSpotTPSL(s.symbol, null, null, 0)}>Cancel</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">TP/SL</span>
                                            <span className="bg-[var(--red-bg)] text-[var(--red)] text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">Sell</span>
                                            <span className="text-[12px] text-[var(--text-tertiary)] font-medium ml-0.5">{formatDateTime(Date.now())}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-4">
                                            <div>
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">TP trigger</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">{s.tpPrice ? `${s.tpPrice} (Last)` : '--'}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">SL trigger</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">{s.slPrice ? `${s.slPrice} (Last)` : '--'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Amount</p>
                                                <p className="text-[14px] font-bold text-[var(--text-primary)]">{s.amount}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderPositionsAndAssets = () => {
        const filteredSpot = Object.entries(wallets.spot)
            .filter(([symbol, balance]) => {
                const hasCost = spotCostBasis?.[symbol] > 0;
                if (balance <= 0 && !hasCost) return false;
                return true;
            });

        const showPositions = posAssetFilter === 'All' || posAssetFilter === 'Position';
        const showAssets = posAssetFilter === 'All' || posAssetFilter === 'Assets';

        const totalItems = (showPositions ? positions.length : 0) + (showAssets ? filteredSpot.length : 0);

        return (
            <div className="flex flex-col bg-[var(--bg-secondary)] min-h-screen">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] text-[13px] text-[var(--text-secondary)] font-medium h-12 bg-[var(--bg-card)] sticky top-0 z-10">
                    <div className="flex gap-4">
                        <span
                            onClick={() => setPosAssetFilter(posAssetFilter === 'Position' ? 'All' : 'Position')}
                            className={`flex items-center gap-1 cursor-pointer font-medium ${posAssetFilter === 'Position' || posAssetFilter === 'All' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                        >
                            Position <ChevronDown size={16} />
                        </span>
                        <span
                            onClick={() => setPosAssetFilter(posAssetFilter === 'Assets' ? 'All' : 'Assets')}
                            className={`flex items-center gap-1 cursor-pointer font-medium ${posAssetFilter === 'Assets' || posAssetFilter === 'All' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                        >
                            Assets <ChevronDown size={16} />
                        </span>
                    </div>
                </div>

                <div className="p-2 gap-2 flex flex-col pb-4">
                    {totalItems === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-[var(--text-tertiary)] text-[14px]">
                            <FileSearch size={48} className="text-[var(--text-tertiary)] mb-2" />
                            No data
                        </div>
                    )}

                    {showPositions && positions.map((pos, idx) => (
                        <div key={pos.id || idx} className="bg-[var(--bg-primary)] rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                    <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{pos.pair} Perp</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium flex items-center gap-1 justify-end w-max ml-auto border-b border-dashed border-[var(--border-color)] pb-[1px]">PnL (USDT)</p>
                                    <p className={`text-[14px] font-medium ${(pos.pnl || 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                        {(pos.pnl || 0) >= 0 ? '+' : ''}{(pos.pnl || 0).toFixed(2)} ({(pos.pnlPercent || 0) >= 0 ? '+' : ''}{(pos.pnlPercent || 0).toFixed(2)}%)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-3">
                                <span className={`${pos.side === 'Buy' || pos.side === 'Long' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]`}>{pos.side}</span>
                                <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{pos.marginMode || 'Cross'}</span>
                                <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px] flex items-center">{pos.leverage}x <FiEdit2 className="ml-1 w-2.5 h-2.5" /></span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-2 mb-3">
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Size</p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.size}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max flex items-center">Margin (USDT) <LuCirclePlus className="ml-1 w-3.5 h-3.5 text-[var(--text-tertiary)]" /></p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.margin.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">MMR</p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{(100 / (pos.leverage || 1)).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Entry price</p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.entryPrice}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Mark price</p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.markPrice || pos.entryPrice}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Liq. price</p>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{pos.liqPrice?.toFixed(2) || '--'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[13px]">TP/SL</button>
                                <button className="flex-1 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[13px]" onClick={() => closeFuturesPosition(pos.id)}>Close</button>
                                <button className="flex-1 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[13px]" onClick={() => closeFuturesPosition(pos.id)}>Close all</button>
                            </div>
                        </div>
                    ))}

                    {showAssets && filteredSpot
                        .sort(([sA], [sB]) => {
                            if (sA === 'USDT') return 1;
                            if (sB === 'USDT') return -1;
                            const hasA = spotCostBasis?.[sA] > 0;
                            const hasB = spotCostBasis?.[sB] > 0;
                            if (hasA && !hasB) return -1;
                            if (!hasA && hasB) return 1;
                            return 0;
                        })
                        .map(([symbol, balance]) => {
                            const numBalance = balance as number;
                            if (symbol === 'USDT') {
                                return (
                                    <div key="spot-USDT" className="bg-[var(--bg-primary)] rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                                <h4 className="text-[17px] font-bold text-[var(--text-primary)]">USDT</h4>
                                                <span className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-[10px] font-medium px-1 rounded-sm ml-1">Wallet</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-2 mb-2">
                                            <div>
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Available (USDT)</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{numBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Value (USDT)</p>
                                                <p className="text-[14px] font-medium text-[var(--text-primary)]">{numBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Action</p>
                                                <button className="text-[13px] font-medium text-[var(--green)]">Deposit</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const marketSymbol = `${symbol}USDT`;
                            const market = markets.find(m => m.symbol === marketSymbol);
                            const lastPrice = market ? parseFloat(market.lastPrice) : (ticker?.lastPrice ? parseFloat(ticker.lastPrice) : 1);
                            const costPrice = spotCostBasis?.[symbol] || 0;
                            const pnlAbsolute = costPrice > 0 ? (lastPrice - costPrice) * numBalance : 0;
                            const pnlPercent = costPrice > 0 ? ((lastPrice - costPrice) / costPrice) * 100 : 0;
                            const hasTrade = costPrice > 0;

                            return (
                                <div key={`spot-${symbol}`} className="bg-[var(--bg-primary)] rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{symbol}/USDT</h4>
                                            <span className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-[10px] font-medium px-1 rounded-sm ml-1">Spot</span>
                                        </div>
                                        {hasTrade && (
                                            <div className="text-right">
                                                <p className="text-[11px] text-[var(--text-tertiary)] font-medium border-b border-dashed border-[var(--border-color)] w-max ml-auto text-right">PnL (USDT)</p>
                                                <p className={`text-[14px] font-medium ${pnlAbsolute >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                                    {pnlAbsolute >= 0 ? '+' : ''}{pnlAbsolute.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-y-2 mb-3 mt-1">
                                        <div>
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Amount ({symbol})</p>
                                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{numBalance.toFixed(4)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Value (USDT)</p>
                                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{(numBalance * lastPrice).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">{hasTrade ? 'Equity' : 'Action'}</p>
                                            {hasTrade ? <p className="text-[14px] font-medium text-[var(--text-primary)]">100%</p> : <button className="text-[13px] font-medium text-[var(--green)]">Trade</button>}
                                        </div>
                                        {hasTrade && (
                                            <>
                                                <div>
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Cost price</p>
                                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Last price</p>
                                                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{lastPrice.toLocaleString('en-US')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Action</p>
                                                     <button 
                                                        className="text-[13px] font-medium text-[var(--green)]"
                                                        onClick={() => setSpotTradeSheetOpen(true, asset)}
                                                    >
                                                        Buy/Sell
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {hasTrade && (
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[13px]">TP/SL</button>
                                             <button 
                                                className="flex-1 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[13px]" 
                                                onClick={() => setSpotTradeSheetOpen(true, asset)}
                                            >
                                                Sell
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    };

    const renderPositionHistory = () => {
        return (
            <div className="flex flex-col pb-4">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-[var(--text-secondary)] font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer text-[var(--text-primary)] font-medium">Instrument <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer text-[var(--text-tertiary)] font-medium">Symbol <ChevronDown size={16} /></span>
                    </div>
                    <MdOutlineVerticalAlignTop className="w-5 h-5 rotate-180 text-[var(--text-primary)]" />
                </div>

                <div>
                    {(!positionHistory || positionHistory.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-[var(--text-tertiary)] text-[14px]">
                            <FileSearch size={48} className="text-[var(--text-tertiary)] mb-2" />
                            No position history
                        </div>
                    ) : positionHistory.map((item, idx) => {
                        const isLiq = (item.pnlPercent || 0) <= -99;
                        
                        return (
                            <div key={item.id || idx} className="px-4 py-4 border-b border-gray-50 last:border-b-0">
                                <div className="flex items-center justify-between mb-1 border-b border-transparent">
                                    <div className="flex items-center gap-1">
                                        <h4 className="text-[17px] font-bold text-[var(--text-primary)]">{item.pair} Perp</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[13px] font-medium ${isLiq ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'}`}>{isLiq ? 'Liquidated' : 'Closed'}</span>
                                        <div className="p-1 -mr-1"><FiShare2 className="w-4 h-4 text-[var(--text-primary)]" /></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <span className={`${item.side === 'Buy' || item.side === 'Long' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'} text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]`}>{item.side}</span>
                                    <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{item.marginMode || 'Cross'}</span>
                                    <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-medium px-1.5 py-[2px] rounded-[2px]">{item.leverage}x</span>
                                </div>
                                <div className="grid grid-cols-3 gap-y-2 mb-3">
                                    <div>
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Entry price</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.entryPrice}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Realized PnL</p>
                                        <p className={`text-[14px] font-medium ${(item.pnl || 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{(item.pnl || 0) >= 0 ? '+' : ''}{(item.pnl || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Max held</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.size}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] w-max">Exit price</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.markPrice || item.entryPrice}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] mx-auto w-max">Realized PnL%</p>
                                        <p className={`text-[14px] font-medium ${(item.pnlPercent || 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{(item.pnlPercent || 0) >= 0 ? '+' : ''}{(item.pnlPercent || 0).toFixed(2)}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium mb-0.5 border-b border-dashed border-[var(--border-color)] ml-auto w-max">Closed size</p>
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.size}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5 mb-3 text-[12px] font-medium text-[var(--text-tertiary)]">
                                    <div className="w-full flex justify-between"><span>Time opened</span><span className="text-[var(--text-primary)]">{formatDateTime(item.timeOpened)}</span></div>
                                    <div className="w-full flex justify-between"><span>Time closed</span><span className="text-[var(--text-primary)]">{formatDateTime(item.timeClosed)}</span></div>
                                </div>
                                <button className="w-full py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-[14px]">Linked orders</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-[var(--bg-primary)] z-[300] flex flex-col pt-safe pb-0 w-full h-full text-[var(--text-primary)] font-sans overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)] z-20 shrink-0 h-[52px]">
                <button
                    onClick={() => setActivePage('trade')}
                    className="p-1 -ml-1 flex items-center justify-center text-[var(--text-primary)]"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[18px] text-[var(--text-primary)] absolute left-1/2 -translate-x-1/2 font-sans">
                    My trades
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex items-center px-4 border-b border-[var(--border-color)] overflow-x-auto no-scrollbar shrink-0 bg-[var(--bg-primary)] z-20 h-12 box-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 px-2 whitespace-nowrap text-[15px] mr-4 relative h-full flex items-center ${activeTab === tab.id ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] font-medium'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            <div className="flex-1 bg-[var(--bg-primary)] overflow-y-auto no-scrollbar pb-10">
                {activeTab === 'trading_history' && renderTradingHistory()}
                {activeTab === 'open_orders' && renderOpenOrders()}
                {activeTab === 'order_history' && renderOrderHistory()}
                {activeTab === 'positions_assets' && renderPositionsAndAssets()}
                {activeTab === 'position_history' && renderPositionHistory()}
                {activeTab === 'bots' && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <FileSearch size={48} className="text-[var(--text-tertiary)] mb-4" />
                        <span className="text-[14px] text-[var(--text-tertiary)] font-medium">No active bots</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TradeHistoryView;
