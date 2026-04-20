"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Download,
  Heart,
  Music,
  Play,
  Plus,
  Search,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import {
  COLLECTIONS,
  filterSamples,
  listCategories,
  type Sample
} from "@/lib/library";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sample | null>(null);

  const results = useMemo(
    () => filterSamples(query, category, collectionId),
    [query, category, collectionId]
  );

  return (
    <div data-testid="library-page" className="flex h-full">
      {/* Left: collections + categories */}
      <aside className="flex w-[260px] flex-none flex-col gap-2 overflow-auto border-r border-surface-200 bg-white/70 p-3">
        <div>
          <div className="label-tiny mb-1">Categories</div>
          <ul className="flex flex-col gap-1">
            {listCategories().map((c) => (
              <li key={c.key}>
                <button
                  onClick={() => setCategory(c.key)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[12px]",
                    category === c.key
                      ? "bg-surface-900 text-white shadow-pop"
                      : "text-surface-700 hover:bg-white"
                  )}
                >
                  <span>{c.label}</span>
                  {c.key === "ai" && (
                    <Sparkles className="h-3 w-3 text-accent-violet" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="label-tiny mb-1 mt-2">Collections</div>
          <button
            onClick={() => setCollectionId(null)}
            className={clsx(
              "mb-1 w-full rounded-md px-2 py-1.5 text-left text-[12px]",
              collectionId === null
                ? "bg-surface-900 text-white"
                : "text-surface-700 hover:bg-white"
            )}
          >
            All collections
          </button>
          <ul className="flex flex-col gap-1">
            {COLLECTIONS.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setCollectionId(c.id)}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px]",
                    collectionId === c.id
                      ? "bg-white shadow-lift text-surface-900"
                      : "text-surface-700 hover:bg-white"
                  )}
                >
                  <span
                    className="h-6 w-6 flex-none rounded-md border border-surface-200"
                    style={{ background: c.cover }}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="num-readout text-[9px] text-surface-400">
                    {c.sampleCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main + right */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top toolbar */}
        <header className="flex flex-none items-center gap-2 border-b border-surface-200 bg-white/70 px-4 py-2">
          <div className="panel-lift flex h-9 flex-1 items-center gap-2 rounded-md px-3">
            <Search className="h-4 w-4 text-surface-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 21,000+ premium sounds, loops, presets…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-surface-400"
            />
            <span className="num-readout text-[11px] text-surface-500">
              {results.length}
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-surface-200 bg-white px-3 py-2 text-[12px] text-surface-700 shadow-lift">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-surface-200 bg-white px-3 py-2 text-[12px] text-surface-700 shadow-lift">
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-gradient-to-b from-accent-violet to-[#5a4ad9] px-3 py-2 text-[12px] font-medium text-white shadow-pop">
            <Wand2 className="h-3.5 w-3.5" /> Generate with Michael AI
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Grid */}
          <div className="min-w-0 flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2 xl:grid-cols-3">
              {results.map((s) => (
                <SampleRow
                  key={s.id}
                  sample={s}
                  selected={selected?.id === s.id}
                  onSelect={() => setSelected(s)}
                />
              ))}
              {results.length === 0 && (
                <div className="col-span-full rounded-md border border-dashed border-surface-200 p-10 text-center text-surface-500">
                  No sounds match your query.
                </div>
              )}
            </div>
          </div>

          {/* Preview / metadata */}
          <aside className="hidden w-[300px] flex-none flex-col gap-2 border-l border-surface-200 bg-white/60 p-3 xl:flex">
            <div className="label-tiny">Preview</div>
            {selected ? (
              <>
                <div className="panel-surface flex flex-col gap-2 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-surface-500" />
                    <span className="truncate text-[13px] font-medium">
                      {selected.name}
                    </span>
                    {selected.aiGenerated && (
                      <Sparkles className="h-3 w-3 text-accent-violet" />
                    )}
                  </div>
                  <PeakThumb peaks={selected.peaks} tall />
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <Stat label="BPM" value={selected.bpm?.toString() ?? "—"} />
                    <Stat label="Key" value={selected.keyRoot ?? "—"} />
                    <Stat
                      label="Len"
                      value={
                        selected.lengthSec > 0
                          ? `${selected.lengthSec.toFixed(1)}s`
                          : "—"
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-surface-200 bg-white px-2 py-0.5 text-[10px] text-surface-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex flex-1 items-center justify-center gap-1 rounded-md bg-surface-900 px-2 py-1.5 text-[12px] font-medium text-white">
                      <Play className="h-3 w-3" /> Audition
                    </button>
                    <button className="flex items-center gap-1 rounded-md border border-surface-200 bg-white px-2 py-1.5 text-[12px] text-surface-700">
                      <Heart className="h-3 w-3" />
                    </button>
                    <button className="flex items-center gap-1 rounded-md border border-surface-200 bg-white px-2 py-1.5 text-[12px] text-surface-700">
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="label-tiny mt-1">Drag to track</div>
                <div className="panel-sunken flex h-16 items-center justify-center rounded-md text-[11px] text-surface-500">
                  Drop anywhere in the Edit Screen to import.
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500">
                Select a sample to preview
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-sunken rounded-md py-1">
      <div className="label-tiny">{label}</div>
      <div className="num-readout text-[12px] text-surface-800">{value}</div>
    </div>
  );
}

function PeakThumb({ peaks, tall }: { peaks: number[]; tall?: boolean }) {
  const w = 260;
  const h = tall ? 48 : 24;
  const midY = h / 2;
  const pts = peaks
    .map((p, i) => {
      const x = (i / (peaks.length - 1)) * w;
      const a = p * (h / 2 - 2);
      return `${x.toFixed(1)},${(midY - a).toFixed(1)} ${x.toFixed(1)},${(midY + a).toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
    >
      <polyline points={pts} stroke="#3E8BFF" strokeWidth={1} fill="none" />
    </svg>
  );
}

function SampleRow({
  sample,
  selected,
  onSelect
}: {
  sample: Sample;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      draggable
      className={clsx(
        "group flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
        selected
          ? "border-accent-blue bg-white shadow-pop"
          : "border-surface-200 bg-white/70 hover:bg-white"
      )}
    >
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-surface-200"
        style={{ background: COLLECTIONS.find((c) => c.id === sample.collectionId)?.cover }}
      >
        {sample.aiGenerated ? (
          <Sparkles className="h-3.5 w-3.5 text-white/90" />
        ) : (
          <Music className="h-3.5 w-3.5 text-white/90" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[12.5px] font-medium text-surface-900">
          {sample.name}
        </span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500">
          {sample.kind} · {sample.tags.slice(0, 2).join(" · ")}
        </span>
      </div>
      <div className="hidden w-[120px] md:block">
        <PeakThumb peaks={sample.peaks} />
      </div>
      <div className="num-readout w-[52px] flex-none text-right text-[10.5px] text-surface-500">
        {sample.bpm ? `${sample.bpm} BPM` : sample.keyRoot ?? ""}
      </div>
    </button>
  );
}
