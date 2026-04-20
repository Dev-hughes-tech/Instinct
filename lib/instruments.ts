/**
 * INSTINCT — Virtual Instrument Catalog
 *
 * 30 world-class virtual instruments shipped inside INSTINCT.
 *
 * Every instrument carries:
 *   - A family and category
 *   - An internal sample library manifest (paths are INSTINCT://core library URIs —
 *     they resolve against the built-in content pack and do NOT require the user
 *     to route or mount external sample folders).
 *   - A parameter surface (macro/pad/knob controls) the UI can bind to.
 *   - A preset bank seeded with genre-specific factory content.
 *
 * The philosophy is "Arcade-style, zero-rewire": every instrument is wired
 * into INSTINCT's internal content graph, so loading one is a single click
 * on the instrument card — no external libraries, no sample re-paths, no
 * plugin scanner, no missing-file dialogs.
 */

export type InstrumentCategory =
  | "drum-machine"
  | "drum-kit"
  | "bass"
  | "keys"
  | "synth"
  | "guitar"
  | "brass"
  | "strings"
  | "woodwinds"
  | "orchestra"
  | "choir"
  | "world"
  | "pad"
  | "texture"
  | "fx";

export interface InstrumentPad {
  id: string;
  label: string;
  sampleUri: string;
  color: string;
  /** MIDI note number this pad fires. */
  note: number;
  /** 0..1 */
  volume: number;
  /** 0..1 */
  tune: number;
}

export interface InstrumentArticulation {
  id: string;
  label: string;
  /** Key-switch note (0..127) if applicable. */
  keySwitch?: number;
  sampleUri: string;
}

export interface InstrumentMacro {
  id: string;
  label: string;
  default: number;
}

export interface InstrumentPreset {
  name: string;
  designer: string;
  tags: string[];
  values: Record<string, number>;
}

export interface SampleLibraryManifest {
  /** INSTINCT://core URI of the root of the sample tree. */
  rootUri: string;
  /** Approximate on-disk size in MB. */
  sizeMb: number;
  /** Count of individual sample files. */
  fileCount: number;
  /** Multisample or one-shots? */
  format: "round-robin" | "one-shot" | "looped" | "granular" | "physical-model";
  /** Which velocity layers the library shipped with. */
  velocityLayers: number;
  /** Compression/container. */
  container: "INSTINCT-NCS" | "INSTINCT-NCS-Lossless" | "WAV-24-48";
}

export interface VirtualInstrument {
  id: string;
  slug: string;
  name: string;
  vendor: "Hughes Technologies";
  family: "Architexure Studio Gold" | "AI Forge" | "Vinyl Room" | "Phil Orchestra One" | "808 Anatomy" | "INSTINCT Core";
  category: InstrumentCategory;
  tagline: string;
  chassis:
    | "silver"
    | "champagne"
    | "obsidian"
    | "porcelain"
    | "holographic"
    | "graphite"
    | "ivory";
  accent: string;
  /** UI style the browser should render. */
  uiKind: "mpc" | "arcade-browser" | "keyboard-strip" | "guitar-neck" | "orchestral-stage" | "synth-panel";
  /** How many polyphonic voices the engine ships with by default. */
  polyphony: number;
  /** Minimum/recommended polyphony configurable per preset. */
  macros: InstrumentMacro[];
  /** Pads — present on drum-machine-style instruments. */
  pads?: InstrumentPad[];
  /** Articulations — present on orchestral / multisample instruments. */
  articulations?: InstrumentArticulation[];
  /** Range on a keyboard-style instrument. */
  range?: { low: number; high: number };
  /** Internal sample library manifest. */
  library: SampleLibraryManifest;
  /** Factory preset bank. */
  presets: InstrumentPreset[];
  /** Approximate "download" size — for display (everything is already installed). */
  sizeMb: number;
}

// ------- helpers -------------------------------------------------------

function kickNote(n: number) { return n; }

/** Build a 16-pad MPC grid with a given color + sample prefix. */
function pads16(prefix: string, labels: string[], color: string): InstrumentPad[] {
  // MPC layout: bottom-left is pad 1, rows bottom-to-top, 4 per row.
  // We emit them in reading order (top-left → bottom-right) for UI convenience;
  // the renderer re-grids them.
  return labels.slice(0, 16).map((label, i) => ({
    id: `${prefix}-pad-${i + 1}`,
    label,
    sampleUri: `INSTINCT://core/${prefix}/pad-${i + 1}.ncs`,
    color,
    note: kickNote(36 + i),
    volume: 0.8,
    tune: 0.5
  }));
}

const MACRO = {
  tone: (d = 0.5): InstrumentMacro => ({ id: "tone", label: "Tone", default: d }),
  attack: (d = 0.1): InstrumentMacro => ({ id: "attack", label: "Attack", default: d }),
  release: (d = 0.4): InstrumentMacro => ({ id: "release", label: "Release", default: d }),
  drive: (d = 0.2): InstrumentMacro => ({ id: "drive", label: "Drive", default: d }),
  space: (d = 0.25): InstrumentMacro => ({ id: "space", label: "Space", default: d }),
  width: (d = 0.75): InstrumentMacro => ({ id: "width", label: "Width", default: d })
};

// ------- catalog -------------------------------------------------------

