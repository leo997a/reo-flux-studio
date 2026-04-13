import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Missing REPLICATE_API_TOKEN in Vercel environment variables" },
        { status: 500 }
      );
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const output = await replicate.run("black-forest-labs/flux-2-pro", {
      input: {
        prompt: "Professional cinematic portrait, high detail, 8k",
        input_images: [image],
        aspect_ratio: "match_input_image",
      },
    });

    const first = Array.isArray(output) ? output[0] : output;
    const outputUrl =
      typeof first === "string"
        ? first
        : first?.url || (typeof first?.url === "function" ? first.url() : null);

    if (!outputUrl) {
      return NextResponse.json(
        { error: "Model returned no usable output URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ output: outputUrl });
  } catch (error) {
    console.error("REPLICATE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
