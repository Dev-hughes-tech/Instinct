/**
 * Centralized theme tokens for INSTINCT.
 * Tailwind config mirrors these — values here are for programmatic use
 * (e.g. inline styles, SVGs, waveform gradients).
 */

export const palette = {
  white: "#FFFFFF",
  porcelain: "#FBFCFD",
  silver50: "#F5F6F8",
  silver100: "#EEF0F3",
  silver200: "#E6E9ED",
  silver300: "#D6DADF",
  silver400: "#BCC2C9",
  silver500: "#9AA1AA",
  graphite: "#6E757D",
  ink: "#2B2F34",
  deepInk: "#161A1E",

  // Track color keys
  track: {
    kick: "#E2B973",
    snare: "#D97E7E",
    hats: "#7EBFD9",
    perc: "#B57ED9",
    bass: "#7ED9A3",
    keys: "#D97EC7",
    vox: "#7E9FD9",
    fx: "#D9C17E"
  },

  aux: "#A9B2BC",
  master: "#2B2F34",

  meter: {
    green: "#4CD07A",
    amber: "#E8B84F",
    red: "#E85C5C",
    dim: "#D6DADF"
  },

  ai: {
    holoA: "#8C7BFF",
    holoB: "#38D1E0",
    holoC: "#5BD4A4",
    chassis: "#11131A"
  }
} as const;

/** Track color helper */
export function trackColor(key: keyof typeof palette.track | "master" | "aux"): string {
  if (key === "master") return palette.master;
  if (key === "aux") return palette.aux;
  return palette.track[key];
}

export const radii = {
  xs: 3,
  sm: 5,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20
} as const;

/** Row / lane height. Shared between track panel + waveform area to guarantee alignment. */
export const EDIT_ROW_HEIGHT = 64;
export const EDIT_ROW_GAP = 6;
export const MIXER_STRIP_WIDTH = 86;
export const STANDALONE_STRIP_WIDTH = 74;
