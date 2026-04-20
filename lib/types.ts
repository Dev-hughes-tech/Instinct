/**
 * INSTINCT — typed domain model.
 *
 * These types are intentionally engine-agnostic. They describe the *session*
 * shape as the UI sees it. A future audio engine can populate these same
 * shapes from a real DSP graph without any UI rework.
 */

export type TrackKind =
  | "audio"
  | "instrument"
  | "aux"
  | "master"
  | "vca"
  | "bus";

export type TrackColorKey =
  | "kick"
  | "snare"
  | "hats"
  | "perc"
  | "bass"
  | "keys"
  | "vox"
  | "fx";

/** A single rendered waveform clip on a track timeline. */
export interface WaveformClip {
  id: string;
  trackId: string;
  /** Start in beats (or seconds — UI is unit-agnostic for now). */
  start: number;
  length: number;
  /** Pre-rendered peak envelope sampled 0..1. */
  peaks: number[];
  label?: string;
  muted?: boolean;
}

/** A single insert slot — may or may not hold a plugin instance. */
export interface InsertSlot {
  id: string;
  index: number;
  pluginInstanceId?: string;
  bypassed?: boolean;
}

/** An aux send routed from a channel to an aux bus. */
export interface AuxSend {
  id: string;
  /** aux bus id — see MixerSession.auxBuses */
  busId: string;
  level: number; // 0..1
  preFader: boolean;
  enabled: boolean;
  label: string;
}

export interface MeterState {
  peak: number; // 0..1
  rms: number; // 0..1
  clip: boolean;
}

/** Channel-strip primitives shared between Edit integrated mixer + standalone mixer. */
export interface MixerStrip {
  id: string;
  trackId: string;
  label: string;
  colorKey: TrackColorKey | "master" | "aux";
  kind: TrackKind;
  inputLabel: string;
  outputLabel: string;
  trim: number; // -24..+24
  pan: number; // -1..1
  fader: number; // -inf..+12dB, stored as 0..1 linear
  mute: boolean;
  solo: boolean;
  record: boolean;
  phase: boolean;
  highpass: number; // Hz
  inserts: InsertSlot[];
  sends: AuxSend[];
  meter: MeterState;
}

export interface Track {
  id: string;
  index: number;
  name: string;
  kind: TrackKind;
  colorKey: TrackColorKey;
  armed: boolean;
  mute: boolean;
  solo: boolean;
  /** Insert slot ids (also live on the MixerStrip for convenience). */
  insertIds: string[];
  /** Waveform clips on this track's timeline. */
  clips: WaveformClip[];
  inputLabel: string;
  outputLabel: string;
}

export type PluginCategory =
  | "eq"
  | "compressor"
  | "channel-strip"
  | "saturation"
  | "reverb"
  | "delay"
  | "ai"
  | "utility";

export interface PluginDevice {
  id: string;
  name: string;
  vendor: string;
  category: PluginCategory;
  /** Which Architexure product family it belongs to. */
  family: "Architexure" | "Michael AI" | "Stock";
  /** Palette token — drives device-chassis color. */
  chassis:
    | "silver"
    | "champagne"
    | "obsidian"
    | "porcelain"
    | "holographic";
  accent: string; // hex
  version: string;
}

export interface PluginInstance {
  id: string;
  deviceId: string;
  trackId: string;
  parameters: Record<string, number>;
  presetName?: string;
}

export interface AuxBus {
  id: string;
  name: string;
  colorKey: "aux";
  strip: MixerStrip;
}

export interface MasterBus {
  id: string;
  name: string;
  strip: MixerStrip;
}

export interface InspectorState {
  selectedTrackId: string | null;
  selectedClipId: string | null;
  tool: "select" | "range" | "pencil" | "grabber" | "scrub";
  snap: boolean;
  grid: "1/4" | "1/8" | "1/16" | "1/32";
  automationVisible: boolean;
}

export interface TransportState {
  playing: boolean;
  recording: boolean;
  loop: boolean;
  metronome: boolean;
  positionBeats: number;
  tempoBpm: number;
  timeSig: [number, number];
}

export interface MichaelAIState {
  enabled: boolean;
  listening: boolean;
  mode: "Mixing" | "Arrangement" | "Mastering" | "Off";
  confidence: number; // 0..1
  lastSuggestion: string;
}

export interface Session {
  id: string;
  name: string;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  createdAt: string;
  tracks: Track[];
  plugins: PluginDevice[];
  pluginInstances: PluginInstance[];
  strips: MixerStrip[];
  auxBuses: AuxBus[];
  masterBus: MasterBus;
  transport: TransportState;
  inspector: InspectorState;
  ai: MichaelAIState;
}
