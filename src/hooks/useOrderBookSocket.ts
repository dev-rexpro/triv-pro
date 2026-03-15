import { useState, useEffect, useRef } from 'react';
import throttle from 'lodash/throttle';

export const useOrderBookSocket = (symbol: string, type: 'spot' | 'futures', depth: 5 | 10 | 20 = 20) => {
    const [orderBook, setOrderBook] = useState<{ bids: [string, string][]; asks: [string, string][] }>({ bids: [], asks: [] });
    const [isConnected, setIsConnected] = useState(false);

    const bidsCache = useRef<{ [price: string]: string }>({});
    const asksCache = useRef<{ [price: string]: string }>({});

    const throttledUpdate = useRef(
        throttle(() => {
            const bids = Object.entries(bidsCache.current)
                .map(([p, a]) => [p, a] as [string, string])
                .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                .slice(0, 100);
            const asks = Object.entries(asksCache.current)
                .map(([p, a]) => [p, a] as [string, string])
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .slice(0, 100);
            setOrderBook({ bids, asks });
        }, 300) // UI update throttle
    ).current;

    useEffect(() => {
        if (!symbol) return;

        let ws: WebSocket | null = null;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const updateCache = (updates: [string, string][], cache: { [price: string]: string }) => {
            updates.forEach(([price, amount]) => {
                if (parseFloat(amount) === 0) {
                    delete cache[price];
                } else {
                    cache[price] = amount;
                }
            });
        };

        const fetchSnapshot = async () => {
            try {
                const baseUrl = type === 'futures' ? 'https://fapi.binance.com' : 'https://api.binance.com';
                const endpoint = type === 'futures' ? '/fapi/v1/depth' : '/api/v3/depth';
                const res = await fetch(`${baseUrl}${endpoint}?symbol=${symbol.toUpperCase()}&limit=100`);
                const data = await res.json();
                if (cancelled) return;

                bidsCache.current = {};
                asksCache.current = {};
                updateCache(data.bids, bidsCache.current);
                updateCache(data.asks, asksCache.current);
                throttledUpdate();
            } catch (err) {
                console.error('Error fetching snapshot:', err);
            }
        };

        const connect = () => {
            // Kita ubah ke Diff. Depth Stream agar gerakannya super responsif
            const wsUrl = type === 'futures'
                ? `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@depth@100ms`
                : `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`;

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                if (!cancelled) setIsConnected(true);
                fetchSnapshot();
            };

            ws.onmessage = (event) => {
                if (cancelled) return;
                try {
                    const data = JSON.parse(event.data);
                    // Binance diff stream uses 'b' and 'a'
                    if (data.b && data.a) {
                        updateCache(data.b, bidsCache.current);
                        updateCache(data.a, asksCache.current);
                        throttledUpdate();
                    } else if (data.bids && data.asks) {
                        // Compatibility with snapshot formats if they arrive via WS
                        updateCache(data.bids, bidsCache.current);
                        updateCache(data.asks, asksCache.current);
                        throttledUpdate();
                    }
                } catch (e) { }
            };

            ws.onerror = () => {
                ws?.close();
            };

            ws.onclose = () => {
                if (!cancelled) {
                    setIsConnected(false);
                    retryTimeout = setTimeout(connect, 3000);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            if (retryTimeout) clearTimeout(retryTimeout);
            
            if (ws) {
                // 0 is the CONNECTING state
                if (ws.readyState === 0) {
                    ws.onopen = () => {
                        ws?.close();
                    };
                } else {
                    ws.close();
                }
            }
            throttledUpdate.cancel();
            bidsCache.current = {};
            asksCache.current = {};
        };
    }, [symbol, type]); // Depth is no longer used for Diff stream

    return { orderBook, isConnected };
};
