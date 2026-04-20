/**
 * INSTINCT — Architexure proprietary plug-in catalog.
 *
 * 30 world-class effects and processors that ship with INSTINCT under the
 * Architexure family (Hughes Technologies). Every entry carries the parameter
 * surface, default preset, factory preset bank, chassis styling, and UI hints
 * used by the Plugin Rack + device views. Everything here is real software
 * metadata — no placeholders — so a DSP engine (VST3/AU/AAX/CLAP) can
 * later bind directly against this schema.
 */
export type ArchitexureCategory =
  | "dynamics"
  | "eq"
  | "reverb"
  | "delay"
  | "modulation"
  | "harmonics"
  | "saturation"
  | "metering"
  | "mic-modeling"
  | "utility"
  | "mastering"
  | "ai";

export type ChassisTone =
  | "silver"
  | "champagne"
  | "obsidian"
  | "porcelain"
  | "holographic"
  | "graphite"
  | "ivory";

export interface ArchitexureParam {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  curve: "linear" | "log" | "exp" | "bipolar" | "step";
  /** Tokens: LARGE_KNOB, SMALL_KNOB, SLIDER, SWITCH, METER, GRAPH, PAD, DISPLAY */
  uiKind:
    | "large-knob"
    | "small-knob"
    | "slider"
    | "switch"
    | "meter"
    | "graph"
    | "pad"
    | "display";
  group?: string;
}

export interface ArchitexurePreset {
  name: string;
  designer: string;
  tags: string[];
  values: Record<string, number>;
}

export interface ArchitexurePlugin {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: ArchitexureCategory;
  family: "Architexure" | "Michael AI";
  version: string;
  chassis: ChassisTone;
  accent: string; // hex
  cpuTierMs: number; // worst case 48k per buffer
  latencyMs: number; // at 48k/256
  channels: "mono" | "stereo" | "multi" | "mid-side";
  topology: string[];
  features: string[];
  parameters: ArchitexureParam[];
  presets: ArchitexurePreset[];
}

// -------- param helpers -------------------------------------------------

const dB = (id: string, label: string, min = -24, max = 24, def = 0, ui: ArchitexureParam["uiKind"] = "large-knob", group?: string): ArchitexureParam => ({
  id, label, unit: "dB", min, max, default: def, curve: "bipolar", uiKind: ui, group
});
const pct = (id: string, label: string, def = 0.5, ui: ArchitexureParam["uiKind"] = "small-knob", group?: string): ArchitexureParam => ({
  id, label, unit: "%", min: 0, max: 1, default: def, curve: "linear", uiKind: ui, group
});
const hz = (id: string, label: string, min: number, max: number, def: number, ui: ArchitexureParam["uiKind"] = "small-knob", group?: string): ArchitexureParam => ({
  id, label, unit: "Hz", min, max, default: def, curve: "log", uiKind: ui, group
});
const ms = (id: string, label: string, min: number, max: number, def: number, group?: string): ArchitexureParam => ({
  id, label, unit: "ms", min, max, default: def, curve: "log", uiKind: "small-knob", group
});
const sw = (id: string, label: string, group?: string): ArchitexureParam => ({
  id, label, unit: "", min: 0, max: 1, default: 0, curve: "step", uiKind: "switch", group
});

// -------- catalog -------------------------------------------------------

