/**
 * INSTINCT — Hardware registry.
 *
 * Real manufacturer / product catalog across five categories:
 *   1. audio-interface
 *   2. control-surface
 *   3. midi-keyboard
 *   4. pad-controller
 *   5. monitor-controller
 *
 * Each entry is a "profile": the stable, vendor-published capability set we
 * need to auto-detect and wire a device. At runtime, INSTINCT reconciles these
 * profiles against actual OS-reported devices (CoreAudio, WASAPI, CoreMIDI,
 * WinMM, BLE MIDI, ALSA, JACK) to produce the bound device list.
 *
 * OS-level kernel drivers are the vendor's / Apple's / Microsoft's
 * responsibility and are not redistributed here. INSTINCT hosts the
 * *framework* that identifies, profiles, and binds devices once the OS sees
 * them, plus any surface-level protocol implementations (HUI, MCU, NKS, MPE,
 * Mackie Control, Eucon stubs, Pro Tools | Control, etc.).
 */

export type HardwareCategory =
  | "audio-interface"
  | "control-surface"
  | "midi-keyboard"
  | "pad-controller"
  | "monitor-controller";

export type HardwareProtocol =
  | "USB 2.0"
  | "USB 3.0"
  | "USB-C"
  | "Thunderbolt 2"
  | "Thunderbolt 3"
  | "Thunderbolt 4"
  | "PCIe"
  | "Ethernet (Dante)"
  | "Ethernet (AVB)"
  | "Ethernet (AES67)"
  | "ADAT"
  | "AES/EBU"
  | "S/PDIF"
  | "MADI"
  | "DIN MIDI"
  | "USB MIDI"
  | "BLE MIDI"
  | "RTP-MIDI"
  | "HUI"
  | "MCU"
  | "EUCON"
  | "Mackie Control"
  | "NKS"
  | "MPE"
  | "Pro Tools | HD";

export interface HardwareProfile {
  id: string;
  vendor: string;
  name: string;
  category: HardwareCategory;
  /** USB Vendor ID : Product ID when known. Used by the OS-level matcher. */
  usbVidPid?: string;
  /** Protocols / transports this device exposes. */
  protocols: HardwareProtocol[];
  /** I/O channel counts where applicable. */
  io?: { analogIn?: number; analogOut?: number; micPre?: number; digitalIn?: number; digitalOut?: number };
  sampleRates?: number[]; // Hz
  bitDepths?: number[];
  faders?: number;
  encoders?: number;
  pads?: number;
  keys?: number;
  /** Notable features. */
  features: string[];
  /** Short accent color for UI. */
  color: string;
}

