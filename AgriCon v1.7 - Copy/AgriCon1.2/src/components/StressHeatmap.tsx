import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TileCell } from '../services/diagnosisApi';

/**
 * Smooth stress-density overlay, drawn the way a precipitation radar map is
 * drawn rather than as a grid of coloured squares.
 *
 * Why not squares: the model classifies 160px tiles, but crop stress does not
 * stop at a tile boundary — the grid is an artefact of how the image was cut
 * up, not a feature of the field. Hard-edged cells read as though the model
 * knows exactly where a problem stops, which it does not. A continuous field
 * is both better looking and more honest about the resolution of the evidence.
 *
 * How it works: each tile becomes ONE PIXEL in a tiny offscreen canvas (a 6x6
 * grid is a 6x6 image), then that image is scaled up to the display size with
 * smoothing on. The browser's bilinear interpolation does the blending for
 * free, so values ramp smoothly between neighbouring tiles. A blur pass on top
 * softens the remaining bilinear diamond artefacts into the soft blobs the
 * radar look depends on.
 *
 *   - Hue carries the class (amber pest, red disease, purple nutrient).
 *   - Alpha carries confidence, so a tentative call washes out and a confident
 *     one saturates.
 *   - Healthy tiles are fully transparent, so clean canopy shows the actual
 *     imagery underneath — same convention as "no rain, no colour".
 */

/** RGB per class. Healthy has no colour because it renders as transparent. */
const CLASS_RGB: Record<string, [number, number, number]> = {
  healthy: [16, 185, 129],
  pest: [245, 158, 11],
  disease: [239, 68, 68],
  nutrient_deficiency: [168, 85, 247],
};

/** Supersampling factor for the intermediate canvas — smoother ramps. */
const UPSCALE = 64;

interface StressHeatmapProps {
  cells: TileCell[];
  /** Draw a highlight ring on this tile, if given. */
  selected?: TileCell | null;
  /** Called with the tile under a click, or null when clicking a healthy area. */
  onSelect?: (cell: TileCell | null) => void;
  /** Blur radius in px applied to the upscaled field. Higher = softer. */
  blur?: number;
  className?: string;
  /** Static render for print/report use: no pointer handling. */
  interactive?: boolean;
}

