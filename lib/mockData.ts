import type {
  AuxBus,
  AuxSend,
  InsertSlot,
  MasterBus,
  MeterState,
  MixerStrip,
  PluginDevice,
  PluginInstance,
  Session,
  Track,
  TrackColorKey,
  WaveformClip
} from "./types";

/** Deterministic pseudo-random so peaks render consistently on SSR + client. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function makePeaks(seed: number, length: number, envelopeShape: "pulse" | "sustain" | "build" | "ambient"): number[] {
  const rnd = mulberry32(seed);
  const peaks: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / (length - 1);
    let env = 1;
    switch (envelopeShape) {
      case "pulse":
        env = Math.pow(Math.sin(t * Math.PI * 6), 2) * (1 - t * 0.2) + 0.15;
        break;
      case "sustain":
        env = 0.55 + 0.3 * Math.sin(t * Math.PI) + 0.1 * Math.sin(t * 22);
        break;
      case "build":
        env = 0.2 + t * 0.75 + 0.05 * Math.sin(t * 18);
        break;
      case "ambient":
        env = 0.3 + 0.25 * Math.sin(t * 3.2) + 0.1 * Math.sin(t * 9);
        break;
    }
    const noise = rnd() * 0.25;
    peaks.push(Math.max(0.04, Math.min(1, env + noise - 0.1)));
  }
  return peaks;
}

interface TrackSeed {
  name: string;
  colorKey: TrackColorKey;
  input: string;
  output: string;
  clipCount: number;
  envelope: "pulse" | "sustain" | "build" | "ambient";
}

const TRACK_SEEDS: TrackSeed[] = [
  { name: "Kick",        colorKey: "kick",  input: "IN 01",     output: "DRUM BUS", clipCount: 4, envelope: "pulse"  },
  { name: "Snare",       colorKey: "snare", input: "IN 02",     output: "DRUM BUS", clipCount: 4, envelope: "pulse"  },
  { name: "Hi-Hat",      colorKey: "hats",  input: "IN 03",     output: "DRUM BUS", clipCount: 3, envelope: "sustain"},
  { name: "Percussion",  colorKey: "perc",  input: "IN 04",     output: "DRUM BUS", clipCount: 2, envelope: "sustain"},
  { name: "Bass DI",     colorKey: "bass",  input: "IN 05",     output: "2-TRK",    clipCount: 1, envelope: "sustain"},
  { name: "Keys",        colorKey: "keys",  input: "IN 06",     output: "2-TRK",    clipCount: 2, envelope: "ambient"},
  { name: "Lead Vox",    colorKey: "vox",   input: "U87",       output: "2-TRK",    clipCount: 3, envelope: "build"  },
  { name: "FX Returns",  colorKey: "fx",    input: "AUX 1 RET", output: "2-TRK",    clipCount: 2, envelope: "ambient"}
];

function seededMeter(seed: number): MeterState {
  const rnd = mulberry32(seed);
  const peak = 0.35 + rnd() * 0.55;
  const rms = peak * (0.55 + rnd() * 0.3);
  return { peak, rms, clip: peak > 0.95 };
}

function makeInserts(trackId: string, populatedDeviceIds: (string | undefined)[]): InsertSlot[] {
  return populatedDeviceIds.map((pid, i) => ({
    id: `${trackId}-insert-${i}`,
    index: i,
    pluginInstanceId: pid,
    bypassed: false
  }));
}

function makeSends(trackId: string, busIds: string[]): AuxSend[] {
  return busIds.map((busId, i) => ({
    id: `${trackId}-send-${i}`,
    busId,
    level: 0.22 + i * 0.08,
    preFader: i === 0,
    enabled: i < 2,
    label: `AUX ${i + 1}`
  }));
}

// ------------------------------------------------------------------
// Plugin catalogue (Architexure + Michael AI)
// ------------------------------------------------------------------

export const PLUGIN_CATALOGUE: PluginDevice[] = [
  {
    id: "plg-mai7",
    name: "M|Ai-7",
    vendor: "Hughes Technologies",
    category: "ai",
    family: "Michael AI",
    chassis: "holographic",
    accent: "#8C7BFF",
    version: "1.2.0"
  },
  {
    id: "plg-vca3a",
    name: "Architexure VCA-3A",
    vendor: "Hughes Technologies",
    category: "compressor",
    family: "Architexure",
    chassis: "champagne",
    accent: "#D9B36A",
    version: "2.1.4"
  },
  {
    id: "plg-bc2",
    name: "Architexure BC-2",
    vendor: "Hughes Technologies",
    category: "channel-strip",
    family: "Architexure",
    chassis: "porcelain",
    accent: "#7E9FD9",
    version: "1.9.0"
  },
  {
    id: "plg-eq-studio",
    name: "Architexure StudioEQ",
    vendor: "Hughes Technologies",
    category: "eq",
    family: "Architexure",
    chassis: "silver",
    accent: "#38D1E0",
    version: "3.0.1"
  },
  {
    id: "plg-tape",
    name: "Architexure Tape-A",
    vendor: "Hughes Technologies",
    category: "saturation",
    family: "Architexure",
    chassis: "obsidian",
    accent: "#EF6F6C",
    version: "1.4.2"
  }
];

// ------------------------------------------------------------------
// Build session
// ------------------------------------------------------------------

function buildTracksAndClips(): { tracks: Track[]; clips: WaveformClip[] } {
  const tracks: Track[] = [];
  const clips: WaveformClip[] = [];

  TRACK_SEEDS.forEach((seed, i) => {
    const id = `trk-${i + 1}`;
    const trackClips: WaveformClip[] = [];
    let cursor = 0;
    for (let c = 0; c < seed.clipCount; c++) {
      const length = 12 + ((i + c) % 5) * 4; // 12..28 beats
      const clip: WaveformClip = {
        id: `${id}-clip-${c}`,
        trackId: id,
        start: cursor + c * 3,
        length,
        peaks: makePeaks((i + 1) * 101 + c * 17, 180, seed.envelope),
        label: `${seed.name} ${String.fromCharCode(65 + c)}`
      };
      trackClips.push(clip);
      cursor += length + 2;
    }
    clips.push(...trackClips);
    tracks.push({
      id,
      index: i,
      name: seed.name,
      kind: "audio",
      colorKey: seed.colorKey,
      armed: i === 6, // vox armed
      mute: false,
      solo: false,
      insertIds: [],
      clips: trackClips,
      inputLabel: seed.input,
      outputLabel: seed.output
    });
  });

  return { tracks, clips };
}

function buildPluginInstances(tracks: Track[]): PluginInstance[] {
  // 3 populated inserts on Vox (track index 6), Michael AI on Kick (index 0)
  const instances: PluginInstance[] = [];

  instances.push({
    id: "inst-mai7-vox",
    deviceId: "plg-mai7",
    trackId: tracks[6]!.id,
    parameters: { macro: 0.62, intensity: 0.5, target: 0.7 },
    presetName: "Lead Vocal Intelligence"
  });
  instances.push({
    id: "inst-vca3a-vox",
    deviceId: "plg-vca3a",
    trackId: tracks[6]!.id,
    parameters: { threshold: 0.55, ratio: 0.6, attack: 0.3, release: 0.5 },
    presetName: "Smooth 3:1"
  });
  instances.push({
    id: "inst-bc2-vox",
    deviceId: "plg-bc2",
    trackId: tracks[6]!.id,
    parameters: { hp: 0.2, lf: 0.55, lmf: 0.5, hmf: 0.58, hf: 0.65, drive: 0.3 },
    presetName: "Front & Forward"
  });
  instances.push({
    id: "inst-bc2-bass",
    deviceId: "plg-bc2",
    trackId: tracks[4]!.id,
    parameters: { hp: 0.15, lf: 0.7, lmf: 0.45, hmf: 0.5, hf: 0.4, drive: 0.4 },
    presetName: "DI Warmth"
  });
  instances.push({
    id: "inst-studioeq-kick",
    deviceId: "plg-eq-studio",
    trackId: tracks[0]!.id,
    parameters: { hp: 0.25, lf: 0.62, mf: 0.45, hf: 0.55 },
    presetName: "Tight Sub"
  });
  instances.push({
    id: "inst-tape-mix",
    deviceId: "plg-tape",
    trackId: "master",
    parameters: { drive: 0.35, bias: 0.5, wow: 0.08 }
  });

  return instances;
}

function buildStrips(tracks: Track[], pluginInstances: PluginInstance[]): MixerStrip[] {
  return tracks.map((t, i) => {
    const instancesOnTrack = pluginInstances.filter((p) => p.trackId === t.id);
    const populated = [0, 1, 2, 3, 4].map((slot) => instancesOnTrack[slot]?.id);
    const inserts = makeInserts(t.id, populated);
    t.insertIds = inserts.filter((s) => s.pluginInstanceId).map((s) => s.id);
    return {
      id: `strip-${t.id}`,
      trackId: t.id,
      label: t.name,
      colorKey: t.colorKey,
      kind: "audio",
      inputLabel: t.inputLabel,
      outputLabel: t.outputLabel,
      trim: 0,
      pan: [-0.2, 0.2, -0.35, 0.35, 0, 0.1, 0, -0.15][i] ?? 0,
      fader: [0.72, 0.74, 0.58, 0.56, 0.78, 0.66, 0.82, 0.5][i] ?? 0.65,
      mute: false,
      solo: false,
      record: t.armed,
      phase: false,
      highpass: i === 2 ? 220 : i === 6 ? 90 : 0,
      inserts,
      sends: makeSends(t.id, ["bus-rev", "bus-dly", "bus-par"]),
      meter: seededMeter((i + 1) * 13)
    };
  });
}

function buildAuxBuses(): AuxBus[] {
  const seeds = [
    { id: "bus-rev", name: "Plate Reverb" },
    { id: "bus-dly", name: "Slap Delay" },
    { id: "bus-par", name: "Parallel Comp" }
  ];
  return seeds.map((s, i) => ({
    id: s.id,
    name: s.name,
    colorKey: "aux",
    strip: {
      id: `strip-${s.id}`,
      trackId: s.id,
      label: s.name,
      colorKey: "aux",
      kind: "aux",
      inputLabel: "AUX IN",
      outputLabel: "2-TRK",
      trim: 0,
      pan: 0,
      fader: 0.6 + i * 0.05,
      mute: false,
      solo: false,
      record: false,
      phase: false,
      highpass: 0,
      inserts: makeInserts(s.id, [undefined, undefined, undefined, undefined, undefined]),
      sends: [],
      meter: seededMeter((i + 8) * 17)
    }
  }));
}

function buildMaster(): MasterBus {
  return {
    id: "master",
    name: "MASTER",
    strip: {
      id: "strip-master",
      trackId: "master",
      label: "MASTER",
      colorKey: "master",
      kind: "master",
      inputLabel: "2-TRK",
      outputLabel: "MONITOR",
      trim: 0,
      pan: 0,
      fader: 0.82,
      mute: false,
      solo: false,
      record: false,
      phase: false,
      highpass: 0,
      inserts: makeInserts("master", [
        "inst-tape-mix",
        undefined,
        undefined,
        undefined,
        undefined
      ]),
      sends: [],
      meter: { peak: 0.78, rms: 0.55, clip: false }
    }
  };
}

export function buildSession(): Session {
  const { tracks } = buildTracksAndClips();
  const pluginInstances = buildPluginInstances(tracks);
  const strips = buildStrips(tracks, pluginInstances);
  const auxBuses = buildAuxBuses();
  const masterBus = buildMaster();

  return {
    id: "session-001",
    name: "Hughes · Ref Mix 01",
    sampleRate: 48000,
    bitDepth: 24,
    createdAt: new Date("2026-04-20T09:30:00Z").toISOString(),
    tracks,
    plugins: PLUGIN_CATALOGUE,
    pluginInstances,
    strips,
    auxBuses,
    masterBus,
    transport: {
      playing: false,
      recording: false,
      loop: true,
      metronome: false,
      positionBeats: 24,
      tempoBpm: 96,
      timeSig: [4, 4]
    },
    inspector: {
      selectedTrackId: tracks[6]?.id ?? null,
      selectedClipId: tracks[6]?.clips[0]?.id ?? null,
      tool: "select",
      snap: true,
      grid: "1/16",
      automationVisible: false
    },
    ai: {
      enabled: true,
      listening: false,
      mode: "Mixing",
      confidence: 0.81,
      lastSuggestion: "Lead vocal sits 1.4 dB behind guide. Consider +1 dB at 3.2 kHz."
    }
  };
}

export const mockSession: Session = buildSession();