// ---------------------------------------------------------------------------
// AUDIO INTERFACES
// ---------------------------------------------------------------------------
const AUDIO_INTERFACES: HardwareProfile[] = [
  // Universal Audio
  {
    id: "ua-apollo-x8",
    vendor: "Universal Audio",
    name: "Apollo x8",
    category: "audio-interface",
    usbVidPid: "1cd4:0030",
    protocols: ["Thunderbolt 3", "ADAT", "AES/EBU", "S/PDIF"],
    io: { analogIn: 8, analogOut: 8, micPre: 4, digitalIn: 18, digitalOut: 18 },
    sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
    bitDepths: [24],
    features: ["UAD-2 DSP", "Unison preamps", "Console integration"],
    color: "#5A6770"
  },
  {
    id: "ua-apollo-x8p",
    vendor: "Universal Audio",
    name: "Apollo x8p",
    category: "audio-interface",
    protocols: ["Thunderbolt 3", "ADAT", "AES/EBU", "S/PDIF"],
    io: { analogIn: 8, analogOut: 8, micPre: 8 },
    sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
    bitDepths: [24],
    features: ["UAD-2 Hexa Core", "Unison"],
    color: "#5A6770"
  },
  {
    id: "ua-apollo-x16d",
    vendor: "Universal Audio",
    name: "Apollo x16D",
    category: "audio-interface",
    protocols: ["Thunderbolt 3", "Ethernet (Dante)"],
    io: { analogIn: 16, analogOut: 16 },
    sampleRates: [44100, 48000, 88200, 96000, 192000],
    bitDepths: [24],
    features: ["Dante 64×64", "UAD-2 DSP"],
    color: "#5A6770"
  },
  // RME
  {
    id: "rme-fireface-ucx-ii",
    vendor: "RME",
    name: "Fireface UCX II",
    category: "audio-interface",
    usbVidPid: "2a39:3fd9",
    protocols: ["USB 2.0", "ADAT", "AES/EBU", "S/PDIF", "DIN MIDI"],
    io: { analogIn: 8, analogOut: 8, micPre: 2, digitalIn: 12, digitalOut: 12 },
    sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
    bitDepths: [24],
    features: ["TotalMix FX", "SteadyClock"],
    color: "#2B2F34"
  },
  {
    id: "rme-ufx-iii",
    vendor: "RME",
    name: "Fireface UFX III",
    category: "audio-interface",
    protocols: ["USB 3.0", "MADI", "ADAT", "AES/EBU"],
    io: { analogIn: 12, analogOut: 12, micPre: 4, digitalIn: 136, digitalOut: 136 },
    sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
    features: ["188×188 @ 44.1k", "DURec", "TotalMix FX"],
    color: "#2B2F34"
  },
  {
    id: "rme-madiface-pro",
    vendor: "RME",
    name: "MADIface Pro",
    category: "audio-interface",
    protocols: ["USB 2.0", "MADI", "S/PDIF"],
    io: { analogIn: 2, analogOut: 4, digitalIn: 68, digitalOut: 68 },
    sampleRates: [44100, 48000, 88200, 96000, 192000],
    features: ["Bus-powered MADI", "SteadyClock"],
    color: "#2B2F34"
  },
  // Focusrite
  {
    id: "focusrite-scarlett-18i20-4g",
    vendor: "Focusrite",
    name: "Scarlett 18i20 (4th Gen)",
    category: "audio-interface",
    usbVidPid: "1235:8218",
    protocols: ["USB-C", "ADAT", "S/PDIF"],
    io: { analogIn: 8, analogOut: 10, micPre: 8, digitalIn: 10, digitalOut: 10 },
    sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
    features: ["Air with Presence", "Auto Gain"],
    color: "#E85C42"
  },
  {
    id: "focusrite-redthunder-16-line",
    vendor: "Focusrite",
    name: "Red 16Line",
    category: "audio-interface",
    protocols: ["Thunderbolt 3", "Ethernet (Dante)", "Pro Tools | HD"],
    io: { analogIn: 16, analogOut: 16 },
    features: ["Red Evolution Preamps", "Dante 64×64", "Pro Tools | HD"],
    color: "#E85C42"
  },
  // PreSonus
  {
    id: "presonus-quantum-hd8",
    vendor: "PreSonus",
    name: "Quantum HD8",
    category: "audio-interface",
    protocols: ["USB-C"],
    io: { analogIn: 8, analogOut: 8, micPre: 8 },
    sampleRates: [44100, 48000, 88200, 96000, 192000],
    features: ["Max-HD preamps", "Studio One bridge"],
    color: "#1466AB"
  },
  // MOTU
  {
    id: "motu-828",
    vendor: "MOTU",
    name: "828 (2024)",
    category: "audio-interface",
    protocols: ["USB-C", "ADAT", "AES/EBU"],
    io: { analogIn: 8, analogOut: 12, micPre: 2, digitalIn: 10, digitalOut: 10 },
    sampleRates: [44100, 48000, 88200, 96000, 192000],
    features: ["ESS Sabre32 DAC", "32-input mixer"],
    color: "#0B7FBF"
  },
  {
    id: "motu-ultralite-mk5",
    vendor: "MOTU",
    name: "UltraLite mk5",
    category: "audio-interface",
    protocols: ["USB-C"],
    io: { analogIn: 4, analogOut: 6, micPre: 2 },
    features: ["Onboard 40-ch DSP mixer"],
    color: "#0B7FBF"
  },
  // Apogee
  {
    id: "apogee-symphony-mkii",
    vendor: "Apogee",
    name: "Symphony I/O mkII",
    category: "audio-interface",
    protocols: ["Thunderbolt 3", "Pro Tools | HD", "Ethernet (Dante)"],
    io: { analogIn: 32, analogOut: 32 },
    sampleRates: [44100, 48000, 88200, 96000, 192000],
    features: ["Modular cards", "Word Clock", "HW monitoring"],
    color: "#C7A652"
  },
  {
    id: "apogee-duet-3",
    vendor: "Apogee",
    name: "Duet 3",
    category: "audio-interface",
    protocols: ["USB-C"],
    io: { analogIn: 2, analogOut: 4, micPre: 2 },
    features: ["Symphony preamps", "Mac Silicon optimized"],
    color: "#C7A652"
  },
  // Antelope
  {
    id: "antelope-orion-studio-synergy",
    vendor: "Antelope Audio",
    name: "Orion Studio Synergy Core",
    category: "audio-interface",
    protocols: ["Thunderbolt 3", "USB 2.0", "ADAT", "S/PDIF"],
    io: { analogIn: 12, analogOut: 16, micPre: 4 },
    features: ["FPGA FX", "Atomic clock", "AFX realtime"],
    color: "#D97E7E"
  },
  // SSL
  {
    id: "ssl-big-six",
    vendor: "Solid State Logic",
    name: "Big SiX",
    category: "audio-interface",
    protocols: ["USB 2.0"],
    io: { analogIn: 16, analogOut: 16, micPre: 4 },
    features: ["SuperAnalogue summing", "SSL G-comp", "Talkback"],
    color: "#6E757D"
  },
  {
    id: "ssl-uf8",
    vendor: "Solid State Logic",
    name: "UF8",
    category: "control-surface",
    protocols: ["USB 2.0", "HUI", "MCU"],
    faders: 8,
    encoders: 40,
    features: ["HUI + MCU hybrid", "Banking", "DAW switching"],
    color: "#6E757D"
  },
  // Audient
  {
    id: "audient-id44-mk2",
    vendor: "Audient",
    name: "iD44 mk2",
    category: "audio-interface",
    protocols: ["USB-C", "ADAT"],
    io: { analogIn: 4, analogOut: 4, micPre: 4, digitalIn: 8, digitalOut: 8 },
    features: ["Class-A preamps", "JFET DI"],
    color: "#454A51"
  },
  // Behringer
  {
    id: "behringer-umc1820",
    vendor: "Behringer",
    name: "UMC1820",
    category: "audio-interface",
    protocols: ["USB 2.0", "ADAT", "DIN MIDI"],
    io: { analogIn: 8, analogOut: 10, micPre: 8 },
    features: ["Midas preamps", "MIDI I/O"],
    color: "#000000"
  },
  // Avid
  {
    id: "avid-mbox-studio",
    vendor: "Avid",
    name: "MBOX Studio",
    category: "audio-interface",
    protocols: ["USB-C", "Pro Tools | HD", "DIN MIDI"],
    io: { analogIn: 4, analogOut: 4, micPre: 2 },
    features: ["Pro Tools optimized", "Reamp outs", "Talkback mic"],
    color: "#7E9FD9"
  },
  {
    id: "avid-hdx-core",
    vendor: "Avid",
    name: "Pro Tools | HDX Core",
    category: "audio-interface",
    protocols: ["PCIe"],
    features: ["HDX DSP", "Mini-DigiLink"],
    color: "#7E9FD9"
  },
  // MOTU Avb
  {
    id: "motu-avb-switch",
    vendor: "MOTU",
    name: "AVB Switch",
    category: "audio-interface",
    protocols: ["Ethernet (AVB)"],
    features: ["AVB/TSN routing", "5 × 1Gbit"],
    color: "#0B7FBF"
  }
];

