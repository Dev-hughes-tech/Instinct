"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import { ARCHITEXURE_PLUGINS, type ArchitexureCategory } from "@/lib/architexurePlugins";

const CATEGORY_ORDER: ArchitexureCategory[] = [
  "dynamics", "eq", "reverb", "delay", "modulation", "harmonics", "saturation", "metering", "mic-modeling", "mastering", "utility", "ai"
];

/**
 * Popover-style browser surfaced from the plugin rack "+ Add Device" slot.
 * Renders the full 30-plugin Architexure catalog, grouped by category.
 */
export function ArchitexureBrowser({
  onPick
}: {
  onPick: (pluginId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ArchitexureCategory | "all">("all");

  const filtered = ARCHITEXURE_PLUGINS.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (q.trim() && !(`${p.name} ${p.tagline} ${p.category}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div
      data-testid="architexure-browser"
      className="panel-surface flex max-h-[520px] w-[420px] flex-col overflow-hidden rounded-xl"
    >
      <header className="flex items-center gap-2 border-b border-surface-200 bg-white/90 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-surface-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Architexure plugins…"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-surface-400"
        />
      </header>
      <div className="flex flex-wrap gap-1 border-b border-surface-200 bg-surface-50 px-2 py-1.5">
        <button
          onClick={() => setCat("all")}
          className={clsx("pill-btn", cat === "all" && "data-[active=true]:bg-black")}
          data-active={cat === "all" ? "true" : "false"}
        >
          All
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="pill-btn"
            data-active={cat === c ? "true" : "false"}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="flex-1 overflow-auto">
        {filtered.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onPick(p.id)}
              className="group flex w-full items-center gap-2 border-b border-surface-100 px-3 py-2 text-left hover:bg-surface-50"
            >
              <div
                className="h-7 w-7 flex-none rounded-md"
                style={{
                  background: `radial-gradient(circle at 25% 25%, #fff 0%, ${p.accent} 75%)`,
                  boxShadow: `0 0 10px ${p.accent}55`
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-semibold text-surface-900">{p.name}</span>
                  <span className="label-tiny">{p.category}</span>
                </div>
                <span className="truncate text-[11px] text-surface-500">{p.tagline}</span>
              </div>
              <Plus className="h-3.5 w-3.5 flex-none text-surface-400 group-hover:text-surface-900" />
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="p-6 text-center text-[11px] text-surface-500">No matches.</li>
        )}
      </ul>
      <footer className="border-t border-surface-200 bg-surface-50 px-3 py-1.5 text-[10px] text-surface-500">
        {filtered.length} of {ARCHITEXURE_PLUGINS.length} devices · Hughes Technologies
      </footer>
    </div>
  );
}
