import React, { useState, useEffect } from 'react';
import { NavigationTab, AuthUser } from './types';
import { FarmToolId } from './data/farmTools';
import { useLanguage } from './i18n/LanguageContext';
import { getSession, clearSession } from './services/authStore';

import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { HomeView } from './components/HomeView';
import { ToolsView } from './components/ToolsView';

import { AgriBotModal } from './components/AgriBotModal';
import { CropDiagnosisModal } from './components/CropDiagnosisModal';
import { TelemetryModal } from './components/TelemetryModal';
import { ConditionsModal } from './components/ConditionsModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { ConsultExpertModal } from './components/ConsultExpertModal';
import { EveRobotIcon } from './components/EveRobotIcon';
import { FieldDiagnosticReportModal } from './components/FieldDiagnosticReportModal';
import { AppGuideModal } from './components/AppGuideModal';

export default function App() {
  const { language, setLanguage } = useLanguage();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Auth State — see src/services/authStore.ts for how sessions are persisted
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getSession());

  // Navigation State — just Home, plus the internal Farm Tools route used when a
  // Home quick-tool card is tapped. Crop Doctor and Community have been removed,
  // and there's no bottom tab bar anymore, so this is deliberately small.
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Which Farm Tools sub-calculator to jump straight into when a Home quick-tool
  // card is tapped (null = show the Farm Tools grid instead).
  const [pendingToolView, setPendingToolView] = useState<Exclude<FarmToolId, 'diagnosis'> | null>(
    null
  );

  // Modal / Drawer States
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);
  const [isFieldReportOpen, setIsFieldReportOpen] = useState(false);
  const [isAppGuideOpen, setIsAppGuideOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isConditionsOpen, setIsConditionsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);

  // Active modal detection to hide floating elements
  const isAnyModalOpen =
    isBotOpen ||
    isDrawerOpen ||
    isConditionsOpen ||
    isDiagnosisOpen ||
    isTelemetryOpen ||
    isConsultOpen ||
    isFieldReportOpen ||
    isProfileOpen ||
    isAppGuideOpen;

  // Input focus detection to prevent floating FAB from blocking mobile keyboard & inputs
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Drawer navigation always shows the Farm Tools grid (not a sub-calculator
  // left open from a Home quick-tool tap).
  const handleSelectTab = (tab: NavigationTab) => {
    if (tab !== 'tools' || activeTab !== 'tools') {
      setPendingToolView(null);
    }
    setActiveTab(tab);
  };

  // A Home quick-tool card jumps straight into that calculator's sub-view.
  const handleOpenTool = (toolId: FarmToolId) => {
    if (toolId === 'diagnosis') {
      setIsDiagnosisOpen(true);
      return;
    }
    setPendingToolView(toolId);
    setActiveTab('tools');
  };

  const handleLogout = () => {
    clearSession();
    setAuthUser(null);
    setActiveTab('home');
    setIsProfileOpen(false);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f8f4] text-[#191c1d] flex flex-col selection:bg-[#a7e3b8] selection:text-[#012d1d] overflow-x-hidden w-full relative">
      {/* Initial Animated Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Login / Sign Up gate — shown once the splash finishes if no session exists */}
      {!showSplash && !authUser && (
        <AuthScreen onAuthenticated={(user) => setAuthUser(user)} />
      )}

      {!showSplash && authUser && (
        <>
          {/* Top Fixed Header with Hamburger Trigger */}
          <Header
            user={authUser}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenAppGuide={() => setIsAppGuideOpen(true)}
          />

          {/* Sliding Navigation Sidebar Drawer */}
          <NavigationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenHelpCenter={() => setIsConsultOpen(true)}
            user={authUser}
          />

          {/* Main Viewport Container */}
          <main className="flex-1 w-full flex flex-col overflow-x-hidden">
            {activeTab === 'home' && (
              <HomeView
                onOpenTelemetryDetails={() => setIsTelemetryOpen(true)}
                onOpenConditionsModal={() => setIsConditionsOpen(true)}
                onOpenDiagnosticTool={() => setIsDiagnosisOpen(true)}
                onOpenFieldReport={() => setIsFieldReportOpen(true)}
                onOpenTool={handleOpenTool}
              />
            )}

            {activeTab === 'tools' && (
              <ToolsView
                initialSubView={pendingToolView}
                onOpenCropDiagnosis={() => setIsDiagnosisOpen(true)}
                onBack={() => handleSelectTab('home')}
                onOpenQuickTool={(toolName) => {
                  if (toolName.includes('Pest') || toolName.includes('Soil')) {
                    setIsDiagnosisOpen(true);
                  } else if (toolName.includes('Irrigation')) {
                    setIsConditionsOpen(true);
                  }
                }}
              />
            )}
          </main>

          {/* Floating AI Assistant Mascot FAB (AgriBot spherical robot matching screen.png) */}
          {!isAnyModalOpen && (
            <button
              id="floating-eve-fab"
              onClick={() => setIsBotOpen(true)}
              className={`fixed z-30 transition-all duration-300 active:scale-95 group cursor-pointer print:hidden ${
                isInputFocused
                  ? 'opacity-0 pointer-events-none translate-y-12 sm:opacity-100 sm:pointer-events-auto sm:translate-y-0'
                  : 'opacity-100 pointer-events-auto translate-y-0'
              } bg-gradient-to-br from-[#1b4332] via-[#24523e] to-[#012d1d] hover:brightness-110 text-white rounded-full shadow-[0_10px_25px_rgba(27,67,50,0.32)] flex items-center justify-center ring-4 ring-[#d8f3dc] w-13 h-13 sm:w-16 sm:h-16 bottom-4 right-3 sm:bottom-6 sm:right-6`}
              title="Ask AgriBot AI Agronomist"
              aria-label="Open AI Agronomist Assistant"
            >
              <div className="relative flex items-center justify-center w-full h-full p-1.5 sm:p-2">
                {/* Subtle pulse aura */}
                <div className="absolute inset-0 rounded-full bg-[#a7e3b8] opacity-25 animate-ping pointer-events-none" />

                {/* Spherical Mascot Icon Container with object-contain */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#081f15] flex items-center justify-center p-0.5 overflow-hidden shadow-inner border border-[#38bdf8]/40">
                  <EveRobotIcon className="w-full h-full object-contain" />
                </div>

                {/* Online status indicator badge */}
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-cyan-400 border-2 border-[#1b4332]" />
                </span>
              </div>
            </button>
          )}

          {/* Interactive Modals */}
          <AgriBotModal isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />

          <CropDiagnosisModal
            isOpen={isDiagnosisOpen}
            onClose={() => setIsDiagnosisOpen(false)}
          />

          <TelemetryModal
            isOpen={isTelemetryOpen}
            onClose={() => setIsTelemetryOpen(false)}
          />

          <ConditionsModal
            isOpen={isConditionsOpen}
            onClose={() => setIsConditionsOpen(false)}
          />

          <ProfileDrawer
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            language={language}
            onLanguageChange={setLanguage}
            user={authUser}
            onLogout={handleLogout}
          />

          <ConsultExpertModal
            isOpen={isConsultOpen}
            onClose={() => setIsConsultOpen(false)}
          />

          <FieldDiagnosticReportModal
            isOpen={isFieldReportOpen}
            onClose={() => setIsFieldReportOpen(false)}
          />

          <AppGuideModal
            isOpen={isAppGuideOpen}
            onClose={() => setIsAppGuideOpen(false)}
            onNavigateToTab={(tab) => {
              if (tab === 'home' || tab === 'tools') {
                setActiveTab(tab);
              }
              setIsAppGuideOpen(false);
            }}
            onOpenAgriBot={() => {
              setIsAppGuideOpen(false);
              setIsBotOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
}
