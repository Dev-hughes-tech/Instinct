"use client";

/**
 * INSTINCT — WebMIDI detection layer.
 *
 * Thin, real WebMIDI wrapper that:
 *   - requests MIDI access with sysex = true
 *   - enumerates live inputs & outputs
 *   - streams state-change events (connect / disconnect / port open / close)
 *   - decodes incoming MIDI bytes into { type, channel, data1, data2 }
 *   - cross-references detected devices against INSTINCT's hardware registry
 *     so each discovered port gets a capability profile automatically
 *
 * Browser support:
 *   - Chromium-based browsers: native WebMIDI (sysex requires permissions prompt)
 *   - Safari: requires user gesture; falls back to "no-support" state
 *   - Firefox: native support since v108
 */

import { matchByName, type HardwareProfile } from "./hardware";

export type MidiPortType = "input" | "output";
export type MidiPortState = "connected" | "disconnected";

export interface DetectedMidiPort {
  id: string;
  name: string;
  manufacturer: string;
  type: MidiPortType;
  state: MidiPortState;
  version?: string;
  hardwareProfile?: HardwareProfile;
}

export interface DecodedMidiMessage {
  type:
    | "note-on"
    | "note-off"
    | "cc"
    | "program"
    | "channel-pressure"
    | "poly-pressure"
    | "pitch-bend"
    | "sysex"
    | "clock"
    | "start"
    | "stop"
    | "continue"
    | "active-sense"
    | "unknown";
  channel: number;
  data1: number;
  data2: number;
  timestamp: number;
  raw: Uint8Array;
  portId: string;
}

export interface WebMidiStatus {
  supported: boolean;
  granted: boolean;
  error?: string;
}

export type MidiListener = (m: DecodedMidiMessage) => void;
export type StateListener = (ports: DetectedMidiPort[]) => void;

// ---------- detection ---------------------------------------------------

export function isWebMidiSupported(): boolean {
  return typeof navigator !== "undefined" && typeof (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess === "function";
}

let midiAccess: MIDIAccess | null = null;
const msgListeners = new Set<MidiListener>();
const stateListeners = new Set<StateListener>();

export async function enableWebMidi(): Promise<WebMidiStatus> {
  if (!isWebMidiSupported()) {
    return { supported: false, granted: false, error: "WebMIDI is not supported by this browser." };
  }
  try {
    midiAccess = await (navigator as unknown as { requestMIDIAccess: (opts?: { sysex?: boolean }) => Promise<MIDIAccess> }).requestMIDIAccess({ sysex: true });
    if (!midiAccess) throw new Error("Empty MIDI access.");
    midiAccess.onstatechange = () => emitState();
    bindInputs();
    emitState();
    return { supported: true, granted: true };
  } catch (e) {
    return { supported: true, granted: false, error: e instanceof Error ? e.message : "Unknown WebMIDI error." };
  }
}

function bindInputs() {
  if (!midiAccess) return;
  midiAccess.inputs.forEach((input) => {
    input.onmidimessage = (ev: MIDIMessageEvent) => {
      const decoded = decode(ev.data, ev.timeStamp, input.id);
      msgListeners.forEach((fn) => fn(decoded));
    };
  });
}

function emitState() {
  if (!midiAccess) return;
  bindInputs();
  const ports = listPorts();
  stateListeners.forEach((fn) => fn(ports));
}

export function listPorts(): DetectedMidiPort[] {
  if (!midiAccess) return [];
  const ports: DetectedMidiPort[] = [];
  midiAccess.inputs.forEach((p) => ports.push(toDetected(p, "input")));
  midiAccess.outputs.forEach((p) => ports.push(toDetected(p, "output")));
  return ports;
}

function toDetected(port: MIDIInput | MIDIOutput, type: MidiPortType): DetectedMidiPort {
  const name = port.name ?? "Unknown";
  return {
    id: port.id,
    name,
    manufacturer: port.manufacturer ?? "Unknown",
    type,
    state: (port.state as MidiPortState) ?? "disconnected",
    version: port.version ?? undefined,
    hardwareProfile: matchByName(name)
  };
}

export function onMidiMessage(fn: MidiListener): () => void {
  msgListeners.add(fn);
  return () => msgListeners.delete(fn);
}

export function onStateChange(fn: StateListener): () => void {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

// ---------- decode ------------------------------------------------------

export function decode(bytes: Uint8Array, timestamp: number, portId: string): DecodedMidiMessage {
  const status = bytes[0] ?? 0;
  const channel = (status & 0x0f) + 1;
  const high = status & 0xf0;
  let type: DecodedMidiMessage["type"] = "unknown";
  if (high === 0x80) type = "note-off";
  else if (high === 0x90) type = (bytes[2] ?? 0) === 0 ? "note-off" : "note-on";
  else if (high === 0xa0) type = "poly-pressure";
  else if (high === 0xb0) type = "cc";
  else if (high === 0xc0) type = "program";
  else if (high === 0xd0) type = "channel-pressure";
  else if (high === 0xe0) type = "pitch-bend";
  else if (status === 0xf0) type = "sysex";
  else if (status === 0xf8) type = "clock";
  else if (status === 0xfa) type = "start";
  else if (status === 0xfb) type = "continue";
  else if (status === 0xfc) type = "stop";
  else if (status === 0xfe) type = "active-sense";

  return {
    type,
    channel,
    data1: bytes[1] ?? 0,
    data2: bytes[2] ?? 0,
    timestamp,
    raw: bytes,
    portId
  };
}

// ---------- send --------------------------------------------------------

export function sendNoteOn(portId: string, note: number, velocity = 100, channel = 1) {
  const out = midiAccess?.outputs.get(portId);
  out?.send([0x90 | ((channel - 1) & 0x0f), note & 0x7f, velocity & 0x7f]);
}
export function sendNoteOff(portId: string, note: number, channel = 1) {
  const out = midiAccess?.outputs.get(portId);
  out?.send([0x80 | ((channel - 1) & 0x0f), note & 0x7f, 0]);
}
export function sendCC(portId: string, cc: number, value: number, channel = 1) {
  const out = midiAccess?.outputs.get(portId);
  out?.send([0xb0 | ((channel - 1) & 0x0f), cc & 0x7f, value & 0x7f]);
}

// ---------- minimal WebMIDI type declarations (avoid @types/webmidi dep) -

type MIDIInputMap = { forEach(cb: (v: MIDIInput, k: string) => void): void; get(id: string): MIDIInput | undefined };
type MIDIOutputMap = { forEach(cb: (v: MIDIOutput, k: string) => void): void; get(id: string): MIDIOutput | undefined };
interface MIDIPort {
  id: string;
  name?: string;
  manufacturer?: string;
  version?: string;
  state: string;
  type: string;
}
interface MIDIInput extends MIDIPort {
  onmidimessage: ((ev: MIDIMessageEvent) => void) | null;
}
interface MIDIOutput extends MIDIPort {
  send(data: number[] | Uint8Array, timestamp?: number): void;
}
interface MIDIMessageEvent {
  data: Uint8Array;
  timeStamp: number;
}
interface MIDIAccess {
  inputs: MIDIInputMap;
  outputs: MIDIOutputMap;
  sysexEnabled: boolean;
  onstatechange: ((ev: unknown) => void) | null;
}
