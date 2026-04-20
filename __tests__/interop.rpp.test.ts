import { describe, it, expect } from "vitest";
import { parseRPP, writeRPP } from "@/lib/interop/rpp";
import type { InteropSession } from "@/lib/interop/types";

const SAMPLE_RPP = `<REAPER_PROJECT 0.1 "7.00" 1700000000
  SAMPLERATE 48000 0 0
  TEMPO 96 4 4
  TITLE "Roundtrip"
  <TRACK {abc-1}
    NAME "Kick"
    VOLPAN 1.00000 0.00000 -1 -1 1
    <ITEM
      POSITION 0.000000
      LENGTH 2.500000
      NAME "Kick Hit"
      <SOURCE WAVE
        FILE "audio/kick.wav"
      >
    >
  >
  <TRACK {abc-2}
    NAME "Snare"
    <ITEM
      POSITION 1.000000
      LENGTH 1.250000
      NAME "Snare 1"
    >
  >
>`;

describe("interop/rpp", () => {
  it("parses a REAPER project into a neutral session", () => {
    const r = parseRPP(SAMPLE_RPP);
    expect(r.session.meta.sampleRate).toBe(48000);
    expect(r.session.meta.tempoBpm).toBe(96);
    expect(r.session.tracks.length).toBe(2);
    expect(r.session.tracks[0]?.name).toBe("Kick");
    expect(r.session.tracks[0]?.clips[0]?.lengthSec).toBeCloseTo(2.5);
    expect(r.session.tracks[0]?.clips[0]?.sourcePath).toBe("audio/kick.wav");
  });

  it("round-trips an INSTINCT session through RPP writer + parser", () => {
    const session: InteropSession = {
      meta: {
        name: "Trip",
        sampleRate: 44100,
        bitDepth: 24,
        tempoBpm: 140,
        timeSignature: [3, 4],
        lengthSeconds: 30,
        source: "instinct"
      },
      tracks: [
        {
          id: "id-1",
          name: "Lead Vox",
          kind: "audio",
          volumeDb: -3,
          panL2R: 0.25,
          clips: [
            {
              id: "c-1",
              name: "Lead Take 2",
              startSec: 4.0,
              lengthSec: 60.0,
              sourcePath: "audio/lead.wav"
            }
          ]
        }
      ]
    };
    const out = writeRPP(session);
    const parsed = parseRPP(new TextDecoder().decode(out.buffer));
    expect(parsed.session.meta.sampleRate).toBe(44100);
    expect(parsed.session.meta.tempoBpm).toBe(140);
    expect(parsed.session.tracks[0]?.name).toBe("Lead Vox");
    expect(parsed.session.tracks[0]?.clips[0]?.sourcePath).toBe("audio/lead.wav");
    expect(parsed.session.tracks[0]?.volumeDb).toBeCloseTo(-3, 0);
    expect(parsed.session.tracks[0]?.panL2R).toBeCloseTo(0.25, 2);
  });

  it("rejects non-REAPER input", () => {
    expect(() => parseRPP("<NOT_A_REAPER_FILE>")).toThrow();
  });
});
