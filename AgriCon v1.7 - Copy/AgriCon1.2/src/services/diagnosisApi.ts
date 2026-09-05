/// <reference types="vite/client" />
/**
 * Client for the AgriCon diagnosis backend (backend/app.py).
 *
 * In dev, Vite proxies /api to the Python server on :8000 (see vite.config.ts),
 * so requests are same-origin and there is no CORS dance. Build-time override:
 * VITE_AGRICON_API. Packaged as a native app there is no dev-server proxy at
 * all, so the base URL is instead read at request time from apiConfig (which
 * falls back to VITE_AGRICON_API, then '') — see apiConfig.ts and the
 * "Backend address" field it renders when the app can't reach the backend.
 */
import { getApiBase } from './apiConfig';

/** Exactly the payload backend/app.py returns from POST /api/diagnose. */
export interface DiagnosisResult {
  predictedClass: 'healthy' | 'pest' | 'disease' | 'nutrient_deficiency';
  displayName: string;
  /** Real softmax probability as a percentage — not a decorative number. */
  confidence: number;
  severity: 'Low' | 'Moderate' | 'Critical';
  severityReason: string;
  /**
   * Share of the photo showing stress (tile vote share), as a percentage.
   * null for a single-tile image: extent cannot be measured from one tile,
   * and the segmentation head is not calibrated to fill that gap.
   */
  stressedAreaPercent: number | null;
  probabilities: Record<string, number>;
  /** Validated recall for the predicted class, or null if never validated. */
  validatedRecallForThisClass: number | null;
  diagnosis: string;
  recommendations: string[];
  /** Honest limits of this prediction. Always shown in the UI, never hidden. */
  caveats: string[];
  lowConfidence: boolean;
  latencyMs: number;
  tiles: { count: number; mode: string; stressedTiles: number | null };
  /**
   * Per-tile verdicts with positions as FRACTIONS of the image (0..1), so an
   * overlay can be drawn at any display size. This is what turns one answer
   * into a map of which part of the field is in trouble.
   */
  tileGrid: TileCell[];
  /** Share of surveyed area per class (share of analysed tiles, not hectares). */
  areaByClass: Record<string, { tiles: number; percent: number }>;
  filename?: string;
  sourcePixels?: { width: number; height: number };
}

export interface TileCell {
  row: number;
  col: number;
  /** All four are fractions of the image's width/height, in 0..1. */
  left: number;
  top: number;
  width: number;
  height: number;
  predictedClass: 'healthy' | 'pest' | 'disease' | 'nutrient_deficiency';
  confidence: number;
}

export interface ModelInfo {
  model: string;
  checkpoint: string;
  parametersMillions: number;
  inputSize: number;
  classes: string[];
  validation: {
    accuracy: number;
    valCrops: number;
    perClassRecall: Record<string, number | null>;
    note: string;
  };
  trainedOn: string;
}

export class DiagnosisApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'DiagnosisApiError';
  }
}

/** Is the backend up and did the model actually load? */
export async function checkHealth(): Promise<{ modelLoaded: boolean; error: string | null }> {
  try {
    const res = await fetch(`${getApiBase()}/api/health`);
    if (!res.ok) return { modelLoaded: false, error: `Backend returned ${res.status}` };
    const data = await res.json();
    return { modelLoaded: !!data.modelLoaded, error: data.error ?? null };
  } catch {
    return { modelLoaded: false, error: 'Cannot reach the diagnosis backend.' };
  }
}

export async function getModelInfo(): Promise<ModelInfo | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/model`);
    return res.ok ? ((await res.json()) as ModelInfo) : null;
  } catch {
    return null;
  }
}

/** Send one photo to CropStressMamba v2 and get a real diagnosis back. */
export async function diagnoseImage(file: File | Blob, filename = 'upload.jpg'): Promise<DiagnosisResult> {
  const form = new FormData();
  form.append('image', file, filename);

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}/api/diagnose`, { method: 'POST', body: form });
  } catch {
    throw new DiagnosisApiError(
      'Cannot reach the diagnosis backend. Make sure backend/run_backend.bat is running and, on ' +
        'a phone, that its address is set correctly in the panel above.',
    );
  }

  if (!res.ok) {
    let detail = `Diagnosis failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* response wasn't JSON; keep the status-based message */
    }
    throw new DiagnosisApiError(detail, res.status);
  }

  return (await res.json()) as DiagnosisResult;
}

/** Fetch a bundled sample image as a File so samples use the same real path as uploads. */
export async function fileFromUrl(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new DiagnosisApiError(`Could not load sample image (${res.status}).`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
