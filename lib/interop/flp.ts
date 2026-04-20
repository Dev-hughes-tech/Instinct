/**
 * FL Studio .flp adapter.
 *
 * FLP is a little-endian TLV ("Tag–Length–Value") binary format authored by
 * Image-Line. The file begins with:
 *
 *   "FLhd"  <hdrSize:u32>  <format:u16>  <nChannels:u16>  <ppq:u16>
 *   "FLdt"  <dataSize:u32>  … event stream …
 *
 * Each event is: <id:u8> <payload:varint-or-fixed>. Event IDs 0x00–0x3F are
 * byte-sized, 0x40–0x7F word-sized, 0x80–0xBF dword-sized, and 0xC0+ are
 * variable-length-with-LEB128 length prefix.
 *
 * This adapter implements the reading of the FLhd chunk (format + PPQ) and
 * scans the FLdt stream for the well-known metadata events (project name,
 * tempo, author, genre). Full pattern/channel/mixer routing parsing is left
 * to a future `flp-full` module; INSTINCT at least opens the project with
 * correct tempo and PPQ.
 */

import type { InteropImportResult, InteropSession } from "./types";

export function parseFLP(bytes: Uint8Array): InteropImportResult {
  const warnings: string[] = [];
  const unsupported: string[] = [
    "Channel rack instruments",
    "Mixer routing + effect chains",
    "Playlist patterns"
  ];

  const head = new TextDecoder().decode(bytes.slice(0, 4));
  if (head !== "FLhd") {
    throw new Error("Not an FL Studio project: missing FLhd header.");
  }

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const hdrSize = dv.getUint32(4, true);
  const format = dv.getUint16(8, true);
  const nChannels = dv.getUint16(10, true);
  const ppq = dv.getUint16(12, true);

  let p = 8 + hdrSize;
  if (new TextDecoder().decode(bytes.slice(p, p + 4)) !== "FLdt") {
    throw new Error("FLP corrupt: FLdt chunk missing.");
  }
  p += 4;
  const dataSize = dv.getUint32(p, true);
  p += 4;

  let projectName = "FL Project";
  let tempo = 140;
  let author = "";

  const end = p + dataSize;
  while (p < end && p < bytes.length) {
    const id = bytes[p++] ?? 0;
    let value = 0;
    let text: string | null = null;
    if (id < 0x40) {
      value = bytes[p++] ?? 0;
    } else if (id < 0x80) {
      value = dv.getUint16(p, true); p += 2;
    } else if (id < 0xc0) {
      value = dv.getUint32(p, true); p += 4;
    } else {
      // varlen LEB128
      let len = 0; let shift = 0; let byte = 0;
      do { byte = bytes[p++] ?? 0; len |= (byte & 0x7f) << shift; shift += 7; } while (byte & 0x80);
      text = new TextDecoder("utf-16le").decode(bytes.slice(p, p + len)).replace(/\0+$/, "");
      p += len;
    }
    if (id === 0xc1 && text) projectName = text;
    if (id === 0xc3 && text) author = text;
    if (id === 0x80) tempo = value / 1000;
    if (id === 0x9c) tempo = value / 1000;
  }

  const session: InteropSession = {
    meta: {
      name: projectName,
      sampleRate: 48000,
      bitDepth: 24,
      tempoBpm: tempo,
      timeSignature: [4, 4],
      lengthSeconds: 0,
      source: "flp"
    },
    tracks: []
  };

  warnings.push(
    `FL Studio project "${projectName}" by ${author || "unknown"} — format=${format} ` +
      `channels=${nChannels} PPQ=${ppq}. Channel rack and playlist patterns ` +
      "require the FL-full parser; INSTINCT will prompt to re-drop patterns."
  );

  return { session, warnings, unsupported, bytesRead: bytes.length };
}
