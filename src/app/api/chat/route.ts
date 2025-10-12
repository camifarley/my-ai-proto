import { NextRequest } from "next/server";
import { streamText } from "ai";
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
