/**
 * INSTINCT audio engine — public interface.
 *
 * A single engine abstraction that the UI talks to. It is backed by one of:
 *
 *   - `WebAudioEngine`  — always available in any modern browser. Uses
 *                         AudioContext + AudioWorkletNode for the mixer graph.
 *   - `CoreAudioEngine` — used only when INSTINCT is running inside Tauri.
 *                         Forwards to the Rust side (`src-tauri/src/audio.rs`)
 *                         which hosts cpal / coreaudio-rs and talks to the HAL.
 *
 * Both implementations honour this same interface, so the rest of the app —
 * TransportBar, Preferences, instrument audition, plug-in windows — never
 * branches on backend.
 */

export type SampleRate = 44100 | 48000 | 88200 | 96000 | 176400 | 192000;
export const SUPPORTED_SAMPLE_RATES: SampleRate[] = [
  44100, 48000, 88200, 96000, 176400, 192000
];

export type BitDepth = 16 | 24 | 32;
export const SUPPORTED_BIT_DEPTHS: BitDepth[] = [16, 24, 32];

export type BufferFrames = 32 | 64 | 128 | 256 | 512 | 1024;
export const SUPPORTED_BUFFER_SIZES: BufferFrames[] = [32, 64, 128, 256, 512, 1024];

export type AudioBackend =
  | "webaudio"    // AudioContext (browser / fallback)
  | "coreaudio"   // AVAudioEngine / HAL via cpal+coreaudio-rs (macOS desktop)
  | "wasapi"      // cpal WASAPI backend (Windows desktop — reserved)
  | "asio";       // cpal ASIO backend (Windows pro, reserved)

export interface AudioDevice {
  id: string;
  label: string;
  kind: "input" | "output" | "duplex";
  backend: AudioBackend;
  isDefault: boolean;
  channelCount: number;
  /** Sample rates the device natively supports, in Hz. */
  sampleRates: SampleRate[];
  /** The device's preferred / currently-negotiated buffer size in frames. */
  preferredBufferFrames: BufferFrames;
}

export interface MasterLevel {
  peak: number; // 0..1
  rms: number;  // 0..1
}

export interface VoiceOptions {
  /** MIDI note (0..127). */
  note: number;
  /** 0..1. Defaults to 0.8. */
  velocity?: number;
  /** Seconds. Defaults to 0.35. */
  duration?: number;
  /** Synth timbre. The WebAudio engine uses this to pick oscillator shape. */
  timbre?: "kick" | "snare" | "hat" | "clap" | "perc" | "bass" | "keys" | "pad" | "lead" | "strings" | "brass" | "fx";
  /** Linear gain multiplier on top of velocity. Defaults to 1. */
  gain?: number;
  /** Pan -1..1. Defaults to 0. */
  pan?: number;
}

export interface PluginEffect {
  /** Matches ArchitexureCategory. */
  category:
    | "dynamics"
    | "eq"
    | "reverb"
    | "delay"
    | "modulation"
    | "harmonics"
    | "saturation"
    | "metering"
    | "mic-modeling"
    | "mastering"
    | "utility"
    | "ai";
  /** Macro params 0..1. Interpretation depends on category. */
  params: Record<string, number>;
}

export interface EngineTransport {
  playing: boolean;
  metronome: boolean;
  tempoBpm: number;
  positionSec: number;
}

export interface AudioEngine {
  readonly backend: AudioBackend;

  /** Lazily initialise the engine. Safe to call repeatedly. */
  init(): Promise<void>;
  /** Stop streams, release nodes, suspend context. */
  dispose(): Promise<void>;

  // Configuration ----------------------------------------------------------
  listDevices(): Promise<AudioDevice[]>;
  getDevice(): Promise<string | null>;
  setDevice(deviceId: string): Promise<void>;

  getSampleRate(): SampleRate;
  setSampleRate(rate: SampleRate): Promise<void>;

  getBitDepth(): BitDepth;
  setBitDepth(depth: BitDepth): void;

  getBufferSize(): BufferFrames;
  setBufferSize(frames: BufferFrames): Promise<void>;

  // Transport --------------------------------------------------------------
  play(): Promise<void>;
  stop(): Promise<void>;
  setTempo(bpm: number): void;
  setMetronome(on: boolean): void;
  getTransport(): EngineTransport;

  // Monitoring -------------------------------------------------------------
  getMasterLevel(): MasterLevel;
  subscribeMasterLevel(listener: (l: MasterLevel) => void): () => void;

  // Instrument audition ---------------------------------------------------
  /** Fire a single voice on the audition bus. */
  audition(instrumentId: string, opts: VoiceOptions): void;
  /** Release all voices owned by a given instrument. */
  allNotesOff(instrumentId?: string): void;

  // Plug-in hosting -------------------------------------------------------
  /** Open / instantiate a plug-in on the master insert chain. */
  openPlugin(pluginId: string, effect: PluginEffect): Promise<string>;
  /** Tear down a plug-in instance. */
  closePlugin(instanceId: string): Promise<void>;
  /** Adjust a plug-in param live. */
  setPluginParam(instanceId: string, key: string, value: number): void;
}

/** Singleton accessor — constructed lazily so SSR never touches AudioContext. */
let _engine: AudioEngine | null = null;

export async function getEngine(): Promise<AudioEngine> {
  if (_engine) return _engine;
  // Defer imports so server-side rendering never pulls AudioContext.
  if (typeof window === "undefined") {
    throw new Error("AudioEngine is a client-only singleton.");
  }
  const isTauri = typeof (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== "undefined";
  if (isTauri) {
    const { CoreAudioEngine } = await import("./coreAudioBridge");
    _engine = new CoreAudioEngine();
  } else {
    const { WebAudioEngine } = await import("./webAudioEngine");
    _engine = new WebAudioEngine();
  }
  await _engine.init();
  return _engine;
}

/** Synchronous peek; returns null if not yet initialised. Useful for tests. */
export function peekEngine(): AudioEngine | null {
  return _engine;
}

export function __resetEngineForTest(next: AudioEngine | null = null): void {
  _engine = next;
}
