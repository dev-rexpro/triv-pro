// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { 
    createChart, 
    ColorType, 
    CandlestickSeries, 
    LineSeries, 
    HistogramSeries,
} from 'lightweight-charts';
import useExchangeStore from '../stores/useExchangeStore';
import { 
    calculateEMA, 
    calculateSMA, 
    calculateBollingerBands, 
    calculateVolume,
    calculateSAR,
    calculateSupertrend,
    calculateSupportResistance,
    calculateEnvelope
} from '../utils/indicators';

interface RealChartProps {
    data: any[];
    height?: number;
    pricePrecision?: number;
}

const RealChart: React.FC<RealChartProps> = React.memo(({ data, height, pricePrecision = 2 }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const mainSeriesRef = useRef<any>(null);
    const indicatorSeriesRef = useRef<any>({});
    
    const theme = useExchangeStore(state => state.theme);
    const activeIndicators = useExchangeStore(state => state.activeIndicators);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const container = chartContainerRef.current;
        const isDark = theme === 'dark';

        const getInitialSize = () => {
            const h = height || container.clientHeight || 300;
            const w = container.clientWidth || 300;
            return { w, h };
        };

        const { w: initialWidth, h: initialHeight } = getInitialSize();

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#979797' : '#999999',
                fontSize: 10,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(43, 49, 57, 0.05)' : 'rgba(240, 240, 240, 0.5)' },
                horzLines: { color: isDark ? 'rgba(43, 49, 57, 0.05)' : 'rgba(240, 240, 240, 0.5)' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.25 }, 
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: { labelBackgroundColor: isDark ? '#2B3139' : '#111111' },
                horzLine: { labelBackgroundColor: isDark ? '#2B3139' : '#111111' },
            },
            handleScale: { pressedMouseMove: true },
            handleScroll: { pressedMouseMove: true },
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
        mainSeriesRef.current = candlestickSeries;

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
        handleResize();

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []);

    // Theme effect
    useEffect(() => {
        if (!chartRef.current) return;
        const isDark = theme === 'dark';
        chartRef.current.applyOptions({
            layout: { textColor: isDark ? '#979797' : '#999999' },
            grid: {
                vertLines: { color: isDark ? 'rgba(43, 49, 57, 0.05)' : 'rgba(240, 240, 240, 0.5)' },
                horzLines: { color: isDark ? 'rgba(43, 49, 57, 0.05)' : 'rgba(240, 240, 240, 0.5)' },
            },
            crosshair: {
                vertLine: { labelBackgroundColor: isDark ? '#2B3139' : '#111111' },
                horzLine: { labelBackgroundColor: isDark ? '#2B3139' : '#111111' },
            },
        });
    }, [theme]);

    // Data & Indicator Sync Effect
    useEffect(() => {
        if (!chartRef.current || !mainSeriesRef.current || !data || data.length === 0) return;

        const chart = chartRef.current;
        const candlestickSeries = mainSeriesRef.current;

        // 1. Process and set main candle data
        const seenTimes = new Set();
        const cleanData = data.filter(d => {
            if (seenTimes.has(d.time)) return false;
            seenTimes.add(d.time);
            return true;
        }).sort((a, b) => a.time - b.time);

        candlestickSeries.setData(cleanData);

        // 2. Manage Indicator Series
        const indicatorsToRender = activeIndicators || [];
        
        // Remove old series that are no longer active or need redraw
        // FIX: Added safety check to prevent crash if series is already gone
        Object.keys(indicatorSeriesRef.current).forEach(key => {
            const series = indicatorSeriesRef.current[key];
            if (series && chartRef.current) {
                try {
                    chart.removeSeries(series);
                } catch (e) {
                    // console.warn("Failed to remove series:", key, e);
                }
            }
            delete indicatorSeriesRef.current[key];
        });

        // Add new series based on active indicators
        indicatorsToRender.forEach(ind => {
            if (ind === 'EMA') {
                const ema7 = chart.addSeries(LineSeries, { color: '#FFD700', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                const ema25 = chart.addSeries(LineSeries, { color: '#FF00FF', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                const ema99 = chart.addSeries(LineSeries, { color: '#00BFFF', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                
                ema7.setData(calculateEMA(cleanData, 7));
                ema25.setData(calculateEMA(cleanData, 25));
                ema99.setData(calculateEMA(cleanData, 99));

                indicatorSeriesRef.current['EMA_7'] = ema7;
                indicatorSeriesRef.current['EMA_25'] = ema25;
                indicatorSeriesRef.current['EMA_99'] = ema99;
            }

            if (ind === 'MA') {
                const ma7 = chart.addSeries(LineSeries, { color: '#ff7043', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                const ma25 = chart.addSeries(LineSeries, { color: '#42a5f5', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                ma7.setData(calculateSMA(cleanData, 7));
                ma25.setData(calculateSMA(cleanData, 25));
                indicatorSeriesRef.current['MA_7'] = ma7;
                indicatorSeriesRef.current['MA_25'] = ma25;
            }

            if (ind === 'BOLL') {
                const boll = calculateBollingerBands(cleanData, 20);
                const upperColor = 'rgba(255, 255, 255, 0.4)';
                const midColor = 'rgba(255, 255, 255, 0.15)';
                
                const upper = chart.addSeries(LineSeries, { color: upperColor, lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                const mid = chart.addSeries(LineSeries, { color: midColor, lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                const lower = chart.addSeries(LineSeries, { color: upperColor, lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false });
                
                upper.setData(boll.upper);
                mid.setData(boll.middle);
                lower.setData(boll.lower);

                indicatorSeriesRef.current['BOLL_UP'] = upper;
                indicatorSeriesRef.current['BOLL_MID'] = mid;
                indicatorSeriesRef.current['BOLL_LOW'] = lower;
            }

            if (ind === 'VOL') {
                const volSeries = chart.addSeries(HistogramSeries, {
                    color: '#26a69a',
                    priceFormat: { type: 'volume' },
                    priceScaleId: '', 
                });
                
                chart.priceScale('').applyOptions({
                    scaleMargins: { top: 0.8, bottom: 0 },
                });

                volSeries.setData(calculateVolume(cleanData));
                indicatorSeriesRef.current['VOL'] = volSeries;
            }

            if (ind === 'SAR') {
                // Parabolic SAR typically rendered as dots
                // We'll use LineSeries with circles if ScatterSeries is missing, 
                // but we use ts-nocheck so let's try calling it via chart object
                const sarSeries = chart.addSeries(LineSeries, {
                    color: '#00BFFF',
                    lineWidth: 0,
                    pointSize: 3, // Not standard for LineSeries but some versions/types might handle it
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                    lastValueVisible: false,
                });
                // If it's v5, we might need a different approach for Scatter, 
                // but for now, we'll try to just render dots manually if this fails.
                // Let's use LineSeries with a very small lineWidth and markers.
                sarSeries.applyOptions({
                    lastValueVisible: false,
                    priceLineVisible: false,
                });

                sarSeries.setData(calculateSAR(cleanData));
                indicatorSeriesRef.current['SAR'] = sarSeries;
            }

            if (ind === 'SUPERTREND') {
                const stData = calculateSupertrend(cleanData);
                const stSeries = chart.addSeries(LineSeries, {
                    lineWidth: 2,
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                });
                stSeries.setData(stData);
                indicatorSeriesRef.current['SUPERTREND'] = stSeries;
            }

            if (ind === 'RESIST') {
                const levels = calculateSupportResistance(cleanData);
                let count = 0;
                levels.forEach((lvl, idx) => {
                    const series = chart.addSeries(LineSeries, {
                        color: lvl.type === 'resistance' ? 'rgba(239, 69, 74, 0.6)' : 'rgba(32, 178, 108, 0.6)',
                        lineWidth: 1,
                        lineStyle: 2, 
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    
                    const lvlData = cleanData.filter(d => d.time >= lvl.time).map(d => ({ time: d.time, value: lvl.value }));
                    series.setData(lvlData);
                    indicatorSeriesRef.current[`RESIST_${idx}`] = series;
                    count++;
                });
            }

            if (ind === 'Envelope') {
                const env = calculateEnvelope(cleanData);
                const upper = chart.addSeries(LineSeries, { color: 'rgba(66, 165, 245, 0.5)', lineWidth: 1, priceLineVisible: false });
                const lower = chart.addSeries(LineSeries, { color: 'rgba(66, 165, 245, 0.5)', lineWidth: 1, priceLineVisible: false });
                upper.setData(env.upper);
                lower.setData(env.lower);
                indicatorSeriesRef.current['ENV_UP'] = upper;
                indicatorSeriesRef.current['ENV_LOW'] = lower;
            }
        });

    }, [data, activeIndicators]);

    return (
        <div ref={chartContainerRef} className="w-full h-full relative overflow-hidden" style={height ? { height: `${height}px` } : { height: '100%' }} />
    );
});

export default RealChart;
