/**
 * INSTINCT interop façade — unified import/export dispatch.
 *
 * Format detection order:
 *   1. Extension hint
 *   2. Magic bytes
 *   3. Heuristic content sniff
 */

import { parseAAF, writeAAF, isAAF } from "./aaf";
import { writeBWF } from "./bwf";
import { parseALS, writeALS } from "./als";
import { parseRPP, writeRPP } from "./rpp";
import { parseLogicProjectData, writeLogicXmlPlist } from "./logic";
import { parseFLP } from "./flp";
import { parseReason, writeReasonXmlSidecar } from "./reason";
import { parseStudioOne, writeStudioOneXmlSidecar } from "./studioOne";
import type {
  InteropExportResult,
  InteropFormat,
  InteropImportResult,
  InteropSession
} from "./types";

export * from "./types";

export interface InteropFormatDescriptor {
  id: InteropFormat;
  label: string;
  extensions: string[];
  canImport: boolean;
  canExport: boolean;
  vendor: string;
  kind: "project" | "audio" | "sidecar";
}

export const INTEROP_FORMATS: InteropFormatDescriptor[] = [
  { id: "rpp",    label: "REAPER Project",          extensions: [".rpp"],    canImport: true,  canExport: true,  vendor: "Cockos",       kind: "project" },
  { id: "als",    label: "Ableton Live Set",        extensions: [".als"],    canImport: true,  canExport: true,  vendor: "Ableton",      kind: "project" },
  { id: "aaf",    label: "AAF / OMF",               extensions: [".aaf", ".omf"], canImport: true, canExport: true, vendor: "AMWA",      kind: "project" },
  { id: "logicx", label: "Logic Pro Project",       extensions: [".logicx", ".plist"], canImport: true, canExport: true, vendor: "Apple", kind: "project" },
  { id: "flp",    label: "FL Studio Project",       extensions: [".flp"],    canImport: true,  canExport: false, vendor: "Image-Line",  kind: "project" },
  { id: "reason", label: "Reason Song",             extensions: [".reason"], canImport: true,  canExport: true,  vendor: "Reason Studios", kind: "project" },
  { id: "song",   label: "Studio One Song",         extensions: [".song"],   canImport: true,  canExport: true,  vendor: "PreSonus",    kind: "project" },
  { id: "bwf",    label: "Broadcast WAV (BWF)",     extensions: [".wav"],    canImport: false, canExport: true,  vendor: "EBU",         kind: "audio" },
  { id: "ptx",    label: "Pro Tools Session",       extensions: [".ptx", ".pts"], canImport: false, canExport: false, vendor: "Avid",    kind: "project" }
];

export function detectFormat(filename: string, bytes: Uint8Array): InteropFormat | null {
  const ext = "." + filename.split(".").pop()!.toLowerCase();
  const byExt = INTEROP_FORMATS.find((f) => f.extensions.includes(ext));
  if (byExt) return byExt.id;
  if (isAAF(bytes)) return "aaf";
  const head = new TextDecoder().decode(bytes.slice(0, 8));
  if (head.startsWith("bplist00")) return "logicx";
  if (head.startsWith("<REAPER_PROJECT")) return "rpp";
  if (head.startsWith("FLhd")) return "flp";
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) return "als";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "song"; // zip — could be .reason or .song
  return null;
}

export async function importFile(
  filename: string,
  bytes: Uint8Array
): Promise<InteropImportResult> {
  const format = detectFormat(filename, bytes);
  if (!format) throw new Error(`Could not determine format for "${filename}".`);
  switch (format) {
    case "rpp":    return parseRPP(new TextDecoder().decode(bytes));
    case "als":    return parseALS(bytes);
    case "aaf":
    case "omf":    return parseAAF(bytes);
    case "logicx": return parseLogicProjectData(bytes);
    case "flp":    return parseFLP(bytes);
    case "reason": return parseReason(bytes);
    case "song":   return parseStudioOne(bytes);
    default:       throw new Error(`Import not supported for format ${format}.`);
  }
}

export async function exportFile(
  format: InteropFormat,
  session: InteropSession,
  opts?: { pcm?: Int16Array | Int32Array | Float32Array }
): Promise<InteropExportResult> {
  switch (format) {
    case "rpp":    return writeRPP(session);
    case "als":    return writeALS(session);
    case "aaf":
    case "omf":    return writeAAF(session);
    case "logicx": return writeLogicXmlPlist(session);
    case "reason": return writeReasonXmlSidecar(session);
    case "song":   return writeStudioOneXmlSidecar(session);
    case "bwf": {
      const pcm = opts?.pcm ?? new Float32Array(0);
      return writeBWF(session, pcm);
    }
    default:       throw new Error(`Export not supported for format ${format}.`);
  }
}
