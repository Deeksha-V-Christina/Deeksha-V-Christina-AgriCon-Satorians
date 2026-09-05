# AgriCon1.2 — one image, one process: builds the React dashboard and serves
# it from the same FastAPI backend that runs the real CropStressMamba v2
# model (see backend/app.py's static-file mount). Deploy this image anywhere
# that runs a Dockerfile (Render, Railway, Fly.io, Cloud Run, ...) and you
# get one public URL for the whole app.

# --- Stage 1: build the frontend -------------------------------------------
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html metadata.json ./
COPY src ./src
COPY public ./public
RUN npm run build

# --- Stage 2: backend + the built frontend ----------------------------------
FROM python:3.11-slim
WORKDIR /app/backend

# CPU-only torch on purpose (see backend/requirements.txt) — the default
# PyPI wheel pulls ~2GB of unused CUDA. Install it explicitly from the CPU
# index first so `pip install -r requirements.txt` below is a no-op for it.
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu "torch>=2.0" \
 && pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /app/dist /app/dist

ENV AGRICON_CORS="*"
EXPOSE 8000
# app.py already reads $PORT (defaults to 8000) and binds 0.0.0.0, and
# mounts /app/dist at "/" automatically once it finds it next to backend/.
CMD ["python", "app.py"]
