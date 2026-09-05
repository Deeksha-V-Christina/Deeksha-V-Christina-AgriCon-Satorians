import React, { useState } from 'react';
import { Check, Wifi } from 'lucide-react';
import { getApiBase, isRunningNative, setApiBase } from '../services/apiConfig';

/**
 * Inline "where is the backend" field, shown inside the existing
 * backend-offline notices in CropDiagnosisModal and DroneOrthomosaicViewer.
 *
 * A browser tab never needs this — `/api` already resolves via the Vite
 * proxy or same-origin hosting — so it renders nothing there. It only
 * matters once the app is packaged with Capacitor: the WebView has no
 * built-in route to `run_backend.bat` running on the farm PC, so the address
 * has to be typed in once. Doing that here, in the same panel that already
 * explains "diagnosis engine not running", means the fix is exactly where
 * the problem is reported instead of behind a separate settings screen.
 */
export const ApiBaseField: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  // Hooks first, always, so this component's hook order never changes —
  // the native check below only gates what gets rendered.
  const [value, setValue] = useState(getApiBase());
  const [saved, setSaved] = useState(false);

  if (!isRunningNative()) return null;

  const save = () => {
    setApiBase(value);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mt-2 pt-2 border-t border-current/10">
      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
        <Wifi className="w-3 h-3" />
        Backend address (this PC's LAN IP)
      </label>
      <div className="flex gap-1.5 mt-1">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="http://192.168.1.23:8000"
          className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-[11px] font-mono bg-white/70 text-[#191c1d] placeholder:text-[#191c1d]/40 outline-none border border-current/20 focus:border-current/50"
        />
        <button
          type="button"
          onClick={save}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-current/10 hover:bg-current/20 flex items-center gap-1"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : 'Save'}
        </button>
      </div>
      <p className="text-[10px] opacity-70 mt-1 leading-relaxed">
        Run <code className="font-mono">backend/run_backend.bat</code> on a PC on the same Wi-Fi as
        this phone, then enter that PC's IP address here. It prints the address to use when it
        starts.
      </p>
    </div>
  );
};
