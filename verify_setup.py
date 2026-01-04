import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Testing imports...")
    import torch
    import transformers
    import faiss
    import streamlit
    print("Imports successful.")

    from src.core import SemanticSearcher
    print("SemanticSearcher imported.")

    print("Initializing SemanticSearcher (this loads the model)...")
    searcher = SemanticSearcher()
    searcher.load_model()
    print("Model loaded successfully.")
    
    print("Test passed!")

except Exception as e:
    print(f"Test failed: {e}")
    import traceback
    traceback.print_exc()
