const FIXED_PROMPT = `Create a realistic professional studio photograph of the same man from the uploaded image.

Keep the same person generally consistent with the input photo.
Preserve the main facial identity, age, skin tone, hairline, hair texture, beard style, jawline, nose, lips, and eye spacing as much as possible.

Use:
- neutral grey studio background
- black crew-neck shirt
- natural dark sunglasses
- white wired earbuds
- centered tight portrait crop
- realistic studio lighting
- natural skin texture
- photorealistic DSLR look
- neutral expression

Do not stylize.
Do not paint.
Do not illustrate.
Do not beautify.
Do not change ethnicity.
Do not make the face younger.
Do not add extra text or banners inside the image.

Return one realistic image only.`;

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
