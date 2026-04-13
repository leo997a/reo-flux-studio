"use client";
import { useState } from "react";

const T1="UCL QUARTERFINALS";
const T2="FC Barcelona has never beaten Atletico Madrid in UCL over 2 legs";

async function prep(file,s=480){
  const u=await new Promise((r,j)=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=j;f.readAsDataURL(file);});
  const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=u;});
  const w=img.width,h=img.height;
  const c=Math.round(Math.min(w*.74,h*.52,Math.min(w,h)*.78));
  const x=Math.max(0,Math.min(w-c,Math.round((w-c)/2)));
  const y=Math.max(0,Math.min(h-c,Math.round(h*.14)));
  const cv=document.createElement("canvas"); cv.width=s; cv.height=s;
  const ctx=cv.getContext("2d"); ctx.drawImage(img,x,y,c,c,0,0,s,s);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.96));
  return {blob,preview:URL.createObjectURL(blob)};
}

export default function ReoStudio(){
  const [img,setImg]=useState(null),[preview,setPreview]=useState(""),[out,setOut]=useState(""),[err,setErr]=useState(""),[load,setLoad]=useState(false);

  const pick=async e=>{
    const f=e.target.files?.[0]; if(!f) return;
    try{ setErr(""); setOut(""); const p=await prep(f,480); setImg(p.blob); setPreview(p.preview); }
    catch{ setErr("فشل في تجهيز الصورة."); }
  };

  const gen=async ()=>{
    if(!img||load) return;
    setLoad(true); setErr(""); setOut("");
    try{
      const fd=new FormData(); fd.append("identity",img,"identity.jpg");
      const r=await fetch("/api/generate",{method:"POST",body:fd});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Server Error");
      setOut(d.output);
    }catch(e){ setErr(e.message||"حدث خطأ"); } finally{ setLoad(false); }
  };

  return <div dir="rtl" style={{minHeight:"100vh",background:"#000",color:"#fff",padding:20}}>
    <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
      <h1>REO STUDIO</h1>
      <div style={{border:"1px solid #333",padding:16,borderRadius:14}}>
        <h3>ارفع صورة الشخص فقط</h3>
        {preview&&<img src={preview} alt="" style={{width:"100%",maxWidth:320,borderRadius:12,margin:"0 auto 12px",display:"block"}}/>}
        <input type="file" accept="image/*" onChange={pick}/>
      </div>
      <button onClick={gen} disabled={load||!img} style={{marginTop:20,padding:"14px 28px",border:0,borderRadius:10,background:load||!img?"#444":"#0070f3",color:"#fff"}}>
        {load?"جاري التوليد...":"ولّد الصورة"}
      </button>
      {err&&<p style={{color:"#ff6b6b",marginTop:16,whiteSpace:"pre-wrap"}}>{err}</p>}
      {out&&<div style={{position:"relative",marginTop:24,borderRadius:16,overflow:"hidden",border:"1px solid #333"}}>
        <img src={out} alt="" style={{width:"100%",display:"block"}}/>
        <div style={{position:"absolute",left:"50%",bottom:"8%",transform:"translateX(-50%)",width:"82%"}}>
          <div style={{background:"#b9def7",color:"#000",fontWeight:900,fontSize:"clamp(20px,4vw,34px)",padding:"12px 16px",width:"78%",margin:"0 auto"}}>{T1}</div>
          <div style={{background:"#f2f2f2",color:"#000",fontWeight:700,fontSize:"clamp(11px,2vw,18px)",padding:"10px 14px"}}>{T2}</div>
        </div>
      </div>}
    </div>
  </div>;
}
