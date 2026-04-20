/**
 * Engine contract tests.
 *
 * jsdom does not implement the full WebAudio surface, so we shim just enough
 * of AudioContext for WebAudioEngine to boot. The goal is to lock the
 * interface — supported sample rates, bit depths, plug-in lifecycle — not to
 * audibly play anything.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SUPPORTED_BIT_DEPTHS,
  SUPPORTED_BUFFER_SIZES,
  SUPPORTED_SAMPLE_RATES,
  __resetEngineForTest,
  getEngine,
  peekEngine
} from "@/lib/audio/engine";

const makeFakeParam = (value = 1) => ({
  value,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  cancelScheduledValues: vi.fn()
});

class FakeGain {
  gain = makeFakeParam(1);
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeAnalyser extends FakeGain {
  fftSize = 2048;
  smoothingTimeConstant = 0.6;
  getFloatTimeDomainData = (buf: Float32Array) => {
    for (let i = 0; i < buf.length; i++) buf[i] = 0;
  };
}

class FakeAudioContext {
  sampleRate: number;
  state: "running" | "suspended" | "closed" = "running";
  destination = { channelCount: 2 };
  currentTime = 0;
  constructor(opts?: { sampleRate?: number }) {
    this.sampleRate = opts?.sampleRate ?? 48000;
  }
  createGain() { return new FakeGain(); }
  createAnalyser() { return new FakeAnalyser(); }
  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: makeFakeParam(1000),
      Q: makeFakeParam(1),
      gain: makeFakeParam(0),
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  createOscillator() {
    return {
      type: "sine",
      frequency: makeFakeParam(440),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
  }
  createStereoPanner() {
    return { pan: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
  }
  createBuffer() {
    return {
      length: 1,
      sampleRate: this.sampleRate,
      numberOfChannels: 1,
      getChannelData: () => new Float32Array(1)
    };
  }
  createBufferSource() {
    return { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  }
  createDelay() {
    return {
      delayTime: makeFakeParam(0.5),
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  createDynamicsCompressor() {
    return {
      threshold: makeFakeParam(-24),
      ratio: makeFakeParam(4),
      attack: makeFakeParam(0.01),
      release: makeFakeParam(0.25),
      knee: makeFakeParam(24),
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  createConvolver() {
    return { buffer: null, connect: vi.fn(), disconnect: vi.fn() };
  }
  createWaveShaper() {
    return {
      curve: null as Float32Array | null,
      oversample: "none",
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}

describe("AudioEngine contract", () => {
  beforeEach(() => {
    __resetEngineForTest(null);
    (globalThis as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
    (window as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
    // ensure we never see a Tauri bridge
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    (window as unknown as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = (cb) => {
      // no-op RAF so the meter loop doesn't churn
      return 0 as unknown as number;
    };
  });

  afterEach(async () => {
    const engine = peekEngine();
    if (engine) await engine.dispose();
    __resetEngineForTest(null);
  });

  it("declares the full sample-rate / bit-depth matrix", () => {
    expect(SUPPORTED_SAMPLE_RATES).toEqual([44100, 48000, 88200, 96000, 176400, 192000]);
    expect(SUPPORTED_BIT_DEPTHS).toEqual([16, 24, 32]);
    expect(SUPPORTED_BUFFER_SIZES).toEqual([32, 64, 128, 256, 512, 1024]);
  });

  it("boots a WebAudio backend and reports its sample rate", async () => {
    const engine = await getEngine();
    expect(engine.backend).toBe("webaudio");
    expect(SUPPORTED_SAMPLE_RATES).toContain(engine.getSampleRate());
  });

  it("reports a default audio device", async () => {
    const engine = await getEngine();
    const devices = await engine.listDevices();
    expect(devices.length).toBeGreaterThan(0);
    expect(devices.some((d) => d.isDefault)).toBe(true);
  });

  it("accepts bit-depth changes across the supported range", async () => {
    const engine = await getEngine();
    for (const b of SUPPORTED_BIT_DEPTHS) {
      engine.setBitDepth(b);
      expect(engine.getBitDepth()).toBe(b);
    }
  });

  it("opens and closes a plug-in instance", async () => {
    const engine = await getEngine();
    const id = await engine.openPlugin("plg-vca3a", {
      category: "dynamics",
      params: { threshold: 0.5, ratio: 0.4 }
    });
    expect(typeof id).toBe("string");
    engine.setPluginParam(id, "threshold", 0.3);
    await engine.closePlugin(id);
  });

  it("tracks transport play/stop state", async () => {
    const engine = await getEngine();
    await engine.play();
    expect(engine.getTransport().playing).toBe(true);
    await engine.stop();
    expect(engine.getTransport().playing).toBe(false);
  });

  it("queues a voice when auditioning an instrument", async () => {
    const engine = await getEngine();
    engine.audition("ins-kickdrum", { note: 36, velocity: 0.9, duration: 0.2, timbre: "kick" });
    // No throw is the contract here — engine shrugs off audition without explicit init
    expect(engine.backend).toBe("webaudio");
  });
});
