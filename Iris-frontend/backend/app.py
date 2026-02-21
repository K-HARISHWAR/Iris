"""
backend/app.py  –  FastAPI REST server for the Iris Eye Analysis Pipeline.

Exposes:
    GET  /health     → liveness check
    POST /predict    → upload an eye image → get colour + abnormality JSON

Run from project root (d:\\ml model):
    uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

The React frontend (Iris-frontend) calls POST http://localhost:8000/predict
"""

import os
import sys
import tempfile
import logging

# ── Make sure `src.*` imports resolve from the project root ──────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.inference.pipeline import EyePipeline

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
)
log = logging.getLogger("eye_api")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Iris Eye Analysis API",
    description=(
        "Accepts an eye image and returns:\n"
        "- **iris_colour**: predicted colour class + per-class probabilities\n"
        "- **abnormality**: normal/abnormal prediction + is_abnormal flag\n"
        "- **summary**: one-line human-readable result"
    ),
    version="1.0.0",
)

# Allow the React dev server (any origin in dev) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load pipeline ONCE at startup (both .pth models into memory) ─────────────
log.info("Loading EyePipeline — this loads both .pth model files…")
try:
    pipeline = EyePipeline()
    log.info("✅ EyePipeline ready.")
except Exception as exc:
    log.error(f"❌ Failed to load EyePipeline: {exc}")
    pipeline = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", summary="Liveness check")
def health():
    """Returns 200 OK with model load status."""
    return {
        "status": "ok",
        "models_loaded": pipeline is not None,
    }


@app.post("/predict", summary="Analyse an eye image")
async def predict(file: UploadFile = File(..., description="Eye image (JPEG / PNG)")):
    """
    Upload a raw eye image.  The pipeline will:
      1. Crop the iris region automatically.
      2. Run colour classification  (dark_brown / brown / light_brown / hazel).
      3. Run abnormality detection  (normal / abnormal).

    Returns a JSON object with `iris_colour`, `abnormality`, and `summary`.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="ML models are not loaded. Check server startup logs.",
        )

    # Basic content-type guard
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected an image file (image/*), received: {content_type}",
        )

    # Save upload bytes to a temp file — pipeline.run() needs a file path
    suffix = os.path.splitext(file.filename or ".jpg")[1] or ".jpg"
    tmp = tempfile.NamedTemporaryFile(mode="wb", suffix=suffix, delete=False)
    try:
        contents = await file.read()
        tmp.write(contents)
        tmp.flush()
        tmp.close()

        log.info(f"Running pipeline on '{file.filename}' ({len(contents):,} bytes)")
        result = pipeline.run(tmp.name, crop=True)

        # Strip the server-side temp path before sending to client
        result.pop("image", None)
        result["filename"] = file.filename

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as exc:
        log.exception(f"Pipeline error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass


# ── Dev entry-point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
