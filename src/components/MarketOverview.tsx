import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
    FiInfo as Info,
    FiChevronRight as ChevronRight,
} from 'react-icons/fi';
import {
    LuTrendingUp as TrendingUp,
    LuZap as Zap,
    LuGlobe as Globe,
} from 'react-icons/lu';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from './CoinIcon';

const MarketOverview = () => {
    const markets = useExchangeStore(state => state.markets);
    const futuresMarkets = useExchangeStore(state => state.futuresMarkets);
    const currency = useExchangeStore(state => state.currency);
    const rates = useExchangeStore(state => state.rates);
    const [chartMode, setChartMode] = useState<'mcap' | 'turnover' | 'dominance'>('mcap');

    const formatCurrency = (valUsd: number) => {
        const rate = rates[currency] || 1;
        const converted = valUsd * rate;
        if (currency === 'IDR') {
            return `Rp ${(converted / 1e12).toFixed(2)}T`;
        }
        return `$${(converted / 1e12).toFixed(2)}T`;
    };

    // Mock data for Market Cap Chart
    const mcapData = useMemo(() => {
        if (chartMode === 'mcap') return [2.48, 2.47, 2.49, 2.46, 2.45, 2.46, 2.44, 2.42, 2.43, 2.41, 2.42, 2.41];
        if (chartMode === 'turnover') return [120, 145, 130, 160, 180, 175, 190, 210, 205, 220, 215, 230];
        return [54.2, 54.5, 54.3, 54.8, 55.1, 55.0, 55.4, 55.2, 55.5, 55.8, 55.7, 56.0]; // Dominance
    }, [chartMode]);

    // Calculate Market Flow from real data
    const marketFlow = useMemo(() => {
        const all = [...markets, ...futuresMarkets];
        const up = all.filter(m => parseFloat(m.priceChangePercent) > 0).length;
        const down = all.filter(m => parseFloat(m.priceChangePercent) < 0).length;
        const total = up + down || 1;
        return { up, down, upPercent: (up / total) * 100 };
    }, [markets, futuresMarkets]);

    const renderMcapChart = () => {
        const width = mcapData.length * 40;
        const height = 120;
        const padding = 10;
        const min = Math.min(...mcapData) - 0.05;
        const max = Math.max(...mcapData) + 0.05;
        const range = max - min;
        const step = width / (mcapData.length - 1);

        const isPos = chartMode !== 'mcap'; // mcap is negative in mock, others positive
        const color = isPos ? '#20b26c' : '#ef4444';

        const points = mcapData.map((val, i) => ({
            x: i * step,
            y: height - padding - ((val - min) / range) * (height - padding * 2)
        }));

        const d = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
        const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;

        return (
            <div className="relative w-full h-[120px] mt-2 mb-2">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="mcapGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#mcapGradient)" />
                    <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] text-[var(--text-tertiary)] pointer-events-none pr-2">
                    {chartMode === 'mcap' && (
                        <><span>2.75T</span><span>2.60T</span><span>2.45T</span><span>2.30T</span><span>2.15T</span></>
                    )}
                    {chartMode === 'turnover' && (
                        <><span>2,330.18T</span><span>2,100.01T</span><span>1,869.83T</span><span>1,639.65T</span><span>1,409.47T</span></>
                    )}
                    {chartMode === 'dominance' && (
                        <><span>57%</span><span>56%</span><span>55%</span><span>54%</span><span>53%</span></>
                    )}
                </div>
                {/* Time labels */}
                <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-2 px-1">
                    <span>14:06</span>
                    <span>16:53</span>
                    <span>19:40</span>
                    <span>22:26</span>
                    <span>01:13</span>
                    <span>04:00</span>
                    <span>06:46</span>
                    <span>09:33</span>
                    <span>12:20</span>
                </div>
            </div>
        );
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="px-4 pb-10 flex flex-col gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Market Cap Section */}
            <motion.section variants={itemVariants}>
                <div className="flex justify-between items-center mb-1 mt-4">
                    <div className="flex items-center gap-1.5">
                        <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
                            {chartMode === 'mcap' ? 'Market cap' : chartMode.charAt(0).toUpperCase() + chartMode.slice(1)}
                        </h2>
                        <span className="text-[var(--text-tertiary)]"><Info size={16} /></span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                        <div className="text-[18px] font-bold text-[var(--text-primary)]">
                            {chartMode === 'mcap' ? formatCurrency(2.41e12) : chartMode === 'turnover' ? formatCurrency(118.15e12) : '56.0%'}
                        </div>
                        <div className={`inline-block ${chartMode !== 'mcap' ? 'bg-[#20b26c] text-white' : 'bg-[#EF454A] text-white'} text-[12px] font-bold px-1.5 py-[2px] rounded-[4px]`}>
                            {chartMode === 'mcap' ? '-3.22%' : chartMode === 'turnover' ? '+22.98%' : '+0.5%'}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between text-[13px] font-semibold text-[var(--text-tertiary)] mt-4 mb-6 px-1">
                    <span className="text-[var(--text-primary)] bg-[var(--bg-secondary)]/80 rounded-full px-3 py-0.5 font-bold">24h</span>
                    <span>7D</span>
                    <span>30D</span>
                    <span>90D</span>
                    <span>1Y</span>
                    <span>All</span>
                </div>

                {renderMcapChart()}

                <div className="flex p-0.5 bg-[var(--bg-secondary)]/80 rounded-[10px] mt-6">
                    <button onClick={() => setChartMode('mcap')} className={`flex-1 text-[13px] py-1.5 rounded-[8px] ${chartMode === 'mcap' ? 'font-medium bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>Market cap</button>
                    <button onClick={() => setChartMode('turnover')} className={`flex-1 text-[13px] py-1.5 rounded-[8px] ${chartMode === 'turnover' ? 'font-medium bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>Turnover</button>
                    <button onClick={() => setChartMode('dominance')} className={`flex-1 text-[13px] py-1.5 rounded-[8px] ${chartMode === 'dominance' ? 'font-medium bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>Dominance</button>
                </div>
            </motion.section>

            {/* Market Flow Section */}
            <motion.section variants={itemVariants} className="bg-[var(--bg-secondary)]/50 rounded-xl p-4">
                <div className="text-[12px] text-[var(--text-secondary)] mb-6">Market flow</div>

                {/* Bar chart */}
                <div className="flex items-end justify-between h-[80px] gap-1 mb-2">
                    {/* Green bars */}
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#20b26c]">2</span>
                        <div className="w-full bg-[#20b26c] rounded-[1px] h-[5px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">&gt;8%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#20b26c]">2</span>
                        <div className="w-full bg-[#20b26c] rounded-[1px] h-[5px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">6-8%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#20b26c]">7</span>
                        <div className="w-full bg-[#20b26c] opacity-80 rounded-[1px] h-[10px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">4-6%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#20b26c]">54</span>
                        <div className="w-full bg-[#20b26c] opacity-90 rounded-[1px] h-[25px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">2-4%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#20b26c]">193</span>
                        <div className="w-full bg-[#20b26c] rounded-[1px] h-[70px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">0-2%</span>
                    </div>

                    {/* Red bars */}
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#ef4444]">27</span>
                        <div className="w-full bg-[#ef4444] rounded-[1px] h-[15px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">0-2%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#ef4444]">5</span>
                        <div className="w-full bg-[#ef4444] rounded-[1px] h-[5px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">2-4%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#ef4444]">1</span>
                        <div className="w-full bg-[#ef4444] rounded-[1px] h-[3px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">4-6%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#ef4444]">0</span>
                        <div className="w-full bg-[#ef4444] rounded-[1px] h-[1px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">6-8%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                        <span className="text-[10px] text-[#ef4444]">1</span>
                        <div className="w-full bg-[#ef4444] rounded-[1px] h-[3px]" />
                        <span className="text-[9px] text-[#A3A8B8] absolute -bottom-5">&gt;8%</span>
                    </div>
                </div>

                <div className="mt-8 mb-4">
                    <div className="flex gap-1 h-[6px] w-full overflow-hidden">
                        <div className="bg-[#8ccfa8] rounded-l-full" style={{ width: '10%' }} />
                        <div className="bg-[#a8dabf]" style={{ width: '10%' }} />
                        <div className="bg-[#c4e6d5]" style={{ width: '10%' }} />
                        <div className="bg-[#dff3e8]" style={{ width: '10%' }} />
                        <div className="bg-[#def0e7]" style={{ width: '10%' }} />
                        <div className="bg-[#fae2e4]" style={{ width: '10%' }} />
                        <div className="bg-[#f2c6c9]" style={{ width: '10%' }} />
                        <div className="bg-[#eab0b4]" style={{ width: '10%' }} />
                        <div className="bg-[#e49da1]" style={{ width: '10%' }} />
                        <div className="bg-[#df898e] rounded-r-full" style={{ width: '10%' }} />
                    </div>
                </div>

                <div className="flex justify-between items-center px-1">
                    <span className="text-[#20b26c] text-[13px] font-bold flex items-center gap-1">
                        <span className="inline-block transform rotate-[-45deg]"><TrendingUp size={14} /></span> 258
                    </span>
                    <div className="flex-1 flex justify-center text-[var(--text-tertiary)]">
                        <span className="inline-block transform rotate-[-90deg]">
                            <ChevronRight size={14} />
                        </span>
                    </div>
                    <span className="text-[#ef454a] text-[13px] font-bold flex items-center gap-1">
                        34 <span className="inline-block transform rotate-[135deg]"><TrendingUp size={14} /></span>
                    </span>
                </div>
            </motion.section>

            {/* Trading Calendar Section */}
            <motion.section variants={itemVariants}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Trading calendar</h2>
                    <span className="text-[var(--text-tertiary)]"><ChevronRight size={20} /></span>
                </div>
                <div className="flex flex-col gap-2">
                    {[
                        "Core Inflation Rate MoM (U.S.)",
                        "Inflation Rate MoM (U.S.)",
                        "Core Inflation Rate YoY (U.S.)"
                    ].map((event, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-[var(--bg-secondary)] rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--text-primary)]"><Globe size={18} /></span>
                                <span className="text-[14px] font-bold text-[var(--text-primary)]">{event}</span>
                            </div>
                            <span className="text-[12px] font-medium text-[var(--text-tertiary)]">03/11, 19:30</span>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Trending Categories Section */}
            <motion.section variants={itemVariants}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Trending categories</h2>
                </div>
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-[2px] h-[220px] rounded-[12px] overflow-hidden">
                    {(() => {
                        const getCategoryData = (symbols: string[]) => {
                            const found = symbols.map(s => {
                                const spot = markets.find(m => m.symbol === `${s}USDT`);
                                const fut = futuresMarkets.find(m => m.symbol === `${s}USDT`);
                                return spot || fut;
                            }).filter(Boolean);

                            if (found.length === 0) return { change: 0, str: '0.00%', isPos: true };

                            const avgChange = found.reduce((acc, curr) => acc + parseFloat(curr.priceChangePercent), 0) / found.length;
                            return {
                                change: avgChange,
                                str: `${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%`,
                                isPos: avgChange >= 0
                            };
                        };

                        const fanTokens = getCategoryData(['CHZ', 'LAZIO', 'PORTO']);
                        const pow = getCategoryData(['LTC', 'BCH', 'BTC']);
                        const payment = getCategoryData(['XRP', 'XLM', 'DGB']);
                        const top = getCategoryData(['BNB', 'ADA', 'SOL']);
                        const l1 = getCategoryData(['ETH', 'SOL', 'AVAX']);

                        return (
                            <>
                                {/* Col 1 */}
                                <div className={`${fanTokens.isPos ? 'bg-[#E5F7ED]' : 'bg-[#FDEAEA]'} p-3.5 pb-4 flex flex-col justify-between h-full`}>
                                    <div>
                                        <div className={`${fanTokens.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[18px] font-medium leading-[1.1]`}>Fan Tokens</div>
                                        <div className={`${fanTokens.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[13px] font-bold mt-0.5`}>{fanTokens.str}</div>
                                    </div>
                                    <div className="flex items-center -space-x-2 overflow-hidden mb-1">
                                        <div className="w-8 h-8 rounded-full border border-white z-[3] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="CHZUSDT" size={8} /></div>
                                        <div className="w-8 h-8 rounded-full border border-white z-[2] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="LAZIOUSDT" size={8} /></div>
                                        <div className="w-8 h-8 rounded-full border border-white z-[1] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="PORTOUSDT" size={8} /></div>
                                        <div className="w-6 h-6 flex-shrink-0 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] z-[0] shadow-sm ml-1 text-[9px] font-bold text-[var(--text-secondary)]">+5</div>
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div className="flex flex-col gap-[2px] h-full">
                                    <div className={`${pow.isPos ? 'bg-[#E5F7ED]' : 'bg-[#FDEAEA]'} p-3.5 pb-4 flex-1 flex flex-col justify-between`}>
                                        <div>
                                            <div className={`${pow.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[14px] font-medium leading-[1.1]`}>Proof of Work</div>
                                            <div className={`${pow.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[11px] font-bold mt-0.5`}>{pow.str}</div>
                                        </div>
                                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full border border-white z-[3] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="LTCUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[2] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="BCHUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[1] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="BTCUSDT" size={6} /></div>
                                            <div className="w-5 h-5 flex-shrink-0 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] z-[0] shadow-sm ml-1 text-[8px] font-bold text-[var(--text-secondary)]">+11</div>
                                        </div>
                                    </div>
                                    <div className={`${payment.isPos ? 'bg-[#E5F7ED]' : 'bg-[#FDEAEA]'} p-3.5 pb-4 flex-1 flex flex-col justify-between`}>
                                        <div>
                                            <div className={`${payment.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[14px] font-medium leading-[1.1]`}>Payment</div>
                                            <div className={`${payment.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[11px] font-bold mt-0.5`}>{payment.str}</div>
                                        </div>
                                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full border border-white z-[3] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="XRPUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[2] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="XLMUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[1] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="DGBUSDT" size={6} /></div>
                                            <div className="w-5 h-5 flex-shrink-0 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] z-[0] shadow-sm ml-1 text-[8px] font-bold text-[var(--text-secondary)]">+4</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3 */}
                                <div className="flex flex-col gap-[2px] h-full">
                                    <div className={`${top.isPos ? 'bg-[#E5F7ED]' : 'bg-[#FDEAEA]'} p-3.5 pb-4 flex-1 flex flex-col justify-between`}>
                                        <div>
                                            <div className={`${top.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[14px] font-medium leading-[1.1]`}>Top</div>
                                            <div className={`${top.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[11px] font-bold mt-0.5`}>{top.str}</div>
                                        </div>
                                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full border border-white z-[3] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="BNBUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[2] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="ADAUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[1] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="SOLUSDT" size={6} /></div>
                                            <div className="w-5 h-5 flex-shrink-0 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] z-[0] shadow-sm ml-1 text-[8px] font-bold text-[var(--text-secondary)]">+5</div>
                                        </div>
                                    </div>
                                    <div className={`${l1.isPos ? 'bg-[#E5F7ED]' : 'bg-[#FDEAEA]'} p-3.5 pb-4 flex-1 flex flex-col justify-between`}>
                                        <div>
                                            <div className={`${l1.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[14px] font-medium leading-[1.1]`}>Layer 1</div>
                                            <div className={`${l1.isPos ? 'text-[#20B26C]' : 'text-[#EF454A]'} text-[11px] font-bold mt-0.5`}>{l1.str}</div>
                                        </div>
                                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full border border-white z-[3] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="ETHUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[2] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="SOLUSDT" size={6} /></div>
                                            <div className="w-6 h-6 rounded-full border border-white z-[1] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden"><CoinIcon symbol="AVAXUSDT" size={6} /></div>
                                            <div className="w-5 h-5 flex-shrink-0 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] z-[0] shadow-sm ml-1 text-[8px] font-bold text-[var(--text-secondary)]">+50</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F0F2F5] h-[50px] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                                        <span className="text-[var(--text-primary)] font-bold text-[14px]">Others</span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </motion.section>

            {/* Trade Radar Section */}
            <motion.section variants={itemVariants} className="mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Trade radar</h2>
                    <span className="text-[var(--text-tertiary)]"><ChevronRight size={20} /></span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { symbol: "ADA", change: "+1.76%", text: "400K ADA sold at 0.2595, totaling Rp 1.75B.", time: "49s ago", tag: "Whale", tagBg: "#E7ECFE", tagColor: "#6974E7" },
                        { symbol: "BTC", change: "+2.51%", text: "9.58 BTC sold at 54,000, totaling Rp 8.4B.", time: "49s ago", tag: "Whale", tagBg: "#FFF4E5", tagColor: "#FF9800" }
                    ].map((alert, i) => (
                        <div key={i} className="min-w-[280px] bg-[var(--bg-card)] border border-slate-200/60 rounded-2xl p-4 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CoinIcon symbol={alert.symbol === "ADA" ? "ADAUSDT" : "BTCUSDT"} size={8} />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[15px] font-bold text-[var(--text-primary)]">{alert.symbol}</span>
                                            <span className="text-[#20b26c] text-[13px] font-bold">{alert.change}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: alert.tagBg, color: alert.tagColor }} className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                                    {alert.tag}
                                </div>
                            </div>
                            <p className="text-[14px] font-medium text-[var(--text-primary)] mb-2">{alert.text}</p>
                            <div className="flex items-center justify-between text-[12px] text-[var(--text-tertiary)]">
                                <span>{alert.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Bottom Nav Spacer */}
            <div className="h-10" />
        </motion.div>
    );
};

export default MarketOverview;
