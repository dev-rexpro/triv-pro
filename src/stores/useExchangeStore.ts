// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    MarketData, Asset, ExchangeRates, FavoriteGroups, CurrencyCode,
    WalletBalances, TransactionRecord, TradeRecord, PendingOrder, FuturesPosition, UnifiedCoin, PositionHistoryRecord
} from '../types';
import type { BinanceSymbolInfo } from '../utils/api';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import Decimal from 'decimal.js';

// Throttle portfolio balance recalculation to 3s (like Binance/OKX/MEXC)
// User-triggered actions (trades, deposits) pass force=true to bypass
let lastPortfolioCalc = 0;
const PORTFOLIO_THROTTLE_MS = 3000;

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
    positionHistory: PositionHistoryRecord[];
    snapshots: { [date: string]: number };
    nextFundingTime: number;
    fundingRate: number;
    startFundingCron: () => void;

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
    getPnLForTimeframe: (timeframe: string) => { value: number; percent: number; hasData: boolean };
    setShowOrderConfirmation: (val: boolean) => void;
    closeAll: () => void;
    syncWalletsToSupabase: () => Promise<void>;
    fetchSupabaseWallets: () => Promise<void>;
    fetchSupabaseHistory: () => Promise<void>;
    initializeUserData: () => Promise<void>;
    performInternalTransfer: (coin: string, from: string, to: string, amount: number) => Promise<boolean>;
    fetchSupabaseFavorites: () => Promise<void>;
    syncFavoritesToSupabase: () => Promise<void>;
    startEarnYield: () => void;
    setSession: (session: Session | null) => void;
    signOut: () => Promise<void>;
    fetchSupabasePositions: () => Promise<void>;
    setSpotCostPrice: (coin: string, price: number) => Promise<void>;

    // Global Toast
    toastMessage: { isOpen: boolean; title: string; message: string; type: 'success' | 'error' } | null;
    showToast: (title: string, message: string, type?: 'success' | 'error') => void;
    hideToast: () => void;

    // Theme
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const useExchangeStore = create<ExchangeState>()(
    persist(
        (set, get) => ({
            markets: [],
            futuresMarkets: [],
            spotSymbols: [],
            futuresSymbols: [],
            history: ['NEWT (Ethereum)', 'JTOUSDT Perp', 'SOLUSDT Perp'],
            favorites: [
                'BTCUSDT:spot', 'ETHUSDT:spot', 'SOLUSDT:spot', 'DOGEUSDT:spot', 'XRPUSDT:spot',
                'BTCUSDT:futures', 'ETHUSDT:futures', 'SOLUSDT:futures', 'DOGEUSDT:futures', 'XRPUSDT:futures'
            ],
            favoriteGroups: {},
            hiddenGroups: [],
            balance: 0,
            spotBalance: 0,
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
            assets: [],
            currency: 'USD',
            rates: { USD: 1, USDT: 1, IDR: 16300, BTC: 0.000015 },
            hideBalance: false,
            showOrderConfirmation: true,
            futuresUnrealizedPnl: 0,
            toastMessage: null,
            theme: 'light',

            // Engine State (Not persisted)
            wallets: {
                spot: {},
                futures: {},
                earn: {}
            },
            positions: [],
            openOrders: [],
            spotCostBasis: {},
            transactionHistory: [],
            tradeHistory: [],
            positionHistory: [],
            watchlist: [],
            snapshots: {},
            nextFundingTime: Math.ceil(Date.now() / (8 * 3600 * 1000)) * (8 * 3600 * 1000),
            fundingRate: 0.0001,

            setMarkets: (data) => set({ markets: data.map(m => ({ ...m, isFutures: false })) }),
            updateMarkets: (updates) => set((state) => {
                const map = new Map(state.markets.map(m => [m.symbol, m]));
                updates.forEach(u => {
                    const existing = map.get(u.symbol);
                    map.set(u.symbol, existing ? { ...existing, ...u, isFutures: false } : { ...u, isFutures: false } as MarketData);
                });
                return { markets: Array.from(map.values()) };
            }),
            setFuturesMarkets: (data) => set({ futuresMarkets: data.map(m => ({ ...m, isFutures: true })) }),
            updateFuturesMarkets: (updates) => set((state) => {
                const map = new Map(state.futuresMarkets.map(m => [m.symbol, m]));
                updates.forEach(u => {
                    const existing = map.get(u.symbol);
                    map.set(u.symbol, existing ? { ...existing, ...u, isFutures: true } : { ...u, isFutures: true } as MarketData);
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

            toggleFavorite: async (symbolWithMarket) => {
                const favs = get().favorites;
                const [symbol, market] = symbolWithMarket.includes(':') ? symbolWithMarket.split(':') : [symbolWithMarket, null];

                // Find existing: either the exact match or the old-style symbol
                const existingMatch = favs.find(s => s === symbolWithMarket || (market && s === symbol));
                const isAdding = !existingMatch;

                let newFavs;
                if (isAdding) {
                    newFavs = [...favs, symbolWithMarket];
                } else {
                    // Remove ALL matches (old style or exact new style)
                    newFavs = favs.filter(s => s !== symbolWithMarket && s !== symbol);
                }

                // Update groups
                const newGroups = { ...get().favoriteGroups };
                if (newGroups['Group-1']) {
                    newGroups['Group-1'] = newFavs;
                }

                // If removingGlobally, remove from all custom groups too
                if (!isAdding) {
                    Object.keys(newGroups).forEach(groupName => {
                        if (groupName !== 'Group-1') {
                            newGroups[groupName] = newGroups[groupName].filter(s => s !== symbolWithMarket && s !== symbol);
                        }
                    });
                }

                set({ favorites: newFavs, favoriteGroups: newGroups });
                await get().syncFavoritesToSupabase();
            },

            addFavoriteGroup: async (name) => {
                set((state) => ({ favoriteGroups: { ...state.favoriteGroups, [name]: [] } }));
                await get().syncFavoritesToSupabase();
            },

            deleteFavoriteGroup: async (name) => {
                set((state) => {
                    const newGroups = { ...state.favoriteGroups };
                    delete newGroups[name];
                    return { favoriteGroups: newGroups, hiddenGroups: state.hiddenGroups.filter(g => g !== name) };
                });
                await get().syncFavoritesToSupabase();
            },

            renameFavoriteGroup: async (oldName, newName) => {
                set((state) => {
                    const newGroups = {};
                    for (const key of Object.keys(state.favoriteGroups)) {
                        if (key === oldName) {
                            newGroups[newName] = state.favoriteGroups[oldName];
                        } else {
                            newGroups[key] = state.favoriteGroups[key];
                        }
                    }
                    const newHidden = state.hiddenGroups.map(g => g === oldName ? newName : g);
                    return { favoriteGroups: newGroups, hiddenGroups: newHidden };
                });
                await get().syncFavoritesToSupabase();
            },

            toggleGroupVisibility: async (name) => {
                set((state) => {
                    const isHidden = state.hiddenGroups.includes(name);
                    return {
                        hiddenGroups: isHidden
                            ? state.hiddenGroups.filter(g => g !== name)
                            : [...state.hiddenGroups, name]
                    };
                });
                await get().syncFavoritesToSupabase();
            },

            reorderFavoriteGroups: async (newOrder) => {
                set((state) => {
                    const newGroups = {};
                    const existingKeys = Object.keys(state.favoriteGroups);
                    const combinedOrder = [...new Set([...newOrder, ...existingKeys])];
                    for (const key of combinedOrder) {
                        if (state.favoriteGroups[key]) {
                            newGroups[key] = state.favoriteGroups[key];
                        }
                    }
                    return { favoriteGroups: newGroups };
                });
                await get().syncFavoritesToSupabase();
            },

            reorderGroupCoins: async (groupName, newOrder) => {
                set((state) => {
                    if (!state.favoriteGroups[groupName]) return state;
                    return {
                        favoriteGroups: { ...state.favoriteGroups, [groupName]: newOrder }
                    };
                });
                await get().syncFavoritesToSupabase();
            },

            removeCoinsFromGroup: async (groupName, coinsToRemove) => {
                set((state) => {
                    if (!state.favoriteGroups[groupName]) return state;
                    return {
                        favoriteGroups: {
                            ...state.favoriteGroups,
                            [groupName]: state.favoriteGroups[groupName].filter(c => !coinsToRemove.includes(c))
                        }
                    };
                });
                await get().syncFavoritesToSupabase();
            },

            syncWalletsToSupabase: async () => {
                const { user, wallets } = get();
                if (!user) return;

                const updates: any[] = [];
                const typeMap: Record<string, string> = { 'spot': 'funding', 'futures': 'trading', 'earn': 'earn' };

                ['spot', 'futures', 'earn'].forEach(type => {
                    Object.entries(wallets[type as keyof typeof wallets] || {}).forEach(([coin, balance]) => {
                        updates.push({
                            user_id: user.id,
                            type: typeMap[type],
                            coin_symbol: coin,
                            balance: balance
                        });
                    });
                });

                if (updates.length > 0) {
                    await supabase.from('wallets').upsert(updates, { onConflict: 'user_id, type, coin_symbol' });
                }

                // Also sync spotCostBasis into preferences
                const { spotCostBasis } = get();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('preferences')
                    .eq('id', user.id)
                    .maybeSingle();

                const updatedPreferences = {
                    ...(profile?.preferences || {}),
                    spotCostBasis
                };

                await supabase
                    .from('profiles')
                    .upsert({ 
                        id: user.id, 
                        preferences: updatedPreferences,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
            },

            fetchSupabaseWallets: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Fetch wallets error:', error);
                    return;
                }

                if (!error) {
                    console.log(`[Diagnostic] Fetched Wallets for ${user.id}:`, data);
                    const newWallets = {
                        spot: {},
                        futures: {},
                        earn: {}
                    };

                    if (data && data.length > 0) {
                        data.forEach((w: any) => {
                            const typeMap = { 'funding': 'spot', 'trading': 'futures', 'earn': 'earn' };
                            const storeType = typeMap[w.type] || w.type;
                            if (newWallets[storeType]) {
                                newWallets[storeType][w.coin_symbol] = parseFloat(w.balance);
                            }
                        });
                    }
                    
                    set({ wallets: newWallets });
                    get().updateAssetPrices(true);
                }
            },

            performInternalTransfer: async (coin, from, to, amount) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error('Transfer failed: No user found');
                    return false;
                }

                const typeMap = { 'spot': 'funding', 'futures': 'trading', 'earn': 'earn' };
                const dbFrom = typeMap[from] || from;
                const dbTo = typeMap[to] || to;

                console.log(`[Diagnostic] Attempting transfer: ${amount} ${coin} from ${dbFrom} to ${dbTo} for user ${user.id}`);

                const { data, error } = await supabase.rpc('internal_transfer', {
                    p_user_id: user.id,
                    p_coin: coin,
                    p_from_type: dbFrom,
                    p_to_type: dbTo,
                    p_amount: amount
                });

                if (error) {
                    console.error('[Diagnostic] Transfer RPC error:', error.message || error);
                    useExchangeStore.getState().showToast('Transfer Failed', error.message || 'Database error during transfer', 'error');
                    return false;
                }

                console.log('[Diagnostic] Transfer RPC Success Response:', data);

                await get().fetchSupabaseWallets();
                await get().fetchSupabaseHistory();
                return true;
            },

            syncFavoritesToSupabase: async () => {
                const { user, favorites, favoriteGroups, hiddenGroups } = get();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('preferences')
                    .eq('id', user.id)
                    .maybeSingle(); // maybeSingle returns null if no rows instead of erroring 406

                const updatedPreferences = {
                    ...(profile?.preferences || {}),
                    favorites,
                    favoriteGroups,
                    hiddenGroups
                };

                await supabase
                    .from('profiles')
                    .upsert({ 
                        id: user.id, 
                        preferences: updatedPreferences,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
            },

            fetchSupabaseFavorites: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('profiles')
                    .select('preferences')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!error && data?.preferences) {
                    const { favorites, favoriteGroups, hiddenGroups, spotCostBasis } = data.preferences;
                    if (favorites) set({ favorites });
                    if (favoriteGroups) set({ favoriteGroups });
                    if (hiddenGroups) set({ hiddenGroups });
                    if (spotCostBasis) set({ spotCostBasis });
                } else if (!data) {
                    // Profile doesn't exist, create it
                    await get().syncFavoritesToSupabase();
                }
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
                        get().updateAssetPrices(); // throttled — earn yield is background
                    }
                }, 1000);
            },

            fetchSupabasePositions: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('positions_futures')
                    .select('*')
                    .eq('user_id', user.id);

                if (!error && data) {
                    const mappedPositions = data.map((p: any) => ({
                        id: p.id,
                        symbol: p.pair,
                        pair: p.pair,
                        side: p.side === 'long' ? 'Buy' : 'Sell',
                        size: parseFloat(p.size),
                        entryPrice: parseFloat(p.entry_price),
                        markPrice: parseFloat(p.entry_price),
                        margin: parseFloat(p.margin),
                        leverage: p.leverage,
                        pnl: 0,
                        pnlPercent: 0,
                        liqPrice: parseFloat(p.liquidation_price),
                        marginMode: p.margin_type === 'cross' ? 'Cross' : 'Isolated'
                    }));
                    
                    set({ positions: mappedPositions });
                    get().updateAssetPrices(true);
                }
            },

            setSpotCostPrice: async (coin, price) => {
                const { spotCostBasis, user } = get();
                const newBasis = { ...spotCostBasis, [coin]: price };
                set({ spotCostBasis: newBasis });
                if (user) {
                    await get().syncWalletsToSupabase();
                }
            },

            setSession: (session) => {
                const currentUser = get().user;
                const nextUser = session?.user ?? null;
                
                // If user changed (login to different account or logout)
                if (currentUser?.id !== nextUser?.id) {
                    set({ 
                        wallets: { spot: {}, futures: {}, earn: {} },
                        transactionHistory: [],
                        tradeHistory: [],
                        positions: [],
                        openOrders: [],
                        positionHistory: [],
                        assets: [],
                        balance: 0,
                        spotBalance: 0,
                        futuresBalance: 0,
                        earnBalance: 0,
                        todayPnl: 0,
                        todaySpotPnl: 0,
                        pnlPercent: 0,
                        session, 
                        user: nextUser 
                    });
                } else {
                    set({ session, user: nextUser });
                }
            },
            signOut: async () => {
                await supabase.auth.signOut();
                // setSession will handle state clearing via listener
            },

            // Demo Actions Impl
            setWallets: (w) => {
                set({ wallets: w });
                get().updateAssetPrices();
            },
            setDepositOptionOpen: (val) => set({ isDepositOptionOpen: val }),
            showToast: (title, message, type = 'success') => set({ toastMessage: { isOpen: true, title, message, type } }),
            hideToast: () => set({ toastMessage: null }),
            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: newTheme });
            },
            addTransaction: async (tx) => {
                set(s => ({ transactionHistory: [tx, ...s.transactionHistory] }));
                const { user } = get();
                if (user) {
                    // Normalize type to match DB CHECK constraint ('deposit','withdrawal','transfer','trade','stake')
                    const allowedTypes = ['deposit', 'withdrawal', 'transfer', 'trade', 'stake'];
                    const typeNorm = tx.type.toLowerCase();
                    const dbType = allowedTypes.includes(typeNorm) ? typeNorm : 'transfer';
                    try {
                        await supabase.from('transactions').insert([{
                            user_id: user.id,
                            type: dbType,
                            amount: tx.amount,
                            currency: tx.currency,
                            from_wallet: tx.from || null,
                            to_wallet: tx.to || null,
                            status: tx.status.toLowerCase()
                        }]);
                    } catch (e) {
                        console.warn('Transaction DB insert failed (non-critical):', e);
                    }
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
            initializeUserData: async () => {
                const { user } = get();
                get().startFundingCron();
                if (!user) return;
                
                await Promise.all([
                    get().fetchSupabaseWallets(),
                    get().fetchSupabaseHistory(),
                    get().fetchSupabaseFavorites(),
                    get().fetchSupabasePositions()
                ]);
            },

            startFundingCron: () => {
                setInterval(() => {
                    const now = Date.now();
                    const { nextFundingTime, fundingRate, positions, wallets, addTransaction, updateAssetPrices } = get();

                    if (now >= nextFundingTime) {
                        if (positions.length > 0) {
                            const newWallets = { ...wallets };
                            let totalFee = new Decimal(0);
                            // logic...

                            positions.forEach(pos => {
                                const notional = new Decimal(pos.size).times(pos.markPrice || pos.entryPrice);
                                const fee = notional.times(fundingRate);

                                if (pos.side === 'Buy') {
                                    totalFee = totalFee.minus(fee);
                                } else {
                                    totalFee = totalFee.plus(fee);
                                }
                            });

                            newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).plus(totalFee).toNumber();

                            set({ wallets: newWallets });
                            updateAssetPrices(true);

                            addTransaction({
                                id: `FUND-${Date.now()}`,
                                type: 'Trade',
                                status: 'Completed',
                                amount: Math.abs(totalFee.toNumber()),
                                currency: 'USDT',
                                timestamp: Date.now(),
                                to: 'Futures'
                            });
                        }
                        set({ nextFundingTime: nextFundingTime + (8 * 3600 * 1000) });
                    }
                }, 1000);
            },

            fetchSupabaseHistory: async () => {
                const { user } = get();
                if (!user) return;

                const [txData, tradeData] = await Promise.all([
                    supabase.from('transactions').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
                    supabase.from('orders_spot').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);

                if (!txData.error) {
                    const seenIds = new Set();
                    const mappedTx = (txData.data || [])
                        .filter(t => {
                            if (seenIds.has(t.id)) return false;
                            seenIds.add(t.id);
                            return true;
                        })
                        .map(t => ({
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

                if (!tradeData.error) {
                    const seenTradeIds = new Set();
                    const mappedTrades = (tradeData.data || [])
                        .filter(t => {
                            if (seenTradeIds.has(t.id)) return false;
                            seenTradeIds.add(t.id);
                            return true;
                        })
                        .map(t => ({
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
            placeSpotOrder: async (order) => {
                const { wallets, openOrders, markets, spotCostBasis, user } = get();
                const symbol = order.symbol.replace('USDT', '');
                const newWallets = JSON.parse(JSON.stringify(wallets));
                const feeRate = 0.001;

                if (order.type === 'Limit') {
                    const cost = new Decimal(order.price).times(order.amount).toNumber();
                    if (order.side === 'Buy') {
                        if ((newWallets.spot.USDT || 0) < cost) {
                            get().showToast('Insufficient Balance', `Required ${cost.toFixed(2)} USDT`, 'error');
                            return;
                        }
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).minus(cost).toNumber();
                    } else {
                        if ((newWallets.spot[symbol] || 0) < order.amount) {
                            get().showToast('Insufficient Balance', `Required ${order.amount} ${symbol}`, 'error');
                            return;
                        }
                        newWallets.spot[symbol] = new Decimal(newWallets.spot[symbol] || 0).minus(order.amount).toNumber();
                    }

                    const newOrder: PendingOrder = {
                        id: `ord-${Date.now()}`,
                        ...order,
                        filled: 0,
                        timestamp: Date.now()
                    };

                    set({ wallets: newWallets, openOrders: [newOrder, ...openOrders] });
                    get().showToast('Limit Order Placed', `Submitted Limit ${order.side} order for ${order.amount} ${symbol} at ${order.price} USDT`, 'success');
                    get().addTransaction({
                        id: `TX-${Date.now()}`,
                        type: 'Trade',
                        status: 'Pending',
                        amount: order.side === 'Buy' ? cost : order.amount,
                        currency: order.side === 'Buy' ? 'USDT' : symbol,
                        timestamp: Date.now(),
                        to: 'Spot'
                    });

                    if (user) {
                        await supabase.from('orders_spot').insert([{
                            user_id: user.id,
                            pair: order.symbol,
                            side: order.side.toLowerCase(),
                            type: 'limit',
                            price: order.price,
                            amount: order.amount,
                            status: 'open'
                        }]);
                        get().syncWalletsToSupabase();
                    }
                } else {
                    const market = markets.find(m => m.symbol === order.symbol);
                    const fillPrice = market ? parseFloat(market.lastPrice) : order.price;
                    
                    const slippage = 0.0005; 
                    const executedPrice = order.side === 'Buy' 
                        ? new Decimal(fillPrice).times(1 + slippage).toNumber()
                        : new Decimal(fillPrice).times(1 - slippage).toNumber();

                    const cost = new Decimal(executedPrice).times(order.amount).toNumber();
                    const fee = new Decimal(cost).times(feeRate).toNumber();
                    const newCostBasis = { ...spotCostBasis };

                    if (order.side === 'Buy') {
                        const totalCost = new Decimal(cost).plus(fee).toNumber();
                        if ((newWallets.spot.USDT || 0) < totalCost) {
                            get().showToast('Insufficient Balance', `Required ${totalCost.toFixed(2)} USDT`, 'error');
                            return;
                        }
                        
                        const oldAmount = newWallets.spot[symbol] || 0;
                        const oldCost = newCostBasis[symbol] || executedPrice;
                        const newAmount = new Decimal(oldAmount).plus(order.amount).toNumber();
                        newCostBasis[symbol] = new Decimal(oldAmount).times(oldCost).plus(cost).div(newAmount).toNumber();

                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).minus(totalCost).toNumber();
                        newWallets.spot[symbol] = newAmount;
                    } else {
                        if ((newWallets.spot[symbol] || 0) < order.amount) {
                            get().showToast('Insufficient Balance', `Required ${order.amount} ${symbol}`, 'error');
                            return;
                        }
                        const receiveAmount = new Decimal(cost).minus(fee).toNumber();
                        newWallets.spot[symbol] = new Decimal(newWallets.spot[symbol] || 0).minus(order.amount).toNumber();
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).plus(receiveAmount).toNumber();
                    }

                    set({ wallets: newWallets, spotCostBasis: newCostBasis });
                    get().showToast('Market Order Filled', `${order.side === 'Buy' ? 'Bought' : 'Sold'} ${order.amount} ${symbol} at avg. ${executedPrice.toFixed(2)} USDT`, 'success');
                    get().addTrade({
                        id: `TR-${Date.now()}`,
                        symbol: order.symbol,
                        side: order.side,
                        type: 'Market',
                        price: executedPrice,
                        amount: order.amount,
                        fee: fee,
                        pnl: 0,
                        timestamp: Date.now()
                    });
                    
                    if (user) {
                        await supabase.from('orders_spot').insert([{
                            user_id: user.id,
                            pair: order.symbol,
                            side: order.side.toLowerCase(),
                            type: 'market',
                            price: executedPrice,
                            amount: order.amount,
                            filled: order.amount,
                            status: 'filled'
                        }]);
                        get().syncWalletsToSupabase();
                    }
                }
                get().updateAssetPrices(true);
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
                get().showToast('Order Canceled', `Spot order successfully canceled.`, 'success');
            },

            placeFuturesOrder: async (order) => {
                const { wallets, positions, futuresMarkets, user } = get();
                const market = futuresMarkets.find(m => m.symbol === order.symbol);
                const currentPrice = market ? parseFloat(market.lastPrice) : order.price;

                const notionalValue = new Decimal(order.amount).times(currentPrice);
                const marginRequired = notionalValue.div(order.leverage).toNumber();
                const feeRate = 0.0005;
                const fee = notionalValue.times(feeRate).toNumber();

                const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
                const currentEquity = new Decimal(wallets.futures.USDT || 0).plus(totalUnrealizedPnl).toNumber();
                const totalLockedMargin = positions.reduce((sum, p) => sum + p.margin, 0);
                const availableMargin = new Decimal(currentEquity).minus(totalLockedMargin).toNumber();

                if (availableMargin < (marginRequired + fee)) {
                    get().showToast('Margin Call', `Required ${(marginRequired + fee).toFixed(2)} USDT`, 'error');
                    return;
                }

                const newWallets = JSON.parse(JSON.stringify(wallets));
                newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).minus(fee).toNumber();

                const mmr = 0.005;
                const liqPrice = order.side === 'Buy'
                    ? new Decimal(currentPrice).times(new Decimal(1).minus(new Decimal(1).div(order.leverage)).plus(mmr)).toNumber()
                    : new Decimal(currentPrice).times(new Decimal(1).plus(new Decimal(1).div(order.leverage)).minus(mmr)).toNumber();

                const newPosition: FuturesPosition = {
                    id: `pos-${Date.now()}`,
                    symbol: order.symbol,
                    pair: order.symbol,
                    side: order.side,
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
                    const newSize = new Decimal(existing.size).plus(order.amount).toNumber();
                    const oldNotional = new Decimal(existing.entryPrice).times(existing.size);
                    const newNotional = new Decimal(currentPrice).times(order.amount);
                    const newEntry = oldNotional.plus(newNotional).div(newSize).toNumber();
                    
                    nextPositions[existingPosIdx] = {
                        ...existing,
                        size: newSize,
                        entryPrice: newEntry,
                        margin: new Decimal(existing.margin).plus(marginRequired).toNumber(),
                        liqPrice
                    };
                } else {
                    nextPositions = [newPosition, ...positions];
                }

                set({ positions: nextPositions, wallets: newWallets });
                get().showToast('Position Opened', `${order.leverage}x ${order.side === 'Buy' ? 'Long' : 'Short'} ${order.symbol} opened at ${currentPrice.toFixed(2)} USDT`, 'success');
                get().updateAssetPrices(true);

                get().addTrade({
                    id: `TR-F-${Date.now()}`,
                    symbol: order.symbol,
                    side: order.side,
                    type: order.type,
                    price: currentPrice,
                    amount: order.amount,
                    fee: fee,
                    pnl: 0,
                    timestamp: Date.now()
                });

                if (user) {
                    const dbSide = order.side === 'Buy' ? 'long' : 'short';
                    const existingPosIdx = positions.findIndex(p => p.symbol === order.symbol && p.side === order.side);

                    if (existingPosIdx > -1) {
                        const existing = positions[existingPosIdx];
                        const newSize = new Decimal(existing.size).plus(order.amount).toNumber();
                        const oldNotional = new Decimal(existing.entryPrice).times(existing.size);
                        const newNotional = new Decimal(currentPrice).times(order.amount);
                        const newEntry = oldNotional.plus(newNotional).div(newSize).toNumber();
                        const newMargin = new Decimal(existing.margin).plus(marginRequired).toNumber();

                        await supabase.from('positions_futures').update({
                            entry_price: newEntry,
                            size: newSize,
                            margin: newMargin,
                            liquidation_price: liqPrice
                        })
                        .eq('user_id', user.id)
                        .eq('pair', order.symbol)
                        .eq('side', dbSide);
                    } else {
                        await supabase.from('positions_futures').insert([{
                            user_id: user.id,
                            pair: order.symbol,
                            leverage: order.leverage,
                            margin_type: order.marginMode.toLowerCase(),
                            side: dbSide,
                            entry_price: currentPrice,
                            size: order.amount,
                            liquidation_price: liqPrice,
                            margin: marginRequired
                        }]);
                    }
                    get().syncWalletsToSupabase();
                }
            },

            closeFuturesPosition: async (id) => {
                const { positions, wallets, positionHistory, user } = get();
                const pos = positions.find(p => p.id === id);
                if (!pos) return;

                const notionalValue = new Decimal(pos.size).times(pos.markPrice || pos.entryPrice);
                const fee = notionalValue.times(0.0005).toNumber();
                
                const newWallets = JSON.parse(JSON.stringify(wallets));
                const realizedUsdt = new Decimal(pos.pnl).minus(fee).toNumber();
                newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).plus(realizedUsdt).toNumber();

                const newHistoryRecord: PositionHistoryRecord = {
                    id: pos.id,
                    pair: pos.pair,
                    side: pos.side,
                    size: pos.size,
                    margin: pos.margin,
                    entryPrice: pos.entryPrice,
                    markPrice: pos.markPrice || pos.entryPrice,
                    leverage: pos.leverage,
                    pnl: realizedUsdt,
                    pnlPercent: pos.pnlPercent || 0,
                    timeOpened: Date.now() - 3600000,
                    timeClosed: Date.now(),
                    marginMode: pos.marginMode || 'Cross'
                };

                set({
                    wallets: newWallets,
                    positions: positions.filter(p => p.id !== id),
                    positionHistory: [newHistoryRecord, ...(positionHistory || [])]
                });

                get().updateAssetPrices(true);
                get().showToast('Position Closed', `${pos.side === 'Buy' ? 'Long' : 'Short'} ${pos.pair} closed. Realized PnL: ${realizedUsdt >= 0 ? '+' : ''}${realizedUsdt.toFixed(2)} USDT`, 'success');

                if (user) {
                    await supabase.from('history_futures').insert([{
                        user_id: user.id,
                        pair: pos.pair,
                        leverage: pos.leverage,
                        margin_type: pos.marginMode?.toLowerCase(),
                        side: pos.side === 'Buy' ? 'long' : 'short',
                        entry_price: pos.entryPrice,
                        close_price: pos.markPrice || pos.entryPrice,
                        size: pos.size,
                        margin: pos.margin,
                        pnl: realizedUsdt,
                        time_opened: new Date(newHistoryRecord.timeOpened).toISOString(),
                        time_closed: new Date(newHistoryRecord.timeClosed).toISOString()
                    }]);

                    await supabase.from('positions_futures').delete()
                        .eq('user_id', user.id)
                        .eq('pair', pos.pair)
                        .eq('side', pos.side === 'Buy' ? 'long' : 'short');
                    get().syncWalletsToSupabase();
                }
            },

            resetWallets: async () => {
                const { user } = get();
                if (!user) {
                    console.error('[Diagnostic] Reset failed: No user found in state');
                    return;
                }

                console.log(`[Diagnostic] Triggering full reset for user: ${user.id}`);

                // 2. Call DB Reset
                const { error } = await supabase.rpc('full_reset_user_data', { p_user_id: user.id });
                
                if (error) {
                    console.error('[Diagnostic] Reset RPC error:', error);
                    get().showToast('Reset Failed', 'Could not clear data in Supabase.', 'error');
                    return;
                }

                console.log('[Diagnostic] Reset RPC Success. Clearing local state and re-fetching...');

                // Update local state to match the reset (clear everything first)
                set({
                    wallets: { spot: {}, futures: {}, earn: {} },
                    spotCostBasis: {},
                    transactionHistory: [],
                    tradeHistory: [],
                    positions: [],
                    openOrders: [],
                    positionHistory: [],
                    snapshots: {},
                    balance: 0,
                    spotBalance: 0,
                    futuresBalance: 0,
                    earnBalance: 0,
                    todayPnl: 0,
                    todaySpotPnl: 0,
                    pnlPercent: 0,
                    assets: [],
                    history: [],
                    favoriteGroups: {},
                    hiddenGroups: [],
                    favorites: get().favorites, 
                });

                // Immediately fetch the fresh data from Supabase (including the auto-seeded deposit)
                await Promise.all([
                    get().fetchSupabaseWallets(),
                    get().fetchSupabaseHistory()
                ]);

                get().updateAssetPrices(true);
                get().showToast('Account Reset', 'All data cleared and balance reset to default.', 'success');
            },

            // Auto-Calculation: recalculate asset values from latest market prices and wallets
            // Auto-PnL: compute daily PnL from weighted asset × priceChangePercent
            updateAssetPrices: (force = false) => {
                // Throttle: skip if called too frequently (e.g. from earn yield every 1s)
                const now = Date.now();
                if (!force && now - lastPortfolioCalc < PORTFOLIO_THROTTLE_MS) return;
                lastPortfolioCalc = now;

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
                    let dFuturesUnrealizedPnl = new Decimal(0);
                    let totalMaintenanceMargin = new Decimal(0);
                    let updatedPositions: any[] = [];

                    positions.forEach(pos => {
                        const market = futuresMarkets.find(m => m.symbol === pos.symbol);
                        const markPrice = market ? parseFloat(market.lastPrice) : pos.markPrice;
                        
                        const priceDiff = pos.side === 'Buy' 
                            ? new Decimal(markPrice).minus(pos.entryPrice) 
                            : new Decimal(pos.entryPrice).minus(markPrice);
                        
                        const pnl = priceDiff.times(pos.size);
                        const pnlPercent = pnl.div(pos.margin).times(100);
                        
                        const maintenanceMargin = new Decimal(pos.size).times(markPrice).times(0.005); 

                        dFuturesUnrealizedPnl = dFuturesUnrealizedPnl.plus(pnl);
                        totalMaintenanceMargin = totalMaintenanceMargin.plus(maintenanceMargin);

                        updatedPositions.push({
                            ...pos,
                            markPrice,
                            pnl: parseFloat(pnl.toFixed(2)),
                            pnlPercent: parseFloat(pnlPercent.toFixed(2))
                        });
                    });

                    const futuresWalletBalance = new Decimal(updatedWallets.futures.USDT || 0);
                    const futuresEquity = futuresWalletBalance.plus(dFuturesUnrealizedPnl);

                    if (updatedPositions.length > 0 && futuresEquity.lte(totalMaintenanceMargin)) {
                        fillOccurred = true;
                        
                        updatedPositions.forEach(pos => {
                            updatedTradeHistory.push({
                                id: `LIQ-${Date.now()}-${pos.id}`,
                                symbol: pos.symbol,
                                side: pos.side,
                                type: 'Liquidation',
                                price: pos.markPrice,
                                amount: pos.size,
                                fee: 0,
                                pnl: pos.pnl,
                                timestamp: Date.now(),
                                status: 'Completed'
                            });
                        });
                        
                        updatedWallets.futures.USDT = 0; 
                        updatedPositions = [];
                        get().showToast('Liquidation Alert', 'Futures account liquidated due to insufficient margin.', 'error');
                    }

                    // 3. --- Calculate Balances & Asset Values ---
                    let dSpotTotal = new Decimal(0);
                    let dFuturesTotal = new Decimal(0);
                    let dEarnTotal = new Decimal(0);
                    let dSpotUnrealizedPnl = new Decimal(0);

                    const finalWallets = fillOccurred ? updatedWallets : wallets;

                    const updatedAssets = Object.entries(finalWallets.spot).map(([symbol, amount]) => {
                        let valueUsdt = new Decimal(amount as number);
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            const currentPrice = market ? market.lastPrice : 0;
                            
                            if (market) {
                                valueUsdt = new Decimal(amount as number).times(currentPrice);
                                
                                const costPrice = spotCostBasis[symbol];
                                if (costPrice && costPrice > 0) {
                                    const pnl = new Decimal(currentPrice).minus(costPrice).times(amount as number);
                                    dSpotUnrealizedPnl = dSpotUnrealizedPnl.plus(pnl);
                                }
                            }
                        }
                        dSpotTotal = dSpotTotal.plus(valueUsdt);
                        return { symbol, amount: amount as number, valueUsdt: valueUsdt.toNumber() };
                    }).filter(a => a.amount > 0 || a.symbol === 'USDT');

                    dFuturesTotal = new Decimal(finalWallets.futures.USDT || 0);
                    const totalFuturesUnrealizedPnl = updatedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
                    dFuturesUnrealizedPnl = new Decimal(totalFuturesUnrealizedPnl);

                    Object.entries(finalWallets.earn).forEach(([symbol, amount]) => {
                        let valueUsdt = new Decimal(amount as number);
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            if (market) valueUsdt = new Decimal(amount as number).times(market.lastPrice);
                        }
                        dEarnTotal = dEarnTotal.plus(valueUsdt);
                    });

                    const dTotalValue = dSpotTotal.plus(dFuturesTotal).plus(dEarnTotal).plus(dFuturesUnrealizedPnl);
                    const totalValue = dTotalValue.toNumber();
                    
                    const dTotalUnrealizedPnl = dSpotUnrealizedPnl.plus(dFuturesUnrealizedPnl);
                    const pnlPercentValue = dTotalValue.gt(0)
                        ? dTotalUnrealizedPnl.div(dTotalValue).times(100).toNumber()
                        : 0;

                    // 4. --- Update BTC Rate ---
                    const btcMarket = markets.find(m => m.symbol === 'BTCUSDT');
                    const btcPrice = btcMarket ? parseFloat(btcMarket.lastPrice) : 0;
                    const newRates = { ...state.rates };
                    if (btcPrice > 0) newRates.BTC = 1 / btcPrice;

                    // 5. --- Snapshot logic ---
                    const today = new Date().toISOString().split('T')[0];
                    const nextSnapshots = { ...state.snapshots };
                    if (state.snapshots[today] === undefined) nextSnapshots[today] = totalValue;

                    return {
                        wallets: finalWallets,
                        openOrders: remainingOrders,
                        spotCostBasis: fillOccurred ? updatedCostBasis : spotCostBasis,
                        tradeHistory: fillOccurred ? updatedTradeHistory : tradeHistory,
                        positions: updatedPositions,
                        assets: updatedAssets,
                        balance: new Decimal(totalValue).toDecimalPlaces(8).toNumber(),
                        spotBalance: new Decimal(dSpotTotal.toNumber()).toDecimalPlaces(8).toNumber(),
                        futuresBalance: new Decimal(dFuturesTotal.toNumber()).toDecimalPlaces(8).toNumber(),
                        earnBalance: new Decimal(dEarnTotal.toNumber()).toDecimalPlaces(8).toNumber(),
                        todayPnl: new Decimal(dTotalUnrealizedPnl.toNumber()).toDecimalPlaces(8).toNumber(),
                        todaySpotPnl: new Decimal(dSpotUnrealizedPnl.toNumber()).toDecimalPlaces(8).toNumber(),
                        pnlPercent: new Decimal(pnlPercentValue).toDecimalPlaces(2).toNumber(),
                        futuresUnrealizedPnl: dFuturesUnrealizedPnl.toDecimalPlaces(8).toNumber(),
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
                        const a = new Decimal(acc);
                        const type = tx.type.toLowerCase();
                        
                        if (type === 'deposit') return a.plus(tx.amount).toNumber();
                        if (type === 'withdrawal') return a.minus(tx.amount).toNumber();
                        
                        if (type === 'transfer') {
                            const to = (tx.to || '').toLowerCase();
                            const from = (tx.from || '').toLowerCase();
                            
                            if (!from && to) return a.plus(tx.amount).toNumber(); 
                            if (from && !to) return a.minus(tx.amount).toNumber();
                        }
                        return acc;
                    }, 0);

                // 5. Total PnL = Current Total Equity - (Baseline + Net Flow) — using Decimal for precision
                const dBalance = new Decimal(balance);
                const dHistorical = new Decimal(historicalEquity);
                const dPeriodFlow = new Decimal(periodFlow);
                const dCurrentPnL = dBalance.minus(dHistorical).minus(dPeriodFlow);

                // 6. Calculate Base Capital for ROI (Baseline + all Deposits in period)
                const depositsInPeriod = transactionHistory
                    .filter(tx => tx.timestamp > baselineTimestamp && tx.status === 'Completed' && tx.type === 'Deposit')
                    .reduce((acc, tx) => new Decimal(acc).plus(tx.amount).toNumber(), 0);

                const dBaseCapital = dHistorical.plus(depositsInPeriod);
                const dPnlPct = dBaseCapital.gt(0)
                    ? dCurrentPnL.div(dBaseCapital).times(100)
                    : new Decimal(0);

                return {
                    value: dCurrentPnL.toDecimalPlaces(8).toNumber(),
                    percent: dPnlPct.toDecimalPlaces(2).toNumber(),
                    hasData: baselineFound
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
                get().updateAssetPrices(true);
                get().syncWalletsToSupabase();
            },
        }),
        {
            name: 'triv-ultra-storage',
            partialize: (state) => {
                const { 
                    toastMessage, 
                    wallets, transactionHistory, tradeHistory, 
                    positions, openOrders, positionHistory, 
                    snapshots, balance, spotBalance, futuresBalance, 
                    earnBalance, assets, futuresUnrealizedPnl,
                    spotCostBasis,
                    ...rest 
                } = state;
                return rest;
            }
        }
    )
);

export default useExchangeStore;
