"use client";

import { useState } from "react";
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
  return (
    <div className="max-w-xl">
      <Panel title="Driver">
        <div className="flex items-center justify-between py-1 text-[13px]">
          <span>Audio Driver</span>
          <span className="num-readout text-surface-700">Core Audio · Apollo x8</span>
        </div>
        <div className="flex items-center justify-between py-1 text-[13px]">
          <span>Sample Rate</span>
          <span className="num-readout text-surface-700">48 kHz</span>
        </div>
        <div className="flex items-center justify-between py-1 text-[13px]">
          <span>Buffer</span>
          <span className="num-readout text-surface-700">128 samples (2.7 ms)</span>
        </div>
      </Panel>
      <Panel title="Engine">
        <div className="flex items-center justify-between py-1 text-[13px]">
          <span>Max Voices</span>
          <span className="num-readout text-surface-700">4096</span>
        </div>
        <div className="flex items-center justify-between py-1 text-[13px]">
          <span>Plugin Safety</span>
          <span className="num-readout text-surface-700">Sandbox all</span>
        </div>
      </Panel>
    </div>
  );
}

function IoPrefs() {
  return (
    <div className="max-w-xl">
      <Panel title="Hardware I/O">
        <p className="text-[12px] text-surface-500">
          32 × 32 analog + 8 × 8 ADAT detected.
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
            <li
              key={d.id}
              className="flex items-center gap-3 py-2 text-[13px]"
            >
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
        Tune Michael's intervention level, privacy, and on-device processing preferences.
      </p>
    </Panel>
  );
}
