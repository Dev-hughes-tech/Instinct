"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Command, CornerDownLeft, Search } from "lucide-react";
import { MENU_BAR, type MenuItem } from "@/lib/menus";

interface FlatCommand {
  id: string;
  label: string;
  path: string[]; // breadcrumb: ["File", "Import", "AAF / OMF…"]
  shortcut?: string;
  source?: string[];
}

function flatten(items: MenuItem[], breadcrumb: string[] = []): FlatCommand[] {
  const out: FlatCommand[] = [];
  for (const it of items) {
    if (it.separator) continue;
    const path = [...breadcrumb, it.label];
    if (it.submenu && it.submenu.length > 0) {
      out.push(...flatten(it.submenu, path));
    } else {
      out.push({
        id: it.id,
        label: it.label,
        path,
        shortcut: it.shortcut,
        source: it.source
      });
    }
  }
  return out;
}

const ALL_COMMANDS: FlatCommand[] = MENU_BAR.flatMap((root) =>
  flatten(root.items, [root.label])
);

function score(cmd: FlatCommand, q: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase();
  const label = cmd.label.toLowerCase();
  const full = cmd.path.join(" > ").toLowerCase();
  if (label === needle) return 1000;
  if (label.startsWith(needle)) return 800;
  if (label.includes(needle)) return 600;
  if (full.includes(needle)) return 400;
  // fuzzy: all chars of needle appear in order in full
  let i = 0;
  for (const c of full) {
    if (c === needle[i]) i++;
    if (i === needle.length) return 200;
  }
  return -1;
}

/**
 * CommandPalette — ⌘K fuzzy search over every menu item in INSTINCT.
 *
 * Invoke:
 *   • ⌘K / Ctrl+K toggles the palette
 *   • Esc closes
 *   • ↑ / ↓ navigate
 *   • Enter invokes the highlighted command (fires onCommand)
 */
export function CommandPalette({
  onCommand
}: {
  onCommand?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setIndex(0);
    } else {
      setQuery("");
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return ALL_COMMANDS.slice(0, 40);
    return ALL_COMMANDS
      .map((c) => ({ c, s: score(c, query.trim()) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.c);
  }, [query]);

  function invoke(cmd: FlatCommand) {
    onCommand?.(cmd.id);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
      style={{ background: "rgba(15,18,28,0.35)", backdropFilter: "blur(4px)" }}
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-[560px] max-w-[90vw] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-[0_24px_60px_rgba(15,18,28,0.35)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-100 px-3 py-2.5">
          <Search className="h-4 w-4 text-surface-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const r = results[index];
                if (r) invoke(r);
              }
            }}
            placeholder="Run command, jump to menu, or search help…"
            className="flex-1 bg-transparent text-[13px] text-surface-900 placeholder:text-surface-400 focus:outline-none"
          />
          <span className="flex items-center gap-1 rounded-md border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] text-surface-500">
            <Command className="h-3 w-3" />K
          </span>
        </div>

        <ul className="max-h-[50vh] overflow-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-[12px] text-surface-500">
              No commands match &ldquo;{query}&rdquo;.
            </li>
          )}
          {results.map((r, i) => {
            const active = i === index;
            return (
              <li
                key={r.id}
                onMouseEnter={() => setIndex(i)}
                onClick={() => invoke(r)}
                className={clsx(
                  "flex cursor-pointer items-center gap-3 px-3 py-1.5 text-[12px]",
                  active ? "bg-surface-900 text-white" : "text-surface-800 hover:bg-surface-100"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate font-medium">{r.label}</span>
                  <span
                    className={clsx(
                      "truncate text-[10px] uppercase tracking-[0.1em]",
                      active ? "text-white/70" : "text-surface-400"
                    )}
                  >
                    {r.path.slice(0, -1).join(" › ")}
                  </span>
                </div>
                {r.source && r.source.length > 0 && (
                  <span
                    className={clsx(
                      "rounded-full border px-1.5 py-0.5 text-[9px]",
                      active
                        ? "border-white/30 text-white/80"
                        : "border-surface-200 bg-surface-50 text-surface-500"
                    )}
                    title={`Inspired by: ${r.source.join(", ")}`}
                  >
                    {r.source[0] === "all" ? "STD" : r.source[0]}
                  </span>
                )}
                {r.shortcut && (
                  <span
                    className={clsx(
                      "num-readout text-[10px]",
                      active ? "text-white/80" : "text-surface-500"
                    )}
                  >
                    {r.shortcut}
                  </span>
                )}
                {active && (
                  <CornerDownLeft className="h-3 w-3 text-white/80" />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50/60 px-3 py-1.5 text-[10px] text-surface-500">
          <span>{results.length} of {ALL_COMMANDS.length} commands</span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-surface-200 bg-white px-1 py-[1px]">↑↓</kbd> navigate
            <kbd className="rounded border border-surface-200 bg-white px-1 py-[1px]">↵</kbd> run
            <kbd className="rounded border border-surface-200 bg-white px-1 py-[1px]">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
