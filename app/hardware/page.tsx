"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Cable, Cpu, Piano, Search, Sliders, Speaker } from "lucide-react";
import {
  HARDWARE_CATALOG,
  searchHardware,
  vendors,
  type HardwareCategory,
  type HardwareProfile
} from "@/lib/hardware";

const CATEGORY_META: Record<HardwareCategory, { label: string; Icon: typeof Cable }> = {
  "audio-interface": { label: "Audio Interfaces", Icon: Cable },
  "control-surface": { label: "Control Surfaces", Icon: Sliders },
  "midi-keyboard": { label: "MIDI Keyboards", Icon: Piano },
  "pad-controller": { label: "Pad Controllers", Icon: Cpu },
  "monitor-controller": { label: "Monitor Controllers", Icon: Speaker }
};

export default function HardwarePage() {
  const [cat, setCat] = useState<"all" | HardwareCategory>("all");
  const [vendor, setVendor] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HardwareProfile | null>(HARDWARE_CATALOG[0] ?? null);

  const vendorList = useMemo(() => ["all", ...vendors()], []);

  const results = useMemo(() => {
    let base = query.trim() ? searchHardware(query) : HARDWARE_CATALOG;
    if (cat !== "all") base = base.filter((h) => h.category === cat);
    if (vendor !== "all") base = base.filter((h) => h.vendor === vendor);
    return base;
  }, [cat, vendor, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: HARDWARE_CATALOG.length };
    for (const h of HARDWARE_CATALOG) {
      c[h.category] = (c[h.category] ?? 0) + 1;
    }
    return c;
  }, []);

  return (
    <div data-testid="hardware-page" className="flex h-full">
      <aside className="w-[240px] flex-none border-r border-surface-200 bg-white/70 p-3">
        <div className="flex items-center gap-2">
          <Cable className="h-4 w-4 text-surface-700" />
          <div className="leading-tight">
            <div className="label-tiny">INSTINCT</div>
            <div className="text-[14px] font-semibold text-surface-900">Hardware Registry</div>
          </div>
        </div>

        <div className="label-tiny mb-1 mt-4">Categories</div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              onClick={() => setCat("all")}
              className={clsx(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px]",
                cat === "all" ? "bg-white shadow-lift" : "hover:bg-white"
              )}
            >
              <span>All devices</span>
              <span className="label-tiny">{counts.all}</span>
            </button>
          </li>
          {(Object.keys(CATEGORY_META) as HardwareCategory[]).map((c) => {
            const Meta = CATEGORY_META[c];
            return (
              <li key={c}>
                <button
                  onClick={() => setCat(c)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px]",
                    cat === c ? "bg-white shadow-lift" : "hover:bg-white"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Meta.Icon className="h-3 w-3 text-surface-500" />
                    {Meta.label}
                  </span>
                  <span className="label-tiny">{counts[c] ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="label-tiny mb-1 mt-4">Vendor</div>
        <select
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="w-full rounded-md border border-surface-200 bg-white px-2 py-1 text-[12px] outline-none"
        >
          {vendorList.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "All vendors" : v}
            </option>
          ))}
        </select>

        <div className="panel-surface mt-4 rounded-md p-2 text-[11px] leading-snug text-surface-600">
          INSTINCT auto-binds every device in this registry at runtime via the
          native OS layer. Drivers ship with the vendor's installer; INSTINCT
          handles identification, capability negotiation, and protocol wiring.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-surface-200 bg-white/80 px-5 py-3">
          <h1 className="text-lg font-light tracking-tight text-surface-900">
            {cat === "all" ? "All devices" : CATEGORY_META[cat].label}
          </h1>
          <span className="label-tiny">
            {results.length} of {HARDWARE_CATALOG.length}
          </span>
          <div className="ml-auto flex items-center gap-2 rounded-md border border-surface-200 bg-white/90 px-2 py-1">
            <Search className="h-3.5 w-3.5 text-surface-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendor, model, protocol, feature…"
              className="w-72 bg-transparent text-[12px] outline-none placeholder:text-surface-400"
            />
          </div>
        </header>

        <div className="grid flex-1 grid-cols-[1fr_400px] overflow-hidden">
          <section className="overflow-auto p-5">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-surface-500">
                  <th className="px-2 py-2">Device</th>
                  <th className="px-2 py-2">Vendor</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Protocols</th>
                  <th className="px-2 py-2">I/O</th>
                </tr>
              </thead>
              <tbody>
                {results.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => setSelected(h)}
                    className={clsx(
                      "cursor-pointer border-t border-surface-100 hover:bg-surface-50",
                      selected?.id === h.id && "bg-white shadow-lift"
                    )}
                  >
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: h.color }}
                        />
                        <span className="font-medium text-surface-900">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-surface-700">{h.vendor}</td>
                    <td className="px-2 py-2 text-surface-500">{h.category}</td>
                    <td className="px-2 py-2 text-surface-600">
                      {h.protocols.slice(0, 2).join(" · ")}
                      {h.protocols.length > 2 && " +"}
                    </td>
                    <td className="px-2 py-2 text-surface-500 num-readout">
                      {h.io
                        ? `${h.io.analogIn ?? 0}×${h.io.analogOut ?? 0}`
                        : h.keys
                        ? `${h.keys} keys`
                        : h.faders
                        ? `${h.faders} faders`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="flex min-w-0 flex-col overflow-auto border-l border-surface-200 bg-surface-50 p-4">
            {selected ? <DeviceCard h={selected} /> : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ h }: { h: HardwareProfile }) {
  return (
    <div className="panel-surface flex flex-col gap-3 rounded-xl p-4">
      <header className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-md"
          style={{
            background: `linear-gradient(135deg, ${h.color}, ${h.color}77)`,
            boxShadow: `0 0 16px ${h.color}55`
          }}
        />
        <div className="min-w-0 leading-tight">
          <div className="label-tiny">{h.vendor}</div>
          <div className="truncate text-[15px] font-semibold text-surface-900">{h.name}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <InfoRow label="Category" value={h.category} />
        {h.usbVidPid && <InfoRow label="USB VID:PID" value={h.usbVidPid} />}
        {h.io && (
          <>
            {h.io.analogIn != null && <InfoRow label="Analog in" value={`${h.io.analogIn}`} />}
            {h.io.analogOut != null && <InfoRow label="Analog out" value={`${h.io.analogOut}`} />}
            {h.io.micPre != null && <InfoRow label="Mic pre" value={`${h.io.micPre}`} />}
            {h.io.digitalIn != null && <InfoRow label="Digital in" value={`${h.io.digitalIn}`} />}
            {h.io.digitalOut != null && <InfoRow label="Digital out" value={`${h.io.digitalOut}`} />}
          </>
        )}
        {h.faders != null && <InfoRow label="Faders" value={`${h.faders}`} />}
        {h.encoders != null && <InfoRow label="Encoders" value={`${h.encoders}`} />}
        {h.pads != null && <InfoRow label="Pads" value={`${h.pads}`} />}
        {h.keys != null && <InfoRow label="Keys" value={`${h.keys}`} />}
        {h.sampleRates && (
          <InfoRow label="Sample rates" value={`${Math.min(...h.sampleRates)}–${Math.max(...h.sampleRates)} Hz`} />
        )}
        {h.bitDepths && <InfoRow label="Bit depth" value={h.bitDepths.map((b) => `${b}-bit`).join(", ")} />}
      </div>

      <div>
        <div className="label-tiny mb-1">Protocols</div>
        <div className="flex flex-wrap gap-1">
          {h.protocols.map((p) => (
            <span key={p} className="rounded-full border border-surface-200 bg-white px-2 py-0.5 text-[10px] text-surface-700">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="label-tiny mb-1">Features</div>
        <ul className="flex flex-col gap-0.5 text-[11px] text-surface-700">
          {h.features.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
      </div>

      <div className="panel-sunken rounded-md p-2 text-[10px] leading-snug text-surface-600">
        <div className="label-tiny">Binding</div>
        INSTINCT will match this device by USB VID:PID and OS-reported name.
        Capability profile is applied on connect; no additional wiring required.
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white px-2 py-1 shadow-sm">
      <span className="label-tiny">{label}</span>
      <span className="num-readout text-surface-800">{value}</span>
    </div>
  );
}
