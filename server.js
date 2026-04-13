import express from "express";
import multer from "multer";
import { GoogleGenAI, Modality } from "@google/genai";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global";

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT,
  location: LOCATION,
});

function buildPrompt(customPrompt) {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt.trim();
  }

  return [
    "Edit this uploaded portrait into a photorealistic close studio sports portrait.",
    "Preserve the exact same man and identity.",
    "Keep exact face shape, skin tone, age cues, hairstyle, hairline, hair color, eyebrows, eyes, nose, lips, jawline, chin, and facial-hair status.",
    "Change only the setup to: neutral grey studio background, black crew-neck shirt, tight centered crop, soft studio lighting, neutral expression.",
    "Add dark wayfarer-style sunglasses, white wired earbuds, and a clean lower-third TV graphic.",
    'Keep the lower-third text exactly as: UCL QUARTERFINALS / FC Barcelona has never beaten Atletico Madrid in UCL over 2 legs.',
    "Do not beautify. Do not change age, ethnicity, or facial structure."
  ].join(" ");
}

async function generateImageFromBuffer(buffer, mimeType, customPrompt = "") {
  const prompt = buildPrompt(customPrompt);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: buffer.toString("base64"),
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const textPart = parts.find((p) => typeof p.text === "string");

  if (!imagePart) {
    throw new Error(
      `No image returned from Vertex AI. Parts: ${JSON.stringify(parts)}`
    );
  }

  const outputMimeType = imagePart.inlineData.mimeType || "image/png";
  const base64 = imagePart.inlineData.data;
  const dataUrl = `data:${outputMimeType};base64,${base64}`;

  return {
    imageBase64: base64,
    imageMimeType: outputMimeType,
    imageDataUrl: dataUrl,
    modelText: textPart?.text || "",
  };
}

async function fetchImageAsBuffer(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download image URL: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: contentType,
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    project: PROJECT,
    location: LOCATION,
  });
});

/**
 * المسار الحالي للواجهة الخارجية
 * يستقبل صورة من الفورم ويرجع data URL للمتصفح
 */
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "No image uploaded",
      });
    }

    const result = await generateImageFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.body?.prompt || ""
    );

    return res.json({
      ok: true,
      image: result.imageDataUrl,
      mimeType: result.imageMimeType,
      text: result.modelText,
    });
  } catch (error) {
    console.error("POST /generate failed:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
});

/**
 * المسار الجديد للتجربة المباشرة
 * يدعم طريقتين:
 * 1) multipart/form-data مع image
 * 2) JSON فيه image_url
 */
app.post("/generate-api", upload.single("image"), async (req, res) => {
  try {
    let buffer;
    let mimeType;

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body?.image_url) {
      const downloaded = await fetchImageAsBuffer(req.body.image_url);
      buffer = downloaded.buffer;
      mimeType = downloaded.mimeType;
    } else {
      return res.status(400).json({
        ok: false,
        error: "Provide either multipart image or image_url",
      });
    }

    const result = await generateImageFromBuffer(
      buffer,
      mimeType,
      req.body?.prompt || ""
    );

    return res.json({
      ok: true,
      image: result.imageDataUrl,
      image_base64: result.imageBase64,
      image_mime_type: result.imageMimeType,
      text: result.modelText,
    });
  } catch (error) {
    console.error("POST /generate-api failed:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`REO Server running on port ${port}`);
});
