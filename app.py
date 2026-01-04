import streamlit as st
from src.core import SemanticSearcher
import os

# Initialize Session State
if 'searcher' not in st.session_state:
    st.session_state.searcher = SemanticSearcher()
    # Lazy load model only when needed or on startup? 
    # Let's load it on startup for now, providing feedback.
    with st.spinner("Loading AI Models..."):
        st.session_state.searcher.load_model()

st.set_page_config(page_title="Semantic Image Search", layout="wide")

st.title("Semantic Image Search 🔍")
st.markdown("Search your local images using natural language.")

# Sidebar for configuration
with st.sidebar:
    st.header("Configuration")
    
    # Initialize/Load Model (Single Model: SigLIP)
    if st.session_state.searcher.model is None:
        with st.spinner("Loading AI Model (SigLIP)..."):
            st.session_state.searcher.load_model("google/siglip-base-patch16-224")
            
    image_dir = st.text_input("Image Directory Path", r"C:\Users\kaust\OneDrive\Pictures")
    
    # Upload Section
    uploaded_files = st.file_uploader("Upload from Mobile/PC", accept_multiple_files=True, type=['png', 'jpg', 'jpeg'])
    if uploaded_files:
        upload_dir = os.path.join(image_dir, "MobileUploads")
        os.makedirs(upload_dir, exist_ok=True)
        count = 0
        for uploaded_file in uploaded_files:
            file_path = os.path.join(upload_dir, uploaded_file.name)
            with open(file_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            count += 1
        st.success(f"Uploaded {count} images to {upload_dir}")
    
    if st.button("Index Images"):
        if os.path.exists(image_dir):
            with st.spinner("Indexing Images... This might take a while."):
                st.session_state.searcher.index_directory(image_dir)
            st.success(f"Indexed {len(st.session_state.searcher.image_paths)} images!")
        else:
            st.error("Directory not found!")

query = st.text_input("Describe the image you are looking for:")

if query:
    if st.session_state.searcher.index is None:
        st.warning("Please index a directory first.")
    else:
        st.write(f"Searching for: **{query}**")
        results = st.session_state.searcher.search(query)
        
        cols = st.columns(3)
        for i, (path, score) in enumerate(results):
            col = cols[i % 3]
            with col:
                st.image(path, caption=f"Score: {score:.4f}", use_container_width=True)