// ---------------------------------------------------------------------------
// CONTROL SURFACES
// ---------------------------------------------------------------------------
const CONTROL_SURFACES: HardwareProfile[] = [
  {
    id: "avid-s1",
    vendor: "Avid",
    name: "S1",
    category: "control-surface",
    protocols: ["EUCON", "Ethernet (AVB)"],
    faders: 8,
    encoders: 8,
    features: ["EUCON native", "VCA spill", "iPad integration"],
    color: "#7E9FD9"
  },
  {
    id: "avid-s4",
    vendor: "Avid",
    name: "S4",
    category: "control-surface",
    protocols: ["EUCON", "Ethernet (AVB)"],
    faders: 24,
    encoders: 120,
    features: ["Modular chassis", "EUCON", "Channel strip mode"],
    color: "#7E9FD9"
  },
  {
    id: "avid-s6",
    vendor: "Avid",
    name: "S6 M40",
    category: "control-surface",
    protocols: ["EUCON"],
    faders: 32,
    features: ["Post-production flagship", "Automation Lane"],
    color: "#7E9FD9"
  },
  {
    id: "mackie-mcu-pro",
    vendor: "Mackie",
    name: "MCU Pro",
    category: "control-surface",
    protocols: ["MCU", "USB MIDI"],
    faders: 8,
    encoders: 8,
    features: ["Mackie Control protocol", "Touch-sensitive motorized faders"],
    color: "#2B2F34"
  },
  {
    id: "icon-platform-m+",
    vendor: "iCON Pro Audio",
    name: "Platform M+",
    category: "control-surface",
    protocols: ["USB 2.0", "MCU", "HUI"],
    faders: 8,
    features: ["Modular extender chain"],
    color: "#454A51"
  },
  {
    id: "presonus-faderport-16",
    vendor: "PreSonus",
    name: "FaderPort 16",
    category: "control-surface",
    protocols: ["USB 2.0", "MCU", "HUI"],
    faders: 16,
    features: ["Studio One native + MCU"],
    color: "#1466AB"
  },
  {
    id: "softube-console1",
    vendor: "Softube",
    name: "Console 1 Fader",
    category: "control-surface",
    protocols: ["USB 2.0"],
    faders: 10,
    features: ["DAW-agnostic channel strip UX"],
    color: "#6E757D"
  },
  {
    id: "allen-heath-qu-pac",
    vendor: "Allen & Heath",
    name: "Qu-Pac",
    category: "control-surface",
    protocols: ["Ethernet (Dante)", "USB 2.0"],
    features: ["32-ch digital mixer + DAW control"],
    color: "#454A51"
  }
];

