import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft as ChevronLeft, FiCopy as Copy, FiCheck as Check } from 'react-icons/fi';
import { TbFilter2Cog } from 'react-icons/tb';
import { LuFileSearch as FileSearch } from 'react-icons/lu';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';
import { TransactionRecord } from '../types';

const HistoryView = () => {
    const { setActivePage, transactionHistory } = useExchangeStore();
    const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'Crypto' | 'Fiat'>('Crypto');

    // Filters State
    const [coinFilter, setCoinFilter] = useState('All Assets');
    const [typeFilter, setTypeFilter] = useState('All Type');
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    // Date Filters Data State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end'>('start');

    // BottomSheet visibility
    const [openSheet, setOpenSheet] = useState(''); // 'coin' | 'type' | 'date' | ''

    const yearRef = useRef<HTMLDivElement>(null);
    const monthRef = useRef<HTMLDivElement>(null);
    const dayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (openSheet === 'date') {
            const current = activeDateInput === 'start' ? tempStartDate : tempEndDate;
            const parts = current ? current.split('-') : new Date().toISOString().split('T')[0].split('-');
            const years = [2024, 2025, 2026, 2027];

            const yIndex = years.indexOf(parseInt(parts[0]));
            const mIndex = parseInt(parts[1]) - 1;
            const dIndex = parseInt(parts[2]) - 1;

            const syncScroll = (ref: React.RefObject<HTMLDivElement>, target: number) => {
                if (ref.current && Math.abs(ref.current.scrollTop - target) > 20) {
                    ref.current.scrollTop = target;
                }
            };

            setTimeout(() => {
                syncScroll(yearRef, Math.max(0, yIndex) * 40);
                syncScroll(monthRef, Math.max(0, mIndex) * 40);
                syncScroll(dayRef, Math.max(0, dIndex) * 40);
            }, 10);
        }
    }, [openSheet, activeDateInput, tempStartDate, tempEndDate]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'year' | 'month' | 'day') => {
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / 40);
        const current = activeDateInput === 'start'
            ? (tempStartDate || new Date().toISOString().split('T')[0])
            : (tempEndDate || new Date().toISOString().split('T')[0]);
        const parts = current.split('-');

        let newVal = '';
        if (type === 'year') {
            const years = [2024, 2025, 2026, 2027];
            const y = years[Math.min(Math.max(index, 0), years.length - 1)];
            newVal = `${y}-${parts[1]}-${parts[2]}`;
        } else if (type === 'month') {
            const m = String(Math.min(Math.max(index + 1, 1), 12)).padStart(2, '0');
            newVal = `${parts[0]}-${m}-${parts[2]}`;
        } else if (type === 'day') {
            const d = String(Math.min(Math.max(index + 1, 1), 31)).padStart(2, '0');
            newVal = `${parts[0]}-${parts[1]}-${d}`;
        }

        if (activeDateInput === 'start') {
            setTempStartDate(newVal);
        } else {
            setTempEndDate(newVal);
        }
    };

    // Unique coins and types for dropdowns
    const availableCoins = ['All Assets', ...Array.from(new Set(transactionHistory.map(tx => tx.currency)))];
    const availableTypes = ['All Type', 'Deposit', 'Withdrawal', 'Transfer'];

    const formatDateMonthString = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatDateTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Apply Filters
    const filteredHistory = transactionHistory.filter(tx => {
        const matchCoin = coinFilter === 'All Assets' || tx.currency === coinFilter;
        const matchType = typeFilter === 'All Type' || tx.type === typeFilter;

        let matchDate = true;
        if (startDate && endDate) {
            const txTime = new Date(tx.timestamp).getTime();
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime() + 86400000; // include end day entirely
            matchDate = txTime >= start && txTime <= end;
        }

        return matchCoin && matchType && matchDate;
    });

    // Group by month
    const grouped = filteredHistory.reduce((acc: any, tx) => {
        const key = formatDateMonthString(tx.timestamp);
        if (!acc[key]) acc[key] = [];
        acc[key].push(tx);
        return acc;
    }, {});

    const renderDetail = () => {
        if (!selectedTx) return null;

        const isPositive = selectedTx.type === 'Deposit';
        const colorClass = isPositive ? 'text-[#00C076]' : 'text-slate-900';
        const symbolPrefix = isPositive ? '+' : '';

        return (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 bg-[#FDFDFD] z-[310] flex flex-col pt-safe px-4">
                <div className="flex items-center justify-between py-4 sticky top-0 bg-[#FDFDFD] z-10">
                    <button onClick={() => setSelectedTx(null)} className="p-1 -ml-1 text-slate-900"><ChevronLeft size={28} /></button>
                    <div className="w-8"></div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pt-6 flex flex-col items-center">
                    <CoinIcon symbol={selectedTx.currency} size={10} />
                    <div className="mt-4 text-[20px] font-bold text-slate-900 text-center">
                        {selectedTx.type === 'Transfer' ? 'Transferred' : selectedTx.type === 'Deposit' ? 'Deposited' : 'Withdrawal'} {selectedTx.amount} {selectedTx.currency}
                    </div>
                    {/* Dummy USD equivalent */}
                    <div className="text-slate-400 text-sm font-medium mt-1 mb-8">~${(selectedTx.amount * 1.0).toFixed(2)}</div>

                    <div className="w-full flex items-center justify-between py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#00C076] text-white flex items-center justify-center"><Check size={14} /></div>
                            <span className="font-bold text-[15px] text-slate-900">Status</span>
                        </div>
                        <span className="text-[15px] text-slate-500 font-medium">{selectedTx.status}</span>
                    </div>

                    <div className="w-full space-y-6 py-6 pb-24">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] font-bold text-slate-900 flex items-center gap-1">Price <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 font-normal">i</div></span>
                            <span className="text-[14px] text-slate-500 font-medium text-right">$--- / {selectedTx.currency}</span>
                        </div>
                        {(selectedTx.type === 'Deposit' || selectedTx.type === 'Withdrawal') && selectedTx.network && (
                            <div className="flex justify-between items-start">
                                <span className="text-[14px] font-bold text-slate-900">Network</span>
                                <span className="text-[14px] text-slate-500 font-medium flex items-center gap-1.5"><CoinIcon symbol={selectedTx.currency} size={4} /> {selectedTx.network}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] font-bold text-slate-900">Transaction ID</span>
                            <span className="text-[14px] text-slate-500 font-medium flex items-center gap-2">{selectedTx.id} <span className="cursor-pointer"><Copy size={14} /></span></span>
                        </div>
                        {(selectedTx.type === 'Deposit' || selectedTx.type === 'Withdrawal') && selectedTx.network && (
                            <div className="flex justify-between items-start">
                                <span className="text-[14px] font-bold text-slate-900">Address</span>
                                <span className="text-[14px] text-slate-500 font-medium flex items-start gap-2 max-w-[200px] text-right break-all">
                                    0x5567925e4ed98eb37aefe5fd608c16fc9ec3ed03 <span className="cursor-pointer shrink-0 mt-0.5"><Copy size={14} /></span>
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] font-bold text-slate-900">Time</span>
                            <span className="text-[14px] text-slate-500 font-medium">{formatDateTime(selectedTx.timestamp)}</span>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FDFDFD] border-t border-slate-100 z-20 pb-safe">
                    <button className="w-full py-4 rounded-full font-bold text-[16px] text-center bg-[#1E4D2B] text-white active:bg-[#15341d]">
                        View on blockchain explorer
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#FDFDFD] z-[300] flex flex-col pt-safe pb-0 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-[#FDFDFD] z-10 border-b border-transparent">
                <button
                    onClick={() => window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-slate-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-slate-900 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Transaction History
                </div>
                <div className="w-8"></div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('Crypto')}
                    className={`py-3 px-2 font-bold text-[15px] mr-6 relative ${activeTab === 'Crypto' ? 'text-slate-900' : 'text-slate-400 font-medium'}`}
                >
                    Crypto
                    {activeTab === 'Crypto' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('Fiat')}
                    className={`py-3 px-2 font-bold text-[15px] relative ${activeTab === 'Fiat' ? 'text-slate-900' : 'text-slate-400 font-medium'}`}
                >
                    Fiat
                    {activeTab === 'Fiat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                </button>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center py-4 px-4 shrink-0 relative z-20">
                <div className="flex gap-2">
                    <div onClick={() => setOpenSheet('coin')} className="bg-[#F5F7F9] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium text-slate-800 cursor-pointer active:scale-95 transition-transform">
                        {coinFilter} <span className="text-slate-500"><ChevronDown size={14} /></span>
                    </div>

                    <div onClick={() => setOpenSheet('type')} className="bg-[#F5F7F9] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium text-slate-800 cursor-pointer active:scale-95 transition-transform">
                        {typeFilter} <span className="text-slate-500"><ChevronDown size={14} /></span>
                    </div>
                </div>
                <div onClick={() => {
                    setTempStartDate(startDate || new Date().toISOString().split('T')[0]);
                    setTempEndDate(endDate || new Date().toISOString().split('T')[0]);
                    setOpenSheet('date');
                }} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors bg-[#F5F7F9] p-1.5 rounded">
                    <TbFilter2Cog size={18} />
                </div>
            </div>

            <div className="flex-1 pb-10 px-4">
                {Object.keys(grouped).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 text-sm">
                        <div className="text-slate-300 mb-4 opacity-70">
                            <FileSearch size={48} />
                        </div>
                        <span className="font-medium text-[14px]">No data available</span>
                    </div>
                ) : (
                    Object.keys(grouped).map(monthStr => (
                        <div key={monthStr} className="mb-6">
                            <div className="font-bold text-[17px] text-slate-900 mb-4">{monthStr}</div>
                            <div className="space-y-6">
                                {grouped[monthStr].map((tx: TransactionRecord, idx: number) => {
                                    const isPositive = tx.type === 'Deposit' || (tx.type === 'Transfer' && tx.to === 'spot');
                                    return (
                                        <div key={idx} onClick={() => setSelectedTx(tx)} className="flex justify-between items-center cursor-pointer active:bg-slate-50 -mx-4 px-4 py-1">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <CoinIcon symbol={tx.currency} size={10} />
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00909A] flex items-center justify-center border-2 border-white text-white">
                                                        <span className="text-[10px] leading-none">{'₮'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-[15px] text-slate-900 line-clamp-1 break-all max-w-[150px]">
                                                        {tx.type === 'Deposit' ? 'Deposit' : tx.type === 'Withdrawal' ? 'Withdrawal' : `Transferred to ${tx.to}`}
                                                    </div>
                                                    <div className="text-[13px] text-slate-400 font-medium leading-tight mt-0.5">{formatDateTime(tx.timestamp)}</div>
                                                    <div className="text-[13px] text-slate-400 font-medium leading-tight">{tx.status}</div>
                                                </div>
                                            </div>
                                            <div className={`font-medium text-[15px] flex items-center justify-end gap-1 ${isPositive ? 'text-[#00C076]' : 'text-[#FF3B30]'}`}>
                                                <div className="flex flex-col items-end text-sm">
                                                    <span>{isPositive ? '+' : '-'}{tx.amount}</span>
                                                    <span>{tx.currency === 'USDT' || tx.currency === 'FIAT' ? 'USDT' : tx.currency}</span>
                                                </div>
                                                <span className="-rotate-90 text-slate-400 mt-0.5"><ChevronDown size={16} /></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {selectedTx && renderDetail()}

                {/* Coin Bottom Sheet */}
                {openSheet === 'coin' && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[500]" onClick={() => setOpenSheet('')} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[501] flex flex-col pt-3 pb-safe max-h-[70vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                            <div className="flex justify-center items-center mb-4 px-6 relative">
                                <h3 className="text-[18px] font-bold text-slate-900">Filter by assets</h3>
                                <button onClick={() => setOpenSheet('')} className="text-slate-400 hover:text-slate-600 p-1 absolute right-6 text-xl font-light">&times;</button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-6">
                                {availableCoins.map(coin => (
                                    <div key={coin} onClick={() => { setCoinFilter(coin); setOpenSheet(''); }} className={`px-4 py-4 text-[15px] text-slate-900 border-b border-slate-50 active:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center ${coinFilter === coin ? 'font-bold' : 'font-medium'}`}>
                                        {coin}
                                        {coinFilter === coin && <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center"><Check size={12} /></div>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Type Bottom Sheet */}
                {openSheet === 'type' && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[500]" onClick={() => setOpenSheet('')} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[501] flex flex-col pt-3 pb-safe max-h-[70vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                            <div className="flex justify-center items-center mb-4 px-6 relative">
                                <h3 className="text-[18px] font-bold text-slate-900">Filter by type</h3>
                                <button onClick={() => setOpenSheet('')} className="text-slate-400 hover:text-slate-600 p-1 absolute right-6 text-xl font-light">&times;</button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-6">
                                {availableTypes.map(type => (
                                    <div key={type} onClick={() => { setTypeFilter(type); setOpenSheet(''); }} className={`px-4 py-4 text-[15px] text-slate-900 border-b border-slate-50 active:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center ${typeFilter === type ? 'font-bold' : 'font-medium'}`}>
                                        {type}
                                        {typeFilter === type && <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center"><Check size={12} /></div>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Date Filter Bottom Sheet */}
                {openSheet === 'date' && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setOpenSheet('')} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[501] flex flex-col pt-3 pb-12 px-6 px-safe min-h-[50vh]"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                            <div className="flex justify-center items-center mb-6 relative">
                                <h3 className="text-[18px] font-bold text-slate-900">Filter by time period</h3>
                                <button onClick={() => setOpenSheet('')} className="text-slate-400 hover:text-slate-600 text-2xl font-light absolute right-0">&times;</button>
                            </div>

                            <div className="flex gap-2 mb-6">
                                {[7, 30, 90].map(days => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - days);
                                    const val = d.toISOString().split('T')[0];
                                    const isActive = tempStartDate === val;
                                    return (
                                        <button
                                            key={days}
                                            onClick={() => { setTempStartDate(val); setTempEndDate(new Date().toISOString().split('T')[0]); }}
                                            className={`flex-1 py-2 rounded-full border ${isActive ? 'border-slate-900 text-slate-900 font-bold border-2' : 'border-slate-200 text-slate-400 font-medium hover:border-slate-300'} text-[13px]`}
                                        >
                                            Last {days} days
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div
                                    onClick={() => setActiveDateInput('start')}
                                    className={`flex-1 rounded-lg py-3 text-center font-medium text-sm cursor-pointer border ${activeDateInput === 'start' ? 'border-slate-900 text-slate-900' : 'border-transparent bg-[#F5F7F9] text-slate-500'}`}
                                >
                                    {tempStartDate ? tempStartDate : 'YYYY-MM-DD'}
                                </div>
                                <span className="text-slate-900 font-bold text-sm">To</span>
                                <div
                                    onClick={() => setActiveDateInput('end')}
                                    className={`flex-1 rounded-lg py-3 text-center font-medium text-sm cursor-pointer border ${activeDateInput === 'end' ? 'border-slate-900 text-slate-900' : 'border-transparent bg-[#F5F7F9] text-slate-500'}`}
                                >
                                    {tempEndDate ? tempEndDate : 'YYYY-MM-DD'}
                                </div>
                            </div>

                            {/* Custom Date Scroll Picker */}
                            <div className="flex h-36 relative mb-8">
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 border-y border-slate-100 pointer-events-none -mx-6 px-6 z-0"></div>
                                <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white via-transparent to-white" style={{ background: 'linear-gradient(to bottom, white 0%, transparent 40%, transparent 60%, white 100%)' }}></div>

                                {/* A real native feel picker is hard to simulate perfectly without a library, but we map simple lists that auto update the date */}
                                <div
                                    ref={yearRef}
                                    onScroll={(e) => handleScroll(e, 'year')}
                                    className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-20 flex flex-col items-center scroll-smooth"
                                >
                                    <div className="h-[52px] shrink-0"></div>
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <div key={y}
                                            className={`h-10 shrink-0 snap-center flex items-center justify-center font-bold text-[16px] cursor-pointer w-full text-center hover:bg-slate-50 
                                                ${(activeDateInput === 'start' ? tempStartDate : tempEndDate)?.startsWith(y.toString()) ? 'text-slate-900 text-[18px]' : 'text-slate-300'}`}
                                            onClick={() => {
                                                const current = activeDateInput === 'start' ? tempStartDate : tempEndDate;
                                                const parts = current ? current.split('-') : ['2026', '01', '01'];
                                                const newVal = `${y}-${parts[1]}-${parts[2]}`;
                                                if (activeDateInput === 'start') setTempStartDate(newVal); else setTempEndDate(newVal);
                                            }}
                                        >
                                            {y}
                                        </div>
                                    ))}
                                    <div className="h-[52px] shrink-0"></div>
                                </div>

                                <div
                                    ref={monthRef}
                                    onScroll={(e) => handleScroll(e, 'month')}
                                    className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-20 flex flex-col items-center scroll-smooth"
                                >
                                    <div className="h-[52px] shrink-0"></div>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                        <div key={m}
                                            className={`h-10 shrink-0 snap-center flex items-center justify-center font-bold text-[16px] cursor-pointer w-full text-center hover:bg-slate-50 
                                                ${(activeDateInput === 'start' ? tempStartDate : tempEndDate)?.split('-')[1] === m ? 'text-slate-900 text-[18px]' : 'text-slate-300'}`}
                                            onClick={() => {
                                                const current = activeDateInput === 'start' ? tempStartDate : tempEndDate;
                                                const parts = current ? current.split('-') : ['2026', '01', '01'];
                                                const newVal = `${parts[0]}-${m}-${parts[2]}`;
                                                if (activeDateInput === 'start') setTempStartDate(newVal); else setTempEndDate(newVal);
                                            }}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                    <div className="h-[52px] shrink-0"></div>
                                </div>

                                <div
                                    ref={dayRef}
                                    onScroll={(e) => handleScroll(e, 'day')}
                                    className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-20 flex flex-col items-center scroll-smooth"
                                >
                                    <div className="h-[52px] shrink-0"></div>
                                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                                        <div key={d}
                                            className={`h-10 shrink-0 snap-center flex items-center justify-center font-bold text-[16px] cursor-pointer w-full text-center hover:bg-slate-50 
                                                ${(activeDateInput === 'start' ? tempStartDate : tempEndDate)?.split('-')[2] === d ? 'text-slate-900 text-[18px]' : 'text-slate-300'}`}
                                            onClick={() => {
                                                const current = activeDateInput === 'start' ? tempStartDate : tempEndDate;
                                                const parts = current ? current.split('-') : ['2026', '01', '01'];
                                                const newVal = `${parts[0]}-${parts[1]}-${d}`;
                                                if (activeDateInput === 'start') setTempStartDate(newVal); else setTempEndDate(newVal);
                                            }}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                    <div className="h-[52px] shrink-0"></div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-slate-100">
                                <button onClick={() => { setTempStartDate(''); setTempEndDate(''); setStartDate(''); setEndDate(''); setOpenSheet(''); }} className="flex-[0.8] py-4 bg-[#F5F7F9] text-slate-900 font-bold rounded-full active:bg-slate-200 transition-colors">Reset</button>
                                <button onClick={() => { setStartDate(tempStartDate); setEndDate(tempEndDate); setOpenSheet(''); }} className="flex-[1.2] py-4 bg-[#121212] text-white font-bold rounded-full active:bg-black transition-colors">Confirm</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HistoryView;
