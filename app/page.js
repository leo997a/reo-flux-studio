"use client";

import { useState } from "react";

export default function ReoStudio() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
    <div dir="rtl" style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 20 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h1>REO STUDIO</h1>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب وصف الصورة..."
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            borderRadius: 12,
            marginTop: 20,
            marginBottom: 20,
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: "14px 28px",
            border: "none",
            borderRadius: 10,
            background: loading ? "#444" : "#0070f3",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "جاري التوليد..." : "ولّد الصورة"}
        </button>

        {error && <p style={{ color: "#ff6b6b", marginTop: 16 }}>{error}</p>}

        {result && (
          <img
            src={result}
            alt="Generated"
            style={{ width: "100%", marginTop: 20, borderRadius: 12 }}
          />
        )}
      </div>
    </div>
  );
}
