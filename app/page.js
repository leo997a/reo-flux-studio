"use client";
import { useState } from 'react';

export default function ReoStudio() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // دالة لتحويل الصورة المرفوعة إلى نص (Base64) لإرسالها للـ API
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!preview) return alert("الرجاء اختيار صورة أولاً");
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      });
      const data = await res.json();
      setResult(data.output);
    } catch (error) {
      alert("حدث خطأ أثناء التوليد");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 font-sans">
      <div className="w-full max-w-md space-y-8 text-center">
        <header>
          <h1 className="text-4xl font-black tracking-tighter text-blue-500">REO STUDIO</h1>
          <p className="text-zinc-400 mt-2">اصنع تصميمك الاحترافي بضغطة واحدة</p>
        </header>

        <main className="space-y-6">
          {/* منطقة الرفع */}
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-zinc-700 rounded-3xl p-8 transition-all group-hover:border-blue-500 bg-zinc-900/50">
              {preview ? (
                <img src={preview} className="w-full h-64 object-cover rounded-2xl" alt="Preview" />
              ) : (
                <div className="py-10">
                  <span className="text-5xl">📸</span>
                  <p className="mt-4 text-sm text-zinc-500">اضغط لرفع صورة من الاستوديو</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading || !preview}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all ${
              loading ? "bg-zinc-800" : "bg-blue-600 hover:bg-blue-500 active:scale-95"
            }`}
          >
            {loading ? "جاري المعالجة... (قد يستغرق 30 ثانية)" : "توليد التصميم السحري"}
          </button>

          {/* النتيجة */}
          {result && (
            <div className="space-y-4 animate-in fade-in zoom-in duration-500">
              <h2 className="text-xl font-bold text-green-400">تصميمك جاهز!</h2>
              <img src={result} className="w-full rounded-3xl border-4 border-blue-600 shadow-2xl" alt="Result" />
              <a 
                href={result} 
                download="reo-design.png"
                className="block w-full py-3 bg-zinc-100 text-black rounded-xl font-bold"
              >
                حفظ الصورة في الموبايل
              </a>
            </div>
          )}
        </main>

        <footer className="text-zinc-600 text-xs">
          Powered by REO & Flux-2-Pro
        </footer>
      </div>
    </div>
  );
}
