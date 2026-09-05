import React, { useState } from 'react';
import {
  ArrowLeft,
  Scale,
  Sprout,
  IndianRupee,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Info,
  ChevronDown,
} from 'lucide-react';

interface YieldEstimatorSubViewProps {
  onBack: () => void;
}

interface CropYieldProfile {
  name: string;
  defaultRowSpacingCm: number;
  defaultPlantSpacingCm: number;
  seedRateKgPerAcre: number;
  averageYieldKgPerAcre: number;
  unit: string;
  marketPricePerKg: number;
}

const CROP_ESTIMATOR_PROFILES: Record<string, CropYieldProfile> = {
  'Maize (Corn)': {
    name: 'Maize (Corn)',
    defaultRowSpacingCm: 60,
    defaultPlantSpacingCm: 20,
    seedRateKgPerAcre: 8,
    averageYieldKgPerAcre: 3200,
    unit: 'kg',
    marketPricePerKg: 24,
  },
  'Wheat': {
    name: 'Wheat',
    defaultRowSpacingCm: 22.5,
    defaultPlantSpacingCm: 5,
    seedRateKgPerAcre: 45,
    averageYieldKgPerAcre: 2100,
    unit: 'kg',
    marketPricePerKg: 27,
  },
  'Rice (Paddy)': {
    name: 'Rice (Paddy)',
    defaultRowSpacingCm: 20,
    defaultPlantSpacingCm: 15,
    seedRateKgPerAcre: 20,
    averageYieldKgPerAcre: 2800,
    unit: 'kg',
    marketPricePerKg: 25,
  },
  'Soybeans': {
    name: 'Soybeans',
    defaultRowSpacingCm: 45,
    defaultPlantSpacingCm: 8,
    seedRateKgPerAcre: 30,
    averageYieldKgPerAcre: 1250,
    unit: 'kg',
    marketPricePerKg: 48,
  },
  'Tomatoes': {
    name: 'Tomatoes',
    defaultRowSpacingCm: 90,
    defaultPlantSpacingCm: 45,
    seedRateKgPerAcre: 0.15,
    averageYieldKgPerAcre: 18000,
    unit: 'kg',
    marketPricePerKg: 32,
  },
  'Potatoes': {
    name: 'Potatoes',
    defaultRowSpacingCm: 60,
    defaultPlantSpacingCm: 25,
    seedRateKgPerAcre: 800, // Seed tubers
    averageYieldKgPerAcre: 14000,
    unit: 'kg',
    marketPricePerKg: 28,
  },
};

