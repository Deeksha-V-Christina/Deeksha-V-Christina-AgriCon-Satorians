import React from 'react';

interface AgriconLogoProps {
  className?: string;
  iconOnly?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
}

export const AgriconLogo: React.FC<AgriconLogoProps> = ({
  className = '',
  iconOnly = false,
  showText = true,
  size = 'md',
  textColor = 'text-[#012d1d]',
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  }[size];

  const textDimensions = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Agricon Dark Green Leaf Icon matching brand reference */}
      <div className={`${iconDimensions} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Main Solid Dark Green Leaf Body */}
          <path
            d="M20 80C18 52 35 22 82 18C86 64 56 82 20 80Z"
            fill="#012d1d"
          />
          {/* Inner Accent Leaf Curve */}
          <path
            d="M26 75C28 54 42 30 76 25C78 57 54 75 26 75Z"
            fill="#043d28"
          />
          {/* Central Leaf Vein Arc (White/Mint Clean Stroke) */}
          <path
            d="M22 78C36 68 52 52 74 24"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Subtle Side Veinlets */}
          <path
            d="M38 65C46 62 52 64 56 67"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M48 53C56 49 64 50 68 54"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </svg>
      </div>

      {!iconOnly && showText && (
        <span
          className={`font-extrabold tracking-tight ${textColor} ${textDimensions} font-sans leading-none flex items-center`}
          style={{ letterSpacing: '-0.02em' }}
        >
          Agricon
        </span>
      )}
    </div>
  );
};
