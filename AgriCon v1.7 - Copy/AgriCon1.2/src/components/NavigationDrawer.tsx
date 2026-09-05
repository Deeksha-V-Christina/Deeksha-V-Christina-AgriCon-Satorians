import React, { useEffect, useRef } from 'react';
import {
  X,
  Home,
  Wrench,
  HelpCircle,
  Globe,
  ChevronRight,
  FlaskConical,
  Droplets,
  Scale,
} from 'lucide-react';
import { NavigationTab, AuthUser } from '../types';
import { AgriconLogo } from './AgriconLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { avatarUrlFor } from '../services/authStore';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenProfile: () => void;
  onOpenHelpCenter: () => void;
  user: AuthUser;
}

const LANGUAGE_NAMES: Record<string, string> = {
  EN: 'English',
  TA: 'தமிழ்',
  KN: 'ಕನ್ನಡ',
  TE: 'తెలుగు',
  ML: 'മലയാളം',
  HI: 'हिंदी',
};

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenHelpCenter,
  user,
}) => {
  const { language, t } = useLanguage();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Keyboard escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch swipe to close (swipe left)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartXRef.current - touchEndX;
      // If swiped left by more than 50px, close drawer
      if (diffX > 50) {
        onClose();
      }
      touchStartXRef.current = null;
    }
  };

  if (!isOpen) return null;

  const avatarUrl = user.avatarUrl || avatarUrlFor(user.name);

  const navMenuItems = [
    {
      id: 'home' as NavigationTab,
      label: t('drawer.homeLabel'),
      subtitle: t('drawer.homeSub'),
      icon: Home,
      action: () => {
        onSelectTab('home');
        onClose();
      },
    },
    {
      id: 'tools' as NavigationTab,
      label: t('drawer.toolsLabel'),
      subtitle: t('drawer.toolsSub'),
      icon: Wrench,
      action: () => {
        onSelectTab('tools');
        onClose();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-start bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
        className="fixed top-3 bottom-3 left-3 sm:top-4 sm:bottom-4 sm:left-4 z-50 w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(27,67,50,0.22)] border border-white/80 flex flex-col p-5 sm:p-6 overflow-y-auto no-scrollbar text-[#191c1d] animate-in slide-in-from-left duration-300"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#d8e8de]">
          <div className="flex items-center gap-3">
            <AgriconLogo />
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-full self-start">
                {t('drawer.farmOS')}
              </span>
              <span className="text-xs text-[#52796f] mt-0.5">{t('drawer.sectorActive')}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-[#f2f8f4] hover:bg-[#d8f3dc] text-[#2d6a4f] flex items-center justify-center transition-all active:scale-95 border border-[#d8e8de] cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5 stroke-[2.2px]" />
          </button>
        </div>

        {/* Farmer Profile Quick Card */}
        <div
          onClick={() => {
            onOpenProfile();
            onClose();
          }}
          className="mt-4 p-3.5 bg-gradient-to-r from-[#e8f5ed] to-[#f0f9f3] rounded-2xl border border-[#cbe4d4] flex items-center justify-between group cursor-pointer hover:border-[#2d6a4f] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a7e3b8]"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#2d6a4f] rounded-full ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-[#012d1d]">{user.name}</h4>
                {!user.isGuest && (
                  <span className="bg-[#1b4332] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#52796f] truncate">
                {user.farmName || t('drawer.sectorActive')}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-[#2d6a4f] group-hover:translate-x-0.5 transition-transform border border-[#d8e8de]">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex flex-col gap-1.5 mt-5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52796f] px-2 mb-1">
            {t('drawer.section')}
          </span>

          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#d8f3dc] text-[#012d1d] font-bold border border-[#a7e3b8] shadow-xs'
                    : 'text-[#414844] hover:bg-[#f2f8f4] hover:text-[#012d1d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isActive
                        ? 'bg-[#2d6a4f] text-white'
                        : 'bg-[#f2f8f4] text-[#2d6a4f] border border-[#d8e8de]'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-extrabold block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[#52796f] font-normal leading-tight">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-[#2d6a4f] translate-x-0.5' : 'text-[#a7b5ad]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Quick Launch Tools Row */}
        <div className="mt-5 p-3.5 bg-[#f8faf8] rounded-2xl border border-[#d8e8de] flex flex-col gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52796f]">
            {t('drawer.quickCalculators')}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                onSelectTab('tools');
                onClose();
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#d8f3dc] border border-[#d8e8de] text-center flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-[#2d6a4f]" />
              <span className="text-[10px] font-bold text-[#012d1d]">{t('drawer.npkDose')}</span>
            </button>
            <button
              onClick={() => {
                onSelectTab('tools');
                onClose();
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#d8f3dc] border border-[#d8e8de] text-center flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Droplets className="w-4 h-4 text-[#2d6a4f]" />
              <span className="text-[10px] font-bold text-[#012d1d]">{t('drawer.sprayTank')}</span>
            </button>
            <button
              onClick={() => {
                onSelectTab('tools');
                onClose();
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#d8f3dc] border border-[#d8e8de] text-center flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4 text-[#2d6a4f]" />
              <span className="text-[10px] font-bold text-[#012d1d]">{t('drawer.yieldEst')}</span>
            </button>
          </div>
        </div>

        {/* Footer Settings & Language shortcut */}
        <div className="mt-auto pt-4 border-t border-[#d8e8de] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                onOpenProfile();
                onClose();
              }}
              className="flex items-center gap-2 text-xs font-bold text-[#2d6a4f] hover:text-[#012d1d] transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{t('common.language')}: {LANGUAGE_NAMES[language] || 'English'}</span>
            </button>

            <button
              onClick={() => {
                onOpenHelpCenter();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#52796f] hover:text-[#012d1d] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#2d6a4f]" />
              <span>{t('drawer.helpline')}</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-[#717973] mt-1">
            Agricon Precision Farming OS v2.4 • Plantix-Architecture
          </p>
        </div>
      </div>
    </div>
  );
};
