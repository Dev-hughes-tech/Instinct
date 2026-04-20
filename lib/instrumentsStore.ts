"use client";

/**
 * Local UI state for the Instruments page — selected instrument, preset,
 * MPC step patterns, active pad hit flashes, and sequencer transport.
 *
 * Kept separate from the main Session store because:
 *   - An instrument can be previewed without committing it to a track.
 *   - The pattern grid is a per-instrument UI concern; only the eventual
 *     rendered audio gets routed into a Session track insert.
 */

import { create } from "zustand";
import { INSTRUMENTS, type VirtualInstrument } from "./instruments";

export type Step = { on: boolean; accent: boolean; velocity: number };

/** 16 pads × 16 steps = 256 cells. */
export type PatternGrid = Step[][];

export interface PatternState {
  instrumentId: string;
  padCount: number; // 16
  stepCount: number; // 16
  grid: PatternGrid;
  swing: number; // 0..1
  bpm: number;
  running: boolean;
  playhead: number; // 0..stepCount-1
}

function emptyGrid(pads: number, steps: number): PatternGrid {
  return Array.from({ length: pads }, () =>
    Array.from({ length: steps }, () => ({ on: false, accent: false, velocity: 0.8 }))
  );
}

interface State {
  selectedId: string;
  selectedPresetIndex: number;
  hits: Record<string, number>; // padId -> expiry timestamp (ms)
  pattern: PatternState;

  selectInstrument: (id: string) => void;
  selectPreset: (index: number) => void;
  hitPad: (padId: string) => void;
  clearHit: (padId: string) => void;
  toggleStep: (padIdx: number, stepIdx: number) => void;
  accentStep: (padIdx: number, stepIdx: number) => void;
  clearPattern: () => void;
  setBpm: (n: number) => void;
  setSwing: (n: number) => void;
  startStop: () => void;
  tick: () => void;
}

function startPattern(inst: VirtualInstrument): PatternState {
  return {
    instrumentId: inst.id,
    padCount: inst.pads?.length ?? 16,
    stepCount: 16,
    grid: emptyGrid(inst.pads?.length ?? 16, 16),
    swing: 0,
    bpm: 96,
    running: false,
    playhead: 0
  };
}

export const useInstruments = create<State>((set) => ({
  selectedId: INSTRUMENTS[0]!.id,
  selectedPresetIndex: 0,
  hits: {},
  pattern: startPattern(INSTRUMENTS[0]!),

  selectInstrument: (id) =>
    set(() => {
      const inst = INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0]!;
      return {
        selectedId: inst.id,
        selectedPresetIndex: 0,
        hits: {},
        pattern: startPattern(inst)
      };
    }),
  selectPreset: (index) => set({ selectedPresetIndex: index }),
  hitPad: (padId) =>
    set((s) => ({ hits: { ...s.hits, [padId]: Date.now() + 180 } })),
  clearHit: (padId) =>
    set((s) => {
      const next = { ...s.hits };
      delete next[padId];
      return { hits: next };
    }),
  toggleStep: (padIdx, stepIdx) =>
    set((s) => {
      const grid = s.pattern.grid.map((row, pi) =>
        row.map((cell, si) =>
          pi === padIdx && si === stepIdx
            ? { ...cell, on: !cell.on, accent: cell.on ? false : cell.accent }
            : cell
        )
      );
      return { pattern: { ...s.pattern, grid } };
    }),
  accentStep: (padIdx, stepIdx) =>
    set((s) => {
      const grid = s.pattern.grid.map((row, pi) =>
        row.map((cell, si) =>
          pi === padIdx && si === stepIdx
            ? { ...cell, on: true, accent: !cell.accent }
            : cell
        )
      );
      return { pattern: { ...s.pattern, grid } };
    }),
  clearPattern: () =>
    set((s) => ({
      pattern: {
        ...s.pattern,
        grid: emptyGrid(s.pattern.padCount, s.pattern.stepCount)
      }
    })),
  setBpm: (n) =>
    set((s) => ({ pattern: { ...s.pattern, bpm: Math.round(Math.max(40, Math.min(220, n))) } })),
  setSwing: (n) =>
    set((s) => ({ pattern: { ...s.pattern, swing: Math.max(0, Math.min(1, n)) } })),
  startStop: () =>
    set((s) => ({
      pattern: {
        ...s.pattern,
        running: !s.pattern.running,
        playhead: 0
      }
    })),
  tick: () =>
    set((s) => {
      if (!s.pattern.running) return {};
      return {
        pattern: {
          ...s.pattern,
          playhead: (s.pattern.playhead + 1) % s.pattern.stepCount
        }
      };
    })
}));
