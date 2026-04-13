"use client";
export const dynamic = 'force-dynamic';
import { useState } from 'react';

export default function ReoStudio() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // دالة ذكية لضغط الصورة قبل رفعها
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // تصغير العرض لضمان خفة الوزن
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // تحويل الصورة لـ JPEG بضغط 70%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreview(dataUrl);
      };
    };
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server Error");
      setResult(data.output);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
      <h1>REO STUDIO</h1>
      <div style={{ border: '2px dashed #333', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
        {preview && <img src={preview} style={{ width: '100%', borderRadius: '10px' }} />}
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <button onClick={handleGenerate} disabled={loading} style={{ padding: '15px 30px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '10px' }}>
        {loading ? "جاري التوليد..." : "ابدأ الآن"}
      </button>
      {result && <img src={result} style={{ width: '100%', marginTop: '20px', border: '2px solid #0070f3' }} />}
    </div>
  );
}
