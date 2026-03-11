// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { MdLocalFireDepartment as Flame } from 'react-icons/md';

const AnimatedPlaceholder = ({ className = "" }) => {
    const { markets } = useExchangeStore();
    const [index, setIndex] = useState(0);

    const items = useMemo(() => {
        if (!markets || markets.length === 0) {
            return [
                "Search coin, contract, or pair",
                "BTC commonly searched",
                "🔥 Search coin, contract, or pair",
                "🔥 BTC commonly searched",
                "🔥 ETH new listing"
            ];
        }

        // frequently traded (by volume)
        const frequentlyTraded = markets.slice(0, 5).map(m => `🔥 ${m.symbol.replace('USDT', '')} frequently traded`);

        // new listing (reverse of markets)
        const newListing = markets.slice().reverse().slice(0, 3).map(m => `🔥 ${m.symbol.replace('USDT', '')} new listing`);

        // commonly searched (random pick from top 10-20 or something similar)
        const commonlySearched = markets.slice(5, 10).map(m => `🔥 ${m.symbol.replace('USDT', '')} commonly searched`);

        // Interleave them
        const combined = [];
        for (let i = 0; i < 3; i++) {
            if (frequentlyTraded[i]) combined.push(frequentlyTraded[i]);
            if (newListing[i]) combined.push(newListing[i]);
            if (commonlySearched[i]) combined.push(commonlySearched[i]);
        }

        return combined.length > 0 ? combined : ["Search coin, contract, or pair"];
    }, [markets]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [items]);

    return (
        <div className={`relative h-full w-full flex items-center overflow-hidden pointer-events-none ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center whitespace-nowrap text-[var(--text-tertiary)] text-sm font-medium"
                >
                    {items[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AnimatedPlaceholder;
