import useExchangeStore from '../stores/useExchangeStore';

type StreamType = 'ticker' | 'depth' | 'kline';

class WebSocketManager {
    private static instance: WebSocketManager;
    private spotWs: WebSocket | null = null;
    private futuresWs: WebSocket | null = null;
    private subscribers: Set<string> = new Set();
    private marketThrottleMs: number = 250;    // price list: fast updates
    private portfolioThrottleMs: number = 800; // portfolio value: ~3s like Binance/OKX/MEXC
    private lastMarketUpdate: number = 0;
    private lastPortfolioUpdate: number = 0;
    private updateQueue: any[] = [];

    private constructor() { }

    static getInstance() {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    connect() {
        if (this.spotWs || this.futuresWs) return;

        this.connectSpot();
        this.connectFutures();
    }

    private connectSpot() {
        this.spotWs = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
        this.spotWs.onmessage = (e) => this.handleMessage(e, 'spot');
        this.spotWs.onclose = () => setTimeout(() => this.connectSpot(), 3000);
    }

    private connectFutures() {
        this.futuresWs = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
        this.futuresWs.onmessage = (e) => this.handleMessage(e, 'futures');
        this.futuresWs.onclose = () => setTimeout(() => this.connectFutures(), 3000);
    }

    private handleMessage(event: MessageEvent, type: 'spot' | 'futures') {
        try {
            const data = JSON.parse(event.data);
            if (!Array.isArray(data)) return;

            const formatted = data
                .filter((d: any) => d.s.endsWith('USDT'))
                .map((d: any) => ({
                    symbol: d.s,
                    lastPrice: d.c,
                    priceChange: d.p,
                    priceChangePercent: d.P,
                    highPrice: d.h,
                    lowPrice: d.l,
                    volume: d.v,
                    quoteVolume: d.q,
                }));

            const now = Date.now();

            // Fast: update market price list (~400ms)
            if (now - this.lastMarketUpdate > this.marketThrottleMs) {
                if (type === 'spot') {
                    useExchangeStore.getState().updateMarkets(formatted);
                } else {
                    useExchangeStore.getState().updateFuturesMarkets(formatted);
                }
                this.lastMarketUpdate = now;
            }

            // Slow: update portfolio balance (~3000ms like Binance/OKX/MEXC)
            if (now - this.lastPortfolioUpdate > this.portfolioThrottleMs) {
                useExchangeStore.getState().updateAssetPrices();
                this.lastPortfolioUpdate = now;
            }
        } catch (err) {
            console.error('WS Handle Error:', err);
        }
    }

    disconnect() {
        if (this.spotWs && this.spotWs.readyState === WebSocket.OPEN) {
            this.spotWs.close();
        }
        if (this.futuresWs && this.futuresWs.readyState === WebSocket.OPEN) {
            this.futuresWs.close();
        }
        this.spotWs = null;
        this.futuresWs = null;
    }
}

export const wsManager = WebSocketManager.getInstance();
