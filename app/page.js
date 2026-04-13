"use client";
import { useState } from "react";

export default function ReoStudio() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server Error");
      setResult(data.output);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return <div dir="rtl" style={{padding:20}}>
    <h1>REO STUDIO</h1>
    <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} />
    <button onClick={run} disabled={loading || !prompt.trim()}>{loading ? "جاري..." : "ولّد"}</button>
    {error && <p>{error}</p>}
    {result && <img src={result} alt="generated" style={{maxWidth:"100%"}} />}
  </div>;
}
