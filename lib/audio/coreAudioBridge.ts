/**
 * CoreAudio bridge — runs only inside the Tauri desktop shell.
 *
 * Every method here is a thin wrapper around a Tauri command implemented in
 * `src-tauri/src/audio.rs`. The Rust side owns the real stream (via
 * cpal + coreaudio-rs on macOS), so this class mainly forwards calls and
 * mirrors enough state locally that the UI can stay synchronous.
 *
 * When running outside Tauri the `engine.ts` factory picks `WebAudioEngine`
 * instead, so this file never has to fall back itself.
 */

import {
  type AudioBackend,
  type AudioDevice,
  type AudioEngine,
  type BitDepth,
  type BufferFrames,
  type EngineTransport,
  type MasterLevel,
  type PluginEffect,
  type SampleRate,
  type VoiceOptions
} from "./engine";

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

function getInvoke(): InvokeFn {
  const w = window as unknown as {
    __TAURI__?: { core?: { invoke: InvokeFn }; invoke?: InvokeFn };
    __TAURI_INTERNALS__?: { invoke: InvokeFn };
  };
  const invoke = w.__TAURI_INTERNALS__?.invoke || w.__TAURI__?.core?.invoke || w.__TAURI__?.invoke;
  if (!invoke) throw new Error("Tauri invoke bridge is unavailable.");
  return invoke;
}

export class CoreAudioEngine implements AudioEngine {
  readonly backend: AudioBackend = "coreaudio";

  private sampleRate: SampleRate = 48000;
  private bitDepth: BitDepth = 24;
  private bufferSize: BufferFrames = 128;
  private deviceId: string | null = null;
  private transport: EngineTransport = {
    playing: false,
    metronome: false,
    tempoBpm: 92,
    positionSec: 0
  };
  private levelListeners = new Set<(l: MasterLevel) => void>();
  private lastLevel: MasterLevel = { peak: 0, rms: 0 };
  private levelPoll: number | null = null;

  async init(): Promise<void> {
    const invoke = getInvoke();
    const snapshot = await invoke<{
      sampleRate: number;
      bitDepth: number;
      bufferSize: number;
      deviceId: string | null;
    }>("audio_get_state").catch(() => ({
      sampleRate: 48000,
      bitDepth: 24,
      bufferSize: 128,
      deviceId: null as string | null
    }));
    this.sampleRate = (snapshot.sampleRate as SampleRate) ?? 48000;
    this.bitDepth = (snapshot.bitDepth as BitDepth) ?? 24;
    this.bufferSize = (snapshot.bufferSize as BufferFrames) ?? 128;
    this.deviceId = snapshot.deviceId;
    this.startLevelPoll();
  }

  async dispose(): Promise<void> {
    this.stopLevelPoll();
    try {
      await getInvoke()("audio_dispose");
    } catch {
      /* noop */
    }
  }

  async listDevices(): Promise<AudioDevice[]> {
    try {
      return await getInvoke()<AudioDevice[]>("audio_list_devices");
    } catch {
      return [];
    }
  }

  async getDevice(): Promise<string | null> {
    return this.deviceId;
  }

  async setDevice(deviceId: string): Promise<void> {
    await getInvoke()("audio_set_device", { deviceId });
    this.deviceId = deviceId;
  }

  getSampleRate(): SampleRate { return this.sampleRate; }
  async setSampleRate(rate: SampleRate): Promise<void> {
    await getInvoke()("audio_set_sample_rate", { rate });
    this.sampleRate = rate;
  }

  getBitDepth(): BitDepth { return this.bitDepth; }
  setBitDepth(depth: BitDepth): void {
    this.bitDepth = depth;
    void getInvoke()("audio_set_bit_depth", { depth }).catch(() => {/* noop */});
  }

  getBufferSize(): BufferFrames { return this.bufferSize; }
  async setBufferSize(frames: BufferFrames): Promise<void> {
    await getInvoke()("audio_set_buffer_size", { frames });
    this.bufferSize = frames;
  }

  async play(): Promise<void> {
    await getInvoke()("audio_transport_play");
    this.transport = { ...this.transport, playing: true };
  }
  async stop(): Promise<void> {
    await getInvoke()("audio_transport_stop");
    this.transport = { ...this.transport, playing: false };
  }

  setTempo(bpm: number): void {
    this.transport = { ...this.transport, tempoBpm: bpm };
    void getInvoke()("audio_set_tempo", { bpm }).catch(() => {/* noop */});
  }
  setMetronome(on: boolean): void {
    this.transport = { ...this.transport, metronome: on };
    void getInvoke()("audio_set_metronome", { on }).catch(() => {/* noop */});
  }
  getTransport(): EngineTransport { return this.transport; }

  getMasterLevel(): MasterLevel { return this.lastLevel; }
  subscribeMasterLevel(listener: (l: MasterLevel) => void): () => void {
    this.levelListeners.add(listener);
    listener(this.lastLevel);
    return () => this.levelListeners.delete(listener);
  }

  private startLevelPoll(): void {
    if (this.levelPoll != null) return;
    const tick = async () => {
      try {
        const level = await getInvoke()<MasterLevel>("audio_master_level");
        this.lastLevel = level;
        for (const l of this.levelListeners) l(level);
      } catch {
        /* noop */
      }
    };
    this.levelPoll = window.setInterval(tick, 33);
  }
  private stopLevelPoll(): void {
    if (this.levelPoll != null) {
      clearInterval(this.levelPoll);
      this.levelPoll = null;
    }
  }

  audition(instrumentId: string, opts: VoiceOptions): void {
    void getInvoke()("audio_audition", { instrumentId, opts }).catch(() => {/* noop */});
  }
  allNotesOff(instrumentId?: string): void {
    void getInvoke()("audio_all_notes_off", { instrumentId }).catch(() => {/* noop */});
  }

  async openPlugin(pluginId: string, effect: PluginEffect): Promise<string> {
    return await getInvoke()<string>("audio_open_plugin", { pluginId, effect });
  }
  async closePlugin(instanceId: string): Promise<void> {
    await getInvoke()("audio_close_plugin", { instanceId });
  }
  setPluginParam(instanceId: string, key: string, value: number): void {
    void getInvoke()("audio_set_plugin_param", { instanceId, key, value }).catch(() => {/* noop */});
  }
}
