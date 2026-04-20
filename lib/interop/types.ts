/**
 * INSTINCT — Neutral Session Interchange Model.
 *
 * Every DAW importer converts its native format into an InteropSession;
 * every exporter converts an InteropSession back out. This keeps each
 * format adapter small and side-effect-free.
 */

export type InteropFormat =
  | "aaf"        // Advanced Authoring Format (AMWA ST 291)
  | "omf"        // Open Media Framework
  | "bwf"        // Broadcast WAV File (EBU Tech 3285)
  | "rpp"        // REAPER project (plain-text)
  | "als"        // Ableton Live Set (gzipped XML)
  | "logicx"     // Logic Pro bundle (plist + media)
  | "flp"        // FL Studio project (binary TLV)
  | "reason"     // Reason Song bundle
  | "song"       // PreSonus Studio One (XML-in-ZIP)
  | "ptx";       // Avid Pro Tools Session (binary, Avid-proprietary)

export interface InteropSession {
  meta: {
    name: string;
    sampleRate: number;
    bitDepth: 16 | 24 | 32;
    tempoBpm: number;
    timeSignature: [number, number];
    lengthSeconds: number;
    source: InteropFormat | "instinct";
  };
  tracks: InteropTrack[];
  markers?: InteropMarker[];
  tempoMap?: InteropTempoEvent[];
}

export interface InteropTrack {
  id: string;
  name: string;
  kind: "audio" | "midi" | "aux" | "vca" | "master";
  color?: string;
  muted?: boolean;
  soloed?: boolean;
  volumeDb?: number;
  panL2R?: number; // -1..+1
  clips: InteropClip[];
  automation?: InteropAutomationLane[];
  pluginRefs?: InteropPluginRef[];
}

export interface InteropClip {
  id: string;
  name: string;
  startSec: number;
  lengthSec: number;
  sourcePath?: string; // relative to session root for AUDIO clips
  fadeInSec?: number;
  fadeOutSec?: number;
  gainDb?: number;
  midiNotes?: InteropNote[]; // when parent track.kind === 'midi'
}

export interface InteropNote {
  pitch: number;      // 0-127
  velocity: number;   // 1-127
  startBeats: number; // relative to clip start
  lengthBeats: number;
  channel: number;    // 1-16
}

export interface InteropMarker {
  id: string;
  name: string;
  positionSec: number;
  kind: "marker" | "loop" | "region";
}

export interface InteropTempoEvent {
  positionSec: number;
  bpm: number;
}

export interface InteropAutomationLane {
  parameter: string;
  points: { timeSec: number; value: number }[];
}

export interface InteropPluginRef {
  name: string;
  vendor?: string;
  uid?: string; // VST3 UID, AU type/subtype, AAX plugin id, or INSTINCT plugin id
  preset?: string;
  bypass?: boolean;
}

export interface InteropImportResult {
  session: InteropSession;
  warnings: string[];
  unsupported: string[];
  bytesRead: number;
}

export interface InteropExportResult {
  buffer: Uint8Array;
  mimeType: string;
  suggestedFilename: string;
  warnings: string[];
}