// ---------------------------------------------------------------------------
// MIDI KEYBOARDS
// ---------------------------------------------------------------------------
const MIDI_KEYBOARDS: HardwareProfile[] = [
  {
    id: "ni-komplete-s88-mk3",
    vendor: "Native Instruments",
    name: "Komplete Kontrol S88 MK3",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI", "NKS"],
    keys: 88,
    features: ["NKS tagging", "Smart Play", "MIDI 2.0"],
    color: "#8C7BFF"
  },
  {
    id: "ni-komplete-s61-mk3",
    vendor: "Native Instruments",
    name: "Komplete Kontrol S61 MK3",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "NKS"],
    keys: 61,
    features: ["NKS", "OLED displays"],
    color: "#8C7BFF"
  },
  {
    id: "arturia-keylab-88-mk3",
    vendor: "Arturia",
    name: "KeyLab 88 mk3",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 88,
    features: ["Analog Lab integration", "Hammer action"],
    color: "#1f2329"
  },
  {
    id: "arturia-keylab-61-mk3",
    vendor: "Arturia",
    name: "KeyLab 61 mk3",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 61,
    features: ["Analog Lab integration", "Clip launcher"],
    color: "#1f2329"
  },
  {
    id: "akai-mpk-261",
    vendor: "Akai Professional",
    name: "MPK261",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 61,
    pads: 16,
    features: ["MPC-style pads", "Q-Link controls"],
    color: "#E8B84F"
  },
  {
    id: "novation-sl-mk3",
    vendor: "Novation",
    name: "SL MkIII",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 61,
    features: ["Sequencer", "5-track polyphonic step seq"],
    color: "#38D1E0"
  },
  {
    id: "roland-a-88mk2",
    vendor: "Roland",
    name: "A-88MKII",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI", "MPE"],
    keys: 88,
    features: ["MIDI 2.0 ready", "Ivory Feel-G keybed"],
    color: "#EF6F6C"
  },
  {
    id: "nord-keyboard-stage-4",
    vendor: "Nord",
    name: "Stage 4",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 88,
    features: ["Dual engines", "Stage piano controller"],
    color: "#C7322B"
  },
  {
    id: "kawai-vpc1",
    vendor: "Kawai",
    name: "VPC1",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 88,
    features: ["RM3 Grand II wooden keys"],
    color: "#1f2329"
  },
  {
    id: "yamaha-cp88",
    vendor: "Yamaha",
    name: "CP88",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 88,
    features: ["NW-GH keybed", "VCM engine"],
    color: "#2B2F34"
  },
  {
    id: "korg-kronos-88",
    vendor: "Korg",
    name: "Kronos 2 88",
    category: "midi-keyboard",
    protocols: ["USB MIDI", "DIN MIDI"],
    keys: 88,
    features: ["9 engines", "16-track seq"],
    color: "#1E2B40"
  },
  {
    id: "moog-one-61",
    vendor: "Moog Music",
    name: "Moog One 61",
    category: "midi-keyboard",
    protocols: ["DIN MIDI", "USB MIDI"],
    keys: 61,
    features: ["Polyphonic analog", "Tri-timbral"],
    color: "#2F2A1E"
  },
  {
    id: "m-audio-oxygen-pro-mini",
    vendor: "M-Audio",
    name: "Oxygen Pro Mini",
    category: "midi-keyboard",
    protocols: ["USB MIDI"],
    keys: 32,
    features: ["Smart Chord/Scale", "8 pads"],
    color: "#1f2329"
  }
];

