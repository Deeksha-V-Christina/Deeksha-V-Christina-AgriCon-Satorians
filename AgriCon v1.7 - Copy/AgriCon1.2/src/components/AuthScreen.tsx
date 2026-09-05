import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sprout,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Leaf,
} from 'lucide-react';
import { AgriconLogo } from './AgriconLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from './LanguagePickerModal';
import { AuthUser } from '../types';
import { signUp, logIn, continueAsGuest } from '../services/authStore';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

type Mode = 'login' | 'signup';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const { language, setLanguage, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('login');

  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetErrorOnEdit = () => {
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && !name.trim()) {
      setError(t('auth.errorNameRequired'));
      return;
    }
    if (!contact.trim()) {
      setError(t('auth.errorContactRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Small delay so the transition doesn't feel instantaneous/fake on a real device.
    window.setTimeout(() => {
      const result =
        mode === 'signup'
          ? signUp({ name, contact, password, farmName })
          : logIn({ contact, password });

      setIsSubmitting(false);

      if ('error' in result) {
        setError(t(result.error));
        return;
      }
      onAuthenticated(result.user);
    }, 350);
  };

  const handleGuest = () => {
    onAuthenticated(continueAsGuest());
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-gradient-to-b from-[#f8faf8] via-[#eef6f1] to-[#e4f1e9] overflow-y-auto">
      <div className="w-full max-w-md mx-auto px-5 sm:px-6 py-8 flex flex-col gap-6 min-h-full">
        {/* Language quick-picker — never buried in settings, farmers pick it first */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                title={lang.nameEn}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-xs'
                    : 'bg-white/70 text-[#414844] border-[#d8e8de] hover:bg-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nameNative}</span>
              </button>
            );
          })}
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-[0_16px_32px_rgba(1,45,29,0.12)] border border-[#d3e5db] flex items-center justify-center p-3">
            <AgriconLogo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#012d1d] tracking-tight mt-2">Agricon</h1>
          <p className="text-xs font-semibold text-[#2c694e] leading-snug">
            {t('auth.brandTagline')}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1.5 bg-[#e8f0ea] p-1.5 rounded-2xl border border-[#d8e8de]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#012d1d] shadow-sm'
                : 'text-[#52796f] hover:text-[#012d1d]'
            }`}
          >
            {t('auth.loginButton')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#012d1d] shadow-sm'
                : 'text-[#52796f] hover:text-[#012d1d]'
            }`}
          >
            {t('auth.signupButton')}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#d8e8de] shadow-[0_10px_30px_rgba(45,106,79,0.08)] p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#012d1d]">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h2>
            <p className="text-xs text-[#52796f] mt-0.5">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="w-4 h-4 text-[#2d6a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    resetErrorOnEdit();
                  }}
                  placeholder={t('auth.fullName')}
                  className="w-full bg-[#f8faf8] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 pl-10 pr-3.5 text-sm text-[#012d1d] focus:outline-none"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="relative">
                <Sprout className="w-4 h-4 text-[#2d6a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder={t('auth.farmName')}
                  className="w-full bg-[#f8faf8] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 pl-10 pr-3.5 text-sm text-[#012d1d] focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-[#2d6a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  resetErrorOnEdit();
                }}
                placeholder={t('auth.phoneOrEmail')}
                className="w-full bg-[#f8faf8] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 pl-10 pr-3.5 text-sm text-[#012d1d] focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#2d6a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  resetErrorOnEdit();
                }}
                placeholder={t('auth.password')}
                className="w-full bg-[#f8faf8] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 pl-10 pr-10 text-sm text-[#012d1d] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52796f] cursor-pointer"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <Lock className="w-4 h-4 text-[#2d6a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    resetErrorOnEdit();
                  }}
                  placeholder={t('auth.confirmPassword')}
                  className="w-full bg-[#f8faf8] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 pl-10 pr-3.5 text-sm text-[#012d1d] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:opacity-70 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>{mode === 'login' ? t('auth.loginButton') : t('auth.signupButton')}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center text-xs text-[#52796f]">
            {mode === 'login' ? (
              <span>
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="font-bold text-[#2d6a4f] hover:text-[#012d1d] cursor-pointer"
                >
                  {t('auth.signupLink')}
                </button>
              </span>
            ) : (
              <span>
                {t('auth.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-bold text-[#2d6a4f] hover:text-[#012d1d] cursor-pointer"
                >
                  {t('auth.loginLink')}
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Guest mode */}
        <button
          type="button"
          onClick={handleGuest}
          className="mx-auto flex items-center gap-1.5 text-xs font-bold text-[#52796f] hover:text-[#012d1d] transition-colors cursor-pointer"
        >
          <Leaf className="w-3.5 h-3.5 text-[#2d6a4f]" />
          <span>{t('auth.continueAsGuest')}</span>
        </button>

        <div className="mt-auto flex items-center justify-center gap-1.5 text-[10px] text-[#717973] pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f]" />
          <span>Agricon Precision Farming OS</span>
        </div>
      </div>
    </div>
  );
};
