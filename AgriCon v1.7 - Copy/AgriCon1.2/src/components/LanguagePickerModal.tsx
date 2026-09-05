import React from 'react';
import {
  X,
  Check,
  Globe,
  CheckCircle2,
  Languages,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';

interface LanguagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}

export interface LanguageOption {
  code: Language;
  nameEn: string;
  nameNative: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'EN',
    nameEn: 'English',
    nameNative: 'English',
    flag: '🌐',
    region: 'Global / Standard',
  },
  {
    code: 'TA',
    nameEn: 'Tamil',
    nameNative: 'தமிழ்',
    flag: '🌾',
    region: 'Tamil Nadu & Puducherry',
  },
  {
    code: 'TE',
    nameEn: 'Telugu',
    nameNative: 'తెలుగు',
    flag: '🌿',
    region: 'Andhra Pradesh & Telangana',
  },
  {
    code: 'KN',
    nameEn: 'Kannada',
    nameNative: 'ಕನ್ನಡ',
    flag: '🌱',
    region: 'Karnataka',
  },
  {
    code: 'ML',
    nameEn: 'Malayalam',
    nameNative: 'മലയാളം',
    flag: '🌴',
    region: 'Kerala',
  },
  {
    code: 'HI',
    nameEn: 'Hindi',
    nameNative: 'हिंदी',
    flag: '🇮🇳',
    region: 'Pan-India / North',
  },
];

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Bottom Sheet Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d8e8de] p-6 max-h-[85vh] overflow-y-auto no-scrollbar text-[#191c1d] animate-in slide-in-from-bottom duration-300 flex flex-col gap-4"
      >
        {/* Handle pill for mobile sheet drag */}
        <div className="w-12 h-1.5 bg-[#d8e8de] rounded-full mx-auto sm:hidden -mt-1 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d8e8de]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#d8f3dc] flex items-center justify-center text-[#1b4332] border border-[#a7e3b8]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#012d1d]">
                Select Preferred Language
              </h3>
              <p className="text-xs text-[#52796f]">
                ಭಾಷೆ / மொழி / భాష / ഭാഷ / भाषा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f3f9f5] hover:bg-[#e8f5ed] text-[#414844] flex items-center justify-center transition-colors border border-[#d8e8de] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#52796f] -mt-1">
          Choose your native language for crop disease diagnostics, drone flight analytics, and agronomic advisories:
        </p>

        {/* Vertical List of Languages */}
        <div className="flex flex-col gap-2.5 my-1">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#d8f3dc] border-[#2d6a4f] text-[#012d1d] font-bold shadow-xs ring-2 ring-[#a7e3b8]'
                    : 'bg-[#f8faf8] hover:bg-[#eef7f2] border-[#d8e8de] text-[#191c1d]'
                }`}
              >
                {/* Left: Flag & Native + English names */}
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#012d1d]">
                        {lang.nameNative}
                      </span>
                      <span className="text-xs text-[#52796f]">
                        ({lang.nameEn})
                      </span>
                    </div>
                    <span className="text-[11px] text-[#717973] block mt-0.5">
                      {lang.region}
                    </span>
                  </div>
                </div>

                {/* Right: Modern Circular Radio / Green Checkmark */}
                <div className="flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#a7b5ad] bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl py-3 font-bold text-xs shadow-md transition-colors active:scale-98 mt-1 cursor-pointer"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};
