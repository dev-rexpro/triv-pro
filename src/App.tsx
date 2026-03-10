// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import useExchangeStore from './stores/useExchangeStore';
import { wsManager } from './utils/WebSocketManager';
import { supabase } from './utils/supabase';
import { fetchBinanceTicker, fetchBinanceFuturesTicker, fetchExchangeRates, fetchExchangeInfo } from './utils/api';

// Views
import HomeView from './views/HomeView';
import MarketView from './views/MarketView';
import TradeView from './views/TradeView';
import AssetsView from './views/AssetsView';
import ManageGroupsView from './views/ManageGroupsView';
import CryptoDepositView from './views/CryptoDepositView';
import FiatDepositView from './views/FiatDepositView';
import CardDepositView from './views/CardDepositView';
import WithdrawalView from './views/WithdrawalView';
import TransferView from './views/TransferView';
import HistoryView from './views/HistoryView';
import ConvertView from './views/ConvertView';
import ChartTradeView from './views/ChartTradeView';
import TradeHistoryView from './views/TradeHistoryView';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';
import UserCenterView from './views/UserCenterView';

// Overlays
import SearchOverlay from './components/SearchOverlay';
import DepositBottomSheet from './components/DepositBottomSheet';
import PairPickerOverlay from './components/PairPickerOverlay';

// Icons
import { RiFundsBoxLine, RiNewspaperLine, RiWalletLine } from 'react-icons/ri';
import { TbTransfer, TbTransferVertical } from 'react-icons/tb';

// Local Assets
import homeIcon from './assets/icons/home-icon.svg';
import systemFont from './assets/fonts/system-font.woff2';

