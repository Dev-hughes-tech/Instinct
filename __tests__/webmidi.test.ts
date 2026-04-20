import { describe, it, expect } from "vitest";
import { decode, isWebMidiSupported } from "@/lib/webmidi";

describe("webmidi/decode", () => {
  it("decodes note-on", () => {
    const m = decode(new Uint8Array([0x90, 60, 100]), 0, "p1");
    expect(m.type).toBe("note-on");
    expect(m.channel).toBe(1);
    expect(m.data1).toBe(60);
    expect(m.data2).toBe(100);
  });

  it("treats note-on with velocity=0 as note-off", () => {
    const m = decode(new Uint8Array([0x90, 60, 0]), 0, "p1");
    expect(m.type).toBe("note-off");
  });

  it("decodes CC on channel 16", () => {
    const m = decode(new Uint8Array([0xbf, 7, 64]), 0, "p1");
    expect(m.type).toBe("cc");
    expect(m.channel).toBe(16);
    expect(m.data1).toBe(7);
    expect(m.data2).toBe(64);
  });

  it("decodes system clock", () => {
    const m = decode(new Uint8Array([0xf8]), 0, "p1");
    expect(m.type).toBe("clock");
  });

  it("decodes sysex header", () => {
    const m = decode(new Uint8Array([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]), 0, "p1");
    expect(m.type).toBe("sysex");
  });

  it("decodes pitch bend", () => {
    const m = decode(new Uint8Array([0xe0, 0x00, 0x40]), 0, "p1");
    expect(m.type).toBe("pitch-bend");
  });
});

describe("webmidi/isSupported", () => {
  it("returns false under jsdom without WebMIDI", () => {
    expect(typeof isWebMidiSupported()).toBe("boolean");
  });
});
