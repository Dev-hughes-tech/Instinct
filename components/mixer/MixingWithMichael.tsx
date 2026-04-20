"use client";

/**
 * Embedded digital screen widget at the bottom of the Standalone Mixer's
 * far-left utility sidebar. Shows Michael AI's face + status. This is the
 * mandated "Mixing with Michael" tile.
 */
export function MixingWithMichael() {
  return (
    <div
      data-testid="mixing-with-michael"
      className="chassis-obsidian relative overflow-hidden rounded-xl p-2"
    >
      <span className="holo-sweep pointer-events-none absolute inset-0" />
      <div className="relative flex items-center gap-2">
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-white/15 bg-black">
          {/* LCD scanlines */}
          <div className="absolute inset-0" style={{
            background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)"
          }} />
          <div
            className="absolute inset-1 rounded-sm"
            style={{
              background:
                "radial-gradient(circle at 40% 30%, #ffffff 0%, #8C7BFF 42%, #38D1E0 75%, #5BD4A4 100%)"
            }}
          />
          {/* Face details */}
          <div className="absolute left-[10px] top-[14px] h-[4px] w-[4px] rounded-full bg-black/80" />
          <div className="absolute right-[10px] top-[14px] h-[4px] w-[4px] rounded-full bg-black/80" />
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[12px] -translate-x-1/2 rounded-b-full border-b-[1.5px] border-black/80" />
        </div>
        <div className="relative flex min-w-0 flex-col leading-tight">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/60">
            CUSTOM
          </span>
          <span className="truncate text-[11px] font-semibold text-white">
            Mixing with Michael
          </span>
          <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.18em] text-accent-cyan">
            ● Online · Listening
          </span>
        </div>
      </div>
      <div className="relative mt-2 rounded-md bg-black/40 p-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full"
            style={{
              width: "68%",
              background: "linear-gradient(90deg, #38D1E0, #8C7BFF)"
            }}
          />
        </div>
        <div className="mt-1 text-[8.5px] uppercase tracking-[0.14em] text-white/70">
          Confidence 68% · Vocal focus
        </div>
      </div>
    </div>
  );
}
