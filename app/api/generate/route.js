import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
      return NextResponse.json(
        { error: "Missing CF_ACCOUNT_ID or CF_API_TOKEN" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: 4,
          seed: Math.floor(Math.random() * 1000000),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data?.result?.image) {
      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.message ||
            data?.result?.description ||
            "Cloudflare generation failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      output: `data:image/jpeg;base64,${data.result.image}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