export const YieldEstimatorSubView: React.FC<YieldEstimatorSubViewProps> = ({ onBack }) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize (Corn)');
  const [acreage, setAcreage] = useState<number>(4);
  const [germinationRate, setGerminationRate] = useState<number>(90); // 90%
  const [managementFactor, setManagementFactor] = useState<'optimal' | 'average' | 'poor'>('optimal');

  const profile = CROP_ESTIMATOR_PROFILES[selectedCrop] || CROP_ESTIMATOR_PROFILES['Maize (Corn)'];

  // 1 Acre = 4046.86 m² = 40,468,600 cm²
  const areaPerPlantCm2 = profile.defaultRowSpacingCm * profile.defaultPlantSpacingCm;
  const theoreticalPopulationPerAcre = Math.round(40468600 / areaPerPlantCm2);
  const effectivePopulationPerAcre = Math.round(theoreticalPopulationPerAcre * (germinationRate / 100));
  const totalPlantPopulation = effectivePopulationPerAcre * acreage;

  const totalSeedRequiredKg = parseFloat((profile.seedRateKgPerAcre * acreage).toFixed(1));

  // Yield modifier
  const yieldMod = managementFactor === 'optimal' ? 1.15 : managementFactor === 'average' ? 1.0 : 0.75;
  const estimatedYieldPerAcre = Math.round(profile.averageYieldKgPerAcre * yieldMod);
  const totalEstimatedYieldKg = Math.round(estimatedYieldPerAcre * acreage);
  const totalEstimatedRevenue = Math.round(totalEstimatedYieldKg * profile.marketPricePerKg);

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] pb-24 text-[#191c1d] animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col gap-6">
        
        {/* Top Header with Back Button */}
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
                  Planting &amp; Harvest
                </span>
                <span className="text-xs text-[#52796f]">• Population Density &amp; Revenue</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#012d1d] tracking-tight mt-0.5">
                Yield &amp; Seed Estimator
              </h1>
            </div>
          </div>
        </div>

        {/* Inputs & Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-white p-5 sm:p-6 rounded-3xl border border-[#d8e8de] shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eef5f0]">
              <div className="w-8 h-8 rounded-xl bg-[#d8f3dc] flex items-center justify-center text-[#1b4332]">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-[#012d1d]">Planting Parameters</h3>
            </div>

            {/* Crop Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Select Crop Variety</label>
              <div className="relative">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full appearance-none bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 px-4 text-sm font-extrabold text-[#012d1d] focus:outline-none transition-colors cursor-pointer"
                >
                  {Object.keys(CROP_ESTIMATOR_PROFILES).map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#52796f] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Farm Area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Acreage (Acres)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={acreage}
                onChange={(e) => setAcreage(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-full bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl py-3 px-4 text-base font-extrabold text-[#012d1d] focus:outline-none"
              />
            </div>

            {/* Germination Rate Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#52796f]">
                <span>Certified Seed Germination</span>
                <span className="text-[#2d6a4f] font-black">{germinationRate}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="99"
                value={germinationRate}
                onChange={(e) => setGerminationRate(parseInt(e.target.value))}
                className="w-full accent-[#2d6a4f]"
              />
            </div>

            {/* Field Condition */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#52796f]">Field Management / Weather</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'optimal', label: 'Optimal (+15%)' },
                  { id: 'average', label: 'Standard (100%)' },
                  { id: 'poor', label: 'Stress (-25%)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setManagementFactor(item.id as any)}
                    className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      managementFactor === item.id
                        ? 'bg-[#d8f3dc] border-[#2d6a4f] text-[#012d1d] ring-1 ring-[#2d6a4f]'
                        : 'bg-[#f8faf8] border-[#d8e8de] text-[#52796f] hover:bg-[#eef7f2]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Outputs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Harvest & Revenue Forecast Card */}
            <div className="bg-gradient-to-br from-[#1b4332] via-[#24503b] to-[#012d1d] text-white p-5 sm:p-6 rounded-3xl shadow-md">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#a7e3b8]">
                Yield &amp; Revenue Projection
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Estimated Gross Harvest
              </h3>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                  <span className="text-xs text-[#a7e3b8] block">Total Harvest Weight</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {(totalEstimatedYieldKg / 1000).toFixed(1)} <span className="text-base font-semibold">Tons</span>
                  </span>
                  <span className="text-[11px] text-white/70 block mt-0.5">
                    ({totalEstimatedYieldKg.toLocaleString()} kg)
                  </span>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                  <span className="text-xs text-[#a7e3b8] flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Estimated Gross Revenue</span>
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#d8f3dc]">
                    ₹{totalEstimatedRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-white/70 block mt-0.5">
                    @ ₹{profile.marketPricePerKg}/kg spot rate
                  </span>
                </div>
              </div>
            </div>

            {/* Population & Sowing Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-[#d8e8de] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#52796f] block">Seed Required</span>
                  <span className="text-2xl font-black text-[#012d1d] mt-1 block">
                    {totalSeedRequiredKg} <span className="text-sm font-semibold text-[#52796f]">kg</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#52796f] mt-2">
                  For {acreage} acres @ {profile.seedRateKgPerAcre} kg/ac
                </p>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-[#d8e8de] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#52796f] block">Plant Population</span>
                  <span className="text-2xl font-black text-[#2d6a4f] mt-1 block">
                    {totalPlantPopulation.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-[#52796f] mt-2">
                  Spacing: {profile.defaultRowSpacingCm}cm × {profile.defaultPlantSpacingCm}cm
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
