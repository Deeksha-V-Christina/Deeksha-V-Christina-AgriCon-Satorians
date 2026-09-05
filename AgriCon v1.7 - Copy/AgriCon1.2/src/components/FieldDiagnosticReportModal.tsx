import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  FileText,
  AlertTriangle,
  Layers,
  Scan,
  Share2,
  Info,
  Inbox,
} from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { HeatmapImage, StressHeatmapLegend } from './StressHeatmap';
import { useAnalyzedFrames, type AnalyzedFrame } from '../services/analysisStore';
import { getModelInfo, type ModelInfo, type TileCell } from '../services/diagnosisApi';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeDiagnosis, getClassLabel, type PredictedClass } from '../i18n/diagnosisText';

interface FieldDiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AreaEntry = { tiles: number; percent: number };

/** See the note in DroneOrthomosaicViewer: this project has no @types/react. */
function areaEntries(area: Record<string, AreaEntry>): [string, AreaEntry][] {
  return Object.entries(area ?? {}) as [string, AreaEntry][];
}

const CLASS_DOT: Record<string, string> = {
  healthy: 'bg-emerald-500',
  pest: 'bg-amber-500',
  disease: 'bg-red-500',
  nutrient_deficiency: 'bg-purple-500',
};

function describePosition(cell: TileCell): string {
  const cx = cell.left + cell.width / 2;
  const cy = cell.top + cell.height / 2;
  const v = cy < 0.34 ? 'top' : cy < 0.67 ? 'middle' : 'bottom';
  const h = cx < 0.34 ? 'left' : cx < 0.67 ? 'centre' : 'right';
  return v === 'middle' && h === 'centre' ? 'centre' : `${v} ${h}`;
}

function stressedPercentOf(frame: AnalyzedFrame): number {
  return areaEntries(frame.result.areaByClass)
    .filter(([k]) => k !== 'healthy')
    .reduce((sum: number, [, v]) => sum + v.percent, 0);
}

