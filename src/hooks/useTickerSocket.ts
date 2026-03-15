import { useState, useEffect } from 'react';

interface TickerData {
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high24: number;
    low24: number;
    vol24: number;
    turnover24: number;
}

export const useTickerSocket = (symbol: string, type: 'spot' | 'futures', initialData?: Partial<TickerData>) => {
    const [ticker, setTicker] = useState<TickerData | null>(initialData as TickerData || null);

    useEffect(() => {
        if (!symbol) return;

        let ws: WebSocket | null = null;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const connect = () => {
            const wsUrl = type === 'futures'
                ? `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@ticker`
                : `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;

            ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                if (cancelled) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data && data.c) {
                        setTicker({
                            lastPrice: parseFloat(data.c),
                            priceChange: parseFloat(data.p || 0),
                            priceChangePercent: parseFloat(data.P || 0),
                            high24: parseFloat(data.h || 0),
                            low24: parseFloat(data.l || 0),
                            vol24: parseFloat(data.v || 0),
                            turnover24: parseFloat(data.q || 0),
                        });
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
                    retryTimeout = setTimeout(connect, 3000);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            if (retryTimeout) clearTimeout(retryTimeout);
            
            if (ws) {
                // Jangan close paksa jika sedang CONNECTING (readyState === 0)
                if (ws.readyState === 0) {
                    ws.onopen = () => {
                        ws?.close();
                    };
                } else {
                    ws.close();
                }
            }
        };
    }, [symbol, type]);

    return ticker;
};
