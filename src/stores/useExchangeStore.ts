// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    MarketData, Asset, ExchangeRates, FavoriteGroups, CurrencyCode,
    WalletBalances, TransactionRecord, TradeRecord, PendingOrder, FuturesPosition, UnifiedCoin
} from '../types';
import type { BinanceSymbolInfo } from '../utils/api';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';

interface ExchangeState {
    markets: MarketData[];
    futuresMarkets: MarketData[];
    spotSymbols: BinanceSymbolInfo[];
    futuresSymbols: BinanceSymbolInfo[];
    history: string[];
    favorites: string[];
    favoriteGroups: FavoriteGroups;
    hiddenGroups: string[];
    balance: number;
    spotBalance: number;
    futuresBalance: number;
    earnBalance: number;
    todayPnl: number;
    todaySpotPnl: number;
    pnlPercent: number;
    activePage: string;
    isSearchOpen: boolean;
    isManageGroupsOpen: boolean;
    isDepositOptionOpen: boolean;
    selectedCoin: string;
    tradeType: 'spot' | 'futures';
    session: Session | null;
    user: User | null;
    isPairPickerOpen: boolean;
    searchQuery: string;
    homeFilter: string;
    assets: Asset[];
    currency: CurrencyCode;
    rates: ExchangeRates;
    hideBalance: boolean;
    showOrderConfirmation: boolean;
    futuresUnrealizedPnl: number;

    // Demo Engine State
    wallets: {
        spot: WalletBalances;
        futures: WalletBalances;
        earn: WalletBalances;
    };
    positions: FuturesPosition[];
    openOrders: PendingOrder[];
    spotCostBasis: { [symbol: string]: number };
    transactionHistory: TransactionRecord[];
    tradeHistory: TradeRecord[];
    watchlist: UnifiedCoin[];
    snapshots: { [date: string]: number };

    // Actions
    setMarkets: (data: MarketData[]) => void;
    updateMarkets: (data: MarketData[]) => void;
    setFuturesMarkets: (data: MarketData[]) => void;
    updateFuturesMarkets: (data: MarketData[]) => void;
    setSpotSymbols: (data: BinanceSymbolInfo[]) => void;
    setFuturesSymbols: (data: BinanceSymbolInfo[]) => void;
    setCurrency: (currency: CurrencyCode) => void;
    setRates: (rates: ExchangeRates) => void;
    setActivePage: (page: string) => void;
    setSearchOpen: (val: boolean) => void;
    setManageGroupsOpen: (val: boolean) => void;
    setDepositOptionOpen: (val: boolean) => void;
    setSearchQuery: (query: string) => void;
    setHomeFilter: (filter: string) => void;
    setTradeType: (type: 'spot' | 'futures') => void;
    setPairPickerOpen: (val: boolean) => void;
    clearHistory: () => void;
    addToHistory: (query: string) => void;
    toggleFavorite: (symbol: string) => void;
    addFavoriteGroup: (name: string) => void;
    deleteFavoriteGroup: (name: string) => void;
    renameFavoriteGroup: (oldName: string, newName: string) => void;
    toggleGroupVisibility: (name: string) => void;
    reorderFavoriteGroups: (newOrder: string[]) => void;
    reorderGroupCoins: (groupName: string, newOrder: string[]) => void;
    removeCoinsFromGroup: (groupName: string, coinsToRemove: string[]) => void;
    updateAssetPrices: () => void;

    // Demo Actions
    setWallets: (wallets: { spot: WalletBalances; futures: WalletBalances; earn: WalletBalances }) => void;
    addTransaction: (tx: TransactionRecord) => void;
    addTrade: (trade: TradeRecord) => void;
    addPosition: (pos: FuturesPosition) => void;
    removePosition: (id: string) => void;
    updatePosition: (id: string, updates: Partial<FuturesPosition>) => void;
    resetWallets: () => void;
    setHideBalance: (val: boolean) => void;
    placeSpotOrder: (order: { symbol: string; side: 'Buy' | 'Sell'; type: 'Limit' | 'Market'; price: number; amount: number; marginMode: string; leverage: number }) => void;
    cancelSpotOrder: (orderId: string) => void;
    placeFuturesOrder: (order: { symbol: string; side: 'Buy' | 'Sell'; type: 'Limit' | 'Market'; price: number; amount: number; marginMode: string; leverage: number }) => void;
    closeFuturesPosition: (id: string) => void;
    getPnLForTimeframe: (timeframe: string) => { value: number; percent: number };
    setShowOrderConfirmation: (val: boolean) => void;
    closeAll: () => void;
    fetchSupabaseWallets: () => Promise<void>;
    fetchSupabaseHistory: () => Promise<void>;
    performInternalTransfer: (coin: string, from: string, to: string, amount: number) => Promise<boolean>;
    startEarnYield: () => void;
    setSession: (session: Session | null) => void;
    signOut: () => Promise<void>;
}

