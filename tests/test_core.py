import unittest
import os
import shutil
import numpy as np
from PIL import Image
from src.core import SemanticSearcher

class TestSemanticSearcher(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a dummy image directory for testing
        cls.test_dir = "test_images"
        os.makedirs(cls.test_dir, exist_ok=True)
        
        # Create a dummy image (red square)
        img = Image.new('RGB', (100, 100), color = 'red')
        img.save(os.path.join(cls.test_dir, 'red.jpg'))
        
        # Create another dummy image (blue square)
        img = Image.new('RGB', (100, 100), color = 'blue')
        img.save(os.path.join(cls.test_dir, 'blue.jpg'))
        
        # Initialize searcher
        print("Initializing SemanticSearcher for tests...")
        cls.searcher = SemanticSearcher()
        cls.searcher.load_model() # This might be slow
        
    @classmethod
    def tearDownClass(cls):
        # Cleanup
        if os.path.exists(cls.test_dir):
            shutil.rmtree(cls.test_dir)

    def test_embedding_shape(self):
        """Test if embedding has correct shape (1, 512) for CLIP-ViT-Base."""
        img_path = os.path.join(self.test_dir, 'red.jpg')
        emb = self.searcher.get_image_embedding(img_path)
        self.assertIsNotNone(emb)
        self.assertEqual(emb.shape[1], 512)

    def test_indexing(self):
        """Test indexing functionality."""
        self.searcher.index_directory(self.test_dir)
        self.assertIsNotNone(self.searcher.index)
        self.assertEqual(self.searcher.index.ntotal, 2)
        self.assertEqual(len(self.searcher.image_paths), 2)

    def test_search(self):
        """Test search functionality."""
        self.searcher.index_directory(self.test_dir)
        
        # Searching for 'red' should optimally find red.jpg first
        results = self.searcher.search("a red color", k=2)
        self.assertTrue(len(results) > 0)
        
        # Check if the first result is indeed the red image
        # Note: CLIP is good, but simple color squares might be ambiguous without context.
        # However, 'red' vs 'blue' is usually distinct enough.
        top_match_path = results[0][0]
        self.assertIn('red.jpg', top_match_path)

if __name__ == '__main__':
    unittest.main()
