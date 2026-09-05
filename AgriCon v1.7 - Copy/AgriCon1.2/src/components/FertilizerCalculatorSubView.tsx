import React, { useState } from 'react';
import {
  ArrowLeft,
  Sprout,
  Calculator,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface FertilizerCalculatorSubViewProps {
  onBack: () => void;
}

interface CropNPKStandard {
  name: string;
  emoji: string;
  nPerAcre: number; // kg N per acre
  pPerAcre: number; // kg P2O5 per acre
  kPerAcre: number; // kg K2O per acre
}

const CROPS_LIST: CropNPKStandard[] = [
  { name: 'Maize (Corn)', emoji: '🌽', nPerAcre: 120, pPerAcre: 60, kPerAcre: 40 },
  { name: 'Rice (Paddy)', emoji: '🌾', nPerAcre: 100, pPerAcre: 50, kPerAcre: 50 },
  { name: 'Wheat', emoji: '🌾', nPerAcre: 90, pPerAcre: 45, kPerAcre: 35 },
  { name: 'Cotton', emoji: '🌱', nPerAcre: 110, pPerAcre: 40, kPerAcre: 50 },
  { name: 'Tomatoes', emoji: '🍅', nPerAcre: 130, pPerAcre: 70, kPerAcre: 110 },
  { name: 'Potatoes', emoji: '🥔', nPerAcre: 140, pPerAcre: 80, kPerAcre: 100 },
  { name: 'Soybeans', emoji: '🫘', nPerAcre: 30, pPerAcre: 60, kPerAcre: 40 },
  { name: 'Chilli / Peppers', emoji: '🌶️', nPerAcre: 100, pPerAcre: 50, kPerAcre: 60 },
  { name: 'Sugarcane', emoji: '🎋', nPerAcre: 180, pPerAcre: 80, kPerAcre: 100 },
];

export const FertilizerCalculatorSubView: React.FC<FertilizerCalculatorSubViewProps> = ({
  onBack,
}) => {
  // ONLY TWO MINIMALIST INPUTS
  const [selectedCropName, setSelectedCropName] = useState<string>('Maize (Corn)');
  const [landSizeAcres, setLandSizeAcres] = useState<number>(5);

  const selectedCrop =
    CROPS_LIST.find((c) => c.name === selectedCropName) || CROPS_LIST[0];

  const acres = Math.max(0.1, Number(landSizeAcres) || 1);

  // Pure NPK Calculations
  const totalN = Math.round(selectedCrop.nPerAcre * acres);
  const totalP = Math.round(selectedCrop.pPerAcre * acres);
  const totalK = Math.round(selectedCrop.kPerAcre * acres);

  // Standard Commercial Fertilizer Bag Equivalent (50 kg bags)
  // DAP (18% N, 46% P2O5)
  const dapBags = Math.max(1, Math.round(totalP / 0.46 / 50));
  const nFromDap = dapBags * 50 * 0.18;
  const remainingN = Math.max(0, totalN - nFromDap);
  // Urea (46% N)
  const ureaBags = Math.max(1, Math.round(remainingN / 0.46 / 50));
  // MOP (60% K2O)
  const mopBags = Math.max(1, Math.round(totalK / 0.6 / 50));

  return (
    <div className="flex flex-col w-full pb-36 sm:pb-32 max-w-xl mx-auto px-3 sm:px-4 py-4 gap-5 sm:gap-6 animate-in fade-in duration-300 overflow-x-hidden">
      {/* Top Header with Back to Tools Arrow */}
      <div className="flex items-center justify-between pb-2 border-b border-[#d8e8de]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-extrabold text-[#1b4332] bg-[#d8f3dc] hover:bg-[#a7e3b8] px-3.5 py-2 rounded-2xl border border-[#a7e3b8] transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#2d6a4f]" />
          <span>Back to Tools</span>
        </button>
      </div>

      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#012d1d] tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#2d6a4f]" />
          <span>Fertilizer Calculator</span>
        </h1>
        <p className="text-xs text-[#52796f] mt-1">
          Calculate precise NPK nutrient quantities for your farm plot.
        </p>
      </div>

      {/* Minimalist Inputs: Select Crop & Compact Land Size Field */}
      <div className="bg-white rounded-3xl p-4.5 border border-[#d8e8de] shadow-[0_4px_16px_rgba(45,106,79,0.04)] flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#d8e8de]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#012d1d] flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Plot Parameters</span>
          </h2>
          <span className="text-[10px] font-bold text-[#52796f]">2 quick inputs</span>
        </div>

        {/* Input 1: Select Crop Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-extrabold text-[#012d1d]">
            Select Crop
          </label>
          <select
            value={selectedCropName}
            onChange={(e) => setSelectedCropName(e.target.value)}
            className="w-full bg-[#f3f9f5] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-xl py-2.5 px-3.5 text-sm font-extrabold text-[#012d1d] focus:outline-none transition-colors cursor-pointer"
          >
            {CROPS_LIST.map((crop) => (
              <option key={crop.name} value={crop.name}>
                {crop.emoji} {crop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input 2: Compact Numeric Field for Land Size (Acres) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-extrabold text-[#012d1d]">
              Land Size (Acres)
            </label>
            <span className="text-[11px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-full">
              {acres} {acres === 1 ? 'Acre' : 'Acres'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={landSizeAcres}
                onChange={(e) => setLandSizeAcres(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f3f9f5] border border-[#d8e8de] focus:border-[#2d6a4f] rounded-xl py-2 px-3 text-sm font-extrabold text-[#012d1d] focus:outline-none transition-colors"
                placeholder="e.g. 5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#52796f] pointer-events-none">
                acres
              </span>
            </div>

            {/* Quick Increment/Decrement Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLandSizeAcres((prev) => Math.max(0.5, Number((prev - 1).toFixed(1))))}
                className="w-9 h-9 rounded-xl bg-[#e8f5ed] hover:bg-[#d8f3dc] text-[#1b4332] font-extrabold text-base flex items-center justify-center border border-[#a7e3b8] active:scale-95 transition-all cursor-pointer"
                title="Decrease 1 acre"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setLandSizeAcres((prev) => Number((prev + 1).toFixed(1)))}
                className="w-9 h-9 rounded-xl bg-[#e8f5ed] hover:bg-[#d8f3dc] text-[#1b4332] font-extrabold text-base flex items-center justify-center border border-[#a7e3b8] active:scale-95 transition-all cursor-pointer"
                title="Increase 1 acre"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Preset Acre Chips */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-[#52796f] font-medium mr-1">Presets:</span>
            {[1, 2.5, 5, 10, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLandSizeAcres(preset)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  landSizeAcres === preset
                    ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
                    : 'bg-[#f3f9f5] text-[#2d6a4f] border-[#d8e8de] hover:bg-[#d8f3dc]'
                }`}
              >
                {preset} ac
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUIREMENT 2: HIGHLY LEGIBLE NPK RESULT CARD */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#1b4332] via-[#24523e] to-[#012d1d] rounded-3xl p-5 text-white shadow-[0_12px_28px_rgba(27,67,50,0.25)] border border-[#2d6a4f] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedCrop.emoji}</span>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Total Recommended NPK Nutrients
              </h3>
              <p className="text-xs text-[#a7e3b8]">
                Calculated for {acres} Acres of {selectedCrop.name}
              </p>
            </div>
          </div>
          <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Optimal Ratio
          </span>
        </div>

        {/* The 3 Primary NPK Blocks */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Nitrogen (N) */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 flex flex-col items-center text-center">
            <span className="w-7 h-7 rounded-full bg-blue-500/30 text-blue-200 text-xs font-black flex items-center justify-center mb-1">
              N
            </span>
            <span className="text-2xl font-black text-white tracking-tight">
              {totalN}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#d8f3dc]">
              kg Nitrogen
            </span>
          </div>

          {/* Phosphorus (P2O5) */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 flex flex-col items-center text-center">
            <span className="w-7 h-7 rounded-full bg-amber-500/30 text-amber-200 text-xs font-black flex items-center justify-center mb-1">
              P
            </span>
            <span className="text-2xl font-black text-white tracking-tight">
              {totalP}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#d8f3dc]">
              kg Phosphorus
            </span>
          </div>

          {/* Potassium (K2O) */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 flex flex-col items-center text-center">
            <span className="w-7 h-7 rounded-full bg-red-500/30 text-red-200 text-xs font-black flex items-center justify-center mb-1">
              K
            </span>
            <span className="text-2xl font-black text-white tracking-tight">
              {totalK}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#d8f3dc]">
              kg Potassium
            </span>
          </div>
        </div>

        {/* Commercial Bag Quantity Breakdown */}
        <div className="bg-black/25 rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#a7e3b8]">
            Standard Bag Requirements (50 kg / bag)
          </span>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-lg font-black text-white">{ureaBags}</span>
              <span className="text-[10px] text-[#d8f3dc] block">Bags Urea</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-lg font-black text-white">{dapBags}</span>
              <span className="text-[10px] text-[#d8f3dc] block">Bags DAP</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-lg font-black text-white">{mopBags}</span>
              <span className="text-[10px] text-[#d8f3dc] block">Bags MOP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
