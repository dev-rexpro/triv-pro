// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiShare2 } from 'react-icons/fi';
import { LuCirclePlus, LuFileSearch as FileSearch } from 'react-icons/lu';
import { FiEdit2 } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown, MdOutlineVerticalAlignTop } from 'react-icons/md';
import { TbFilter2 } from 'react-icons/tb';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';

const TradeHistoryView = () => {
    const { setActivePage, openOrders, tradeHistory, positions, wallets, spotCostBasis, markets, positionHistory, cancelSpotOrder, closeFuturesPosition, ticker } = useExchangeStore();
    // Default tab matches the first screenshot's active tab or "Trading history"
    const [activeTab, setActiveTab] = useState<'open_orders' | 'order_history' | 'positions_assets' | 'position_history' | 'trading_history' | 'bots'>('trading_history');
    const [subTab, setSubTab] = useState<'All' | 'Limit' | 'Market' | 'Advanced' | 'TP_SL' | 'Trailing'>('All');
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

    const currentSymbol = 'BTCUSDT'; // Mocking or pulling from elsewhere if needed, but history usually shows all.
    const baseCoin = 'BTC';

    const formatDateTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const renderTradingHistory = () => {
        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-gray-500 font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer">All assets <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer">Instrument <ChevronDown size={16} /></span>
                    </div>
                    <TbFilter2 size={18} className="text-gray-900 cursor-pointer" />
                </div>
                <div>
                    {tradeHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-gray-400 text-[14px]">
                            <FileSearch size={48} className="text-gray-300 mb-2" />
                            No trading history
                        </div>
                    ) : tradeHistory.map((item, idx) => (
                        <div key={idx} className="px-4 py-4 border-b border-gray-50 flex flex-col gap-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-1.5 flex-1 line-clamp-1">
                                    <div className="relative">
                                        <CoinIcon symbol={item.symbol.replace('USDT', '')} size={5} className="!w-[18px] !h-[18px]" />
                                    </div>
                                    <span className="font-bold text-[15px] text-gray-900 leading-none">{item.symbol.replace('USDT', '')}</span>
                                </div>
                                <span className={`font-bold text-[15px] ${item.pnl > 0 ? 'text-[#20b26c]' : (item.pnl < 0 ? 'text-[#ef454a]' : 'text-gray-900')} whitespace-nowrap`}>
                                    {item.pnl !== undefined ? item.pnl.toFixed(4) : '0.0000'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                                    <span className="font-bold text-[13px] text-gray-900">{item.symbol}</span>
                                </div>
                                <div className="text-[12px] text-gray-400 font-medium flex items-center gap-1 whitespace-nowrap">
                                    Fee <span className="text-[#ef454a]">{item.fee ? item.fee.toFixed(8) : '0.00000000'}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-[12px] font-medium text-gray-800">
                                    Spot/Perp - <span className={item.side === 'Buy' ? 'text-[#20b26c]' : 'text-[#ef454a]'}>{item.side}</span> <span className="text-gray-400 font-normal">{item.amount}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[12px] text-gray-400 mt-1">
                                <span>{formatDateTime(item.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderOpenOrders = () => {
        const filteredOrders = openOrders.filter(order => {
            const isFutures = (order as any).leverage > 1;
            if (openOrderFilter === 'Futures') return isFutures;
            if (openOrderFilter === 'Spot') return !isFutures;
            return true;
        });

        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-gray-500 font-medium h-12">
                    <div className="flex gap-4">
                        <span
                            onClick={() => setOpenOrderFilter(openOrderFilter === 'Futures' ? 'All' : 'Futures')}
                            className={`flex items-center gap-1 cursor-pointer font-bold ${openOrderFilter === 'Futures' || openOrderFilter === 'All' ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                            Futures <ChevronDown size={16} />
                        </span>
                        <span
                            onClick={() => setOpenOrderFilter(openOrderFilter === 'Spot' ? 'All' : 'Spot')}
                            className={`flex items-center gap-1 cursor-pointer font-bold ${openOrderFilter === 'Spot' || openOrderFilter === 'All' ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                            Spot <ChevronDown size={16} />
                        </span>
                    </div>
                </div>

                <div className="pb-4">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-gray-400 text-[14px]">
                            <FileSearch size={48} className="text-gray-300 mb-2" />
                            No data
                        </div>
                    ) : filteredOrders.map((order, idx) => (
                        <div key={order.id || idx} className="px-4 py-4 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1">
                                    <h4 className="text-[16px] font-bold text-gray-900 flex items-center gap-1">{order.symbol}</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[14px] font-bold text-gray-900 cursor-pointer" onClick={() => cancelSpotOrder(order.id)}>Cancel</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-4 mt-2">
                                <span className={`${order.type === 'Limit' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{order.type}</span>
                                <span className={`${order.side === 'Buy' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{order.side}</span>
                                <span className="text-[12px] text-gray-400 font-medium ml-1">{formatDateTime(order.timestamp || Date.now())}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <div>
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 w-max border-b border-dashed border-gray-200">Order amount</p>
                                    <p className="text-[15px] font-bold text-gray-900">{order.amount}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 mx-auto w-max border-b border-dashed border-gray-200">Filled</p>
                                    <p className="text-[15px] font-bold text-gray-900">{order.filled || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 ml-auto w-max border-b border-dashed border-gray-200">Order price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{order.price}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderOrderHistory = () => {
        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-gray-500 font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer text-gray-900 font-bold">Instrument <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer text-gray-400 font-bold">Symbol <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer text-gray-900 font-bold">Last 90 days <ChevronDown size={16} /></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MdOutlineVerticalAlignTop className="w-4 h-4 rotate-180 text-gray-900" />
                    </div>
                </div>

                <div className="pb-4">
                    {tradeHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-gray-400 text-[14px]">
                            <FileSearch size={48} className="text-gray-300 mb-2" />
                            No order history
                        </div>
                    ) : tradeHistory.map((item, idx) => (
                        <div key={idx} className="px-4 py-5 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[16px] font-bold text-gray-900">{item.symbol}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-gray-500">{item.status || 'Filled'}</span>
                                    {item.type?.toLowerCase() === 'liquidation' && <span className="p-1"><FiShare2 className="w-3.5 h-3.5 text-gray-900" /></span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-5 mt-1">
                                <span className={`${item.type === 'Market' || item.type === 'Liquidation' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{item.type || 'Market'}</span>
                                <span className={`${item.side === 'Buy' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{item.side}</span>
                                <span className="text-[12px] text-gray-400 font-medium ml-1">{formatDateTime(item.timestamp)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <div>
                                    <p className={`text-[12px] text-gray-400 font-medium mb-1 w-max ${item.type?.toLowerCase() === 'liquidation' ? '' : 'border-b border-dashed border-gray-200'}`}>{item.type?.toLowerCase() === 'liquidation' ? 'Liquidated' : `Order amount`}</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.amount}</p>
                                </div>
                                <div className={item.type?.toLowerCase() === 'liquidation' ? 'text-left' : 'text-center'}>
                                    <p className={`text-[12px] text-gray-400 font-medium mb-1 w-max ${item.type?.toLowerCase() === 'liquidation' ? '' : 'mx-auto border-b border-dashed border-gray-200'}`}>{item.type?.toLowerCase() === 'liquidation' ? 'Liq. price' : `Filled`}</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.type?.toLowerCase() === 'liquidation' ? item.price : item.amount}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[12px] text-gray-400 font-medium mb-1 ml-auto w-max ${item.type?.toLowerCase() === 'liquidation' ? '' : 'border-b border-dashed border-gray-200'}`}>{item.type?.toLowerCase() === 'liquidation' ? 'Closed PnL' : 'Fill price'}</p>
                                    <p className={`text-[15px] font-bold ${item.type?.toLowerCase() === 'liquidation' ? 'text-[#ef454a]' : 'text-gray-900'}`}>{item.type?.toLowerCase() === 'liquidation' ? item.pnl?.toFixed(2) : item.price}</p>
                                </div>
                            </div>
                        </div>
                    ))}
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
            <div className="flex flex-col bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 text-[13px] text-gray-500 font-medium h-12 bg-white sticky top-0 z-10">
                    <div className="flex gap-4">
                        <span
                            onClick={() => setPosAssetFilter(posAssetFilter === 'Position' ? 'All' : 'Position')}
                            className={`flex items-center gap-1 cursor-pointer font-bold ${posAssetFilter === 'Position' || posAssetFilter === 'All' ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                            Position <ChevronDown size={16} />
                        </span>
                        <span
                            onClick={() => setPosAssetFilter(posAssetFilter === 'Assets' ? 'All' : 'Assets')}
                            className={`flex items-center gap-1 cursor-pointer font-bold ${posAssetFilter === 'Assets' || posAssetFilter === 'All' ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                            Assets <ChevronDown size={16} />
                        </span>
                    </div>
                </div>

                <div className="p-2 gap-2 flex flex-col pb-4">
                    {totalItems === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-gray-400 text-[14px]">
                            <FileSearch size={48} className="text-gray-300 mb-2" />
                            No data
                        </div>
                    )}

                    {showPositions && positions.map((pos, idx) => (
                        <div key={pos.id || idx} className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1">
                                    <h4 className="text-[16px] font-bold text-gray-900">{pos.pair}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium flex items-center gap-1 justify-end w-max ml-auto border-b border-dashed border-gray-200 pb-[1px]">PnL (USDT) <FiShare2 className="w-3 h-3 text-gray-900 mb-0.5" /></p>
                                    <p className={`text-[16px] font-bold ${(pos.pnl || 0) >= 0 ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>
                                        {(pos.pnl || 0) >= 0 ? '+' : ''}{(pos.pnl || 0).toFixed(2)} ({(pos.pnlPercent || 0) >= 0 ? '+' : ''}{(pos.pnlPercent || 0).toFixed(2)}%)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-5 -mt-2">
                                <span className={`${pos.side === 'Buy' || pos.side === 'Long' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{pos.side}</span>
                                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{pos.marginMode || 'Cross'}</span>
                                <span className="bg-gray-100 text-gray-900 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px] flex items-center">{pos.leverage}x <FiEdit2 className="ml-1 w-2.5 h-2.5" /></span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-4 mb-5">
                                <div>
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Size</p>
                                    <p className="text-[15px] font-bold text-gray-900">{pos.size}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max flex items-center">Margin (USDT) <LuCirclePlus className="ml-1 w-3.5 h-3.5 text-gray-400" /></p>
                                    <p className="text-[15px] font-bold text-gray-900">{pos.margin.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">MMR</p>
                                    <p className="text-[15px] font-bold text-gray-900">{(100 / (pos.leverage || 1)).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Entry price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{pos.entryPrice}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Mark price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{pos.markPrice || pos.entryPrice}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Liq. price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{pos.liqPrice?.toFixed(2) || '--'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 rounded-full bg-gray-100 text-gray-900 font-bold text-[13px]">TP/SL</button>
                                <button className="flex-1 py-2 rounded-full bg-gray-100 text-gray-900 font-bold text-[13px]" onClick={() => closeFuturesPosition(pos.id)}>Close</button>
                                <button className="flex-1 py-2 rounded-full bg-gray-100 text-gray-900 font-bold text-[13px]" onClick={() => closeFuturesPosition(pos.id)}>Close all</button>
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
                                    <div key="spot-USDT" className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1">
                                                <h4 className="text-[16px] font-bold text-gray-900">USDT</h4>
                                                <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-1 rounded-sm ml-1">Wallet</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-4 mb-2">
                                            <div>
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Available (USDT)</p>
                                                <p className="text-[15px] font-bold text-gray-900">{numBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Value (USDT)</p>
                                                <p className="text-[15px] font-bold text-gray-900">{numBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
                            const lastPrice = market ? parseFloat(market.lastPrice) : (ticker?.lastPrice ? parseFloat(ticker.lastPrice) : 1);
                            const costPrice = spotCostBasis?.[symbol] || 0;
                            const pnlAbsolute = costPrice > 0 ? (lastPrice - costPrice) * numBalance : 0;
                            const pnlPercent = costPrice > 0 ? ((lastPrice - costPrice) / costPrice) * 100 : 0;
                            const hasTrade = costPrice > 0;

                            return (
                                <div key={`spot-${symbol}`} className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1">
                                            <h4 className="text-[16px] font-bold text-gray-900">{symbol}/USDT</h4>
                                            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-1 rounded-sm ml-1">Spot</span>
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
                                    <div className="grid grid-cols-3 gap-y-4 mb-4 mt-2">
                                        <div>
                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Amount ({symbol})</p>
                                            <p className="text-[15px] font-bold text-gray-900">{numBalance.toFixed(4)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Value (USDT)</p>
                                            <p className="text-[15px] font-bold text-gray-900">{(numBalance * lastPrice).toFixed(2)}</p>
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
                                            <button className="flex-1 py-2 rounded-full bg-gray-100 text-gray-900 font-bold text-[13px]">TP/SL</button>
                                            <button className="flex-1 py-2 rounded-full bg-gray-100 text-gray-900 font-bold text-[13px]" onClick={() => cancelSpotOrder(symbol)}>Sell</button>
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
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-[13px] text-gray-500 font-medium h-12">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 cursor-pointer text-gray-900 font-bold">Instrument <ChevronDown size={16} /></span>
                        <span className="flex items-center gap-1 cursor-pointer text-gray-400 font-bold">Symbol <ChevronDown size={16} /></span>
                    </div>
                    <MdOutlineVerticalAlignTop className="w-5 h-5 rotate-180 text-gray-900" />
                </div>

                <div>
                    {(!positionHistory || positionHistory.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-gray-400 text-[14px]">
                            <FileSearch size={48} className="text-gray-300 mb-2" />
                            No position history
                        </div>
                    ) : positionHistory.map((item, idx) => (
                        <div key={item.id || idx} className="px-4 py-5 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-3 border-b border-transparent">
                                <div className="flex items-center gap-1">
                                    <h4 className="text-[16px] font-bold text-gray-900">{item.pair}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-gray-500">Closed</span>
                                    <div className="p-1 -mr-1"><FiShare2 className="w-4 h-4 text-gray-900" /></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-5 mt-1">
                                <span className={`${item.side === 'Buy' || item.side === 'Long' ? 'bg-[#e5f7ed] text-[#20b26c]' : 'bg-[#fdeaea] text-[#ef454a]'} text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]`}>{item.side}</span>
                                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{item.marginMode || 'Cross'}</span>
                                <span className="bg-gray-100 text-gray-900 text-[11px] font-bold px-1.5 py-[2px] rounded-[2px]">{item.leverage}x</span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-4 mb-4">
                                <div>
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Entry price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.entryPrice}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Realized PnL (USDT)</p>
                                    <p className={`text-[15px] font-bold ${(item.pnl || 0) >= 0 ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>{(item.pnl || 0) >= 0 ? '+' : ''}{(item.pnl || 0).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Max held</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.size}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 w-max">Exit price</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.markPrice || item.entryPrice}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 mx-auto w-max">Realized PnL%</p>
                                    <p className={`text-[15px] font-bold ${(item.pnlPercent || 0) >= 0 ? 'text-[#20b26c]' : 'text-[#ef454a]'}`}>{(item.pnlPercent || 0) >= 0 ? '+' : ''}{(item.pnlPercent || 0).toFixed(2)}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-400 font-medium mb-1 border-b border-dashed border-gray-200 ml-auto w-max">Closed size</p>
                                    <p className="text-[15px] font-bold text-gray-900">{item.size}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 mb-4 text-[13px] font-medium text-gray-400 mt-2">
                                <div className="w-full flex justify-between"><span>Time opened</span><span className="text-gray-900">{formatDateTime(item.timeOpened)}</span></div>
                                <div className="w-full flex justify-between mt-0.5"><span>Closed</span><span className="text-gray-900">{formatDateTime(item.timeClosed)}</span></div>
                            </div>
                            <button className="w-full py-2.5 rounded-full bg-gray-50 text-gray-900 font-bold text-[14px]">Linked orders</button>
                        </div>
                    ))}
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
            className="fixed inset-0 bg-white z-[300] flex flex-col pt-safe pb-0 w-full h-full text-gray-900 font-sans overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white z-20 shrink-0 h-[52px]">
                <button
                    onClick={() => setActivePage('trade')}
                    className="p-1 -ml-1 flex items-center justify-center text-gray-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[18px] text-gray-900 absolute left-1/2 -translate-x-1/2">
                    My trades
                </div>
                <div className="w-8"></div>
            </div>

            {/* Scrollable Tabs */}
            <div className="flex items-center px-4 border-b border-gray-100 overflow-x-auto no-scrollbar shrink-0 bg-white z-20 h-12 box-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 px-2 whitespace-nowrap text-[15px] mr-4 relative h-full flex items-center ${activeTab === tab.id ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white overflow-y-auto no-scrollbar pb-10">
                {activeTab === 'trading_history' && renderTradingHistory()}
                {activeTab === 'open_orders' && renderOpenOrders()}
                {activeTab === 'order_history' && renderOrderHistory()}
                {activeTab === 'positions_assets' && renderPositionsAndAssets()}
                {activeTab === 'position_history' && renderPositionHistory()}
                {activeTab === 'bots' && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <FileSearch size={48} className="text-gray-300 mb-4" />
                        <span className="text-[14px] text-gray-400 font-medium">No active bots</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TradeHistoryView;
