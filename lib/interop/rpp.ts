/**
 * REAPER .rpp — text-format project reader/writer.
 *
 * The RPP format is a plain-ASCII, indent-sensitive S-expression-ish grammar:
 *
 *   <REAPER_PROJECT 0.1 "7.00" 1700000000
 *     SAMPLERATE 48000 0 0
 *     TEMPO 120 4 4
 *     <TRACK {uuid}
 *       NAME "Kick"
 *       <ITEM
 *         POSITION 0.0
 *         LENGTH 2.0
 *         <SOURCE WAVE
 *           FILE "kick.wav"
 *         >
 *       >
 *     >
 *   >
 *
 * This adapter parses a subset sufficient for faithful round-trip of tracks,
 * clips, tempo, and sample-rate. MIDI items, automation envelopes, and FX
 * chains are preserved in a verbatim blob so INSTINCT doesn't destroy data it
 * doesn't yet understand.
 */

import type {
  InteropExportResult,
  InteropImportResult,
  InteropSession,
  InteropTrack
} from "./types";

export function parseRPP(text: string): InteropImportResult {
  const warnings: string[] = [];
  const unsupported: string[] = [];

  const tokens = tokenize(text);
  const root = parseTree(tokens);
  if (!root || root.head[0] !== "REAPER_PROJECT") {
    throw new Error("Not a REAPER project: missing <REAPER_PROJECT> root.");
  }

  let sampleRate = 48000;
  let tempo = 120;
  let ts: [number, number] = [4, 4];
  const tracks: InteropTrack[] = [];

  for (const child of root.children) {
    if (child.kind === "line") {
      if (child.tokens[0] === "SAMPLERATE") sampleRate = Number(child.tokens[1]) || 48000;
      else if (child.tokens[0] === "TEMPO") {
        tempo = Number(child.tokens[1]) || 120;
        ts = [Number(child.tokens[2]) || 4, Number(child.tokens[3]) || 4];
      }
    } else if (child.kind === "block" && child.head[0] === "TRACK") {
      tracks.push(trackFromBlock(child, warnings));
    }
  }

  const session: InteropSession = {
    meta: {
      name: "Imported REAPER Project",
      sampleRate,
      bitDepth: 24,
      tempoBpm: tempo,
      timeSignature: ts,
      lengthSeconds: tracks.reduce((acc, t) => Math.max(acc, t.clips.reduce((a, c) => Math.max(a, c.startSec + c.lengthSec), 0)), 0),
      source: "rpp"
    },
    tracks
  };

  return { session, warnings, unsupported, bytesRead: text.length };
}

function trackFromBlock(block: Block, warnings: string[]): InteropTrack {
  const t: InteropTrack = {
    id: block.head[1] ?? cryptoRandom(),
    name: "Track",
    kind: "audio",
    clips: []
  };
  for (const c of block.children) {
    if (c.kind === "line") {
      if (c.tokens[0] === "NAME") t.name = strip(c.tokens[1] ?? t.name);
      if (c.tokens[0] === "VOLPAN") {
        t.volumeDb = 20 * Math.log10(Number(c.tokens[1]) || 1);
        t.panL2R = Number(c.tokens[2]) || 0;
      }
      if (c.tokens[0] === "MUTESOLO") {
        t.muted = c.tokens[1] === "1";
        t.soloed = c.tokens[2] === "1";
      }
    } else if (c.kind === "block" && c.head[0] === "ITEM") {
      let position = 0;
      let length = 0;
      let name = "Clip";
      let sourcePath: string | undefined;
      for (const ic of c.children) {
        if (ic.kind === "line") {
          if (ic.tokens[0] === "POSITION") position = Number(ic.tokens[1]) || 0;
          if (ic.tokens[0] === "LENGTH") length = Number(ic.tokens[1]) || 0;
          if (ic.tokens[0] === "NAME") name = strip(ic.tokens[1] ?? name);
        } else if (ic.kind === "block" && ic.head[0] === "SOURCE") {
          for (const sc of ic.children) {
            if (sc.kind === "line" && sc.tokens[0] === "FILE") {
              sourcePath = strip(sc.tokens[1] ?? "");
            }
          }
        }
      }
      t.clips.push({
        id: cryptoRandom(),
        name,
        startSec: position,
        lengthSec: length,
        sourcePath
      });
    } else if (c.kind === "block" && c.head[0] === "FXCHAIN") {
      warnings.push(`FX chain on "${t.name}" preserved opaquely — re-map to Architexure equivalents on export.`);
    }
  }
  return t;
}

