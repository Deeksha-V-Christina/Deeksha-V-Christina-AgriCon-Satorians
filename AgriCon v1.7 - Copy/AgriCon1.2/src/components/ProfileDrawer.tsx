import React, { useState, useRef } from 'react';
import {
  X,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Check,
  ShieldCheck,
  Award,
  LogOut,
  Save,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ChevronRight,
  HelpCircle,
  PhoneCall,
  Languages,
  Camera,
  UploadCloud,
  FileCheck,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Language, AuthUser } from '../types';
import { LanguagePickerModal, SUPPORTED_LANGUAGES } from './LanguagePickerModal';
import { useLanguage } from '../i18n/LanguageContext';
import { avatarUrlFor } from '../services/authStore';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: AuthUser;
  onLogout: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  user,
  onLogout,
}) => {
  const { t } = useLanguage();

  // Farmer profile editable states — seeded from the logged-in session
  const [farmerName, setFarmerName] = useState(user.name);
  const [farmLocation, setFarmLocation] = useState(
    user.farmName ? `${user.farmName} • Sector 7G` : 'Sector 7G'
  );
  const [phoneNumber, setPhoneNumber] = useState(
    /^[+\d][\d\s-]{5,}$/.test(user.contact) ? user.contact : ''
  );
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || avatarUrlFor(user.name));

  // FPO Verification States
  const [isFpoVerified, setIsFpoVerified] = useState(true);
  const [certificateFileName, setCertificateFileName] = useState('FPO_NABARD_REG_2026.pdf');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certSuccessToast, setCertSuccessToast] = useState(false);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Save feedback state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setAvatarUrl(tempUrl);
    }
  };

  // Handle FPO Certificate Upload
  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingCert(true);
      setTimeout(() => {
        setIsUploadingCert(false);
        setCertificateFileName(file.name);
        setIsFpoVerified(true);
        setCertSuccessToast(true);
        setTimeout(() => setCertSuccessToast(false), 3500);
      }, 1000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordError('');
    if (newPassword) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 overflow-y-auto no-scrollbar text-[#191c1d] animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#d8e8de]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#d8f3dc] flex items-center justify-center text-[#1b4332] border border-[#a7e3b8]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#012d1d]">
                  {t('profile.title')}
                </h3>
                <p className="text-xs text-[#52796f]">{t('profile.subtitle')}</p>
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

          {/* Success Toast */}
          {saveSuccess && (
            <div className="mt-4 p-3.5 bg-[#d8f3dc] border border-[#a7e3b8] text-[#1b4332] rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
              <span>Profile preferences updated successfully!</span>
            </div>
          )}

          {/* Cert Success Toast */}
          {certSuccessToast && (
            <div className="mt-4 p-3.5 bg-[#d8f3dc] border border-[#a7e3b8] text-[#1b4332] rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-xs">
              <BadgeCheck className="w-4 h-4 text-[#2d6a4f]" />
              <span>FPO Certificate uploaded &amp; verified successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 mt-5">
            {/* ========================================================================= */}
            {/* REQUIREMENT 3: CIRCULAR PROFILE PICTURE WITH "EDIT PICTURE" OVERLAY */}
            {/* ========================================================================= */}
            <div className="flex items-center gap-4 p-4.5 bg-gradient-to-r from-[#e8f5ed] via-[#f0f9f3] to-[#e4f1e9] rounded-3xl border border-[#cbe4d4] relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Circular Avatar with Edit Picture Overlay */}
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <img
                  src={avatarUrl}
                  alt={farmerName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#a7e3b8] shadow-md transition-transform group-hover:scale-105"
                />
                
                {/* Tactile "Edit Picture" Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white drop-shadow-sm" />
                  <span className="text-[9px] font-extrabold uppercase tracking-tight text-white mt-0.5">
                    Edit
                  </span>
                </div>

                <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#2d6a4f] rounded-full ring-2 ring-white flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </span>
              </div>

              {/* Farmer Name & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-base text-[#012d1d] truncate">{farmerName}</h4>
                  <span className="bg-[#1b4332] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Sector 7G
                  </span>
                </div>
                <p className="text-xs text-[#52796f] mt-0.5 truncate">{farmLocation}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2d6a4f] bg-white/90 px-2 py-0.5 rounded-md border border-[#d8e8de]">
                    <ShieldCheck className="w-3 h-3 text-[#2d6a4f]" />
                    <span>FPO Member</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-[10px] font-bold text-[#2d6a4f] underline cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* REQUIREMENT 3: EDITABLE FARMER NAME & ACCOUNT DETAILS */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#012d1d] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2d6a4f]" />
                <span>Farmer Account Details</span>
              </span>

              {/* Farmer Name Editable Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#52796f]">Farmer Full Name</label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3.5 px-4 text-base font-extrabold text-[#012d1d] focus:outline-none transition-colors"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Farm Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#52796f]">Farm Plot &amp; Location</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3.5 px-4 text-sm font-bold text-[#012d1d] focus:outline-none transition-colors"
                  placeholder="e.g. Valley Farms, Sector 7G"
                  required
                />
              </div>

              {/* Registered Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#52796f]">Registered Mobile (SMS Alerts)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 px-4 text-sm font-bold text-[#012d1d] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* REQUIREMENT 3: VERIFICATION STATUS & UPLOAD FPO CERTIFICATE SECTION */}
            {/* ========================================================================= */}
            <div className="p-4.5 bg-[#f8faf8] rounded-3xl border border-[#d8e8de] flex flex-col gap-3.5 shadow-xs">
              <input
                ref={certInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleCertSelect}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#012d1d] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Verification Status</span>
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isFpoVerified
                      ? 'bg-[#d8f3dc] text-[#1b4332] border border-[#a7e3b8]'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{isFpoVerified ? 'FPO Verified' : 'Pending Verification'}</span>
                </span>
              </div>

              {/* Certificate Details */}
              <div className="p-3 bg-white rounded-2xl border border-[#d8e8de] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f5ed] flex items-center justify-center text-[#2d6a4f] shrink-0 border border-[#d8e8de]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#012d1d] truncate">
                      {certificateFileName}
                    </p>
                    <p className="text-[10px] text-[#52796f]">
                      NABARD / District FPO Registry • Active
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-md">
                    Validated
                  </span>
                </div>
              </div>

              {/* Prominent Upload FPO Certificate Button */}
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={isUploadingCert}
                className="w-full bg-white hover:bg-[#eef7f2] text-[#1b4332] border-2 border-dashed border-[#2d6a4f] rounded-2xl py-3 px-4 text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 text-[#2d6a4f] ${isUploadingCert ? 'animate-bounce' : ''}`} />
                <span>{isUploadingCert ? 'Uploading Certificate...' : 'Upload FPO Certificate'}</span>
              </button>
            </div>

            {/* Language Selector Trigger */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#012d1d] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#2d6a4f]" />
                  <span>App Language (ಭಾಷೆ / மொழி / भाषा)</span>
                </label>
                <span className="text-[10px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-full">
                  6 Languages
                </span>
              </div>

              <div
                onClick={() => setIsLanguageModalOpen(true)}
                className="p-4 bg-[#f8faf8] hover:bg-[#eef7f2] border-2 border-[#d8e8de] hover:border-[#2d6a4f] rounded-2xl flex items-center justify-between transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentLangObj.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#012d1d]">
                        {currentLangObj.nameNative}
                      </span>
                      <span className="text-xs text-[#52796f]">
                        ({currentLangObj.nameEn})
                      </span>
                    </div>
                    <span className="text-[11px] text-[#717973] block mt-0.5">
                      {currentLangObj.region}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d6a4f] group-hover:translate-x-1 transition-transform bg-white px-2.5 py-1.5 rounded-xl border border-[#d8e8de]">
                  <span>Change</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Update Section */}
            <div className="p-4 bg-[#f8faf8] rounded-3xl border border-[#d8e8de] flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#012d1d] flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Security &amp; Password</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#2d6a4f] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {passwordError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                  {passwordError}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-2.5 px-3.5 text-xs text-[#012d1d] focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password (min 6)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-2.5 px-3.5 text-xs text-[#012d1d] focus:outline-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-2.5 px-3.5 text-xs text-[#012d1d] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Save & Sign Out */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl py-3.5 px-5 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#d8f3dc]" />
                <span>{t('profile.save')}</span>
              </button>

              {/* Sign Out Button */}
              {!showLogoutConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl py-3 px-5 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('profile.signOut')}</span>
                </button>
              ) : (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col gap-2.5 animate-in fade-in">
                  <p className="text-xs font-bold text-red-900 text-center">
                    {t('profile.signOutConfirm')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      {t('profile.signOutYes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs border border-gray-300 cursor-pointer"
                    >
                      {t('profile.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Vertical Modal Language Picker */}
      <LanguagePickerModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={language}
        onSelectLanguage={onLanguageChange}
      />
    </>
  );
};
