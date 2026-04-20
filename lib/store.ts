"use client";

import { create } from "zustand";
import type { Session } from "./types";
import { buildSession, mockSession } from "./mockData";

interface InstinctState {
  session: Session;
  // Transport
  togglePlay: () => void;
  toggleRecord: () => void;
  toggleLoop: () => void;
  toggleMetronome: () => void;
  setTempo: (bpm: number) => void;
  // Selection
  selectTrack: (trackId: string | null) => void;
  selectClip: (clipId: string | null) => void;
  // Strip
  setStripFader: (stripId: string, value: number) => void;
  setStripPan: (stripId: string, value: number) => void;
  toggleStripMute: (stripId: string) => void;
  toggleStripSolo: (stripId: string) => void;
  // Inspector
  setTool: (tool: Session["inspector"]["tool"]) => void;
  toggleSnap: () => void;
  // AI
  toggleAI: () => void;
  setAIMode: (mode: Session["ai"]["mode"]) => void;
  // Utility
  reset: () => void;
}

export const useInstinct = create<InstinctState>((set) => ({
  session: mockSession,

  togglePlay: () =>
    set((s) => ({
      session: {
        ...s.session,
        transport: { ...s.session.transport, playing: !s.session.transport.playing }
      }
    })),
  toggleRecord: () =>
    set((s) => ({
      session: {
        ...s.session,
        transport: { ...s.session.transport, recording: !s.session.transport.recording }
      }
    })),
  toggleLoop: () =>
    set((s) => ({
      session: {
        ...s.session,
        transport: { ...s.session.transport, loop: !s.session.transport.loop }
      }
    })),
  toggleMetronome: () =>
    set((s) => ({
      session: {
        ...s.session,
        transport: { ...s.session.transport, metronome: !s.session.transport.metronome }
      }
    })),
  setTempo: (bpm) =>
    set((s) => ({
      session: {
        ...s.session,
        transport: { ...s.session.transport, tempoBpm: bpm }
      }
    })),

  selectTrack: (trackId) =>
    set((s) => ({
      session: {
        ...s.session,
        inspector: { ...s.session.inspector, selectedTrackId: trackId }
      }
    })),
  selectClip: (clipId) =>
    set((s) => ({
      session: {
        ...s.session,
        inspector: { ...s.session.inspector, selectedClipId: clipId }
      }
    })),

  setStripFader: (stripId, value) =>
    set((s) => ({
      session: {
        ...s.session,
        strips: s.session.strips.map((strip) =>
          strip.id === stripId ? { ...strip, fader: value } : strip
        )
      }
    })),
  setStripPan: (stripId, value) =>
    set((s) => ({
      session: {
        ...s.session,
        strips: s.session.strips.map((strip) =>
          strip.id === stripId ? { ...strip, pan: value } : strip
        )
      }
    })),
  toggleStripMute: (stripId) =>
    set((s) => ({
      session: {
        ...s.session,
        strips: s.session.strips.map((strip) =>
          strip.id === stripId ? { ...strip, mute: !strip.mute } : strip
        )
      }
    })),
  toggleStripSolo: (stripId) =>
    set((s) => ({
      session: {
        ...s.session,
        strips: s.session.strips.map((strip) =>
          strip.id === stripId ? { ...strip, solo: !strip.solo } : strip
        )
      }
    })),

  setTool: (tool) =>
    set((s) => ({
      session: {
        ...s.session,
        inspector: { ...s.session.inspector, tool }
      }
    })),
  toggleSnap: () =>
    set((s) => ({
      session: {
        ...s.session,
        inspector: { ...s.session.inspector, snap: !s.session.inspector.snap }
      }
    })),

  toggleAI: () =>
    set((s) => ({
      session: {
        ...s.session,
        ai: { ...s.session.ai, enabled: !s.session.ai.enabled }
      }
    })),
  setAIMode: (mode) =>
    set((s) => ({
      session: {
        ...s.session,
        ai: { ...s.session.ai, mode }
      }
    })),

  reset: () => set({ session: buildSession() })
}));