export default function App() {
  const {
    session, setSession,
    activePage, setActivePage, setMarkets, setFuturesMarkets, setRates, setSpotSymbols, setFuturesSymbols, isSearchOpen, setSearchOpen, isManageGroupsOpen, setManageGroupsOpen, isDepositOptionOpen, setDepositOptionOpen, isPairPickerOpen, setPairPickerOpen, updateAssetPrices, setTradeType
  } = useExchangeStore();

  const isPopStateRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        useExchangeStore.getState().fetchSupabaseWallets();
        useExchangeStore.getState().fetchSupabaseFavorites();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        useExchangeStore.getState().fetchSupabaseWallets();
        useExchangeStore.getState().fetchSupabaseHistory();
        useExchangeStore.getState().fetchSupabaseFavorites();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  // Fetch rates on interval
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await fetchExchangeRates();
        setRates(rates);
      } catch (e) {
        setRates({ USD: 1, USDT: 1, IDR: 16300, BTC: 0.000015 });
      }
    };

    fetchRates();
    const rateIntv = setInterval(fetchRates, 60000);
    return () => {
      clearInterval(rateIntv);
    };
  }, []);

  // WebSocket Ticker Stream & Earn Yield
  useEffect(() => {
    wsManager.connect();
    useExchangeStore.getState().startEarnYield();
    return () => wsManager.disconnect();
  }, []);

  // Fetch complete symbol lists (one-time, cached)
  useEffect(() => {
    const initSymbols = async () => {
      try {
        const { spotSymbols, futuresSymbols } = await fetchExchangeInfo();
        setSpotSymbols(spotSymbols);
        setFuturesSymbols(futuresSymbols);
      } catch (e) { }
    };
    initSymbols();
  }, []);

  // Sync Browser History with State
  useEffect(() => {
    // Initialize history state on mount
    const store = useExchangeStore.getState();
    const currentState = {
      activePage: store.activePage,
      isSearchOpen: store.isSearchOpen,
      isManageGroupsOpen: store.isManageGroupsOpen,
      isPairPickerOpen: store.isPairPickerOpen,
      isDepositOptionOpen: store.isDepositOptionOpen
    };

    // If the app launches into a deep state (not home), inject 'home' into history first
    // so the physical back button doesn't close the app immediately but goes to home.
    if (store.activePage !== 'home' || store.isSearchOpen || store.isDepositOptionOpen || store.isManageGroupsOpen || store.isPairPickerOpen) {
      const baseState = {
        activePage: 'home',
        isSearchOpen: false,
        isManageGroupsOpen: false,
        isPairPickerOpen: false,
        isDepositOptionOpen: false
      };
      window.history.replaceState(baseState, '', window.location.href);
      window.history.pushState(currentState, '', window.location.href);
    } else {
      window.history.replaceState(currentState, '', window.location.href);
    }
    hasInitializedRef.current = true;

    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        isPopStateRef.current = true;
        const { activePage, isSearchOpen, isManageGroupsOpen, isPairPickerOpen, isDepositOptionOpen } = e.state;

        const store = useExchangeStore.getState();
        store.setActivePage(activePage);
        store.setSearchOpen(isSearchOpen);
        store.setManageGroupsOpen(isManageGroupsOpen);
        store.setPairPickerOpen(isPairPickerOpen);
        store.setDepositOptionOpen(isDepositOptionOpen);

        // Reset flag in next tick
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history on state change
  useEffect(() => {
    if (!hasInitializedRef.current || isPopStateRef.current) return;

    const newState = {
      activePage,
      isSearchOpen,
      isManageGroupsOpen,
      isPairPickerOpen,
      isDepositOptionOpen
    };

    // Deep check to avoid duplicate entries (simplified for subpages)
    window.history.pushState(newState, '', window.location.href);
  }, [activePage, isSearchOpen, isManageGroupsOpen, isPairPickerOpen, isDepositOptionOpen]);

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] text-slate-900 relative overflow-hidden font-sans">
      {!session && <AuthView />}
      <style>{`
        @font-face {
          font-family: 'System Font';
          src: url('${systemFont}') format('woff2');
          font-display: swap;
        }
        body { font-family: 'System Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: -0.015em; }
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <AnimatePresence mode="popLayout">
        {isSearchOpen && <SearchOverlay />}
        {isManageGroupsOpen && <ManageGroupsView />}
        {isPairPickerOpen && <PairPickerOverlay />}

        {/* Subpages / Overlays */}
        {activePage === 'deposit-crypto' && <CryptoDepositView key="deposit-crypto" />}
        {activePage === 'deposit-fiat' && <FiatDepositView key="deposit-fiat" />}
        {activePage === 'deposit-card' && <CardDepositView key="deposit-card" />}
        {activePage === 'withdraw' && <WithdrawalView key="withdraw" />}
        {activePage === 'transfer' && <TransferView key="transfer" />}
        {activePage === 'convert' && <ConvertView key="convert" />}
        {activePage === 'history' && <HistoryView key="history" />}
        {activePage === 'trade-history' && <TradeHistoryView key="trade-history" />}
        {activePage === 'chart-trade' && <ChartTradeView key="chart-trade" />}
        {activePage === 'profile' && <ProfileView key="profile" />}
        {activePage === 'user-center' && <UserCenterView key="user-center" />}
      </AnimatePresence>
      <DepositBottomSheet />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activePage === 'home' && <HomeView />}
        {activePage === 'market' && <MarketView />}
        {activePage === 'trade' && <TradeView />}
        {activePage === 'futures' && <TradeView />}
        {activePage === 'assets' && <AssetsView />}
      </div>

      {activePage !== 'chart-trade' && activePage !== 'profile' && activePage !== 'user-center' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center pt-2 pb-[calc(10px+var(--safe-area-bottom))] z-[200] px-2">
          <button onClick={() => setActivePage('home')} className={`flex flex-col items-center gap-2 ${activePage === 'home' ? 'text-slate-900' : 'text-slate-400'}`}>
            <img src={homeIcon} alt="Home" className={`w-[24px] h-[24px] ${activePage === 'home' ? 'opacity-100' : 'opacity-40'}`} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => setActivePage('market')} className={`flex flex-col items-center gap-2 ${activePage === 'market' ? 'text-slate-900' : 'text-slate-400'}`}>
            <RiFundsBoxLine size={24} />
            <span className="text-[10px] font-medium">Markets</span>
          </button>

          <button onClick={() => { setActivePage('trade'); setTradeType('spot'); }} className={`flex flex-col items-center gap-2 relative ${activePage === 'trade' ? 'text-slate-900' : 'text-slate-400'}`}>
            <div className="w-[24px] h-[24px]"></div>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-[46px] h-[46px] bg-[#3189c6] rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform">
              <div className={`transition-all duration-200 flex items-center justify-center ${activePage === 'trade' ? 'scale-110' : 'scale-100'}`}>
                {activePage === 'trade' ? <TbTransferVertical size={28} strokeWidth={2} /> : <TbTransfer size={28} strokeWidth={2} />}
              </div>
            </div>
            <span className="text-[10px] font-medium">Trade</span>
          </button>

          <button onClick={() => { setActivePage('futures'); setTradeType('futures'); }} className={`flex flex-col items-center gap-2 ${activePage === 'futures' ? 'text-slate-900' : 'text-slate-400'}`}>
            <RiNewspaperLine size={24} />
            <span className="text-[10px] font-medium">Futures</span>
          </button>
          <button onClick={() => setActivePage('assets')} className={`flex flex-col items-center gap-2 ${activePage === 'assets' ? 'text-slate-900' : 'text-slate-400'}`}>
            <RiWalletLine size={24} />
            <span className="text-[10px] font-medium">Assets</span>
          </button>
        </nav>
      )}
    </div>
  );
}
