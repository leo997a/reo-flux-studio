import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [prompt],
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];
    const image = parts.find((p) => p.inlineData);
    const text = parts.find((p) => p.text)?.text || "";

    if (!image?.inlineData?.data) {
      return NextResponse.json({ error: text || "No image returned" }, { status: 500 });
    }

    return NextResponse.json({
      output: `data:${image.inlineData.mimeType || "image/png"};base64,${image.inlineData.data}`,
      text,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Generation failed" }, { status: 500 });
  }
}
