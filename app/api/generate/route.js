import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FIXED_PROMPT = `Create an ultra-realistic studio sports portrait based on the uploaded person.

Keep the same person generally consistent with the input photo.
Preserve the main facial characteristics as much as possible.

Apply this setup:
- neutral grey studio background
- black crew-neck shirt
- dark wayfarer-style sunglasses
- white wired earbuds
- tight centered crop
- symmetrical sports-broadcast composition
- realistic skin texture
- neutral expression
- photorealistic detail

Do not add captions, banners, logos, or any text inside the generated image.
Return one final image only.`;

export async function POST(req) {
  try {
    if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
      return NextResponse.json(
        { error: "Missing CF_ACCOUNT_ID or CF_API_TOKEN" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const identity = form.get("identity");

    if (!(identity instanceof File)) {
      return NextResponse.json(
        { error: "Identity image is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await identity.arrayBuffer());
    const image_b64 = buffer.toString("base64");

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: FIXED_PROMPT,
          negative_prompt:
            "text, captions, banner, logo, watermark, extra person, deformed face, distorted eyes, blurry, low quality, cartoon, illustration",
          image_b64,
          width: 768,
          height: 768,
          num_steps: 20,
          strength: 0.35,
          guidance: 6.5,
          seed: 334455,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Cloudflare generation failed" },
        { status: 500 }
      );
    }

    const bytes = Buffer.from(await res.arrayBuffer());
    return NextResponse.json({
      output: `data:image/png;base64,${bytes.toString("base64")}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
