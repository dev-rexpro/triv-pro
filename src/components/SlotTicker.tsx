import React, { memo, useMemo, useState, useEffect, useRef } from 'react';

interface DigitProps {
    char: string;
}

const Digit = memo(({ char }: DigitProps) => {
    const isNumber = !isNaN(parseInt(char));
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    if (!isNumber) {
        return <span className="inline-block">{char}</span>;
    }

    return (
        <span className="relative inline-block h-[1em] overflow-hidden w-[0.6em] text-center">
            <div
                className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.55,1)]"
                style={{ transform: `translateY(-${parseInt(char) * 10}%)` }}
            >
                {numbers.map((num) => (
                    <span key={num} className="h-[1em] flex items-center justify-center">
                        {num}
                    </span>
                ))}
            </div>
        </span>
    );
});

interface SlotTickerProps {
    value: string | number;
    className?: string;
    decimals?: number;
    prefix?: string;
    intervalMs?: number;
}

export const SlotTicker: React.FC<SlotTickerProps> = ({
    value,
    className = "",
    decimals = 2,
    prefix = "",
    intervalMs = 5000
}) => {
    const [displayValue, setDisplayValue] = useState(value);
    const valueRef = useRef(value);

    // Update displayValue immediately when value prop changes
    useEffect(() => {
        setDisplayValue(value);
        valueRef.current = value;
    }, [value]);

    const formatted = useMemo(() => {
        return parseFloat(displayValue.toString()).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }, [displayValue, decimals]);

    const chars = formatted.split('');

    return (
        <div className={`inline-flex items-center tabular-nums leading-none overflow-hidden ${className}`}>
            {prefix && <span className="inline-block mr-[0.1em]">{prefix}</span>}
            {chars.map((char, index) => (
                <Digit key={index} char={char} />
            ))}
        </div>
    );
};
