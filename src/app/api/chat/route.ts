import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export const runtime = "edge";

// Choose provider by env, default OpenAI.
function getModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "google") {
    return google("gemini-1.5-pro-latest");
  }
  return openai("gpt-4o-mini");
}

export async function POST(req: NextRequest) {
    const { messages } = await req.json();
    const last = messages?.[messages.length - 1]?.content ?? "";

    // TEMP DEBUG: if user types exactly "ping", just echo back
    if (last === "ping") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
        controller.enqueue(encoder.encode("pong"));
        controller.close();
        },
    });
    // If the user sends "diag", test a non-streaming call and return plain text
    if (last === "diag") {
        try {
            const out = await generateText({
            model: getModel(),
            prompt: "Reply with 'hello' only.",
            });
            return new Response(out.text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        } catch (e: any) {
            const msg = e?.message || "Unknown model error";
            return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
            });
        }
    }

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

  const result = await streamText({
    model: getModel(),
    messages, // [{ role: "user" | "assistant" | "system", content: "..." }]
    temperature: 0.2,
  });

  // This returns the exact streaming format that `useChat` expects.
  return result.toTextStreamResponse();
}
