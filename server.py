import os
import io
import asyncio
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from PIL import Image as PILImage
from src.core import SemanticSearcher

app = FastAPI(title="Semantic Image Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global state ---
searcher = SemanticSearcher()
_indexing_in_progress = False
_indexing_progress = {"current": 0, "total": 0, "status": "idle", "message": ""}
MODEL_NAME = "openai/clip-vit-base-patch32"

# --- Startup: load model and existing index ---
@app.on_event("startup")
async def startup():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _load_model_and_index)

def _load_model_and_index():
    searcher.load_model(MODEL_NAME)
    searcher.load_index()

# --- Pydantic models ---
class IndexRequest(BaseModel):
    directory_path: str

class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 10

# --- Status ---
@app.get("/api/status")
def get_status():
    return {
        "model_loaded": searcher.model is not None,
        "model_name": searcher._loaded_model_name,
        "device": searcher.device,
        "indexed": searcher.index is not None,
        "image_count": len(searcher.image_paths),
        "indexing_in_progress": _indexing_in_progress,
    }

# --- Indexing ---
def _run_indexing(paths):
    global _indexing_in_progress, _indexing_progress

    _indexing_in_progress = True
    _indexing_progress["status"] = "running"
    _indexing_progress["message"] = "Scanning and indexing images..."

    try:
        searcher.index_directory(paths)
        searcher.save_index()
        _indexing_progress["status"] = "done"
        _indexing_progress["message"] = f"Indexed {len(searcher.image_paths)} images."
    except Exception as e:
        _indexing_progress["status"] = "error"
        _indexing_progress["message"] = str(e)
    finally:
        _indexing_in_progress = False

@app.post("/api/index")
async def index_directory(req: IndexRequest, background_tasks: BackgroundTasks):
    if _indexing_in_progress:
        raise HTTPException(status_code=409, detail="Indexing already in progress.")
    if not os.path.exists(req.directory_path):
        raise HTTPException(status_code=404, detail="Directory not found.")
    if searcher.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    background_tasks.add_task(_run_indexing, [req.directory_path])
    return {"status": "started", "message": f"Indexing started for: {req.directory_path}"}

@app.post("/api/scan")
async def scan_system(background_tasks: BackgroundTasks):
    if _indexing_in_progress:
        raise HTTPException(status_code=409, detail="Indexing already in progress.")
    if searcher.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    user_profile = os.environ.get("USERPROFILE") or os.path.expanduser("~")
    folders = ["Pictures", "Downloads", "Documents", "Desktop"]
    paths = [os.path.join(user_profile, f) for f in folders if os.path.exists(os.path.join(user_profile, f))]

    if not paths:
        raise HTTPException(status_code=404, detail="No common image directories found.")

    background_tasks.add_task(_run_indexing, paths)
    return {"status": "started", "message": f"Scanning: {', '.join(paths)}"}

@app.get("/api/index/progress")
def get_indexing_progress():
    return {
        "in_progress": _indexing_in_progress,
        "status": _indexing_progress["status"],
        "message": _indexing_progress["message"],
        "image_count": len(searcher.image_paths),
    }

# --- Search ---
@app.post("/api/search")
def search(req: SearchRequest):
    if searcher.index is None:
        raise HTTPException(status_code=400, detail="No index found. Please index a directory first.")
    if searcher.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    results = searcher.search(req.query, k=req.k)

    return [
        {
            "image_path": path,
            "filename": os.path.basename(path),
            "score": float(score),
            "image_url": f"/api/image?path={path}",
            "thumbnail_url": f"/api/thumbnail?path={path}",
        }
        for path, score in results
    ]

# --- Image serving ---
def _validate_path(path: str) -> Path:
    """Ensure the path is an existing image file."""
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    if p.suffix.lower() not in {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}:
        raise HTTPException(status_code=400, detail="Not a supported image type.")
    return p

@app.get("/api/image")
def serve_image(path: str = Query(...)):
    p = _validate_path(path)
    return FileResponse(str(p), media_type="image/jpeg")

@app.get("/api/thumbnail")
def serve_thumbnail(path: str = Query(...), size: int = Query(default=300)):
    p = _validate_path(path)
    size = min(max(size, 50), 800)  # clamp between 50 and 800

    try:
        img = PILImage.open(str(p)).convert("RGB")
        img.thumbnail((size, size))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate thumbnail: {e}")

# --- Upload ---
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_images(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    saved = []
    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".bmp", ".gif"}:
            continue
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = os.path.join(UPLOAD_DIR, safe_name)
        content = await file.read()
        with open(dest, "wb") as f:
            f.write(content)
        saved.append(dest)

    if not saved:
        raise HTTPException(status_code=400, detail="No valid image files uploaded.")

    return {"uploaded": len(saved), "paths": saved, "upload_dir": UPLOAD_DIR}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
