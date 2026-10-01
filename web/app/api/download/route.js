export async function POST(req) {
  try {
    const body = await req.json();
    const base = process.env.WORKER_URL;
    if (!base) return Response.json({ error: 'WORKER_URL yapılandırılmamış.' }, { status: 500 });
    const r = await fetch(base + '/download', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const contentType = r.headers.get('content-type') || '';
    if (!r.ok) {
      const raw = await r.text();
      if (contentType.includes('application/json')) {
        try { const parsed = JSON.parse(raw); return Response.json({ error: parsed.error || parsed.detail || 'İndirme başarısız.' }, { status: r.status }); } catch {}
      }
      return Response.json({ error: 'İndirme sunucusu HTTP ' + r.status + ' döndürdü.', details: raw.slice(0, 300) }, { status: r.status });
    }
    return new Response(r.body, { status: r.status, headers: { 'content-type': contentType || 'application/octet-stream', 'content-disposition': r.headers.get('content-disposition') || 'attachment' } });
  } catch (e) {
    return Response.json({ error: 'İndirme sunucusuna ulaşılamadı: ' + (e?.message || 'bağlantı hatası') }, { status: 502 });
  }
}