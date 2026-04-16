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

function buildPrompt(customPrompt = "") {
  return (customPrompt && customPrompt.trim()) || `Use the uploaded image as the only identity reference and preserve the exact same person with no deviation: same face shape, skin tone, age cues, forehead, eyebrows, eyes, nose, lips, ears, hair or baldness status, beard or clean-shaven status, and the same overall facial proportions. Do not beautify, do not make the person younger or older, do not change ethnicity, and do not alter facial structure.

Create one ultra-realistic cinematic sports portrait from the chest up, perfectly centered and symmetrical. The person must be fully dressed in a modern plain black crew-neck T-shirt with short sleeves, modest, clean, premium, and natural for both men and women. No bare chest, no open collar, no missing clothing, no jersey, and no accessories.

Lock the pose exactly: both hands pressed flat over the heart area in a natural, believable, anatomically correct way, with normal fingers and realistic hand proportions. Keep the body facing forward.

Lock the facial expression exactly: silent heartbreak with dignity. No crying, no tears, no watery eyes, no grimacing, no mouth distortion, no shouting, no anger, no exaggerated sadness, no dramatic suffering. Keep the mouth closed, the jaw calm, the gaze direct, heavy, and emotionally controlled. The feeling must be wounded, proud, loyal, and restrained.

The visual concept is the bloodline of loyalty: elegant red-and-blue glowing energy flows emerging from the heart area and spreading naturally across the black shirt, chest, arms, and hands like illuminated inner veins. Over the heart, create one refined glowing football-club-style emblem made of light only, semi-transparent and partially see-through, softly blended into the shirt and the red-and-blue energy, clearly visible but not fully solid or opaque, as if it is glowing from within the chest rather than pasted on top. Keep it symbolic, premium, subtle, believable, and not oversized.

Use a minimal dark background with a deep rich red tone. Apply dramatic cinematic chiaroscuro lighting, strong contrast, subtle rim light, realistic skin texture, and sharp editorial sports-poster quality.

No text, no typography, no crowd, no stadium, no extra objects, no fake tears, no distorted hands, no warped fingers, no smile, no crying face, and no identity drift.

Return one final image only.`;
}

async function gen(buf, mime, customPrompt = "") {
  const r = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: buf.toString("base64") } }, { text: buildPrompt(customPrompt) }] }],
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
    const x = await gen(req.file.buffer, req.file.mimetype, req.body?.prompt || "");
    res.json({ ok: true, image: x.url, mimeType: x.mime });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

async function h(req, res) {
  try {
    let buf, mime;
    if (req.file) { buf = req.file.buffer; mime = req.file.mimetype; }
    else if (req.body?.image_url) { const d = await dl(req.body.image_url); buf = d.buf; mime = d.mime; }
    else return res.status(400).json({ ok: false, error: "Need image or image_url" });

    const x = await gen(buf, mime, req.body?.prompt || "");
    res.json({ ok: true, image: x.url, image_base64: x.b64, image_mime_type: x.mime });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

app.post("/generate-api", up.single("image"), h);
app.post("/webhook-direct", up.single("image"), h);

app.listen(process.env.PORT || 8080, "0.0.0.0", () => console.log("RUNNING"));
