// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

interface RealChartProps {
    data: any[];
    height?: number;
    pricePrecision?: number;
}

const RealChart: React.FC<RealChartProps> = ({ data, height, pricePrecision = 2 }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const container = chartContainerRef.current;

        // Initial size detection
        const getInitialSize = () => {
            const h = height || container.clientHeight || 300;
            const w = container.clientWidth || 300;
            return { w, h };
        };

        const { w: initialWidth, h: initialHeight } = getInitialSize();

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#999999',
                fontSize: 10,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(240, 240, 240, 0.5)' },
                horzLines: { color: 'rgba(240, 240, 240, 0.5)' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: { labelBackgroundColor: '#111111' },
                horzLine: { labelBackgroundColor: '#111111' },
            },
            handleScale: { axisPressedMouseMove: true },
            handleScroll: { axisPressedMouseMove: true },
            width: initialWidth,
            height: initialHeight,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#20b26c',
            downColor: '#ef454a',
            borderVisible: false,
            wickUpColor: '#20b26c',
            wickDownColor: '#ef454a',
            priceFormat: {
                type: 'price',
                precision: pricePrecision,
                minMove: 1 / Math.pow(10, pricePrecision),
            },
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // Set initial data if available
        if (data && data.length > 0) {
            const seenTimes = new Set();
            const uniqueData = data.filter(d => {
                if (seenTimes.has(d.time)) return false;
                seenTimes.add(d.time);
                return true;
            }).sort((a, b) => a.time - b.time);
            candlestickSeries.setData(uniqueData);
        }

        const handleResize = () => {
            if (container && chartRef.current) {
                const newWidth = container.clientWidth;
                const newHeight = height || container.clientHeight;
                if (newWidth > 0 && newHeight > 0) {
                    chartRef.current.applyOptions({
                        width: newWidth,
                        height: newHeight
                    });
                }
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        // Immediate call to ensure it matches the container right after setup
        handleResize();

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data && data.length > 0) {
            // Filter invalid or duplicate times (lightweight-charts requirement)
            const seenTimes = new Set();
            const uniqueData = data.filter(d => {
                if (seenTimes.has(d.time)) return false;
                seenTimes.add(d.time);
                return true;
            }).sort((a, b) => a.time - b.time);

            seriesRef.current.setData(uniqueData);
        }
    }, [data]);

    return (
        <div ref={chartContainerRef} className="w-full h-full relative overflow-hidden" style={height ? { height: `${height}px` } : { height: '100%' }} />
    );
};

export default RealChart;
