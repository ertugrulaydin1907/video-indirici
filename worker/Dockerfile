FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates nodejs npm && rm -rf /var/lib/apt/lists/*
RUN node --version && npm --version
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 10000
CMD ["sh","-c","uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
