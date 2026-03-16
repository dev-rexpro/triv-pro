// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    MarketData, Asset, ExchangeRates, FavoriteGroups, CurrencyCode,
    WalletBalances, TransactionRecord, TradeRecord, PendingOrder, FuturesPosition, UnifiedCoin, PositionHistoryRecord, SpotTPSL
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
    activeIndicators: string[];
    isSpotTradeSheetOpen: boolean;
    isFuturesTPSLSheetOpen: boolean;
    activeSpotAsset: Asset | null;
    activeFuturesPosition: FuturesPosition | null;
    isPreSetupOpen: boolean;
    setupStep: number;
    authStep: number;
    authEmail: string;
    authMode: 'login' | 'signup';
    isSigningUp: boolean; // Shield against auto-login flicker
    isInitializing: boolean;
    preferences: {
        setup_completed?: boolean;
        show_deposit_offer?: boolean;
        [key: string]: any;
    };
    marketConfigs: Record<string, { pricePrecision: number; maxLeverage: number; mmr: number }>;

    isSpotTPSLSheetOpen: boolean;
    setSpotTPSLSheetOpen: (open: boolean, asset?: { symbol: string; amount: number }) => void;
    activeSpotTPSLAsset: { symbol: string; amount: number } | null;

    isSpotCostPriceSheetOpen: boolean;
    activeSpotCostPriceAsset: { symbol: string; costPrice: number; balance: number } | null;
    setSpotCostPriceSheetOpen: (open: boolean, asset?: { symbol: string; costPrice: number; balance: number }) => void;

    isSharePnLSheetOpen: boolean;
    activeShareData: {
        symbol: string;
        side: 'Buy' | 'Sell';
        isFutures: boolean;
        leverage?: number;
        entryPrice: number;
        lastPrice: number;
        pnl: number;
        pnlPercent: number;
    } | null;
    setSharePnLSheetOpen: (open: boolean, data?: {
        symbol: string;
        side: 'Buy' | 'Sell';
        isFutures: boolean;
        leverage?: number;
        entryPrice: number;
        lastPrice: number;
        pnl: number;
        pnlPercent: number;
    }) => void;

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
    spotTPSL: SpotTPSL[];
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
    toggleIndicator: (indicator: string) => void;
    updateAssetPrices: () => void;

    // Demo Actions
    setWallets: (wallets: { spot: WalletBalances; futures: WalletBalances; earn: WalletBalances }) => void;
    addTransaction: (tx: TransactionRecord) => Promise<string>;
    updateTransaction: (id: string, updates: Partial<TransactionRecord>) => Promise<void>;
    addTrade: (trade: TradeRecord) => void;
    addPosition: (pos: FuturesPosition) => void;
    removePosition: (id: string) => void;
    updatePosition: (id: string, updates: Partial<FuturesPosition>) => void;
    resetWallets: () => void;
    setHideBalance: (val: boolean) => void;
    placeSpotOrder: (order: { symbol: string; side: 'Buy' | 'Sell'; type: 'Limit' | 'Market'; price: number; amount: number; marginMode: string; leverage: number }) => void;
    cancelSpotOrder: (orderId: string) => void;
    placeFuturesOrder: (order: { symbol: string; side: 'Buy' | 'Sell'; type: 'Limit' | 'Market'; price: number; amount: number; marginMode: string; leverage: number }, tpPrice?: number | null, slPrice?: number | null) => Promise<boolean | void>;
    closeFuturesPosition: (id: string, closeAmount?: number, closePrice?: number) => void;
    getPnLForTimeframe: (timeframe: string) => { value: number; percent: number; hasData: boolean };
    setShowOrderConfirmation: (val: boolean) => void;
    closeAll: () => void;
    syncWalletsToSupabase: () => Promise<void>;
    setPartialTPSL: (positionId: string, type: 'TP' | 'SL', price: number, amount: number) => void;
    setTrailingStop: (positionId: string, activationPrice: number, callbackRate: number) => void;
    processPartialClosure: (id: string, price: number, amount: number, type: string) => void;
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
    fetchSupabaseOpenOrders: () => Promise<void>;
    setSpotCostPrice: (coin: string, price: number) => Promise<void>;
    setPreSetupOpen: (val: boolean) => void;
    setSetupStep: (step: number) => void;
    setAuthStep: (step: number) => void;
    setAuthEmail: (email: string) => void;
    setAuthMode: (mode: 'login' | 'signup') => void;
    setIsSigningUp: (val: boolean) => void;
    updateProfile: (updates: any) => Promise<void>;
    fetchProfile: () => Promise<void>;
    completeSetup: () => Promise<void>;

    // Global Toast
    toastMessage: { isOpen: boolean; title: string; message: string; type: 'success' | 'info' | 'error' } | null;
    setPositions: (positions: FuturesPosition[]) => void;
    setFuturesTPSL: (positionId: string, tpPrice: number | null, slPrice: number | null) => Promise<void>;
    setSpotTPSL: (symbol: string, tpPrice: number | null, slPrice: number | null, amount: number) => Promise<void>;
    showToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
    hideToast: () => void;
    setSpotTradeSheetOpen: (open: boolean, asset?: Asset) => void;
    setFuturesTPSLSheetOpen: (open: boolean, position?: FuturesPosition) => void;

    // Theme
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleTheme: () => void;
    setSelectedCoin: (coin: string) => void;
    fetchMarketConfigs: () => Promise<void>;
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
            activeIndicators: ['VOL', 'MA'],
            futuresUnrealizedPnl: 0,
            isSpotTradeSheetOpen: false,
            isFuturesTPSLSheetOpen: false,
            activeSpotAsset: null,
            activeFuturesPosition: null,
            isPreSetupOpen: false,
            setupStep: 1,
            authStep: 1,
            authEmail: '',
            authMode: 'signup',
            isSigningUp: false,
            isInitializing: true,
            preferences: {},
            marketConfigs: {},

            isSpotTPSLSheetOpen: false,
            setSpotTPSLSheetOpen: (open, asset) => set({ isSpotTPSLSheetOpen: open, activeSpotTPSLAsset: asset || null }),
            activeSpotTPSLAsset: null,

            isSpotCostPriceSheetOpen: false,
            activeSpotCostPriceAsset: null,
            setSpotCostPriceSheetOpen: (open, asset) => set({ isSpotCostPriceSheetOpen: open, activeSpotCostPriceAsset: asset || null }),

            isSharePnLSheetOpen: false,
            activeShareData: null,
            setSharePnLSheetOpen: (open, data) => set({ isSharePnLSheetOpen: open, activeShareData: data || null }),
            toastMessage: null,
            theme: 'system',

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
            spotTPSL: [],
            nextFundingTime: Math.ceil(Date.now() / (8 * 3600 * 1000)) * (8 * 3600 * 1000),
            fundingRate: 0.0001,

            setMarkets: (data) => set({ markets: data.map(m => ({ ...m, isFutures: false })) }),
            updateMarkets: (updates) => {
                set((state) => {
                    const map = new Map(state.markets.map(m => [m.symbol, m]));
                    updates.forEach(u => {
                        const existing = map.get(u.symbol);
                        map.set(u.symbol, existing ? { ...existing, ...u, isFutures: false } : { ...u, isFutures: false } as MarketData);
                    });
                    return { markets: Array.from(map.values()) };
                });
                get().updateAssetPrices();
            },
            setFuturesMarkets: (data) => set({ futuresMarkets: data.map(m => ({ ...m, isFutures: true })) }),
            updateFuturesMarkets: (updates) => {
                set((state) => {
                    const map = new Map(state.futuresMarkets.map(m => [m.symbol, m]));
                    updates.forEach(u => {
                        const existing = map.get(u.symbol);
                        map.set(u.symbol, existing ? { ...existing, ...u, isFutures: true } : { ...u, isFutures: true } as MarketData);
                    });
                    return { futuresMarkets: Array.from(map.values()) };
                });
                get().updateAssetPrices();
            },
            setSpotSymbols: (data) => set({ spotSymbols: data }),
            setFuturesSymbols: (data) => set({ futuresSymbols: data }),
            setCurrency: (currency) => {
                set({ currency });
                get().updateProfile({ currency });
            },
            setRates: (rates) => set({ rates }),
            setHideBalance: (val) => set({ hideBalance: val }),
            setActivePage: (page) => set({ activePage: page }),
            setSearchOpen: (val) => set({ isSearchOpen: val }),
            setManageGroupsOpen: (val) => set({ isManageGroupsOpen: val }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setHomeFilter: (filter) => set({ homeFilter: filter }),
            setTradeType: (type) => set({ tradeType: type }),
            setSelectedCoin: (coin) => set({ selectedCoin: coin }),
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

            toggleIndicator: (indicator: string) => {
                set((state) => ({
                    activeIndicators: state.activeIndicators.includes(indicator)
                        ? state.activeIndicators.filter(i => i !== indicator)
                        : [...state.activeIndicators, indicator]
                }));
            },


            syncWalletsToSupabase: async () => {
                try {
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
                        const { error: walletError } = await supabase.from('wallets').upsert(updates, { onConflict: 'user_id, type, coin_symbol' });
                        if (walletError) throw walletError;
                    }

                    // Also sync spotCostBasis into preferences
                    const { spotCostBasis } = get();
                    const { data: profile, error: profileFetchError } = await supabase
                        .from('profiles')
                        .select('preferences')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profileFetchError) throw profileFetchError;

                    const updatedPreferences = {
                        ...(profile?.preferences || {}),
                        spotCostBasis
                    };

                    const { error: profileUpsertError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            preferences: updatedPreferences,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'id' });

                    if (profileUpsertError) throw profileUpsertError;
                } catch (error) {
                    console.error('Sync Error:', error);
                    get().showToast('Sync Warning', 'Failed to sync with server. Your data is saved locally and will retry.', 'error');
                }
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
                    const { favorites, favoriteGroups, hiddenGroups, spotCostBasis, spotTPSL } = data.preferences;
                    if (favorites) set({ favorites });
                    if (favoriteGroups) set({ favoriteGroups });
                    if (hiddenGroups) set({ hiddenGroups });
                    if (spotCostBasis) set({ spotCostBasis });
                    if (spotTPSL) set({ spotTPSL });
                } else if (!data) {
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

                setInterval(() => {
                    const { user, wallets } = get();
                    if (user && Object.keys(wallets.earn).length > 0) {
                        get().syncWalletsToSupabase();
                    }
                }, 60000);
            },

            fetchSupabasePositions: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('positions_futures')
                    .select('*')
                    .eq('user_id', user.id);

                if (!error && data) {
                    const dbPositions = data.map((p: any) => ({
                        id: p.id,
                        symbol: p.pair,
                        pair: p.pair,
                        side: p.side === 'long' ? 'Buy' : 'Sell',
                        size: parseFloat(p.size),
                        entryPrice: parseFloat(p.entry_price),
                        markPrice: parseFloat(p.entry_price),
                        margin: parseFloat(p.margin),
                        leverage: p.leverage,
                        liqPrice: parseFloat(p.liquidation_price),
                        marginMode: p.margin_type.charAt(0).toUpperCase() + p.margin_type.slice(1),
                        tpPrice: p.tp_price ? parseFloat(p.tp_price) : null,
                        slPrice: p.sl_price ? parseFloat(p.sl_price) : null,
                        tpOrders: p.tp_orders || [],
                        slOrders: p.sl_orders || [],
                        pnl: 0,
                        pnlPercent: 0,
                        lastSync: Date.now()
                    }));

                    const now = Date.now();
                    const localPositions = get().positions;
                    const freshLocalPositions = localPositions.filter(lp => {
                        const localSyncTime = lp.lastSync || now; 
                        const isFresh = (now - localSyncTime) < 15000;
                        const existsInDb = dbPositions.some(dbp => dbp.id === lp.id);
                        return isFresh && !existsInDb;
                    });

                    set({ positions: [...dbPositions, ...freshLocalPositions] });
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

            setPreSetupOpen: (val) => set({ isPreSetupOpen: val }),
            setSetupStep: (step) => set({ setupStep: step }),
            setAuthStep: (step) => set({ authStep: step }),
            setAuthEmail: (email) => set({ authEmail: email }),
            setAuthMode: (mode) => set({ authMode: mode }),
            setIsSigningUp: (val) => set({ isSigningUp: val }),

            updateProfile: async (updates) => {
                const { user, preferences } = get();
                if (!user) return;
                const newPrefs = { ...preferences, ...updates };
                const { error } = await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
                if (!error) set({ preferences: newPrefs });
            },

            fetchProfile: async () => {
                const { user } = get();
                if (!user) return;
                const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (!error && data) {
                    const prefs = data.preferences || {};
                    set({ preferences: prefs });
                    if (prefs.currency) set({ currency: prefs.currency });
                    if (prefs.theme) set({ theme: prefs.theme });
                    
                    // Restore Spot Settings
                    if (prefs.spotTPSL) {
                        console.log('[Diagnostic] Restoring Spot TPSL from Supabase:', prefs.spotTPSL);
                        set({ spotTPSL: prefs.spotTPSL });
                    }
                    if (prefs.spotCostBasis) {
                        console.log('[Diagnostic] Restoring Spot Cost Basis from Supabase:', prefs.spotCostBasis);
                        set({ spotCostBasis: prefs.spotCostBasis });
                    }
                }
            },

            completeSetup: async () => {
                const { updateProfile } = get();
                await updateProfile({ setup_completed: true });
                set({ isPreSetupOpen: false });
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
                        user: nextUser,
                        isInitializing: !!nextUser // Set true if user exists
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
                get().syncWalletsToSupabase();
            },
            setDepositOptionOpen: (val) => set({ isDepositOptionOpen: val }),
            showToast: (title, message, type = 'success') => set({ toastMessage: { isOpen: true, title, message, type } }),
            hideToast: () => set({ toastMessage: null }),
            setSpotTradeSheetOpen: (open, asset) => set({
                isSpotTradeSheetOpen: open,
                activeSpotAsset: asset || null
            }),
            setFuturesTPSLSheetOpen: (open, position) => set({
                isFuturesTPSLSheetOpen: open,
                activeFuturesPosition: position || null
            }),
            setTheme: (newTheme) => {
                set({ theme: newTheme });
                get().updateProfile({ theme: newTheme });

                let effectiveTheme = newTheme;
                if (newTheme === 'system') {
                    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
            },
            toggleTheme: () => {
                const currentTheme = get().theme;
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                get().setTheme(newTheme);
            },
            addTransaction: async (tx) => {
                const txId = tx.id || crypto.randomUUID();
                const newTx = { ...tx, id: txId };
                set(s => ({ transactionHistory: [newTx, ...s.transactionHistory] }));
                const { user } = get();
                if (user) {
                    const allowedTypes = ['deposit', 'withdrawal', 'transfer', 'trade', 'stake'];
                    const typeNorm = tx.type.toLowerCase();
                    const dbType = allowedTypes.includes(typeNorm) ? typeNorm : 'transfer';
                    try {
                        // FIX: Pastikan ID berformat UUID sebelum masuk database Postgres
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(txId);
                        const dbId = isUUID ? txId : crypto.randomUUID();

                        const { error } = await supabase.from('transactions').insert([{
                            id: dbId,
                            user_id: user.id,
                            type: dbType,
                            amount: tx.amount,
                            currency: tx.currency,
                            from_wallet: tx.from || null,
                            to_wallet: tx.to || null,
                            status: tx.status.toLowerCase(),
                            timestamp: new Date(tx.timestamp).toISOString()
                        }]);
                        if (error) console.error('Transaction DB insert error:', error);
                    } catch (e) {
                        console.warn('Transaction DB insert failed:', e);
                    }
                }
                return txId;
            },
            updateTransaction: async (id, updates) => {
                set(s => ({
                    transactionHistory: s.transactionHistory.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
                const { user } = get();
                if (user) {
                    try {
                        const dbUpdates: any = {};
                        if (updates.status) dbUpdates.status = updates.status.toLowerCase();
                        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
                        
                        if (Object.keys(dbUpdates).length > 0) {
                            const { error } = await supabase.from('transactions')
                                .update(dbUpdates)
                                .eq('id', id)
                                .eq('user_id', user.id);
                            if (error) throw error;
                        }
                    } catch (e) {
                        console.warn('Transaction DB update failed:', e);
                    }
                }
            },
            addTrade: async (tr) => {
                const { user } = get();
                const tradeId = tr.id || crypto.randomUUID();
                const trade = { ...tr, id: tradeId };
                
                set(s => ({ tradeHistory: [trade, ...s.tradeHistory] }));
                
                if (user) {
                    try {
                        const isFutures = String(tradeId).includes('TR-F') || String(tradeId).includes('LIQ');
                        const status = (trade as any).status || 'filled';
                        
                        // FIX: Pastikan ID berformat UUID untuk tabel pending_orders
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tradeId);
                        const dbId = isUUID ? tradeId : crypto.randomUUID();
                        
                        const { error } = await supabase.from('pending_orders').insert([{
                            id: dbId,
                            user_id: user.id,
                            pair: trade.symbol,
                            side: trade.side.toLowerCase(),
                            type: trade.type.toLowerCase(),
                            price: trade.price,
                            amount: trade.amount,
                            filled: trade.amount,
                            status: status.toLowerCase(),
                            is_futures: isFutures
                        }]);
                        if (error) console.error('Trade DB insert error:', error);
                    } catch (e) {
                        console.warn('Trade DB insert failed:', e);
                    }
                }
                return tradeId;
            },
            initializeUserData: async () => {
                set({ isInitializing: true }); // Ensure it's true at start
                const { user, fetchProfile, fetchSupabaseWallets, fetchSupabaseHistory, fetchSupabaseFavorites, fetchSupabasePositions, fetchMarketConfigs } = get();
                
                await fetchMarketConfigs(); // Configs available for everyone

                if (!user) {
                    set({ isInitializing: false });
                    return;
                }

                get().startFundingCron();

                // WAJIB: Tarik profile dan wallet duluan
                await Promise.all([
                    fetchProfile(),
                    fetchSupabaseWallets()
                ]);

                // Baru tarik sisanya
                console.log(`[Diagnostic] Initializing data for user: ${user.id}`);
                const [history, favorites, positions, orders] = await Promise.all([
                    fetchSupabaseHistory(),
                    fetchSupabaseFavorites(),
                    fetchSupabasePositions(),
                    get().fetchSupabaseOpenOrders()
                ]);

                const state = get();
                console.log(`[Diagnostic] Initialization Complete:
                    - Wallets: fetched 
                    - Positions: ${state.positions.length}
                    - Open Orders: ${state.openOrders.length}
                `);

                // Set up Realtime Sync
                const channel = supabase.channel(`sync-${user.id}`)
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'pending_orders', filter: `user_id=eq.${user.id}` },
                        () => { 
                            console.log('[Realtime] Syncing Spot Orders...');
                            get().fetchSupabaseOpenOrders(); 
                            get().fetchSupabaseHistory(); 
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'positions_futures', filter: `user_id=eq.${user.id}` },
                        () => { 
                            console.log('[Realtime] Syncing Futures Positions...');
                            get().fetchSupabasePositions(); 
                            get().fetchSupabaseHistory(); 
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
                        () => { 
                            console.log('[Realtime] Syncing Wallets...');
                            get().fetchSupabaseWallets(); 
                        }
                    )
                    .subscribe();

                // Check Pre-Setup
                const { preferences, wallets } = get();
                const isSetupDone = preferences.setup_completed === true;

                // Calculate total balance across all wallets
                const totalBalance = Object.values(wallets.spot).reduce((a, b) => a + (b as number), 0) +
                    Object.values(wallets.futures).reduce((a, b) => a + (b as number), 0) +
                    Object.values(wallets.earn).reduce((a, b) => a + (b as number), 0);

                const skipDeposit = totalBalance > 0;

                if (!isSetupDone) {
                    set({
                        isPreSetupOpen: true,
                        setupStep: 1,
                        preferences: { ...preferences, skip_deposit: skipDeposit },
                        isInitializing: false
                    });
                } else {
                    set({ isInitializing: false });
                }
            },

            startFundingCron: () => {
                setInterval(() => {
                    const now = Date.now();
                    const { nextFundingTime, fundingRate, positions, wallets, addTransaction, syncWalletsToSupabase } = get();

                    if (now >= nextFundingTime) {
                        if (positions.length > 0) {
                            const newWallets = JSON.parse(JSON.stringify(wallets));
                            let totalFee = new Decimal(0);

                            positions.forEach(pos => {
                                const notional = new Decimal(pos.size).times(new Decimal(pos.markPrice || pos.entryPrice));
                                const fee = notional.times(new Decimal(fundingRate));

                                if (pos.side === 'Buy') {
                                    totalFee = totalFee.minus(fee);
                                } else {
                                    totalFee = totalFee.plus(fee);
                                }
                            });

                            newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).plus(totalFee).toNumber();

                            set({ wallets: newWallets, nextFundingTime: nextFundingTime + (8 * 3600 * 1000) });
                            get().updateAssetPrices(true);

                            addTransaction({
                                id: `FUND-${Date.now()}`,
                                type: 'Trade',
                                status: 'Completed',
                                amount: Math.abs(totalFee.toNumber()),
                                currency: 'USDT',
                                timestamp: Date.now(),
                                to: 'Futures'
                            });

                            syncWalletsToSupabase();
                        } else {
                            set({ nextFundingTime: nextFundingTime + (8 * 3600 * 1000) });
                        }
                    }
                }, 30000);

                // Polling Fallback (Every 20s for high-consistency across PWA/Browser)
                setInterval(() => {
                    const { user } = get();
                    if (user) {
                        get().updateAssetPrices();
                    }
                }, 20000); // Polling reduced to 20s (Realtime is primary)
            },

            fetchSupabaseHistory: async () => {
                try {
                    const { user } = get();
                    if (!user) return;

                    const [txData, tradeData, futuresData] = await Promise.all([
                        supabase.from('transactions').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
                        supabase.from('pending_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                        supabase.from('history_futures').select('*').eq('user_id', user.id).order('time_closed', { ascending: false })
                    ]);

                    if (txData.error) throw txData.error;
                    if (tradeData.error) throw tradeData.error;
                    if (futuresData.error) throw futuresData.error;

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

                    let allTrades: any[] = [];

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
                            timestamp: new Date(t.created_at).getTime(),
                            status: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Filled'
                        }));
                    allTrades = [...mappedTrades];

                    if (futuresData.data) {
                        const mappedPosHistory = futuresData.data.map(h => ({
                            id: h.id,
                            pair: h.pair,
                            side: h.side === 'long' ? 'Buy' : 'Sell',
                            size: parseFloat(h.size),
                            margin: parseFloat(h.margin),
                            entryPrice: parseFloat(h.entry_price),
                            markPrice: parseFloat(h.close_price),
                            leverage: h.leverage,
                            pnl: parseFloat(h.pnl),
                            pnlPercent: 0,
                            timeOpened: new Date(h.time_opened).getTime(),
                            timeClosed: new Date(h.time_closed).getTime(),
                            marginMode: h.margin_type === 'cross' ? 'Cross' : 'Isolated'
                        }));

                        const futuresTrades = futuresData.data.map(h => ({
                            id: `FUT-TR-${h.id}`,
                            symbol: h.pair,
                            side: h.side === 'long' ? 'Sell' : 'Buy',
                            type: h.type || 'Market',
                            price: parseFloat(h.close_price),
                            amount: parseFloat(h.size),
                            fee: 0,
                            pnl: parseFloat(h.pnl),
                            timestamp: new Date(h.time_closed).getTime(),
                            status: h.type === 'Liquidation' ? 'Liquidated' : 'Completed'
                        }));

                        allTrades = [...allTrades, ...futuresTrades];
                        set({ positionHistory: mappedPosHistory });
                    }

                    allTrades.sort((a, b) => b.timestamp - a.timestamp);
                    set({ tradeHistory: allTrades });
                } catch (error) {
                    console.error('Fetch History Error:', error);
                    get().showToast('Network Error', 'Could not load trading history.', 'error');
                }
            },
            addPosition: (pos) => set(s => ({ positions: [...s.positions, pos] })),
            setPositions: (positions) => set({ positions }),
            setFuturesTPSL: async (positionId, tpPrice, slPrice) => {
                const { positions, user, tradeHistory } = get();
                const pos = positions.find(p => p.id === positionId);
                if (!pos) return;

                // If both are null, it's a cancellation
                if (tpPrice === null && slPrice === null && (pos.tpPrice !== null || pos.slPrice !== null)) {
                    const canceledTrade = {
                        id: `CANC-F-${Date.now()}-${pos.id}`,
                        symbol: pos.symbol,
                        side: pos.side === 'Buy' ? 'Sell' : 'Buy', // Closing side
                        type: 'TP/SL',
                        price: pos.tpPrice || pos.slPrice || 0,
                        amount: pos.size,
                        fee: 0,
                        pnl: 0,
                        timestamp: Date.now(),
                        status: 'Canceled'
                    };
                    set({ tradeHistory: [canceledTrade, ...tradeHistory] });
                }

                const updatedPositions = positions.map(p =>
                    p.id === positionId ? { ...p, tpPrice, slPrice } : p
                );

                set({ positions: updatedPositions });

                if (user) {
                    await supabase.from('positions_futures').update({
                        tp_price: tpPrice,
                        sl_price: slPrice
                    }).eq('id', pos.id).eq('user_id', user.id);
                }
            },

            fetchSupabaseOpenOrders: async () => {
                const { user } = get();
                if (!user) return;

                const { data, error } = await supabase
                    .from('pending_orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'open');

                if (!error && data) {
                    console.log(`[Diagnostic] Fetched ${data.length} raw Open Orders from Supabase`);
                    const dbOrders = data.map((o: any) => ({
                        id: o.id,
                        symbol: o.pair,
                        side: o.side.charAt(0).toUpperCase() + o.side.slice(1),
                        type: o.type.charAt(0).toUpperCase() + o.type.slice(1),
                        price: parseFloat(o.price),
                        amount: parseFloat(o.amount),
                        filled: parseFloat(o.filled),
                        timestamp: new Date(o.created_at).getTime(),
                        isFutures: o.is_futures || false,
                        leverage: o.leverage,
                        marginMode: o.margin_mode,
                        tpPrice: o.tp_price ? parseFloat(o.tp_price) : null,
                        slPrice: o.sl_price ? parseFloat(o.sl_price) : null
                    }));

                    // SMART MERGE: Don't wipe local orders if they are very fresh (< 15s)
                    // This prevents orders from "vanishing and reappearing" while DB replicates
                    const now = Date.now();
                    const localOrders = get().openOrders;
                    const freshLocalOrders = localOrders.filter(lo => {
                        const isFresh = (now - (lo.timestamp || 0)) < 15000;
                        const existsInDb = dbOrders.some(dbo => dbo.id === lo.id);
                        return isFresh && !existsInDb;
                    });

                    const finalOrders = [...dbOrders, ...freshLocalOrders];
                    set({ openOrders: finalOrders });
                }
            },
            setSpotTPSL: async (symbol, tpPrice, slPrice, amount) => {
                const { spotTPSL, user } = get();
                const existing = spotTPSL.find(s => s.symbol === symbol);
                let newSpotTPSL;

                if (tpPrice === null && slPrice === null) {
                    if (existing) {
                        const canceledTrade = {
                            id: `CANC-S-TPSL-${Date.now()}-${symbol}`,
                            symbol: `${symbol}USDT`,
                            side: 'Sell',
                            type: 'TP/SL',
                            price: existing.tpPrice || existing.slPrice || 0,
                            amount: existing.amount,
                            fee: 0,
                            pnl: 0,
                            timestamp: Date.now(),
                            status: 'Canceled'
                        };
                        set({ tradeHistory: [canceledTrade, ...get().tradeHistory] });

                        if (user) {
                            supabase.from('pending_orders').insert([{
                                id: crypto.randomUUID(),
                                user_id: user.id,
                                pair: `${symbol}USDT`,
                                side: 'sell',
                                type: 'limit',
                                price: existing.tpPrice || existing.slPrice || 0,
                                amount: existing.amount,
                                status: 'canceled'
                            }]);
                        }
                    }
                    newSpotTPSL = spotTPSL.filter(s => s.symbol !== symbol);
                } else if (existing) {
                    newSpotTPSL = spotTPSL.map(s => s.symbol === symbol ? { ...s, tpPrice, slPrice, amount } : s);
                } else {
                    newSpotTPSL = [...spotTPSL, { symbol, tpPrice, slPrice, amount }];
                }

                set({ spotTPSL: newSpotTPSL });

                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();
                    const updatedPreferences = {
                        ...(profile?.preferences || {}),
                        spotTPSL: newSpotTPSL
                    };
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        preferences: updatedPreferences,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
                }
            },
            removePosition: (id) => set(s => ({ positions: s.positions.filter(p => p.id !== id) })),
            updatePosition: (id, updates) => set(s => ({
                positions: s.positions.map(p => p.id === id ? { ...p, ...updates } : p)
            })),
            placeSpotOrder: async (order, tpPrice = null, slPrice = null) => {
                const { wallets, openOrders, markets, spotCostBasis, user } = get();
                const symbol = order.symbol.replace('USDT', '');
                const newWallets = JSON.parse(JSON.stringify(wallets));
                const feeRate = new Decimal(0.001);

                if (order.type === 'Limit') {
                    const cost = new Decimal(order.price).times(new Decimal(order.amount));
                    if (order.side === 'Buy') {
                        const USDT_EPSILON = 0.00000001; // Tiny tolerance
                        if (new Decimal(newWallets.spot.USDT || 0).plus(USDT_EPSILON).lt(cost)) {
                            get().showToast('Insufficient Balance', `Required ${cost.toDecimalPlaces(8).toNumber()} USDT`, 'error');
                            return;
                        }
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).minus(cost).toNumber();
                    } else {
                        const COIN_EPSILON = 0.00000001; // Tiny tolerance
                        if (new Decimal(newWallets.spot[symbol] || 0).plus(COIN_EPSILON).lt(new Decimal(order.amount))) {
                            get().showToast('Insufficient Balance', `Required ${order.amount} ${symbol}`, 'error');
                            return;
                        }
                        newWallets.spot[symbol] = new Decimal(newWallets.spot[symbol] || 0).minus(new Decimal(order.amount)).toNumber();
                    }

                    const orderId = crypto.randomUUID();
                    const newOrder: PendingOrder = {
                        id: orderId,
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
                        amount: order.side === 'Buy' ? cost.toNumber() : order.amount,
                        currency: order.side === 'Buy' ? 'USDT' : symbol,
                        timestamp: Date.now(),
                        to: 'Spot'
                    });

                    if (user) {
                        const { error } = await supabase.from('pending_orders').insert([{
                            id: orderId,
                            user_id: user.id,
                            pair: order.symbol,
                            side: order.side.toLowerCase(),
                            type: 'limit',
                            price: order.price,
                            amount: order.amount,
                            status: 'open',
                            tp_price: tpPrice,
                            sl_price: slPrice
                        }]);
                        if (error) {
                            console.error('DB Insert Error:', error);
                            get().showToast('System Error', 'Gagal memproses ke server.', 'error');
                        } else {
                            get().syncWalletsToSupabase();
                        }
                    }
                } else {
                    const market = markets.find(m => m.symbol === order.symbol);
                    const fillPrice = market ? new Decimal(market.lastPrice) : new Decimal(order.price);

                    const slippage = new Decimal(0.0005);
                    const executedPrice = order.side === 'Buy'
                        ? fillPrice.times(new Decimal(1).plus(slippage))
                        : fillPrice.times(new Decimal(1).minus(slippage));

                    const dAmount = new Decimal(order.amount);
                    const cost = executedPrice.times(dAmount);
                    const fee = cost.times(feeRate);
                    const newCostBasis = { ...spotCostBasis };

                    if (order.side === 'Buy') {
                        const totalCost = cost.plus(fee);
                        const USDT_EPSILON = 0.00000001; 
                        if (new Decimal(newWallets.spot.USDT || 0).plus(USDT_EPSILON).lt(totalCost)) {
                            get().showToast('Insufficient Balance', `Required ${totalCost.toDecimalPlaces(8).toNumber()} USDT`, 'error');
                            return;
                        }

                        const oldAmount = new Decimal(newWallets.spot[symbol] || 0);
                        const oldCost = new Decimal(newCostBasis[symbol] || executedPrice);
                        const newAmount = oldAmount.plus(dAmount);

                        newCostBasis[symbol] = oldAmount.times(oldCost).plus(cost).div(newAmount).toDecimalPlaces(8).toNumber();
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).minus(totalCost).toNumber();
                        newWallets.spot[symbol] = newAmount.toNumber();
                    } else {
                        const COIN_EPSILON = 0.00000001;
                        if (new Decimal(newWallets.spot[symbol] || 0).plus(COIN_EPSILON).lt(dAmount)) {
                            get().showToast('Insufficient Balance', `Required ${order.amount} ${symbol}`, 'error');
                            return;
                        }
                        const receiveAmount = cost.minus(fee);
                        newWallets.spot[symbol] = new Decimal(newWallets.spot[symbol] || 0).minus(dAmount).toNumber();
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).plus(receiveAmount).toNumber();
                    }

                    set({ wallets: newWallets, spotCostBasis: newCostBasis });
                    get().showToast('Market Order Filled', `${order.side === 'Buy' ? 'Bought' : 'Sold'} ${order.amount} ${symbol} at avg. ${executedPrice.toDecimalPlaces(8).toNumber()} USDT`, 'success');

                    const orderId = crypto.randomUUID();
                    await get().addTrade({
                        id: orderId,
                        symbol: order.symbol,
                        side: order.side,
                        type: 'Market',
                        price: executedPrice.toNumber(),
                        amount: order.amount,
                        fee: fee.toNumber(),
                        pnl: 0,
                        timestamp: Date.now()
                    });

                    if (user) {
                        get().syncWalletsToSupabase();
                    }

                    if (tpPrice || slPrice) {
                        await get().setSpotTPSL(symbol, tpPrice, slPrice, order.amount);
                    }
                }
                get().updateAssetPrices(true);
            },

            cancelSpotOrder: async (orderId) => {
                const { openOrders, wallets, tradeHistory, user } = get();
                const order = openOrders.find(o => o.id === orderId);
                if (!order) return;

                const newWallets = JSON.parse(JSON.stringify(wallets));
                const symbol = order.symbol.replace('USDT', '');

                // Only refund balance if it's a Spot order
                if (!order.isFutures) {
                    if (order.side === 'Buy') {
                        const cost = new Decimal(order.price).times(new Decimal(order.amount));
                        newWallets.spot.USDT = new Decimal(newWallets.spot.USDT || 0).plus(cost).toNumber();
                    } else {
                        newWallets.spot[symbol] = new Decimal(newWallets.spot[symbol] || 0).plus(new Decimal(order.amount)).toNumber();
                    }
                }

                const canceledTrade = {
                    id: `CANC-${order.isFutures ? 'F' : 'S'}-${Date.now()}-${order.id}`,
                    symbol: order.symbol,
                    side: order.side,
                    type: order.type,
                    price: order.price,
                    amount: order.amount,
                    fee: 0,
                    pnl: 0,
                    timestamp: Date.now(),
                    status: 'Canceled'
                };

                set({
                    wallets: newWallets,
                    openOrders: openOrders.filter(o => o.id !== orderId),
                    tradeHistory: [canceledTrade, ...tradeHistory]
                });

                if (user) {
                    await supabase.from('pending_orders')
                        .update({ status: 'canceled' })
                        .eq('id', orderId);
                    get().syncWalletsToSupabase();
                }

                get().showToast('Order Canceled', `${order.isFutures ? 'Futures' : 'Spot'} order successfully canceled.`, 'success');
            },

            cancelAllOrders: async (symbolFilter?: string) => {
                const { openOrders, spotTPSL, positions } = get();

                // 1. Cancel Spot Limit Orders
                const ordersToCancel = openOrders.filter(o => !symbolFilter || o.symbol === symbolFilter);
                for (const order of ordersToCancel) {
                    await get().cancelSpotOrder(order.id);
                }

                // 2. Cancel Spot TPSL
                const spotTpslToCancel = spotTPSL.filter(s => !symbolFilter || s.symbol === symbolFilter.replace('USDT', ''));
                for (const s of spotTpslToCancel) {
                    await get().setSpotTPSL(s.symbol, null, null, 0);
                }

                // 3. Cancel Futures TPSL
                const futuresTpslToCancel = positions.filter(p => (!symbolFilter || p.symbol === symbolFilter) && (p.tpPrice || p.slPrice));
                for (const p of futuresTpslToCancel) {
                    await get().setFuturesTPSL(p.id, null, null);
                }

                get().showToast('All Orders Canceled', 'All pending orders have been canceled.', 'success');
            },

            placeFuturesOrder: async (order, tpPrice = null, slPrice = null) => {
                const { wallets, positions, openOrders, futuresMarkets, user } = get();
                const market = futuresMarkets.find(m => m.symbol === order.symbol);
                const currentPrice = market ? new Decimal(market.lastPrice) : new Decimal(order.price);
                const limitPrice = new Decimal(order.price);

                const isLimit = order.type === 'Limit';
                const shouldPending = isLimit && (
                    (order.side === 'Buy' && limitPrice.lt(currentPrice)) ||
                    (order.side === 'Sell' && limitPrice.gt(currentPrice))
                );

                if (shouldPending) {
                    const orderId = crypto.randomUUID();
                    const newOrder: PendingOrder = {
                        id: orderId,
                        symbol: order.symbol,
                        side: order.side as 'Buy' | 'Sell',
                        timestamp: Date.now(),
                        amount: order.amount,
                        filled: 0,
                        price: order.price,
                        type: 'Limit',
                        leverage: order.leverage,
                        marginMode: order.marginMode,
                        tpPrice,
                        slPrice,
                        isFutures: true
                    };

                    set({ openOrders: [newOrder, ...openOrders] });
                    get().showToast('Limit Order Placed', `Submitted Limit ${order.side} order for ${order.amount} ${order.symbol} at ${order.price} USDT`, 'success');

                    if (user) {
                        const { error } = await supabase.from('pending_orders').insert([{
                            id: orderId,
                            user_id: user.id,
                            pair: order.symbol,
                            side: order.side.toLowerCase(),
                            type: 'limit',
                            price: order.price,
                            amount: order.amount,
                            status: 'open',
                            is_futures: true,
                            leverage: order.leverage,
                            margin_mode: order.marginMode,
                            tp_price: tpPrice,
                            sl_price: slPrice
                        }]);
                        if (error) console.error('Pending Order Insert Error:', error);
                        get().syncWalletsToSupabase();
                    }
                    return true;
                }

                const dAmount = new Decimal(order.amount);
                const notionalValue = dAmount.times(currentPrice);
                const marginRequired = notionalValue.div(new Decimal(order.leverage));
                const feeRate = new Decimal(0.0005);
                const fee = notionalValue.times(feeRate);

                const totalUnrealizedPnl = positions.reduce((sum, p) => new Decimal(sum).plus(new Decimal(p.pnl || 0)), new Decimal(0));
                const currentEquity = new Decimal(wallets.futures.USDT || 0).plus(totalUnrealizedPnl);
                const totalLockedMargin = positions.reduce((sum, p) => new Decimal(sum).plus(new Decimal(p.margin)), new Decimal(0));
                const availableMargin = currentEquity.minus(totalLockedMargin);

                const totalRequired = marginRequired.plus(fee);
                const MARGIN_EPSILON = 0.00000001;
                if (availableMargin.plus(MARGIN_EPSILON).lt(totalRequired)) {
                    get().showToast('Margin Call', `Order Canceled: Required ${totalRequired.toDecimalPlaces(8).toNumber()} USDT`, 'error');
                    return false; 
                }

                const newWallets = JSON.parse(JSON.stringify(wallets));
                newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).minus(fee).toNumber();

                const mmr = new Decimal(0.005);
                const liqPrice = order.side === 'Buy'
                    ? currentPrice.times(new Decimal(1).minus(new Decimal(1).div(new Decimal(order.leverage))).plus(mmr))
                    : currentPrice.times(new Decimal(1).plus(new Decimal(1).div(new Decimal(order.leverage))).minus(mmr));

                const posId = crypto.randomUUID();
                const newPosition: FuturesPosition = {
                    id: posId,
                    symbol: order.symbol,
                    pair: order.symbol,
                    side: order.side,
                    size: order.amount,
                    entryPrice: currentPrice.toNumber(),
                    markPrice: currentPrice.toNumber(),
                    margin: marginRequired.toNumber(),
                    leverage: order.leverage,
                    pnl: 0,
                    pnlPercent: 0,
                    liqPrice: liqPrice.toNumber(),
                    marginMode: order.marginMode,
                    tpPrice,
                    slPrice,
                    lastSync: Date.now()
                };

                const existingPosIdx = positions.findIndex(p => p.symbol === order.symbol && p.side === order.side);
                let nextPositions = [...positions];

                if (existingPosIdx > -1) {
                    const existing = positions[existingPosIdx];
                    const oldSize = new Decimal(existing.size);
                    const newSize = oldSize.plus(dAmount);
                    const oldNotional = new Decimal(existing.entryPrice).times(oldSize);
                    const newNotional = currentPrice.times(dAmount);
                    const newEntry = oldNotional.plus(newNotional).div(newSize);

                    nextPositions[existingPosIdx] = {
                        ...existing,
                        size: newSize.toNumber(),
                        entryPrice: newEntry.toNumber(),
                        margin: new Decimal(existing.margin).plus(marginRequired).toNumber(),
                        liqPrice: liqPrice.toNumber(),
                        tpPrice: tpPrice || existing.tpPrice,
                        slPrice: slPrice || existing.slPrice
                    };
                } else {
                    nextPositions = [newPosition, ...positions];
                }

                set({ positions: nextPositions, wallets: newWallets });
                get().showToast('Position Opened', `${order.leverage}x ${order.side === 'Buy' ? 'Long' : 'Short'} ${order.symbol} opened at ${currentPrice.toDecimalPlaces(8).toNumber()} USDT`, 'success');

                const tradeId = crypto.randomUUID();
                await get().addTrade({
                    id: tradeId,
                    symbol: order.symbol,
                    side: order.side as 'Buy' | 'Sell',
                    type: order.type,
                    price: currentPrice.toNumber(),
                    amount: order.amount,
                    fee: fee.toNumber(),
                    pnl: 0,
                    timestamp: Date.now()
                });

                if (user) {
                    const dbSide = order.side === 'Buy' ? 'long' : 'short';

                    if (existingPosIdx > -1) {
                        const updatedPos = nextPositions[existingPosIdx];
                        const { error } = await supabase.from('positions_futures').update({
                            entry_price: updatedPos.entryPrice,
                            size: updatedPos.size,
                            margin: updatedPos.margin,
                            liquidation_price: updatedPos.liqPrice,
                            tp_price: updatedPos.tpPrice,
                            sl_price: updatedPos.slPrice
                        })
                            .eq('user_id', user.id)
                            .eq('pair', order.symbol)
                            .eq('side', dbSide);
                        if (error) console.error('Update Position Error:', error);
                    } else {
                        const { error } = await supabase.from('positions_futures').insert([{
                            id: posId,
                            user_id: user.id,
                            pair: order.symbol,
                            leverage: order.leverage,
                            margin_type: order.marginMode.toLowerCase(),
                            side: dbSide,
                            entry_price: newPosition.entryPrice,
                            size: newPosition.size,
                            liquidation_price: newPosition.liqPrice,
                            margin: newPosition.margin,
                            tp_price: tpPrice,
                            sl_price: slPrice
                        }]);
                        if (error) {
                            console.error('Insert Position Error:', error);
                            get().showToast('System Error', 'Gagal menyimpan posisi ke server.', 'error');
                        }
                    }
                    get().syncWalletsToSupabase();
                }

                if ((tpPrice || slPrice) && existingPosIdx > -1) {
                    const targetPos = get().positions.find(p => p.symbol === order.symbol && p.side === order.side);
                    if (targetPos) {
                        await get().setFuturesTPSL(targetPos.id, tpPrice, slPrice);
                    }
                }

                get().updateAssetPrices(true);
                return true;
            },

            closeFuturesPosition: async (id, closeAmount?: number, closePrice?: number, existingPos?: FuturesPosition) => {
                const { positions, wallets, positionHistory, user } = get();
                const pos = existingPos || positions.find(p => p.id === id);
                if (!pos) return;

                const amountToClose = closeAmount !== undefined ? Math.min(closeAmount, pos.size) : pos.size;
                const isFullClose = new Decimal(amountToClose).gte(pos.size);
                const price = closePrice || pos.markPrice || pos.entryPrice;

                const ratio = new Decimal(amountToClose).div(pos.size);
                const portionPnl = new Decimal(pos.pnl).times(ratio);
                const notionalValue = new Decimal(amountToClose).times(price);
                const fee = notionalValue.times(0.0005);
                const realizedUsdt = portionPnl.minus(fee).toNumber();

                const newWallets = JSON.parse(JSON.stringify(wallets));
                newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).plus(realizedUsdt).toNumber();

                const newHistoryRecord: PositionHistoryRecord = {
                    id: Math.random().toString(36).substr(2, 9),
                    pair: pos.pair,
                    side: pos.side,
                    size: amountToClose,
                    margin: new Decimal(pos.margin).times(ratio).toNumber(),
                    entryPrice: pos.entryPrice,
                    markPrice: price,
                    leverage: pos.leverage,
                    pnl: realizedUsdt,
                    pnlPercent: portionPnl.div(new Decimal(pos.margin).times(ratio)).times(100).toNumber(),
                    timeOpened: Date.now() - 3600000,
                    timeClosed: Date.now(),
                    marginMode: pos.marginMode || 'Cross'
                };

                let updatedPositions = [...positions];
                if (isFullClose) {
                    updatedPositions = positions.filter(p => p.id !== id);
                } else {
                    updatedPositions = positions.map(p => {
                        if (p.id === id) {
                            return {
                                ...p,
                                size: new Decimal(p.size).minus(amountToClose).toNumber(),
                                margin: new Decimal(p.margin).times(new Decimal(1).minus(ratio)).toNumber()
                            };
                        }
                        return p;
                    });
                }

                set({
                    wallets: newWallets,
                    positions: updatedPositions,
                    positionHistory: [newHistoryRecord, ...(positionHistory || [])]
                });

                // Record the closing trade in order history
                get().addTrade({
                    id: `CLOSE-F-${Date.now()}-${pos.id}`,
                    symbol: pos.pair,
                    side: pos.side === 'Buy' ? 'Sell' : 'Buy',
                    type: 'Market',
                    price: price,
                    amount: amountToClose,
                    fee: fee.toNumber(),
                    pnl: realizedUsdt,
                    timestamp: Date.now(),
                    status: 'filled'
                });

                get().updateAssetPrices(true);
                get().showToast(
                    isFullClose ? 'Position Closed' : 'Partial Close Success',
                    `${pos.side === 'Buy' ? 'Long' : 'Short'} ${pos.pair} ${isFullClose ? 'closed' : `partially closed (${amountToClose})`}. Realized PnL: ${realizedUsdt >= 0 ? '+' : ''}${realizedUsdt.toFixed(2)} USDT`,
                    'success'
                );

                if (user) {
                    await supabase.from('history_futures').insert([{
                        user_id: user.id,
                        pair: pos.pair,
                        leverage: pos.leverage,
                        margin_type: pos.marginMode?.toLowerCase(),
                        side: pos.side === 'Buy' ? 'long' : 'short',
                        entry_price: pos.entryPrice,
                        close_price: price,
                        size: amountToClose,
                        margin: new Decimal(pos.margin).times(ratio).toNumber(),
                        pnl: realizedUsdt,
                        type: 'Market',
                        time_opened: new Date(newHistoryRecord.timeOpened).toISOString(),
                        time_closed: new Date(newHistoryRecord.timeClosed).toISOString()
                    }]);

                    if (isFullClose) {
                        await supabase.from('positions_futures').delete()
                            .eq('user_id', user.id)
                            .eq('pair', pos.pair)
                            .eq('side', pos.side === 'Buy' ? 'long' : 'short');
                    } else {
                        await supabase.from('positions_futures').update({
                            size: new Decimal(pos.size).minus(amountToClose).toNumber(),
                            margin: new Decimal(pos.margin).times(new Decimal(1).minus(ratio)).toNumber()
                        }).eq('user_id', user.id)
                            .eq('pair', pos.pair)
                            .eq('side', pos.side === 'Buy' ? 'long' : 'short');
                    }
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
                    spotTPSL: [],
                    nextFundingTime: Date.now() + 8 * 3600000,
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

            setPartialTPSL: async (positionId, type, price, amount) => {
                const { positions, user } = get();
                const pos = positions.find(p => p.id === positionId);
                if (!pos) return;

                const newOrder: TriggerOrder = {
                    id: crypto.randomUUID(),
                    price,
                    amount
                };

                const updatedPositions = positions.map(p => {
                    if (p.id !== positionId) return p;
                    if (type === 'TP') {
                        return { ...p, tpOrders: [...(p.tpOrders || []), newOrder] };
                    } else {
                        return { ...p, slOrders: [...(p.slOrders || []), newOrder] };
                    }
                });

                set({ positions: updatedPositions });

                if (user) {
                    const updatedPos = updatedPositions.find(p => p.id === positionId);
                    await supabase.from('positions_futures').update({
                        tp_orders: updatedPos?.tpOrders || [],
                        sl_orders: updatedPos?.slOrders || []
                    }).eq('id', positionId).eq('user_id', user.id);
                }
            },

            setTrailingStop: async (positionId, activationPrice, callbackRate) => {
                const { positions, user } = get();
                const pos = positions.find(p => p.id === positionId);
                if (!pos) return;

                const trailingStop = {
                    activationPrice,
                    callbackRate,
                    watermarkPrice: pos.markPrice || pos.entryPrice,
                    isActive: false
                };

                const updatedPositions = positions.map(p =>
                    p.id === positionId ? { ...p, trailingStop } : p
                );
                set({ positions: updatedPositions });

                if (user) {
                    await supabase.from('positions_futures').update({
                        trailing_stop: trailingStop
                    }).eq('id', positionId).eq('user_id', user.id);
                }
            },

            processPartialClosure: async (id, price, amount, type) => {
                const { positions, wallets, tradeHistory, user } = get();
                const pos = positions.find(p => p.id === id);
                if (!pos) return;

                const notionalValue = new Decimal(amount).times(price);
                const fee = notionalValue.times(0.0005).toNumber();

                const priceDiff = pos.side === 'Buy'
                    ? new Decimal(price).minus(pos.entryPrice)
                    : new Decimal(pos.entryPrice).minus(price);

                const realizedPnl = priceDiff.times(amount).minus(fee).toNumber();

                const newWallets = JSON.parse(JSON.stringify(wallets));
                newWallets.futures.USDT = new Decimal(newWallets.futures.USDT || 0).plus(realizedPnl).toNumber();

                const updatedHistory = [...tradeHistory, {
                    id: `PART-${Date.now()}`,
                    symbol: pos.symbol,
                    side: pos.side === 'Buy' ? 'Sell' : 'Buy',
                    type: type,
                    price: price,
                    amount: amount,
                    fee: fee,
                    pnl: realizedPnl,
                    timestamp: Date.now(),
                    status: 'Completed'
                }];

                set({
                    wallets: newWallets,
                    tradeHistory: updatedHistory
                });

                if (user) {
                    const remainingSize = new Decimal(pos.size).minus(amount).toNumber();
                    const ratio = remainingSize / pos.size;
                    const newMargin = new Decimal(pos.margin).times(ratio).toNumber();

                    await supabase.from('positions_futures').update({
                        size: remainingSize,
                        margin: newMargin
                    })
                        .eq('user_id', user.id)
                        .eq('pair', pos.symbol)
                        .eq('side', pos.side === 'Buy' ? 'long' : 'short');

                    await supabase.from('history_futures').insert([{
                        user_id: user.id,
                        pair: pos.symbol,
                        leverage: pos.leverage,
                        margin_type: pos.marginMode?.toLowerCase() || 'cross',
                        side: pos.side === 'Buy' ? 'long' : 'short',
                        entry_price: pos.entryPrice,
                        close_price: price,
                        size: amount,
                        margin: pos.margin - newMargin,
                        pnl: realizedPnl,
                        type: type,
                        time_opened: new Date(Date.now() - 3600000).toISOString(),
                        time_closed: new Date().toISOString()
                    }]);

                    get().syncWalletsToSupabase();
                }

                get().showToast('Partial Target Reached', `${amount} ${pos.symbol} closed at ${price} USDT. PnL: ${realizedPnl > 0 ? '+' : ''}${realizedPnl.toFixed(2)} USDT`, 'success');
            },

            // Auto-Calculation: recalculate asset values from latest market prices and wallets
            // Auto-PnL: compute daily PnL from weighted asset × priceChangePercent
            updateAssetPrices: (force = false) => {
                const store = get();
                const { user, fetchSupabasePositions, fetchSupabaseOpenOrders, fetchSupabaseFavorites } = store;
                const now = Date.now();
                if (!force && now - lastPortfolioCalc < 3000) return;
                lastPortfolioCalc = now;

                // Periodic Sync (Background refresh from Supabase every 30s)
                const lastSync = (window as any)._lastSupabaseSync || 0;
                if (user && now - lastSync > 30000) {
                    (window as any)._lastSupabaseSync = now;
                    // Run sync in background without blocking price updates
                    Promise.all([
                        fetchSupabasePositions(),
                        fetchSupabaseOpenOrders(),
                        fetchSupabaseFavorites()
                    ]).catch(e => console.warn('Background sync failed:', e));
                }

                let triggeredClosures: { pos: any; type: string }[] = [];
                let filledSpotOrders: any[] = [];
                let isLiquidated = false;
                let liquidatedPositions: any[] = [];
                let partialExecutions: { id: string; price: number; amount: number; type: string }[] = [];

                set((state) => {
                    const { wallets, markets, futuresMarkets, openOrders, positions, spotCostBasis, tradeHistory, spotTPSL } = state;

                    let fillOccurred = false;
                    const remainingOrders: any[] = [];
                    const updatedWallets = JSON.parse(JSON.stringify(wallets));
                    const updatedCostBasis = { ...spotCostBasis };
                    const updatedTradeHistory = [...tradeHistory];

                    openOrders.forEach(order => {
                        const mks = order.isFutures ? futuresMarkets : markets;
                        const market = mks.find(m => m.symbol === order.symbol);
                        if (!market) {
                            remainingOrders.push(order);
                            return;
                        }

                        const currentPrice = new Decimal(market.lastPrice);
                        const dOrderPrice = new Decimal(order.price);
                        const shouldFill = order.side === 'Buy'
                            ? currentPrice.lte(dOrderPrice)
                            : currentPrice.gte(dOrderPrice);

                        if (shouldFill) {
                            fillOccurred = true;
                            if (order.isFutures) {
                                // For futures, we trigger placeFuturesOrder with the limit price
                                // This will handle all margin/position logic
                                // Since we are inside set(), we should do this AFTER set() finishes OR better, handle logic here
                                // But placeFuturesOrder is complex. Let's mark it as filled and handle it outside set()
                                triggeredClosures.push({ pos: order, type: 'FuturesFill' });
                            } else {
                                filledSpotOrders.push(order);
                                const symbol = order.symbol.replace('USDT', '');

                                if (order.side === 'Buy') {
                                    const oldAmount = new Decimal(updatedWallets.spot[symbol] || 0);
                                    const oldCost = new Decimal(updatedCostBasis[symbol] || currentPrice.toNumber());
                                    const dOrderAmount = new Decimal(order.amount);
                                    const newAmount = oldAmount.plus(dOrderAmount);

                                    updatedWallets.spot[symbol] = newAmount.toNumber();
                                    
                                    // AUTOMATIC TRIGGER ACTIVATION: If order had TP/SL, activate it now
                                    if (order.tpPrice || order.slPrice) {
                                        store.setSpotTPSL(symbol, order.tpPrice, order.slPrice, order.amount);
                                    }
                                } else {
                                    const sellValue = currentPrice.times(new Decimal(order.amount));
                                    updatedWallets.spot.USDT = new Decimal(updatedWallets.spot.USDT || 0).plus(sellValue).toNumber();
                                    updatedWallets.spot[symbol] = new Decimal(updatedWallets.spot[symbol] || 0).minus(new Decimal(order.amount)).toNumber();
                                }

                                updatedTradeHistory.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    symbol: order.symbol,
                                    pair: order.symbol,
                                    side: order.side as 'Buy' | 'Sell',
                                    price: currentPrice.toNumber(),
                                    amount: order.amount,
                                    timestamp: Date.now(),
                                    pnl: 0,
                                    type: order.type,
                                    status: 'Completed'
                                });
                            }
                        } else {
                            remainingOrders.push(order);
                        }
                    });

                    const triggeredSpotSell: any[] = [];
                    spotTPSL.forEach(s => {
                        const market = markets.find(m => m.symbol === `${s.symbol}USDT` || m.symbol === `${s.symbol}USD`);
                        if (!market) return;

                        const currentPrice = new Decimal(market.lastPrice);
                        const costBasis = new Decimal(spotCostBasis[s.symbol] || currentPrice.toNumber());
                        let trigger = false;
                        let type = '';

                        if (s.tpPrice && currentPrice.gte(new Decimal(s.tpPrice))) {
                            trigger = true;
                            type = 'Take Profit';
                        }
                        if (s.slPrice && currentPrice.lte(new Decimal(s.slPrice)) && !trigger) {
                            trigger = true;
                            type = 'Stop Loss';
                        }

                        if (trigger) {
                            fillOccurred = true;
                            triggeredSpotSell.push(s);
                            triggeredClosures.push({ pos: s, type });

                            const sellAmount = new Decimal(s.amount);
                            const sellValue = sellAmount.times(currentPrice);
                            const fee = sellValue.times(new Decimal(0.001));

                            updatedWallets.spot[s.symbol] = new Decimal(updatedWallets.spot[s.symbol] || 0).minus(sellAmount).toNumber();
                            updatedWallets.spot.USDT = new Decimal(updatedWallets.spot.USDT || 0).plus(sellValue).minus(fee).toNumber();

                            updatedTradeHistory.push({
                                id: `SPOT-TPSL-${Date.now()}-${s.symbol}`,
                                symbol: `${s.symbol}USDT`,
                                side: 'Sell',
                                price: currentPrice.toNumber(),
                                amount: sellAmount.toNumber(),
                                fee: fee.toNumber(),
                                pnl: currentPrice.minus(costBasis).times(sellAmount).toNumber(),
                                timestamp: Date.now(),
                                type: 'Market',
                                status: 'Completed'
                            });
                        }
                    });

                    let dFuturesUnrealizedPnl = new Decimal(0);
                    let totalCrossMaintMargin = new Decimal(0);
                    let totalCrossPnl = new Decimal(0);
                    let totalIsolatedMargin = new Decimal(0);

                    let updatedPositions: any[] = [];

                    positions.forEach(pos => {
                        const market = futuresMarkets.find(m => m.symbol === pos.symbol);
                        const markPrice = market ? new Decimal(market.lastPrice) : new Decimal(pos.markPrice);

                        const priceDiff = pos.side === 'Buy'
                            ? markPrice.minus(new Decimal(pos.entryPrice))
                            : new Decimal(pos.entryPrice).minus(markPrice);

                        const pnl = priceDiff.times(new Decimal(pos.size));
                        const pnlPercent = pnl.div(new Decimal(pos.margin)).times(new Decimal(100));

                        const maintenanceMargin = new Decimal(pos.size).times(markPrice).times(new Decimal(0.005));

                        let triggerCloseEntire = false;
                        let closeType = '';
                        let remainingSize = new Decimal(pos.size);

                        if (pos.trailingStop) {
                            let ts = { ...pos.trailingStop };
                            const dActivation = new Decimal(ts.activationPrice);
                            const dWatermark = new Decimal(ts.watermarkPrice);
                            const dCallback = new Decimal(ts.callbackRate);

                            if (!ts.isActive) {
                                if ((pos.side === 'Buy' && markPrice.gte(dActivation)) ||
                                    (pos.side === 'Sell' && markPrice.lte(dActivation))) {
                                    ts.isActive = true;
                                    ts.watermarkPrice = markPrice.toNumber();
                                }
                            } else {
                                if (pos.side === 'Buy') {
                                    if (markPrice.gt(dWatermark)) ts.watermarkPrice = markPrice.toNumber();
                                    const triggerPrice = new Decimal(ts.watermarkPrice).times(new Decimal(1).minus(dCallback));
                                    if (markPrice.lte(triggerPrice)) {
                                        triggerCloseEntire = true;
                                        closeType = 'Trailing Stop';
                                    }
                                } else {
                                    if (markPrice.lt(dWatermark)) ts.watermarkPrice = markPrice.toNumber();
                                    const triggerPrice = new Decimal(ts.watermarkPrice).times(new Decimal(1).plus(dCallback));
                                    if (markPrice.gte(triggerPrice)) {
                                        triggerCloseEntire = true;
                                        closeType = 'Trailing Stop';
                                    }
                                }
                            }
                            pos.trailingStop = ts;
                        }

                        if (!triggerCloseEntire && pos.tpPrice) {
                            if ((pos.side === 'Buy' && markPrice.gte(new Decimal(pos.tpPrice))) || (pos.side === 'Sell' && markPrice.lte(new Decimal(pos.tpPrice)))) {
                                triggerCloseEntire = true;
                                closeType = 'Take Profit';
                            }
                        }
                        if (!triggerCloseEntire && pos.slPrice) {
                            if ((pos.side === 'Buy' && markPrice.lte(new Decimal(pos.slPrice))) || (pos.side === 'Sell' && markPrice.gte(new Decimal(pos.slPrice)))) {
                                triggerCloseEntire = true;
                                closeType = 'Stop Loss';
                            }
                        }

                        let nextTpOrders = pos.tpOrders || [];
                        let nextSlOrders = pos.slOrders || [];

                        if (!triggerCloseEntire) {
                            if (pos.tpOrders && pos.tpOrders.length > 0) {
                                const pendingTps = [];
                                for (const tp of pos.tpOrders) {
                                    const dTpPrice = new Decimal(tp.price);
                                    const isTriggered = pos.side === 'Buy' ? markPrice.gte(dTpPrice) : markPrice.lte(dTpPrice);
                                    if (isTriggered && remainingSize.gt(0)) {
                                        const execAmount = Decimal.min(new Decimal(tp.amount), remainingSize);
                                        remainingSize = remainingSize.minus(execAmount);
                                        partialExecutions.push({ id: pos.id, price: tp.price, amount: execAmount.toNumber(), type: 'Partial TP' });
                                    } else {
                                        pendingTps.push(tp);
                                    }
                                }
                                nextTpOrders = pendingTps;
                            }

                            if (pos.slOrders && pos.slOrders.length > 0) {
                                const pendingSls = [];
                                for (const sl of pos.slOrders) {
                                    const dSlPrice = new Decimal(sl.price);
                                    const isTriggered = pos.side === 'Buy' ? markPrice.lte(dSlPrice) : markPrice.gte(dSlPrice);
                                    if (isTriggered && remainingSize.gt(0)) {
                                        const execAmount = Decimal.min(new Decimal(sl.amount), remainingSize);
                                        remainingSize = remainingSize.minus(execAmount);
                                        partialExecutions.push({ id: pos.id, price: sl.price, amount: execAmount.toNumber(), type: 'Partial SL' });
                                    } else {
                                        pendingSls.push(sl);
                                    }
                                }
                                nextSlOrders = pendingSls;
                            }
                        }

                        if (remainingSize.lte(0) && !triggerCloseEntire) {
                            triggerCloseEntire = true;
                            closeType = 'All Partials Filled';
                        }

                        if (triggerCloseEntire) {
                            triggeredClosures.push({ pos, type: closeType });
                        } else {
                            const isCross = pos.marginMode?.toLowerCase() === 'cross';
                            if (isCross) {
                                totalCrossPnl = totalCrossPnl.plus(pnl);
                                totalCrossMaintMargin = totalCrossMaintMargin.plus(maintenanceMargin);
                            } else {
                                totalIsolatedMargin = totalIsolatedMargin.plus(new Decimal(pos.margin));
                                const isolatedEquity = new Decimal(pos.margin).plus(pnl);
                                if (isolatedEquity.lte(maintenanceMargin)) {
                                    liquidatedPositions.push(pos);
                                    return;
                                }
                            }

                            dFuturesUnrealizedPnl = dFuturesUnrealizedPnl.plus(pnl);

                            updatedPositions.push({
                                ...pos,
                                size: remainingSize.toNumber(),
                                markPrice: markPrice.toNumber(),
                                pnl: pnl.toDecimalPlaces(8).toNumber(),
                                pnlPercent: pnlPercent.toDecimalPlaces(2).toNumber(),
                                tpOrders: nextTpOrders,
                                slOrders: nextSlOrders
                            });
                        }
                    });

                    const futuresWalletBalance = new Decimal(updatedWallets.futures.USDT || 0);
                    const crossAvailableBalance = futuresWalletBalance.minus(totalIsolatedMargin);
                    const crossEquity = crossAvailableBalance.plus(totalCrossPnl);

                    if (crossEquity.lte(totalCrossMaintMargin) && totalCrossMaintMargin.gt(0)) {
                        fillOccurred = true;
                        const survivingPositions: any[] = [];
                        updatedPositions.forEach(pos => {
                            if (pos.marginMode?.toLowerCase() === 'cross') {
                                liquidatedPositions.push(pos);
                            } else {
                                survivingPositions.push(pos);
                            }
                        });
                        updatedPositions = survivingPositions;
                        updatedWallets.futures.USDT = totalIsolatedMargin.toNumber();
                    }

                    if (liquidatedPositions.length > 0) {
                        fillOccurred = true;
                        liquidatedPositions.forEach(pos => {
                            if (pos.marginMode?.toLowerCase() !== 'cross') {
                                updatedWallets.futures.USDT = new Decimal(updatedWallets.futures.USDT || 0).minus(new Decimal(pos.margin)).toNumber();
                            }
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
                    }

                    const finalWallets = fillOccurred ? updatedWallets : wallets;

                    let dSpotTotal = new Decimal(0);
                    let dSpotUnrealizedPnl = new Decimal(0);
                    const updatedAssets = Object.entries(finalWallets.spot).map(([symbol, amount]) => {
                        let valueUsdt = new Decimal(amount as number);
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            const currentPrice = market ? new Decimal(market.lastPrice) : new Decimal(0);

                            if (market) {
                                valueUsdt = new Decimal(amount as number).times(currentPrice);
                                const costPrice = new Decimal(spotCostBasis[symbol] || 0);
                                if (costPrice.gt(0)) {
                                    const pnl = currentPrice.minus(costPrice).times(new Decimal(amount as number));
                                    dSpotUnrealizedPnl = dSpotUnrealizedPnl.plus(pnl);
                                }
                            }
                        }
                        dSpotTotal = dSpotTotal.plus(valueUsdt);
                        return { symbol, amount: amount as number, valueUsdt: valueUsdt.toNumber() };
                    }).filter(a => a.amount > 0 || a.symbol === 'USDT');

                    let dEarnTotal = new Decimal(0);
                    Object.entries(finalWallets.earn).forEach(([symbol, amount]) => {
                        let valueUsdt = new Decimal(amount as number);
                        if (symbol !== 'USDT' && symbol !== 'USDC') {
                            const market = markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                            if (market) valueUsdt = new Decimal(amount as number).times(new Decimal(market.lastPrice));
                        }
                        dEarnTotal = dEarnTotal.plus(valueUsdt);
                    });

                    const dFuturesWallet = new Decimal(finalWallets.futures.USDT || 0);
                    let dFuturesTotal = dFuturesWallet.plus(dFuturesUnrealizedPnl);
                    if (dFuturesTotal.lt(0)) dFuturesTotal = new Decimal(0);

                    const dTotalValue = dSpotTotal.plus(dFuturesTotal).plus(dEarnTotal);
                    const dTotalUnrealizedPnl = dSpotUnrealizedPnl.plus(dFuturesUnrealizedPnl);
                    const pnlPercentValue = dTotalValue.gt(0)
                        ? dTotalUnrealizedPnl.div(dTotalValue).times(new Decimal(100)).toNumber()
                        : 0;

                    const btcMarket = markets.find(m => m.symbol === 'BTCUSDT');
                    const btcPrice = btcMarket ? new Decimal(btcMarket.lastPrice) : new Decimal(0);
                    const newRates = { ...state.rates };
                    if (btcPrice.gt(0)) newRates.BTC = new Decimal(1).div(btcPrice).toNumber();

                    const today = new Date().toISOString().split('T')[0];
                    const nextSnapshots = { ...state.snapshots };
                    if (state.snapshots[today] === undefined) nextSnapshots[today] = dTotalValue.toNumber();

                    return {
                        wallets: finalWallets,
                        openOrders: remainingOrders,
                        spotCostBasis: fillOccurred ? updatedCostBasis : spotCostBasis,
                        spotTPSL: triggeredSpotSell.length > 0 ? spotTPSL.filter(s => !triggeredSpotSell.some(ts => ts.symbol === s.symbol)) : spotTPSL,
                        tradeHistory: fillOccurred ? updatedTradeHistory : tradeHistory,
                        positions: updatedPositions,
                        assets: updatedAssets,
                        balance: dTotalValue.toDecimalPlaces(8).toNumber(),
                        spotBalance: dSpotTotal.toDecimalPlaces(8).toNumber(),
                        futuresBalance: dFuturesTotal.toDecimalPlaces(8).toNumber(),
                        earnBalance: dEarnTotal.toDecimalPlaces(8).toNumber(),
                        todayPnl: dTotalUnrealizedPnl.toDecimalPlaces(8).toNumber(),
                        todaySpotPnl: dSpotUnrealizedPnl.toDecimalPlaces(8).toNumber(),
                        pnlPercent: new Decimal(pnlPercentValue).toDecimalPlaces(2).toNumber(),
                        futuresUnrealizedPnl: dFuturesUnrealizedPnl.toDecimalPlaces(8).toNumber(),
                        rates: newRates,
                        snapshots: nextSnapshots
                    };
                });

                if (partialExecutions.length > 0) {
                    partialExecutions.forEach(exec => {
                        store.processPartialClosure(exec.id, exec.price, exec.amount, exec.type);
                    });
                    store.syncWalletsToSupabase();
                }

                if (liquidatedPositions.length > 0 && user) {
                    get().showToast('Liquidation Alert', 'Positions liquidated due to insufficient margin.', 'error');

                    const historyInserts = liquidatedPositions.map(pos => ({
                        user_id: user.id,
                        pair: pos.pair,
                        leverage: pos.leverage,
                        margin_type: pos.marginMode?.toLowerCase() || 'cross',
                        side: pos.side === 'Buy' ? 'long' : 'short',
                        entry_price: pos.entryPrice,
                        close_price: pos.markPrice || pos.entryPrice,
                        size: pos.size,
                        margin: pos.margin,
                        pnl: pos.pnl,
                        type: 'Liquidation',
                        time_opened: new Date(Date.now() - 3600000).toISOString(),
                        time_closed: new Date().toISOString()
                    }));

                    import('../utils/supabase').then(({ supabase }) => {
                        supabase.from('history_futures').insert(historyInserts).then(() => {
                            const deletePromises = liquidatedPositions.map(pos =>
                                supabase.from('positions_futures').delete().eq('user_id', user.id).eq('pair', pos.pair).eq('side', pos.side === 'Buy' ? 'long' : 'short')
                            );
                            Promise.all(deletePromises).then(() => {
                                store.syncWalletsToSupabase();
                                store.fetchSupabaseHistory();
                            });
                        });
                    });
                }

                if (filledSpotOrders.length > 0 && user) {
                    import('../utils/supabase').then(async ({ supabase }) => {
                        try {
                            const updatePromises = filledSpotOrders.map(order => 
                                supabase.from('pending_orders')
                                    .update({ status: 'filled', filled: order.amount })
                                    .eq('user_id', user.id)
                                    .eq('id', order.id)
                            );
                            await Promise.all(updatePromises);
                            await store.syncWalletsToSupabase();
                            store.fetchSupabaseHistory();
                        } catch (err) {
                            console.error('Auto-fill execution error:', err);
                        }
                    });
                }

                if (triggeredClosures.length > 0) {
                    import('../utils/supabase').then(({ supabase }) => {
                        triggeredClosures.forEach(async c => {
                            if (c.type === 'FuturesFill') {
                                const order = c.pos;
                                
                                // Call placeFuturesOrder to actually open the position
                                const success = await store.placeFuturesOrder({
                                    symbol: order.symbol,
                                    side: order.side,
                                    type: 'Market', 
                                    price: order.price,
                                    amount: order.amount,
                                    leverage: order.leverage || 10,
                                    marginMode: order.marginMode || 'Isolated'
                                }, order.tpPrice, order.slPrice);

                                if (user) {
                                    // FIX: Hanya set status "filled" jika placeFuturesOrder sukses (margin cukup)
                                    // Jika tidak, set ke "canceled" agar tidak menjadi order hantu.
                                    await supabase.from('pending_orders')
                                        .update({ 
                                            status: success ? 'filled' : 'canceled', 
                                            filled: success ? order.amount : 0 
                                        })
                                        .eq('user_id', user.id)
                                        .eq('id', order.id);
                                }
                                
                                if (success) {
                                    store.showToast('Limit Order Filled', `Futures ${order.side} for ${order.amount} ${order.symbol} filled at ${order.price} USDT`, 'success');
                                }
                                return;
                            }

                            if (!user) return; // Remaining triggers require user session for Supabase sync

                            if (!c.pos.id) { // Spot TPSL doesn't have ID in this context, or has symbol
                                const symbol = c.pos.symbol;
                                store.showToast(`${c.type} Triggered`, `Spot asset ${symbol} sold.`, 'info');
                                
                                const spotMarket = store.markets.find(m => m.symbol === `${symbol}USDT` || m.symbol === `${symbol}USD`);
                                const execPrice = spotMarket ? parseFloat(spotMarket.lastPrice) : 0;
                                const spAsset = store.spotTPSL.find(s => s.symbol === symbol);

                                if (spAsset) {
                                    await supabase.from('pending_orders').insert([{
                                        id: crypto.randomUUID(),
                                        user_id: user.id,
                                        pair: `${symbol}USDT`,
                                        side: 'sell',
                                        type: 'market',
                                        price: execPrice,
                                        amount: spAsset.amount,
                                        filled: spAsset.amount,
                                        status: 'filled'
                                    }]);

                                    const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();
                                    const updatedTPSL = store.spotTPSL.filter(s => s.symbol !== symbol);
                                    await supabase.from('profiles').upsert({
                                        id: user.id,
                                        preferences: { ...(profile?.preferences || {}), spotTPSL: updatedTPSL },
                                        updated_at: new Date().toISOString()
                                    });
                                }
                                store.syncWalletsToSupabase();
                            } else {
                                store.showToast(`${c.type} Triggered`, `Position auto-closed.`, 'info');
                                store.closeFuturesPosition(c.pos.id, undefined, undefined, c.pos);
                            }
                        });
                    });
                }
            },

            getPnLForTimeframe: (timeframe: string) => {
                const { snapshots, transactionHistory, balance } = get();
                const now = new Date();
                let historicalDate = new Date();

                switch (timeframe) {
                    case '1D': historicalDate.setDate(now.getDate() - 1); break;
                    case '1W': historicalDate.setDate(now.getDate() - 7); break;
                    case '1M': historicalDate.setMonth(now.getMonth() - 1); break;
                    case '6M': historicalDate.setMonth(now.getMonth() - 6); break;
                    case '1Y': historicalDate.setFullYear(now.getFullYear() - 1); break;
                }

                const targetDateStr = historicalDate.toISOString().split('T')[0];
                const sortedDates = Object.keys(snapshots).sort();

                let historicalEquity = 0;
                let baselineFound = false;
                let baselineTimestamp = 0;

                if (snapshots[targetDateStr] !== undefined) {
                    historicalEquity = snapshots[targetDateStr];
                    baselineFound = true;
                    baselineTimestamp = historicalDate.getTime();
                } else {
                    for (let i = sortedDates.length - 1; i >= 0; i--) {
                        if (sortedDates[i] <= targetDateStr) {
                            historicalEquity = snapshots[sortedDates[i]];
                            baselineFound = true;
                            baselineTimestamp = new Date(sortedDates[i]).getTime();
                            break;
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

                const dBalance = new Decimal(balance);
                const dHistorical = new Decimal(historicalEquity);
                const dPeriodFlow = new Decimal(periodFlow);
                const dCurrentPnL = dBalance.minus(dHistorical).minus(dPeriodFlow);

                const depositsInPeriod = transactionHistory
                    .filter(tx => tx.timestamp > baselineTimestamp && tx.status === 'Completed' && (tx.type.toLowerCase() === 'deposit' || (!tx.from && tx.to)))
                    .reduce((acc, tx) => new Decimal(acc).plus(tx.amount).toNumber(), 0);

                const dBaseCapital = dHistorical.plus(depositsInPeriod);
                const dPnlPct = dBaseCapital.gt(0)
                    ? dCurrentPnL.div(dBaseCapital).times(100)
                    : new Decimal(0);

                return {
                    value: dCurrentPnL.toDecimalPlaces(8).toNumber(),
                    percent: dPnlPct.toDecimalPlaces(2).toNumber(),
                    hasData: baselineFound || dBaseCapital.gt(0)
                };
            },

            closeAll: async () => {
                const { user, wallets, spotCostBasis, markets, positions, showToast } = get();
                
                // 1. Database Cleanup (Nuclear)
                if (user) {
                    try {
                        // Delete all open spot orders
                        await supabase.from('pending_orders').delete().eq('user_id', user.id).eq('status', 'open');
                        
                        // Delete all open futures positions
                        await supabase.from('positions_futures').delete().eq('user_id', user.id);
                        
                        // Delete all spot TPSL (assuming stored in pending_orders or similar, but clearing state is key)
                    } catch (err) {
                        console.error('Failed to cleanup database in closeAll:', err);
                    }
                }

                // 2. Local State Reset & Spot Liquidation
                set((state) => {
                    const newWallets = JSON.parse(JSON.stringify(state.wallets));
                    let additionalUsdt = 0;

                    // Convert all spot assets back to USDT (Liquidation)
                    const newSpotWallets = { ...newWallets.spot };
                    Object.keys(state.spotCostBasis).forEach(symbol => {
                        const coin = symbol.replace('USDT', '');
                        const amount = newSpotWallets[coin] || 0;
                        if (amount > 0) {
                            const market = state.markets.find(m => m.symbol === symbol);
                            const price = market ? parseFloat(market.lastPrice) : 0;
                            additionalUsdt += amount * price;
                            delete newSpotWallets[coin];
                        }
                    });

                    // Handle Futures Margin Recovery (Simplified Demo: Add margin of closed positions back to USDT)
                    const totalMarginInPositions = (state.positions || []).reduce((sum, pos) => sum + pos.margin, 0);
                    newWallets.futures.USDT = (newWallets.futures.USDT || 0) + totalMarginInPositions;

                    newSpotWallets.USDT = (newSpotWallets.USDT || 0) + additionalUsdt;
                    newWallets.spot = newSpotWallets;

                    return {
                        openOrders: [],
                        positions: [],
                        spotCostBasis: {},
                        spotTPSL: [],
                        wallets: newWallets
                    };
                });

                // 3. Final Sync
                await get().syncWalletsToSupabase();
                showToast('Nuclear Reset Successful', 'All positions closed, orders canceled, and assets liquidated.', 'success');
            },

            fetchMarketConfigs: async () => {
                try {
                    const { data, error } = await supabase.from('market_configs').select('*');
                    if (error) throw error;
                    
                    if (data) {
                        const configsMap: Record<string, { pricePrecision: number; maxLeverage: number; mmr: number }> = {};
                        data.forEach(item => {
                            configsMap[item.symbol] = {
                                pricePrecision: item.price_precision,
                                maxLeverage: item.max_leverage,
                                mmr: item.maint_margin_ratio
                            };
                        });
                        set({ marketConfigs: configsMap });
                    }
                } catch (error) {
                    console.error('Failed to fetch market configs:', error);
                }
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
