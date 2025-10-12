import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    AI_PROVIDER: process.env.AI_PROVIDER || "Not set",
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasGeminiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
}
