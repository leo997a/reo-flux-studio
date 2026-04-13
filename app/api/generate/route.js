import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req) {
  try {
    const { image } = await req.json();

    const output = await replicate.run(
      "black-forest-labs/flux-2-pro",
      {
        input: {
          image: image, // سيقبل الموديل صيغة الـ Data URI مباشرة
          prompt: "A high-end professional cinematic portrait, ultra-detailed, sharp focus, 8k resolution, REO fashion style",
          aspect_ratio: "1:1",
          output_format: "png"
        }
      }
    );

    return NextResponse.json({ output: output[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
