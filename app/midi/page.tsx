"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Bluetooth,
  Cable,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Usb,
  Wand2
} from "lucide-react";
import { MIDI_DEVICES, type MidiDevice, type MidiProtocol } from "@/lib/midi";
import { LiveWebMidi } from "@/components/midi/LiveWebMidi";

export default function MidiStudioPage() {
  const [selectedId, setSelectedId] = useState<string>(MIDI_DEVICES[0]!.id);
  const selected = MIDI_DEVICES.find((d) => d.id === selectedId)!;

  return (
    <div data-testid="midi-studio" className="flex h-full">
      <aside className="w-[280px] flex-none overflow-auto border-r border-surface-200 bg-white/70 p-3">
        <div className="flex items-center justify-between">
          <div className="label-tiny">MIDI Studio</div>
          <button className="flex items-center gap-1 rounded-md border border-surface-200 bg-white px-2 py-1 text-[10px] text-surface-700">
            <RefreshCw className="h-3 w-3" /> Scan
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {MIDI_DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-2 py-2 text-left",
                d.id === selectedId
                  ? "border-surface-900 bg-white shadow-pop"
                  : "border-surface-200 bg-white/70 hover:bg-white"
              )}
            >
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-md"
                style={{
                  background: `linear-gradient(180deg, ${d.color}cc, ${d.color}66)`
                }}
              >
                <DeviceIcon kind={d.kind} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[12px] font-medium text-surface-900">
                  {d.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500">
                  {d.vendor} · {d.kind}
                </span>
              </div>
              <span
                className={clsx(
                  "h-2 w-2 rounded-full",
                  d.connected
                    ? "bg-[#4CD07A] shadow-[0_0_6px_#4CD07A]"
                    : "bg-surface-300"
                )}
              />
            </button>
          ))}
          <button className="mt-1 flex items-center justify-center gap-1 rounded-md border border-dashed border-surface-300 bg-white/60 px-2 py-2 text-[12px] text-surface-600">
            <Plus className="h-3 w-3" /> Add virtual / network device
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-5">
        <DeviceHeader device={selected} />

        <div className="mt-5">
          <LiveWebMidi />
        </div>

        <div className="mt-5 grid grid-cols-12 gap-4">
          <Panel className="col-span-4" title="Connection">
            <Row label="Protocols">
              <div className="flex flex-wrap gap-1">
                {selected.protocols.map((p) => (
                  <ProtocolChip key={p} protocol={p} />
                ))}
              </div>
            </Row>
            <Row label="Firmware">
              <span className="num-readout text-[12px] text-surface-800">
                {selected.firmware ?? "—"}
              </span>
            </Row>
            <Row label="Auto-map">
              <span className="text-[12px] text-surface-800">
                {selected.autoMapProfile}
              </span>
            </Row>
            <Row label="Ports">
              <ul className="text-[11px] text-surface-700">
                {selected.ports.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-0.5">
                    <span>
                      {p.direction === "in" ? "← IN" : "→ OUT"} · {p.protocol}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px]",
                        p.connected ? "text-[#0b8a46]" : "text-surface-400"
                      )}
                    >
                      {p.connected ? "OPEN" : "IDLE"}
                    </span>
                  </li>
                ))}
              </ul>
            </Row>
          </Panel>

          <Panel className="col-span-8" title="Mappings">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-surface-500">
                {selected.mappings.length} control assignments · bidirectional feedback
              </div>
              <button className="flex items-center gap-1 rounded-md bg-gradient-to-b from-accent-violet to-[#5a4ad9] px-2.5 py-1 text-[11px] font-medium text-white shadow-pop">
                <Wand2 className="h-3 w-3" /> Auto-map with Michael AI
              </button>
            </div>
            <div className="mt-2 overflow-hidden rounded-md border border-surface-200">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-50 text-[10px] uppercase tracking-[0.12em] text-surface-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Control</th>
                    <th className="px-3 py-2 text-left">Message</th>
                    <th className="px-3 py-2 text-left">Ch</th>
                    <th className="px-3 py-2 text-left">Value</th>
                    <th className="px-3 py-2 text-left">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.mappings.map((m) => (
                    <tr key={m.id} className="border-t border-surface-100">
                      <td className="px-3 py-1.5 text-surface-800">{m.control}</td>
                      <td className="px-3 py-1.5 text-surface-600">{m.messageType}</td>
                      <td className="px-3 py-1.5 num-readout text-surface-600">{m.channel}</td>
                      <td className="px-3 py-1.5 num-readout text-surface-600">{m.value}</td>
                      <td className="px-3 py-1.5 text-surface-900">{m.destination}</td>
                    </tr>
                  ))}
                  {selected.mappings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-surface-500">
                        No mappings yet. Move any control to auto-learn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="col-span-12" title="Universal compatibility">
            <p className="text-[12px] leading-relaxed text-surface-700">
              INSTINCT auto-detects any class-compliant MIDI device and every major vendor
              profile — Hughes, Native Instruments, Ableton, Akai, Novation, ROLI, Arturia,
              Moog, Nord, Kawai, Korg, Roland, Yamaha, Behringer, PreSonus, Mackie,
              and more. Works over USB, DIN, BLE, and RTP-MIDI networks.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DeviceHeader({ device }: { device: MidiDevice }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-200"
        style={{
          background: `linear-gradient(180deg, ${device.color}cc, ${device.color}66)`
        }}
      >
        <DeviceIcon kind={device.kind} size={22} />
      </span>
      <div className="leading-tight">
        <div className="label-tiny">{device.vendor}</div>
        <h1 className="text-xl font-light tracking-tight text-surface-900">
          {device.name}
        </h1>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
          <span
            className={clsx(
              "inline-block h-2 w-2 rounded-full",
              device.connected ? "bg-[#4CD07A]" : "bg-surface-300"
            )}
          />
          {device.connected ? "Connected" : "Disconnected"} · {device.autoMapProfile}
        </div>
      </div>
    </div>
  );
}