// ---------------------------------------------------------------------------
// PAD CONTROLLERS
// ---------------------------------------------------------------------------
const PAD_CONTROLLERS: HardwareProfile[] = [
  {
    id: "ni-maschine-mk3",
    vendor: "Native Instruments",
    name: "Maschine MK3",
    category: "pad-controller",
    protocols: ["USB MIDI"],
    pads: 16,
    features: ["Maschine software tight-pair", "Smart Strip"],
    color: "#2B2F34"
  },
  {
    id: "ni-maschine-studio",
    vendor: "Native Instruments",
    name: "Maschine Studio",
    category: "pad-controller",
    protocols: ["USB MIDI"],
    pads: 16,
    features: ["Edit section", "Jog wheel"],
    color: "#2B2F34"
  },
  {
    id: "ableton-push-3",
    vendor: "Ableton",
    name: "Push 3 Standalone",
    category: "pad-controller",
    protocols: ["USB-C"],
    pads: 64,
    features: ["MPE pads", "Standalone or host mode"],
    color: "#2B2F34"
  },
  {
    id: "akai-mpc-key-61",
    vendor: "Akai Professional",
    name: "MPC Key 61",
    category: "pad-controller",
    protocols: ["USB MIDI", "DIN MIDI"],
    pads: 16,
    keys: 61,
    features: ["Standalone MPC", "Semi-weighted keys"],
    color: "#2B2F34"
  },
  {
    id: "akai-mpc-live-ii",
    vendor: "Akai Professional",
    name: "MPC Live II",
    category: "pad-controller",
    protocols: ["USB MIDI", "DIN MIDI"],
    pads: 16,
    features: ["Battery-powered", "Built-in monitors"],
    color: "#2B2F34"
  },
  {
    id: "novation-launchpad-pro-mk3",
    vendor: "Novation",
    name: "Launchpad Pro MK3",
    category: "pad-controller",
    protocols: ["USB MIDI"],
    pads: 64,
    features: ["4-track sequencer", "Chord mode", "MPE"],
    color: "#38D1E0"
  },
  {
    id: "novation-launchkey-88",
    vendor: "Novation",
    name: "Launchkey 88 MK3",
    category: "midi-keyboard",
    protocols: ["USB MIDI"],
    keys: 88,
    pads: 16,
    features: ["Ableton tight-pair"],
    color: "#38D1E0"
  },
  {
    id: "akai-apc-key-25-mk2",
    vendor: "Akai Professional",
    name: "APC Key 25 MK2",
    category: "pad-controller",
    protocols: ["USB MIDI"],
    pads: 40,
    keys: 25,
    features: ["Ableton clip launcher"],
    color: "#2B2F34"
  },
  {
    id: "roli-seaboard-rise-2",
    vendor: "ROLI",
    name: "Seaboard RISE 2",
    category: "pad-controller",
    protocols: ["BLE MIDI", "USB MIDI", "MPE"],
    features: ["5D expressive surface", "MPE native"],
    color: "#D97EC7"
  },
  {
    id: "roli-seaboard-block-m",
    vendor: "ROLI",
    name: "Seaboard BLOCK M",
    category: "pad-controller",
    protocols: ["BLE MIDI", "MPE"],
    features: ["Compact MPE", "Magnetic dock"],
    color: "#D97EC7"
  }
];

