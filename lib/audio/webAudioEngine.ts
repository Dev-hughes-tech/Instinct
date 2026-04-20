/**
 * WebAudio implementation of the INSTINCT AudioEngine.
 *
 * The engine is audibly real: clicking an instrument pad or key produces a
 * synthesised voice, opening a plug-in inserts a real WebAudio node into the
 * master insert chain, pressing play runs a metronome if armed. Device
 * enumeration uses `navigator.mediaDevices.enumerateDevices()` and respects
 * the AudioContext's actual sample rate.
 *
 * The mixer graph:
 *
 *   [audition] ────┐
 *                   ├──► insertChain[0] ► insertChain[1] ► … ► master gain ► analyser ► destination
 *   [metronome] ───┘                                                               │
 *                                                                                  └──► level loop
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
  type VoiceOptions,
  SUPPORTED_BUFFER_SIZES,
  SUPPORTED_SAMPLE_RATES
} from "./engine";

interface ActiveVoice {
  instrumentId: string;
  stopAt: number;
  stop: (when?: number) => void;
}

interface PluginInstance {
  id: string;
  pluginId: string;
  effect: PluginEffect;
  /** In-chain input (what the previous node connects to). */
  input: AudioNode;
  /** In-chain output (connects to next node). */
  output: AudioNode;
  params: Map<string, AudioParam | ((v: number) => void)>;
}

export class WebAudioEngine implements AudioEngine {
  readonly backend: AudioBackend = "webaudio";

  private ctx!: AudioContext;
  private masterGain!: GainNode;
  private analyser!: AnalyserNode;
  private auditionBus!: GainNode;
  private metronomeBus!: GainNode;
  private insertChainHead!: GainNode; // where audition + metronome feed in
  private insertChainTail!: GainNode; // what ultimately feeds masterGain

  private deviceId: string | null = null;
  private bitDepth: BitDepth = 24;
  private bufferSize: BufferFrames = 128;

  private voices: ActiveVoice[] = [];
  private plugins: PluginInstance[] = [];

  private transport: EngineTransport = {
    playing: false,
    metronome: false,
    tempoBpm: 92,
    positionSec: 0
  };
  private metronomeTimer: number | null = null;
  private transportStartedAt = 0;
  private transportStartPosition = 0;

