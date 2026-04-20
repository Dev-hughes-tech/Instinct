/**
 * Zustand store exposing engine state + actions to React.
 *
 * The engine itself is lazily constructed on the first user gesture (required
 * by browsers for AudioContext). The store lets components subscribe to
 * changes without re-rendering every time the master meter updates.
 */

"use client";

import { create } from "zustand";
import {
  SUPPORTED_BIT_DEPTHS,
  SUPPORTED_BUFFER_SIZES,
  SUPPORTED_SAMPLE_RATES,
  getEngine,
  type AudioBackend,
  type AudioDevice,
  type BitDepth,
  type BufferFrames,
  type MasterLevel,
  type SampleRate,
  type VoiceOptions
} from "./engine";

interface AudioStoreState {
  ready: boolean;
  backend: AudioBackend;
  devices: AudioDevice[];
  deviceId: string | null;
  sampleRate: SampleRate;
  bitDepth: BitDepth;
  bufferSize: BufferFrames;
  masterLevel: MasterLevel;
  transportPlaying: boolean;
  metronome: boolean;
  tempoBpm: number;
  supportedSampleRates: SampleRate[];
  supportedBitDepths: BitDepth[];
  supportedBufferSizes: BufferFrames[];
  lastError: string | null;

  start: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  setDevice: (id: string) => Promise<void>;
  setSampleRate: (rate: SampleRate) => Promise<void>;
  setBitDepth: (depth: BitDepth) => void;
  setBufferSize: (frames: BufferFrames) => Promise<void>;
  play: () => Promise<void>;
  stop: () => Promise<void>;
  setMetronome: (on: boolean) => void;
  setTempo: (bpm: number) => void;
  audition: (instrumentId: string, opts: VoiceOptions) => Promise<void>;
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  ready: false,
  backend: "webaudio",
  devices: [],
  deviceId: null,
  sampleRate: 48000,
  bitDepth: 24,
  bufferSize: 128,
  masterLevel: { peak: 0, rms: 0 },
  transportPlaying: false,
  metronome: false,
  tempoBpm: 92,
  supportedSampleRates: SUPPORTED_SAMPLE_RATES,
  supportedBitDepths: SUPPORTED_BIT_DEPTHS,
  supportedBufferSizes: SUPPORTED_BUFFER_SIZES,
  lastError: null,

  start: async () => {
    if (get().ready) return;
    try {
      const engine = await getEngine();
      const devices = await engine.listDevices();
      const deviceId = await engine.getDevice();
      engine.subscribeMasterLevel((level) => set({ masterLevel: level }));
      set({
        ready: true,
        backend: engine.backend,
        devices,
        deviceId,
        sampleRate: engine.getSampleRate(),
        bitDepth: engine.getBitDepth(),
        bufferSize: engine.getBufferSize(),
        tempoBpm: engine.getTransport().tempoBpm,
        lastError: null
      });
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : String(err) });
    }
  },

  refreshDevices: async () => {
    try {
      const engine = await getEngine();
      const devices = await engine.listDevices();
      set({ devices });
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : String(err) });
    }
  },

  setDevice: async (id) => {
    const engine = await getEngine();
    await engine.setDevice(id);
    set({ deviceId: id });
  },

  setSampleRate: async (rate) => {
    const engine = await getEngine();
    await engine.setSampleRate(rate);
    set({ sampleRate: engine.getSampleRate() });
  },

  setBitDepth: (depth) => {
    void getEngine().then((engine) => engine.setBitDepth(depth));
    set({ bitDepth: depth });
  },

  setBufferSize: async (frames) => {
    const engine = await getEngine();
    await engine.setBufferSize(frames);
    set({ bufferSize: engine.getBufferSize() });
  },

  play: async () => {
    await get().start();
    const engine = await getEngine();
    await engine.play();
    set({ transportPlaying: true });
  },
  stop: async () => {
    const engine = await getEngine();
    await engine.stop();
    set({ transportPlaying: false });
  },

  setMetronome: (on) => {
    void getEngine().then((engine) => engine.setMetronome(on));
    set({ metronome: on });
  },
  setTempo: (bpm) => {
    void getEngine().then((engine) => engine.setTempo(bpm));
    set({ tempoBpm: bpm });
  },

  audition: async (instrumentId, opts) => {
    await get().start();
    const engine = await getEngine();
    engine.audition(instrumentId, opts);
  }
}));
