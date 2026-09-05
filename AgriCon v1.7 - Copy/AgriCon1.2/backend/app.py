"""
AgriCon diagnosis API — serves CropStressMamba v2 to the AgriCon1.2 frontend.

    python -m uvicorn app:app --port 8000        (from this folder)
    run_backend.bat                              (Windows, does the same)

Endpoints
    GET  /api/health    liveness + whether the model actually loaded
    GET  /api/model     checkpoint metadata and validation numbers
    POST /api/diagnose  multipart image upload -> diagnosis payload

The model is loaded once at startup. If the checkpoint is missing the app
starts but reports unhealthy and /api/diagnose returns 503 — it never falls
back to random weights, because a random-init model returns confident-looking
predictions that are pure noise, which is worse than an honest error.
"""
from __future__ import annotations

import io
import os
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model_runtime import DEFAULT_WEIGHTS, DiagnosisModel  # noqa: E402

# 12 MB — comfortably fits a phone photo, refuses an accidental video upload.
MAX_UPLOAD_BYTES = 12 * 1024 * 1024

_state: Dict[str, Any] = {"model": None, "error": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    weights = os.environ.get("AGRICON_WEIGHTS", DEFAULT_WEIGHTS)
    threads = int(os.environ.get("AGRICON_THREADS", "2"))
    try:
        _state["model"] = DiagnosisModel(weights_path=weights, threads=threads)
        info = _state["model"].info()
        print(f"[agricon] loaded {info['model']} "
              f"({info['parametersMillions']}M params) from {info['checkpoint']}",
              flush=True)
    except Exception as exc:  # noqa: BLE001 - surfaced via /api/health
        _state["error"] = str(exc)
        print(f"[agricon] MODEL FAILED TO LOAD: {exc}", flush=True)
    yield


app = FastAPI(title="AgriCon Diagnosis API", version="1.0.0", lifespan=lifespan)

# The frontend dev server runs on :3000 and Vite proxies /api to this app, so
# same-origin in dev. CORS stays open for the case where the PWA is served
# from a different host on the farm LAN — same carry-over as the existing
# AgriCon backend. Narrow it with AGRICON_CORS if this is ever public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("AGRICON_CORS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> Dict[str, Any]:
    ok = _state["model"] is not None
    return {
        "status": "ok" if ok else "model_unavailable",
        "modelLoaded": ok,
        "error": _state["error"],
    }


@app.get("/api/model")
def model_info() -> Dict[str, Any]:
    model = _state["model"]
    if model is None:
        raise HTTPException(status_code=503, detail=_state["error"] or "model not loaded")
    return model.info()


@app.post("/api/diagnose")
async def diagnose(image: UploadFile = File(...)) -> Dict[str, Any]:
    model = _state["model"]
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=_state["error"] or "Model not loaded; check the checkpoint path.",
        )

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image larger than {MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Not a readable image file.")

    result = model.diagnose(img)
    result["filename"] = image.filename
    result["sourcePixels"] = {"width": img.width, "height": img.height}
    return result


# --- Serve the built frontend, so this one process can be the whole app ---
# `npm run build` (from the AgriCon1.2 folder) produces dist/. When it's
# there, this backend serves it directly at "/", alongside the /api/*
# routes above -- one process, one port, one thing to start. Open
# http://localhost:8000 (or this PC's LAN IP:8000 from a phone on the same
# Wi-Fi) once this is running.
#
# For active frontend development, `npm run dev` (Vite, with hot reload) on
# :3000 is still the better choice -- it proxies /api to this backend, so
# both can run at once without conflict. This static mount is for demo day
# / whenever a single command is more convenient than two terminals.
_dist_dir = Path(__file__).resolve().parent.parent / "dist"
if _dist_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_dist_dir), html=True), name="frontend")
    print(f"[agricon] serving built frontend from {_dist_dir}", flush=True)
else:
    print(
        "[agricon] no dist/ build found next to backend/ -- the API is live, "
        "but this process won't serve the web app itself. Run `npm run build` "
        "first (or use run_app.bat, which does that automatically), or run "
        "the frontend separately with `npm run dev`.",
        flush=True,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
