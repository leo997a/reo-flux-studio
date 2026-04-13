"use client";

import { useState } from "react";

async function resizeImage(file, maxSide = 900) {
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

  const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );

  return blob;
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

      const resized = await resizeImage(file, 900);
      const preview = URL.createObjectURL(resized);

      setIdentityBlob(resized);
      setIdentityPreview(preview);
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
      if (!res.ok) throw new Error(data.error || "Server Error");

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
      style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 20 }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ marginBottom: 20 }}>REO STUDIO</h1>

        <div style={{ border: "1px solid #333", padding: 16, borderRadius: 14 }}>
          <h3>ارفع صورة الشخص فقط</h3>
          {identityPreview && (
            <img
              src={identityPreview}
              alt="identity"
              style={{ width: "100%", borderRadius: 12, marginBottom: 12 }}
            />
          )}
          <input type="file" accept="image/*" onChange={handlePick} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !identityBlob}
          style={{
            marginTop: 20,
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

        {error && <p style={{ color: "#ff6b6b", marginTop: 16 }}>{error}</p>}

        {result && (
          <img
            src={result}
            alt="Generated"
            style={{
              width: "100%",
              marginTop: 20,
              borderRadius: 12,
              border: "1px solid #333",
            }}
          />
        )}
      </div>
    </div>
  );
}
