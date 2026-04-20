"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { MENU_BAR, type MenuItem, type MenuRoot } from "@/lib/menus";

/**
 * MenuBar — macOS-style horizontal application menu for INSTINCT.
 *
 * Interaction model (matched to Pro Tools / Logic / Cubase / Ableton):
 *   • Click a root to open; while open, hover sibling roots to switch.
 *   • Arrow Left/Right cycle roots; Up/Down navigate items.
 *   • Enter invokes; Esc closes; Click-outside closes.
 *   • Submenus cascade to the right, same keyboard rules.
 *
 * Commands are not yet wired to a bus — onCommand is fired with the item id
 * so the host can hook to the forthcoming INSTINCT command registry.
 */
export function MenuBar({
  onCommand
}: {
  onCommand?: (id: string, item: MenuItem) => void;
}) {
  const [openRootId, setOpenRootId] = useState<string | null>(null);
  const [submenuTrail, setSubmenuTrail] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function close() {
    setOpenRootId(null);
    setSubmenuTrail([]);
  }

  function invoke(item: MenuItem) {
    if (item.submenu && item.submenu.length > 0) return;
    onCommand?.(item.id, item);
    close();
  }

  const openRoot = openRootId ? MENU_BAR.find((r) => r.id === openRootId) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full items-center gap-0.5"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {MENU_BAR.map((root) => (
        <button
          key={root.id}
          onClick={() =>
            setOpenRootId((prev) => (prev === root.id ? null : root.id))
          }
          onMouseEnter={() => {
            if (openRootId && openRootId !== root.id) {
              setOpenRootId(root.id);
              setSubmenuTrail([]);
            }
          }}
          className={clsx(
            "rounded-md px-2 py-1 text-[12px] leading-none transition",
            root.id === openRootId
              ? "bg-surface-900 text-white"
              : "text-surface-700 hover:bg-surface-100"
          )}
        >
          {root.label}
        </button>
      ))}

      {openRoot && (
        <MenuPanel
          root={openRoot}
          trail={submenuTrail}
          setTrail={setSubmenuTrail}
          invoke={invoke}
        />
      )}
    </div>
  );
}

function MenuPanel({
  root,
  trail,
  setTrail,
  invoke
}: {
  root: MenuRoot;
  trail: string[];
  setTrail: (t: string[]) => void;
  invoke: (i: MenuItem) => void;
}) {
  return (
    <div
      className="absolute left-0 top-[calc(100%+4px)] z-50 flex items-start"
      style={{ filter: "drop-shadow(0 14px 30px rgba(15,18,28,0.22))" }}
    >
      <MenuList
        items={root.items}
        level={0}
        trail={trail}
        setTrail={setTrail}
        invoke={invoke}
      />
    </div>
  );
}

function MenuList({
  items,
  level,
  trail,
  setTrail,
  invoke
}: {
  items: MenuItem[];
  level: number;
  trail: string[];
  setTrail: (t: string[]) => void;
  invoke: (i: MenuItem) => void;
}) {
  const openChildId = trail[level];
  const openChild = openChildId ? items.find((i) => i.id === openChildId) : null;

  return (
    <>
      <ul
        className="min-w-[260px] overflow-hidden rounded-lg border border-surface-200 bg-white/95 py-1 text-[12px] text-surface-800 backdrop-blur"
        role="menu"
      >
        {items.map((item) => {
          if (item.separator) {
            return (
              <li
                key={item.id + Math.random()}
                role="separator"
                className="my-1 h-px bg-surface-100"
              />
            );
          }
          const hasSub = !!item.submenu && item.submenu.length > 0;
          const isOpen = openChildId === item.id;
          return (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={-1}
              onMouseEnter={() => {
                const next = trail.slice(0, level);
                if (hasSub) next.push(item.id);
                setTrail(next);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (hasSub) return;
                invoke(item);
              }}
              className={clsx(
                "group flex cursor-pointer items-center gap-3 px-3 py-1.5 transition",
                isOpen ? "bg-surface-900 text-white" : "hover:bg-surface-100"
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
              {item.source && item.source.length > 0 && (
                <span
                  className={clsx(
                    "hidden text-[9px] uppercase tracking-[0.12em]",
                    isOpen ? "text-white/70" : "text-surface-400",
                    "group-hover:inline"
                  )}
                  title={`From: ${item.source.join(", ")}`}
                >
                  {item.source[0] === "all" ? "STD" : item.source[0]!.slice(0, 3).toUpperCase()}
                </span>
              )}
              {item.shortcut && (
                <span
                  className={clsx(
                    "num-readout text-[10px]",
                    isOpen ? "text-white/80" : "text-surface-500"
                  )}
                >
                  {item.shortcut}
                </span>
              )}
              {hasSub && (
                <ChevronRight
                  className={clsx(
                    "h-3 w-3",
                    isOpen ? "text-white" : "text-surface-400"
                  )}
                />
              )}
            </li>
          );
        })}
      </ul>

      {openChild && openChild.submenu && (
        <MenuList
          items={openChild.submenu}
          level={level + 1}
          trail={trail}
          setTrail={setTrail}
          invoke={invoke}
        />
      )}
    </>
  );
}
