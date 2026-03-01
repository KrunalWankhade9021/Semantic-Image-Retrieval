FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm

# Set up user for Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Set up working directory
WORKDIR /app

# Install Python dependencies
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY --chown=user src/ src/
COPY --chown=user server.py .

# Build frontend
COPY --chown=user frontend/ frontend/
WORKDIR /app/frontend
RUN pnpm install && pnpm run build

# Go back to app root
WORKDIR /app

# Create custom cache/uploads directories
RUN mkdir -p uploads && mkdir -p /home/user/.cache/huggingface

# Start FastAPI server on port 7860
ENV PORT=7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
