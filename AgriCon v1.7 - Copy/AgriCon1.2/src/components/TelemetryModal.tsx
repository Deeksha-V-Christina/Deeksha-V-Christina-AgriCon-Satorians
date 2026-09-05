import React from 'react';
import { X, Plane, Battery, Gauge, Compass, Radio, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#191c1d] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#a0f4c8] flex items-center justify-center text-[#012d1d]">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Drone-01 Diagnostics</h3>
              <p className="text-[11px] text-[#a0f4c8]">Model: AgriFly V4 Multispectral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-[#a0f4c8] flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" /> BATTERY LEVEL
              </span>
              <span className="text-xl font-bold text-white">82%</span>
              <span className="text-[10px] text-white/60">~18 mins flight time</span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-[#a0f4c8] flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" /> ALTITUDE / SPEED
              </span>
              <span className="text-xl font-bold text-white">84 m</span>
              <span className="text-[10px] text-white/60">14.2 km/h cruise</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
            <span className="text-[10px] text-[#a0f4c8] uppercase font-bold">Live Sensor Stream</span>
            <div className="flex justify-between border-b border-white/10 pb-1.5 text-white/80">
              <span>NDVI RedEdge Sensor:</span>
              <span className="text-emerald-400 font-bold">ONLINE (0.78 index)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-1.5 text-white/80">
              <span>Thermal FLIR Cam:</span>
              <span className="text-emerald-400 font-bold">CALIBRATED (22.4°C)</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>RTK GPS Fix:</span>
              <span className="text-emerald-400 font-bold">FIXED (±1.5cm accuracy)</span>
            </div>
          </div>

          <button
            onClick={() => {
              alert('Emergency return to home protocol initiated.');
              onClose();
            }}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs transition-colors"
          >
            Return to Home Base (RTH)
          </button>
        </div>
      </div>
    </div>
  );
};