// ---------------------------------------------------------------------------
// MONITOR CONTROLLERS
// ---------------------------------------------------------------------------
const MONITOR_CONTROLLERS: HardwareProfile[] = [
  {
    id: "grace-m908",
    vendor: "Grace Design",
    name: "m908",
    category: "monitor-controller",
    protocols: ["Ethernet (Dante)", "AES/EBU", "MADI", "S/PDIF"],
    features: ["Immersive 9.1.6", "Bass management"],
    color: "#C7A652"
  },
  {
    id: "avocet-iib",
    vendor: "Crane Song",
    name: "Avocet IIB",
    category: "monitor-controller",
    protocols: ["AES/EBU", "S/PDIF"],
    features: ["Passive stepped attenuator", "Dual speaker sets"],
    color: "#2B2F34"
  },
  {
    id: "dangerous-monitor-st-sr",
    vendor: "Dangerous Music",
    name: "Monitor ST-SR",
    category: "monitor-controller",
    protocols: ["AES/EBU"],
    features: ["Summing + monitor hybrid"],
    color: "#EF6F6C"
  }
];

export const HARDWARE_CATALOG: HardwareProfile[] = [
  ...AUDIO_INTERFACES,
  ...CONTROL_SURFACES,
  ...MIDI_KEYBOARDS,
  ...PAD_CONTROLLERS,
  ...MONITOR_CONTROLLERS
];

export function byCategory(cat: HardwareCategory): HardwareProfile[] {
  return HARDWARE_CATALOG.filter((h) => h.category === cat);
}

export function searchHardware(query: string): HardwareProfile[] {
  const q = query.toLowerCase().trim();
  if (!q) return HARDWARE_CATALOG;
  return HARDWARE_CATALOG.filter(
    (h) =>
      h.name.toLowerCase().includes(q) ||
      h.vendor.toLowerCase().includes(q) ||
      h.features.some((f) => f.toLowerCase().includes(q)) ||
      h.protocols.some((p) => p.toLowerCase().includes(q))
  );
}

/** Returns the union of every unique vendor represented in the catalog. */
export function vendors(): string[] {
  return Array.from(new Set(HARDWARE_CATALOG.map((h) => h.vendor))).sort();
}

/** Attempt to match a webMIDI/CoreAudio-reported device string against the catalog. */
export function matchByName(reported: string): HardwareProfile | undefined {
  const r = reported.toLowerCase();
  return HARDWARE_CATALOG.find(
    (h) =>
      r.includes(h.name.toLowerCase()) ||
      (h.name.toLowerCase().split(" ").every((tok) => r.includes(tok)))
  );
}
