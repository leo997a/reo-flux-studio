import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const output = await replicate.run(
      "black-forest-labs/flux-2-pro",
      {
        input: {
          image: image,
          prompt: "Professional cinematic portrait, high detail, 8k",
          aspect_ratio: "1:1"
        }
      }
    );

    return NextResponse.json({ output: output[0] });
  } catch (error) {
    console.error("REPLICATE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
