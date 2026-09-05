import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { FertilizerCalculatorSubView } from './FertilizerCalculatorSubView';
import { PesticideCalculatorSubView } from './PesticideCalculatorSubView';
import { YieldEstimatorSubView } from './YieldEstimatorSubView';
import { FARM_TOOLS, FarmToolId } from '../data/farmTools';
import { useLanguage } from '../i18n/LanguageContext';

interface ToolsViewProps {
  onOpenCropDiagnosis: () => void;
  onOpenQuickTool?: (toolName: string) => void;
  /** Jump straight into a sub-calculator (set when arriving from a Home quick-tool card). */
  initialSubView?: Exclude<FarmToolId, 'diagnosis'> | null;
  /** Return to Home — there's no bottom tab bar anymore, so this is the only way back. */
  onBack: () => void;
}

type ActiveSubView = 'none' | 'fertilizer' | 'pesticide' | 'yield';

export const ToolsView: React.FC<ToolsViewProps> = ({
  onOpenCropDiagnosis,
  initialSubView,
  onBack,
}) => {
  const { t } = useLanguage();
  const [activeSubView, setActiveSubView] = useState<ActiveSubView>(initialSubView ?? 'none');

  // If a subview is active, render that isolated window
  if (activeSubView === 'fertilizer') {
    return <FertilizerCalculatorSubView onBack={() => setActiveSubView('none')} />;
  }

  if (activeSubView === 'pesticide') {
    return <PesticideCalculatorSubView onBack={() => setActiveSubView('none')} />;
  }

  if (activeSubView === 'yield') {
    return <YieldEstimatorSubView onBack={() => setActiveSubView('none')} />;
  }

  const handleToolAction = (id: FarmToolId) => {
    if (id === 'diagnosis') {
      onOpenCropDiagnosis();
    } else {
      setActiveSubView(id);
    }
  };

  return (
    <div className="w-full pb-28 sm:pb-24 text-[#191c1d] animate-in fade-in duration-200 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-5 flex flex-col gap-5 sm:gap-6">

        {/* Clean Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#d8e8de]">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-bold text-[#2d6a4f] hover:text-[#012d1d] transition-colors cursor-pointer mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('nav.home')}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2d6a4f] bg-[#d8f3dc] px-2.5 py-0.5 rounded-full border border-[#a7e3b8]">
                {t('tools.headerBadge')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#012d1d] tracking-tight mt-1">
              {t('tools.headerTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#52796f] mt-0.5">
              {t('tools.headerSubtitle')}
            </p>
          </div>
        </div>

        {/* 4-Card Minimalist Launcher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {FARM_TOOLS.map((tool) => {
            const Icon = tool.icon;

            return (
              <div
                key={tool.id}
                onClick={() => handleToolAction(tool.id)}
                className="group relative bg-white hover:bg-[#f0f9f3] p-6 rounded-3xl border-2 border-[#d8e8de] hover:border-[#2d6a4f] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5 active:scale-[0.99]"
              >
                {/* Top Row: Icon + Badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-13 h-13 rounded-2xl ${tool.iconBg} flex items-center justify-center border border-black/5 shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2px]" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}
                  >
                    {t(tool.badgeKey)}
                  </span>
                </div>

                {/* Middle: Title & Description */}
                <div>
                  <h3 className="text-lg font-extrabold text-[#012d1d] group-hover:text-[#2d6a4f] transition-colors flex items-center gap-1.5">
                    <span>{t(tool.titleKey)}</span>
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#52796f] leading-relaxed mt-1.5">
                    {t(tool.subtitleKey)}
                  </p>
                </div>

                {/* Bottom Row: Action Trigger */}
                <div className="flex items-center justify-between pt-3 border-t border-[#eef5f0]">
                  <span className="text-[11px] font-bold text-[#717973] group-hover:text-[#2d6a4f] transition-colors">
                    {t(tool.tagKey)}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-extrabold text-[#2d6a4f] group-hover:translate-x-1 transition-transform">
                    <span>{t('tools.launchTool')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Pro-Tip Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#e8f5ed] to-[#d8f3dc] rounded-3xl border border-[#a7e3b8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1b4332] flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#2d6a4f]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#012d1d]">
                {t('tools.tipTitle')}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#24503b]">
                {t('tools.tipSubtitle')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
