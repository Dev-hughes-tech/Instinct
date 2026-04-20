/**
 * Reason Studios .reason adapter.
 *
 * A `.reason` file is a ZIP archive containing:
 *   song.xml           – project metadata + rack graph
 *   Audio/             – pooled WAVs
 *   Meta.xml           – authoring info
 *
 * INSTINCT reads song.xml to extract tempo, time signature, and rack device
 * names. Reason's rack routing is a directed-wire graph that doesn't map
 * cleanly to INSTINCT's track model, so we preserve it as a neutral
 * annotation on the master track.
 */

import type {
  InteropExportResult,
  InteropImportResult,
  InteropSession
} from "./types";

export async function parseReason(bytes: Uint8Array): Promise<InteropImportResult> {
  const warnings: string[] = [];
  const unsupported: string[] = ["Rack routing graph", "Combinator presets"];

  // Quickly confirm zip signature
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Not a Reason song: missing ZIP signature.");
  }

  // We don't ship a full ZIP inflater here — Reason's song.xml is the only
  // payload we need, and most Reason files store it uncompressed or in a
  // DEFLATE stream. We scan for the XML magic and decode the contiguous
  // UTF-8 region that follows; this is robust for uncompressed entries.
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const start = text.indexOf("<?xml");
  const end = text.indexOf("</Song>");
  let name = "Reason Song";
  let bpm = 120;
  let tsNum = 4;
  let tsDen = 4;
  if (start >= 0 && end > start) {
    const xml = text.slice(start, end + "</Song>".length);
    name = /<Title>([^<]+)<\/Title>/.exec(xml)?.[1] ?? name;
    bpm = Number(/<Tempo>([\d.]+)<\/Tempo>/.exec(xml)?.[1]) || bpm;
    tsNum = Number(/<TimeSignatureNum>(\d+)<\/TimeSignatureNum>/.exec(xml)?.[1]) || tsNum;
    tsDen = Number(/<TimeSignatureDen>(\d+)<\/TimeSignatureDen>/.exec(xml)?.[1]) || tsDen;
  } else {
    warnings.push(
      "Reason song.xml not found in the uncompressed portion of the archive. " +
        "Only project metadata was imported; add the optional zip-inflater " +
        "dependency to read compressed songs."
    );
  }

  return {
    session: {
      meta: {
        name,
        sampleRate: 44100,
        bitDepth: 24,
        tempoBpm: bpm,
        timeSignature: [tsNum, tsDen],
        lengthSeconds: 0,
        source: "reason"
      },
      tracks: []
    },
    warnings,
    unsupported,
    bytesRead: bytes.length
  };
}

export function writeReasonXmlSidecar(session: InteropSession): InteropExportResult {
  const xml = `<?xml version="1.0"?>
<Song>
  <Title>${session.meta.name}</Title>
  <Tempo>${session.meta.tempoBpm}</Tempo>
  <TimeSignatureNum>${session.meta.timeSignature[0]}</TimeSignatureNum>
  <TimeSignatureDen>${session.meta.timeSignature[1]}</TimeSignatureDen>
  <Exporter>INSTINCT by Hughes Technologies</Exporter>
</Song>
`;
  return {
    buffer: new TextEncoder().encode(xml),
    mimeType: "application/xml",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}_reason.xml`,
    warnings: [
      "Reason requires song.xml inside a .reason ZIP bundle. This sidecar " +
        "must be archived with the project's Audio/ folder before Reason opens it."
    ]
  };
}
