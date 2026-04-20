/**
 * PreSonus Studio One .song adapter.
 *
 * A `.song` is a ZIP archive with:
 *   song.xml         — metadata (name, tempo, sig)
 *   Song/            — project binary graph
 *   Media/           — recorded audio + imported assets
 *
 * INSTINCT reads the XML header to restore tempo/sig/tracks and writes a
 * companion song.xml that Studio One merges on open.
 */

import type {
  InteropExportResult,
  InteropImportResult,
  InteropSession,
  InteropTrack
} from "./types";

export function parseStudioOne(bytes: Uint8Array): InteropImportResult {
  const warnings: string[] = [];
  const unsupported: string[] = ["Studio One scenes", "Chord track mappings"];

  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Not a Studio One .song: ZIP magic missing.");
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const xmlStart = text.indexOf("<?xml");
  let name = "Studio One Song";
  let bpm = 120;
  let tsNum = 4;
  let tsDen = 4;
  const tracks: InteropTrack[] = [];

  if (xmlStart >= 0) {
    const xml = text.slice(xmlStart, xmlStart + 100_000);
    name = /<songName>([^<]+)<\/songName>/.exec(xml)?.[1] ?? name;
    bpm = Number(/<tempo>([\d.]+)<\/tempo>/.exec(xml)?.[1]) || bpm;
    tsNum = Number(/<numerator>(\d+)<\/numerator>/.exec(xml)?.[1]) || tsNum;
    tsDen = Number(/<denominator>(\d+)<\/denominator>/.exec(xml)?.[1]) || tsDen;

    const re = /<track\s+([^>]+)\/>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml))) {
      const attrs = m[1] ?? "";
      const tname = /name="([^"]+)"/.exec(attrs)?.[1] ?? "Track";
      const tkind = /kind="([^"]+)"/.exec(attrs)?.[1] ?? "audio";
      tracks.push({
        id: crypto.randomUUID?.() ?? `${Math.random()}`,
        name: tname,
        kind: (tkind === "instrument" ? "midi" : "audio"),
        clips: []
      });
    }
  } else {
    warnings.push("song.xml not found in uncompressed portion; only ZIP header parsed.");
  }

  return {
    session: {
      meta: {
        name,
        sampleRate: 48000,
        bitDepth: 24,
        tempoBpm: bpm,
        timeSignature: [tsNum, tsDen],
        lengthSeconds: 0,
        source: "song"
      },
      tracks
    },
    warnings,
    unsupported,
    bytesRead: bytes.length
  };
}

export function writeStudioOneXmlSidecar(session: InteropSession): InteropExportResult {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<song>
  <songName>${session.meta.name}</songName>
  <tempo>${session.meta.tempoBpm}</tempo>
  <timeSignature>
    <numerator>${session.meta.timeSignature[0]}</numerator>
    <denominator>${session.meta.timeSignature[1]}</denominator>
  </timeSignature>
  <tracks>
${session.tracks
  .map((t) => `    <track name="${t.name}" kind="${t.kind === "midi" ? "instrument" : "audio"}"/>`)
  .join("\n")}
  </tracks>
  <exporter>INSTINCT by Hughes Technologies</exporter>
</song>
`;
  return {
    buffer: new TextEncoder().encode(xml),
    mimeType: "application/xml",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}_studioone.xml`,
    warnings: [
      "Exported as song.xml companion. Bundle into a ZIP with Media/ and rename " +
        ".song to complete the round-trip into Studio One."
    ]
  };
}
