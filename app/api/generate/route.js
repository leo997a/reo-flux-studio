import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FIXED_PROMPT = `Use exactly 2 uploaded images: TEMPLATE and IDENTITY.

TEMPLATE is for setup only. IDENTITY is for the person only.

Create one final ultra-realistic studio sports portrait. Copy from TEMPLATE only the non-identity setup: neutral grey studio background, black crew-neck shirt, dark wayfarer-style sunglasses, white wired earbuds, tight centered crop, camera distance, head placement, studio lighting style, and the lower-third TV graphic design and placement.

Copy from IDENTITY only the exact man: preserve his exact identity with no deviation. Keep the exact face shape, skin tone, age cues, forehead, hairline, hairstyle, hair texture, hair color, eyebrows, eye spacing, nose, lips, cheek structure, jawline, chin, beard/stubble or clean-shaven status, and overall male proportions. The final person must clearly be the man from IDENTITY, not the man from TEMPLATE.

Critical rules:
- No face blend.
- No template identity leakage.
- No Messi-like or template-like resemblance.
- Do not beautify.
- Do not make him younger or older.
- Do not change ethnicity.
- Do not change facial structure.
- Do not alter beard/stubble status.
- Keep a neutral expression.
- Keep realistic skin texture and photorealistic detail.
- Keep the sunglasses and wired earbuds natural and cleanly integrated.
- Keep the portrait symmetrical, centered, and tightly cropped.

The lower-third graphic must remain exactly as in TEMPLATE, with the exact same wording, capitalization, layout, and line breaks. Do not rewrite, paraphrase, shorten, translate, restyle, or censor any text.

Required lower-third text:
Top line: "UCL QUARTERFINALS"
Bottom line: "FC Barcelona has never beaten Atletico Madrid in UCL over 2 legs"

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
    const template = form.get("template");
    const identity = form.get("identity");

    if (!(template instanceof File) || !(identity instanceof File)) {
      return NextResponse.json(
        { error: "Both TEMPLATE and IDENTITY images are required" },
        { status: 400 }
      );
    }

    const cfForm = new FormData();
    cfForm.append("prompt", FIXED_PROMPT);
    cfForm.append("steps", "20");
    cfForm.append("guidance", "4");
    cfForm.append("width", "1024");
    cfForm.append("height", "1024");

    cfForm.append(
      "input_image_0",
      new Blob([await template.arrayBuffer()], { type: template.type || "image/jpeg" }),
      template.name || "template.jpg"
    );

    cfForm.append(
      "input_image_1",
      new Blob([await identity.arrayBuffer()], { type: identity.type || "image/jpeg" }),
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
