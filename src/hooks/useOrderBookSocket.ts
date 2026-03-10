import { useState, useEffect } from 'react';

export const useOrderBookSocket = (symbol: string, type: 'spot' | 'futures', depth: 5 | 10 | 20 = 20) => {
    const [orderBook, setOrderBook] = useState<{ bids: [string, string][]; asks: [string, string][] }>({ bids: [], asks: [] });
    const [isConnected, setIsConnected] = useState(false);

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
                        // Sometimes depth streams use 'b' and 'a' or 'bids' and 'asks' depending on the exact stream payload
                        setOrderBook({ bids: data.b, asks: data.a });
                    } else if (data.bids && data.asks) {
                        // The partial book depth stream uses bids and asks
                        setOrderBook({ bids: data.bids, asks: data.asks });
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            };

            ws.onerror = () => {
                ws?.close();
            };

            ws.onclose = () => {
                if (!cancelled) {
                    setIsConnected(false);
                    // Reconnect after 3 seconds
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
        };
    }, [symbol, type, depth]);

    return { orderBook, isConnected };
};
