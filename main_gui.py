import customtkinter as ctk
import os
import threading
from PIL import Image
from src.core import SemanticSearcher
import tkinter.filedialog as filedialog

ctk.set_appearance_mode("Dark")  # Modes: "System" (standard), "Dark", "Light"
ctk.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

class ImageCard(ctk.CTkFrame):
    def __init__(self, master, image_path, score, **kwargs):
        super().__init__(master, **kwargs)
        self.image_path = image_path
        
        # Load and display image thumbnail
        try:
            pil_image = Image.open(image_path)
            # Maintain aspect ratio for thumbnail
            pil_image.thumbnail((200, 200))
            self.ctk_image = ctk.CTkImage(light_image=pil_image, dark_image=pil_image, size=pil_image.size)
            
            self.image_label = ctk.CTkLabel(self, image=self.ctk_image, text="")
            self.image_label.pack(pady=5, padx=5)
            self.image_label.bind("<Button-1>", self.open_image)
            
            # Score label
            self.score_label = ctk.CTkLabel(self, text=f"Score: {score:.4f}", font=("Arial", 10))
            self.score_label.pack(pady=(0, 5))
            
            # Filename label (truncated)
            filename = os.path.basename(image_path)
            if len(filename) > 20:
                filename = filename[:17] + "..."
            self.name_label = ctk.CTkLabel(self, text=filename, font=("Arial", 11, "bold"))
            self.name_label.pack(pady=(0, 5))
            
            self.bind("<Button-1>", self.open_image)
            
        except Exception as e:
            print(f"Error loading image {image_path}: {e}")
            self.destroy()

    def open_image(self, event=None):
        try:
            os.startfile(self.image_path)
        except Exception as e:
            print(f"Could not open file: {e}")

class SearchApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Semantic Image Search")
        self.geometry("900x700")

        # Initialize backend
        self.searcher = SemanticSearcher()
        self.loading_model = True
        
        # UI Layout
        self.create_widgets()
        
        # Load model in background
        self.status_label.configure(text="Loading AI Models... Please wait.")
        threading.Thread(target=self.load_model_thread, daemon=True).start()

    def create_widgets(self):
        # 1. Top Bar (Title + Config)
        self.top_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.top_frame.pack(fill="x", padx=20, pady=10)
        
        self.title_label = ctk.CTkLabel(self.top_frame, text="Semantic Search 🔍", font=("Roboto", 24, "bold"))
        self.title_label.pack(side="left")

        self.index_frame = ctk.CTkFrame(self.top_frame, fg_color="transparent")
        self.index_frame.pack(side="right")
        
        self.scan_btn = ctk.CTkButton(self.index_frame, text="Scan System", command=self.start_system_scan, width=100)
        self.scan_btn.pack(side="left", padx=5)

        self.index_btn = ctk.CTkButton(self.index_frame, text="Index Folder", command=self.open_index_dialog, width=100)
        self.index_btn.pack(side="left", padx=5)

        # 2. Search Area (Centered initially, moves up)
        self.search_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.search_frame.pack(fill="x", padx=20, pady=(10, 20))
        
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Describe the image you're looking for...", height=50, font=("Arial", 16))
        self.search_entry.pack(fill="x", expand=True, side="left", padx=(0, 10))
        self.search_entry.bind("<Return>", self.on_search)

        self.search_btn = ctk.CTkButton(self.search_frame, text="Search", width=100, height=50, command=self.on_search, font=("Arial", 14, "bold"))
        self.search_btn.pack(side="right")

        # 3. Status Bar
        self.status_label = ctk.CTkLabel(self, text="Ready", text_color="gray")
        self.status_label.pack(fill="x", padx=20, pady=(0, 5))

        # 4. Results Area
        self.results_scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.results_scroll.pack(fill="both", expand=True, padx=20, pady=10)
        
        # Grid layout for results inside scrollable frame
        self.results_scroll.grid_columnconfigure(0, weight=1)
        self.results_scroll.grid_columnconfigure(1, weight=1)
        self.results_scroll.grid_columnconfigure(2, weight=1)
        # self.results_scroll.grid_columnconfigure(3, weight=1) # Uncomment for 4 columns

    def load_model_thread(self):
        try:
            self.searcher.load_model("google/siglip-base-patch16-224") # Using SigLIP as per previous app.py
            self.loading_model = False
            self.update_status("Model Loaded.")
            
            # Try loading existing index
            if self.searcher.load_index():
                self.update_status(f"Ready. Loaded {len(self.searcher.image_paths)} images from disk.")
            else:
                self.update_status("Model Ready. No index found. Please scan system or index a folder.")
                
        except Exception as e:
            self.update_status(f"Error loading model: {e}")

    def update_status(self, text):
        self.status_label.configure(text=text)

    def open_index_dialog(self):
        if self.loading_model:
            self.update_status("Please wait for model to load.")
            return

        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.update_status(f"Indexing {folder_selected}...")
            threading.Thread(target=self.index_thread, args=(folder_selected,), daemon=True).start()

    def index_thread(self, folder_path):
        try:
            self.searcher.index_directory(folder_path)
            self.searcher.save_index()
            count = len(self.searcher.image_paths)
            self.update_status(f"Indexing complete and saved. {count} images indexed.")
        except Exception as e:
            self.update_status(f"Indexing failed: {e}")

    def start_system_scan(self):
        if self.loading_model:
            self.update_status("Please wait for model to load.")
            return
            
        self.update_status("Scanning system directories (Pictures, Downloads, Desktop)...")
        threading.Thread(target=self.system_scan_thread, daemon=True).start()

    def system_scan_thread(self):
        try:
            user_profile = os.environ.get("USERPROFILE")
            if not user_profile:
                self.update_status("Could not determine user path.")
                return
                
            common_folders = ["Pictures", "Downloads", "Documents", "Desktop"]
            paths_to_scan = [os.path.join(user_profile, folder) for folder in common_folders]
            
            self.searcher.index_directory(paths_to_scan)
            self.searcher.save_index()
            
            count = len(self.searcher.image_paths)
            self.update_status(f"System scan complete and saved. {count} images indexed.")
        except Exception as e:
            self.update_status(f"System scan failed: {e}")

    def on_search(self, event=None):
        if self.loading_model:
            self.update_status("Model is still loading...")
            return

        query = self.search_entry.get()
        if not query:
            return
        
        if not self.searcher.index:
            self.update_status("Please index a folder first.")
            return

        self.update_status(f"Searching for '{query}'...")
        # Clear previous results
        for widget in self.results_scroll.winfo_children():
            widget.destroy()

        # Run search in thread to not freeze UI
        threading.Thread(target=self.search_thread, args=(query,), daemon=True).start()

    def search_thread(self, query):
        results = self.searcher.search(query, k=20) # Get top 20
        
        # UI updates must happen in main thread. CustomTkinter is mostly thread-safe for configure, but packing might be tricky.
        # Ideally use after() but direct calls often work in simple cases. To be safe, let's just create widgets here.
        # Note: Tkinter is NOT thread safe. We should use after() loop or similar.
        # For simplicity in this script, we'll try direct creation and see if it holds, or use a queue if needed.
        # Actually, let's use the .after method on the main window to schedule the update.
        self.after(0, lambda: self.display_results(results))

    def display_results(self, results):
        if not results:
            self.status_label.configure(text="No matches found.")
            return

        self.status_label.configure(text=f"Found {len(results)} matches.")
        
        for i, (path, score) in enumerate(results):
            row = i // 3
            col = i % 3
            card = ImageCard(self.results_scroll, path, score)
            card.grid(row=row, column=col, padx=10, pady=10)

if __name__ == "__main__":
    app = SearchApp()
    app.mainloop()
