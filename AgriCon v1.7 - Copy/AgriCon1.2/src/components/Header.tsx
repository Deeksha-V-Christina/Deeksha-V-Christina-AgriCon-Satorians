import React from 'react';
import { AgriconLogo } from './AgriconLogo';
import { Menu, BookOpen, User } from 'lucide-react';
import { AuthUser } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { avatarUrlFor } from '../services/authStore';

interface HeaderProps {
  user: AuthUser;
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
  onOpenAppGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenDrawer,
  onOpenProfile,
  onOpenAppGuide,
}) => {
  const { t } = useLanguage();
  const avatarUrl = user.avatarUrl || avatarUrlFor(user.name);

  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#d8e8de] shadow-[0_2px_10px_rgba(45,106,79,0.05)]">
      <div className="h-16 max-w-xl mx-auto px-4 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu Trigger & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-2xl bg-[#eef7f2] hover:bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center transition-all active:scale-95 border border-[#d8e8de] shadow-sm cursor-pointer"
            aria-label="Open Navigation Menu"
            title="Navigation Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.3]" />
          </button>

          <AgriconLogo size="md" />
        </div>

        {/* Right: App Guide Launcher & Profile Button */}
        <div className="flex items-center gap-2">
          {/* How to Use / App Guide Launcher Button */}
          <button
            onClick={onOpenAppGuide}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#eef7f2] hover:bg-[#d8f3dc] text-[#1b4332] border border-[#a7e3b8] text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            title={t('common.appGuide')}
            aria-label={t('common.appGuide')}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span className="hidden xs:inline">{t('common.appGuide')}</span>
            <span className="xs:hidden">{t('common.guide')}</span>
          </button>

          {/* Farm Hub Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d8f3dc] border border-[#a7e3b8] text-[#1b4332] text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
            <span>{t('common.farmHub')}</span>
          </div>

          {/* Profile Avatar Button */}
          <button
            onClick={onOpenProfile}
            className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 transition-transform active:scale-95 flex items-center cursor-pointer"
            title={user.name}
            aria-label="Open Farm Profile and Settings"
          >
            {avatarUrl ? (
              <img
                alt={user.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-2 ring-[#a7e3b8] group-hover:ring-[#2d6a4f] transition-all"
                src={avatarUrl}
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center ring-2 ring-[#a7e3b8] group-hover:ring-[#2d6a4f] transition-all">
                <User className="w-4 h-4" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#2d6a4f] rounded-full ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