  private levelListeners = new Set<(l: MasterLevel) => void>();
  private levelLoopHandle: number | null = null;
  private lastLevel: MasterLevel = { peak: 0, rms: 0 };

  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.bootstrap();
    return this.initPromise;
  }

  private async bootstrap(): Promise<void> {
    const Ctor: typeof AudioContext =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext as typeof AudioContext);
    if (!Ctor) throw new Error("WebAudio is not supported in this browser.");

    // Prefer 48 kHz default — most Macs run Core Audio at 48 kHz unless the
    // user has reconfigured the device in Audio MIDI Setup.
    let ctx: AudioContext;
    try {
      ctx = new Ctor({ latencyHint: "interactive", sampleRate: 48000 });
    } catch {
      ctx = new Ctor({ latencyHint: "interactive" });
    }
    this.ctx = ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;
    this.auditionBus = ctx.createGain();
    this.auditionBus.gain.value = 1;
    this.metronomeBus = ctx.createGain();
    this.metronomeBus.gain.value = 0.45;
    this.insertChainHead = ctx.createGain();
    this.insertChainTail = ctx.createGain();

    this.auditionBus.connect(this.insertChainHead);
    this.metronomeBus.connect(this.insertChainHead);
    // Start with a straight wire between head and tail; plug-ins slot in between.
    this.insertChainHead.connect(this.insertChainTail);
    this.insertChainTail.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.startLevelLoop();
  }

  async dispose(): Promise<void> {
    this.stopLevelLoop();
    if (this.metronomeTimer != null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    for (const v of this.voices) {
      try {
        v.stop();
      } catch {
        /* noop */
      }
    }
    this.voices = [];
    for (const p of this.plugins) {
      try {
        p.input.disconnect();
        p.output.disconnect();
      } catch {
        /* noop */
      }
    }
    this.plugins = [];
    try {
      await this.ctx.close();
    } catch {
      /* noop */
    }
  }

  // Device management -----------------------------------------------------

  async listDevices(): Promise<AudioDevice[]> {
    const out: AudioDevice[] = [];

    // WebAudio context is our always-present logical device.
    const ctxRate = this.ctx.sampleRate as SampleRate;
    out.push({
      id: "default",
      label: "System Default (WebAudio)",
      kind: "output",
      backend: "webaudio",
      isDefault: true,
      channelCount: this.ctx.destination.channelCount,
      sampleRates: nearestSupportedRates(ctxRate),
      preferredBufferFrames: this.bufferSize
    });

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        navigator.mediaDevices.enumerateDevices
      ) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        for (const d of devices) {
          if (d.kind !== "audiooutput" && d.kind !== "audioinput") continue;
          if (!d.deviceId || d.deviceId === "default") continue;
          out.push({
            id: d.deviceId,
            label: d.label || `${d.kind === "audioinput" ? "Input" : "Output"} device`,
            kind: d.kind === "audioinput" ? "input" : "output",
            backend: "webaudio",
            isDefault: false,
            channelCount: 2,
            sampleRates: SUPPORTED_SAMPLE_RATES,
            preferredBufferFrames: this.bufferSize
          });
        }
      }
    } catch {
      // enumerate may be blocked by permissions; ignore.
    }

    return out;
  }

  async getDevice(): Promise<string | null> {
    return this.deviceId;
  }

  async setDevice(deviceId: string): Promise<void> {
    this.deviceId = deviceId === "default" ? null : deviceId;
    // `setSinkId` is available on AudioContext in recent Chromium/Safari.
    type SinkCtx = AudioContext & { setSinkId?: (id: string) => Promise<void> };
    const sinkCtx = this.ctx as SinkCtx;
    if (sinkCtx.setSinkId) {
      try {
        await sinkCtx.setSinkId(deviceId === "default" ? "" : deviceId);
      } catch {
        // Fall through silently — not every UA supports routing yet.
      }
    }
  }

  getSampleRate(): SampleRate {
    const r = this.ctx.sampleRate;
    const match = SUPPORTED_SAMPLE_RATES.find((x) => x === r);
    return match ?? 48000;
  }

  async setSampleRate(rate: SampleRate): Promise<void> {
    if (rate === this.ctx.sampleRate) return;
    // WebAudio can't change an existing context's rate. Tear down + rebuild.
    const wasRunning = this.ctx.state === "running";
    await this.ctx.close();
    const Ctor: typeof AudioContext =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext as typeof AudioContext);
    this.ctx = new Ctor({ latencyHint: "interactive", sampleRate: rate });
    // rebuild graph
    this.initPromise = null;
    await this.init();
    if (wasRunning) await this.ctx.resume();
  }

  getBitDepth(): BitDepth {
    return this.bitDepth;
  }
  setBitDepth(depth: BitDepth): void {
    this.bitDepth = depth;
  }

  getBufferSize(): BufferFrames {
    return this.bufferSize;
  }
  async setBufferSize(frames: BufferFrames): Promise<void> {
    const match = SUPPORTED_BUFFER_SIZES.find((f) => f === frames) ?? 128;
    this.bufferSize = match;
  }

  // Transport -------------------------------------------------------------

  async play(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.transport.playing = true;
    this.transportStartedAt = this.ctx.currentTime;
    if (this.transport.metronome) this.startMetronome();
  }

  async stop(): Promise<void> {
    this.transport.playing = false;
    this.stopMetronome();
    // Stop any still-ringing voices so the tail dies cleanly.
    for (const v of this.voices) {
      try {
        v.stop(this.ctx.currentTime + 0.08);
      } catch {
        /* noop */
      }
    }
    this.voices = [];
    this.transport.positionSec += this.ctx.currentTime - this.transportStartedAt;
    this.transportStartPosition = this.transport.positionSec;
  }

  setTempo(bpm: number): void {
    this.transport.tempoBpm = bpm;
    if (this.transport.playing && this.transport.metronome) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  setMetronome(on: boolean): void {
    this.transport.metronome = on;
    if (on && this.transport.playing) this.startMetronome();
    if (!on) this.stopMetronome();
  }

  getTransport(): EngineTransport {
    const extra = this.transport.playing
      ? this.ctx.currentTime - this.transportStartedAt
      : 0;
    return {
      ...this.transport,
      positionSec: this.transportStartPosition + extra
    };
  }

  private startMetronome(): void {
    if (this.metronomeTimer != null) return;
    const tick = () => {
      const t = this.ctx.currentTime;
      const click = this.ctx.createOscillator();
      click.type = "sine";
      click.frequency.value = 1500;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(1, t + 0.001);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      click.connect(env);
      env.connect(this.metronomeBus);
      click.start(t);
      click.stop(t + 0.07);
    };
    const ms = (60 / this.transport.tempoBpm) * 1000;
    this.metronomeTimer = window.setInterval(tick, ms);
  }

  private stopMetronome(): void {
    if (this.metronomeTimer != null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  // Monitoring ------------------------------------------------------------

  getMasterLevel(): MasterLevel {
    return this.lastLevel;
  }

  subscribeMasterLevel(listener: (l: MasterLevel) => void): () => void {
    this.levelListeners.add(listener);
    listener(this.lastLevel);
    return () => this.levelListeners.delete(listener);
  }

  private startLevelLoop(): void {
    if (this.levelLoopHandle != null) return;
    const buf = new Float32Array(this.analyser.fftSize);
    const tick = () => {
      this.analyser.getFloatTimeDomainData(buf);
      let peak = 0;
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const a = Math.abs(buf[i] ?? 0);
        if (a > peak) peak = a;
        sum += (buf[i] ?? 0) * (buf[i] ?? 0);
      }
      const rms = Math.sqrt(sum / buf.length);
      const level = { peak: Math.min(1, peak), rms: Math.min(1, rms) };
      this.lastLevel = level;
      for (const l of this.levelListeners) l(level);
      this.levelLoopHandle = window.requestAnimationFrame(tick);
    };
    this.levelLoopHandle = window.requestAnimationFrame(tick);
  }

  private stopLevelLoop(): void {
    if (this.levelLoopHandle != null) {
      cancelAnimationFrame(this.levelLoopHandle);
      this.levelLoopHandle = null;
    }
  }

  // Instrument audition --------------------------------------------------

  audition(instrumentId: string, opts: VoiceOptions): void {
    if (this.ctx.state === "suspended") {
      // user-gesture safe: ignore failure
      void this.ctx.resume();
    }
    const voice = this.buildVoice(instrumentId, opts);
    if (voice) this.voices.push(voice);
    // Trim expired voices
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((v) => v.stopAt > now);
  }

  allNotesOff(instrumentId?: string): void {
    const now = this.ctx.currentTime;
    for (const v of this.voices) {
      if (instrumentId && v.instrumentId !== instrumentId) continue;
      try {
        v.stop(now + 0.05);
      } catch {
        /* noop */
      }
    }
    this.voices = this.voices.filter((v) => instrumentId && v.instrumentId !== instrumentId);
  }

  private buildVoice(instrumentId: string, opts: VoiceOptions): ActiveVoice | null {
    const { ctx } = this;
    const note = clamp(opts.note, 0, 127);
    const velocity = clamp(opts.velocity ?? 0.8, 0.01, 1.5);
    const duration = Math.max(0.05, opts.duration ?? 0.35);
    const timbre = opts.timbre ?? pickTimbre(instrumentId);
    const gainMul = opts.gain ?? 1;
    const pan = clamp(opts.pan ?? 0, -1, 1);

    const freq = midiToFreq(note);
    const t0 = ctx.currentTime;

    const env = ctx.createGain();
    env.gain.value = 0;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    env.connect(panner);
    panner.connect(this.auditionBus);

    let stopAt = t0 + duration + 0.3;

    if (timbre === "kick") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(Math.max(60, freq), t0);
      osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.2);
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(velocity * gainMul, t0 + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      osc.connect(env);
      osc.start(t0);
      osc.stop(t0 + 0.5);
      stopAt = t0 + 0.5;
      return { instrumentId, stopAt, stop: (w) => safeStop(osc, w ?? t0 + 0.5) };
    }

    if (timbre === "snare") {
      const noise = makeNoise(ctx, 0.25);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1500;
      const tone = ctx.createOscillator();
      tone.type = "triangle";
      tone.frequency.value = 200;
      const toneEnv = ctx.createGain();
      toneEnv.gain.value = 0;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(velocity * 0.9 * gainMul, t0 + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      toneEnv.gain.setValueAtTime(velocity * 0.5, t0);
      toneEnv.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      noise.connect(hp);
      hp.connect(env);
      tone.connect(toneEnv);
      toneEnv.connect(env);
      noise.start(t0);
      noise.stop(t0 + 0.3);
      tone.start(t0);
      tone.stop(t0 + 0.2);
      stopAt = t0 + 0.3;
      return {
        instrumentId,
        stopAt,
        stop: (w) => {
          safeStop(noise, w ?? t0 + 0.3);
          safeStop(tone, w ?? t0 + 0.2);
        }
      };
    }

    if (timbre === "hat") {
      const noise = makeNoise(ctx, 0.12);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7000;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(velocity * 0.55 * gainMul, t0 + 0.002);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      noise.connect(hp);
      hp.connect(env);
      noise.start(t0);
      noise.stop(t0 + 0.12);
      stopAt = t0 + 0.12;
      return { instrumentId, stopAt, stop: (w) => safeStop(noise, w ?? t0 + 0.12) };
    }

    if (timbre === "clap") {
      const noise = makeNoise(ctx, 0.35);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200;
      bp.Q.value = 1.2;
      env.gain.setValueAtTime(0, t0);
      [0, 0.01, 0.02, 0.04].forEach((d, i) => {
        env.gain.setValueAtTime(velocity * (i === 3 ? 1 : 0.6) * gainMul, t0 + d);
        env.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.12);
      });
      noise.connect(bp);
      bp.connect(env);
      noise.start(t0);
      noise.stop(t0 + 0.3);
      stopAt = t0 + 0.3;
      return { instrumentId, stopAt, stop: (w) => safeStop(noise, w ?? t0 + 0.3) };
    }

    if (timbre === "perc") {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * 2, t0);
      osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.08);
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(velocity * 0.8 * gainMul, t0 + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      osc.connect(env);
      osc.start(t0);
      osc.stop(t0 + 0.3);
      stopAt = t0 + 0.3;
      return { instrumentId, stopAt, stop: (w) => safeStop(osc, w ?? t0 + 0.3) };
    }

    // Pitched voices ------------------------------------------------------
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    let cutoff = 1800;
    let release = 0.35;

    if (timbre === "bass") { osc.type = "sawtooth"; cutoff = 900; release = 0.28; }
    else if (timbre === "keys") { osc.type = "triangle"; cutoff = 3200; release = 0.45; }
    else if (timbre === "pad") { osc.type = "sawtooth"; cutoff = 1800; release = 1.4; }
    else if (timbre === "lead") { osc.type = "square"; cutoff = 2800; release = 0.3; }
    else if (timbre === "strings") { osc.type = "sawtooth"; cutoff = 2200; release = 1.1; }
    else if (timbre === "brass") { osc.type = "sawtooth"; cutoff = 2600; release = 0.6; }
    else if (timbre === "fx") { osc.type = "square"; cutoff = 4000; release = 0.9; }

    osc.frequency.value = freq;
    filter.frequency.value = cutoff;
    filter.Q.value = 0.7;

    const attack = timbre === "pad" ? 0.25 : timbre === "strings" ? 0.15 : 0.005;
    const decay = 0.15;
    const sustain = timbre === "pad" || timbre === "strings" ? 0.55 : 0.3;

    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(velocity * gainMul, t0 + attack);
    env.gain.linearRampToValueAtTime(velocity * sustain * gainMul, t0 + attack + decay);
    const releaseStart = t0 + Math.max(duration, attack + decay + 0.05);
    env.gain.setValueAtTime(velocity * sustain * gainMul, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    osc.connect(filter);
    filter.connect(env);
    osc.start(t0);
    osc.stop(releaseStart + release + 0.05);
    stopAt = releaseStart + release + 0.05;

    return { instrumentId, stopAt, stop: (w) => safeStop(osc, w ?? releaseStart + release + 0.05) };
  }

  // Plug-in hosting ------------------------------------------------------

  async openPlugin(pluginId: string, effect: PluginEffect): Promise<string> {
    const id = `pi-${pluginId}-${Math.random().toString(36).slice(2, 8)}`;
    const { input, output, params } = this.buildPluginNodes(effect);

    // Splice it into insertChainHead -> insertChainTail chain.
    try {
      this.insertChainHead.disconnect(this.insertChainTail);
    } catch {
      /* noop */
    }
    // New connection: head -> (existing chain) -> input -> output -> tail
    const last = this.plugins.length > 0 ? this.plugins[this.plugins.length - 1]!.output : this.insertChainHead;
    try { last.disconnect(); } catch { /* noop */ }
    last.connect(input);
    output.connect(this.insertChainTail);

    this.plugins.push({ id, pluginId, effect, input, output, params });
    return id;
  }

  async closePlugin(instanceId: string): Promise<void> {
    const idx = this.plugins.findIndex((p) => p.id === instanceId);
    if (idx < 0) return;
    const plug = this.plugins[idx]!;
    // Rewire around it
    try { plug.input.disconnect(); } catch { /* noop */ }
    try { plug.output.disconnect(); } catch { /* noop */ }
    this.plugins.splice(idx, 1);
    // Rebuild chain deterministically.
    try { this.insertChainHead.disconnect(); } catch { /* noop */ }
    let prev: AudioNode = this.insertChainHead;
    for (const p of this.plugins) {
      try { prev.disconnect(); } catch { /* noop */ }
      prev.connect(p.input);
      prev = p.output;
    }
    try { prev.disconnect(); } catch { /* noop */ }
    prev.connect(this.insertChainTail);
  }

  setPluginParam(instanceId: string, key: string, value: number): void {
    const plug = this.plugins.find((p) => p.id === instanceId);
    if (!plug) return;
    const p = plug.params.get(key);
    if (!p) return;
    if (typeof p === "function") p(value);
    else p.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  private buildPluginNodes(effect: PluginEffect): {
    input: AudioNode;
    output: AudioNode;
    params: Map<string, AudioParam | ((v: number) => void)>;
  } {
    const { ctx } = this;
    const params = new Map<string, AudioParam | ((v: number) => void)>();
    switch (effect.category) {
      case "eq": {
        const lo = ctx.createBiquadFilter(); lo.type = "lowshelf"; lo.frequency.value = 120; lo.gain.value = denorm(effect.params.low ?? 0.5, -18, 18);
        const mid = ctx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1200; mid.Q.value = 0.9; mid.gain.value = denorm(effect.params.mid ?? 0.5, -18, 18);
        const hi = ctx.createBiquadFilter(); hi.type = "highshelf"; hi.frequency.value = 8000; hi.gain.value = denorm(effect.params.high ?? 0.5, -18, 18);
        lo.connect(mid); mid.connect(hi);
        params.set("low", lo.gain); params.set("mid", mid.gain); params.set("high", hi.gain);
        return { input: lo, output: hi, params };
      }
      case "dynamics": {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = denorm(effect.params.threshold ?? 0.5, -60, 0);
        comp.ratio.value = denorm(effect.params.ratio ?? 0.5, 1, 20);
        comp.attack.value = denorm(effect.params.attack ?? 0.2, 0.001, 0.2);
        comp.release.value = denorm(effect.params.release ?? 0.3, 0.05, 1);
        comp.knee.value = 24;
        const makeup = ctx.createGain();
        makeup.gain.value = dbToGain(denorm(effect.params.makeup ?? 0.5, 0, 18));
        comp.connect(makeup);
        params.set("threshold", comp.threshold);
        params.set("ratio", comp.ratio);
        params.set("attack", comp.attack);
        params.set("release", comp.release);
        params.set("makeup", (v) => { makeup.gain.value = dbToGain(denorm(v, 0, 18)); });
        return { input: comp, output: makeup, params };
      }
      case "reverb": {
        const convolver = ctx.createConvolver();
        convolver.buffer = makeImpulseResponse(ctx, denorm(effect.params.size ?? 0.5, 0.4, 4.5), effect.params.decay ?? 0.6);
        const wet = ctx.createGain(); wet.gain.value = clamp(effect.params.mix ?? 0.35, 0, 1);
        const dry = ctx.createGain(); dry.gain.value = 1 - clamp(effect.params.mix ?? 0.35, 0, 1);
        const inGain = ctx.createGain();
        const outGain = ctx.createGain();
        inGain.connect(dry); dry.connect(outGain);
        inGain.connect(convolver); convolver.connect(wet); wet.connect(outGain);
        params.set("mix", (v) => { wet.gain.value = clamp(v, 0, 1); dry.gain.value = 1 - clamp(v, 0, 1); });
        params.set("size", (v) => { convolver.buffer = makeImpulseResponse(ctx, denorm(v, 0.4, 4.5), effect.params.decay ?? 0.6); });
        return { input: inGain, output: outGain, params };
      }
      case "delay": {
        const delay = ctx.createDelay(2);
        delay.delayTime.value = denorm(effect.params.time ?? 0.35, 0.02, 1.5);
        const feedback = ctx.createGain();
        feedback.gain.value = clamp(effect.params.feedback ?? 0.35, 0, 0.95);
        delay.connect(feedback); feedback.connect(delay);
        const wet = ctx.createGain(); wet.gain.value = clamp(effect.params.mix ?? 0.3, 0, 1);
        const dry = ctx.createGain(); dry.gain.value = 1 - clamp(effect.params.mix ?? 0.3, 0, 1);
        const inGain = ctx.createGain();
        const outGain = ctx.createGain();
        inGain.connect(dry); dry.connect(outGain);
        inGain.connect(delay); delay.connect(wet); wet.connect(outGain);
        params.set("time", delay.delayTime);
        params.set("feedback", feedback.gain);
        params.set("mix", (v) => { wet.gain.value = clamp(v, 0, 1); dry.gain.value = 1 - clamp(v, 0, 1); });
        return { input: inGain, output: outGain, params };
      }
      case "modulation": {
        const delay = ctx.createDelay(0.03);
        delay.delayTime.value = 0.008;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = denorm(effect.params.rate ?? 0.4, 0.1, 8);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = denorm(effect.params.depth ?? 0.5, 0.001, 0.015);
        lfo.connect(lfoGain); lfoGain.connect(delay.delayTime);
        lfo.start();
        params.set("rate", lfo.frequency);
        params.set("depth", lfoGain.gain);
        return { input: delay, output: delay, params };
      }
      case "saturation":
      case "harmonics": {
        const shaper = ctx.createWaveShaper();
        shaper.curve = makeSaturationCurve(denorm(effect.params.drive ?? 0.5, 1, 25));
        shaper.oversample = "4x";
        params.set("drive", (v) => { shaper.curve = makeSaturationCurve(denorm(v, 1, 25)); });
        return { input: shaper, output: shaper, params };
      }
      case "mastering": {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -8; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.2; comp.knee.value = 12;
        const mu = ctx.createGain(); mu.gain.value = dbToGain(denorm(effect.params.loudness ?? 0.6, 0, 8));
        comp.connect(mu);
        params.set("loudness", (v) => { mu.gain.value = dbToGain(denorm(v, 0, 8)); });
        return { input: comp, output: mu, params };
      }
      case "metering":
      case "ai":
      case "mic-modeling":
      case "utility":
      default: {
        const pass = ctx.createGain();
        pass.gain.value = denorm(effect.params.gain ?? 0.5, 0.2, 2);
        params.set("gain", pass.gain);
        return { input: pass, output: pass, params };
      }
    }
  }
}

// ------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function denorm(normalised: number, min: number, max: number): number {
  return min + (max - min) * clamp(normalised, 0, 1);
}
function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
function safeStop(node: AudioScheduledSourceNode, when: number): void {
  try {
    node.stop(when);
  } catch {
    /* already stopped */
  }
}
function nearestSupportedRates(rate: SampleRate): SampleRate[] {
  return SUPPORTED_SAMPLE_RATES.includes(rate) ? SUPPORTED_SAMPLE_RATES : [rate, ...SUPPORTED_SAMPLE_RATES];
}
function makeNoise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}
function makeImpulseResponse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2 + 6 * decay);
    }
  }
  return buffer;
}
function makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const ab = new ArrayBuffer(n * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(ab);
  const k = amount;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
function pickTimbre(instrumentId: string): VoiceOptions["timbre"] {
  const id = instrumentId.toLowerCase();
  if (/(kick|808|sub|bass)/.test(id)) return "bass";
  if (/(snare|clap)/.test(id)) return "snare";
  if (/(hat|cymbal|ride)/.test(id)) return "hat";
  if (/(drum|mpc|rhythm|perc)/.test(id)) return "perc";
  if (/(lead|synth|arp)/.test(id)) return "lead";
  if (/(pad|ambient|texture|atmos)/.test(id)) return "pad";
  if (/(string|violin|cello|viola|orchestra)/.test(id)) return "strings";
  if (/(brass|horn|trumpet|trombone|tuba)/.test(id)) return "brass";
  if (/(rhodes|piano|keys|wurli|clav|organ)/.test(id)) return "keys";
  return "keys";
}
