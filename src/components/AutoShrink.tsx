import React, { useLayoutEffect, useRef, useState } from 'react';

interface AutoShrinkProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * A wrapper component that automatically reduces font-size 
 * if its content exceeds the container width.
 */
export const AutoShrink: React.FC<AutoShrinkProps> = ({
    children,
    className = ""
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const resize = () => {
            // Reset to 100% for natural measurement
            content.style.fontSize = '100% ';
            content.style.display = 'inline-block';
            content.style.width = 'auto';

            const containerWidth = container.clientWidth;
            const contentWidth = content.scrollWidth;

            if (contentWidth > containerWidth && containerWidth > 0) {
                // Safety buffer to avoid edge clipping (0.97)
                const newScale = (containerWidth / contentWidth) * 0.97;
                setScale(newScale);
            } else {
                setScale(1);
            }
        };

        const observer = new ResizeObserver(() => {
            // Use requestAnimationFrame to avoid cycle errors in ResizeObserver
            requestAnimationFrame(resize);
        });

        observer.observe(container);
        observer.observe(content);

        resize();

        return () => observer.disconnect();
    }, [children]);

    return (
        <div
            ref={containerRef}
            className="w-full overflow-hidden"
        >
            <div
                ref={contentRef}
                className={`whitespace-nowrap inline-block origin-left ${className}`}
                style={{ fontSize: `${scale * 100}%` }}
            >
                {children}
            </div>
        </div>
    );
};
