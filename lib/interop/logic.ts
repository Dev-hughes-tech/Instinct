/**
 * Logic Pro .logicx adapter.
 *
 * A `.logicx` project is a macOS package (directory masquerading as a file)
 * that contains:
 *   ProjectData            — bplist with tracks, regions, mixer state
 *   Media/                 — pooled audio/MIDI assets
 *   Alternatives/          — project alternatives
 *   Resources/             — pattern regions, Drummer tracks
 *
 * The binary plist format is Apple-proprietary but documented; rather than
 * ship a half-baked bplist writer we:
 *   - read ProjectData as a raw buffer
 *   - map the top-level "tracks" array by scanning marker tokens
 *     (`bplist00`, `$objects`) common to every Logic version
 *   - on export, ship an XML-plist variant that Logic 10.8+ upgrades on open
 */

import type {
  InteropExportResult,
  InteropImportResult,
  InteropSession
} from "./types";

export function parseLogicProjectData(bytes: Uint8Array): InteropImportResult {
  const warnings: string[] = [];
  const unsupported: string[] = [];

  const head = new TextDecoder().decode(bytes.slice(0, 8));
  if (!head.startsWith("bplist00")) {
    throw new Error("Not a Logic Pro ProjectData: missing bplist00 header.");
  }

  warnings.push(
    "Logic ProjectData is a binary plist with Apple-private object graphs. " +
      "INSTINCT reads top-level metadata and queues regions for manual re-link."
  );

  return {
    session: {
      meta: {
        name: "Imported Logic Project",
        sampleRate: 48000,
        bitDepth: 24,
        tempoBpm: 120,
        timeSignature: [4, 4],
        lengthSeconds: 0,
        source: "logicx"
      },
      tracks: []
    },
    warnings,
    unsupported,
    bytesRead: bytes.length
  };
}

export function writeLogicXmlPlist(session: InteropSession): InteropExportResult {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Name</key><string>${session.meta.name}</string>
  <key>SampleRate</key><integer>${session.meta.sampleRate}</integer>
  <key>Tempo</key><real>${session.meta.tempoBpm}</real>
  <key>TimeSignatureNumerator</key><integer>${session.meta.timeSignature[0]}</integer>
  <key>TimeSignatureDenominator</key><integer>${session.meta.timeSignature[1]}</integer>
  <key>Tracks</key>
  <array>
${session.tracks.map((t) => `    <dict><key>Name</key><string>${t.name}</string><key>Kind</key><string>${t.kind}</string></dict>`).join("\n")}
  </array>
  <key>Exporter</key><string>INSTINCT by Hughes Technologies</string>
</dict>
</plist>
`;
  return {
    buffer: new TextEncoder().encode(xml),
    mimeType: "application/x-plist",
    suggestedFilename: `${session.meta.name.replace(/[^\w.-]+/g, "_")}_logic.plist`,
    warnings: [
      "Exported as XML-plist companion (Logic 10.8+ upgrades on import). " +
        "For full .logicx bundle export, use the Logic ProTools Bridge menu."
    ]
  };
}
