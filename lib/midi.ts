/**
 * INSTINCT — MIDI Studio model.
 * Covers keyboards, pad controllers, control surfaces, transport controllers,
 * expression pedals, DAW-bridge devices. Auto-detection + bidirectional
 * communication are simulated at the UI layer — a real implementation would
 * bind into WebMIDI (web), CoreMIDI / WinMM (desktop), and BLE MIDI (mobile).
 */

export type MidiDeviceKind =
  | "keyboard"
  | "pad"
  | "control-surface"
  | "dj"
  | "wind"
  | "guitar-to-midi"
  | "breath"
  | "expression";

export type MidiProtocol = "USB" | "BLE" | "DIN" | "Network (RTP)" | "Virtual";

export interface MidiPort {
  id: string;
  direction: "in" | "out";
  protocol: MidiProtocol;
  connected: boolean;
}

export interface MidiMapping {
  id: string;
  control: string; // "Knob 1", "Pad 05", "Fader 3"
  messageType: "CC" | "Note" | "PitchBend" | "NRPN" | "SysEx";
  channel: number;
  value: number; // CC # or note #
  destination: string; // "Track 3 Volume", "Plugin: M|Ai-7 Macro"
}

export interface MidiDevice {
  id: string;
  name: string;
  vendor: string;
  kind: MidiDeviceKind;
  protocols: MidiProtocol[];
  connected: boolean;
  autoMapProfile: string;
  firmware?: string;
  color: string;
  ports: MidiPort[];
  mappings: MidiMapping[];
}

export const MIDI_DEVICES: MidiDevice[] = [
  {
    id: "d-key-88",
    name: "Hughes Keys 88",
    vendor: "Hughes Technologies",
    kind: "keyboard",
    protocols: ["USB", "BLE", "DIN"],
    connected: true,
    autoMapProfile: "INSTINCT Studio 88",
    firmware: "2.3.0",
    color: "#7E9FD9",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: true },
      { id: "p2", direction: "out", protocol: "USB", connected: true },
      { id: "p3", direction: "in", protocol: "DIN", connected: false }
    ],
    mappings: [
      { id: "m1", control: "Mod Wheel", messageType: "CC", channel: 1, value: 1, destination: "M|Ai-7 · Macro" },
      { id: "m2", control: "Pitch Bend", messageType: "PitchBend", channel: 1, value: 0, destination: "Track 5 · Pitch" },
      { id: "m3", control: "Sustain", messageType: "CC", channel: 1, value: 64, destination: "Keys · Sustain" }
    ]
  },
  {
    id: "d-pad-maschine",
    name: "Maschine MK3",
    vendor: "Native Instruments",
    kind: "pad",
    protocols: ["USB"],
    connected: true,
    autoMapProfile: "NI Pad Studio",
    firmware: "1.4.12",
    color: "#EF6F6C",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: true },
      { id: "p2", direction: "out", protocol: "USB", connected: true }
    ],
    mappings: Array.from({ length: 16 }).map((_, i) => ({
      id: `m-pad-${i}`,
      control: `Pad ${String(i + 1).padStart(2, "0")}`,
      messageType: "Note" as const,
      channel: 10,
      value: 36 + i,
      destination: `Kit · Slot ${i + 1}`
    }))
  },
  {
    id: "d-push-3",
    name: "Push 3",
    vendor: "Ableton",
    kind: "control-surface",
    protocols: ["USB"],
    connected: false,
    autoMapProfile: "Push Surface Bridge",
    color: "#5BD4A4",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: false },
      { id: "p2", direction: "out", protocol: "USB", connected: false }
    ],
    mappings: [
      { id: "m1", control: "Encoder 1", messageType: "CC", channel: 1, value: 71, destination: "Selected Track · Volume" },
      { id: "m2", control: "Encoder 2", messageType: "CC", channel: 1, value: 72, destination: "Selected Track · Pan" }
    ]
  },
  {
    id: "d-komplete",
    name: "Komplete Kontrol S88 MK3",
    vendor: "Native Instruments",
    kind: "keyboard",
    protocols: ["USB", "DIN"],
    connected: true,
    autoMapProfile: "NKS Extended",
    color: "#8C7BFF",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: true },
      { id: "p2", direction: "out", protocol: "USB", connected: true }
    ],
    mappings: [
      { id: "m1", control: "Knob 1", messageType: "CC", channel: 1, value: 21, destination: "M|Ai-7 · Intensity" },
      { id: "m2", control: "Knob 2", messageType: "CC", channel: 1, value: 22, destination: "VCA-3A · Peak" },
      { id: "m3", control: "Knob 3", messageType: "CC", channel: 1, value: 23, destination: "BC-2 · Drive" }
    ]
  },
  {
    id: "d-midimix",
    name: "MIDImix",
    vendor: "Akai Professional",
    kind: "control-surface",
    protocols: ["USB"],
    connected: true,
    autoMapProfile: "INSTINCT Mix 8",
    color: "#E8B84F",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: true },
      { id: "p2", direction: "out", protocol: "USB", connected: true }
    ],
    mappings: Array.from({ length: 8 }).map((_, i) => ({
      id: `m-fader-${i}`,
      control: `Fader ${i + 1}`,
      messageType: "CC" as const,
      channel: 1,
      value: 19 + i,
      destination: `Mixer · Strip ${i + 1} Volume`
    }))
  },
  {
    id: "d-launchpad",
    name: "Launchpad Pro MK3",
    vendor: "Novation",
    kind: "pad",
    protocols: ["USB", "BLE"],
    connected: false,
    autoMapProfile: "Session + Note",
    color: "#38D1E0",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: false },
      { id: "p2", direction: "out", protocol: "USB", connected: false }
    ],
    mappings: []
  },
  {
    id: "d-expressE",
    name: "Seaboard BLOCK M",
    vendor: "ROLI",
    kind: "expression",
    protocols: ["BLE", "USB"],
    connected: false,
    autoMapProfile: "MPE Expressive",
    color: "#D97EC7",
    ports: [
      { id: "p1", direction: "in", protocol: "BLE", connected: false }
    ],
    mappings: [
      { id: "m1", control: "Glide", messageType: "CC", channel: 1, value: 74, destination: "MPE Channel Strip" }
    ]
  },
  {
    id: "d-breath",
    name: "Wind Synth W1",
    vendor: "Hughes Technologies",
    kind: "wind",
    protocols: ["USB", "DIN"],
    connected: false,
    autoMapProfile: "Breath to M|Ai-7 Target",
    color: "#7ED9A3",
    ports: [
      { id: "p1", direction: "in", protocol: "USB", connected: false }
    ],
    mappings: [
      { id: "m1", control: "Breath", messageType: "CC", channel: 2, value: 2, destination: "M|Ai-7 · Target" }
    ]
  }
];

export function findDevice(id: string): MidiDevice | undefined {
  return MIDI_DEVICES.find((d) => d.id === id);
}
