import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req) {
  const { imageUrl } = await req.json();

  const output = await replicate.run(
    "black-forest-labs/flux-2-pro",
    {
      input: {
        image: imageUrl,
        prompt: "A professional cinematic portrait, high resolution, REO style",
        aspect_ratio: "1:1"
      }
    }
  );

  return NextResponse.json({ output: output[0] });
}
