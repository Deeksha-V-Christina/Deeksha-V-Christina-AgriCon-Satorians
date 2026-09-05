import React from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Sun,
  Clock,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { DroneOrthomosaicViewer } from './DroneOrthomosaicViewer';
import { FARM_TOOLS, FarmToolId } from '../data/farmTools';
import { useLanguage } from '../i18n/LanguageContext';

interface HomeViewProps {
  onOpenTelemetryDetails?: () => void;
  onOpenConditionsModal?: () => void;
  onOpenDiagnosticTool?: () => void;
  onOpenFieldReport?: () => void;
  onOpenTool: (toolId: FarmToolId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenConditionsModal,
  onOpenDiagnosticTool,
  onOpenFieldReport,
  onOpenTool,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col w-full pb-28 sm:pb-24 max-w-xl mx-auto px-3 sm:px-4 py-4 gap-4 sm:gap-5 animate-in fade-in duration-300 overflow-x-hidden">
      {/* 2. Live Microclimate Conditions & Spray Index Section */}
      <section className="flex flex-col gap-3">
        {/* Spray Index Live Advisory Card */}
        <div className="bg-gradient-to-br from-[#1b4332] via-[#22503d] to-[#012d1d] rounded-3xl p-4.5 text-white shadow-[0_8px_24px_rgba(27,67,50,0.18)] border border-[#2d6a4f] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#d8f3dc] flex items-center justify-center text-[#1b4332] shadow-xs">
                <CloudSun className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">{t('home.sprayIndexTitle')}</h3>
                  <span className="bg-[#a7e3b8] text-[#012d1d] text-[10px] font-black px-2 py-0.5 rounded-full">
                    {t('home.sprayOptimal')}
                  </span>
                </div>
                <p className="text-[11px] text-[#d8f3dc]">
                  {t('home.sprayIndexSubtitle')}
                </p>
              </div>
            </div>

            {onOpenConditionsModal && (
              <button
                type="button"
                onClick={onOpenConditionsModal}
                className="text-[11px] font-bold text-[#a7e3b8] hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>{t('home.details')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Spray Window Timing & Drift Status */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#a7e3b8] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#d8f3dc] font-medium block">{t('home.bestWindow')}</span>
                <span className="text-xs font-bold text-white truncate block">06:00 AM – 11:30 AM</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a7e3b8] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#d8f3dc] font-medium block">{t('home.driftRisk')}</span>
                <span className="text-xs font-bold text-white truncate block">Low Drift • 0% Rain</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item Live Telemetry Conditions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Air Temperature */}
          <div className="bg-white rounded-2xl p-2.5 border border-[#d8e8de] shadow-xs flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#52796f]">
              <Thermometer className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>{t('home.temp')}</span>
            </div>
            <span className="text-base font-extrabold text-[#012d1d] mt-0.5">24°C</span>
            <span className="text-[9px] text-[#52796f]">14° - 27°C</span>
          </div>

          {/* Relative Humidity */}
          <div className="bg-white rounded-2xl p-2.5 border border-[#d8e8de] shadow-xs flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#52796f]">
              <Droplets className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>{t('home.humidity')}</span>
            </div>
            <span className="text-base font-extrabold text-[#012d1d] mt-0.5">45%</span>
            <span className="text-[9px] text-[#52796f]">Dew 11°C</span>
          </div>

          {/* Wind Speed */}
          <div className="bg-white rounded-2xl p-2.5 border border-[#d8e8de] shadow-xs flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#52796f]">
              <Wind className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>{t('home.wind')}</span>
            </div>
            <span className="text-base font-extrabold text-[#012d1d] mt-0.5">4.2</span>
            <span className="text-[9px] text-[#52796f]">km/h NW</span>
          </div>

          {/* Solar Radiation */}
          <div className="bg-white rounded-2xl p-2.5 border border-[#d8e8de] shadow-xs flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#52796f]">
              <Sun className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>{t('home.solar')}</span>
            </div>
            <span className="text-base font-extrabold text-[#012d1d] mt-0.5">680</span>
            <span className="text-[9px] text-[#52796f]">W/m² UV 5</span>
          </div>
        </div>
      </section>

      {/* 3. Drone Orthomosaic Analysis Viewer (Primary Central View) */}
      <section className="flex flex-col gap-2">
        <DroneOrthomosaicViewer
          onOpenDiagnosticTool={onOpenDiagnosticTool}
          onOpenFieldReport={onOpenFieldReport}
        />
      </section>

      {/* 4. Quick Farm Tools — brought over from the dedicated Farm Tools tab so the
             most-used calculators & the AI scanner are one tap away from Home. */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-[#012d1d]">{t('home.toolsTitle')}</h2>
            <p className="text-xs text-[#52796f]">{t('home.toolsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FARM_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onOpenTool(tool.id)}
                className="text-left bg-white hover:bg-[#f0f9f3] rounded-3xl border border-[#d8e8de] hover:border-[#2d6a4f] shadow-xs hover:shadow-md transition-all p-3.5 flex flex-col gap-2.5 active:scale-[0.98] cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded-2xl ${tool.iconBg} flex items-center justify-center border border-black/5 shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2px]" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#012d1d] leading-tight">
                    {t(tool.titleKey)}
                  </h4>
                  <p className="text-[10px] text-[#52796f] leading-snug mt-0.5 line-clamp-2">
                    {t(tool.subtitleKey)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#2d6a4f] group-hover:translate-x-1 transition-transform mt-auto">
                  <span>{t('tools.launchTool')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
