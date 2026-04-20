import { describe, it, expect } from "vitest";
import { writeBWF } from "@/lib/interop/bwf";
import type { InteropSession } from "@/lib/interop/types";

function str(bytes: Uint8Array, offset: number, len: number) {
  return new TextDecoder().decode(bytes.slice(offset, offset + len));
}
function u32(bytes: Uint8Array, offset: number) {
  return (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) | (bytes[offset + 3]! << 24)) >>> 0;
}

const SESSION: InteropSession = {
  meta: {
    name: "Master",
    sampleRate: 48000,
    bitDepth: 24,
    tempoBpm: 100,
    timeSignature: [4, 4],
    lengthSeconds: 1,
    source: "instinct"
  },
  tracks: []
};

describe("interop/bwf", () => {
  it("writes a RIFF/WAVE with fmt + bext + data chunks", () => {
    const pcm = new Float32Array(48000); // 1 sec silence stereo-interleaved shape
    const { buffer } = writeBWF(SESSION, pcm);
    expect(str(buffer, 0, 4)).toBe("RIFF");
    expect(str(buffer, 8, 4)).toBe("WAVE");
    // bext chunk follows
    expect(str(buffer, 12, 4)).toBe("bext");
    const bextSize = u32(buffer, 16);
    const afterBext = 12 + 8 + bextSize;
    expect(str(buffer, afterBext, 4)).toBe("fmt ");
  });

  it("honors 16-bit PCM encoding", () => {
    const pcm = new Int16Array(1024);
    const session16: InteropSession = { ...SESSION, meta: { ...SESSION.meta, bitDepth: 16 } };
    const { buffer } = writeBWF(session16, pcm);
    // fmt chunk sits after bext; find it
    const idx = (() => {
      for (let i = 12; i < buffer.length - 4; i++) {
        if (str(buffer, i, 4) === "fmt ") return i;
      }
      return -1;
    })();
    expect(idx).toBeGreaterThan(0);
    const bitsPerSample = buffer[idx + 8 + 14]! | (buffer[idx + 8 + 15]! << 8);
    expect(bitsPerSample).toBe(16);
  });
});
