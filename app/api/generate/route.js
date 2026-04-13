import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

export const runtime = "nodejs";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await openrouter.chat.send({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      modalities: ["image", "text"],
    });

    const message = result?.choices?.[0]?.message;
    const imageUrl = message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      output: imageUrl,
      text: message?.content || "",
    });
  } catch (error) {
    console.error("OPENROUTER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
