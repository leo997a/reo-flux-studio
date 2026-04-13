"use client";
import { useState } from 'react';

export default function ReoStudio() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: image }),
    });
    const data = await res.json();
    setResult(data.output);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center p-10 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">REO FLUX STUDIO</h1>
      <input type="text" placeholder="رابط صورتك هنا" 
             onChange={(e) => setImage(e.target.value)}
             className="p-2 text-black rounded mb-4 w-80" />
      <button onClick={handleGenerate} disabled={loading}
              className="bg-blue-600 px-6 py-2 rounded-full hover:bg-blue-700">
        {loading ? "جاري الإبداع..." : "توليد التصميم"}
      </button>
      {result && <img src={result} className="mt-8 w-96 rounded-lg border-2 border-blue-500" />}
    </div>
  );
}
