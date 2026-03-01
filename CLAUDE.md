# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: PixelMind — Semantic Image Search

Local AI-powered semantic image search using natural language. Backend is FastAPI + CLIP + FAISS; frontend is Next.js (static export served by the backend in production).

---

## Commands

### Backend (from project root, with `.venv` a


### Frontend (from `frontend/` directory)

```bash
pnpm install       # install deps
pnpm dev           # dev server → http://localhost:3000
pnpm build         # static export → frontend/out/
pnpm lint          # run ESLint
```

### Docker (Hugging Face Spaces deployment)

```bash
# Build image locally
docker build -t pixelmind .

# Run container
docker run -p 7860:7860 pixelmind
```

---

## Architecture

### Backend (`server.py` + `src/core.py`)

- **`server.py`** — FastAPI app. All routes are prefixed `/api/`. On startup, loads the CLIP model and any persisted FAISS index asynchronously via `run_in_executor`. Indexing runs in a `BackgroundTask`; progress is tracked in module-level globals (`_indexing_in_progress`, `_indexing_progress`).
- **`src/core.py`** — `SemanticSearcher` class. Owns the model, processor, FAISS index, and image path list. Key methods:

  - `load_model()` — downloads `openai/clip-vit-base-patch32` from HuggingFace, moves to CUDA if available
  - `index_directory(paths)` — walks directories, generates embeddings, builds `faiss.IndexFlatIP` (cosine similarity via L2-normalized inner product)
  - `save_index()` / `load_index()` — persist `vector.index` (FAISS) and `paths.pkl` (pickle) to project root
  - `search(query, k)` — encodes query text, normalizes, returns top-k `(path, score)` pairs
- **Persistence**: `vector.index` + `paths.pkl` in project root. Uploaded images go to `uploads/`.
- **Static files**: In production, FastAPI mounts `frontend/out/` at `/`. API routes must be registered before the static mount.

### Frontend (`frontend/`)

- **`frontend/lib/api.ts`** — All API client functions. API base URL defaults to `http://localhost:8000` in dev and `""` (relative) in production. Users can override via `localStorage` key `pixelmind_api_url`.
- **`frontend/hooks/use-api.ts`** — Two SWR hooks: `useStatus` (polls every 5s), `useIndexProgress` (polls every 1s, enabled conditionally).
- **`frontend/app/page.tsx`** — Single page (`HomePage`). Search is disabled until `status.model_loaded && status.indexed`.
- **`frontend/components/`** — Feature components: `SearchBar`, `StatusPanel`, `IndexPanel` (handles directory, upload, and system scan modes), `ImageGrid`, `ImageLightbox`, `SettingsDialog`.
- **`frontend/components/ui/`** — shadcn/ui primitives (Radix UI based). Do not edit these directly.
- `next.config.mjs` uses `output: "export"` — no SSR, no API routes, no `next/image` optimization.

### Deployment mismatch (known issue)

The `Dockerfile` and `server.py` reference `frontend/` for the static build output, but the legacy frontend source also exists as `frontend_v/`. The **active** frontend directory is `frontend/`. Any changes to the frontend must be made in `frontend/`.

---

## Key Constraints

- `next.config.mjs` has `typescript: { ignoreBuildErrors: true }` — TypeScript errors won't block the build.
- FAISS index type is `IndexFlatIP` (exact search, no approximate nearest neighbor). Suitable for tens of thousands of images; may be slow for millions.
- The CLIP model is downloaded on first run from HuggingFace (~600MB). Subsequent runs use the local cache.
- `index_directory()` replaces the entire index on each call — there is no incremental indexing.
- `/api/browse` opens a native tkinter dialog — only works when the backend runs on a desktop machine, not in Docker/headless.
