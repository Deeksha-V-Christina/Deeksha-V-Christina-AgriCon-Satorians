import React from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, Bug, Calendar, ArrowRight } from 'lucide-react';

interface MitigationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MitigationModal: React.FC<MitigationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#ba1a1a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Fall Armyworm Protocol</h3>
              <p className="text-xs text-white/80">Sector 4 Corn Field Containment Action Plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs text-[#414844] no-scrollbar">
          <div className="p-3.5 bg-[#ffdad6] rounded-2xl border border-[#ba1a1a]/20 flex items-center gap-3 text-[#93000a]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">
              Scouting threshold exceeded: &gt;15% of whorls infested with 1st/2nd instar larvae in Sector 4.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#012d1d]">3-Step Immediate Protocol:</h4>

            {/* Step 1 */}
            <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4] flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <h5 className="font-bold text-xs text-[#191c1d]">Targeted Foliar Spray (06:00 - 08:30)</h5>
                <p className="text-xs text-[#414844] mt-0.5 leading-relaxed">
                  Apply <strong>Chlorantraniliprole 18.5% SC</strong> @ 150ml/ha or organic <strong>Bt (Bacillus thuringiensis)</strong> direct to leaf whorls.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4] flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <h5 className="font-bold text-xs text-[#191c1d]">Pheromone Trap Installation</h5>
                <p className="text-xs text-[#414844] mt-0.5 leading-relaxed">
                  Deploy 4 funnel traps per hectare around perimeter borders to track adult moth population migration.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4] flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div>
                <h5 className="font-bold text-xs text-[#191c1d]">Post-Treatment Verification Drone Scan</h5>
                <p className="text-xs text-[#414844] mt-0.5 leading-relaxed">
                  Automated multispectral scan scheduled for 72 hours post-spray to confirm whorl recovery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex justify-between items-center">
          <button
            onClick={() => {
              alert('Automated drone flight task dispatched to Drone-01 queue.');
              onClose();
            }}
            className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs rounded-full shadow-sm"
          >
            Dispatch Drone Spray
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#edeeef] hover:bg-[#e1e3e4] text-[#191c1d] font-bold text-xs rounded-full"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
