'use client';
import { useState } from 'react';

const qualities = [['best','En yüksek kalite'],['1440','1440p · 2K'],['1080','1080p · Full HD'],['720','720p · HD'],['480','480p'],['360','360p'],['audio','Sadece ses']];

async function readApiResponse(response) {
  const text = await response.text();
  const type = response.headers.get('content-type') || '';
  if (!text) throw new Error('Sunucu boş cevap verdi (HTTP ' + response.status + ').');
  if (!type.includes('application/json')) {
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error('Sunucu JSON yerine farklı bir cevap döndürdü (HTTP ' + response.status + '). ' + cleaned.slice(0, 180));
  }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Sunucudan geçersiz JSON geldi (HTTP ' + response.status + ').'); }
  if (!response.ok) throw new Error(data.error || 'İstek başarısız (HTTP ' + response.status + ').');
  return data;
}

export default function Home() {
  const [url,setUrl]=useState(''); const [quality,setQuality]=useState('1440'); const [info,setInfo]=useState(null); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [progress,setProgress]=useState(0);
  async function inspect(){
    setError(''); setInfo(null);
    if(!url.trim()) return setError('Önce video bağlantısını girin.');
    setBusy(true);
    try {
      const r=await fetch('/api/info',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:url.trim()}),cache:'no-store'});
      setInfo(await readApiResponse(r));
    } catch(e) { setError(e?.message || 'Video bilgisi alınamadı.'); } finally { setBusy(false); }
  }
  async function download(){
    setError(''); setBusy(true); setProgress(8);
    try {
      const r=await fetch('/api/download',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:url.trim(),quality}),cache:'no-store'});
      if(!r.ok){
        const text=await r.text(); let message='';
        try { const d=JSON.parse(text); message=d.error||''; } catch { message=text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,180); }
        throw new Error(message || 'İndirme başarısız (HTTP ' + r.status + ').');
      }
      const blob=await r.blob();
      if(!blob.size) throw new Error('Sunucu boş dosya döndürdü.');
      const cd=r.headers.get('content-disposition')||''; const m=cd.match(/filename="?([^";]+)"?/i); const name=m?m[1]:'video.mp4';
      const a=document.createElement('a'); const objectUrl=URL.createObjectURL(blob); a.href=objectUrl; a.download=name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objectUrl); setProgress(100);
    } catch(e) { setError(e?.message || 'İndirme başarısız.'); } finally { setBusy(false); }
  }
  return <main><div className="shell"><div className="brand"><span>▶</span><div><b>Video İndirici</b><small>PC · Mobil · 2K</small></div></div><section className="hero"><div className="badge">MP4 • 1440p / 2K</div><h1>Videonu seç,<br/><em>kaliteyi sen belirle.</em></h1><p>Yetkili olduğun içerikleri mobil veya bilgisayardan kolayca MP4 olarak indir.</p></section><section className="card"><label>Video bağlantısı</label><div className="urlrow"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="YouTube video bağlantısını yapıştır…" inputMode="url"/><button className="secondary" onClick={inspect} disabled={busy}>{busy?'Kontrol…':'Kontrol Et'}</button></div><div className="controls"><div><label>Kalite</label><select value={quality} onChange={e=>setQuality(e.target.value)}>{qualities.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></div><button className="primary" onClick={download} disabled={busy||!url.trim()}>{busy?'Hazırlanıyor…':'Videoyu İndir ↓'}</button></div>{info&&<div className="info"><img src={info.thumbnail} alt=""/><div><strong>{info.title}</strong><span>{info.duration||''}{info.has1440?' · 1440p mevcut':''}</span></div></div>}{busy&&<div className="progress"><div style={{width:(progress||8)+'%'}}/></div>}{error&&<div className="error">{error}</div>}<p className="note">Bu araç yalnızca indirme hakkınız bulunan içerikler için kullanılmalıdır.</p></section><footer>Video İndirici · Mobil ve masaüstü uyumlu</footer></div></main>;
}