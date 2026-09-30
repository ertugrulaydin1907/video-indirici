export async function POST(req) {
  try {
    const body = await req.json();
    const base = process.env.WORKER_URL;
    if (!base) return Response.json({ error: 'WORKER_URL yapılandırılmamış.' }, { status: 500 });
    const r = await fetch(base + '/info', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const contentType = r.headers.get('content-type') || '';
    const raw = await r.text();
    if (contentType.includes('application/json')) return new Response(raw, { status: r.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
    const details = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    return Response.json({ error: 'İndirme sunucusu JSON yerine farklı bir cevap döndürdü (HTTP ' + r.status + ').', details }, { status: 502 });
  } catch (e) {
    return Response.json({ error: 'Sunucuya ulaşılamadı: ' + (e?.message || 'bilinmeyen hata') }, { status: 502 });
  }
}