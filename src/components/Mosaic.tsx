import React from 'react';

interface MosaicProps {
  color?: string | string[];
  size?: 'tiny' | 'extraSmall' | 'small' | 'base' | 'medium' | 'large';
}

const Mosaic: React.FC<MosaicProps> = ({ color, size = 'medium' }) => {
  const sizeMap = {
    tiny: { dot: 'w-1 h-1', gap: 'gap-0.5' },
    extraSmall: { dot: 'w-1.5 h-1.5', gap: 'gap-0.5' },
    small: { dot: 'w-3 h-3', gap: 'gap-0.5' },
    base: { dot: 'w-5 h-5', gap: 'gap-1' },
    medium: { dot: 'w-8 h-8', gap: 'gap-1' },
    large: { dot: 'w-12 h-12', gap: 'gap-1.5' },
  };
  const currentSize = sizeMap[size] || sizeMap.medium;

  const getColor = (index: number) => {
    if (Array.isArray(color)) return color[index % color.length];
    return color || '#3884c6'; // Default to a blue hex if not provided
  };

  const dots = Array.from({ length: 9 });
  const delays = ['0.2s', '0.3s', '0.4s', '0.1s', '0.2s', '0.3s', '0s', '0.1s', '0.2s'];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`grid grid-cols-3 ${currentSize.gap}`}>
        {dots.map((_, i) => (
          <div
            key={i}
            className={`${currentSize.dot}`}
            style={{
              backgroundColor: getColor(i),
              animation: 'mosaic-scale 1.3s infinite ease-in-out',
              animationDelay: delays[i]
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes mosaic-scale {
          0%, 70%, 100% { transform: scale3D(1, 1, 1); }
          35% { transform: scale3D(0, 0, 1); }
        }
      `}</style>
    </div>
  );
};

export default Mosaic;
