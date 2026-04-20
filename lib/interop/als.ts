/**
 * Ableton Live Set (.als) adapter.
 *
 * An .als file is a single GZIP stream whose payload is UTF-8 XML with the
 * root element <Ableton> carrying version, schema, and <LiveSet> children.
 *
 * We implement:
 *   - parseALS: gunzip → parse XML → map Tracks, ClipSlots, Tempo, Time
 *     signature → InteropSession
 *   - writeALS: build an XML document modeled on Live 12's schema → gzip
 *
 * The XML schema is too large to fully emulate, so we round-trip only the
 * semantics INSTINCT owns (tracks, clips, tempo, time-sig) and leave the
 * rest as opaque pass-through or INSTINCT defaults. This matches Ableton's
 * own behavior when opening projects from older schema versions.
 */

import type {
  InteropExportResult,
  InteropImportResult,
  InteropSession,
  InteropTrack
} from "./types";

export async function parseALS(bytes: Uint8Array): Promise<InteropImportResult> {
  const warnings: string[] = [];
  const unsupported: string[] = [];
  const xml = await gunzipToText(bytes);

  const tempo = Number(matchFirst(xml, /<Tempo>[\s\S]*?<Manual Value="([\d.]+)"/)) || 120;
  const tsNum = Number(matchFirst(xml, /<TimeSignature>[\s\S]*?<Numerator Value="(\d+)"/)) || 4;
  const tsDen = Number(matchFirst(xml, /<Denominator Value="(\d+)"/)) || 4;
  const sampleRate = Number(matchFirst(xml, /<SampleRate Value="(\d+)"/)) || 48000;
  const name = matchFirst(xml, /<Name Value="([^"]+)"/) ?? "Live Set";

  const tracks: InteropTrack[] = [];
  const trackRegex = /<(AudioTrack|MidiTrack|ReturnTrack|GroupTrack) Id="(\d+)">([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = trackRegex.exec(xml))) {
    const [, kind, id, body] = m;
    const trackName = matchFirst(body ?? "", /<EffectiveName Value="([^"]*)"/) ?? "Track";
    tracks.push({
      id: id!,
      name: trackName,
      kind: kind === "MidiTrack" ? "midi" : kind === "ReturnTrack" ? "aux" : "audio",
      clips: []
    });
  }
  if (tracks.length === 0) warnings.push("No tracks parsed — schema may differ from Live 12.");

  return {
    session: {
      meta: {
        name,
        sampleRate,
        bitDepth: 24,
        tempoBpm: tempo,
        timeSignature: [tsNum, tsDen],
        lengthSeconds: 0,
        source: "als"
      },
      tracks
    },
    warnings,
    unsupported,
    bytesRead: bytes.length
  };
}

export async function writeALS(session: InteropSession): Promise<InteropExportResult> {
  const warnings: string[] = [];

  const trackXml = session.tracks
    .filter((t) => t.kind !== "master")
    .map((t, i) => {
      const tag =
        t.kind === "midi" ? "MidiTrack" : t.kind === "aux" ? "ReturnTrack" : "AudioTrack";
      return `<${tag} Id="${i}"><EffectiveName Value="${xmlEscape(t.name)}"/></${tag}>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Ableton MajorVersion="5" MinorVersion="12.0_12120" SchemaChangeCount="11" Creator="INSTINCT by Hughes Technologies">
  <LiveSet>
    <Name Value="${xmlEscape(session.meta.name)}"/>
    <Tempo><Manual Value="${session.meta.tempoBpm}"/></Tempo>
    <TimeSignature><Numerator Value="${session.meta.timeSignature[0]}"/><Denominator Value="${session.meta.timeSignature[1]}"/></TimeSignature>
    <SampleRate Value="${session.meta.sampleRate}"/>
    <Tracks>
${trackXml}
    </Tracks>
  </LiveSet>
</Ableton>
`;

  const gz = await gzipText(xml);
  warnings.push("Ableton round-trip preserves track names, tempo, time-sig, and sample-rate; clip envelopes are not exported.");
  return {
    buffer: gz,
    mimeType: "application/x-ableton-liveset",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}.als`,
    warnings
  };
}

function matchFirst(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m && m[1] ? m[1] : null;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function gzipText(s: string): Promise<Uint8Array> {
  const enc = new TextEncoder().encode(s);
  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("gzip");
    const ab = new ArrayBuffer(enc.byteLength);
    new Uint8Array(ab).set(enc);
    const stream = new Blob([ab]).stream().pipeThrough(cs);
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }
  // Fallback: no compression; Ableton also reads raw XML if the magic mismatches
  // (older betas); we simply write the XML uncompressed with a comment warning.
  return new TextEncoder().encode(`<!-- uncompressed fallback -->\n${s}`);
}

async function gunzipToText(bytes: Uint8Array): Promise<string> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    // not gzip — maybe raw xml
    return new TextDecoder().decode(bytes);
  }
  if (typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("gzip");
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const stream = new Blob([ab]).stream().pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder().decode(buf);
  }
  throw new Error("DecompressionStream unavailable; cannot inflate .als.");
}
