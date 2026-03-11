import React, { useMemo } from 'react';

interface PnLChartProps {
    data: number[];
    color?: string;
    height?: number;
    width?: number;
    showDots?: boolean;
    minLabel?: string;
    maxLabel?: string;
}

export const PnLChart: React.FC<PnLChartProps> = ({
    data,
    color = "#0ECB81",
    height = 150,
    width = 320,
    showDots = true,
    minLabel,
    maxLabel
}) => {
    const points = useMemo(() => {
        if (!data || data.length < 2) return [];
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        const paddingY = height * 0.15; // 15% padding top and bottom
        const chartHeight = height - (paddingY * 2);

        return data.map((val, i) => ({
            x: (i / (data.length - 1)) * width,
            y: height - paddingY - ((val - min) / range) * chartHeight,
            val
        }));
    }, [data, width, height]);

    const maxPoint = useMemo(() => points.length ? [...points].sort((a, b) => b.val - a.val)[0] : null, [points]);
    const minPoint = useMemo(() => points.length ? [...points].sort((a, b) => a.val - b.val)[0] : null, [points]);

    const linePath = useMemo(() => {
        if (points.length === 0) return '';
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }, [points]);

    const areaPath = useMemo(() => {
        if (!linePath) return '';
        return `${linePath} L ${width} ${height} L 0 ${height} Z`;
    }, [linePath, width, height]);

    // useMemo with empty dependency array keeps the ID stable across re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const id = useMemo(() => Math.random().toString(36).substring(2, 11), []);
    const gradientId = `grad-${id}`;
    const patternId = `dot-${id}`;
    const filterId = `glow-${id}`;

    if (!data || data.length < 2) {
        return <div style={{ width, height }} className="flex items-center justify-center text-[var(--text-tertiary)] text-xs italic">Insufficient data</div>;
    }

    return (
        <div className="relative" style={{ width, height }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    <pattern id={patternId} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="0.8" fill={color} fillOpacity="0.4" />
                    </pattern>

                    <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {showDots && <path d={areaPath} fill={`url(#${patternId})`} />}
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${filterId})`}
                />

                {/* Min/Max Labels */}
                {maxLabel && maxPoint && (
                    <text x={maxPoint.x} y={maxPoint.y - 12} fill="#94a3b8" fontSize="13" fontWeight="500" textAnchor={maxPoint.x > width * 0.8 ? 'end' : maxPoint.x < width * 0.2 ? 'start' : 'middle'}>{maxLabel}</text>
                )}
                {minLabel && minPoint && (
                    <text x={minPoint.x} y={minPoint.y + 20} fill="#94a3b8" fontSize="13" fontWeight="500" textAnchor={minPoint.x > width * 0.8 ? 'end' : minPoint.x < width * 0.2 ? 'start' : 'middle'}>{minLabel}</text>
                )}
            </svg>
        </div>
    );
};