function ProtocolChip({ protocol }: { protocol: MidiProtocol }) {
  const Icon =
    protocol === "USB"
      ? Usb
      : protocol === "BLE"
        ? Bluetooth
        : protocol === "DIN"
          ? Cable
          : protocol === "Network (RTP)"
            ? Network
            : Radio;
  return (
    <span className="flex items-center gap-1 rounded-full border border-surface-200 bg-white px-2 py-0.5 text-[10px] text-surface-700">
      <Icon className="h-3 w-3" />
      {protocol}
    </span>
  );
}

function DeviceIcon({ kind, size = 16 }: { kind: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "keyboard" && (
        <>
          <rect x="2" y="8" width="20" height="10" rx="1.5" />
          <path d="M7 8v7M11 8v7M15 8v7M19 8v7" />
        </>
      )}
      {kind === "pad" && (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </>
      )}
      {kind === "control-surface" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <path d="M6 15h12" />
        </>
      )}
      {kind === "expression" && <path d="M3 12c4 0 4 6 8 6s4-12 8-12" />}
      {kind === "wind" && (
        <>
          <path d="M5 19c4-6 10-6 14-14" />
          <circle cx="6" cy="19" r="1.5" />
        </>
      )}
      {kind === "dj" && <circle cx="12" cy="12" r="8" />}
      {kind === "guitar-to-midi" && (
        <path d="M4 20c6 0 6-6 10-6s4 4 6 0" />
      )}
      {kind === "breath" && <path d="M4 12c4-6 12-6 16 0s-4 8-8 8-6-4-8-8Z" />}
    </svg>
  );
}

function Panel({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("panel-surface rounded-xl p-4", className)}>
      <div className="label-tiny mb-2">{title}</div>
      {children}
    </section>
  );
}

function Row({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-surface-100 py-1.5 last:border-b-0">
      <span className="label-tiny pt-0.5">{label}</span>
      <span className="flex-1 text-right">{children}</span>
    </div>
  );
}
