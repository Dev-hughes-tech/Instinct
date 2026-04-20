/**
 * Michael AI capability definitions. Each capability has a user-facing name,
 * short description, and server-side prompt builder that assembles a precise
 * message for Claude. Kept pure + side-effect free so both the API route and
 * tests can use them.
 */

import type { Session } from "./types";

export type MichaelCapabilityId =
  | "mix-suggestion"
  | "master-plan"
  | "sound-design"
  | "sound-selection"
  | "sequencing"
  | "chat";

export interface MichaelCapability {
  id: MichaelCapabilityId;
  name: string;
  shortName: string;
  description: string;
}

export const CAPABILITIES: MichaelCapability[] = [
  {
    id: "mix-suggestion",
    name: "Mix Suggestion",
    shortName: "Mix",
    description: "Analyze the session and propose concrete mix moves."
  },
  {
    id: "master-plan",
    name: "Mastering Plan",
    shortName: "Master",
    description: "Build a mastering chain with LUFS and true-peak targets."
  },
  {
    id: "sound-design",
    name: "Sound Design",
    shortName: "Design",
    description: "Design a patch from a description. Returns parameters."
  },
  {
    id: "sound-selection",
    name: "Sound Selection",
    shortName: "Select",
    description: "Recommend library sounds for a brief."
  },
  {
    id: "sequencing",
    name: "Sequencing",
    shortName: "Sequence",
    description: "Suggest arrangement / pattern / groove moves."
  },
  {
    id: "chat",
    name: "Chat",
    shortName: "Chat",
    description: "Ask Michael anything about the current session."
  }
];

function summarizeSession(session: Session): string {
  const lines: string[] = [];
  lines.push(`Session: ${session.name}`);
  lines.push(`Tempo: ${session.transport.tempoBpm} BPM`);
  lines.push(`Time signature: ${session.transport.timeSig[0]}/${session.transport.timeSig[1]}`);
  lines.push(`Sample rate: ${session.sampleRate} Hz @ ${session.bitDepth}-bit`);
  lines.push(`Tracks (${session.tracks.length}):`);
  for (const t of session.tracks) {
    lines.push(
      `  - [${t.index + 1}] ${t.name} (${t.kind}, ${t.inputLabel}→${t.outputLabel}, ${t.clips.length} clips)`
    );
  }
  if (session.pluginInstances.length) {
    lines.push(`Plugins in use:`);
    for (const i of session.pluginInstances) {
      const d = session.plugins.find((p) => p.id === i.deviceId);
      lines.push(`  - ${d?.name ?? i.deviceId} on ${i.trackId}${i.presetName ? ` · preset "${i.presetName}"` : ""}`);
    }
  }
  return lines.join("\n");
}

export function buildUserMessage(
  capabilityId: MichaelCapabilityId,
  session: Session,
  input: string
): string {
  const ctx = summarizeSession(session);
  switch (capabilityId) {
    case "mix-suggestion":
      return `${ctx}

The user is asking for mix suggestions. Focus on level, panorama, EQ, and dynamics.
Return JSON in this exact shape:
{
  "headline": "one sentence diagnosis",
  "moves": [
    { "track": "track name", "action": "what to do", "target": "numeric target or null", "reason": "short reason" }
  ],
  "summary": "2-3 sentences"
}

User brief:
${input || "(no additional brief — infer from session)"}`;
    case "master-plan":
      return `${ctx}

The user is asking for a mastering plan. Return JSON:
{
  "loudnessTargetLufs": number,
  "truePeakDbfs": number,
  "chain": [
    { "stage": "EQ|COMP|SAT|LIMIT|STEREO", "plugin": "name", "settings": "short setting summary" }
  ],
  "notes": "2-3 sentences"
}

User brief:
${input || "Radio/streaming loudness standard."}`;
    case "sound-design":
      return `${ctx}

The user wants to design a sound. Return JSON:
{
  "patchName": "string",
  "synthesis": "subtractive|FM|wavetable|granular|sampling|hybrid",
  "macros": { "name": "value 0..1" },
  "oscillators": [ { "shape": "saw|sine|square|noise|sample", "detune": "cents", "level": "dB" } ],
  "filter": { "type": "LP|HP|BP|notch", "cutoff": "Hz", "resonance": "0..1" },
  "envelopes": { "amp": { "a": "ms", "d": "ms", "s": "0..1", "r": "ms" } },
  "effects": [ "reverb | delay | chorus | saturation | ..." ],
  "instructions": "one paragraph on how to build this in a hybrid synth"
}

User brief:
${input || "warm analog pad, slow attack, wide stereo"}`;
    case "sound-selection":
      return `${ctx}

The user wants sound selection recommendations from the INSTINCT Library
(collections: INSTINCT Core, Architexure Studio Gold, AI Forge M|Ai-7, Vinyl Room, Phil Orchestra One, 808 Anatomy).
Return JSON:
{
  "picks": [
    { "role": "kick|snare|hat|bass|keys|vox|pad|lead|fx", "sample": "descriptive name", "collection": "string", "reason": "short" }
  ],
  "summary": "2-3 sentences"
}

User brief:
${input || "recommend a cohesive palette for this session's tempo and style"}`;
    case "sequencing":
      return `${ctx}

The user wants sequencing / arrangement advice. Return JSON:
{
  "pattern": [
    { "bar": number, "moves": "what happens here" }
  ],
  "groove": "one sentence on groove/swing/humanize",
  "notes": "2-3 sentences"
}

User brief:
${input || "build a 32-bar arrangement with intro, drop, breakdown, outro"}`;
    case "chat":
      return `${ctx}

User message:
${input}`;
    default:
      return input;
  }
}
