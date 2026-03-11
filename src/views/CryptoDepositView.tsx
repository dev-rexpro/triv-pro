import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiChevronLeft as ChevronLeft, FiSearch as Search, FiCheck as Check, FiCopy as Copy } from 'react-icons/fi';
import { MdOutlineArrowDropDown as ChevronDown } from 'react-icons/md';
import useExchangeStore from '../stores/useExchangeStore';
import CoinIcon from '../components/CoinIcon';

const CryptoDepositView = () => {
    const { setActivePage, markets, assets, addTransaction, setWallets, wallets, session } = useExchangeStore();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
    const [depositAccount, setDepositAccount] = useState<'Funding' | 'Trading'>('Funding');
    const [amount, setAmount] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    // Filter unique coins from markets and assets to deposit
    const depositCoins = useMemo(() => {
        const uniqueSymbols = new Set<string>();
        const list: any[] = [];

        // Add defaults
        ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'USDC'].forEach(sym => {
            uniqueSymbols.add(sym);
            list.push({ symbol: sym, name: sym === 'USDT' ? 'Tether US' : sym === 'BTC' ? 'Bitcoin' : sym === 'ETH' ? 'Ethereum' : sym });
        });

        markets.forEach(m => {
            const base = m.symbol.replace('USDT', '');
            if (!uniqueSymbols.has(base)) {
                uniqueSymbols.add(base);
                list.push({ symbol: base, name: base });
            }
        });

        return list.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [markets, searchQuery]);

    const networks = [
        { id: 'TRC20', name: 'Tron (TRC20)', time: '~ 1 minute', min: '0.01', fee: '1.00' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', time: '~ 3 minutes', min: '0.01', fee: '0.29' },
        { id: 'ERC20', name: 'Ethereum (ERC20)', time: '~ 7 minutes', min: '0.01', fee: '4.50' },
        { id: 'SOL', name: 'Solana', time: '~ 2 minutes', min: '0.01', fee: '0.80' },
        { id: 'MATIC', name: 'Polygon', time: '~ 5 minutes', min: '0.01', fee: '0.10' }
    ];

    const { depositAddress, qrPattern } = useMemo(() => {
        if (!selectedNetwork || !selectedCoin) return { depositAddress: '', qrPattern: Array(144).fill(false) };
        const seedStr = `${session?.user?.email || 'user'}-${selectedCoin}-${selectedNetwork}`;
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
        }
        const seededRandom = () => {
            hash = (hash * 9301 + 49297) % 233280;
            return hash / 233280;
        };

        const prefix = selectedNetwork === 'TRC20' ? 'T' : selectedNetwork === 'ERC20' || selectedNetwork === 'BEP20' || selectedNetwork === 'MATIC' ? '0x' : selectedNetwork === 'SOL' ? '' : '1';
        let randomString = '';
        for (let i = 0; i < 26; i++) {
            randomString += Math.floor(seededRandom() * 36).toString(36);
        }
        const address = prefix + randomString.toUpperCase();

        const pattern = Array.from({ length: 144 }).map((_, i) => {
            const isCorner = i === 0 || i === 11 || i === 132 || i === 143;
            if (isCorner) return true;
            return seededRandom() > 0.4;
        });

        return { depositAddress: address, qrPattern: pattern };
    }, [selectedCoin, selectedNetwork, session?.user?.email]);

    const handleSimulateDeposit = () => {
        const numAmount = parseFloat(amount);
        if (!selectedCoin || !selectedNetwork || isNaN(numAmount) || numAmount <= 0) return;

        setIsSimulating(true);
        setTimeout(() => {
            // Add transaction record
            const txId = 'DP' + Date.now().toString(36).toUpperCase();
            addTransaction({
                id: txId,
                type: 'Deposit',
                currency: selectedCoin,
                amount: numAmount,
                network: selectedNetwork,
                status: 'Completed',
                timestamp: Date.now()
            });

            // Update Mock Wallets
            const targetWallet = depositAccount === 'Funding' ? 'spot' : 'futures'; // Map funding to spot for now
            const w = { ...wallets };
            w[targetWallet] = { ...w[targetWallet] };
            w[targetWallet][selectedCoin] = (w[targetWallet][selectedCoin] || 0) + numAmount;
            setWallets(w);

            setIsSimulating(false);
            useExchangeStore.getState().showToast('Deposit Successful', `Deposited ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${selectedCoin}\ninto ${depositAccount} via ${selectedNetwork}.`, 'success');
            setActivePage('assets');
        }, 1500);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-[300] flex flex-col pt-safe px-4 pb-0 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-4 sticky top-0 bg-white z-10">
                <button
                    onClick={() => step > 1 ? setStep(step - 1 as 1 | 2) : window.history.back()}
                    className="p-1 -ml-1 flex items-center justify-center text-slate-900"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="font-bold text-[17px] text-slate-900 absolute left-1/2 -translate-x-1/2">
                    {step === 1 ? 'Deposit Crypto' : step === 2 ? 'Select network' : `Deposit ${selectedCoin}`}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Step 1: Select Crypto */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">
                    <div className="relative mb-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={18} /></div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F5F7F9] border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder="Search coin"
                        />
                    </div>

                    <div className="font-bold text-[15px] text-slate-900 mb-4">Trending</div>
                    <div className="grid grid-cols-3 gap-3">
                        {['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'XRP'].map((coin) => (
                            <button
                                key={coin}
                                onClick={() => { setSelectedCoin(coin); setStep(2); }}
                                className="flex items-center justify-center gap-2 bg-[#F5F7F9] py-2.5 rounded-full font-bold text-slate-900 text-sm"
                            >
                                <CoinIcon symbol={coin} size={5} /> {coin}
                            </button>
                        ))}
                    </div>

                    <div className="font-bold text-[15px] text-slate-900 mt-8 mb-4">Coin list</div>
                    <div className="space-y-1 pb-10">
                        {depositCoins.map((coin) => (
                            <div
                                key={coin.symbol}
                                onClick={() => { setSelectedCoin(coin.symbol); setStep(2); }}
                                className="flex items-center justify-between py-3 cursor-pointer active:bg-slate-50"
                            >
                                <div className="flex items-center gap-3">
                                    <CoinIcon symbol={coin.symbol} size={8} />
                                    <div>
                                        <div className="font-bold text-[15px] text-slate-900">{coin.symbol}</div>
                                        <div className="text-[13px] text-slate-500 font-medium">{coin.name}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 2: Select Network */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-2">
                    <div className="bg-[#F5F7F9] rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">i</div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Not sure which network to choose?</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Make sure it matches the network on the platform or wallet you are withdrawing from.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-4 px-1">
                        <span>Network</span>
                        <span>Arrival time/Min deposit</span>
                    </div>

                    <div className="space-y-4 pb-10">
                        {networks.map((net) => (
                            <div
                                key={net.id}
                                onClick={() => { setSelectedNetwork(net.id); setStep(3); }}
                                className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 cursor-pointer active:bg-slate-50 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                                        {net.id.slice(0, 2)}
                                    </div>
                                    <span className="font-bold text-[15px] text-slate-900">{net.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-[13px] text-slate-900">{net.time}</div>
                                    <div className="text-[11px] text-slate-400 font-medium">{net.min} {selectedCoin}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 3: QR Code & Deposit Form */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 mt-6 flex flex-col h-full relative pb-safe">
                    <div className="flex-1 pb-32">
                        {/* QR Code Graphic */}
                        <div className="bg-[#F5F7F9] w-64 h-64 mx-auto rounded-3xl mb-8 flex items-center justify-center relative shadow-sm border border-slate-100">
                            {/* Dummy QR Pattern */}
                            <div className="w-48 h-48 bg-white p-2 flex flex-wrap gap-1 content-start justify-center overflow-hidden">
                                {qrPattern.map((isDark, i) => (
                                    <div key={i} className={`w-3 h-3 ${isDark ? 'bg-slate-900' : 'bg-transparent'} ${i === 0 || i === 11 || i === 132 || i === 143 ? 'rounded-md scale-150 bg-slate-900' : ''}`} />
                                ))}
                            </div>
                            <div className="absolute w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                                <CoinIcon symbol={selectedCoin || 'USDT'} size={8} />
                            </div>
                        </div>

                        <div className="text-[13px] font-medium text-slate-400 mb-2">Address</div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="font-bold text-[16px] text-slate-900 break-all pr-4">{depositAddress}</div>
                            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
                                <Copy size={14} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[15px] font-medium text-slate-500">Network</span>
                                <span className="font-bold text-[15px] text-slate-900 flex items-center gap-1.5">{selectedNetwork} <span className="text-slate-400"><ChevronDown size={18} /></span></span>
                            </div>

                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAccountSheetOpen(true)}>
                                <span className="text-[15px] font-medium text-slate-500">Deposit account</span>
                                <span className="font-bold text-[15px] text-slate-900 flex items-center gap-1.5">{depositAccount} account <span className="text-slate-400"><ChevronDown size={18} /></span></span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[15px] font-medium text-slate-500">Deposit Amount</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="bg-[#F5F7F9] rounded-lg px-3 py-1.5 text-right font-bold text-[15px] text-slate-900 outline-none placeholder:text-slate-300 w-28"
                                        placeholder="0.00"
                                    />
                                    <span className="font-bold text-[15px] text-slate-900">{selectedCoin}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[15px] font-medium text-slate-500 flex items-center gap-1">Arrival time <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px]">i</div></span>
                                <span className="font-bold text-[15px] text-slate-900">{networks.find(n => n.id === selectedNetwork)?.time}</span>
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8 z-20">
                        <button
                            onClick={handleSimulateDeposit}
                            disabled={!amount || isSimulating || parseFloat(amount) <= 0}
                            className={`w-full py-4 rounded-full font-bold text-[16px] text-center transition-opacity ${(!amount || isSimulating || parseFloat(amount) <= 0) ? 'bg-slate-200 text-slate-400' : 'bg-[#00C076] text-white active:bg-[#00a666]'}`}
                        >
                            {isSimulating ? 'Processing...' : 'Simulate Deposit'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Account Selection Bottom Sheet */}
            <AnimatePresence>
                {isAccountSheetOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[500]" onClick={() => setIsAccountSheetOpen(false)} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[501] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-center py-4 border-b border-slate-100 font-bold text-[17px] text-slate-900">
                                Deposit {networks.find(n => n.id === selectedNetwork)?.name}
                            </div>

                            <div className="p-2 pb-8">
                                <div className="p-4 cursor-pointer active:bg-slate-50 rounded-2xl flex justify-between items-center" onClick={() => { setDepositAccount('Funding'); setIsAccountSheetOpen(false); }}>
                                    <div>
                                        <div className="font-bold text-[16px] text-slate-900 mb-1">Funding account</div>
                                        <div className="text-[13px] text-slate-400 font-medium">Keep your funds that are not used for trading here</div>
                                    </div>
                                    {depositAccount === 'Funding' && <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white"><Check size={14} /></div>}
                                </div>
                                <div className="p-4 cursor-pointer active:bg-slate-50 rounded-2xl flex justify-between items-center" onClick={() => { setDepositAccount('Trading'); setIsAccountSheetOpen(false); }}>
                                    <div>
                                        <div className="font-bold text-[16px] text-slate-900 mb-1">Trading account</div>
                                        <div className="text-[13px] text-slate-400 font-medium">Funds available for trading activities</div>
                                    </div>
                                    {depositAccount === 'Trading' && <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white"><Check size={14} /></div>}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default CryptoDepositView;
