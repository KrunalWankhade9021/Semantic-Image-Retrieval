# PixelMind Setup Guide

Welcome to **PixelMind**, a Semantic Image Search application powered by FastAPI (Python), Next.js (React), and the CLIP AI model.

This guide will walk you through setting up and running the project on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed to run this project locally:
- **Python 3.9+** (for the AI backend)
- **Node.js 18+** (for the frontend)
- **pnpm** (Package manager for the frontend, install via `npm install -g pnpm`)

---

## ⚙️ 1. Backend Setup (FastAPI & AI Model)

The backend handles the AI image processing, storing the FAISS vector index, and serving the search API.

1. Open a terminal in the root of the project (`Multimodal Rag`).
2. Create a virtual environment to isolate the Python dependencies:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - **Windows:**
     ```bash
     .\.venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source .venv/bin/activate
     ```
4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🎨 2. Frontend Setup (Next.js)

The frontend is a modern web interface built with React, Next.js, and Tailwind CSS.

1. Open a **new, separate terminal tab** (leave the backend terminal ready for the next step).
2. Navigate into the frontend folder:
   ```bash
   cd frontend_v
   ```
3. Install the Node dependencies using pnpm:
   ```bash
   pnpm install
   ```

---

## 🚀 3. Running the Application Locally

You will need to run **both** the frontend and backend simultaneously in two different terminal windows.

### Start the AI Backend Server
In your first terminal (where the Python `.venv` is activated and you are in the project root):
```bash
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API will start running at `http://localhost:8000`.*

### Start the Next.js Frontend
In your second terminal (inside the `frontend_v` folder):
```bash
pnpm dev
```
*The frontend interface will start running at `http://localhost:3000`.*

---

## 📸 4. How to Use

1. Open your web browser and go to **`http://localhost:3000`**
2. Click **Index Images** in the top right.
3. You can either:
   - Click **Upload Images** to manually select files from your computer.
   - Click **Scan System Folders** (Local only) to automatically scan your PC's standard image directories (Pictures, Downloads, etc.).
4. Wait for the AI model to download (first time only) and process your images.
5. Use the search bar to type descriptive queries (e.g., "a red car in the snowy mountains") to instantly find matching images!

---

## ☁️ Deployment (Hugging Face Spaces)

This project is configured to be easily deployed to Hugging Face Spaces using the Docker SDK.

1. Create a new Space on Hugging Face using the **Docker** template.
2. Upload the entire contents of this repository to your Space.
3. The included `Dockerfile` will automatically build both the Node.js frontend and the Python backend into a single container running on port `7860`.
4. Ensure your Space settings allow public visibility to access the web app.