const useExchangeStore = create<ExchangeState>()(
    persist(
        (set, get) => ({
            markets: [],
            futuresMarkets: [],
            spotSymbols: [],
            futuresSymbols: [],
            history: ['NEWT (Ethereum)', 'JTOUSDT Perp', 'SOLUSDT Perp'],
            favorites: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
            favoriteGroups: { 'Group-1': ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'] },
            hiddenGroups: [],
            balance: 500,
            spotBalance: 500,
            futuresBalance: 0,
            earnBalance: 0,
            todayPnl: 0,
            todaySpotPnl: 0,
            pnlPercent: 0,
            activePage: 'home',
            isSearchOpen: false,
            isManageGroupsOpen: false,
            isDepositOptionOpen: false,
            selectedCoin: 'BTCUSDT',
            tradeType: 'spot',
            session: null,
            user: null,
            isPairPickerOpen: false,
            searchQuery: '',
            homeFilter: 'Favorites',
            assets: [
                { symbol: 'USDT', amount: 500, valueUsdt: 500 },
            ],
            currency: 'USD',
            rates: { USD: 1, USDT: 1, IDR: 16300, BTC: 0.000015 },
            hideBalance: false,
            showOrderConfirmation: true,
            futuresUnrealizedPnl: 0,

            // Demo Engine State Init
            wallets: {
                spot: { USDT: 500 },
                futures: { USDT: 0 },
                earn: { USDT: 0 }
            },
            positions: [],
            openOrders: [],
            spotCostBasis: {},
            transactionHistory: [],
            tradeHistory: [],
            watchlist: [],
            snapshots: {},

            setMarkets: (data) => set({ markets: data }),
            updateMarkets: (updates) => set((state) => {
                const map = new Map(state.markets.map(m => [m.symbol, m]));
                updates.forEach(u => {
                    const existing = map.get(u.symbol);
                    if (existing) map.set(u.symbol, { ...existing, ...u });
                });
                return { markets: Array.from(map.values()) };
            }),
            setFuturesMarkets: (data) => set({ futuresMarkets: data }),
            updateFuturesMarkets: (updates) => set((state) => {
                const map = new Map(state.futuresMarkets.map(m => [m.symbol, m]));
                updates.forEach(u => {
                    const existing = map.get(u.symbol);
                    if (existing) map.set(u.symbol, { ...existing, ...u });
                });
                return { futuresMarkets: Array.from(map.values()) };
            }),
            setSpotSymbols: (data) => set({ spotSymbols: data }),
            setFuturesSymbols: (data) => set({ futuresSymbols: data }),
            setCurrency: (currency) => set({ currency }),
            setRates: (rates) => set({ rates }),
            setHideBalance: (val) => set({ hideBalance: val }),
            setActivePage: (page) => set({ activePage: page }),
            setSearchOpen: (val) => set({ isSearchOpen: val }),
            setManageGroupsOpen: (val) => set({ isManageGroupsOpen: val }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setHomeFilter: (filter) => set({ homeFilter: filter }),
            setTradeType: (type) => set({ tradeType: type }),
            setPairPickerOpen: (val) => set({ isPairPickerOpen: val }),
            clearHistory: () => set({ history: [] }),
            setShowOrderConfirmation: (val) => set({ showOrderConfirmation: val }),
            addToHistory: (query) => set((state) => {
                const filtered = state.history.filter(h => h !== query);
                return { history: [query, ...filtered].slice(0, 20) };
            }),

            toggleFavorite: (symbol) => {
                const favs = get().favorites;
                const newFavs = favs.includes(symbol) ? favs.filter(s => s !== symbol) : [...favs, symbol];

                // Also update default group
                const newGroups = { ...get().favoriteGroups };
                if (newGroups['Group-1']) {
                    newGroups['Group-1'] = newFavs;
                }

                set({ favorites: newFavs, favoriteGroups: newGroups });
            },

            addFavoriteGroup: (name) => set((state) => ({ favoriteGroups: { ...state.favoriteGroups, [name]: [] } })),

            deleteFavoriteGroup: (name) => set((state) => {
                const newGroups = { ...state.favoriteGroups };
                delete newGroups[name];
                return { favoriteGroups: newGroups, hiddenGroups: state.hiddenGroups.filter(g => g !== name) };
            }),

            renameFavoriteGroup: (oldName, newName) => set((state) => {
                const newGroups = {};
                // Preserve order of keys while renaming
                for (const key of Object.keys(state.favoriteGroups)) {
                    if (key === oldName) {
                        newGroups[newName] = state.favoriteGroups[oldName];
                    } else {
                        newGroups[key] = state.favoriteGroups[key];
                    }
                }
                const newHidden = state.hiddenGroups.map(g => g === oldName ? newName : g);
                return { favoriteGroups: newGroups, hiddenGroups: newHidden };
            }),

            toggleGroupVisibility: (name) => set((state) => {
                const isHidden = state.hiddenGroups.includes(name);
                return {
                    hiddenGroups: isHidden
                        ? state.hiddenGroups.filter(g => g !== name)
                        : [...state.hiddenGroups, name]
                };
            }),

            reorderFavoriteGroups: (newOrder) => set((state) => {
                const newGroups = {};
                // newOrder contains all visible and potentially some hidden custom groups?
                // Actually, newOrder from UI might only contain the reordered subset.
                // It's safer if newOrder contains all custom groups.
                // Let's just create a new object in the order provided, and append any missing ones at the end.
                const existingKeys = Object.keys(state.favoriteGroups);
                const combinedOrder = [...new Set([...newOrder, ...existingKeys])];

                for (const key of combinedOrder) {
                    if (state.favoriteGroups[key]) {
                        newGroups[key] = state.favoriteGroups[key];
                    }
                }
                return { favoriteGroups: newGroups };
            }),

            reorderGroupCoins: (groupName, newOrder) => set((state) => {
                if (!state.favoriteGroups[groupName]) return state;
                return {
                    favoriteGroups: {
                        ...state.favoriteGroups,
                        [groupName]: newOrder
                    }
                };
            }),

            removeCoinsFromGroup: (groupName, coinsToRemove) => set((state) => {
                if (!state.favoriteGroups[groupName]) return state;
                return {
                    favoriteGroups: {
                        ...state.favoriteGroups,
                        [groupName]: state.favoriteGroups[groupName].filter(c => !coinsToRemove.includes(c))
                    }
                };
            }),

            fetchSupabaseWallets: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Fetch wallets error:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const newWallets = {
                        spot: {},
                        futures: {},
                        earn: {}
                    };

                    data.forEach((w: any) => {
                        // Map 'funding' to 'spot' for internal demo logic if needed, 
                        // but schema says 'funding', 'trading', 'earn'. 
                        // The store uses 'spot', 'futures', 'earn'.
                        const typeMap = { 'funding': 'spot', 'trading': 'futures', 'earn': 'earn' };
                        const storeType = typeMap[w.type] || w.type;
                        if (newWallets[storeType]) {
                            newWallets[storeType][w.coin_symbol] = parseFloat(w.balance);
                        }
                    });

                    set({ wallets: newWallets });
                    get().updateAssetPrices();
                } else {
                    // If no wallets found in DB, but user is logged in, 
                    // we could seed the default demo 500 USDT to the DB here
                    try {
                        await supabase.from('wallets').insert([
                            { user_id: user.id, type: 'funding', coin_symbol: 'USDT', balance: 500 }
                        ]);
                        // Refetch after seeding
                        const { data: seededData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
                        if (seededData && seededData.length > 0) {
                            const newWallets = { spot: { USDT: 500 }, futures: {}, earn: {} };
                            set({ wallets: newWallets });
                            get().updateAssetPrices();
                        }
                    } catch (e) {
                        console.error('Wallet seeding failed:', e);
                    }
                }
            },

            performInternalTransfer: async (coin, from, to, amount) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return false;

                const { error } = await supabase.rpc('internal_transfer', {
                    p_user_id: user.id,
                    p_coin: coin,
                    p_from_type: from,
                    p_to_type: to,
                    p_amount: amount
                });

                if (error) {
                    console.error('Transfer error:', error);
                    return false;
                }

                await get().fetchSupabaseWallets();
                return true;
            },

            startEarnYield: () => {
                setInterval(() => {
                    const { wallets } = get();
                    const earnWallets = { ...wallets.earn };
                    let hasUpdate = false;

                    Object.keys(earnWallets).forEach(coin => {
                        const balance = earnWallets[coin] || 0;
                        if (balance > 0) {
                            // Simulate 5% APY -> yield per second
                            const yieldPerSecond = (balance * 0.05) / (365 * 24 * 3600);
                            earnWallets[coin] = balance + yieldPerSecond;
                            hasUpdate = true;
                        }
                    });

                    if (hasUpdate) {
                        set({ wallets: { ...wallets, earn: earnWallets } });
                        get().updateAssetPrices();
                    }
                }, 1000);
            },

            setSession: (session) => set({ session, user: session?.user ?? null }),
            signOut: async () => {
                await supabase.auth.signOut();
                set({ session: null, user: null });
            },

            // Demo Actions Impl
            setWallets: (w) => {
                set({ wallets: w });
                get().updateAssetPrices();
            },
            setDepositOptionOpen: (val) => set({ isDepositOptionOpen: val }),
            addTransaction: async (tx) => {
                set(s => ({ transactionHistory: [tx, ...s.transactionHistory] }));
                const { user } = get();
                if (user) {
                    await supabase.from('transactions').insert([{
                        user_id: user.id,
                        type: tx.type.toLowerCase(),
                        amount: tx.amount,
                        currency: tx.currency,
                        from_wallet: tx.from || null,
                        to_wallet: tx.to || null,
                        status: tx.status.toLowerCase()
                    }]);
                }
            },
            addTrade: async (tr) => {
                set(s => ({ tradeHistory: [tr, ...s.tradeHistory] }));
                const { user } = get();
                if (user) {
                    await supabase.from('orders_spot').insert([{
                        user_id: user.id,
                        pair: tr.symbol,
                        side: tr.side.toLowerCase(),
                        type: tr.type.toLowerCase(),
                        price: tr.price,
                        amount: tr.amount,
                        filled: tr.amount,
                        status: 'filled'
                    }]);
                }
            },
            fetchSupabaseHistory: async () => {
                const { user } = get();
                if (!user) return;

                const [txData, tradeData] = await Promise.all([
                    supabase.from('transactions').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
                    supabase.from('orders_spot').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);

                if (!txData.error && txData.data) {
                    const mappedTx = txData.data.map(t => ({
                        id: t.id,
                        type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                        status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
                        amount: parseFloat(t.amount),
                        currency: t.currency,
                        timestamp: new Date(t.timestamp).getTime(),
                        from: t.from_wallet,
                        to: t.to_wallet
                    }));
                    set({ transactionHistory: mappedTx });
                }

                if (!tradeData.error && tradeData.data) {
                    const mappedTrades = tradeData.data.map(t => ({
                        id: t.id,
                        symbol: t.pair,
                        side: t.side.charAt(0).toUpperCase() + t.side.slice(1),
                        type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                        price: parseFloat(t.price),
                        amount: parseFloat(t.amount),
                        fee: 0,
                        pnl: 0,
                        timestamp: new Date(t.created_at).getTime()
                    }));
                    set({ tradeHistory: mappedTrades });
                }
            },
            addPosition: (pos) => set(s => ({ positions: [...s.positions, pos] })),
            removePosition: (id) => set(s => ({ positions: s.positions.filter(p => p.id !== id) })),
            updatePosition: (id, updates) => set(s => ({
                positions: s.positions.map(p => p.id === id ? { ...p, ...updates } : p)
            })),
            placeSpotOrder: (order) => {
                const { wallets, openOrders } = get();
                const symbol = order.symbol.replace('USDT', '');

                if (order.type === 'Limit') {
                    // Lock funds
                    const newWallets = { ...wallets };
                    if (order.side === 'Buy') {
                        const cost = order.price * order.amount;
                        if ((newWallets.spot.USDT || 0) < cost) return;
                        newWallets.spot.USDT = (newWallets.spot.USDT || 0) - cost;
                    } else {
                        if ((newWallets.spot[symbol] || 0) < order.amount) return;
                        newWallets.spot[symbol] = (newWallets.spot[symbol] || 0) - order.amount;
                    }

                    const newOrder: PendingOrder = {
                        id: `ord-${Date.now()}`,
                        ...order,
                        filled: 0,
                        timestamp: Date.now()
                    };

                    set({ wallets: newWallets, openOrders: [newOrder, ...openOrders] });
                    get().addTransaction({
                        id: `TX-${Date.now()}`,
                        type: 'Trade',
                        status: 'Pending',
                        amount: order.side === 'Buy' ? order.price * order.amount : order.amount,
                        currency: order.side === 'Buy' ? 'USDT' : symbol,
                        timestamp: Date.now(),
                        to: 'Spot'
                    });
                } else {
                    // Market order: fill immediately at "last price" (simplified for demo)
                    const { markets } = get();
                    const market = markets.find(m => m.symbol === order.symbol);
                    const fillPrice = market ? parseFloat(market.lastPrice) : order.price;

                    const newWallets = { ...wallets };
                    const newCostBasis = { ...get().spotCostBasis };

                    if (order.side === 'Buy') {
                        const cost = fillPrice * order.amount;
                        if ((newWallets.spot.USDT || 0) < cost) return;

                        // Weighted average cost calculation
                        const oldAmount = newWallets.spot[symbol] || 0;
                        const oldCost = newCostBasis[symbol] || fillPrice;
                        const newAmount = oldAmount + order.amount;
                        newCostBasis[symbol] = ((oldAmount * oldCost) + (order.amount * fillPrice)) / newAmount;

                        newWallets.spot.USDT = (newWallets.spot.USDT || 0) - cost;
                        newWallets.spot[symbol] = newAmount;
                    } else {
                        if ((newWallets.spot[symbol] || 0) < order.amount) return;
                        newWallets.spot[symbol] = (newWallets.spot[symbol] || 0) - order.amount;
                        newWallets.spot.USDT = (newWallets.spot.USDT || 0) + (fillPrice * order.amount);
                    }

                    set({ wallets: newWallets, spotCostBasis: newCostBasis });
                    get().addTrade({
                        id: `TR-${Date.now()}`,
                        symbol: order.symbol,
                        side: order.side,
                        type: 'Market',
                        price: fillPrice,
                        amount: order.amount,
                        fee: 0,
                        pnl: 0,
                        timestamp: Date.now()
                    });
                }
                get().updateAssetPrices();
            },

            cancelSpotOrder: (orderId) => {
                const { openOrders, wallets } = get();
                const order = openOrders.find(o => o.id === orderId);
                if (!order) return;

                const newWallets = { ...wallets };
                const symbol = order.symbol.replace('USDT', '');

                if (order.side === 'Buy') {
                    const cost = order.price * order.amount;
                    newWallets.spot.USDT = (newWallets.spot.USDT || 0) + cost;
                } else {
                    newWallets.spot[symbol] = (newWallets.spot[symbol] || 0) + order.amount;
                }

                set({
                    wallets: newWallets,
                    openOrders: openOrders.filter(o => o.id !== orderId)
                });
            },

            placeFuturesOrder: (order) => {
                const { wallets, positions, futuresMarkets } = get();
                const market = futuresMarkets.find(m => m.symbol === order.symbol);
                const currentPrice = market ? parseFloat(market.lastPrice) : order.price;

                // Initial Margin Calculation: (Size * Price) / Leverage
                const marginRequired = (order.amount * currentPrice) / order.leverage;

                // "Available" in Futures = Wallet USDT - Sum of already locked margins
                const totalLockedMargin = positions.reduce((sum, p) => sum + p.margin, 0);
                const availableInFutures = (wallets.futures.USDT || 0) - totalLockedMargin;

                if (availableInFutures < marginRequired) {
                    console.error('Insufficient Futures Margin');
                    return;
                }

                // Standard Exchange Logic: Margin is NOT deducted from wallet balance.
                // It's just "locked" (accounted for in Available balance calculation).

                // Liquidation Price standard formula
                const liqPrice = order.side === 'Buy'
                    ? currentPrice * (1 - 1 / order.leverage)
                    : currentPrice * (1 + 1 / order.leverage);

                const newPosition: FuturesPosition = {
                    id: `pos-${Date.now()}`,
                    symbol: order.symbol,
                    pair: order.symbol, // Sync with interface
                    side: order.side === 'Buy' ? 'Buy' : 'Sell',
                    size: order.amount,
                    entryPrice: currentPrice,
                    markPrice: currentPrice,
                    margin: marginRequired,
                    leverage: order.leverage,
                    pnl: 0,
                    pnlPercent: 0,
                    liqPrice,
                    marginMode: order.marginMode
                };

                const existingPosIdx = positions.findIndex(p => p.symbol === order.symbol && p.side === order.side);
                let nextPositions = [...positions];
                if (existingPosIdx > -1) {
                    const existing = positions[existingPosIdx];
                    const newSize = existing.size + order.amount;
                    const newEntry = ((existing.entryPrice * existing.size) + (currentPrice * order.amount)) / newSize;
                    nextPositions[existingPosIdx] = {
                        ...existing,
                        size: newSize,
                        entryPrice: newEntry,
                        margin: existing.margin + marginRequired,
                    };
                } else {
                    nextPositions = [newPosition, ...positions];
                }

                set({ positions: nextPositions });
                get().updateAssetPrices();

                get().addTrade({
                    id: `TR-F-${Date.now()}`,
                    symbol: order.symbol,
                    side: order.side,
                    type: order.type,
                    price: currentPrice,
                    amount: order.amount,
                    fee: 0,
                    pnl: 0,
                    timestamp: Date.now()
                });
            },

            closeFuturesPosition: (id) => {
                const { positions, wallets } = get();
                const pos = positions.find(p => p.id === id);
                if (!pos) return;

                // When closing, Realized PnL is added to the wallet balance
                const newWallets = { ...wallets };
                newWallets.futures.USDT = (newWallets.futures.USDT || 0) + pos.pnl;

                set({
                    wallets: newWallets,
                    positions: positions.filter(p => p.id !== id)
                });

                get().updateAssetPrices();
            },

            resetWallets: () => {
                const now = Date.now();
                const initialHistory = [
                    { id: `INIT-USDT-${now}`, type: 'Deposit', status: 'Completed', amount: 500, currency: 'USDT', timestamp: now, to: 'Spot' },
                ];

                set({
                    wallets: {
                        spot: { USDT: 500 },
                        futures: { USDT: 0 },
                        earn: { USDT: 0 }
                    },
                    spotCostBasis: {},
                    transactionHistory: initialHistory,
                    tradeHistory: [],
                    positions: [],
                    openOrders: [],
                    snapshots: { [new Date().toISOString().split('T')[0]]: 500 },
                    balance: 500,
                    spotBalance: 500,
                    futuresBalance: 0,
                    earnBalance: 0,
                    todayPnl: 0,
                    todaySpotPnl: 0,
                    pnlPercent: 0,
                    assets: [{ symbol: 'USDT', amount: 500, valueUsdt: 500 }]
                });
                get().updateAssetPrices();
            },

            // Auto-Calculation: recalculate asset values from latest market prices and wallets
            // Auto-PnL: compute daily PnL from weighted asset × priceChangePercent
            updateAssetPrices: () => {
                set((state) => {
                    const { wallets, markets, futuresMarkets, openOrders, positions, spotCostBasis, tradeHistory } = state;

                    // 1. --- Matcher Simulation (for Spot Limit Orders) ---
                    let fillOccurred = false;
                    const remainingOrders = [];
                    const updatedWallets = JSON.parse(JSON.stringify(wallets));
                    const updatedCostBasis = { ...spotCostBasis };
                    const updatedTradeHistory = [...tradeHistory];

                    openOrders.forEach(order => {
                        const market = markets.find(m => m.symbol === order.symbol);
                        if (!market) {
                            remainingOrders.push(order);
                            return;
                        }

                        const currentPrice = parseFloat(market.lastPrice);
                        const shouldFill = order.side === 'Buy'
                            ? currentPrice <= order.price
                            : currentPrice >= order.price;

                        if (shouldFill) {
                            fillOccurred = true;
                            const symbol = order.symbol.replace('USDT', '');
                            if (order.side === 'Buy') {
                                const oldAmount = updatedWallets.spot[symbol] || 0;
                                const oldCost = updatedCostBasis[symbol] || currentPrice;
                                const newAmount = oldAmount + order.amount;
                                updatedCostBasis[symbol] = ((oldAmount * oldCost) + (order.amount * currentPrice)) / newAmount;
                                updatedWallets.spot[symbol] = newAmount;
                                updatedWallets.spot.USDT = (updatedWallets.spot.USDT || 0) - (order.amount * currentPrice);
                            } else {
                                updatedWallets.spot.USDT = (updatedWallets.spot.USDT || 0) + (currentPrice * order.amount);
                                updatedWallets.spot[symbol] = (updatedWallets.spot[symbol] || 0) - order.amount;
                            }
                            updatedTradeHistory.push({
                                id: Math.random().toString(36).substr(2, 9),
                                symbol: order.symbol,
                                side: order.side,
                                price: currentPrice,
                                amount: order.amount,
                                timestamp: Date.now(),
                                pnl: 0,
                                status: 'Completed'
                            });
                        } else {
                            remainingOrders.push(order);
                        }
                    });

                    // 2. --- Sync Futures Unrealized PnL & Monitor Liquidations ---
                    const updatedPositions = [];
                    positions.forEach(pos => {
                        const market = futuresMarkets.find(m => m.symbol === pos.symbol);
                        if (market) {
                            const markPrice = parseFloat(market.lastPrice);

                            // Check for liquidation (Isolated Margin)
                            const isLiquidated = pos.side === 'Buy'
                                ? markPrice <= pos.liqPrice
                                : markPrice >= pos.liqPrice;

                            if (isLiquidated) {
                                fillOccurred = true;
                                // In this engine, margin is not deducted from wallet when opening.
                                // So on liquidation, we must deduct the lost margin.
                                updatedWallets.futures.USDT = (updatedWallets.futures.USDT || 0) - pos.margin;

                                updatedTradeHistory.push({
                                    id: `LIQ-${Date.now()}-${pos.id}`,
                                    symbol: pos.symbol,
                                    side: pos.side,
                                    type: 'Liquidation',
                                    price: markPrice,
                                    amount: pos.size,
                                    fee: 0,
                                    pnl: -pos.margin,
                                    timestamp: Date.now(),
                                    status: 'Completed'
                                });
                            } else {
                                const priceDiff = pos.side === 'Buy' ? (markPrice - pos.entryPrice) : (pos.entryPrice - markPrice);
                                const pnl = priceDiff * pos.size;
                                const pnlPercent = (pnl / pos.margin) * 100;
                                updatedPositions.push({
                                    ...pos,
                                    markPrice,
                                    pnl: parseFloat(pnl.toFixed(2)),
                                    pnlPercent: parseFloat(pnlPercent.toFixed(2))
                                });
                            }
                        } else {
                            updatedPositions.push(pos);
                        }
                    });

                    // 3. --- Calculate Balances & Asset Values ---
                    let spotTotal = 0;
                    let futuresTotal = 0;
                    let earnTotal = 0;
                    let weightedPnl = 0;

                    const finalWallets = fillOccurred ? updatedWallets : wallets;

                    const updatedAssets = Object.entries(finalWallets.spot).map(([symbol, amount]) => {
                        let valueUsdt = amount as number;
                        let changePercent = 0;
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            if (market) {
                                valueUsdt = (amount as number) * parseFloat(market.lastPrice);
                                changePercent = parseFloat(market.priceChangePercent);
                            }
                        }
                        spotTotal += valueUsdt;
                        weightedPnl += valueUsdt * changePercent / 100;
                        return { symbol, amount: amount as number, valueUsdt };
                    }).filter(a => a.amount > 0 || a.symbol === 'USDT');

                    // Futures Wallet balance calculation
                    futuresTotal = (finalWallets.futures.USDT || 0);
                    const totalFuturesUnrealizedPnl = updatedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);

                    // Earn wallet
                    Object.entries(finalWallets.earn).forEach(([symbol, amount]) => {
                        let valueUsdt = amount as number;
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            if (market) valueUsdt = (amount as number) * parseFloat(market.lastPrice);
                        }
                        earnTotal += valueUsdt;
                    });

                    const totalValue = spotTotal + futuresTotal + earnTotal + totalFuturesUnrealizedPnl;
                    // Apply 0.1% simulated spread/fee on the estimated total wealth for conservatism
                    const conservativeTotalValue = totalValue * 0.999;
                    const pnlPercentValue = totalValue > 0 ? ((weightedPnl + totalFuturesUnrealizedPnl) / totalValue) * 100 : 0;

                    // 4. --- Update BTC Rate ---
                    const btcMarket = markets.find(m => m.symbol === 'BTCUSDT');
                    const btcPrice = btcMarket ? parseFloat(btcMarket.lastPrice) : 0;
                    const newRates = { ...state.rates };
                    if (btcPrice > 0) newRates.BTC = 1 / btcPrice;

                    // 5. --- Snapshot logic ---
                    const today = new Date().toISOString().split('T')[0];
                    const nextSnapshots = { ...state.snapshots };
                    if (!nextSnapshots[today]) nextSnapshots[today] = totalValue;

                    return {
                        wallets: finalWallets,
                        openOrders: remainingOrders,
                        spotCostBasis: fillOccurred ? updatedCostBasis : spotCostBasis,
                        tradeHistory: fillOccurred ? updatedTradeHistory : tradeHistory,
                        positions: updatedPositions,
                        assets: updatedAssets,
                        balance: totalValue,
                        spotBalance: spotTotal,
                        futuresBalance: futuresTotal,
                        earnBalance: earnTotal,
                        todayPnl: weightedPnl + totalFuturesUnrealizedPnl,
                        todaySpotPnl: weightedPnl,
                        pnlPercent: parseFloat(pnlPercentValue.toFixed(2)),
                        futuresUnrealizedPnl: totalFuturesUnrealizedPnl,
                        rates: newRates,
                        snapshots: nextSnapshots
                    };
                });
            },

            getPnLForTimeframe: (timeframe: string) => {
                const { snapshots, transactionHistory, balance } = get();
                const now = new Date();
                let historicalDate = new Date();

                const todayStr = now.toISOString().split('T')[0];
                let historicalEquity = 0;
                let baselineFound = false;
                let baselineTimestamp = 0;

                if (timeframe === '1D') {
                    if (snapshots[todayStr] !== undefined) {
                        historicalEquity = snapshots[todayStr];
                        baselineFound = true;
                        baselineTimestamp = new Date(todayStr).getTime();
                    }
                } else {
                    // Calculate the start date for comparison based on timeframe
                    switch (timeframe) {
                        case '1W': historicalDate.setDate(now.getDate() - 7); break;
                        case '1M': historicalDate.setMonth(now.getMonth() - 1); break;
                        case '6M': historicalDate.setMonth(now.getMonth() - 6); break;
                        case '1Y': historicalDate.setFullYear(now.getFullYear() - 1); break;
                    }

                    const targetDateStr = historicalDate.toISOString().split('T')[0];
                    const sortedDates = Object.keys(snapshots).sort();

                    if (snapshots[targetDateStr] !== undefined) {
                        historicalEquity = snapshots[targetDateStr];
                        baselineFound = true;
                        baselineTimestamp = historicalDate.getTime();
                    } else {
                        for (let i = sortedDates.length - 1; i >= 0; i--) {
                            if (sortedDates[i] < targetDateStr) {
                                historicalEquity = snapshots[sortedDates[i]];
                                baselineFound = true;
                                baselineTimestamp = new Date(sortedDates[i]).getTime();
                                break;
                            }
                        }
                    }
                }

                if (!baselineFound) {
                    historicalEquity = 0;
                    baselineTimestamp = 0;
                }

                const periodFlow = transactionHistory
                    .filter(tx => tx.timestamp > baselineTimestamp && tx.status === 'Completed')
                    .reduce((acc, tx) => {
                        if (tx.type === 'Deposit') return acc + tx.amount;
                        if (tx.type === 'Withdrawal') return acc - tx.amount;
                        return acc;
                    }, 0);

                // 5. Total PnL = Current Total Equity - (Baseline + Net Flow)
                const currentPnL = (balance - historicalEquity) - periodFlow;

                // 6. Calculate Base Capital for ROI (Baseline + all Deposits in period)
                const depositsInPeriod = transactionHistory
                    .filter(tx => tx.timestamp > baselineTimestamp && tx.status === 'Completed' && tx.type === 'Deposit')
                    .reduce((acc, tx) => acc + tx.amount, 0);

                const baseCapital = historicalEquity + depositsInPeriod;
                const pnlPct = baseCapital > 0 ? (currentPnL / baseCapital) * 100 : 0;

                return {
                    value: currentPnL,
                    percent: parseFloat(pnlPct.toFixed(2))
                };
            },

            closeAll: () => {
                set((state) => {
                    const { wallets, spotCostBasis, markets } = state;
                    const newWallets = { ...wallets };
                    let additionalUsdt = 0;

                    // Convert all spot assets (that we have cost basis for) back to USDT
                    const newSpotWallets = { ...newWallets.spot };
                    Object.keys(spotCostBasis).forEach(symbol => {
                        const coin = symbol.replace('USDT', '');
                        const amount = newSpotWallets[coin] || 0;
                        if (amount > 0) {
                            const market = markets.find(m => m.symbol === symbol);
                            const price = market ? parseFloat(market.lastPrice) : 0;
                            additionalUsdt += amount * price;
                            delete newSpotWallets[coin];
                        }
                    });

                    newSpotWallets.USDT = (newSpotWallets.USDT || 0) + additionalUsdt;
                    newWallets.spot = newSpotWallets;

                    // Reset futures wallet USDT to include margin from closed positions
                    // (Simplified: in this demo, positions are effectively removed)

                    return {
                        openOrders: [],
                        positions: [],
                        spotCostBasis: {},
                        wallets: newWallets
                    };
                });
                get().updateAssetPrices();
            },
        }),
        { name: 'triv-ultra-storage' }
    )
);

export default useExchangeStore;
