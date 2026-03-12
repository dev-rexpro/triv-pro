import { useState, useEffect, useRef } from 'react';
import throttle from 'lodash/throttle';

export const useOrderBookSocket = (symbol: string, type: 'spot' | 'futures', depth: 5 | 10 | 20 = 20) => {
    const [orderBook, setOrderBook] = useState<{ bids: [string, string][]; asks: [string, string][] }>({ bids: [], asks: [] });
    const [isConnected, setIsConnected] = useState(false);

    const throttledUpdate = useRef(
        throttle((bids, asks) => {
            setOrderBook({ bids, asks });
        }, 300)
    ).current;

    useEffect(() => {
        if (!symbol) return;

        let ws: WebSocket | null = null;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const connect = () => {
            const wsUrl = type === 'futures'
                ? `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@depth${depth}@100ms`
                : `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth${depth}@100ms`;

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                if (!cancelled) setIsConnected(true);
            };

            ws.onmessage = (event) => {
                if (cancelled) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.b && data.a) {
                        throttledUpdate(data.b, data.a);
                    } else if (data.bids && data.asks) {
                        throttledUpdate(data.bids, data.asks);
                    }
                } catch (e) {}
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
                ws.close();
            }
            throttledUpdate.cancel();
        };
    }, [symbol, type, depth]);

    return { orderBook, isConnected };
};
