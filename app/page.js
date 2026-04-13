"use client";
export const dynamic = 'force-dynamic'; // حل مشكلة Prerendering

import { useState } from 'react';

export default function ReoStudio() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // دالة اختيار الصورة وضغطها مبدئياً
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("الصورة كبيرة جداً، يرجى اختيار صورة أقل من 4 ميجابايت");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!preview) return alert("الرجاء اختيار صورة أولاً");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل السيرفر في المعالجة");
      
      setResult(data.output);
    } catch (error) {
      alert("حدث خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{
      backgroundColor: '#09090b',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', marginBottom: '10px' }}>REO STUDIO</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>ارفع صورتك واحصل على تصميم ذكاء اصطناعي</p>

        <div style={{
          border: '2px dashed #27272a',
          borderRadius: '20px',
          padding: '20px',
          backgroundColor: '#18181b',
          marginBottom: '20px',
          position: 'relative'
        }}>
          {preview ? (
            <img src={preview} style={{ width: '100%', borderRadius: '15px' }} alt="Preview" />
          ) : (
            <div style={{ padding: '40px 0' }}>
              <span style={{ fontSize: '3rem' }}>📸</span>
              <p>اضغط هنا لرفع صورة</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer'
            }}
          />
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={loading || !preview}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '15px',
            backgroundColor: loading ? '#27272a' : '#2563eb',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: 'pointer'
          }}
        >
          {loading ? "جاري التوليد... انتظر ثواني" : "ابدأ السحر"}
        </button>

        {result && (
          <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: '#4ade80', marginBottom: '15px' }}>النتيجة مذهلة!</h2>
            <img src={result} style={{ width: '100%', borderRadius: '20px', border: '3px solid #3b82f6' }} alt="Result" />
            <a 
              href={result} 
              target="_blank"
              download="reo-ai.png"
              style={{
                display: 'block',
                marginTop: '15px',
                padding: '12px',
                backgroundColor: 'white',
                color: 'black',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              حفظ في الموبايل
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
