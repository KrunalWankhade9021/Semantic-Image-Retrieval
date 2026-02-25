import torch
from PIL import Image
from transformers import AutoProcessor, AutoModel
import os
import pickle
import numpy as np
import faiss

class SemanticSearcher:
    def __init__(self):
        self.model = None
        self.processor = None
        self.index = None
        self.image_paths = []

    def load_model(self, model_name="openai/clip-vit-base-patch32"):
        """Loads the AI model and processor (Supports CLIP & SigLIP)."""
        if self.model is not None and self.model.name_or_path == model_name:
            print(f"Model {model_name} already loaded.")
            return

        print(f"Loading model: {model_name}...")
        try:
            self.model = AutoModel.from_pretrained(model_name)
            self.processor = AutoProcessor.from_pretrained(model_name)
            
            # Check for GPU availability
            if torch.cuda.is_available():
                self.device = "cuda"
                # Check VRAM for large models
                if "large" in model_name and torch.cuda.get_device_properties(0).total_memory < 4 * 1024**3:
                     print("Warning: Low VRAM detected. Fallback to CPU might be necessary if OOM occurs.")
            else:
                self.device = "cpu"
                
            self.model.to(self.device)
            print(f"Model loaded on {self.device}.")
        except Exception as e:
            print(f"Failed to load {model_name}: {e}")
            raise e

    def get_image_embedding(self, image_path):
        """Generates embedding for a single image."""
        try:
            image = Image.open(image_path)
            inputs = self.processor(images=image, return_tensors="pt", padding=True).to(self.device)
            with torch.no_grad():
                embedding = self.model.get_image_features(**inputs)
            return embedding.cpu().numpy()
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None

    def index_directory(self, directory_paths):
        """Scans directories and indexes images. Supports single path or list of paths."""
        if isinstance(directory_paths, str):
            directory_paths = [directory_paths]

        self.image_paths = []
        embeddings = []
        
        valid_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}
        
        for directory_path in directory_paths:
            print(f"Scanning directory: {directory_path}")
            if not os.path.exists(directory_path):
                print(f"Directory not found: {directory_path}")
                continue
                
            for root, dirs, files in os.walk(directory_path):
                for file in files:
                    if os.path.splitext(file)[1].lower() in valid_extensions:
                        full_path = os.path.join(root, file)
                        self.image_paths.append(full_path)
                        
                        emb = self.get_image_embedding(full_path)
                        if emb is not None:
                            embeddings.append(emb)
        
        if not embeddings:
            print("No images found or processed.")
            return

        embeddings_np = np.vstack(embeddings).astype('float32')
        faiss.normalize_L2(embeddings_np) # Normalize for cosine similarity
        
        dimension = embeddings_np.shape[1]
        self.index = faiss.IndexFlatIP(dimension) # Inner Product (Cosine Similarity after normalization)
        self.index.add(embeddings_np)
        print(f"Indexed {len(self.image_paths)} images.")

    def save_index(self, folder_path="."):
        """Saves the index and image paths to disk."""
        if self.index is None:
            print("No index to save.")
            return
        
        try:
            faiss.write_index(self.index, os.path.join(folder_path, "vector.index"))
            with open(os.path.join(folder_path, "paths.pkl"), "wb") as f:
                pickle.dump(self.image_paths, f)
            print("Index saved successfully.")
        except Exception as e:
            print(f"Error saving index: {e}")

    def load_index(self, folder_path="."):
        """Loads index and paths from disk."""
        try:
            index_path = os.path.join(folder_path, "vector.index")
            paths_path = os.path.join(folder_path, "paths.pkl")
            
            if os.path.exists(index_path) and os.path.exists(paths_path):
                self.index = faiss.read_index(index_path)
                with open(paths_path, "rb") as f:
                    self.image_paths = pickle.load(f)
                print(f"Loaded index with {len(self.image_paths)} images.")
                return True
            else:
                print("Index files not found.")
                return False
        except Exception as e:
            print(f"Error loading index: {e}")
            return False

    def search(self, query_text, k=5):
        """Searches for images matching the query."""
        if not self.index:
            print("Index is empty.")
            return []
            
        inputs = self.processor(text=[query_text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            text_embedding = self.model.get_text_features(**inputs).cpu().numpy().astype('float32')
        
        faiss.normalize_L2(text_embedding)
        
        k = min(k, len(self.image_paths))
        distances, indices = self.index.search(text_embedding, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                results.append((self.image_paths[idx], distances[0][i]))
        
        return results
