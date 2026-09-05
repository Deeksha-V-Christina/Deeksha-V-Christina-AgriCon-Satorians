import React from 'react';
import { X, CloudSun, Droplets, Wind, Thermometer, Sun, Compass, CheckCircle2 } from 'lucide-react';

interface ConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConditionsModal: React.FC<ConditionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c1ecd4] flex items-center justify-center text-[#012d1d]">
              <CloudSun className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Microclimate Telemetry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs text-[#414844]">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#e1e3e4]">
              <span className="text-[10px] font-bold text-[#717973] uppercase flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[#2c694e]" /> Air Temp
              </span>
              <span className="text-xl font-extrabold text-[#012d1d] block mt-1">24°C</span>
              <span className="text-[10px] text-[#717973]">Low: 14°C • High: 27°C</span>
            </div>

            <div className="bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#e1e3e4]">
              <span className="text-[10px] font-bold text-[#717973] uppercase flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#2c694e]" /> Rel. Humidity
              </span>
              <span className="text-xl font-extrabold text-[#2c694e] block mt-1">45%</span>
              <span className="text-[10px] text-[#717973]">Dew point: 11°C</span>
            </div>

            <div className="bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#e1e3e4]">
              <span className="text-[10px] font-bold text-[#717973] uppercase flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#2c694e]" /> Wind Speed
              </span>
              <span className="text-xl font-extrabold text-[#012d1d] block mt-1">4.2 km/h</span>
              <span className="text-[10px] text-[#717973]">Direction: NW (310°)</span>
            </div>

            <div className="bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#e1e3e4]">
              <span className="text-[10px] font-bold text-[#717973] uppercase flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-[#2c694e]" /> Solar Radiation
              </span>
              <span className="text-xl font-extrabold text-[#012d1d] block mt-1">680 W/m²</span>
              <span className="text-[10px] text-[#717973]">UV Index: 5 (Moderate)</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#c1ecd4]/20 rounded-2xl border border-[#c1ecd4] flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#00452d] shrink-0" />
            <p className="text-xs text-[#002114] font-medium">
              Ideal spraying window open until 11:30 AM before gust velocities increase.
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
