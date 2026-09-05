import React, { useEffect, useState } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info,
  WifiOff,
} from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { ApiBaseField } from './ApiBaseField';
import {
  checkHealth,
  diagnoseImage,
  fileFromUrl,
  getModelInfo,
  type DiagnosisResult,
  type ModelInfo,
} from '../services/diagnosisApi';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeDiagnosis } from '../i18n/diagnosisText';

interface CropDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Bundled samples are REAL held-out soybean crops the model never trained on
 * (see backend/README.md). Ground truth ships with each one so a wrong call is
 * visible in the UI instead of hidden — this is a diagnostic tool, and a demo
 * that can only ever look right teaches the user nothing about when to trust it.
 */
const SAMPLES = [
  { id: 'healthy', label: 'Healthy canopy', truth: 'healthy', url: '/samples/healthy.jpg' },
  { id: 'disease', label: 'Foliar disease', truth: 'disease', url: '/samples/disease.jpg' },
  { id: 'pest', label: 'Pest damage', truth: 'pest', url: '/samples/pest.jpg' },
] as const;

const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'bg-[#ffdad6] text-[#93000a]',
  Moderate: 'bg-amber-100 text-amber-800',
  Low: 'bg-[#a0f4c8]/40 text-[#00452d]',
};

export const CropDiagnosisModal: React.FC<CropDiagnosisModalProps> = ({ isOpen, onClose }) => {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(SAMPLES[1].url);
  const [activeTruth, setActiveTruth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const { language, t } = useLanguage();

  // Probe the backend when the modal opens so a stopped server is reported
  // up front, rather than as a confusing failure after the user picks a photo.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const health = await checkHealth();
      if (cancelled) return;
      setBackendUp(health.modelLoaded);
      if (health.modelLoaded) setModelInfo(await getModelInfo());
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Revoke object URLs we created for uploads, so repeated scans don't leak.
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const localized = result ? localizeDiagnosis(language, result) : null;

  const runDiagnosis = async (file: File, preview: string, truth: string | null) => {
    setIsScanning(true);
    setError(null);
    setResult(null);
    setActiveTruth(truth);
    if (previewUrl?.startsWith('blob:') && previewUrl !== preview) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(preview);
    try {
      setResult(await diagnoseImage(file, file.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSample = async (sample: (typeof SAMPLES)[number]) => {
    try {
      const file = await fileFromUrl(sample.url, `${sample.id}.jpg`);
      await runDiagnosis(file, sample.url, sample.truth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample.');
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runDiagnosis(file, URL.createObjectURL(file), null);
    e.target.value = '';
  };

  const truthMatches = result && activeTruth ? result.predictedClass === activeTruth : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#012d1d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c1ecd4] flex items-center justify-center text-[#012d1d]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Crop Diagnostic Lab</h3>
              <p className="text-[11px] text-[#a0f4c8]">
                {modelInfo
                  ? `${modelInfo.model} · ${modelInfo.parametersMillions}M params · on-device`
                  : 'Visual symptom & pathology neural scanner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 no-scrollbar">
          {/* Backend offline notice */}
          {backendUp === false && (
            <div className="p-3 rounded-2xl bg-[#ffdad6] border border-[#93000a]/20 flex gap-2.5">
              <WifiOff className="w-4 h-4 text-[#93000a] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#93000a]">Diagnosis engine not running</p>
                <p className="text-[11px] text-[#93000a]/80 leading-relaxed">
                  Start it with <code className="font-mono">backend/run_backend.bat</code>, then
                  reopen this panel. Scans are disabled until the model is loaded.
                </p>
                <ApiBaseField
                  onSaved={async () => {
                    const health = await checkHealth();
                    setBackendUp(health.modelLoaded);
                    if (health.modelLoaded) setModelInfo(await getModelInfo());
                  }}
                />
              </div>
            </div>
          )}

          {/* Samples */}
          <div>
            <span className="text-xs font-bold text-[#717973] uppercase tracking-wider block mb-2">
              Real held-out samples (model never trained on these):
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => void handleSample(sample)}
                  disabled={isScanning || backendUp === false}
                  className={`p-2 rounded-2xl border text-left flex flex-col gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTruth === sample.truth
                      ? 'border-[#012d1d] bg-[#c1ecd4]/20 ring-2 ring-[#012d1d]'
                      : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="w-full h-14 object-cover rounded-xl" />
                  <span className="text-[11px] font-bold text-[#191c1d] line-clamp-1">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <label
            className={`border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-3 transition-all ${
              isScanning || backendUp === false
                ? 'border-[#c1c8c2] bg-[#f1f2f3] opacity-60 cursor-not-allowed'
                : 'border-[#c1c8c2] hover:border-[#012d1d] bg-[#f8f9fa] hover:bg-[#edeeef] cursor-pointer'
            }`}
          >
            <Upload className="w-5 h-5 text-[#2c694e]" />
            <div className="text-left">
              <p className="text-xs font-bold text-[#012d1d]">Upload Crop Photo / Snapshot</p>
              <p className="text-[10px] text-[#717973]">JPEG, PNG from device camera or field library</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isScanning || backendUp === false}
              className="hidden"
            />
          </label>

          {/* Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-black h-52 flex items-center justify-center">
            {previewUrl && (
              <img src={previewUrl} alt="Scan target" className="w-full h-full object-cover opacity-90" />
            )}

            {isScanning ? (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <div className="w-full h-1 bg-[#a0f4c8] shadow-[0_0_15px_#a0f4c8] animate-bounce" />
                <span className="text-xs font-mono font-bold text-[#a0f4c8] bg-black/70 px-3 py-1 rounded-full flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running CropStressMamba v2...
                </span>
              </div>
            ) : (
              result && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#a0f4c8]" />
                  <span>
                    CONFIDENCE: {result.confidence}% · {result.latencyMs}ms
                  </span>
                </div>
              )
            )}
          </div>

          {/* Error */}
          {error && !isScanning && (
            <div className="p-3 rounded-2xl bg-[#ffdad6] border border-[#93000a]/20 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#93000a] shrink-0 mt-0.5" />
              <p className="text-xs text-[#93000a] leading-relaxed">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && localized && !isScanning && (
            <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#c1ecd4] flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-[#012d1d] uppercase tracking-wider">
                  {localized.displayName}
                </span>
                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${localized.displayName}, ${result.confidence}%. ${localized.diagnosis} ${localized.recommendations.join('. ')}`}
                    label="Read Aloud"
                    variant="compact"
                  />
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      SEVERITY_STYLE[result.severity] ?? SEVERITY_STYLE.Low
                    }`}
                  >
                    {result.severity} {t('diagUi.risk')}
                  </span>
                </div>
              </div>

              {/* Ground truth check on bundled samples */}
              {truthMatches !== null && (
                <div
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
                    truthMatches ? 'bg-[#a0f4c8]/40 text-[#00452d]' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {truthMatches ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {t('diagUi.groundTruth')}: {activeTruth} —{' '}
                    {truthMatches ? t('diagUi.modelCorrect') : t('diagUi.modelWrong')}
                  </span>
                </div>
              )}

              <p className="text-xs text-[#414844] leading-relaxed font-medium">{localized.diagnosis}</p>

              {/* Evidence */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white rounded-xl p-2 border border-[#e1e3e4]">
                  <span className="text-[#717973] block">{t('diagUi.affectedArea')}</span>
                  {/* One tile carries no extent information, so this reads
                      "not measurable" rather than inventing a percentage. */}
                  <span className="font-bold text-[#012d1d]">
                    {result.stressedAreaPercent === null
                      ? t('diagUi.notMeasurable')
                      : `${result.stressedAreaPercent}%`}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-[#e1e3e4]">
                  <span className="text-[#717973] block">{t('diagUi.tilesAnalysed')}</span>
                  <span className="font-bold text-[#012d1d]">
                    {result.tiles.count}
                    {result.tiles.stressedTiles !== null && ` (${result.tiles.stressedTiles} ${t('diagUi.tilesFlagged')})`}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#717973] leading-relaxed">{localized.severityReason}</p>

              {/* Recommendations */}
              <div className="pt-2 border-t border-[#e1e3e4] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#012d1d] uppercase">
                  {t('diagUi.recommendedPlan')}
                </span>
                <ul className="space-y-1">
                  {localized.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-[#414844] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2c694e] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Caveats — always shown, never collapsed away */}
              <div className="pt-2 border-t border-[#e1e3e4] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#8a5a00] uppercase flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  {t('diagUi.limitsTitle')}
                </span>
                <ul className="space-y-1">
                  {localized.caveats.map((c, i) => (
                    <li key={i} className="text-[11px] text-[#6b5220] leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#8a5a00] shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                {result.validatedRecallForThisClass !== null && (
                  <p className="text-[10px] text-[#717973]">
                    Validated recall for this class:{' '}
                    {(result.validatedRecallForThisClass * 100).toFixed(1)}% on{' '}
                    {modelInfo?.validation.valCrops ?? 1304} held-out crops.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#012d1d] text-white font-bold text-xs shadow-sm hover:bg-[#1b4332] active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
