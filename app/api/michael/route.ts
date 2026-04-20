import { NextRequest } from "next/server";
import { claude, MICHAEL_SYSTEM_PROMPT, MODEL } from "@/lib/claude";
import {
  buildUserMessage,
  CAPABILITIES,
  type MichaelCapabilityId
} from "@/lib/michael-capabilities";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";
// This route is dynamic — it calls an external API per request.
export const dynamic = "force-dynamic";

interface MichaelRequestBody {
  capability: MichaelCapabilityId;
  input: string;
  session: Session;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  let body: MichaelRequestBody;
  try {
    body = (await req.json()) as MichaelRequestBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const valid = CAPABILITIES.some((c) => c.id === body.capability);
  if (!valid) {
    return Response.json({ error: "unknown_capability" }, { status: 400 });
  }
  if (!body.session) {
    return Response.json({ error: "missing_session" }, { status: 400 });
  }

  const userMessage = buildUserMessage(body.capability, body.session, body.input ?? "");

  let client;
  try {
    client = claude();
  } catch (e) {
    return Response.json(
      {
        error: "no_api_key",
        detail:
          "Set ANTHROPIC_API_KEY in .env.local. See .env.example for instructions."
      },
      { status: 500 }
    );
  }

  // Streaming response so the UI can progressively show Michael's output.
  if (body.stream !== false) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: MICHAEL_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }]
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `\n[Michael AI error] ${err instanceof Error ? err.message : "unknown"}\n`
            )
          );
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Michael-Model": MODEL
      }
    });
  }

  // Non-streaming fallback (e.g. server-side consumers).
  try {
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: MICHAEL_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    });
    const text = result.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return Response.json({ text, model: MODEL });
  } catch (err) {
    return Response.json(
      { error: "anthropic_error", detail: err instanceof Error ? err.message : "unknown" },
      { status: 502 }
    );
  }
}

// Tell TS about the Anthropic namespace for narrowing above.
import type Anthropic from "@anthropic-ai/sdk";
