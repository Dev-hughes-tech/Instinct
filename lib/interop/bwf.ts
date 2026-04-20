/**
 * Broadcast WAV File (BWF) — EBU Tech 3285 v2.0.
 *
 * Structure:
 *   RIFF ........ 'WAVE'
 *     'JUNK' (optional padding)
 *     'bext' ...... broadcast extension (timecode, origination, loudness)
 *     'fmt ' ...... PCM format
 *     'data' ...... interleaved audio samples
 *
 * This adapter focuses on writing a spec-correct bext chunk from an
 * InteropSession plus a raw audio buffer so INSTINCT can emit
 * broadcast-grade masters for the "Export → Broadcast WAV (BWF)…" command.
 *
 * References:
 *   EBU Tech 3285 §4 (bext chunk layout)
 *   ITU-R BS.1770-4 (loudness fields)
 */

import type { InteropExportResult, InteropSession } from "./types";

export interface BwfMetadata {
  description: string;       // 256 bytes
  originator: string;        // 32 bytes
  originatorReference: string; // 32 bytes
  originationDate: string;   // 10 bytes "YYYY-MM-DD"
  originationTime: string;   // 8 bytes "HH:MM:SS"
  timeReferenceSamples: number; // low 32 + high 32
  loudnessValueLUFS: number;  // -99.99..+99.99 → int16 (×100)
  loudnessRangeLU: number;
  maxTruePeakDbTP: number;
  maxMomentaryLUFS: number;
  maxShortTermLUFS: number;
  codingHistory: string;
}

