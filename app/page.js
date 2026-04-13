const handleGenerate = async () => {
    if (!preview) return alert("الرجاء اختيار صورة أولاً");
    setLoading(true);
    setResult(null); // مسح النتيجة السابقة

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      });

      const data = await res.json();

      if (!res.ok) {
        // إذا كان هناك خطأ من السيرفر، أظهره هنا
        throw new Error(data.error || "حدث خطأ في الخادم");
      }

      setResult(data.output);
    } catch (error) {
      console.error("Error details:", error);
      alert("فشل التوليد: " + error.message);
    } finally {
      setLoading(false);
    }
  };
