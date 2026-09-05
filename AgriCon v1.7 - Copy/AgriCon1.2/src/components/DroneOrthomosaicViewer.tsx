import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Activity,
  Scan,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Upload,
  Info,
  WifiOff,
  Trash2,
  ImageOff,
} from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { HeatmapImage, StressHeatmapLegend } from './StressHeatmap';
import { setAnalyzedFrames, type AnalyzedFrame } from '../services/analysisStore';
import {
  checkHealth,
  diagnoseImage,
  type DiagnosisResult,
  type TileCell,
} from '../services/diagnosisApi';
import { ApiBaseField } from './ApiBaseField';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeDiagnosis } from '../i18n/diagnosisText';

interface DroneOrthomosaicViewerProps {
  onClose?: () => void;
  onOpenDiagnosticTool?: () => void;
  onOpenFieldReport?: () => void;
}

/** One uploaded drone image plus whatever the model made of it. */
interface Frame {
  id: string;
  name: string;
  objectUrl: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  result?: DiagnosisResult;
  error?: string;
  analyzedAt?: string;
}

const CLASS_STYLE: Record<
  string,
  { fill: string; dot: string; label: string; text: string; chip: string }
> = {
  healthy: {
    fill: 'rgba(16,185,129,0.34)',
    dot: 'bg-emerald-500',
    label: 'Healthy',
    text: 'text-[#1b4332]',
    chip: 'bg-[#d8f3dc] text-[#1b4332] border-[#a7e3b8]',
  },
  disease: {
    fill: 'rgba(239,68,68,0.42)',
    dot: 'bg-red-500',
    label: 'Disease',
    text: 'text-red-700',
    chip: 'bg-red-100 text-red-700 border-red-200',
  },
  pest: {
    fill: 'rgba(245,158,11,0.42)',
    dot: 'bg-amber-500',
    label: 'Pest',
    text: 'text-amber-800',
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  nutrient_deficiency: {
    fill: 'rgba(168,85,247,0.40)',
    dot: 'bg-purple-500',
    label: 'Nutrient (unvalidated)',
    text: 'text-purple-700',
    chip: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

/** Share of surveyed area for one class. */
type AreaEntry = { tiles: number; percent: number };

/**
 * Object.entries over the area breakdown, explicitly typed.
 *
 * This project doesn't include @types/react, so React's hooks resolve to
 * `any` and anything inferred through them loses its type -- Object.entries
 * on such a value yields `unknown` members. Annotating here keeps the
 * component correct whether or not those types are ever added.
 */
function areaEntries(area: Record<string, AreaEntry>): [string, AreaEntry][] {
  return Object.entries(area) as [string, AreaEntry][];
}

/** Turn a tile's fractional position into words a person can act on. */
function describePosition(cell: TileCell): string {
  const cx = cell.left + cell.width / 2;
  const cy = cell.top + cell.height / 2;
  const vertical = cy < 0.34 ? 'top' : cy < 0.67 ? 'middle' : 'bottom';
  const horizontal = cx < 0.34 ? 'left' : cx < 0.67 ? 'centre' : 'right';
  return vertical === 'middle' && horizontal === 'centre' ? 'centre' : `${vertical} ${horizontal}`;
}

export const DroneOrthomosaicViewer: React.FC<DroneOrthomosaicViewerProps> = ({
  onClose,
  onOpenFieldReport,
}) => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedCell, setSelectedCell] = useState<TileCell | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const h = await checkHealth();
      if (!cancelled) setBackendUp(h.modelLoaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Publish finished analyses so the field report can print the real thing.
  useEffect(() => {
    const done: AnalyzedFrame[] = frames
      .filter((f) => f.status === 'done' && f.result)
      .map((f) => ({
        id: f.id,
        name: f.name,
        imageUrl: f.objectUrl,
        result: f.result as NonNullable<typeof f.result>,
        analyzedAt: f.analyzedAt ?? new Date().toISOString(),
      }));
    setAnalyzedFrames(done);
  }, [frames]);

  // Release preview URLs when the component goes away.
  const framesRef = useRef(frames);
  framesRef.current = frames;
  useEffect(
    () => () => framesRef.current.forEach((f) => URL.revokeObjectURL(f.objectUrl)),
    [],
  );

  const active = frames[currentFrame];
  const result = active?.status === 'done' ? active.result : undefined;

  const analyze = async (frame: Frame, file: File) => {
    setFrames((prev) => prev.map((f) => (f.id === frame.id ? { ...f, status: 'analyzing' } : f)));
    try {
      const res = await diagnoseImage(file, file.name);
      setFrames((prev) =>
        prev.map((f) =>
          f.id === frame.id
            ? { ...f, status: 'done', result: res, analyzedAt: new Date().toISOString() }
            : f,
        ),
      );
    } catch (err) {
      setFrames((prev) =>
        prev.map((f) =>
          f.id === frame.id
            ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Analysis failed' }
            : f,
        ),
      );
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Narrow before Array.from: `e.target.files ?? []` is a FileList|never[]
    // union, and TS infers the element type as unknown from that.
    if (!e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);

    const startIndex = frames.length;
    const newFrames: Frame[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      objectUrl: URL.createObjectURL(file),
      status: 'pending',
    }));
    setFrames((prev) => [...prev, ...newFrames]);
    setCurrentFrame(startIndex);
    setSelectedCell(null);

    // Sequential, not parallel: the model runs on 2 CPU threads, so firing
    // every frame at once would just make them all slow together.
    void (async () => {
      for (let i = 0; i < newFrames.length; i++) {
        await analyze(newFrames[i], files[i]);
      }
    })();
    e.target.value = '';
  };

  const removeFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.objectUrl);
      const next = prev.filter((f) => f.id !== id);
      setCurrentFrame((c) => Math.max(0, Math.min(c, next.length - 1)));
      return next;
    });
    setSelectedCell(null);
  };

  const goTo = (idx: number) => {
    setCurrentFrame(idx);
    setSelectedCell(null);
  };

  /**
   * Stressed tiles, worst first — the actionable list.
   *
   * `result.tileGrid ?? []` guards against an old backend still running:
   * tileGrid/areaByClass were added to the API alongside this component, so
   * a stale server process (started before that change, still running in
   * its own terminal) returns a diagnosis with neither field. Without this
   * guard that shape mismatch throws inside a render and blanks the whole
   * page — far worse than just not showing a spatial breakdown.
   */
  const problemZones = useMemo(() => {
    if (!result?.tileGrid) return [];
    return result.tileGrid
      .filter((c) => c.predictedClass !== 'healthy')
      .sort((a, b) => b.confidence - a.confidence);
  }, [result]);

  const stressedPercent = useMemo(() => {
    if (!result?.areaByClass) return 0;
    return areaEntries(result.areaByClass)
      .filter(([k]) => k !== 'healthy')
      .reduce((sum: number, [, v]) => sum + v.percent, 0);
  }, [result]);

  // Same guard, used wherever the JSX below reads these two fields directly.
  const hasSpatialData = !!(result?.tileGrid && result?.areaByClass);

  const isSevere = result?.severity === 'Critical';
  const isModerate = result?.severity === 'Moderate';

  const { language, t } = useLanguage();
  const localized = result ? localizeDiagnosis(language, result) : null;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Control header */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3.5 border-b border-[#d8e8de] bg-[#f4f9f6] z-20 shrink-0 overflow-x-auto no-scrollbar flex-nowrap">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-max">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#012d1d] flex items-center justify-center shadow-md shrink-0">
            <Scan className="w-4 h-4 text-[#a7e3b8]" />
          </div>
          <div>
            <h2 className="font-black text-xs sm:text-sm md:text-base text-[#012d1d] leading-tight whitespace-nowrap">
              Drone Orthomosaic Analysis
            </h2>
            <p className="text-[10px] sm:text-xs text-[#52796f] font-medium flex items-center gap-1.5 whitespace-nowrap">
              {active ? (
                <>
                  <span className="font-bold text-[#1b4332] max-w-[140px] truncate">{active.name}</span>
                  <span className="w-1 h-1 rounded-full bg-[#a7e3b8]" />
                  <span>CropStressMamba v2</span>
                </>
              ) : (
                <span>Upload a drone map to analyse</span>
              )}
            </p>
          </div>
        </div>

        {/* Frame stepper — only meaningful with more than one upload */}
        {frames.length > 1 && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 bg-white/95 px-1.5 sm:px-2 py-1 rounded-xl border border-[#d8e8de] shadow-xs">
            <button
              type="button"
              onClick={() => goTo((currentFrame - 1 + frames.length) % frames.length)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f0f7f3] hover:bg-[#d8f3dc] text-[#012d1d] flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#d8e8de]"
              aria-label="Previous frame"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-[#012d1d] text-white text-[11px] sm:text-xs font-black tracking-wide flex items-center gap-1 whitespace-nowrap">
              <span className="text-[#a7e3b8]">Frame {currentFrame + 1}</span>
              <span className="text-white/50">/</span>
              <span>{frames.length}</span>
            </span>
            <button
              type="button"
              onClick={() => goTo((currentFrame + 1) % frames.length)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f0f7f3] hover:bg-[#d8f3dc] text-[#012d1d] flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#d8e8de]"
              aria-label="Next frame"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            id="drone-upload-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={backendUp === false}
            className="px-2.5 py-1.5 rounded-lg bg-[#012d1d] hover:bg-[#1b4332] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload drone image(s)"
          >
            <Upload className="w-3.5 h-3.5 text-[#a7e3b8]" />
            <span className="text-[10px] sm:text-xs font-bold">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />

          {result && (
            <button
              type="button"
              onClick={() => setShowOverlay(!showOverlay)}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap ${
                showOverlay
                  ? 'bg-[#012d1d] border-[#012d1d] text-white'
                  : 'bg-white border-[#d8e8de] text-[#1b4332] hover:bg-[#eef7f2]'
              }`}
              title={showOverlay ? 'Hide classification overlay' : 'Show classification overlay'}
            >
              {showOverlay ? (
                <Eye className="w-3.5 h-3.5 text-[#a7e3b8]" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-[#52796f]" />
              )}
              <span className="text-[10px] sm:text-xs font-bold hidden md:inline">
                {showOverlay ? 'Hide Map' : 'Show Map'}
              </span>
            </button>
          )}

          {onClose && (
            <>
              <div className="w-px h-5 bg-[#d8e8de] mx-0.5 hidden sm:block" />
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#eef7f2] hover:bg-[#d8e8de] text-[#1b4332] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#191c1d] group min-h-[240px]">
        {backendUp === false && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-[#191c1d] px-6 text-center">
            <WifiOff className="w-8 h-8 text-red-300" />
            <p className="text-sm font-bold text-white">Analysis engine not running</p>
            <p className="text-[11px] text-white/70 max-w-xs leading-relaxed">
              Start it with <code className="font-mono">backend/run_backend.bat</code>, then reload
              this page. Uploads are disabled until the model is loaded.
            </p>
            <div className="w-full max-w-xs text-left text-white/70">
              <ApiBaseField
                onSaved={async () => {
                  const h = await checkHealth();
                  setBackendUp(h.modelLoaded);
                }}
              />
            </div>
          </div>
        )}

        {/* Empty state — the upload dropzone that replaced the mock imagery */}
        {backendUp !== false && !active && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-[#a7e3b8]/60 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#a7e3b8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Upload a drone map or field photo</p>
              <p className="text-[11px] text-white/60 mt-1 max-w-xs leading-relaxed">
                Each image is split into tiles and every tile is classified, so you get a map of
                where the stress is — not just one verdict. Select several to step through as frames.
              </p>
            </div>
          </button>
        )}

        {active && (
          <>
            {/* Image + continuous stress-density field, both placed on the
                image's fitted rectangle so the overlay never spills onto the
                letterbox bars. See StressHeatmap for why it's a smooth field
                rather than a grid of cells. */}
            <HeatmapImage
              src={active.objectUrl}
              alt={active.name}
              cells={result?.tileGrid ?? []}
              showOverlay={showOverlay}
              selected={selectedCell}
              onSelect={(cell) =>
                setSelectedCell(
                  cell && selectedCell?.row === cell.row && selectedCell?.col === cell.col
                    ? null
                    : cell,
                )
              }
              imgClassName={`transition-all duration-500 ${
                active.status === 'analyzing' ? 'opacity-60 blur-[1px]' : 'opacity-100'
              }`}
            />

            {active.status === 'analyzing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white bg-black/40 backdrop-blur-xs">
                <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-[#a7e3b8] mb-2" />
                <span className="font-bold text-sm tracking-widest uppercase drop-shadow-md">
                  Classifying tiles...
                </span>
              </div>
            )}

            {active.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white bg-black/70 px-6 text-center gap-2">
                <ImageOff className="w-8 h-8 text-red-300" />
                <span className="font-bold text-sm">Could not analyse this image</span>
                <span className="text-[11px] text-white/70 max-w-xs">{active.error}</span>
              </div>
            )}

            {/* Live readout — real model output, no invented telemetry */}
            {result && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white shadow-md z-20 flex flex-col pointer-events-none">
                <span className="font-mono text-[10px] sm:text-xs font-bold text-white/70 tracking-widest uppercase">
                  {result.tiles.count} tiles analysed
                </span>
                <span className="font-black text-sm sm:text-base flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{stressedPercent.toFixed(0)}% stressed</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 self-start ${
                    isSevere
                      ? 'bg-red-500/30 text-red-200 border border-red-400/40'
                      : isModerate
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  }`}
                >
                  {localized?.displayName} · {result.confidence}%
                </span>
              </div>
            )}

            {/* Selected tile readout */}
            {selectedCell && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-white z-30 flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    (CLASS_STYLE[selectedCell.predictedClass] ?? CLASS_STYLE.healthy).dot
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {(CLASS_STYLE[selectedCell.predictedClass] ?? CLASS_STYLE.healthy).label} ·{' '}
                    {selectedCell.confidence}%
                  </p>
                  <p className="text-[10px] text-white/70">
                    Tile r{selectedCell.row}c{selectedCell.col} — {describePosition(selectedCell)} of
                    the map
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="ml-auto p-1 rounded-full hover:bg-white/20 shrink-0"
                  aria-label="Dismiss tile detail"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Frame dots */}
        {frames.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-20 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/15 pointer-events-auto">
              {frames.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentFrame === idx ? 'w-5 bg-[#a7e3b8]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to frame ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="p-3 sm:p-4 bg-[#f2f8f4] border-t-2 border-[#a7e3b8] flex flex-col gap-2.5 z-20 shrink-0">
        {!result ? (
          <p className="text-xs text-[#52796f] font-medium text-center py-2">
            {active?.status === 'analyzing'
              ? 'Running CropStressMamba v2 over the image tiles...'
              : 'No analysis yet — upload a drone image to classify it.'}
          </p>
        ) : (
          <>
            {/* Verdict header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    isSevere ? 'bg-red-600' : isModerate ? 'bg-amber-500' : 'bg-[#2d6a4f]'
                  }`}
                >
                  {isSevere ? (
                    <AlertTriangle className="w-4.5 h-4.5" />
                  ) : isModerate ? (
                    <ShieldAlert className="w-4.5 h-4.5" />
                  ) : (
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm sm:text-base text-[#012d1d]">
                      {localized?.displayName}
                    </h4>
                    <span
                      className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        isSevere
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-[#d8f3dc] text-[#1b4332] border-[#a7e3b8]'
                      }`}
                    >
                      {result.severity} {t('diagUi.risk')}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#52796f] font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                    <span>
                      {result.tiles.count} tiles • {result.confidence}% confidence •{' '}
                      {result.latencyMs}ms
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <ReadAloudButton
                  text={`${localized?.displayName} — ${result.confidence}%. ${localized?.diagnosis}`}
                  label="Read"
                />
                {onOpenFieldReport && (
                  <button
                    type="button"
                    onClick={onOpenFieldReport}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#eef7f2] border border-[#d8e8de] text-xs font-bold text-[#1b4332] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    📄 Report
                  </button>
                )}
                {active && (
                  <button
                    type="button"
                    onClick={() => removeFrame(active.id)}
                    className="px-2.5 py-1.5 rounded-full bg-white hover:bg-red-50 border border-[#d8e8de] hover:border-red-200 text-xs font-bold text-[#52796f] hover:text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Remove this frame"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Area split by classification */}
            {hasSpatialData ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[#52796f] tracking-wide">
                  Surveyed area by classification
                </span>
                <div className="flex w-full h-3 rounded-full overflow-hidden border border-[#d8e8de] bg-white">
                  {areaEntries(result.areaByClass)
                    .filter(([, v]) => v.tiles > 0)
                    .map(([cls, v]) => (
                      <div
                        key={cls}
                        className={(CLASS_STYLE[cls] ?? CLASS_STYLE.healthy).dot}
                        style={{ width: `${v.percent}%` }}
                        title={`${(CLASS_STYLE[cls] ?? CLASS_STYLE.healthy).label}: ${v.percent}%`}
                      />
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {areaEntries(result.areaByClass)
                    .filter(([, v]) => v.tiles > 0)
                    .map(([cls, v]) => (
                      <span
                        key={cls}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                          (CLASS_STYLE[cls] ?? CLASS_STYLE.healthy).chip
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            (CLASS_STYLE[cls] ?? CLASS_STYLE.healthy).dot
                          }`}
                        />
                        {(CLASS_STYLE[cls] ?? CLASS_STYLE.healthy).label} {v.percent}% ({v.tiles})
                      </span>
                    ))}
                </div>
                <p className="text-[10px] text-[#52796f]">
                  Share of analysed tiles, not hectares — this dataset has no flight GSD, so tiles
                  cannot be honestly converted to ground area.
                </p>
                <div className="pt-1">
                  <StressHeatmapLegend />
                </div>
              </div>
            ) : (
              // The backend answered but predates tileGrid/areaByClass — most
              // likely it's a server process that hasn't been restarted since
              // this feature was added. Say so rather than silently omitting
              // the spatial breakdown, which would look like a missing feature.
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <p className="text-[11px] text-amber-800">
                  This backend response has no spatial breakdown — the diagnosis engine likely
                  needs restarting to pick up the latest update. Stop and re-run{' '}
                  <code className="font-mono">backend/run_backend.bat</code>.
                </p>
              </div>
            )}

            {/* Affected zones */}
            {problemZones.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#d8e8de]">
                <span className="text-[10px] font-extrabold uppercase text-[#52796f] tracking-wide">
                  Affected zones ({problemZones.length}) — most confident first
                </span>
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto no-scrollbar">
                  {problemZones.slice(0, 8).map((cell) => {
                    const style = CLASS_STYLE[cell.predictedClass] ?? CLASS_STYLE.healthy;
                    return (
                      <button
                        key={`${cell.row}-${cell.col}`}
                        type="button"
                        onClick={() => setSelectedCell(cell)}
                        className="flex items-center gap-2 text-left px-2 py-1 rounded-lg bg-white border border-[#d8e8de] hover:border-[#2d6a4f] transition-colors cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                        <span className={`text-[11px] font-bold ${style.text}`}>{style.label}</span>
                        <span className="text-[11px] text-[#52796f]">
                          — {describePosition(cell)} of map
                        </span>
                        <span className="text-[10px] text-[#52796f] ml-auto font-mono">
                          {cell.confidence}%
                        </span>
                      </button>
                    );
                  })}
                </div>
                {problemZones.length > 8 && (
                  <p className="text-[10px] text-[#52796f]">
                    +{problemZones.length - 8} more — tap any tile on the map to inspect it.
                  </p>
                )}
              </div>
            )}

            {/* Findings + actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#d8e8de] shadow-2xs flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase text-[#52796f] tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Model finding</span>
                </span>
                <p className="text-[#191c1d] leading-relaxed font-medium text-xs">
                  {localized?.diagnosis}
                </p>
                <p className="text-[10px] text-[#52796f] mt-1">{localized?.severityReason}</p>
              </div>

              <div
                className={`p-3 rounded-xl border shadow-2xs flex flex-col gap-1 ${
                  isSevere
                    ? 'bg-red-50/80 border-red-200'
                    : isModerate
                    ? 'bg-amber-50/80 border-amber-200'
                    : 'bg-[#eef7f2] border-[#a7e3b8]'
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                    isSevere ? 'text-red-700' : isModerate ? 'text-amber-800' : 'text-[#2d6a4f]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('diagUi.recommendedNextSteps')}</span>
                </span>
                <ul className="flex flex-col gap-1 mt-0.5">
                  {localized?.recommendations.map((rec, i) => (
                    <li key={i} className="text-[11px] text-[#012d1d] leading-relaxed flex gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#2d6a4f] shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Limits — always visible, same contract as the diagnosis modal */}
            <div className="pt-2 border-t border-[#d8e8de] flex flex-col gap-1">
              <span className="text-[10px] font-extrabold uppercase text-[#8a5a00] tracking-wide flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>{t('diagUi.limitsTitle')}</span>
              </span>
              <ul className="flex flex-col gap-0.5">
                {localized?.caveats.map((c, i) => (
                  <li key={i} className="text-[10px] text-[#6b5220] leading-relaxed flex gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#8a5a00] shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