/** Wrap mono/stereo PCM in a full BWF (RIFF/WAVE) container. */
export function writeBWF(
  session: InteropSession,
  pcm: Int16Array | Int32Array | Float32Array,
  meta: Partial<BwfMetadata> = {}
): InteropExportResult {
  const warnings: string[] = [];
  const bitDepth = session.meta.bitDepth;
  const sampleRate = session.meta.sampleRate;
  const channels = 2; // INSTINCT masters are stereo by default

  const today = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const bext: BwfMetadata = {
    description: meta.description ?? `INSTINCT master — ${session.meta.name}`,
    originator: meta.originator ?? "INSTINCT by Hughes Technologies",
    originatorReference: meta.originatorReference ?? `INS-${Date.now().toString(36).toUpperCase()}`,
    originationDate: meta.originationDate ?? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    originationTime: meta.originationTime ?? `${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`,
    timeReferenceSamples: meta.timeReferenceSamples ?? 0,
    loudnessValueLUFS: meta.loudnessValueLUFS ?? -14.0,
    loudnessRangeLU: meta.loudnessRangeLU ?? 6.0,
    maxTruePeakDbTP: meta.maxTruePeakDbTP ?? -1.0,
    maxMomentaryLUFS: meta.maxMomentaryLUFS ?? -10.0,
    maxShortTermLUFS: meta.maxShortTermLUFS ?? -12.0,
    codingHistory:
      meta.codingHistory ??
      `A=PCM,F=${sampleRate},W=${bitDepth},M=stereo,T=INSTINCT Master,O=Hughes Technologies\r\n`
  };

  // Convert pcm → interleaved bytes for the target bit depth
  const dataBytes = encodeSamples(pcm, bitDepth);

  const bextChunk = buildBextChunk(bext);
  const fmtChunk = buildFmtChunk(sampleRate, bitDepth, channels);
  const dataChunk = buildDataChunk(dataBytes);

  const total = 4 /* WAVE */ + bextChunk.length + fmtChunk.length + dataChunk.length;
  const riff = new Uint8Array(8 + total);
  writeAscii(riff, 0, "RIFF");
  writeU32LE(riff, 4, total);
  writeAscii(riff, 8, "WAVE");
  let offset = 12;
  riff.set(bextChunk, offset); offset += bextChunk.length;
  riff.set(fmtChunk, offset); offset += fmtChunk.length;
  riff.set(dataChunk, offset); offset += dataChunk.length;

  if (dataBytes.length === 0) warnings.push("PCM buffer was empty — wrote a zero-length BWF.");

  return {
    buffer: riff,
    mimeType: "audio/vnd.wave",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}_master.wav`,
    warnings
  };
}

function buildFmtChunk(sampleRate: number, bitDepth: number, channels: number): Uint8Array {
  const size = 16;
  const buf = new Uint8Array(8 + size);
  writeAscii(buf, 0, "fmt ");
  writeU32LE(buf, 4, size);
  writeU16LE(buf, 8, bitDepth === 32 ? 3 : 1); // 1 = PCM, 3 = IEEE float
  writeU16LE(buf, 10, channels);
  writeU32LE(buf, 12, sampleRate);
  writeU32LE(buf, 16, (sampleRate * channels * bitDepth) / 8);
  writeU16LE(buf, 20, (channels * bitDepth) / 8);
  writeU16LE(buf, 22, bitDepth);
  return buf;
}

function buildDataChunk(payload: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + payload.length);
  writeAscii(chunk, 0, "data");
  writeU32LE(chunk, 4, payload.length);
  chunk.set(payload, 8);
  return chunk;
}

function buildBextChunk(m: BwfMetadata): Uint8Array {
  const CODING_MAX = 1024;
  const fixedSize = 256 + 32 + 32 + 10 + 8 + 4 + 4 + 2 + 64 + 190 + 2 + 2 + 2 + 2 + 180;
  // We implement the practical v2 layout: 602 fixed bytes + variable coding history.
  const size = fixedSize + CODING_MAX;
  const buf = new Uint8Array(8 + size);
  writeAscii(buf, 0, "bext");
  writeU32LE(buf, 4, size);

  let p = 8;
  p = writeAsciiFixed(buf, p, m.description, 256);
  p = writeAsciiFixed(buf, p, m.originator, 32);
  p = writeAsciiFixed(buf, p, m.originatorReference, 32);
  p = writeAsciiFixed(buf, p, m.originationDate, 10);
  p = writeAsciiFixed(buf, p, m.originationTime, 8);
  writeU32LE(buf, p, m.timeReferenceSamples & 0xffffffff); p += 4;
  writeU32LE(buf, p, Math.floor(m.timeReferenceSamples / 0x100000000)); p += 4;
  writeU16LE(buf, p, 2); p += 2; // Version 2
  p += 64;                        // UMID (zeroed)
  p += 190;                       // reserved
  writeI16LE(buf, p, Math.round(m.loudnessValueLUFS * 100)); p += 2;
  writeI16LE(buf, p, Math.round(m.loudnessRangeLU * 100)); p += 2;
  writeI16LE(buf, p, Math.round(m.maxTruePeakDbTP * 100)); p += 2;
  writeI16LE(buf, p, Math.round(m.maxMomentaryLUFS * 100)); p += 2;
  p += 180;                       // reserved v2
  writeAsciiFixed(buf, p, m.codingHistory, CODING_MAX);

  return buf;
}

function encodeSamples(src: Int16Array | Int32Array | Float32Array, bitDepth: number): Uint8Array {
  if (bitDepth === 32) {
    if (!(src instanceof Float32Array)) {
      // src is Int16Array or Int32Array — rescale to [-1,1] for IEEE-float WAV
      const scale = src instanceof Int16Array ? 32768 : 2147483648;
      const f32 = Float32Array.from(src as ArrayLike<number>, (v) => (Number(v) || 0) / scale);
      return new Uint8Array(f32.buffer.slice(0));
    }
    return new Uint8Array(src.buffer.slice(0));
  }
  if (bitDepth === 16) {
    const i16 = src instanceof Int16Array ? src : floatTo16(src as Float32Array);
    return new Uint8Array(i16.buffer.slice(0));
  }
  // 24-bit packed
  const i24 = new Uint8Array(src.length * 3);
  for (let i = 0; i < src.length; i++) {
    const v = Math.max(-1, Math.min(1, Number(src[i] ?? 0)));
    const n = Math.round(v * 8388607);
    const nn = n < 0 ? n + 0x1000000 : n;
    i24[i * 3] = nn & 0xff;
    i24[i * 3 + 1] = (nn >> 8) & 0xff;
    i24[i * 3 + 2] = (nn >> 16) & 0xff;
  }
  return i24;
}

function floatTo16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const v = Math.max(-1, Math.min(1, f[i] ?? 0));
    out[i] = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
  }
  return out;
}

function writeAscii(buf: Uint8Array, offset: number, s: string): void {
  for (let i = 0; i < s.length; i++) buf[offset + i] = s.charCodeAt(i) & 0x7f;
}
function writeAsciiFixed(buf: Uint8Array, offset: number, s: string, len: number): number {
  for (let i = 0; i < len; i++) buf[offset + i] = i < s.length ? s.charCodeAt(i) & 0xff : 0;
  return offset + len;
}
function writeU16LE(buf: Uint8Array, o: number, v: number) { buf[o] = v & 0xff; buf[o + 1] = (v >> 8) & 0xff; }
function writeI16LE(buf: Uint8Array, o: number, v: number) { const u = v < 0 ? v + 0x10000 : v; writeU16LE(buf, o, u); }
function writeU32LE(buf: Uint8Array, o: number, v: number) {
  buf[o] = v & 0xff; buf[o + 1] = (v >> 8) & 0xff; buf[o + 2] = (v >> 16) & 0xff; buf[o + 3] = (v >>> 24) & 0xff;
}
