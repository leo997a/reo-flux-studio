import express from "express";
import multer from "multer";
import { GoogleGenAI, Modality } from "@google/genai";

const app = express();
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || "global"
});

const prompt = 'Edit this portrait into a photorealistic studio sports portrait. Keep exact identity, face, hair, beard and skin tone. Grey background, black shirt, dark wayfarer sunglasses, white wired earbuds.';

async function gen(buf, m) {
  const r = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: m, data: buf.toString("base64") } }, { text: prompt }] }],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] }
  });
  const p = r?.candidates?.[0]?.content?.parts || [];
  const i = p.find(x => x.inlineData?.data);
  if (!i) throw new Error("No image returned");
  const t = i.inlineData.mimeType || "image/png";
  const b = i.inlineData.data;
  return { url: `data:${t};base64,${b}`, b64: b, mime: t };
}

async function dl(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Download failed ${r.status}`);
  return { buf: Buffer.from(await r.arrayBuffer()), mime: r.headers.get("content-type") || "image/jpeg" };
}

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/generate", up.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No image" });
    const x = await gen(req.file.buffer, req.file.mimetype);
    res.json({ ok: true, image: x.url, mimeType: x.mime });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

async function h(req, res) {
  try {
    let buf, mime;
    if (req.file) {
      buf = req.file.buffer;
      mime = req.file.mimetype;
    } else if (req.body?.image_url) {
      const d = await dl(req.body.image_url);
      buf = d.buf;
      mime = d.mime;
    } else {
      return res.status(400).json({ ok: false, error: "Need image or image_url" });
    }
    const x = await gen(buf, mime);
    res.json({ ok: true, image: x.url, image_base64: x.b64, image_mime_type: x.mime });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

app.post("/generate-api", up.single("image"), h);
app.post("/webhook-direct", up.single("image"), h);

app.listen(process.env.PORT || 8080, "0.0.0.0", () => console.log("RUNNING"));