export const FieldDiagnosticReportModal: React.FC<FieldDiagnosticReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const frames = useAnalyzedFrames();
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  // Model provenance is part of the report: a printed diagnostic that doesn't
  // say which model produced it, and how well that model scored, isn't
  // auditable by whoever acts on it.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      const info = await getModelInfo();
      if (!cancelled) setModelInfo(info);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Mark the document while the report is open so the print stylesheet can
  // hide everything except this modal. Without it the whole app page behind
  // the modal prints first and the report starts several pages in.
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('printing-report');
    return () => document.body.classList.remove('printing-report');
  }, [isOpen]);

  const { language, t } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AgriCon Field Diagnostic Report',
          text: `Analysis of ${frames.length} frame(s) by CropStressMamba v2.`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      /* user dismissed the share sheet; nothing to recover from */
    }
  };

  // ---- Real aggregate figures, computed from actual model output ----
  const totalTiles = frames.reduce((n, f) => n + (f.result.tiles?.count ?? 0), 0);
  const totalsByClass: Record<string, number> = {};
  frames.forEach((f) =>
    areaEntries(f.result.areaByClass).forEach(([cls, v]) => {
      totalsByClass[cls] = (totalsByClass[cls] ?? 0) + v.tiles;
    }),
  );
  const stressedTiles = Object.entries(totalsByClass)
    .filter(([k]) => k !== 'healthy')
    .reduce((n, [, v]) => n + v, 0);
  const overallStressedPct = totalTiles ? (stressedTiles / totalTiles) * 100 : 0;
  const criticalFrames = frames.filter((f) => f.result.severity === 'Critical').length;

  const firstAnalysis = frames.length
    ? new Date(Math.min(...frames.map((f) => new Date(f.analyzedAt).getTime())))
    : null;
  // Report ID derived from the actual analysis time, not a decorative constant.
  const reportId = firstAnalysis
    ? `AGC-${firstAnalysis.toISOString().slice(0, 10).replace(/-/g, '')}-${String(frames.length).padStart(2, '0')}`
    : null;

  const summarySpeech = frames.length
    ? `Field report. ${frames.length} frame${frames.length > 1 ? 's' : ''} analysed, ${totalTiles} tiles. ${overallStressedPct.toFixed(0)} percent of the surveyed area shows stress. ${criticalFrames} frame${criticalFrames === 1 ? '' : 's'} rated critical.`
    : 'No analyses yet.';

  // Rendered through a portal onto <body>, not inside the app tree.
  //
  // Printing is the reason. The report has to escape `position: fixed`, or
  // the browser paints it once per page clipped to the viewport -- which is
  // how this report was previously printing three identical pages that each
  // stopped partway through, losing the limits section and the footer
  // entirely. But un-fixing it inside the app tree makes it flow *after* the
  // whole page behind it, and that page's `min-h-screen` container keeps its
  // height whatever is done to it, adding blank trailing pages.
  //
  // As a direct child of <body> the report can simply be the only thing
  // printed: the stylesheet hides #root outright (see index.css), no
  // visibility tricks, no phantom pages.
  return createPortal(
    <div className="print-report-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:block overflow-y-auto">
      <div className="print-report-modal-card bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl shadow-2xl flex flex-col max-w-5xl overflow-hidden print:w-full print:h-auto print:shadow-none print:rounded-none print:max-h-none print:block print:overflow-visible">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#d8e8de] flex items-center justify-between shrink-0 print:hidden z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#012d1d] flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-[#a7e3b8]" />
            </div>
            <div>
              <h2 className="font-black text-[#012d1d] text-lg leading-tight">
                Field Diagnostic Report
              </h2>
              <p className="text-xs text-[#52796f] font-medium hidden sm:block">
                {frames.length
                  ? `${frames.length} analysed frame${frames.length > 1 ? 's' : ''} · CropStressMamba v2`
                  : 'No analyses yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {frames.length > 0 && <ReadAloudButton text={summarySpeech} label="Read" />}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-black/5 text-[#012d1d] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 bg-white print:overflow-visible print:h-auto print:max-h-none print:flex-none print:block">
          {frames.length === 0 ? (
            // Honest empty state. The previous version printed a full report
            // built from mock frames whether or not anything had been analysed,
            // which would put invented figures on paper.
            <div className="p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[50vh]">
              <div className="w-14 h-14 rounded-2xl bg-[#f4f9f6] border border-[#d8e8de] flex items-center justify-center">
                <Inbox className="w-6 h-6 text-[#52796f]" />
              </div>
              <h3 className="font-black text-[#012d1d] text-lg">Nothing analysed yet</h3>
              <p className="text-sm text-[#52796f] max-w-sm leading-relaxed">
                This report prints real model output only. Upload drone imagery in{' '}
                <span className="font-bold text-[#012d1d]">Drone Orthomosaic Analysis</span>, then
                reopen this report — every figure below is computed from those results.
              </p>
            </div>
          ) : (
            <div
              className="print-report-document p-4 sm:p-8 flex flex-col gap-8 max-w-4xl mx-auto"
              ref={printContentRef}
            >
              {/* 1. SUMMARY — every number here is measured */}
              <div className="flex flex-col gap-4 bg-[#f4f9f6] p-6 rounded-2xl border border-[#d8e8de] print:bg-white print:border-none print:p-0">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-black text-[#012d1d] uppercase tracking-tight">
                      Field Survey Summary
                    </h1>
                    <p className="text-[#52796f] text-sm mt-1">
                      Automated canopy classification · CropStressMamba v2
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d8f3dc] text-[#1b4332] rounded-full text-xs font-bold uppercase tracking-wide print:border print:border-[#1b4332]">
                    <Scan className="w-3.5 h-3.5" /> {frames.length} frame
                    {frames.length > 1 ? 's' : ''} analysed
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-white p-3 rounded-xl border border-[#d8e8de] flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#52796f]">
                      Stressed area
                    </span>
                    <span className="text-lg font-black text-[#012d1d]">
                      {overallStressedPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-[#52796f]">of analysed tiles</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#d8e8de] flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#52796f]">
                      Tiles analysed
                    </span>
                    <span className="text-lg font-black text-[#012d1d]">{totalTiles}</span>
                    <span className="text-[9px] text-[#52796f]">
                      {stressedTiles} flagged
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#d8e8de] flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#52796f]">
                      Critical frames
                    </span>
                    <span
                      className={`text-lg font-black ${
                        criticalFrames > 0 ? 'text-red-600' : 'text-[#012d1d]'
                      }`}
                    >
                      {criticalFrames}
                    </span>
                    <span className="text-[9px] text-[#52796f]">of {frames.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#d8e8de] flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#52796f]">
                      Survey date
                    </span>
                    <span className="text-sm font-black text-[#012d1d] mt-auto whitespace-nowrap">
                      {firstAnalysis?.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Aggregate split across every frame */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#52796f] tracking-wide">
                    {t('report.combinedArea')}
                  </span>
                  <div
                    className="flex w-full h-3 rounded-full overflow-hidden border border-[#d8e8de] bg-white"
                    style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {Object.entries(totalsByClass)
                      .filter(([, tiles]) => tiles > 0)
                      .map(([cls, tiles]) => (
                        <div
                          key={cls}
                          className={CLASS_DOT[cls] ?? 'bg-emerald-500'}
                          style={{ width: `${(tiles / Math.max(1, totalTiles)) * 100}%` }}
                          title={`${getClassLabel(language, cls as PredictedClass)}: ${tiles} tiles`}
                        />
                      ))}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {Object.entries(totalsByClass)
                      .filter(([, tiles]) => tiles > 0)
                      .map(([cls, tiles]) => (
                        <span
                          key={cls}
                          className="text-[10px] font-bold text-[#012d1d] flex items-center gap-1.5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${CLASS_DOT[cls] ?? 'bg-emerald-500'}`}
                            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          />
                          {getClassLabel(language, cls as PredictedClass)} — {tiles} tiles (
                          {((tiles / Math.max(1, totalTiles)) * 100).toFixed(1)}%)
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* 2. PER-FRAME DETAIL */}
              <div className="flex flex-col gap-10">
                {frames.map((frame, index) => {
                  const r = frame.result;
                  const localized = localizeDiagnosis(language, r);
                  const stressedPct = stressedPercentOf(frame);
                  const zones = (r.tileGrid ?? [])
                    .filter((c) => c.predictedClass !== 'healthy')
                    .sort((a, b) => b.confidence - a.confidence);

                  return (
                    <div
                      key={frame.id}
                      className="flex flex-col gap-4 print-avoid-break print:break-inside-avoid"
                    >
                      <div className="flex items-center justify-between border-b-2 border-[#a7e3b8] pb-2 gap-3 flex-wrap">
                        <h3 className="text-lg font-black text-[#012d1d] flex items-center gap-2 min-w-0">
                          <Scan className="w-5 h-5 text-[#2d6a4f] shrink-0" />
                          <span className="truncate">
                            Frame {index + 1}
                            <span className="text-[#52796f] text-sm font-medium ml-2">
                              {frame.name}
                            </span>
                          </span>
                        </h3>
                        <div className="flex items-center gap-3 text-sm font-bold">
                          <span className="text-[#012d1d]">{r.confidence}% confidence</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs uppercase ${
                              r.severity === 'Critical'
                                ? 'bg-red-100 text-red-700'
                                : r.severity === 'Moderate'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          >
                            {localized.displayName} · {r.severity}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Image + density overlay */}
                        <div className="md:col-span-5 flex flex-col gap-2">
                          <div className="rounded-xl overflow-hidden border-2 border-[#1b4332] aspect-[4/3] bg-[#1a2e22] relative">
                            <HeatmapImage
                              src={frame.imageUrl}
                              alt={frame.name}
                              cells={r.tileGrid ?? []}
                              interactive={false}
                            />
                          </div>
                          <StressHeatmapLegend compact />
                        </div>

                        {/* Findings */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                          <div className="bg-[#f4f9f6] p-4 rounded-xl border border-[#d8e8de] print:bg-white">
                            <h4 className="font-extrabold text-[#012d1d] text-sm flex items-center gap-1.5 mb-2">
                              <Layers className="w-4 h-4 text-[#2d6a4f]" /> {t('report.classification')}
                            </h4>
                            <p className="text-xs text-[#191c1d] leading-relaxed">{localized.diagnosis}</p>
                            <p className="text-[11px] text-[#52796f] mt-1.5">{localized.severityReason}</p>

                            <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-[#d8e8de]">
                              <span className="text-[11px] font-bold text-[#012d1d]">
                                {stressedPct.toFixed(1)}% stressed
                              </span>
                              <span className="text-[11px] text-[#52796f]">
                                {r.tiles?.count ?? 0} tiles
                              </span>
                              {areaEntries(r.areaByClass)
                                .filter(([, v]) => v.tiles > 0)
                                .map(([cls, v]) => (
                                  <span
                                    key={cls}
                                    className="text-[10px] font-bold text-[#012d1d] flex items-center gap-1"
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        CLASS_DOT[cls] ?? 'bg-emerald-500'
                                      }`}
                                      style={{
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact',
                                      }}
                                    />
                                    {getClassLabel(language, cls as PredictedClass)} {v.percent}%
                                  </span>
                                ))}
                            </div>
                          </div>

                          {zones.length > 0 && (
                            <div className="bg-white p-3 rounded-xl border border-[#d8e8de]">
                              <h4 className="font-extrabold text-[#012d1d] text-xs uppercase tracking-wide mb-1.5">
                                {t('report.affectedZones')} ({zones.length})
                              </h4>
                              <div className="flex flex-col gap-1">
                                {zones.slice(0, 6).map((cell) => (
                                  <div
                                    key={`${cell.row}-${cell.col}`}
                                    className="flex items-center gap-2 text-[11px]"
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        CLASS_DOT[cell.predictedClass] ?? 'bg-emerald-500'
                                      }`}
                                      style={{
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact',
                                      }}
                                    />
                                    <span className="font-bold text-[#012d1d]">
                                      {getClassLabel(language, cell.predictedClass)}
                                    </span>
                                    <span className="text-[#52796f]">
                                      — {describePosition(cell)} of frame
                                    </span>
                                    <span className="ml-auto font-mono text-[10px] text-[#52796f]">
                                      {cell.confidence}%
                                    </span>
                                  </div>
                                ))}
                                {zones.length > 6 && (
                                  <p className="text-[10px] text-[#52796f] mt-0.5">
                                    +{zones.length - 6} {t('report.furtherFlagged')}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="bg-[#eef7f2] p-3 rounded-xl border border-[#a7e3b8] print:bg-white">
                            <h4 className="font-extrabold text-[#012d1d] text-xs uppercase tracking-wide mb-1.5">
                              {t('diagUi.recommendedNextSteps')}
                            </h4>
                            <ul className="flex flex-col gap-1">
                              {localized.recommendations.map((rec, i) => (
                                <li
                                  key={i}
                                  className="text-[11px] text-[#012d1d] leading-relaxed flex gap-1.5"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#2d6a4f] shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. LIMITS — printed, not hidden behind a tooltip */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-2 print-avoid-break print:break-inside-avoid">
                <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> {t('report.limitsOfReport')}
                </h4>
                <ul className="flex flex-col gap-1">
                  {Array.from(
                    new Set(frames.flatMap((f) => localizeDiagnosis(language, f.result).caveats))
                  ).map((c, i) => (
                    <li key={i} className="text-[11px] text-amber-900 leading-relaxed flex gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-700 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                  <li className="text-[11px] text-amber-900 leading-relaxed flex gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-700 shrink-0" />
                    <span>{t('report.percentageNote')}</span>
                  </li>
                  <li className="text-[11px] text-amber-900 leading-relaxed flex gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-700 shrink-0" />
                    <span>{t('report.recommendationsNote')}</span>
                  </li>
                </ul>
              </div>

              {/* 4. PROVENANCE */}
              <div className="pt-4 border-t border-[#d8e8de] flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-[#52796f] gap-3 print-avoid-break">
                <div>
                  <p className="font-bold text-[#012d1d]">
                    Generated by AgriCon · {modelInfo?.model ?? 'CropStressMamba v2'}
                  </p>
                  {modelInfo ? (
                    <p className="text-[10px]">
                      {modelInfo.checkpoint} · {modelInfo.parametersMillions}M params · validation
                      accuracy {(modelInfo.validation.accuracy * 100).toFixed(1)}% on{' '}
                      {modelInfo.validation.valCrops} held-out crops
                    </p>
                  ) : (
                    <p className="text-[10px]">Model metadata unavailable (backend not reachable)</p>
                  )}
                </div>
                <div className="text-right">
                  <p>
                    Analysed:{' '}
                    {firstAnalysis?.toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {reportId && (
                    <p className="text-[10px] uppercase tracking-widest font-mono">
                      ID: {reportId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action tray */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#d8e8de] flex flex-wrap sm:flex-nowrap justify-center sm:justify-between items-center gap-3 print:hidden sticky bottom-0 w-full z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#52796f]">
            {frames.length > 0 ? (
              <span>Print or save this report as a PDF for offline access.</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Analyse imagery first — there is nothing to print yet.
              </span>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={frames.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-[#d8f3dc] hover:bg-[#a7e3b8] text-[#012d1d] font-extrabold text-xs shadow-sm transition-all cursor-pointer border border-[#a7e3b8] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={frames.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer border border-[#388e66] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-white hover:bg-[#f4f7f5] text-[#012d1d] font-extrabold text-xs shadow-sm transition-all cursor-pointer border border-[#d8e8de]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
