"use client";

import { useState } from "react";

const TOP_LINE = "UCL QUARTERFINALS";
const BOTTOM_LINE =
  "FC Barcelona has never beaten Atletico Madrid in UCL over 2 legs";

async function prepareIdentityImage(file, outputSize = 480) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const w = img.width;
  const h = img.height;

  const cropSize = Math.round(Math.min(w * 0.74, h * 0.52, Math.min(w, h) * 0.78));
  const cropX = Math.max(0, Math.min(w - cropSize, Math.round((w - cropSize) / 2)));
  const cropY = Math.max(0, Math.min(h - cropSize, Math.round(h * 0.14)));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    outputSize,
    outputSize
  );

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.96)
  );

  return {
    blob,
    preview: URL.createObjectURL(blob),
  };
}

export default function ReoStudio() {
  const [identityBlob, setIdentityBlob] = useState(null);
  const [identityPreview, setIdentityPreview] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setResult("");

      const prepared = await prepareIdentityImage(file, 480);
      setIdentityBlob(prepared.blob);
      setIdentityPreview(prepared.preview);
    } catch {
      setError("فشل في تجهيز الصورة.");
    }
  };

  const handleGenerate = async () => {
    if (!identityBlob || loading) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const form = new FormData();
      form.append("identity", identityBlob, "identity.jpg");

      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server Error");
      }

      setResult(data.output);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ marginBottom: 20 }}>REO STUDIO</h1>

        <div
          style={{
            border: "1px solid #333",
            padding: 16,
            borderRadius: 14,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginBottom: 12 }}>ارفع صورة الشخص فقط</h3>

          {identityPreview && (
            <img
              src={identityPreview}
              alt="identity preview"
              style={{
                width: "100%",
                maxWidth: 320,
                borderRadius: 12,
                margin: "0 auto 12px",
                display: "block",
                border: "1px solid #333",
              }}
            />
          )}

          <input type="file" accept="image/*" onChange={handlePick} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !identityBlob}
          style={{
            padding: "14px 28px",
            border: "none",
            borderRadius: 10,
            background: loading || !identityBlob ? "#444" : "#0070f3",
            color: "#fff",
            cursor: loading || !identityBlob ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "جاري التوليد..." : "ولّد الصورة"}
        </button>

        {error && (
          <p style={{ color: "#ff6b6b", marginTop: 16, whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}

        {result && (
          <div
            style={{
              position: "relative",
              width: "100%",
              marginTop: 24,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #333",
              background: "#111",
            }}
          >
            <img
              src={result}
              alt="Generated"
              style={{
                display: "block",
                width: "100%",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "8%",
                transform: "translateX(-50%)",
                width: "82%",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "#b9def7",
                  color: "#000",
                  fontWeight: 900,
                  fontSize: "clamp(20px, 4vw, 34px)",
                  lineHeight: 1,
                  padding: "12px 16px",
                  textAlign: "center",
                  width: "78%",
                  margin: "0 auto 0 auto",
                  boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
                }}
              >
                {TOP_LINE}
              </div>

              <div
                style={{
                  background: "#f2f2f2",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "clamp(11px, 2vw, 18px)",
                  lineHeight: 1.15,
                  padding: "10px 14px",
                  textAlign: "center",
                  marginTop: 0,
                  boxShadow: "0 3px 0 rgba(0,0,0,0.18)",
                }}
              >
                {BOTTOM_LINE}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
