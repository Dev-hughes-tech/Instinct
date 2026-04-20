/** Formatting helpers. Keep pure and side-effect free. */

export function formatDb(linear: number): string {
  if (linear <= 0.0001) return "-∞";
  const db = 20 * Math.log10(Math.max(linear, 0.0001) / 0.75);
  const sign = db > 0 ? "+" : "";
  return `${sign}${db.toFixed(1)} dB`;
}

export function formatPan(pan: number): string {
  if (Math.abs(pan) < 0.02) return "C";
  const pct = Math.round(Math.abs(pan) * 100);
  return `${pan < 0 ? "L" : "R"}${pct}`;
}

export function formatBeats(beats: number, sig: [number, number]): string {
  const [num] = sig;
  const bar = Math.floor(beats / num) + 1;
  const beat = Math.floor(beats % num) + 1;
  const tick = Math.round((beats % 1) * 480);
  return `${bar}.${beat}.${tick.toString().padStart(3, "0")}`;
}

export function formatHz(hz: number): string {
  if (hz <= 0) return "OFF";
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)}k`;
  return `${Math.round(hz)}`;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
