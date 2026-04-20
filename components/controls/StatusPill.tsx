"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "neutral" | "record" | "solo" | "mute" | "ai" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "",
  record:
    "data-[active=true]:!bg-[linear-gradient(180deg,#ef4444,#b91c1c)] data-[active=true]:!text-white data-[active=true]:!border-red-900/30",
  solo:
    "data-[active=true]:!bg-[linear-gradient(180deg,#f2c94c,#b57f1f)] data-[active=true]:!text-black data-[active=true]:!border-amber-900/30",
  mute:
    "data-[active=true]:!bg-[linear-gradient(180deg,#2b2f34,#0f1114)] data-[active=true]:!text-white data-[active=true]:!border-black/30",
  ai:
    "data-[active=true]:!bg-[linear-gradient(180deg,#8C7BFF,#5a4ad9)] data-[active=true]:!text-white data-[active=true]:!border-violet-900/30",
  accent:
    "data-[active=true]:!bg-[linear-gradient(180deg,#3E8BFF,#2563d9)] data-[active=true]:!text-white data-[active=true]:!border-blue-900/30"
};

export function StatusPill({
  children,
  active,
  tone = "neutral",
  onClick,
  className,
  title
}: {
  children: ReactNode;
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      data-active={active ? "true" : "false"}
      className={clsx("pill-btn", TONE_CLASSES[tone], className)}
    >
      {children}
    </button>
  );
}