export const INSTRUMENTS: VirtualInstrument[] = [
  // ───────────── DRUM MACHINES (6) ─────────────
  {
    id: "ins-mpc-instinct",
    slug: "mpc-instinct",
    name: "MPC · INSTINCT",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "drum-machine",
    tagline: "The flagship MPC-style groove machine — swing, sample chop, and song mode built in.",
    chassis: "champagne",
    accent: "#D9B36A",
    uiKind: "mpc",
    polyphony: 32,
    macros: [MACRO.tone(), MACRO.drive(), MACRO.space(), MACRO.width()],
    pads: pads16("mpc-instinct", [
      "Kick 808", "Kick Live", "Snare Rim", "Snare Clap",
      "Hat Cl", "Hat Op", "Shaker", "Cowbell",
      "Tom Lo", "Tom Mid", "Tom Hi", "Ride",
      "Crash", "Perc A", "Perc B", "FX Riser"
    ], "#D9B36A"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/mpc-instinct",
      sizeMb: 420,
      fileCount: 1280,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Trap Starter", designer: "Hughes Tech Team", tags: ["trap", "808"], values: { tone: 0.55 } },
      { name: "Boom-Bap 90s", designer: "Hughes Tech Team", tags: ["boom-bap"], values: { tone: 0.4, drive: 0.35 } },
      { name: "Afrobeats", designer: "Hughes Tech Team", tags: ["afrobeats"], values: { tone: 0.6, space: 0.3 } },
      { name: "Drill Loose", designer: "Hughes Tech Team", tags: ["drill"], values: { tone: 0.5, drive: 0.5 } }
    ],
    sizeMb: 420
  },
  {
    id: "ins-808-anatomy",
    slug: "808-anatomy",
    name: "808 Anatomy",
    vendor: "Hughes Technologies",
    family: "808 Anatomy",
    category: "drum-machine",
    tagline: "Deconstructed 808 — separate layers for thump, body, tail and click.",
    chassis: "obsidian",
    accent: "#2B88FF",
    uiKind: "mpc",
    polyphony: 16,
    macros: [
      { id: "thump", label: "Thump", default: 0.6 },
      { id: "body", label: "Body", default: 0.7 },
      { id: "tail", label: "Tail", default: 0.5 },
      { id: "click", label: "Click", default: 0.25 }
    ],
    pads: pads16("808-anatomy", [
      "808 A#1", "808 B1", "808 C2", "808 C#2",
      "808 D2", "808 D#2", "808 E2", "808 F2",
      "808 F#2", "808 G2", "808 G#2", "808 A2",
      "Clap", "Rim", "Hat", "Perc"
    ], "#2B88FF"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/808-anatomy",
      sizeMb: 180,
      fileCount: 512,
      format: "round-robin",
      velocityLayers: 4,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Sub Slide", designer: "Hughes Tech Team", tags: ["trap"], values: { tail: 0.8 } },
      { name: "Distorted Club", designer: "Hughes Tech Team", tags: ["club"], values: { thump: 0.7, click: 0.6 } }
    ],
    sizeMb: 180
  },
  {
    id: "ins-909-steel",
    slug: "909-steel",
    name: "909 Steel",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "drum-machine",
    tagline: "House/techno drum machine modeled on the TR-909 signal chain.",
    chassis: "silver",
    accent: "#C8E3FF",
    uiKind: "mpc",
    polyphony: 16,
    macros: [MACRO.tone(0.55), MACRO.drive(0.3), MACRO.space(0.2)],
    pads: pads16("909-steel", [
      "Kick", "Snare", "Hat Cl", "Hat Op",
      "Clap", "Rim", "Ride", "Crash",
      "Tom Lo", "Tom Mid", "Tom Hi", "Cow",
      "Perc 1", "Perc 2", "FX", "Riser"
    ], "#6FA8DC"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/909-steel",
      sizeMb: 140,
      fileCount: 340,
      format: "one-shot",
      velocityLayers: 3,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Classic House", designer: "Hughes Tech Team", tags: ["house"], values: { tone: 0.5 } },
      { name: "Detroit Techno", designer: "Hughes Tech Team", tags: ["techno"], values: { drive: 0.5 } }
    ],
    sizeMb: 140
  },
  {
    id: "ins-linn-lm1",
    slug: "linn-lm1",
    name: "LinnSteel LM-1",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "drum-machine",
    tagline: "Early-80s 8-bit drum machine with individual tuning per voice.",
    chassis: "champagne",
    accent: "#E0B96A",
    uiKind: "mpc",
    polyphony: 8,
    macros: [MACRO.tone(0.45), MACRO.drive(0.2)],
    pads: pads16("linn-lm1", [
      "Kick", "Snare", "Hat Cl", "Hat Op",
      "Tom Lo", "Tom Mid", "Tom Hi", "Clap",
      "Cowbell", "Cabasa", "Tamb", "Conga Lo",
      "Conga Mid", "Conga Hi", "Claves", "Stick"
    ], "#E0B96A"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/linn-lm1",
      sizeMb: 60,
      fileCount: 160,
      format: "one-shot",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Prince Funk", designer: "Hughes Tech Team", tags: ["funk"], values: {} },
      { name: "Synthpop 84", designer: "Hughes Tech Team", tags: ["80s"], values: {} }
    ],
    sizeMb: 60
  },
  {
    id: "ins-vinyl-breaks",
    slug: "vinyl-breaks",
    name: "Vinyl Breaks",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "drum-machine",
    tagline: "Chopped vinyl breakbeat library with key detection and tempo stretch.",
    chassis: "graphite",
    accent: "#A9A9A9",
    uiKind: "mpc",
    polyphony: 16,
    macros: [MACRO.tone(0.45), MACRO.drive(0.25), MACRO.space(0.35)],
    pads: pads16("vinyl-breaks", [
      "Break A1", "Break A2", "Break A3", "Break A4",
      "Break B1", "Break B2", "Break B3", "Break B4",
      "Break C1", "Break C2", "Break C3", "Break C4",
      "Break D1", "Break D2", "Break D3", "Break D4"
    ], "#A9A9A9"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/vinyl-breaks",
      sizeMb: 950,
      fileCount: 640,
      format: "looped",
      velocityLayers: 1,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Dusty 90s", designer: "Hughes Tech Team", tags: ["boom-bap"], values: {} }
    ],
    sizeMb: 950
  },
  {
    id: "ins-sp-chopper",
    slug: "sp-chopper",
    name: "SP-Chopper",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "drum-machine",
    tagline: "Lo-fi sampler with pitch/time warble and bitcrush.",
    chassis: "obsidian",
    accent: "#888FA3",
    uiKind: "mpc",
    polyphony: 12,
    macros: [
      { id: "bit", label: "Bits", default: 0.6 },
      { id: "wobble", label: "Wobble", default: 0.2 },
      { id: "tilt", label: "Tilt", default: 0.5 },
      MACRO.space(0.3)
    ],
    pads: pads16("sp-chopper", [
      "Chop 1", "Chop 2", "Chop 3", "Chop 4",
      "Chop 5", "Chop 6", "Chop 7", "Chop 8",
      "Chop 9", "Chop 10", "Chop 11", "Chop 12",
      "Chop 13", "Chop 14", "Chop 15", "Chop 16"
    ], "#888FA3"),
    library: {
      rootUri: "INSTINCT://core/drum-machines/sp-chopper",
      sizeMb: 380,
      fileCount: 512,
      format: "one-shot",
      velocityLayers: 2,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Lo-Fi Dusty", designer: "Hughes Tech Team", tags: ["lofi"], values: { bit: 0.4 } }
    ],
    sizeMb: 380
  },

  // ───────────── DRUM KITS (1) ─────────────
  {
    id: "ins-natural-kit",
    slug: "natural-kit",
    name: "Natural Kit",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "drum-kit",
    tagline: "Multi-mic recorded acoustic kit (12 mics, 10 velocity layers).",
    chassis: "ivory",
    accent: "#E7D5B0",
    uiKind: "mpc",
    polyphony: 32,
    macros: [
      { id: "room", label: "Room", default: 0.5 },
      { id: "overheads", label: "Overheads", default: 0.55 },
      { id: "close", label: "Close Mics", default: 0.7 },
      { id: "parallel", label: "Parallel", default: 0.35 }
    ],
    pads: pads16("natural-kit", [
      "Kick In", "Kick Out", "Snare Top", "Snare Bot",
      "Hat Cl", "Hat Op", "Rack 1", "Rack 2",
      "Floor T", "Ride Bell", "Ride Bow", "Crash 1",
      "Crash 2", "China", "Splash", "Room"
    ], "#E7D5B0"),
    library: {
      rootUri: "INSTINCT://core/drum-kits/natural-kit",
      sizeMb: 6400,
      fileCount: 12800,
      format: "round-robin",
      velocityLayers: 10,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Studio Tight", designer: "Hughes Tech Team", tags: ["studio"], values: { close: 0.8, room: 0.3 } },
      { name: "Big Room Ballad", designer: "Hughes Tech Team", tags: ["ballad"], values: { room: 0.75 } }
    ],
    sizeMb: 6400
  },

  // ───────────── BASS (2) ─────────────
  {
    id: "ins-mass-bass",
    slug: "mass-bass",
    name: "Mass Bass",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "bass",
    tagline: "Hybrid physical-modeled sub bass for trap/R&B/drill.",
    chassis: "obsidian",
    accent: "#3E5CFF",
    uiKind: "synth-panel",
    polyphony: 8,
    macros: [
      { id: "sub", label: "Sub", default: 0.7 },
      { id: "saturation", label: "Saturation", default: 0.3 },
      { id: "glide", label: "Glide", default: 0.15 },
      { id: "decay", label: "Decay", default: 0.6 }
    ],
    range: { low: 21, high: 72 },
    library: {
      rootUri: "INSTINCT://core/bass/mass-bass",
      sizeMb: 60,
      fileCount: 96,
      format: "physical-model",
      velocityLayers: 4,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Trap 808", designer: "Hughes Tech Team", tags: ["trap"], values: { sub: 0.85 } },
      { name: "Dark Drill", designer: "Hughes Tech Team", tags: ["drill"], values: { saturation: 0.5 } }
    ],
    sizeMb: 60
  },
  {
    id: "ins-precision-bass",
    slug: "precision-bass",
    name: "Precision Bass",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "bass",
    tagline: "Classic P-bass recorded through a 60s tube amp + DI blend.",
    chassis: "champagne",
    accent: "#C6A26A",
    uiKind: "keyboard-strip",
    polyphony: 4,
    macros: [
      { id: "ampBlend", label: "Amp/DI", default: 0.6 },
      { id: "tone", label: "Tone", default: 0.55 },
      { id: "pickNoise", label: "Pick Noise", default: 0.25 },
      { id: "release", label: "Release", default: 0.3 }
    ],
    range: { low: 28, high: 55 },
    articulations: [
      { id: "finger", label: "Finger", sampleUri: "INSTINCT://core/bass/precision/finger.ncs" },
      { id: "pick", label: "Pick", keySwitch: 0, sampleUri: "INSTINCT://core/bass/precision/pick.ncs" },
      { id: "slap", label: "Slap", keySwitch: 1, sampleUri: "INSTINCT://core/bass/precision/slap.ncs" },
      { id: "mute", label: "Mute", keySwitch: 2, sampleUri: "INSTINCT://core/bass/precision/mute.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/bass/precision",
      sizeMb: 1800,
      fileCount: 3200,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Motown", designer: "Hughes Tech Team", tags: ["motown"], values: { ampBlend: 0.3 } },
      { name: "R&B Warm", designer: "Hughes Tech Team", tags: ["rnb"], values: { ampBlend: 0.5 } }
    ],
    sizeMb: 1800
  },

  // ───────────── KEYS (5) ─────────────
  {
    id: "ins-steinway-d",
    slug: "steinway-d",
    name: "Steinway D",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "keys",
    tagline: "Concert grand — Steinway D, 18 mic positions, 20 vel layers.",
    chassis: "porcelain",
    accent: "#E3D7C2",
    uiKind: "keyboard-strip",
    polyphony: 128,
    macros: [
      { id: "mic", label: "Mic Position", default: 0.5 },
      { id: "pedal", label: "Pedal Noise", default: 0.4 },
      { id: "resonance", label: "Sympathetic", default: 0.6 },
      { id: "dynamics", label: "Dynamics", default: 0.55 }
    ],
    range: { low: 21, high: 108 },
    library: {
      rootUri: "INSTINCT://core/keys/steinway-d",
      sizeMb: 14200,
      fileCount: 15600,
      format: "round-robin",
      velocityLayers: 20,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Close + Player", designer: "Hughes Tech Team", tags: ["pop"], values: { mic: 0.3 } },
      { name: "Cinematic Wide", designer: "Hughes Tech Team", tags: ["cinematic"], values: { mic: 0.8 } }
    ],
    sizeMb: 14200
  },
  {
    id: "ins-upright-felt",
    slug: "upright-felt",
    name: "Upright Felt",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "keys",
    tagline: "Mellow felt-hammer upright perfect for indie/lofi.",
    chassis: "ivory",
    accent: "#DCCBA8",
    uiKind: "keyboard-strip",
    polyphony: 64,
    macros: [MACRO.tone(0.35), MACRO.space(0.4), { id: "felt", label: "Felt", default: 0.8 }, MACRO.release(0.5)],
    range: { low: 28, high: 103 },
    library: {
      rootUri: "INSTINCT://core/keys/upright-felt",
      sizeMb: 2400,
      fileCount: 3800,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Lofi Warm", designer: "Hughes Tech Team", tags: ["lofi"], values: { felt: 0.9 } }
    ],
    sizeMb: 2400
  },
  {
    id: "ins-rhodes-73",
    slug: "rhodes-73",
    name: "Rhodes 73",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "keys",
    tagline: "Electric piano with suitcase preamp and tremolo.",
    chassis: "obsidian",
    accent: "#E0B36A",
    uiKind: "keyboard-strip",
    polyphony: 32,
    macros: [
      { id: "bell", label: "Bell", default: 0.5 },
      { id: "tines", label: "Tines", default: 0.6 },
      { id: "tremolo", label: "Tremolo", default: 0.2 },
      { id: "preamp", label: "Preamp", default: 0.4 }
    ],
    range: { low: 28, high: 100 },
    library: {
      rootUri: "INSTINCT://core/keys/rhodes-73",
      sizeMb: 3200,
      fileCount: 4400,
      format: "round-robin",
      velocityLayers: 10,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Suitcase Warm", designer: "Hughes Tech Team", tags: ["jazz", "rnb"], values: { bell: 0.4 } },
      { name: "80s Funk Chorus", designer: "Hughes Tech Team", tags: ["funk"], values: { tremolo: 0.5 } }
    ],
    sizeMb: 3200
  },
  {
    id: "ins-wurli-200",
    slug: "wurli-200",
    name: "Wurli 200",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "keys",
    tagline: "Reed electric piano with amp tremolo and natural bark.",
    chassis: "champagne",
    accent: "#EAB56A",
    uiKind: "keyboard-strip",
    polyphony: 24,
    macros: [
      { id: "bark", label: "Bark", default: 0.6 },
      { id: "tremolo", label: "Tremolo", default: 0.3 },
      { id: "amp", label: "Amp", default: 0.5 },
      MACRO.tone(0.55)
    ],
    range: { low: 36, high: 96 },
    library: {
      rootUri: "INSTINCT://core/keys/wurli-200",
      sizeMb: 1400,
      fileCount: 1800,
      format: "round-robin",
      velocityLayers: 6,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Motown Wurli", designer: "Hughes Tech Team", tags: ["motown"], values: { bark: 0.7 } }
    ],
    sizeMb: 1400
  },
  {
    id: "ins-organ-b3",
    slug: "organ-b3",
    name: "Tonewheel B-3",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "keys",
    tagline: "Tonewheel organ with 9 drawbars, chorus/vibrato, Leslie cabinet.",
    chassis: "obsidian",
    accent: "#6A9FF5",
    uiKind: "keyboard-strip",
    polyphony: 61,
    macros: Array.from({ length: 9 }).map((_, i) => ({
      id: `db${i + 1}`,
      label: `DB ${i + 1}`,
      default: [0.9, 0.6, 0.9, 0.4, 0.3, 0.4, 0.3, 0.4, 0.9][i] ?? 0.5
    })),
    range: { low: 36, high: 96 },
    library: {
      rootUri: "INSTINCT://core/keys/organ-b3",
      sizeMb: 1200,
      fileCount: 880,
      format: "physical-model",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Full Drawbars Leslie Fast", designer: "Hughes Tech Team", tags: ["gospel"], values: {} },
      { name: "Jazz Comp 888000000", designer: "Hughes Tech Team", tags: ["jazz"], values: {} }
    ],
    sizeMb: 1200
  },

  // ───────────── SYNTHS (4) ─────────────
  {
    id: "ins-poly-52",
    slug: "poly-52",
    name: "Poly-52",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "synth",
    tagline: "Vintage 80s polysynth recreated with analog-modeled oscillators.",
    chassis: "silver",
    accent: "#7EE7CE",
    uiKind: "synth-panel",
    polyphony: 16,
    macros: [
      { id: "cutoff", label: "Cutoff", default: 0.6 },
      { id: "reso", label: "Reso", default: 0.2 },
      MACRO.attack(0.05),
      MACRO.release(0.4),
      { id: "unison", label: "Unison", default: 0.4 },
      MACRO.drive(0.2)
    ],
    range: { low: 21, high: 108 },
    library: {
      rootUri: "INSTINCT://core/synths/poly-52",
      sizeMb: 40,
      fileCount: 64,
      format: "physical-model",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Epic 80s Pad", designer: "Hughes Tech Team", tags: ["80s"], values: { cutoff: 0.45 } },
      { name: "Lead Pluck", designer: "Hughes Tech Team", tags: ["lead"], values: { reso: 0.4, unison: 0.5 } }
    ],
    sizeMb: 40
  },
  {
    id: "ins-modular-ai",
    slug: "modular-ai",
    name: "Modular · Ai",
    vendor: "Hughes Technologies",
    family: "AI Forge",
    category: "synth",
    tagline: "AI-patched Eurorack-style modular — Michael picks modules from intent.",
    chassis: "holographic",
    accent: "#8C7BFF",
    uiKind: "synth-panel",
    polyphony: 8,
    macros: [
      { id: "macro1", label: "Morph", default: 0.5 },
      { id: "macro2", label: "Chaos", default: 0.3 },
      { id: "macro3", label: "Bloom", default: 0.4 },
      { id: "macro4", label: "Space", default: 0.5 }
    ],
    range: { low: 24, high: 108 },
    library: {
      rootUri: "INSTINCT://core/synths/modular-ai",
      sizeMb: 28,
      fileCount: 0,
      format: "physical-model",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Cinematic Rise", designer: "Michael AI", tags: ["cinematic"], values: { macro3: 0.8 } },
      { name: "Sci-Fi Pluck", designer: "Michael AI", tags: ["scifi"], values: { macro2: 0.6 } }
    ],
    sizeMb: 28
  },
  {
    id: "ins-wavetable-instinct",
    slug: "wavetable",
    name: "Wavetable INSTINCT",
    vendor: "Hughes Technologies",
    family: "Architexure Studio Gold",
    category: "synth",
    tagline: "3-oscillator wavetable synth with granular mode.",
    chassis: "silver",
    accent: "#5AC8FA",
    uiKind: "synth-panel",
    polyphony: 16,
    macros: [
      { id: "table", label: "Wavetable", default: 0.5 },
      { id: "unison", label: "Unison", default: 0.4 },
      { id: "cutoff", label: "Cutoff", default: 0.7 },
      { id: "granular", label: "Granular", default: 0.2 }
    ],
    range: { low: 24, high: 108 },
    library: {
      rootUri: "INSTINCT://core/synths/wavetable",
      sizeMb: 120,
      fileCount: 240,
      format: "granular",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "Future Bass Chord", designer: "Hughes Tech Team", tags: ["future-bass"], values: { unison: 0.7 } },
      { name: "Granular Pad", designer: "Hughes Tech Team", tags: ["pad"], values: { granular: 0.6 } }
    ],
    sizeMb: 120
  },
  {
    id: "ins-fm-legend",
    slug: "fm-legend",
    name: "FM Legend",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "synth",
    tagline: "6-operator FM synth modeled on classic DX-series.",
    chassis: "graphite",
    accent: "#9EA0FF",
    uiKind: "synth-panel",
    polyphony: 16,
    macros: [
      { id: "algo", label: "Algorithm", default: 0.2 },
      { id: "fb", label: "Feedback", default: 0.3 },
      { id: "mod", label: "Mod Index", default: 0.5 },
      MACRO.release(0.5)
    ],
    range: { low: 24, high: 108 },
    library: {
      rootUri: "INSTINCT://core/synths/fm-legend",
      sizeMb: 18,
      fileCount: 0,
      format: "physical-model",
      velocityLayers: 1,
      container: "INSTINCT-NCS"
    },
    presets: [
      { name: "DX E-Piano", designer: "Hughes Tech Team", tags: ["80s"], values: {} },
      { name: "Bass Slap", designer: "Hughes Tech Team", tags: ["bass"], values: { fb: 0.6 } }
    ],
    sizeMb: 18
  },

  // ───────────── GUITARS (3) ─────────────
  {
    id: "ins-strat-studio",
    slug: "strat-studio",
    name: "Strat Studio",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "guitar",
    tagline: "Double-tracked Strat — amp + DI with strumming + single-note modes.",
    chassis: "ivory",
    accent: "#E3C8A0",
    uiKind: "guitar-neck",
    polyphony: 6,
    macros: [
      { id: "ampBlend", label: "Amp/DI", default: 0.55 },
      { id: "pickPos", label: "Pickup", default: 0.4 },
      { id: "tone", label: "Tone", default: 0.55 },
      { id: "strum", label: "Strum", default: 0.3 }
    ],
    range: { low: 40, high: 76 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/guitars/strat/sustain.ncs" },
      { id: "mute", label: "Palm Mute", keySwitch: 0, sampleUri: "INSTINCT://core/guitars/strat/mute.ncs" },
      { id: "harm", label: "Harmonic", keySwitch: 1, sampleUri: "INSTINCT://core/guitars/strat/harm.ncs" },
      { id: "slide", label: "Slide", keySwitch: 2, sampleUri: "INSTINCT://core/guitars/strat/slide.ncs" },
      { id: "chug", label: "Chug", keySwitch: 3, sampleUri: "INSTINCT://core/guitars/strat/chug.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/guitars/strat",
      sizeMb: 4200,
      fileCount: 6800,
      format: "round-robin",
      velocityLayers: 10,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Clean Funk", designer: "Hughes Tech Team", tags: ["funk"], values: { ampBlend: 0.3 } },
      { name: "Indie Jangle", designer: "Hughes Tech Team", tags: ["indie"], values: { tone: 0.7 } }
    ],
    sizeMb: 4200
  },
  {
    id: "ins-les-paul",
    slug: "les-paul",
    name: "Les Paul Gold",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "guitar",
    tagline: "Humbucker guitar through a 4x12 cab — rock, metal, ballads.",
    chassis: "champagne",
    accent: "#E0B36A",
    uiKind: "guitar-neck",
    polyphony: 6,
    macros: [
      { id: "gain", label: "Gain", default: 0.4 },
      { id: "tone", label: "Tone", default: 0.55 },
      { id: "cab", label: "Cabinet", default: 0.5 },
      { id: "feedback", label: "Feedback", default: 0.25 }
    ],
    range: { low: 40, high: 76 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/guitars/lespaul/sustain.ncs" },
      { id: "pinch", label: "Pinch Harmonic", keySwitch: 0, sampleUri: "INSTINCT://core/guitars/lespaul/pinch.ncs" },
      { id: "powerChord", label: "Power Chord", keySwitch: 1, sampleUri: "INSTINCT://core/guitars/lespaul/power.ncs" },
      { id: "divebomb", label: "Dive Bomb", keySwitch: 2, sampleUri: "INSTINCT://core/guitars/lespaul/dive.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/guitars/lespaul",
      sizeMb: 3600,
      fileCount: 5200,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Classic Rock Rhythm", designer: "Hughes Tech Team", tags: ["rock"], values: { gain: 0.45 } },
      { name: "Metal Chug", designer: "Hughes Tech Team", tags: ["metal"], values: { gain: 0.8 } }
    ],
    sizeMb: 3600
  },
  {
    id: "ins-acoustic-nylon",
    slug: "acoustic-nylon",
    name: "Acoustic Nylon",
    vendor: "Hughes Technologies",
    family: "Vinyl Room",
    category: "guitar",
    tagline: "Classical nylon-string acoustic — fingerstyle + strum.",
    chassis: "ivory",
    accent: "#E1D0AC",
    uiKind: "guitar-neck",
    polyphony: 8,
    macros: [
      { id: "pickPos", label: "Pick Pos", default: 0.45 },
      { id: "body", label: "Body", default: 0.6 },
      { id: "fingerNoise", label: "Finger Noise", default: 0.4 },
      { id: "strum", label: "Strum", default: 0.3 }
    ],
    range: { low: 40, high: 76 },
    articulations: [
      { id: "finger", label: "Finger", sampleUri: "INSTINCT://core/guitars/nylon/finger.ncs" },
      { id: "strum", label: "Strum", keySwitch: 0, sampleUri: "INSTINCT://core/guitars/nylon/strum.ncs" },
      { id: "harm", label: "Harmonic", keySwitch: 1, sampleUri: "INSTINCT://core/guitars/nylon/harm.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/guitars/nylon",
      sizeMb: 2100,
      fileCount: 3400,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Bossa", designer: "Hughes Tech Team", tags: ["bossa"], values: {} },
      { name: "Latin Balad", designer: "Hughes Tech Team", tags: ["latin"], values: {} }
    ],
    sizeMb: 2100
  },

  // ───────────── BRASS (2) ─────────────
  {
    id: "ins-brass-section",
    slug: "brass-section",
    name: "Brass Section",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "brass",
    tagline: "Trumpets, trombones, tenors, baris — section players with legato.",
    chassis: "champagne",
    accent: "#E0B36A",
    uiKind: "orchestral-stage",
    polyphony: 32,
    macros: [
      { id: "section", label: "Section Size", default: 0.6 },
      { id: "dynamics", label: "Dynamics", default: 0.5 },
      { id: "vibrato", label: "Vibrato", default: 0.35 },
      { id: "room", label: "Hall", default: 0.5 }
    ],
    range: { low: 36, high: 84 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/brass/section/sustain.ncs" },
      { id: "staccato", label: "Staccato", keySwitch: 0, sampleUri: "INSTINCT://core/brass/section/staccato.ncs" },
      { id: "marcato", label: "Marcato", keySwitch: 1, sampleUri: "INSTINCT://core/brass/section/marcato.ncs" },
      { id: "fall", label: "Fall", keySwitch: 2, sampleUri: "INSTINCT://core/brass/section/fall.ncs" },
      { id: "doit", label: "Doit", keySwitch: 3, sampleUri: "INSTINCT://core/brass/section/doit.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/brass/section",
      sizeMb: 8600,
      fileCount: 11400,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Motown Horns", designer: "Hughes Tech Team", tags: ["motown"], values: { dynamics: 0.7 } },
      { name: "Cinematic Full", designer: "Hughes Tech Team", tags: ["cinematic"], values: { section: 0.9 } }
    ],
    sizeMb: 8600
  },
  {
    id: "ins-solo-trumpet",
    slug: "solo-trumpet",
    name: "Solo Trumpet",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "brass",
    tagline: "Principal trumpet — legato, staccato, falls, mute variants.",
    chassis: "champagne",
    accent: "#E0B36A",
    uiKind: "orchestral-stage",
    polyphony: 4,
    macros: [
      { id: "dynamics", label: "Dynamics", default: 0.55 },
      { id: "vibrato", label: "Vibrato", default: 0.4 },
      { id: "mute", label: "Mute", default: 0 },
      { id: "air", label: "Air", default: 0.3 }
    ],
    range: { low: 54, high: 84 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/brass/trumpet/sustain.ncs" },
      { id: "legato", label: "Legato", keySwitch: 0, sampleUri: "INSTINCT://core/brass/trumpet/legato.ncs" },
      { id: "stac", label: "Staccato", keySwitch: 1, sampleUri: "INSTINCT://core/brass/trumpet/staccato.ncs" },
      { id: "flutter", label: "Flutter", keySwitch: 2, sampleUri: "INSTINCT://core/brass/trumpet/flutter.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/brass/trumpet",
      sizeMb: 2600,
      fileCount: 3200,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Ballad Mute", designer: "Hughes Tech Team", tags: ["jazz"], values: { mute: 1 } }
    ],
    sizeMb: 2600
  },

  // ───────────── STRINGS (2) ─────────────
  {
    id: "ins-strings-chamber",
    slug: "strings-chamber",
    name: "Chamber Strings",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "strings",
    tagline: "Intimate 12-piece string ensemble with sordino.",
    chassis: "ivory",
    accent: "#E1D0AC",
    uiKind: "orchestral-stage",
    polyphony: 48,
    macros: [
      { id: "dynamics", label: "Dynamics", default: 0.5 },
      { id: "sordino", label: "Sordino", default: 0 },
      { id: "vibrato", label: "Vibrato", default: 0.4 },
      { id: "room", label: "Hall", default: 0.5 }
    ],
    range: { low: 28, high: 103 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/strings/chamber/sustain.ncs" },
      { id: "staccato", label: "Staccato", keySwitch: 0, sampleUri: "INSTINCT://core/strings/chamber/staccato.ncs" },
      { id: "pizzicato", label: "Pizzicato", keySwitch: 1, sampleUri: "INSTINCT://core/strings/chamber/pizz.ncs" },
      { id: "tremolo", label: "Tremolo", keySwitch: 2, sampleUri: "INSTINCT://core/strings/chamber/trem.ncs" },
      { id: "trill", label: "Trill", keySwitch: 3, sampleUri: "INSTINCT://core/strings/chamber/trill.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/strings/chamber",
      sizeMb: 9400,
      fileCount: 14200,
      format: "round-robin",
      velocityLayers: 10,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Sustain Warm", designer: "Hughes Tech Team", tags: ["orchestral"], values: { dynamics: 0.4 } }
    ],
    sizeMb: 9400
  },
  {
    id: "ins-cello-solo",
    slug: "cello-solo",
    name: "Solo Cello",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "strings",
    tagline: "Principal cello with true legato and long sustains.",
    chassis: "ivory",
    accent: "#E1D0AC",
    uiKind: "orchestral-stage",
    polyphony: 6,
    macros: [
      { id: "dynamics", label: "Dynamics", default: 0.55 },
      { id: "vibrato", label: "Vibrato", default: 0.45 },
      { id: "bow", label: "Bow Noise", default: 0.35 },
      { id: "room", label: "Hall", default: 0.5 }
    ],
    range: { low: 36, high: 76 },
    articulations: [
      { id: "legato", label: "Legato", sampleUri: "INSTINCT://core/strings/cello/legato.ncs" },
      { id: "staccato", label: "Staccato", keySwitch: 0, sampleUri: "INSTINCT://core/strings/cello/stac.ncs" },
      { id: "pizz", label: "Pizzicato", keySwitch: 1, sampleUri: "INSTINCT://core/strings/cello/pizz.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/strings/cello",
      sizeMb: 4200,
      fileCount: 5400,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Romantic Legato", designer: "Hughes Tech Team", tags: ["orchestral"], values: { vibrato: 0.7 } }
    ],
    sizeMb: 4200
  },

  // ───────────── WOODWINDS (1) ─────────────
  {
    id: "ins-woodwinds-ens",
    slug: "woodwinds",
    name: "Woodwind Ensemble",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "woodwinds",
    tagline: "Flutes, clarinets, oboes, bassoons — solo + section.",
    chassis: "ivory",
    accent: "#E1D0AC",
    uiKind: "orchestral-stage",
    polyphony: 24,
    macros: [
      { id: "section", label: "Section Size", default: 0.6 },
      { id: "dynamics", label: "Dynamics", default: 0.5 },
      { id: "vibrato", label: "Vibrato", default: 0.4 },
      { id: "room", label: "Hall", default: 0.5 }
    ],
    range: { low: 36, high: 96 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/winds/ens/sustain.ncs" },
      { id: "staccato", label: "Staccato", keySwitch: 0, sampleUri: "INSTINCT://core/winds/ens/stac.ncs" },
      { id: "trill", label: "Trill", keySwitch: 1, sampleUri: "INSTINCT://core/winds/ens/trill.ncs" },
      { id: "flutter", label: "Flutter", keySwitch: 2, sampleUri: "INSTINCT://core/winds/ens/flutter.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/winds/ens",
      sizeMb: 7200,
      fileCount: 9800,
      format: "round-robin",
      velocityLayers: 8,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Pastoral", designer: "Hughes Tech Team", tags: ["orchestral"], values: { dynamics: 0.4 } }
    ],
    sizeMb: 7200
  },

  // ───────────── ORCHESTRA (1) ─────────────
  {
    id: "ins-phil-tutti",
    slug: "phil-tutti",
    name: "Phil Tutti",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "orchestra",
    tagline: "Full-orchestra tutti patch — strings, brass, winds, perc in one keymap.",
    chassis: "porcelain",
    accent: "#E3D7C2",
    uiKind: "orchestral-stage",
    polyphony: 96,
    macros: [
      { id: "dynamics", label: "Dynamics", default: 0.55 },
      { id: "section", label: "Section Size", default: 0.85 },
      { id: "room", label: "Hall", default: 0.7 },
      { id: "ai", label: "AI Orchestration", default: 0.0 }
    ],
    range: { low: 21, high: 108 },
    articulations: [
      { id: "sustain", label: "Sustain", sampleUri: "INSTINCT://core/orchestra/tutti/sustain.ncs" },
      { id: "staccato", label: "Staccato", keySwitch: 0, sampleUri: "INSTINCT://core/orchestra/tutti/stac.ncs" },
      { id: "marcato", label: "Marcato", keySwitch: 1, sampleUri: "INSTINCT://core/orchestra/tutti/marcato.ncs" }
    ],
    library: {
      rootUri: "INSTINCT://core/orchestra/tutti",
      sizeMb: 28000,
      fileCount: 42000,
      format: "round-robin",
      velocityLayers: 10,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Hans-Style Epic", designer: "Hughes Tech Team", tags: ["cinematic"], values: { section: 1 } }
    ],
    sizeMb: 28000
  },

  // ───────────── CHOIR (1) ─────────────
  {
    id: "ins-choir-cathedral",
    slug: "choir-cathedral",
    name: "Cathedral Choir",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "choir",
    tagline: "SATB choir recorded in a real cathedral with vowel morphing.",
    chassis: "holographic",
    accent: "#C3B6FF",
    uiKind: "orchestral-stage",
    polyphony: 48,
    macros: [
      { id: "aah", label: "Ah", default: 0.7 },
      { id: "ooh", label: "Oh", default: 0.3 },
      { id: "mm", label: "Mm", default: 0.2 },
      { id: "dynamics", label: "Dynamics", default: 0.5 }
    ],
    range: { low: 40, high: 88 },
    library: {
      rootUri: "INSTINCT://core/choir/cathedral",
      sizeMb: 6800,
      fileCount: 8400,
      format: "round-robin",
      velocityLayers: 6,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Cinematic SATB", designer: "Hughes Tech Team", tags: ["cinematic"], values: { aah: 1 } }
    ],
    sizeMb: 6800
  },

  // ───────────── WORLD / EXOTIC (1) ─────────────
  {
    id: "ins-world-kit",
    slug: "world-kit",
    name: "World Kit",
    vendor: "Hughes Technologies",
    family: "Phil Orchestra One",
    category: "world",
    tagline: "Taiko, djembe, tabla, dombak, frame drum, shakers, bells.",
    chassis: "graphite",
    accent: "#B78A5A",
    uiKind: "mpc",
    polyphony: 16,
    macros: [MACRO.tone(0.5), MACRO.space(0.3), MACRO.drive(0.2)],
    pads: pads16("world-kit", [
      "Taiko Lo", "Taiko Mid", "Taiko Hi", "Djembe Lo",
      "Djembe Slap", "Djembe Tone", "Tabla Na", "Tabla Tin",
      "Dombak", "Frame Drum", "Shaker", "Bell Lo",
      "Bell Hi", "Cajon", "Guiro", "Claves"
    ], "#B78A5A"),
    library: {
      rootUri: "INSTINCT://core/world/kit",
      sizeMb: 2400,
      fileCount: 3200,
      format: "round-robin",
      velocityLayers: 6,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Cinematic Ethnic", designer: "Hughes Tech Team", tags: ["cinematic"], values: {} }
    ],
    sizeMb: 2400
  },

  // ───────────── PADS / TEXTURES (1) ─────────────
  {
    id: "ins-ai-forge-pads",
    slug: "ai-forge-pads",
    name: "AI Forge · Pads",
    vendor: "Hughes Technologies",
    family: "AI Forge",
    category: "pad",
    tagline: "AI-generated pad engine — describe an emotion, hear a pad.",
    chassis: "holographic",
    accent: "#8C7BFF",
    uiKind: "synth-panel",
    polyphony: 16,
    macros: [
      { id: "mood", label: "Mood", default: 0.5 },
      { id: "motion", label: "Motion", default: 0.4 },
      { id: "air", label: "Air", default: 0.6 },
      { id: "ai", label: "AI Fresh", default: 0.0 }
    ],
    range: { low: 24, high: 108 },
    library: {
      rootUri: "INSTINCT://core/pads/ai-forge",
      sizeMb: 320,
      fileCount: 480,
      format: "granular",
      velocityLayers: 4,
      container: "INSTINCT-NCS-Lossless"
    },
    presets: [
      { name: "Hopeful Dawn", designer: "Michael AI", tags: ["cinematic"], values: { mood: 0.75 } },
      { name: "Underwater Dream", designer: "Michael AI", tags: ["ambient"], values: { motion: 0.6 } }
    ],
    sizeMb: 320
  }
];

export function instrumentsByCategory(): Record<InstrumentCategory, VirtualInstrument[]> {
  const out: Record<string, VirtualInstrument[]> = {};
  for (const inst of INSTRUMENTS) (out[inst.category] ??= []).push(inst);
  return out as Record<InstrumentCategory, VirtualInstrument[]>;
}

export function findInstrument(id: string): VirtualInstrument | undefined {
  return INSTRUMENTS.find((i) => i.id === id);
}

export function searchInstruments(query: string): VirtualInstrument[] {
  const q = query.trim().toLowerCase();
  if (!q) return INSTRUMENTS;
  return INSTRUMENTS.filter((i) =>
    [i.name, i.tagline, i.family, i.category].some((s) =>
      s.toLowerCase().includes(q)
    ) || i.presets.some((p) => p.name.toLowerCase().includes(q))
  );
}

export const INSTRUMENT_CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  "drum-machine": "Drum Machines",
  "drum-kit": "Drum Kits",
  bass: "Bass",
  keys: "Keyboards",
  synth: "Synths",
  guitar: "Guitars",
  brass: "Brass",
  strings: "Strings",
  woodwinds: "Woodwinds",
  orchestra: "Orchestra",
  choir: "Choir",
  world: "World",
  pad: "Pads",
  texture: "Textures",
  fx: "FX"
};
