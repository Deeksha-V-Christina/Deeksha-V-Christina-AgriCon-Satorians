import React, { useEffect, useState } from 'react';
import { AgriconLogo } from './AgriconLogo';
import { Sparkles, ShieldCheck, Sprout } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Animate progress bar smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 45);

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onFinish();
      }, 400);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#f8faf8] via-[#eef6f1] to-[#e4f1e9] px-6 py-12 select-none transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105 transition-transform duration-300' : 'opacity-100'
      }`}
    >
      {/* Top spacer */}
      <div className="w-full max-w-sm h-8" />

      {/* Center Branding Showcase */}
      <div className="flex flex-col items-center text-center gap-6 my-auto">
        {/* Animated Leaf Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing Aura Rings */}
          <div className="absolute w-36 h-36 rounded-full bg-[#a0f4c8]/40 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute w-28 h-28 rounded-full bg-[#c1ecd4]/60 animate-pulse pointer-events-none" />
          
          <div className="relative w-24 h-24 rounded-3xl bg-white shadow-[0_20px_40px_rgba(1,45,29,0.12)] border border-[#d3e5db] flex items-center justify-center p-3.5 transition-transform hover:scale-105">
            <AgriconLogo size="xl" showText={false} />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex flex-col items-center gap-2.5 max-w-xs">
          <h1 className="text-4xl font-extrabold text-[#012d1d] tracking-tight font-sans">
            Agricon
          </h1>
          <p className="text-sm font-semibold text-[#2c694e] leading-snug tracking-wide">
            {t('splash.tagline')}
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 mt-2">
          <span className="px-3 py-1 rounded-full bg-white/80 border border-[#c1ecd4] text-[11px] font-bold text-[#012d1d] shadow-sm flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-[#2c694e]" />
            <span>Precision Agronomy</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-[#c1ecd4] text-[11px] font-bold text-[#012d1d] shadow-sm flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2c694e]" />
            <span>AI Diagnostics</span>
          </span>
        </div>
      </div>

      {/* Bottom Progress Indicator */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <div className="w-full bg-[#d8e6de] h-1.5 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-[#012d1d] h-full rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-[11px] text-[#717973] font-medium px-1">
          <span>{t('splash.loading')}</span>
          <span className="font-bold text-[#012d1d] font-mono">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
