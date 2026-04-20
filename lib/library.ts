/**
 * INSTINCT — Sound & Sample Library model.
 * All mock. The browser UI treats this as the source of truth.
 */

export type LibraryFormat = "wav" | "aiff" | "flac" | "kit" | "preset";

export interface Sample {
  id: string;
  name: string;
  collectionId: string;
  kind: "one-shot" | "loop" | "stem" | "preset" | "kit";
  format: LibraryFormat;
  bpm?: number;
  keyRoot?: string;
  lengthSec: number;
  tags: string[];
  peaks: number[]; // thumbnail peaks 0..1
  favorite?: boolean;
  aiGenerated?: boolean;
}

export interface LibraryCollection {
  id: string;
  name: string;
  vendor: string;
  premium: boolean;
  cover: string; // css gradient
  description: string;
  sampleCount: number;
}

function peaks(seed: number, n = 48): number[] {
  // compact peak thumbnail
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const t = i / n;
    out.push(
      Math.max(
        0.08,
        Math.min(
          1,
          0.35 +
            Math.sin(t * Math.PI * 3) * 0.25 +
            ((s / 233280) - 0.5) * 0.6
        )
      )
    );
  }
  return out;
}

export const COLLECTIONS: LibraryCollection[] = [
  {
    id: "col-hughes-core",
    name: "INSTINCT Core",
    vendor: "Hughes Technologies",
    premium: true,
    cover: "linear-gradient(135deg,#ffffff,#d6dadf)",
    description: "Premium foundational library. 4,200 curated sounds.",
    sampleCount: 4200
  },
  {
    id: "col-architexure-studio",
    name: "Architexure Studio Gold",
    vendor: "Hughes Technologies",
    premium: true,
    cover: "linear-gradient(135deg,#f4ead4,#d9b36a)",
    description: "Neve / SSL / API-captured stems and drum kits.",
    sampleCount: 1850
  },
  {
    id: "col-ai-forge",
    name: "AI Forge · M|Ai-7",
    vendor: "Michael AI",
    premium: true,
    cover: "linear-gradient(135deg,#14161f,#8C7BFF)",
    description: "Generated in-session by Michael AI. Unlimited.",
    sampleCount: 9999
  },
  {
    id: "col-vinyl-room",
    name: "Vinyl Room",
    vendor: "Hughes Technologies",
    premium: false,
    cover: "linear-gradient(135deg,#1f2329,#454A51)",
    description: "Dusty drums, Rhodes, tape beds, vinyl hiss.",
    sampleCount: 1120
  },
  {
    id: "col-orchestral",
    name: "Phil Orchestra One",
    vendor: "Hughes Technologies",
    premium: true,
    cover: "linear-gradient(135deg,#ffffff,#7E9FD9)",
    description: "Recorded at Scoring Stage A with 64-piece orchestra.",
    sampleCount: 3400
  },
  {
    id: "col-808",
    name: "808 Anatomy",
    vendor: "Hughes Technologies",
    premium: false,
    cover: "linear-gradient(135deg,#EF6F6C,#2B2F34)",
    description: "Everything from sub designs to glue-saturated tails.",
    sampleCount: 812
  }
];

