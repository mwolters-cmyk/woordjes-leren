/**
 * POST /api/mondeling/chat
 *
 * Streaming chat-endpoint voor mondeling-sessies.
 * Body: { boek: Boek, niveau: string, messages: ChatMessage[] }
 * Returns: text/event-stream met delta-tokens
 *
 * Edge Runtime gekozen voor 25s timeout op Vercel-free (vs 10s voor
 * standaard serverless). Anthropic SDK werkt in Edge.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // sec — Vercel Hobby = max 10s, Pro = 60s, Hetzner = unlimited

const MODEL = "claude-sonnet-4-5"; // Sonnet 4.5 voor MVP; later evt. 4.6

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    boek?: Record<string, unknown>;
    niveau?: string;
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    examinatorPrompt?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { boek, niveau = "vwo 5", messages = [], examinatorPrompt } = body;

  if (!boek || !examinatorPrompt) {
    return new Response(
      JSON.stringify({ error: "boek en examinatorPrompt vereist" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Bouw system prompt: replace placeholders met concrete waardes
  const system = examinatorPrompt
    .replaceAll("{{BOEK_JSON}}", JSON.stringify(boek, null, 2))
    .replaceAll("{{LEERLING_NIVEAU}}", niveau)
    .replaceAll("{{BOEK_JSON.titel}}", String(boek.titel ?? ""))
    .replaceAll(
      "{{BOEK_JSON.auteur.naam}}",
      String((boek.auteur as { naam?: string } | undefined)?.naam ?? "")
    );

  const anthropic = new Anthropic({ apiKey });

  // Streaming response — chunks als Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: system,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
          stream: true,
        });

        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`)
            );
          } else if (event.type === "message_stop") {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
