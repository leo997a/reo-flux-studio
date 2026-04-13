import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FIXED_PROMPT = `Use exactly 1 uploaded image: IDENTITY.

IDENTITY is the only person reference.

Create one final ultra-realistic studio sports portrait of the exact same man from IDENTITY. Preserve his exact identity with no deviation. Keep the exact face shape, skin tone, age cues, forehead, hairline, hairstyle, hair texture, hair color, eyebrows, eye spacing, nose, lips, cheek structure, jawline, chin, beard/stubble or clean-shaven status, and overall male proportions.

Apply this fixed studio setup:
- neutral grey studio background
- black crew-neck shirt
- dark wayfarer-style sunglasses
- white wired earbuds
- tight centered crop
- centered symmetrical composition
- studio sports-broadcast lighting
- ultra-realistic skin texture
- neutral expression
- photorealistic detail

Critical rules:
- No face blend.
- No identity drift.
- Do not beautify.
- Do not make him younger or older.
- Do not change ethnicity.
- Do not change facial structure.
- Do not alter beard/stubble status.
- Keep realistic skin texture.
- Keep the sunglasses and wired earbuds natural and cleanly integrated.

Do not add captions, banners, lower-thirds, logos, or any text in the generated image.

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

    const cfForm = new FormData();
    cfForm.append("prompt", FIXED_PROMPT);
    cfForm.append("steps", "24");
    cfForm.append("guidance", "4.5");
    cfForm.append("seed", "334455");
    cfForm.append("width", "1024");
    cfForm.append("height", "1024");

    cfForm.append(
      "input_image_0",
      new Blob([await identity.arrayBuffer()], {
        type: identity.type || "image/jpeg",
      }),
      identity.name || "identity.jpg"
    );

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        },
        body: cfForm,
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
