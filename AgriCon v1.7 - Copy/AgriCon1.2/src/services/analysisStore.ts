/**
 * Tiny shared store for completed field analyses.
 *
 * The orthomosaic viewer runs the analyses; the field report needs to print
 * them. They are siblings in App.tsx with no shared parent state, so rather
 * than restructure App.tsx (and risk breaking the other eight modals wired
 * through it), the viewer publishes here and the report subscribes.
 *
 * Deliberately not a context provider: that would mean editing App.tsx to add
 * a wrapper, and this is a single value read by exactly two components.
 * `useSyncExternalStore` is React's supported way to read an external store
 * and keeps both components in step without prop drilling.
 */
import { useSyncExternalStore } from 'react';
import type { DiagnosisResult } from './diagnosisApi';

export interface AnalyzedFrame {
  id: string;
  name: string;
  /** Object URL of the uploaded image; valid while the viewer holds it. */
  imageUrl: string;
  result: DiagnosisResult;
  analyzedAt: string;
}

let frames: AnalyzedFrame[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setAnalyzedFrames(next: AnalyzedFrame[]) {
  // New array identity every time, so useSyncExternalStore sees the change.
  frames = next;
  emit();
}

export function getAnalyzedFrames(): AnalyzedFrame[] {
  return frames;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the current analyses, re-rendering when they change. */
export function useAnalyzedFrames(): AnalyzedFrame[] {
  return useSyncExternalStore(subscribe, getAnalyzedFrames, getAnalyzedFrames);
}