export const StressHeatmap: React.FC<StressHeatmapProps> = ({
  cells,
  selected,
  onSelect,
  blur = 18,
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || cells.length === 0) return;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Grid extent straight from the tile coordinates.
    const cols = Math.max(...cells.map((c) => c.col)) + 1;
    const rows = Math.max(...cells.map((c) => c.row)) + 1;

    // A single tile carries no spatial structure to interpolate, so it gets a
    // flat wash rather than a fake gradient implying variation we never measured.
    if (cols === 1 && rows === 1) {
      const cell = cells[0];
      if (cell.predictedClass !== 'healthy') {
        const [r, g, b] = CLASS_RGB[cell.predictedClass] ?? CLASS_RGB.disease;
        const a = 0.2 + 0.35 * (cell.confidence / 100);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(0, 0, w, h);
      }
      return;
    }

    // 1) One pixel per tile, in an offscreen image.
    const field = document.createElement('canvas');
    field.width = cols;
    field.height = rows;
    const fctx = field.getContext('2d');
    if (!fctx) return;
    const img = fctx.createImageData(cols, rows);

    for (const cell of cells) {
      const idx = (cell.row * cols + cell.col) * 4;
      const stressed = cell.predictedClass !== 'healthy';
      const [r, g, b] = CLASS_RGB[cell.predictedClass] ?? CLASS_RGB.healthy;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      // Confidence -> opacity. Healthy stays fully clear so the photo shows.
      img.data[idx + 3] = stressed ? Math.round(255 * (0.30 + 0.50 * (cell.confidence / 100))) : 0;
    }
    fctx.putImageData(img, 0, 0);

    // 2) Upscale with smoothing -> bilinear ramp between tile centres.
    const mid = document.createElement('canvas');
    mid.width = cols * UPSCALE;
    mid.height = rows * UPSCALE;
    const mctx = mid.getContext('2d');
    if (!mctx) return;
    mctx.imageSmoothingEnabled = true;
    mctx.imageSmoothingQuality = 'high';
    // Inset by half a tile: a tile's value belongs at its CENTRE, so the ramp
    // between two tiles should span centre-to-centre, not edge-to-edge.
    mctx.drawImage(
      field,
      0, 0, cols, rows,
      -UPSCALE / 2, -UPSCALE / 2,
      (cols + 1) * UPSCALE, (rows + 1) * UPSCALE,
    );

    // 3) Blur away the bilinear diamond edges into soft blobs.
    if (blur > 0 && 'filter' in ctx) {
      ctx.filter = `blur(${blur}px)`;
    }
    ctx.drawImage(mid, 0, 0, w, h);
    ctx.filter = 'none';

    // 4) Selection ring, drawn crisp on top of the blurred field.
    if (selected) {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(
        selected.left * w,
        selected.top * h,
        selected.width * w,
        selected.height * h,
      );
      ctx.setLineDash([]);
    }
  }, [cells, selected, blur]);

  useEffect(() => {
    draw();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onSelect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const hit = cells.find(
      (c) => fx >= c.left && fx < c.left + c.width && fy >= c.top && fy < c.top + c.height,
    );
    onSelect(hit ?? null);
  };

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      className={`absolute inset-0 ${interactive ? 'cursor-crosshair' : ''} ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        // Canvas colours are dropped by default when printing; this keeps the
        // heatmap visible in the PDF the report exports.
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
      />
    </div>
  );
};

/**
 * An image with the stress field laid over it, aligned to the pixels.
 *
 * The alignment is the whole point of this component. The image is displayed
 * "contain"-fitted, so unless its aspect ratio happens to match its box it is
 * letterboxed — and an overlay stretched across the *container* then spills
 * onto the empty bars beside the photo, painting stress onto ground that
 * isn't in the picture. So the fitted rectangle is computed here and both the
 * image and the canvas are placed on exactly that rectangle.
 *
 * Done in JS rather than with `max-width/max-height` CSS because a
 * percentage max-height against an indefinite-height flex item is exactly the
 * case browsers disagree on; measuring is deterministic.
 */
export const HeatmapImage: React.FC<{
  src: string;
  alt: string;
  cells: TileCell[];
  showOverlay?: boolean;
  selected?: TileCell | null;
  onSelect?: (cell: TileCell | null) => void;
  interactive?: boolean;
  blur?: number;
  imgClassName?: string;
}> = ({
  src,
  alt,
  cells,
  showOverlay = true,
  selected,
  onSelect,
  interactive = true,
  blur,
  imgClassName = '',
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fit, setFit] = useState<{ left: number; top: number; w: number; h: number } | null>(null);

  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!box || !natural) return;
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    if (!cw || !ch) return;
    // "contain" fit: scale to the tighter of the two axes.
    const scale = Math.min(cw / natural.w, ch / natural.h);
    const w = natural.w * scale;
    const h = natural.h * scale;
    setFit({ left: (cw - w) / 2, top: (ch - h) / 2, w, h });
  }, [natural]);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div ref={boxRef} className="absolute inset-0">
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          const el = e.currentTarget;
          setNatural({ w: el.naturalWidth || 1, h: el.naturalHeight || 1 });
        }}
        className={`absolute ${imgClassName}`}
        style={
          fit
            ? { left: fit.left, top: fit.top, width: fit.w, height: fit.h }
            : { inset: 0, width: '100%', height: '100%', objectFit: 'contain' }
        }
      />
      {showOverlay && fit && cells.length > 0 && (
        <div
          className="absolute"
          style={{ left: fit.left, top: fit.top, width: fit.w, height: fit.h }}
        >
          <StressHeatmap
            cells={cells}
            selected={selected}
            onSelect={onSelect}
            interactive={interactive}
            blur={blur}
          />
        </div>
      )}
    </div>
  );
};

/** Shared legend for the density ramp. */
export const StressHeatmapLegend: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`flex items-center gap-3 flex-wrap ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
    {(
      [
        ['disease', 'Disease'],
        ['pest', 'Pest'],
        ['nutrient_deficiency', 'Nutrient'],
      ] as const
    ).map(([cls, label]) => {
      const [r, g, b] = CLASS_RGB[cls];
      return (
        <span key={cls} className="flex items-center gap-1.5 font-bold text-[#52796f]">
          <span
            className="w-10 h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, rgba(${r},${g},${b},0.15), rgba(${r},${g},${b},0.85))`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
          {label}
        </span>
      );
    })}
    <span className="text-[#8a9b92] font-medium">Intensity = model confidence · clear = healthy</span>
  </div>
);
