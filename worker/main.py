import re, tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="Video Downloader Worker")

@app.get("/health")
def health():
    return {"ok": True, "service": "video-indirici-worker"}

class Req(BaseModel):
    url: str

class DownloadReq(Req):
    quality: str = "1440"

def validate(url: str):
    if not re.match(r"^https?://(www\.)?(youtube\.com|youtu\.be)/", url):
        raise HTTPException(400, "Şimdilik yalnızca YouTube bağlantıları destekleniyor.")

def opts():
    return {"quiet": True, "no_warnings": True, "noplaylist": True, "restrictfilenames": True}

@app.post("/info")
def info(req: Req):
    validate(req.url)
    try:
        with yt_dlp.YoutubeDL(opts()) as y:
            d = y.extract_info(req.url, download=False)
        formats = d.get("formats") or []
        has1440 = any((f.get("height") or 0) >= 1440 and f.get("vcodec") != "none" for f in formats)
        return {"title": d.get("title"), "thumbnail": d.get("thumbnail"), "duration": d.get("duration_string"), "has1440": has1440}
    except Exception as e:
        raise HTTPException(400, f"Video bilgisi alınamadı: {str(e)[:300]}")

@app.post("/download")
def download(req: DownloadReq):
    validate(req.url)
    tmp = tempfile.mkdtemp(prefix="viddl-")
    out = str(Path(tmp) / "%(title).120s [%(id)s].%(ext)s")
    if req.quality == "audio":
        selector = "bestaudio/best"
        post = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
    elif req.quality == "best":
        selector = "bv*+ba/b"
        post = []
    else:
        h = int(req.quality)
        selector = f"bv*[height<={h}]+ba/b[height<={h}]"
        post = []
    yopt = opts() | {"format": selector, "outtmpl": out, "merge_output_format": "mp4", "postprocessors": post, "retries": 3, "fragment_retries": 3}
    try:
        with yt_dlp.YoutubeDL(yopt) as y:
            y.download([req.url])
        files = [p for p in Path(tmp).glob("*") if p.is_file() and not p.name.endswith((".part", ".ytdl"))]
        if not files:
            raise RuntimeError("Çıktı dosyası oluşturulamadı.")
        p = max(files, key=lambda x: x.stat().st_size)
        media = "audio/mpeg" if p.suffix.lower() == ".mp3" else "video/mp4"
        return FileResponse(str(p), media_type=media, filename=p.name)
    except Exception as e:
        raise HTTPException(400, f"İndirme başarısız: {str(e)[:500]}")
