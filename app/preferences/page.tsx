"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  AudioLines,
  Cpu,
  Keyboard,
  Library,
  Paintbrush,
  Piano,
  Sparkles
} from "lucide-react";
import { MIDI_DEVICES } from "@/lib/midi";
import { useAudioStore } from "@/lib/audio/audioStore";
import type { BitDepth, BufferFrames, SampleRate } from "@/lib/audio/engine";
import { HARDWARE_CATALOG } from "@/lib/hardware";

const groups = [
  { id: "audio", label: "Audio Engine", Icon: AudioLines },
  { id: "io", label: "Hardware I/O", Icon: Cpu },
  { id: "midi", label: "MIDI Devices", Icon: Piano },
  { id: "appearance", label: "Appearance", Icon: Paintbrush },
  { id: "shortcuts", label: "Shortcuts", Icon: Keyboard },
  { id: "library", label: "Sound Library", Icon: Library },
  { id: "ai", label: "Michael AI", Icon: Sparkles }
] as const;

type GroupId = (typeof groups)[number]["id"];

export default function PreferencesPage() {
  const [group, setGroup] = useState<GroupId>("audio");
  return (
    <div className="flex h-full">
      <aside className="w-64 flex-none border-r border-surface-200 bg-white/70 p-3">
        <div className="label-tiny px-2 pb-2">Preferences</div>
        <nav className="flex flex-col gap-1">
          {groups.map((g) => {
            const active = g.id === group;
            return (
              <button
                key={g.id}
                onClick={() => setGroup(g.id)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                  active
                    ? "bg-white shadow-lift text-surface-900"
                    : "text-surface-600 hover:bg-white/60"
                )}
              >
                <g.Icon className="h-4 w-4" />
                {g.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-light tracking-tight text-surface-900">
          {groups.find((g) => g.id === group)!.label}
        </h1>

        {group === "audio" && <AudioPrefs />}
        {group === "io" && <IoPrefs />}
        {group === "midi" && <MidiPrefs />}
        {group === "appearance" && <AppearancePrefs />}
        {group === "shortcuts" && <ShortcutsPrefs />}
        {group === "library" && <LibraryPrefs />}
        {group === "ai" && <AIPrefs />}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-surface mt-4 rounded-xl p-4">
      <div className="label-tiny mb-2">{title}</div>
      {children}
    </section>
  );
}

function AudioPrefs() {
  const ready = useAudioStore((s) => s.ready);
  const backend = useAudioStore((s) => s.backend);
  const devices = useAudioStore((s) => s.devices);
  const deviceId = useAudioStore((s) => s.deviceId);
  const sampleRate = useAudioStore((s) => s.sampleRate);
  const bitDepth = useAudioStore((s) => s.bitDepth);
  const bufferSize = useAudioStore((s) => s.bufferSize);
  const masterLevel = useAudioStore((s) => s.masterLevel);
  const supportedSampleRates = useAudioStore((s) => s.supportedSampleRates);
  const supportedBitDepths = useAudioStore((s) => s.supportedBitDepths);
  const supportedBufferSizes = useAudioStore((s) => s.supportedBufferSizes);
  const start = useAudioStore((s) => s.start);
  const refreshDevices = useAudioStore((s) => s.refreshDevices);
  const setDevice = useAudioStore((s) => s.setDevice);
  const setSampleRate = useAudioStore((s) => s.setSampleRate);
  const setBitDepth = useAudioStore((s) => s.setBitDepth);
  const setBufferSize = useAudioStore((s) => s.setBufferSize);

  useEffect(() => {
    if (!ready) void start();
  }, [ready, start]);

  const roundTripMs = useMemo(() => {
    return ((bufferSize / sampleRate) * 1000 * 2).toFixed(2);
  }, [bufferSize, sampleRate]);

  const currentDevice =
    devices.find((d) => d.id === (deviceId ?? "default")) ??
    devices.find((d) => d.isDefault) ??
    devices[0];

  return (
    <div className="max-w-2xl">
      <Panel title="Backend">
        <Row
          label="Audio Backend"
          value={
            backend === "coreaudio"
              ? "Core Audio (AVAudioEngine · cpal)"
              : backend === "wasapi"
                ? "WASAPI (cpal)"
                : backend === "asio"
                  ? "ASIO (cpal)"
                  : "WebAudio (AudioContext)"
          }
        />
        <Row
          label="Engine Status"
          value={ready ? "Running" : "Initializing on first interaction…"}
        />
        <Row
          label="Round-Trip (approx)"
          value={`${roundTripMs} ms @ ${(sampleRate / 1000).toFixed(1)} kHz · ${bufferSize} samples`}
        />
        <Row
          label="Master Peak / RMS"
          value={`${(masterLevel.peak * 100).toFixed(0)}% / ${(masterLevel.rms * 100).toFixed(0)}%`}
        />
      </Panel>

      <Panel title="Output Device">
        <div className="flex flex-col gap-2 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            <span>Output</span>
            <select
              className="flex-1 rounded-md border border-surface-200 bg-white px-2 py-1 text-[12px]"
              value={deviceId ?? "default"}
              onChange={(e) => void setDevice(e.target.value)}
            >
              {devices.length === 0 && <option value="default">System Default</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} {d.isDefault ? "· default" : ""} · {d.channelCount}ch
                </option>
              ))}
            </select>
            <button
              onClick={() => void refreshDevices()}
              className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[11px]"
            >
              Rescan
            </button>
          </label>
          {currentDevice && (
            <p className="text-[11px] text-surface-500">
              {currentDevice.label} · native rates{" "}
              {currentDevice.sampleRates.map((r) => `${(r / 1000).toFixed(1)}k`).join(" / ")}
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Format">
        <div className="grid grid-cols-3 gap-3 text-[13px]">
          <label className="flex flex-col gap-1">
            <span className="label-tiny">Sample Rate</span>
            <select
              className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[12px]"
              value={sampleRate}
              onChange={(e) => void setSampleRate(parseInt(e.target.value) as SampleRate)}
            >
              {supportedSampleRates.map((r) => (
                <option key={r} value={r}>
                  {(r / 1000).toFixed(1)} kHz
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label-tiny">Bit Depth</span>
            <select
              className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[12px]"
              value={bitDepth}
              onChange={(e) => setBitDepth(parseInt(e.target.value) as BitDepth)}
            >
              {supportedBitDepths.map((b) => (
                <option key={b} value={b}>
                  {b}-bit {b === 32 ? "float" : "PCM"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label-tiny">Buffer Size</span>
            <select
              className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[12px]"
              value={bufferSize}
              onChange={(e) => void setBufferSize(parseInt(e.target.value) as BufferFrames)}
            >
              {supportedBufferSizes.map((b) => (
                <option key={b} value={b}>
                  {b} samples
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-[11px] text-surface-500">
          Internal bus runs 32-bit float; the selected bit depth applies at file
          export and device boundary. Sample rates span 44.1 – 192 kHz.
        </p>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span>{label}</span>
      <span className="num-readout text-surface-700">{value}</span>
    </div>
  );
}

function IoPrefs() {
  return (
    <div className="max-w-xl">
      <Panel title="Connected Hardware">
        {HARDWARE_CATALOG.length === 0 ? (
          <p className="text-[12px] text-surface-500">No hardware detected.</p>
        ) : (
          <ul className="divide-y divide-surface-100">
            {HARDWARE_CATALOG.slice(0, 8).map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2 text-[13px]">
                <div className="flex-1">
                  <div className="font-medium text-surface-900">{h.name}</div>
                  <div className="text-[11px] text-surface-500">
                    {h.vendor} · {h.protocols.join(", ")}
                  </div>
                </div>
                <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] text-surface-500">
                  {h.category}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-surface-500">
          {HARDWARE_CATALOG.length} devices catalogued. Live HAL enumeration
          runs when INSTINCT launches inside the Tauri shell.
        </p>
      </Panel>
    </div>
  );
}

function MidiPrefs() {
  return (
    <div>
      <p className="mt-1 max-w-xl text-sm text-surface-500">
        Detected devices. Full mapping, routing, and bidirectional feedback live
        in the MIDI Studio.
      </p>
      <Panel title="Devices">
        <ul className="divide-y divide-surface-100">
          {MIDI_DEVICES.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2 text-[13px]">
              <span
                className="h-6 w-6 rounded-md"
                style={{
                  background: `linear-gradient(180deg, ${d.color}cc, ${d.color}66)`
                }}
              />
              <div className="flex-1">
                <div className="font-medium text-surface-900">{d.name}</div>
                <div className="text-[11px] text-surface-500">
                  {d.vendor} · {d.protocols.join(", ")}
                </div>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  d.connected
                    ? "bg-[#E6F6EC] text-[#0b8a46]"
                    : "bg-surface-100 text-surface-500"
                )}
              >
                {d.connected ? "Connected" : "Idle"}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/midi"
          className="mt-3 inline-flex items-center gap-1 rounded-md bg-surface-900 px-3 py-1.5 text-[12px] font-medium text-white"
        >
          Open MIDI Studio
        </Link>
      </Panel>
    </div>
  );
}

function AppearancePrefs() {
  return (
    <Panel title="Theme">
      <div className="grid max-w-xl grid-cols-3 gap-2">
        {["Porcelain (default)", "Silver", "Midnight"].map((t, i) => (
          <button
            key={t}
            className={clsx(
              "rounded-xl border p-3 text-left",
              i === 0
                ? "border-surface-900 shadow-pop"
                : "border-surface-200 bg-white"
            )}
          >
            <div className="label-tiny">Theme</div>
            <div className="text-[13px] font-medium text-surface-900">{t}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ShortcutsPrefs() {
  const rows = [
    ["Play / Stop", "Space"],
    ["Record", "⌘R"],
    ["Open Mixer", "⌘2"],
    ["Open Library", "⌘L"],
    ["Open MIDI Studio", "⌘M"],
    ["Toggle Michael AI", "⌥⌘I"]
  ];
  return (
    <Panel title="Shortcuts">
      <ul className="divide-y divide-surface-100 text-[13px]">
        {rows.map(([a, b]) => (
          <li key={a} className="flex items-center justify-between py-1.5">
            <span>{a}</span>
            <kbd className="rounded-md border border-surface-200 bg-white px-2 py-0.5 text-[11px] text-surface-700">
              {b}
            </kbd>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function LibraryPrefs() {
  return (
    <Panel title="Cloud Sync">
      <p className="text-[12px] text-surface-500">
        INSTINCT keeps your sound library in sync across desktop, web, and mobile.
      </p>
    </Panel>
  );
}

function AIPrefs() {
  return (
    <Panel title="Michael AI">
      <p className="text-[12px] text-surface-500">
        Tune Michael&apos;s intervention level, privacy, and on-device processing preferences.
      </p>
    </Panel>
  );
}
