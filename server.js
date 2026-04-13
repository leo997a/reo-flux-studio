import express from "express";
import multer from "multer";
import { GoogleGenAI, Modality } from "@google/genai";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 7 * 1024 * 1024 },
});

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global";

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT,
  location: LOCATION,
});

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, project: PROJECT, location: LOCATION });
});

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No image uploaded" });
    }

    const prompt = [
      "Edit this uploaded portrait into a photorealistic close studio sports portrait.",
      "Preserve the exact same man and identity.",
      "Keep exact face shape, skin tone, age cues, hairstyle, hairline, hair color, eyebrows, eyes, nose, lips, jawline, chin, and facial-hair status.",
      "Change only the setup to: neutral grey studio background, black crew-neck shirt, tight centered crop, soft studio lighting, neutral expression.",
      "Add dark wayfarer-style sunglasses, white wired earbuds, and a clean lower-third TV graphic.",
      'Keep the lower-third text exactly as: UCL QUARTERFINALS / FC Barcelona has never beaten Atletico Madrid in UCL over 2 legs.',
      "Do not beautify. Do not change age, ethnicity, or facial structure."
    ].join(" ");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: req.file.buffer.toString("base64"),
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

    if (!imagePart) {
      return res.status(500).json({
        ok: false,
        error: "No image returned from Vertex AI",
        parts,
      });
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const dataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;

    return res.json({
      ok: true,
      image: dataUrl,
    });
  } catch (error) {
    console.error("generate failed:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
