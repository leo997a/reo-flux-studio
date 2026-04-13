"use client";

import { useState } from "react";

export default function ReoStudio() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const targetWidth = Math.min(img.width, MAX_WIDTH);
        const scale = targetWidth / img.width;

        canvas.width = targetWidth;
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPreview(dataUrl);
      };

      img.onerror = () => setError("فشل في قراءة الصورة.");
    };

    reader.onerror = () => setError("حدث خطأ أثناء رفع الصورة.");
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!preview || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server Error");

      setResult(data.output);
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 20 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ marginBottom: 20 }}>REO STUDIO</h1>

        <div style={{ border: "2px dashed #333", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", borderRadius: 12, marginBottom: 15 }}
            />
          ) : (
            <p style={{ color: "#aaa", marginBottom: 15 }}>اختر صورة للبدء</p>
          )}

          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !preview}
          style={{
            padding: "14px 28px",
            background: loading || !preview ? "#444" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: loading || !preview ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "جاري التوليد..." : "ابدأ الآن"}
        </button>

        {error && <p style={{ color: "#ff6b6b", marginTop: 16 }}>{error}</p>}

        {result && (
          <img
            src={result}
            alt="Result"
            style={{ width: "100%", marginTop: 20, borderRadius: 12, border: "2px solid #0070f3" }}
          />
        )}
      </div>
    </div>
  );
}
