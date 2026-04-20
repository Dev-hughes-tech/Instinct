"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AudioWaveform,
  Cable,
  Cog,
  Drum,
  FileInput,
  Library,
  LayoutGrid,
  Piano,
  Sliders,
  Sparkles
} from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: LayoutGrid },
  { href: "/edit", label: "Edit", Icon: AudioWaveform },
  { href: "/mixer", label: "Mix", Icon: Sliders },
  { href: "/library", label: "Library", Icon: Library },
  { href: "/instruments", label: "Instr", Icon: Drum },
  { href: "/midi", label: "MIDI", Icon: Piano },
  { href: "/hardware", label: "HW", Icon: Cable },
  { href: "/interop", label: "Interop", Icon: FileInput },
  { href: "/michael", label: "Michael", Icon: Sparkles },
  { href: "/preferences", label: "Prefs", Icon: Cog }
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex w-[68px] flex-none flex-col items-center border-r border-surface-200 bg-white/60 py-3">
      <div className="flex flex-col gap-1">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              href={href}
              key={href}
              className={clsx(
                "group flex h-[52px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition",
                active
                  ? "bg-gradient-to-b from-white to-surface-150 shadow-lift"
                  : "hover:bg-white"
              )}
            >
              <Icon
                className={clsx(
                  "h-4 w-4",
                  active ? "text-surface-900" : "text-surface-500"
                )}
                strokeWidth={1.8}
              />
              <span
                className={clsx(
                  "text-[9px] uppercase tracking-[0.18em]",
                  active ? "text-surface-800" : "text-surface-500"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto" />
    </nav>
  );
}