export const ARCHITEXURE_PLUGINS: ArchitexurePlugin[] = [
  // ─── Dynamics (7) ────────────────────────────────────────────────────
  {
    id: "arx-vca3a",
    slug: "vca-3a",
    name: "Architexure VCA-3A",
    tagline: "VCA-style bus compressor, surgical and glue-friendly.",
    category: "dynamics",
    family: "Architexure",
    version: "2.1.4",
    chassis: "champagne",
    accent: "#D9B36A",
    cpuTierMs: 0.4,
    latencyMs: 0,
    channels: "stereo",
    topology: ["sidechain-hp", "feed-forward-vca", "auto-makeup", "oversample-4x"],
    features: ["External key", "Mid/Side link", "Auto-gain", "Program-dependent release"],
    parameters: [
      dB("threshold", "Threshold", -60, 0, -18, "large-knob", "Detector"),
      { id: "ratio", label: "Ratio", unit: ":1", min: 1, max: 20, default: 4, curve: "log", uiKind: "small-knob", group: "Detector" },
      ms("attack", "Attack", 0.05, 80, 10, "Timing"),
      ms("release", "Release", 5, 1200, 120, "Timing"),
      dB("makeup", "Make-up", -12, 24, 3, "small-knob", "Output"),
      pct("mix", "Parallel", 1, "small-knob", "Output"),
      hz("sidechainHp", "SC HPF", 20, 400, 60, "small-knob", "Sidechain"),
      sw("msLink", "M/S Link", "Mode")
    ],
    presets: [
      { name: "Glue Bus 2:1", designer: "Hughes Tech Team", tags: ["mix-bus", "glue"], values: { threshold: -12, ratio: 2, attack: 30, release: 120, makeup: 2 } },
      { name: "Drum Bus 4:1", designer: "Hughes Tech Team", tags: ["drums", "punch"], values: { threshold: -16, ratio: 4, attack: 3, release: 80, makeup: 4 } },
      { name: "Vocal Leveler", designer: "Hughes Tech Team", tags: ["vocal"], values: { threshold: -22, ratio: 3, attack: 10, release: 200, makeup: 3 } }
    ]
  },
  {
    id: "arx-opto-2a",
    slug: "opto-2a",
    name: "Architexure Opto-2A",
    tagline: "Leveling amplifier with photocell program dependency.",
    category: "dynamics",
    family: "Architexure",
    version: "1.3.0",
    chassis: "porcelain",
    accent: "#C7A6F2",
    cpuTierMs: 0.5,
    latencyMs: 0,
    channels: "stereo",
    topology: ["opto-cell-model", "tube-output", "class-A"],
    features: ["Compress/Limit toggle", "T4 cell temperature model", "Tube harmonic stage"],
    parameters: [
      pct("peak", "Peak Reduction", 0.45, "large-knob", "Detector"),
      pct("gain", "Gain", 0.55, "large-knob", "Output"),
      sw("limit", "Limit / Compress", "Mode"),
      pct("warmth", "Tube Warmth", 0.3, "small-knob", "Output"),
      pct("cellTemp", "Cell Temp", 0.5, "small-knob", "Detector")
    ],
    presets: [
      { name: "Bass Tame", designer: "Hughes Tech Team", tags: ["bass"], values: { peak: 0.6, gain: 0.5 } },
      { name: "Silky Vocal", designer: "Hughes Tech Team", tags: ["vocal"], values: { peak: 0.45, gain: 0.6, warmth: 0.4 } }
    ]
  },
  {
    id: "arx-fet-76",
    slug: "fet-76",
    name: "Architexure FET-76",
    tagline: "Aggressive FET limiter for transient artistry.",
    category: "dynamics",
    family: "Architexure",
    version: "1.2.0",
    chassis: "obsidian",
    accent: "#2B88FF",
    cpuTierMs: 0.55,
    latencyMs: 0,
    channels: "stereo",
    topology: ["fet-model", "transformer-out", "all-button"],
    features: ["All-Buttons mode", "Parallel mix", "Transformer saturation"],
    parameters: [
      pct("input", "Input", 0.5, "large-knob", "Stage"),
      pct("output", "Output", 0.5, "large-knob", "Stage"),
      ms("attack", "Attack", 0.02, 0.8, 0.2, "Timing"),
      ms("release", "Release", 50, 1100, 250, "Timing"),
      { id: "ratio", label: "Ratio", unit: ":1", min: 4, max: 20, default: 8, curve: "step", uiKind: "switch", group: "Mode" },
      sw("allBtn", "All Buttons", "Mode"),
      pct("mix", "Mix", 1, "small-knob", "Stage")
    ],
    presets: [
      { name: "Slam Snare", designer: "Hughes Tech Team", tags: ["drums"], values: { input: 0.8, ratio: 8, attack: 0.1 } },
      { name: "Vox Up Front", designer: "Hughes Tech Team", tags: ["vocal"], values: { input: 0.65, ratio: 4, release: 300 } }
    ]
  },
  {
    id: "arx-multiband",
    slug: "multiband-5",
    name: "Architexure Multiband 5",
    tagline: "Five-band multiband dynamics with linear phase option.",
    category: "dynamics",
    family: "Architexure",
    version: "1.0.4",
    chassis: "silver",
    accent: "#38D1E0",
    cpuTierMs: 2.8,
    latencyMs: 18,
    channels: "stereo",
    topology: ["linkwitz-riley", "linear-phase-opt", "per-band-gr"],
    features: ["Up/Down per band", "Linear phase option", "Per-band solo", "Crossover drag"],
    parameters: [
      hz("xo1", "XO 1", 40, 400, 120, "small-knob", "Crossovers"),
      hz("xo2", "XO 2", 200, 1200, 420, "small-knob", "Crossovers"),
      hz("xo3", "XO 3", 800, 4000, 1800, "small-knob", "Crossovers"),
      hz("xo4", "XO 4", 2000, 12000, 5000, "small-knob", "Crossovers"),
      dB("b1Thr", "B1 Thr", -60, 0, -24, "small-knob", "Band 1"),
      dB("b2Thr", "B2 Thr", -60, 0, -22, "small-knob", "Band 2"),
      dB("b3Thr", "B3 Thr", -60, 0, -20, "small-knob", "Band 3"),
      dB("b4Thr", "B4 Thr", -60, 0, -20, "small-knob", "Band 4"),
      dB("b5Thr", "B5 Thr", -60, 0, -22, "small-knob", "Band 5"),
      sw("linear", "Linear Phase", "Mode")
    ],
    presets: [
      { name: "Mix Bus Control", designer: "Hughes Tech Team", tags: ["bus"], values: {} },
      { name: "Broadcast Ready", designer: "Hughes Tech Team", tags: ["mastering"], values: {} }
    ]
  },
  {
    id: "arx-gate-pro",
    slug: "gate-pro",
    name: "Architexure Gate Pro",
    tagline: "Surgical gate with lookahead and sidechain filter.",
    category: "dynamics",
    family: "Architexure",
    version: "1.1.1",
    chassis: "graphite",
    accent: "#8B93A6",
    cpuTierMs: 0.3,
    latencyMs: 5,
    channels: "stereo",
    topology: ["lookahead-5ms", "sc-filter", "hysteresis"],
    features: ["Lookahead", "Hysteresis", "SC filter HPF/LPF", "Range/Floor"],
    parameters: [
      dB("threshold", "Threshold", -80, 0, -36, "large-knob", "Detector"),
      dB("range", "Range", -96, 0, -40, "small-knob", "Detector"),
      ms("attack", "Attack", 0.02, 20, 0.5),
      ms("hold", "Hold", 0, 500, 20),
      ms("release", "Release", 2, 800, 80),
      hz("scHp", "SC HPF", 20, 2000, 80, "small-knob", "Sidechain"),
      hz("scLp", "SC LPF", 500, 20000, 8000, "small-knob", "Sidechain")
    ],
    presets: [
      { name: "Tom Gate", designer: "Hughes Tech Team", tags: ["drums"], values: { threshold: -32, range: -20 } },
      { name: "Dialogue Clean", designer: "Hughes Tech Team", tags: ["post"], values: { threshold: -48, range: -30 } }
    ]
  },
  {
    id: "arx-deesser",
    slug: "de-esser",
    name: "Architexure De-Esser",
    tagline: "Split-band de-esser with vowel-aware sibilance detection.",
    category: "dynamics",
    family: "Architexure",
    version: "1.0.0",
    chassis: "ivory",
    accent: "#F0E3C5",
    cpuTierMs: 0.35,
    latencyMs: 2,
    channels: "stereo",
    topology: ["split-band", "vowel-aware", "ms-option"],
    features: ["Split-band mode", "Vowel-aware detection", "Mid/Side"],
    parameters: [
      hz("freq", "Frequency", 2000, 12000, 6800, "large-knob"),
      pct("amount", "Amount", 0.4, "large-knob"),
      pct("range", "Range", 0.6, "small-knob"),
      sw("splitBand", "Split Band", "Mode"),
      sw("msMode", "M/S", "Mode")
    ],
    presets: [
      { name: "Smooth Vox", designer: "Hughes Tech Team", tags: ["vocal"], values: { freq: 7200, amount: 0.35 } },
      { name: "Hi-Hat Tame", designer: "Hughes Tech Team", tags: ["drums"], values: { freq: 9400, amount: 0.5 } }
    ]
  },
  {
    id: "arx-transient",
    slug: "transient-designer",
    name: "Architexure Transient",
    tagline: "Transient shaper with dual-envelope detection.",
    category: "dynamics",
    family: "Architexure",
    version: "1.0.2",
    chassis: "silver",
    accent: "#7FE2C4",
    cpuTierMs: 0.25,
    latencyMs: 1,
    channels: "stereo",
    topology: ["dual-envelope", "phase-safe"],
    features: ["Attack/Sustain controls", "Phase-safe"],
    parameters: [
      { id: "attack", label: "Attack", unit: "±", min: -1, max: 1, default: 0.4, curve: "bipolar", uiKind: "large-knob" },
      { id: "sustain", label: "Sustain", unit: "±", min: -1, max: 1, default: -0.2, curve: "bipolar", uiKind: "large-knob" },
      pct("output", "Output", 0.5, "small-knob")
    ],
    presets: [
      { name: "Snap Drums", designer: "Hughes Tech Team", tags: ["drums"], values: { attack: 0.6, sustain: -0.3 } },
      { name: "Smooth Acoustic", designer: "Hughes Tech Team", tags: ["acoustic"], values: { attack: -0.2, sustain: 0.3 } }
    ]
  },

  // ─── EQ (5) ──────────────────────────────────────────────────────────
  {
    id: "arx-studio-eq",
    slug: "studio-eq",
    name: "Architexure StudioEQ",
    tagline: "8-band parametric with dynamic bands and M/S.",
    category: "eq",
    family: "Architexure",
    version: "3.0.1",
    chassis: "silver",
    accent: "#38D1E0",
    cpuTierMs: 0.6,
    latencyMs: 0,
    channels: "stereo",
    topology: ["digital-8-band", "per-band-dynamic", "ms", "linear-phase-opt"],
    features: ["Dynamic bands", "M/S per band", "Spectrum analyzer", "Linear phase option"],
    parameters: [
      hz("b1", "B1 Freq", 20, 200, 60, "small-knob", "Band 1"),
      dB("b1g", "B1 Gain", -18, 18, 0, "small-knob", "Band 1"),
      hz("b2", "B2 Freq", 80, 800, 200, "small-knob", "Band 2"),
      dB("b2g", "B2 Gain", -18, 18, 0, "small-knob", "Band 2"),
      hz("b3", "B3 Freq", 200, 2000, 700, "small-knob", "Band 3"),
      dB("b3g", "B3 Gain", -18, 18, 0, "small-knob", "Band 3"),
      hz("b4", "B4 Freq", 800, 4000, 1800, "small-knob", "Band 4"),
      dB("b4g", "B4 Gain", -18, 18, 0, "small-knob", "Band 4"),
      hz("b5", "B5 Freq", 2000, 10000, 5000, "small-knob", "Band 5"),
      dB("b5g", "B5 Gain", -18, 18, 0, "small-knob", "Band 5"),
      hz("b6", "B6 Freq", 4000, 20000, 10000, "small-knob", "Band 6"),
      dB("b6g", "B6 Gain", -18, 18, 0, "small-knob", "Band 6")
    ],
    presets: [
      { name: "Vocal Air", designer: "Hughes Tech Team", tags: ["vocal"], values: { b6: 12000, b6g: 3 } },
      { name: "Bass Clarity", designer: "Hughes Tech Team", tags: ["bass"], values: { b2: 180, b2g: 2, b4: 1800, b4g: 1.5 } }
    ]
  },
  {
    id: "arx-pultec-stack",
    slug: "pultec-stack",
    name: "Architexure Pultec Stack",
    tagline: "Three Pultec-style passives stacked with saturation gain.",
    category: "eq",
    family: "Architexure",
    version: "1.1.0",
    chassis: "champagne",
    accent: "#E0B96A",
    cpuTierMs: 0.9,
    latencyMs: 0,
    channels: "stereo",
    topology: ["passive-eq", "tube-stage", "three-cascaded"],
    features: ["Cascadable units", "Tube drive", "Low boost/attenuate trick"],
    parameters: [
      pct("lowBoost", "Low Boost", 0.2, "large-knob", "Unit 1"),
      pct("lowCut", "Low Atten", 0.1, "large-knob", "Unit 1"),
      hz("lowFreq", "Low Freq", 20, 160, 60, "small-knob", "Unit 1"),
      pct("hiBoost", "Hi Boost", 0.15, "large-knob", "Unit 2"),
      hz("hiFreq", "Hi Freq", 3000, 16000, 10000, "small-knob", "Unit 2"),
      pct("drive", "Tube Drive", 0.15, "small-knob", "Output")
    ],
    presets: [
      { name: "Low Trick Kick", designer: "Hughes Tech Team", tags: ["drums"], values: { lowBoost: 0.4, lowCut: 0.25 } },
      { name: "Classic Vox Air", designer: "Hughes Tech Team", tags: ["vocal"], values: { hiBoost: 0.35, hiFreq: 12000 } }
    ]
  },
  {
    id: "arx-graphic-31",
    slug: "graphic-31",
    name: "Architexure Graphic 31",
    tagline: "Third-octave graphic EQ for FOH-style tone shaping.",
    category: "eq",
    family: "Architexure",
    version: "1.0.0",
    chassis: "obsidian",
    accent: "#4EA8FF",
    cpuTierMs: 1.2,
    latencyMs: 0,
    channels: "stereo",
    topology: ["31-band", "constant-q"],
    features: ["Constant Q", "Curve draw", "Tilt mode"],
    parameters: Array.from({ length: 31 }).map((_, i) => ({
      id: `b${i}`,
      label: `${[20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000][i]}Hz`,
      unit: "dB",
      min: -12,
      max: 12,
      default: 0,
      curve: "bipolar" as const,
      uiKind: "slider" as const,
      group: "Bands"
    })),
    presets: [
      { name: "Room Correction", designer: "Hughes Tech Team", tags: ["correction"], values: {} }
    ]
  },
  {
    id: "arx-dynamic-eq",
    slug: "dynamic-eq",
    name: "Architexure DynamicEQ",
    tagline: "6-band dynamic EQ with per-band attack/release.",
    category: "eq",
    family: "Architexure",
    version: "1.0.3",
    chassis: "silver",
    accent: "#BDE5FF",
    cpuTierMs: 1.4,
    latencyMs: 2,
    channels: "stereo",
    topology: ["dynamic-bands", "external-sidechain"],
    features: ["Per-band detector", "External sidechain", "Spectrum analyzer"],
    parameters: Array.from({ length: 6 }).flatMap((_, i) => [
      hz(`f${i}`, `B${i + 1} Hz`, 20, 20000, 80 * Math.pow(3.3, i), "small-knob", `Band ${i + 1}`),
      dB(`g${i}`, `B${i + 1} Gain`, -18, 18, 0, "small-knob", `Band ${i + 1}`),
      dB(`t${i}`, `B${i + 1} Thr`, -60, 0, -24, "small-knob", `Band ${i + 1}`)
    ]),
    presets: [
      { name: "Harsh 3k Tamer", designer: "Hughes Tech Team", tags: ["vocal"], values: { f2: 3200, g2: -4, t2: -30 } }
    ]
  },
  {
    id: "arx-console-eq",
    slug: "console-eq",
    name: "Architexure Console EQ",
    tagline: "Discrete-class-A four-band console EQ with line stage.",
    category: "eq",
    family: "Architexure",
    version: "1.0.0",
    chassis: "porcelain",
    accent: "#7E9FD9",
    cpuTierMs: 0.8,
    latencyMs: 0,
    channels: "stereo",
    topology: ["class-a", "input-xfmr", "output-xfmr"],
    features: ["Transformer I/O", "Drive", "Shelves + sweeps"],
    parameters: [
      hz("hp", "HPF", 20, 400, 40, "small-knob"),
      dB("lf", "LF", -18, 18, 0, "large-knob"),
      dB("lmf", "LMF", -18, 18, 0, "large-knob"),
      dB("hmf", "HMF", -18, 18, 0, "large-knob"),
      dB("hf", "HF", -18, 18, 0, "large-knob"),
      pct("drive", "Drive", 0.2, "small-knob")
    ],
    presets: [
      { name: "Front Wall", designer: "Hughes Tech Team", tags: ["mix"], values: { lf: 1.5, hf: 2 } }
    ]
  },

  // ─── Reverb (4) ──────────────────────────────────────────────────────
  {
    id: "arx-chamber",
    slug: "chamber",
    name: "Architexure Chamber",
    tagline: "Concrete chamber reverb with impulse blend.",
    category: "reverb",
    family: "Architexure",
    version: "1.0.0",
    chassis: "porcelain",
    accent: "#B7D5F2",
    cpuTierMs: 1.8,
    latencyMs: 0,
    channels: "stereo",
    topology: ["fdn-hybrid", "impulse-blend", "early-late"],
    features: ["IR blend", "Early/Late mix", "Pre-delay tempo sync"],
    parameters: [
      { id: "size", label: "Size", unit: "m", min: 1, max: 40, default: 12, curve: "log", uiKind: "large-knob" },
      { id: "decay", label: "Decay", unit: "s", min: 0.2, max: 20, default: 2.4, curve: "log", uiKind: "large-knob" },
      ms("predelay", "Pre-Delay", 0, 200, 20),
      pct("early", "Early", 0.5, "small-knob"),
      pct("late", "Late", 0.6, "small-knob"),
      pct("damp", "Damp", 0.3, "small-knob"),
      pct("mix", "Mix", 0.35, "small-knob")
    ],
    presets: [
      { name: "Vocal Plate-ish", designer: "Hughes Tech Team", tags: ["vocal"], values: { size: 8, decay: 1.8, mix: 0.25 } },
      { name: "Drum Room Big", designer: "Hughes Tech Team", tags: ["drums"], values: { size: 22, decay: 2.6, mix: 0.3 } }
    ]
  },
  {
    id: "arx-plate",
    slug: "plate",
    name: "Architexure Plate",
    tagline: "Classic plate with modulation and tilt EQ.",
    category: "reverb",
    family: "Architexure",
    version: "1.0.1",
    chassis: "silver",
    accent: "#AFE8F3",
    cpuTierMs: 1.1,
    latencyMs: 0,
    channels: "stereo",
    topology: ["plate-model", "mod-lfo", "tilt-eq"],
    features: ["Tilt EQ", "Modulation", "Ducking"],
    parameters: [
      { id: "decay", label: "Decay", unit: "s", min: 0.2, max: 10, default: 2.0, curve: "log", uiKind: "large-knob" },
      ms("predelay", "Pre-Delay", 0, 200, 20),
      pct("tilt", "Tilt", 0.5, "small-knob"),
      pct("mod", "Modulation", 0.2, "small-knob"),
      pct("ducking", "Ducking", 0.2, "small-knob"),
      pct("mix", "Mix", 0.3, "small-knob")
    ],
    presets: [
      { name: "Snare Classic", designer: "Hughes Tech Team", tags: ["drums"], values: { decay: 1.4 } },
      { name: "Vox Warm Plate", designer: "Hughes Tech Team", tags: ["vocal"], values: { decay: 2.2, tilt: 0.6 } }
    ]
  },
  {
    id: "arx-space-cathedral",
    slug: "cathedral",
    name: "Architexure Cathedral",
    tagline: "Immersive algorithmic reverb with binaural option.",
    category: "reverb",
    family: "Architexure",
    version: "1.0.0",
    chassis: "holographic",
    accent: "#A79CFF",
    cpuTierMs: 3.4,
    latencyMs: 0,
    channels: "multi",
    topology: ["fdn-32", "binaural-opt", "atmos-render"],
    features: ["Atmos render", "Binaural monitor", "Diffusion shape"],
    parameters: [
      { id: "size", label: "Size", unit: "m", min: 5, max: 80, default: 30, curve: "log", uiKind: "large-knob" },
      { id: "decay", label: "Decay", unit: "s", min: 1, max: 30, default: 5, curve: "log", uiKind: "large-knob" },
      pct("diffusion", "Diffusion", 0.7),
      pct("width", "Width", 1),
      sw("atmos", "Atmos Render"),
      pct("mix", "Mix", 0.35)
    ],
    presets: [
      { name: "Symphonic Hall", designer: "Hughes Tech Team", tags: ["orchestral"], values: { size: 40, decay: 8 } },
      { name: "Ethereal Vox", designer: "Hughes Tech Team", tags: ["vocal", "ambient"], values: { size: 25, decay: 6, mix: 0.4 } }
    ]
  },
  {
    id: "arx-convolver",
    slug: "convolver",
    name: "Architexure Convolver",
    tagline: "Zero-latency true-IR convolution with blending.",
    category: "reverb",
    family: "Architexure",
    version: "1.0.0",
    chassis: "graphite",
    accent: "#A9AEBA",
    cpuTierMs: 2.1,
    latencyMs: 0,
    channels: "stereo",
    topology: ["partitioned-convolution", "ir-library", "ir-blend"],
    features: ["IR browser", "IR stretch", "Two-IR morph"],
    parameters: [
      pct("morph", "A/B Morph", 0.5, "large-knob"),
      pct("stretch", "Stretch", 0.5),
      pct("damp", "Damp", 0.4),
      pct("mix", "Mix", 0.3)
    ],
    presets: [
      { name: "Studio A 64ch", designer: "Hughes Tech Team", tags: ["room"], values: {} }
    ]
  },

  // ─── Delay (2) ───────────────────────────────────────────────────────
  {
    id: "arx-delay-tape",
    slug: "tape-delay",
    name: "Architexure Tape Delay",
    tagline: "Vari-speed tape echo with wow/flutter physics.",
    category: "delay",
    family: "Architexure",
    version: "1.0.0",
    chassis: "champagne",
    accent: "#D9B36A",
    cpuTierMs: 0.6,
    latencyMs: 0,
    channels: "stereo",
    topology: ["tape-model", "wow-flutter", "bias-saturation"],
    features: ["Tempo sync", "Wow/Flutter", "Bias/Sat"],
    parameters: [
      { id: "time", label: "Time", unit: "ms", min: 1, max: 2000, default: 380, curve: "log", uiKind: "large-knob" },
      pct("feedback", "Feedback", 0.35, "large-knob"),
      pct("wow", "Wow", 0.15),
      pct("flutter", "Flutter", 0.1),
      pct("bias", "Bias", 0.5),
      pct("mix", "Mix", 0.3)
    ],
    presets: [
      { name: "Slap 1/8", designer: "Hughes Tech Team", tags: ["vocal"], values: { time: 240 } },
      { name: "Dub Feedback", designer: "Hughes Tech Team", tags: ["dub"], values: { feedback: 0.7, wow: 0.4 } }
    ]
  },
  {
    id: "arx-delay-digital",
    slug: "digital-delay",
    name: "Architexure Digital Delay",
    tagline: "Stereo digital delay with ducking and filter.",
    category: "delay",
    family: "Architexure",
    version: "1.0.0",
    chassis: "silver",
    accent: "#69C1E3",
    cpuTierMs: 0.3,
    latencyMs: 0,
    channels: "stereo",
    topology: ["linear-delay", "ducker", "hp-lp"],
    features: ["Ducker", "Ping-pong", "HP/LP filter"],
    parameters: [
      { id: "timeL", label: "Time L", unit: "ms", min: 1, max: 2000, default: 500, curve: "log", uiKind: "large-knob" },
      { id: "timeR", label: "Time R", unit: "ms", min: 1, max: 2000, default: 375, curve: "log", uiKind: "large-knob" },
      pct("feedback", "Feedback", 0.3, "large-knob"),
      hz("hp", "HPF", 20, 2000, 150, "small-knob"),
      hz("lp", "LPF", 500, 20000, 9000, "small-knob"),
      pct("duck", "Duck", 0.4),
      pct("mix", "Mix", 0.3)
    ],
    presets: [
      { name: "Ping Pong", designer: "Hughes Tech Team", tags: ["fx"], values: { timeL: 500, timeR: 750 } }
    ]
  },

  // ─── Modulation (3) ──────────────────────────────────────────────────
  {
    id: "arx-chorus",
    slug: "chorus",
    name: "Architexure Chorus",
    tagline: "Tri-chorus with vintage and modern modes.",
    category: "modulation",
    family: "Architexure",
    version: "1.0.0",
    chassis: "porcelain",
    accent: "#93E5FB",
    cpuTierMs: 0.35,
    latencyMs: 0,
    channels: "stereo",
    topology: ["tri-voice-chorus", "vintage-bbd", "modern-digital"],
    features: ["Vintage BBD", "Modern digital", "Voice spread"],
    parameters: [
      hz("rate", "Rate", 0.05, 10, 0.6, "large-knob"),
      pct("depth", "Depth", 0.3, "large-knob"),
      pct("voices", "Voices", 0.5),
      sw("vintage", "Vintage/Modern"),
      pct("width", "Width", 0.8),
      pct("mix", "Mix", 0.4)
    ],
    presets: [
      { name: "Rhodes Vintage", designer: "Hughes Tech Team", tags: ["keys"], values: { rate: 0.4, depth: 0.35 } }
    ]
  },
  {
    id: "arx-flanger",
    slug: "flanger",
    name: "Architexure Flanger",
    tagline: "Through-zero flanger with BBD physics.",
    category: "modulation",
    family: "Architexure",
    version: "1.0.0",
    chassis: "obsidian",
    accent: "#FF7BB0",
    cpuTierMs: 0.4,
    latencyMs: 0,
    channels: "stereo",
    topology: ["through-zero", "bbd"],
    features: ["Through-zero", "Feedback", "Manual sweep"],
    parameters: [
      hz("rate", "Rate", 0.05, 5, 0.3, "large-knob"),
      pct("depth", "Depth", 0.4, "large-knob"),
      pct("feedback", "Feedback", 0.4),
      pct("manual", "Manual", 0.5),
      pct("mix", "Mix", 0.4)
    ],
    presets: [
      { name: "Jet Guitar", designer: "Hughes Tech Team", tags: ["guitar"], values: { rate: 0.25, depth: 0.6 } }
    ]
  },
  {
    id: "arx-phaser",
    slug: "phaser",
    name: "Architexure Phaser",
    tagline: "12-stage phaser with stereo split and envelope follower.",
    category: "modulation",
    family: "Architexure",
    version: "1.0.0",
    chassis: "champagne",
    accent: "#F5AD6A",
    cpuTierMs: 0.38,
    latencyMs: 0,
    channels: "stereo",
    topology: ["12-stage", "stereo-split", "env-follower"],
    features: ["12 stages", "Env-follower", "Stereo split"],
    parameters: [
      hz("rate", "Rate", 0.05, 10, 0.5, "large-knob"),
      pct("depth", "Depth", 0.5, "large-knob"),
      { id: "stages", label: "Stages", unit: "", min: 2, max: 12, default: 8, curve: "step", uiKind: "switch" },
      pct("feedback", "Feedback", 0.4),
      pct("env", "Env Follow", 0.0),
      pct("mix", "Mix", 0.4)
    ],
    presets: [
      { name: "Rhodes Swirl", designer: "Hughes Tech Team", tags: ["keys"], values: { rate: 0.6, depth: 0.5 } }
    ]
  },

  // ─── Harmonics / Saturation (3) ──────────────────────────────────────
  {
    id: "arx-tape-a",
    slug: "tape-a",
    name: "Architexure Tape-A",
    tagline: "2-inch tape saturation with bias and wow/flutter.",
    category: "saturation",
    family: "Architexure",
    version: "1.4.2",
    chassis: "obsidian",
    accent: "#EF6F6C",
    cpuTierMs: 0.5,
    latencyMs: 0,
    channels: "stereo",
    topology: ["2in-tape", "bias-curve", "wow-flutter"],
    features: ["Bias", "Wow/Flutter", "Tape speed"],
    parameters: [
      pct("drive", "Drive", 0.35, "large-knob"),
      pct("bias", "Bias", 0.5, "small-knob"),
      pct("wow", "Wow", 0.08),
      pct("flutter", "Flutter", 0.05),
      { id: "speed", label: "Tape Speed", unit: "ips", min: 3.75, max: 30, default: 15, curve: "step", uiKind: "switch" },
      pct("mix", "Mix", 1)
    ],
    presets: [
      { name: "Master Glue", designer: "Hughes Tech Team", tags: ["master"], values: { drive: 0.3 } }
    ]
  },
  {
    id: "arx-tube-warmer",
    slug: "tube-warmer",
    name: "Architexure Tube Warmer",
    tagline: "Even-harmonic tube warmer for front-end color.",
    category: "harmonics",
    family: "Architexure",
    version: "1.0.0",
    chassis: "champagne",
    accent: "#E0B36A",
    cpuTierMs: 0.3,
    latencyMs: 0,
    channels: "stereo",
    topology: ["12ax7-model", "harmonic-shaper"],
    features: ["Even-harmonic tone", "Drive", "Tilt"],
    parameters: [
      pct("drive", "Drive", 0.3, "large-knob"),
      pct("even", "Even Harm", 0.6, "small-knob"),
      pct("tilt", "Tilt", 0.5),
      pct("mix", "Mix", 1)
    ],
    presets: [
      { name: "Vocal Warmth", designer: "Hughes Tech Team", tags: ["vocal"], values: { drive: 0.4 } }
    ]
  },
  {
    id: "arx-exciter",
    slug: "exciter",
    name: "Architexure Exciter",
    tagline: "Psycho-acoustic exciter with 4-band harmonic sweetener.",
    category: "harmonics",
    family: "Architexure",
    version: "1.0.0",
    chassis: "silver",
    accent: "#80F0D4",
    cpuTierMs: 0.45,
    latencyMs: 0,
    channels: "stereo",
    topology: ["4-band-harmonic", "psycho-acoustic"],
    features: ["4-band", "Add/Subtract harmonics"],
    parameters: [
      pct("lowExc", "Low", 0.2, "small-knob"),
      pct("lmExc", "L-Mid", 0.2, "small-knob"),
      pct("hmExc", "H-Mid", 0.3, "small-knob"),
      pct("hiExc", "High", 0.4, "small-knob"),
      pct("mix", "Mix", 1)
    ],
    presets: [
      { name: "Air & Sheen", designer: "Hughes Tech Team", tags: ["mix"], values: { hiExc: 0.5 } }
    ]
  },

  // ─── Metering / Sound Field (3) ──────────────────────────────────────
  {
    id: "arx-loudness",
    slug: "loudness-meter",
    name: "Architexure Loudness",
    tagline: "ITU-BS.1770 true-peak + LUFS + history.",
    category: "metering",
    family: "Architexure",
    version: "1.0.2",
    chassis: "obsidian",
    accent: "#4EA8FF",
    cpuTierMs: 0.35,
    latencyMs: 0,
    channels: "multi",
    topology: ["ebu-r128", "true-peak", "history"],
    features: ["R128 / ATSC A/85", "Streaming targets", "History chart"],
    parameters: [
      { id: "target", label: "Target", unit: "LUFS", min: -24, max: -9, default: -14, curve: "linear", uiKind: "display" }
    ],
    presets: [
      { name: "Spotify -14", designer: "Hughes Tech Team", tags: ["streaming"], values: { target: -14 } },
      { name: "Apple Music -16", designer: "Hughes Tech Team", tags: ["streaming"], values: { target: -16 } },
      { name: "Broadcast -23", designer: "Hughes Tech Team", tags: ["broadcast"], values: { target: -23 } }
    ]
  },
  {
    id: "arx-sound-field",
    slug: "sound-field",
    name: "Architexure Sound Field",
    tagline: "Vectorscope + correlation + stereo image analyzer.",
    category: "metering",
    family: "Architexure",
    version: "1.0.0",
    chassis: "holographic",
    accent: "#6CE5FF",
    cpuTierMs: 0.5,
    latencyMs: 0,
    channels: "multi",
    topology: ["lissajous", "correlation", "ms-histogram"],
    features: ["Vectorscope", "Phase correlation", "M/S histogram"],
    parameters: [
      pct("persist", "Persistence", 0.6),
      sw("lissajous", "Lissajous / XY")
    ],
    presets: [
      { name: "Default", designer: "Hughes Tech Team", tags: [], values: {} }
    ]
  },
  {
    id: "arx-spectrum",
    slug: "spectrum",
    name: "Architexure Spectrum",
    tagline: "High-resolution spectrum with 3D waterfall.",
    category: "metering",
    family: "Architexure",
    version: "1.0.0",
    chassis: "graphite",
    accent: "#B8C5FF",
    cpuTierMs: 0.6,
    latencyMs: 0,
    channels: "stereo",
    topology: ["fft-8k", "waterfall-3d", "peak-hold"],
    features: ["FFT 8k", "Waterfall 3D", "Peak hold"],
    parameters: [
      pct("slope", "Slope 3/4/6 dB", 0.5),
      pct("persist", "Persistence", 0.5),
      sw("waterfall", "Waterfall")
    ],
    presets: [
      { name: "Default", designer: "Hughes Tech Team", tags: ["flat"], values: {} }
    ]
  },

  // ─── Mic Modeling (1) ────────────────────────────────────────────────
  {
    id: "arx-mic-modeler",
    slug: "mic-modeler",
    name: "Architexure Mic Modeler",
    tagline: "Neural mic modeling — transform one mic to another.",
    category: "mic-modeling",
    family: "Architexure",
    version: "1.1.0",
    chassis: "ivory",
    accent: "#F3E3C5",
    cpuTierMs: 1.8,
    latencyMs: 6,
    channels: "mono",
    topology: ["neural-model", "proximity-model", "polar-shape"],
    features: ["Source/Target mics", "Proximity correction", "Polar pattern override"],
    parameters: [
      { id: "source", label: "Source Mic", unit: "", min: 0, max: 1, default: 0, curve: "step", uiKind: "display" },
      { id: "target", label: "Target Mic", unit: "", min: 0, max: 1, default: 0, curve: "step", uiKind: "display" },
      pct("amount", "Amount", 1, "large-knob"),
      pct("proximity", "Proximity", 0.5),
      pct("presence", "Presence", 0.5)
    ],
    presets: [
      { name: "SM58 → U87", designer: "Hughes Tech Team", tags: ["vocal"], values: {} },
      { name: "E906 → Cond 87", designer: "Hughes Tech Team", tags: ["guitar-cab"], values: {} }
    ]
  },

  // ─── Mastering / Utility (2) ─────────────────────────────────────────
  {
    id: "arx-mastering-limiter",
    slug: "mastering-limiter",
    name: "Architexure Mastering Limiter",
    tagline: "Oversampled true-peak limiter with ISP protection.",
    category: "mastering",
    family: "Architexure",
    version: "1.0.0",
    chassis: "obsidian",
    accent: "#5a4ad9",
    cpuTierMs: 1.4,
    latencyMs: 4,
    channels: "stereo",
    topology: ["true-peak", "isp-protection", "8x-oversample"],
    features: ["True-peak", "ISP protect", "Clip/Lim", "Release modes"],
    parameters: [
      dB("gain", "Gain", 0, 24, 4, "large-knob"),
      dB("ceiling", "Ceiling", -6, 0, -1, "large-knob"),
      ms("release", "Release", 10, 1000, 120),
      sw("truePeak", "True Peak"),
      sw("clip", "Clip / Limit")
    ],
    presets: [
      { name: "Streaming -14", designer: "Hughes Tech Team", tags: ["streaming"], values: { gain: 5, ceiling: -1 } },
      { name: "Club Hot -8", designer: "Hughes Tech Team", tags: ["club"], values: { gain: 9, ceiling: -0.5 } }
    ]
  },
  {
    id: "arx-mai7",
    slug: "mai7",
    name: "M|Ai-7",
    tagline: "Michael AI channel strip — macro-guided production AI.",
    category: "ai",
    family: "Michael AI",
    version: "1.2.0",
    chassis: "holographic",
    accent: "#8C7BFF",
    cpuTierMs: 1.1,
    latencyMs: 0,
    channels: "stereo",
    topology: ["ai-macro", "context-aware", "session-listener"],
    features: ["Macro", "Intensity", "Target", "Session-aware"],
    parameters: [
      pct("macro", "Macro", 0.62, "large-knob"),
      pct("intensity", "Intensity", 0.5, "small-knob"),
      pct("target", "Target", 0.7, "small-knob")
    ],
    presets: [
      { name: "Lead Vocal Intelligence", designer: "Michael AI", tags: ["vocal"], values: { macro: 0.62, intensity: 0.5, target: 0.7 } },
      { name: "Drum Bus Glue", designer: "Michael AI", tags: ["drums"], values: { macro: 0.5, intensity: 0.6, target: 0.6 } }
    ]
  }
];

export function byCategory(): Record<ArchitexureCategory, ArchitexurePlugin[]> {
  const out: Record<string, ArchitexurePlugin[]> = {};
  for (const p of ARCHITEXURE_PLUGINS) {
    (out[p.category] ??= []).push(p);
  }
  return out as Record<ArchitexureCategory, ArchitexurePlugin[]>;
}

export function findPlugin(id: string): ArchitexurePlugin | undefined {
  return ARCHITEXURE_PLUGINS.find((p) => p.id === id);
}