export const SAMPLES: Sample[] = [
  {
    id: "s-kick-ghost",
    name: "Kick · Ghost Room",
    collectionId: "col-hughes-core",
    kind: "one-shot",
    format: "wav",
    lengthSec: 1.2,
    tags: ["drums", "kick", "analog"],
    peaks: peaks(11),
    favorite: true
  },
  {
    id: "s-kick-sub",
    name: "Kick · Sub 50",
    collectionId: "col-808",
    kind: "one-shot",
    format: "wav",
    lengthSec: 1.8,
    tags: ["drums", "kick", "sub", "808"],
    peaks: peaks(22)
  },
  {
    id: "s-snare-marble",
    name: "Snare · Marble Hall",
    collectionId: "col-architexure-studio",
    kind: "one-shot",
    format: "wav",
    lengthSec: 0.8,
    tags: ["drums", "snare", "room"],
    peaks: peaks(33)
  },
  {
    id: "s-loop-drum-96",
    name: "Breaks · Soul 96",
    collectionId: "col-vinyl-room",
    kind: "loop",
    format: "wav",
    bpm: 96,
    lengthSec: 5.0,
    tags: ["loop", "drums", "vinyl"],
    peaks: peaks(44)
  },
  {
    id: "s-loop-chords",
    name: "Chords · Warm Rhodes",
    collectionId: "col-vinyl-room",
    kind: "loop",
    format: "wav",
    bpm: 92,
    keyRoot: "F min",
    lengthSec: 8.0,
    tags: ["chords", "rhodes", "keys"],
    peaks: peaks(55)
  },
  {
    id: "s-preset-pad",
    name: "Pad · Aurora Hover",
    collectionId: "col-ai-forge",
    kind: "preset",
    format: "preset",
    keyRoot: "C maj",
    lengthSec: 12.0,
    tags: ["pad", "ambient", "ai"],
    peaks: peaks(66),
    aiGenerated: true
  },
  {
    id: "s-preset-lead",
    name: "Lead · Neon Arc",
    collectionId: "col-ai-forge",
    kind: "preset",
    format: "preset",
    keyRoot: "A min",
    lengthSec: 7.5,
    tags: ["lead", "synth", "ai"],
    peaks: peaks(77),
    aiGenerated: true
  },
  {
    id: "s-kit-trap",
    name: "Kit · Midnight Trap",
    collectionId: "col-808",
    kind: "kit",
    format: "kit",
    bpm: 140,
    lengthSec: 0,
    tags: ["kit", "trap", "drums"],
    peaks: peaks(88)
  },
  {
    id: "s-stem-bass",
    name: "Bass · Upright Hall",
    collectionId: "col-orchestral",
    kind: "stem",
    format: "wav",
    keyRoot: "E maj",
    lengthSec: 16,
    tags: ["bass", "orchestral", "stem"],
    peaks: peaks(99)
  },
  {
    id: "s-stem-strings",
    name: "Strings · Cinematic Rise",
    collectionId: "col-orchestral",
    kind: "stem",
    format: "wav",
    bpm: 120,
    keyRoot: "D min",
    lengthSec: 22,
    tags: ["strings", "cinematic", "rise"],
    peaks: peaks(101)
  },
  {
    id: "s-one-perc-1",
    name: "Perc · Glass Tick",
    collectionId: "col-hughes-core",
    kind: "one-shot",
    format: "wav",
    lengthSec: 0.2,
    tags: ["percussion", "tick", "glass"],
    peaks: peaks(111)
  },
  {
    id: "s-one-perc-2",
    name: "Perc · Wood Shaker",
    collectionId: "col-hughes-core",
    kind: "one-shot",
    format: "wav",
    lengthSec: 0.5,
    tags: ["percussion", "shaker", "wood"],
    peaks: peaks(121)
  }
];

export function listCategories(): { key: string; label: string }[] {
  return [
    { key: "all", label: "All Sounds" },
    { key: "one-shot", label: "One-shots" },
    { key: "loop", label: "Loops" },
    { key: "stem", label: "Stems" },
    { key: "preset", label: "Presets" },
    { key: "kit", label: "Kits" },
    { key: "favorite", label: "Favorites" },
    { key: "ai", label: "AI Forge" }
  ];
}

export function filterSamples(
  query: string,
  category: string,
  collectionId: string | null
): Sample[] {
  return SAMPLES.filter((s) => {
    if (collectionId && s.collectionId !== collectionId) return false;
    if (category === "favorite" && !s.favorite) return false;
    if (category === "ai" && !s.aiGenerated) return false;
    if (
      category !== "all" &&
      category !== "favorite" &&
      category !== "ai" &&
      s.kind !== category
    )
      return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q)) ||
      (s.keyRoot?.toLowerCase().includes(q) ?? false)
    );
  });
}