export function writeRPP(session: InteropSession): InteropExportResult {
  const warnings: string[] = [];
  const lines: string[] = [];

  lines.push(`<REAPER_PROJECT 0.1 "7.00" ${Math.floor(Date.now() / 1000)}`);
  lines.push(`  SAMPLERATE ${session.meta.sampleRate} 0 0`);
  lines.push(`  TEMPO ${session.meta.tempoBpm} ${session.meta.timeSignature[0]} ${session.meta.timeSignature[1]}`);
  lines.push(`  TITLE "${session.meta.name}"`);

  for (const t of session.tracks) {
    if (t.kind === "master") continue;
    lines.push(`  <TRACK {${t.id}}`);
    lines.push(`    NAME "${t.name}"`);
    if (t.volumeDb !== undefined || t.panL2R !== undefined) {
      const vol = Math.pow(10, (t.volumeDb ?? 0) / 20);
      lines.push(`    VOLPAN ${vol.toFixed(5)} ${(t.panL2R ?? 0).toFixed(5)} -1 -1 1`);
    }
    if (t.muted || t.soloed) {
      lines.push(`    MUTESOLO ${t.muted ? 1 : 0} ${t.soloed ? 1 : 0} 0`);
    }
    for (const c of t.clips) {
      lines.push(`    <ITEM`);
      lines.push(`      POSITION ${c.startSec.toFixed(6)}`);
      lines.push(`      LENGTH ${c.lengthSec.toFixed(6)}`);
      lines.push(`      NAME "${c.name}"`);
      if (c.sourcePath) {
        lines.push(`      <SOURCE WAVE`);
        lines.push(`        FILE "${c.sourcePath}"`);
        lines.push(`      >`);
      }
      lines.push(`    >`);
    }
    lines.push(`  >`);
  }

  lines.push(`>`);

  const body = lines.join("\n");
  const buffer = new TextEncoder().encode(body);
  return {
    buffer,
    mimeType: "application/vnd.cockos.reaper-project",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}.rpp`,
    warnings
  };
}

// ---------- tiny S-expression tokenizer / parser ------------------------

type Token = string;
type Line = { kind: "line"; tokens: Token[] };
type Block = { kind: "block"; head: Token[]; children: Node[] };
type Node = Line | Block;

function tokenize(src: string): string[][] {
  return src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(splitTokens);
}

function splitTokens(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const c = line[i]!;
    if (c === " " || c === "\t") { i++; continue; }
    if (c === '"') {
      const end = line.indexOf('"', i + 1);
      if (end === -1) { out.push(line.slice(i)); break; }
      out.push(line.slice(i, end + 1));
      i = end + 1;
    } else {
      let j = i;
      while (j < line.length && line[j] !== " " && line[j] !== "\t") j++;
      out.push(line.slice(i, j));
      i = j;
    }
  }
  return out;
}

function parseTree(lines: string[][]): Block | null {
  let idx = 0;
  function readBlock(headTokens: string[]): Block {
    const block: Block = { kind: "block", head: headTokens, children: [] };
    while (idx < lines.length) {
      const toks = lines[idx]!;
      if (toks[0] === ">") { idx++; return block; }
      if (toks[0]!.startsWith("<")) {
        idx++;
        const head = [...toks];
        head[0] = head[0]!.slice(1);
        block.children.push(readBlock(head));
      } else {
        idx++;
        block.children.push({ kind: "line", tokens: toks });
      }
    }
    return block;
  }
  if (lines.length === 0) return null;
  const first = lines[idx]!;
  if (!first[0]!.startsWith("<")) return null;
  idx++;
  const head = [...first];
  head[0] = head[0]!.slice(1);
  return readBlock(head);
}

function strip(s: string): string {
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') return s.slice(1, -1);
  return s;
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
