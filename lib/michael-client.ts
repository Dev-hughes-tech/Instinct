"use client";

/**
 * Client-side helper for talking to the Michael AI API route.
 * Uses fetch + ReadableStream so the UI can stream tokens.
 */

import type { MichaelCapabilityId } from "./michael-capabilities";
import type { Session } from "./types";

export interface MichaelStreamOptions {
  capability: MichaelCapabilityId;
  input: string;
  session: Session;
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface MichaelError {
  error: string;
  detail?: string;
}

export async function streamMichael(opts: MichaelStreamOptions): Promise<void> {
  const res = await fetch("/api/michael", {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      capability: opts.capability,
      input: opts.input,
      session: opts.session,
      stream: true
    })
  });

  if (!res.ok) {
    let body: MichaelError | null = null;
    try {
      body = (await res.json()) as MichaelError;
    } catch {
      /* ignore */
    }
    const err = new Error(
      `Michael AI returned ${res.status}: ${body?.detail ?? body?.error ?? "unknown"}`
    );
    (err as Error & MichaelError).error = body?.error ?? "unknown";
    throw err;
  }

  if (!res.body) throw new Error("Michael AI response had no body.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) opts.onToken(decoder.decode(value, { stream: true }));
  }
}
