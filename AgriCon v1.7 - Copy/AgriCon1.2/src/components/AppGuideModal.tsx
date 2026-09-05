import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Scan,
  Layers,
  Calculator,
  Bot,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Compass,
  Sprout,
  Volume2,
} from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { EveRobotIcon } from './EveRobotIcon';

interface AppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'home' | 'diagnose' | 'tools' | 'community') => void;
  onOpenAgriBot?: () => void;
}

interface GuideStep {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  readAloudText: string;
  icon: React.ReactNode;
  highlights: {
    title: string;
    description: string;
    tag: string;
  }[];
  visualComponent: React.ReactNode;
}

export const AppGuideModal: React.FC<AppGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenAgriBot,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: GuideStep[] = [
    {
      stepNumber: 1,
      badge: 'Step 1 of 3 • Aerial Surveillance',
      title: 'Capture & View Drone Orthomosaic Maps',
      subtitle:
        'Upload multispectral imagery from your DJI or drone flight to generate an orthorectified 1.4 cm/pixel high-resolution field scan.',
      readAloudText:
        'Step 1: How to capture and view Drone Orthomosaic Maps. Tap the Drone Orthomosaic Analysis card on the Home dashboard to load your field survey. Use the interactive pan and zoom controls to inspect individual crop rows at 1.4 centimeter spatial resolution. The system automatically stitches NIR and Red Edge camera bands to survey vegetation density.',
      icon: <Scan className="w-5 h-5 text-[#2d6a4f]" />,
      highlights: [
        {
          title: 'GSD 1.4 cm Resolution',
          description: 'Survey sub-canopy details, irrigation furrows, and localized foliar damage.',
          tag: 'High Precision',
        },
        {
          title: 'Interactive Pan & Zoom',
          description: 'Navigate any field sector with smooth gestures or zoom buttons up to 2.5x.',
          tag: 'Intuitive Map',
        },
        {
          title: 'Full Diagnostic Report',
          description: 'Export an official PDF report complete with the full drone orthomosaic image and GPS coordinates.',
          tag: 'PDF Export',
        },
      ],
      visualComponent: (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[#a7e3b8] bg-[#1a2e22] shadow-inner flex flex-col justify-between p-3 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=80"
            alt="Field Drone Scan"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Telemetry pill */}
          <div className="relative z-10 flex items-center justify-between gap-1 w-full">
            <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 shrink-0">
              <Scan className="w-3 h-3 text-emerald-400" />
              <span className="whitespace-nowrap">GSD: 1.4 cm/px • DJI Mavic</span>
            </span>
            <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              48.5 Acres
            </span>
          </div>

          {/* Overlay interactive zone demo pins */}
          <div className="relative z-10 flex items-center justify-between gap-1 w-full mt-auto pt-4">
            <div className="bg-red-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-1 rounded-md border border-white shadow-md animate-pulse shrink-0 whitespace-nowrap">
              Zone 1: Severe
            </div>
            <div className="bg-amber-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-1 rounded-md border border-white shadow-md shrink-0 whitespace-nowrap">
              Zone 2: Moderate
            </div>
            <div className="bg-emerald-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-1 rounded-md border border-white shadow-md shrink-0 whitespace-nowrap">
              Zone 4: Healthy
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 2,
      badge: 'Step 2 of 3 • Multispectral Health',
      title: 'Interpret the Red/Orange/Green NDVI Scale',
      subtitle:
        'Toggle the "Show Crop Health (NDVI)" layer to reveal chlorophyll vitality and pinpoint pest, moisture, or nitrogen stress.',
      readAloudText:
        'Step 2: How to interpret the Red, Orange, and Green NDVI zonal health scale. Green represents Healthy biomass with NDVI above 0.70. Orange indicates Moderate Stress between 0.45 and 0.69, typical of early nitrogen or moisture deficiency. Red highlights Severe Damage below 0.45, caused by pest infestation or root rot. Tapping any colored region reveals an instant targeted zonal prescription.',
      icon: <Layers className="w-5 h-5 text-[#2d6a4f]" />,
      highlights: [
        {
          title: '🟩 Healthy (> 0.70 NDVI)',
          description: 'High chlorophyll reflectance and dense biomass. Maintain standard irrigation schedule.',
          tag: 'Optimal',
        },
        {
          title: '🟧 Moderate Stress (0.45 - 0.69)',
          description: 'Sub-canopy moisture stress or early aphid/nutrient loss. Check furrow irrigation and top-dress.',
          tag: 'Action Needed',
        },
        {
          title: '🟥 Severe Disease/Damage (< 0.45)',
          description: 'Active pest feeding (Fall Armyworm) or root rot. Immediate curative chemical/biological spray required.',
          tag: 'Urgent Alert',
        },
      ],
      visualComponent: (
        <div className="bg-white rounded-2xl p-3 border border-[#d8e8de] shadow-xs flex flex-col gap-2 shrink-0">
          <div className="text-[11px] font-black text-[#012d1d] flex items-center justify-between gap-1 w-full">
            <span>Color Spectrum Classification</span>
            <span className="text-[10px] text-[#2d6a4f] font-bold">Tap zone pin to view prescription</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-xl">🟩</span>
              <span className="text-xs font-black text-emerald-900 mt-1">Healthy</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">&gt; 0.70</span>
              <span className="text-[9px] text-emerald-800/80 mt-1 leading-tight">Dense Vigor</span>
            </div>

            <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-xl">🟧</span>
              <span className="text-xs font-black text-amber-900 mt-1">Moderate</span>
              <span className="text-[10px] font-mono text-amber-700 font-bold">0.45 - 0.69</span>
              <span className="text-[9px] text-amber-800/80 mt-1 leading-tight">Moisture Stress</span>
            </div>

            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-xl">🟥</span>
              <span className="text-xs font-black text-red-900 mt-1">Severe</span>
              <span className="text-[10px] font-mono text-red-700 font-bold">&lt; 0.45</span>
              <span className="text-[9px] text-red-800/80 mt-1 leading-tight">Pest Defoliation</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 3,
      badge: 'Step 3 of 3 • Prescription & AI Advisory',
      title: 'Fertilizer Calculator & EVE Voice Advice',
      subtitle:
        'Calculate exact Urea, DAP, and MOP bag requirements for your acreage, and consult EVE for instant voice agronomy.',
      readAloudText:
        'Step 3: How to use the Fertilizer Calculator and ask EVE for instant voice advice. Go to the Tools tab to calculate precise kilogram and bag requirements for Urea, DAP, and Potash based on your crop growth stage. Tap the floating spherical EVE robot button anytime to speak your questions or listen to AI diagnosis in English, Hindi, and regional languages.',
      icon: <Calculator className="w-5 h-5 text-[#2d6a4f]" />,
      highlights: [
        {
          title: 'Precision Fertilizer Calculator',
          description: 'Input your plot size (e.g. 5 acres) and select basal or top-dressing to get exact 50kg bag totals.',
          tag: 'Cost Saver',
        },
        {
          title: 'EVE Spherical AI Agronomist',
          description: 'Tap the floating robot icon at the bottom right to ask questions via voice or chat.',
          tag: '24/7 AI Bot',
        },
        {
          title: 'Multi-Lingual Read Aloud',
          description: 'Every recommendation and message includes a "Read Aloud" speaker button for hands-free listening.',
          tag: 'Voice Output',
        },
      ],
      visualComponent: (
        <div className="bg-gradient-to-br from-[#e8f5ed] to-[#d8f3dc] rounded-2xl p-3.5 border border-[#a7e3b8] shadow-xs flex items-center justify-between gap-3 shrink-0 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#081f15] p-1 border-2 border-[#38bdf8] flex items-center justify-center shadow-md shrink-0">
              <EveRobotIcon className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#012d1d]">EVE AI Agronomist</span>
                <span className="bg-[#2d6a4f] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  Voice Ready
                </span>
              </div>
              <p className="text-[11px] text-[#2d6a4f] font-semibold mt-0.5">
                "Apply 25 kg/acre Urea in Zone 2 before morning irrigation."
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#2d6a4f] text-white shadow-xs">
              <Volume2 className="w-4 h-4" />
            </span>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-[#d8e8de] flex flex-col max-h-full animate-in slide-in-from-bottom duration-300"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#012d1d] via-[#1b4332] to-[#012d1d] text-white flex items-center justify-between border-b border-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#a7e3b8]/40 flex items-center justify-center text-[#a7e3b8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  Agricon User Guide
                </h3>
                <span className="bg-[#a7e3b8]/20 text-[#a7e3b8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#a7e3b8]/30">
                  Step {currentStep + 1} of 3
                </span>
              </div>
              <p className="text-xs text-[#a7e3b8] font-medium mt-0.5">
                Mastering Drone Diagnostics &amp; Farm Advisory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReadAloudButton
              text={current.readAloudText}
              label="Listen"
              className="bg-[#0b3824] hover:bg-[#144930] text-[#a7e3b8] border-[#a7e3b8]/40 hover:border-[#a7e3b8] py-1 px-2.5 text-[11px]"
            />
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-5 pt-3 pb-2 bg-[#f4f9f6] border-b border-[#d8e8de] flex items-center justify-between gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                idx === currentStep
                  ? 'bg-[#1b4332] text-white shadow-sm'
                  : idx < currentStep
                  ? 'bg-[#d8f3dc] text-[#1b4332] hover:bg-[#b7e4c7]'
                  : 'bg-white text-[#717973] hover:bg-[#eaf4ee] border border-[#d8e8de]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                  idx === currentStep
                    ? 'bg-[#a7e3b8] text-[#012d1d]'
                    : idx < currentStep
                    ? 'bg-[#2d6a4f] text-white'
                    : 'bg-[#e1e3e4] text-[#717973]'
                }`}
              >
                {idx + 1}
              </span>
              <span className="hidden xs:inline">
                {idx === 0 ? 'Drone Scan' : idx === 1 ? 'NDVI Scale' : 'Calculator & AI'}
              </span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-5 pb-6 overflow-y-auto h-auto flex flex-col gap-4 bg-[#f8faf8] no-scrollbar">
          {/* Step Header */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-black text-[#2d6a4f] uppercase tracking-wider">
              {current.badge}
            </span>
            <h2 className="text-lg font-black text-[#012d1d] tracking-tight flex items-center gap-2">
              <span>{current.title}</span>
            </h2>
            <p className="text-xs text-[#52796f] leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          {/* Visual Component for this step */}
          {current.visualComponent}

          {/* Highlights List */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#717973]">
              Key Instructions &amp; Best Practices
            </h4>

            {current.highlights.map((item, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-2xl border border-[#d8e8de] shadow-2xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-[#012d1d] block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#52796f] leading-normal block mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </div>
                <span className="bg-[#e8f5ed] text-[#1b4332] text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border border-[#a7e3b8]">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="p-4 bg-white border-t border-[#d8e8de] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentStep === 0
                ? 'opacity-40 pointer-events-none text-[#717973]'
                : 'text-[#1b4332] bg-[#f2f8f4] hover:bg-[#d8f3dc] border border-[#d8e8de] cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-5 bg-[#2d6a4f]'
                    : 'bg-[#d8e8de]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>{currentStep === steps.length - 1 ? 'Start Farming' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
