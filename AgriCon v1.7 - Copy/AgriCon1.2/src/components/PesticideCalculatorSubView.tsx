import React, { useState } from 'react';
import {
  ArrowLeft,
  Droplets,
  FlaskConical,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Info,
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface PesticideCalculatorSubViewProps {
  onBack: () => void;
}

interface ChemicalProduct {
  name: string;
  category: 'Fungicide' | 'Insecticide' | 'Herbicide' | 'Biocontrol';
  target: string;
  recommendedDosePerLiter: number; // ml or g per Liter of water
  unitType: 'ml' | 'grams';
  waterVolumePerAcre: number; // Liters
  phiDays: number; // Pre-harvest interval
  safetyNotes: string;
}

const CHEMICAL_DATABASE: Record<string, ChemicalProduct> = {
  'Azoxystrobin 23% SC (Amistar)': {
    name: 'Azoxystrobin 23% SC (Amistar)',
    category: 'Fungicide',
    target: 'Blast, Powdery Mildew, Anthracnose, Leaf Blight',
    recommendedDosePerLiter: 1.0,
    unitType: 'ml',
    waterVolumePerAcre: 200,
    phiDays: 7,
    safetyNotes: 'Wear gloves & face mask. Do not spray within 7 days of harvest. Toxic to aquatic life.',
  },
  'Chlorantraniliprole 18.5% SC (Coragen)': {
    name: 'Chlorantraniliprole 18.5% SC (Coragen)',
    category: 'Insecticide',
    target: 'Stem Borer, Fall Armyworm, Bollworm, Diamondback Moth',
    recommendedDosePerLiter: 0.4,
    unitType: 'ml',
    waterVolumePerAcre: 150,
    phiDays: 14,
    safetyNotes: 'Target early instar larvae. Safe for key beneficial pollinators when applied at dusk.',
  },
  'Emamectin Benzoate 5% SG': {
    name: 'Emamectin Benzoate 5% SG',
    category: 'Insecticide',
    target: 'Fruit Borer, Thrips, Caterpillars, Pod Borer',
    recommendedDosePerLiter: 0.5,
    unitType: 'grams',
    waterVolumePerAcre: 150,
    phiDays: 5,
    safetyNotes: 'Rapid translaminar action. Ensure complete coverage under leaf surfaces.',
  },
  'Copper Oxychloride 50% WP': {
    name: 'Copper Oxychloride 50% WP',
    category: 'Fungicide',
    target: 'Bacterial Blight, Downy Mildew, Leaf Spot',
    recommendedDosePerLiter: 2.5,
    unitType: 'grams',
    waterVolumePerAcre: 200,
    phiDays: 3,
    safetyNotes: 'Preventative contact bactericide/fungicide. Do not tank mix with alkaline products.',
  },
  'Neem Oil 10,000 PPM (Azadirachtin)': {
    name: 'Neem Oil 10,000 PPM (Azadirachtin)',
    category: 'Biocontrol',
    target: 'Whiteflies, Aphids, Mites, Organic Pest Suppression',
    recommendedDosePerLiter: 3.0,
    unitType: 'ml',
    waterVolumePerAcre: 150,
    phiDays: 0,
    safetyNotes: 'Certified organic bio-pesticide. 0-day harvest interval. Emulsify with mild soap water.',
  },
  'Glyphosate 41% SL (Non-Selective)': {
    name: 'Glyphosate 41% SL (Non-Selective)',
    category: 'Herbicide',
    target: 'Annual & Perennial Broadleaf Weeds & Grasses',
    recommendedDosePerLiter: 7.5,
    unitType: 'ml',
    waterVolumePerAcre: 150,
    phiDays: 21,
    safetyNotes: 'Use spray hood shield to prevent crop drift. Apply when weeds are actively photosynthesizing.',
  },
};

export const PesticideCalculatorSubView: React.FC<PesticideCalculatorSubViewProps> = ({ onBack }) => {
  const [selectedChem, setSelectedChem] = useState<string>('Azoxystrobin 23% SC (Amistar)');
  const [sprayArea, setSprayArea] = useState<number>(2.5);
  const [tankCapacityLiters, setTankCapacityLiters] = useState<number>(16); // 16L knapsack sprayer
  const [calibrationWaterPerAcre, setCalibrationWaterPerAcre] = useState<number>(150);

  const product = CHEMICAL_DATABASE[selectedChem] || CHEMICAL_DATABASE['Azoxystrobin 23% SC (Amistar)'];

  // Calculations
  const totalWaterLiters = Math.round(sprayArea * calibrationWaterPerAcre);
  const numberOfTanks = Math.ceil(totalWaterLiters / tankCapacityLiters);
  const chemicalPerTank = parseFloat((tankCapacityLiters * product.recommendedDosePerLiter).toFixed(1));
  const totalChemicalRequired = parseFloat((totalWaterLiters * product.recommendedDosePerLiter).toFixed(1));

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] pb-24 text-[#191c1d] animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col gap-6">
        
        {/* Top Header with Prominent Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#d8e8de]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-[#d8f3dc] text-[#1b4332] border border-[#a7e3b8] shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 group cursor-pointer"
              title="Back to Farm Tools"
              aria-label="Back to Farm Tools"
            >
              <ArrowLeft className="w-5 h-5 text-[#2d6a4f] group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2d6a4f] bg-[#d8f3dc] px-2.5 py-0.5 rounded-full border border-[#a7e3b8]">
                  Crop Protection
                </span>
                <span className="text-xs text-[#52796f]">• Spray Tank Calibration</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#012d1d] tracking-tight mt-0.5">
                Pesticide &amp; Spray Dilution
              </h1>
            </div>
          </div>
        </div>

        {/* Input & Output Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-white p-5 sm:p-6 rounded-3xl border border-[#d8e8de] shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eef5f0]">
              <div className="w-8 h-8 rounded-xl bg-[#d8f3dc] flex items-center justify-center text-[#1b4332]">
                <Droplets className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-[#012d1d]">Formulation &amp; Equipment</h3>
            </div>

            {/* Product selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Select Formulation / Chemical</label>
              <div className="relative">
                <select
                  value={selectedChem}
                  onChange={(e) => setSelectedChem(e.target.value)}
                  className="w-full appearance-none bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 px-4 text-xs font-extrabold text-[#012d1d] focus:outline-none transition-colors cursor-pointer"
                >
                  {Object.keys(CHEMICAL_DATABASE).map((chem) => (
                    <option key={chem} value={chem}>
                      {chem}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#52796f] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Spray Area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Plot Area to Spray (Acres)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={sprayArea}
                onChange={(e) => setSprayArea(Math.max(0.1, parseFloat(e.target.value) || 0.5))}
                className="w-full bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 px-4 text-base font-extrabold text-[#012d1d] focus:outline-none"
              />
            </div>

            {/* Sprayer Tank Capacity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Sprayer Tank Volume</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { liters: 16, label: '16 L', sub: 'Knapsack' },
                  { liters: 20, label: '20 L', sub: 'Battery' },
                  { liters: 200, label: '200 L', sub: 'Tractor Boom' },
                ].map((t) => (
                  <button
                    key={t.liters}
                    type="button"
                    onClick={() => setTankCapacityLiters(t.liters)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      tankCapacityLiters === t.liters
                        ? 'bg-[#d8f3dc] border-[#2d6a4f] text-[#012d1d] font-extrabold ring-1 ring-[#2d6a4f]'
                        : 'bg-[#f8faf8] border-[#d8e8de] text-[#52796f] hover:bg-[#eef7f2]'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{t.label}</div>
                    <div className="text-[10px] opacity-75">{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target & Mode */}
            <div className="p-3.5 bg-[#f0f9f3] rounded-2xl border border-[#cbe4d4] flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold text-[#1b4332] uppercase">Target Spectrum:</span>
              <p className="text-xs text-[#24503b] font-medium">{product.target}</p>
            </div>
          </div>

          {/* Results (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Primary Mixing Dose Card */}
            <div className="bg-gradient-to-br from-[#1b4332] via-[#24503b] to-[#012d1d] text-white p-5 sm:p-6 rounded-3xl shadow-md">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#a7e3b8]">
                Precision Mixing Ratio
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Add to Each {tankCapacityLiters}L Tank:
              </h3>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-black text-[#a7e3b8]">{chemicalPerTank}</span>
                <span className="text-lg font-bold text-white">
                  {product.unitType} of chemical
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1">
                Based on recommended {product.recommendedDosePerLiter} {product.unitType}/Liter of clean water.
              </p>
            </div>

            {/* Key Totals */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-[#d8e8de] text-center shadow-xs">
                <span className="text-xs text-[#52796f] block">Total Water</span>
                <span className="text-xl font-black text-[#012d1d]">{totalWaterLiters}</span>
                <span className="text-[10px] text-[#52796f] block">Liters</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#d8e8de] text-center shadow-xs">
                <span className="text-xs text-[#52796f] block">Tank Refills</span>
                <span className="text-xl font-black text-[#2d6a4f]">{numberOfTanks}</span>
                <span className="text-[10px] text-[#52796f] block">Tanks</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#d8e8de] text-center shadow-xs">
                <span className="text-xs text-[#52796f] block">Total Chemical</span>
                <span className="text-xl font-black text-[#012d1d]">{totalChemicalRequired}</span>
                <span className="text-[10px] text-[#52796f] block">{product.unitType}</span>
              </div>
            </div>

            {/* Safety & PHI */}
            <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Pre-Harvest Interval (PHI)</span>
                </div>
                <span className="bg-amber-200 text-amber-900 font-black text-xs px-2.5 py-1 rounded-xl">
                  {product.phiDays} Days Waiting Period
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {product.safetyNotes}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
