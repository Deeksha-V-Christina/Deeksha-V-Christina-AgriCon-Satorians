import React from 'react';
import { CropItem } from '../types';
import { X, Droplets, Sun, Calendar, MapPin, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

interface CropDetailModalProps {
  crop: CropItem | null;
  onClose: () => void;
  onUpdateMoisture: (id: string, newMoisture: number) => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  onClose,
  onUpdateMoisture,
}) => {
  if (!crop) return null;

  const isNeedsWater = crop.status === 'Needs Water';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col">
        {/* Top Image */}
        <div className="relative h-44 w-full">
          <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-5">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1 ${
                crop.status === 'Healthy'
                  ? 'bg-[#a0f4c8] text-[#002113]'
                  : 'bg-[#ffdad6] text-[#93000a]'
              }`}
            >
              {crop.status}
            </span>
            <h3 className="text-xl font-bold text-white leading-tight">{crop.name}</h3>
            <p className="text-xs text-white/80">
              {crop.field} • {crop.quadrant} • {crop.areaHa} ha
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs text-[#414844]">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-[#f8f9fa] p-3 rounded-2xl border border-[#e1e3e4]">
              <span className="block text-[10px] font-bold text-[#717973]">GROWTH DAY</span>
              <span className="text-lg font-extrabold text-[#012d1d]">Day {crop.day}</span>
            </div>
            <div className="bg-[#f8f9fa] p-3 rounded-2xl border border-[#e1e3e4]">
              <span className="block text-[10px] font-bold text-[#717973]">SOIL MOISTURE</span>
              <span className={`text-lg font-extrabold ${isNeedsWater ? 'text-[#ba1a1a]' : 'text-[#2c694e]'}`}>
                {crop.moisturePercent}%
              </span>
            </div>
            <div className="bg-[#f8f9fa] p-3 rounded-2xl border border-[#e1e3e4]">
              <span className="block text-[10px] font-bold text-[#717973]">HARVEST DATE</span>
              <span className="text-xs font-bold text-[#012d1d] mt-1 block">{crop.expectedHarvest}</span>
            </div>
          </div>

          {/* Quick Irrigation Action */}
          <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4] flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#012d1d] flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#2c694e]" />
                Trigger Smart Irrigation
              </span>
              <button
                onClick={() => onUpdateMoisture(crop.id, Math.min(100, crop.moisturePercent + 25))}
                className="px-3.5 py-1.5 bg-[#012d1d] text-white font-bold text-[11px] rounded-full hover:bg-[#1b4332] active:scale-95 transition-all"
              >
                +25% Water
              </button>
            </div>
            <p className="text-[11px] text-[#717973]">
              Automated solenoid valves in {crop.field} can pulse drip irrigation for 30 minutes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#012d1d] text-white font-bold text-xs rounded-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
