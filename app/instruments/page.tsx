"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Piano, Search } from "lucide-react";
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORY_LABELS,
  searchInstruments,
  type InstrumentCategory
} from "@/lib/instruments";
import { useInstruments } from "@/lib/instrumentsStore";
import { InstrumentCard } from "@/components/instruments/InstrumentCard";
import { InstrumentDetail } from "@/components/instruments/InstrumentDetail";

/**
 * INSTINCT · Instruments
 * --------------------------------------------------------------
 * Arcade-style instrument browser. Every instrument is installed
 * in the INSTINCT://core content graph, so selecting a card loads
 * the instrument instantly — there are no external plug-in paths,
 * no missing-sample dialogs, and no sample-folder rewiring.
 */
export default function InstrumentsPage() {
  const selectedId = useInstruments((s) => s.selectedId);
  const selectInstrument = useInstruments((s) => s.selectInstrument);

  const [category, setCategory] = useState<"all" | InstrumentCategory>("all");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    let base = query.trim() ? searchInstruments(query) : INSTRUMENTS;
    if (category !== "all") base = base.filter((i) => i.category === category);
    return base;
  }, [category, query]);

  const selected = INSTRUMENTS.find((i) => i.id === selectedId) ?? INSTRUMENTS[0]!;

  const categoryIds = Object.keys(INSTRUMENT_CATEGORY_LABELS) as InstrumentCategory[];

  return (
    <div data-testid="instruments-page" className="flex h-full">
      {/* Category sidebar */}
      <aside className="w-[220px] flex-none border-r border-surface-200 bg-white/70 p-3">
        <div className="flex items-center gap-2">
          <Piano className="h-4 w-4 text-surface-700" />
          <div className="leading-tight">
            <div className="label-tiny">INSTINCT</div>
            <div className="text-[14px] font-semibold text-surface-900">Instruments</div>
          </div>
        </div>

        <div className="label-tiny mb-1 mt-4">Category</div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              onClick={() => setCategory("all")}
              className={clsx(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px]",
                category === "all" ? "bg-white shadow-lift" : "hover:bg-white"
              )}
            >
              <span>All</span>
              <span className="label-tiny">{INSTRUMENTS.length}</span>
            </button>
          </li>
          {categoryIds.map((cid) => {
            const count = INSTRUMENTS.filter((i) => i.category === cid).length;
            if (count === 0) return null;
            return (
              <li key={cid}>
                <button
                  onClick={() => setCategory(cid)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px]",
                    category === cid ? "bg-white shadow-lift" : "hover:bg-white"
                  )}
                >
                  <span>{INSTRUMENT_CATEGORY_LABELS[cid]}</span>
                  <span className="label-tiny">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="label-tiny mb-1 mt-4">Content</div>
        <div className="panel-surface rounded-md p-2 text-[11px] leading-snug text-surface-600">
          Every instrument ships inside INSTINCT's internal content graph
          (<span className="num-readout text-surface-800">INSTINCT://core</span>).
          No rewiring. No missing samples. No scanner.
        </div>
      </aside>

      {/* Browser + detail */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-surface-200 bg-white/80 px-5 py-3">
          <h1 className="text-lg font-light tracking-tight text-surface-900">
            Arcade Browser
          </h1>
          <span className="label-tiny">
            {results.length} of {INSTRUMENTS.length} instruments
          </span>
          <div className="ml-auto flex items-center gap-2 rounded-md border border-surface-200 bg-white/90 px-2 py-1">
            <Search className="h-3.5 w-3.5 text-surface-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search instruments, presets, families…"
              className="w-64 bg-transparent text-[12px] outline-none placeholder:text-surface-400"
            />
          </div>
        </header>

        <div className="grid flex-1 grid-cols-[1fr_520px] overflow-hidden">
          <section className="overflow-auto p-5">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map((i) => (
                <InstrumentCard
                  key={i.id}
                  instrument={i}
                  active={i.id === selectedId}
                  onSelect={() => selectInstrument(i.id)}
                />
              ))}
            </div>
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden border-l border-surface-200 bg-surface-50 p-4">
            <InstrumentDetail instrument={selected} />
          </section>
        </div>
      </div>
    </div>
  );
}
