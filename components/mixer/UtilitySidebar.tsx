"use client";

import clsx from "clsx";
import { MixingWithMichael } from "./MixingWithMichael";

const groups = [
  { label: "CHANNELS", items: ["All", "Drums", "Bass", "Keys", "Vox", "FX"] },
  { label: "AUX / FX", items: ["Plate", "Slap", "Parallel"] },
  { label: "METERS", items: ["Peak", "RMS", "LUFS-S", "LUFS-I"] },
  { label: "INPUT", items: ["Mic Pre", "Line", "Digital"] },
  { label: "DYN · EQ", items: ["Comp", "Gate", "EQ", "De-ess"] },
  { label: "SENDS", items: ["Pre", "Post", "Grp"] },
  { label: "OUTPUT", items: ["Mon L", "Mon R", "Cue 1", "Cue 2"] }
] as const;

export function UtilitySidebar() {
  return (
    <aside
      data-testid="utility-sidebar"
      className="flex h-full w-[196px] flex-none flex-col gap-2 overflow-auto border-r border-surface-200 bg-white/75 p-2"
    >
      {groups.map((g) => (
        <Group key={g.label} title={g.label} items={g.items as unknown as string[]} />
      ))}
      <div className="label-tiny mt-1 px-1">CUSTOM</div>
      <MixingWithMichael />
    </aside>
  );
}

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="panel-surface rounded-lg p-1.5">
      <div className="label-tiny mb-1 px-1">{title}</div>
      <ul className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <li
            key={it}
            className={clsx(
              "cursor-default rounded-[5px] border px-1.5 py-0.5 text-[10px]",
              i === 0
                ? "border-surface-900 bg-surface-900 text-white"
                : "border-surface-200 bg-white text-surface-700"
            )}
          >
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
