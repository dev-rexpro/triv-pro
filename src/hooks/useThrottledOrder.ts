import React, { useState, useEffect, useRef } from 'react';

export function useThrottledOrder(
    sourceList: string[],
    isInteracting: React.MutableRefObject<boolean>,
    resetDeps: any[] = [],
    throttleMs: number = 30000
) {
    const [stableList, setStableList] = useState<string[]>([]);
    const latestList = useRef<string[]>([]);
    const [prevDepsStr, setPrevDepsStr] = useState('');

    useEffect(() => {
        latestList.current = sourceList;
        // Initial set
        if (stableList.length === 0 && sourceList.length > 0) {
            setStableList(sourceList);
        }
    }, [sourceList]);

    useEffect(() => {
        const curDepsStr = JSON.stringify(resetDeps);
        if (curDepsStr !== prevDepsStr) {
            setStableList(latestList.current);
            setPrevDepsStr(curDepsStr);
        }
    }, [resetDeps, prevDepsStr]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isInteracting.current) {
                setStableList(latestList.current);
            }
        }, throttleMs);
        return () => clearInterval(timer);
    }, [throttleMs, isInteracting]);

    return stableList;
}
