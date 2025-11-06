#!/usr/bin/env python3
"""
Legal Document Embedding Generator (V2 - ChromaDB & E5-Large)
Creates and stores embeddings in a persistent ChromaDB collection.
"""

import json
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from typing import List, Dict, Any
import time

class LegalEmbeddingGenerator:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.chunks_dir = self.base_dir / "processed" / "chunks"
        self.db_dir = self.base_dir / "embeddings" / "chroma_db_v2"
        
        # Create directories
        self.db_dir.mkdir(parents=True, exist_ok=True)
        
        # Embedding Model
        self.model_name = "intfloat/multilingual-e5-large"
        self.collection_name = "legal_corpus_v2"
        
        # Initialize ChromaDB client and collection
        print(f"Initializing ChromaDB at {self.db_dir}...")
        self.client = chromadb.PersistentClient(path=str(self.db_dir))
        
        # Use SentenceTransformerEmbeddingFunction for on-the-fly embedding
        print(f"Loading embedding model: {self.model_name}...")
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=self.model_name,
            device="cpu"  # Change to "cuda" if you have a CUDA-enabled GPU
        )
        
        print(f"Initializing ChromaDB collection '{self.collection_name}'...")
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity
        )
        print("ChromaDB collection initialized.")

    def load_chunks(self) -> List[Dict[str, Any]]:
        """Load processed chunks from the delimiter-based JSONL file."""
        chunks_file = self.chunks_dir / "legal_chunks_delimiter_based.jsonl"
        
        if not chunks_file.exists():
            raise FileNotFoundError(f"Chunks file not found: {chunks_file}. Run delimiter_chunker.py first.")
        
        chunks = []
        print(f"Loading chunks from {chunks_file}...")
        
        with open(chunks_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    chunk_data = json.loads(line.strip())
                    # Normalize chunk structure for ChromaDB
                    normalized_chunk = {
                        'chunk_id': chunk_data['id'],
                        'text': chunk_data['text_chunk'],
                        'metadata': chunk_data['metadata']
                    }
                    chunks.append(normalized_chunk)
                except json.JSONDecodeError:
                    print(f"Warning: Skipping malformed line in {chunks_file}")
        
        print(f"Loaded {len(chunks)} chunks.")
        return chunks

    def add_chunks_to_db(self, chunks: List[Dict[str, Any]]):
        """Adds chunks to the ChromaDB collection in batches."""
        if not chunks:
            print("No chunks to add.")
            return

        print(f"\nAdding {len(chunks)} chunks to ChromaDB collection '{self.collection_name}'...")
        
        batch_size = 50  # Process in batches to manage memory
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            # Prepare data for ChromaDB
            ids = [chunk['chunk_id'] for chunk in batch]
            documents = [chunk['text'] for chunk in batch]
            metadatas = [chunk['metadata'] for chunk in batch]
            
            # Add to collection
            # The embedding function will automatically handle embedding generation
            try:
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                print(f"  - Added batch {i // batch_size + 1}/{(len(chunks) + batch_size - 1) // batch_size} ({len(batch)} chunks)")
            except Exception as e:
                print(f"  - Error adding batch {i // batch_size + 1}: {e}")
                # Optional: add retry logic here
        
        print("\nAll chunks have been added to the database.")

    def process_embeddings(self):
        """Complete embedding generation and storage pipeline."""
        try:
            # Check if the collection already has data
            count = self.collection.count()
            if count > 0:
                print(f"\nCollection '{self.collection_name}' already contains {count} documents.")
                user_input = input("Do you want to clear the existing collection and re-process? (yes/no): ").lower()
                if user_input == 'yes':
                    print("Clearing existing collection...")
                    self.client.delete_collection(name=self.collection_name)
                    self.collection = self.client.get_or_create_collection(
                        name=self.collection_name,
                        embedding_function=self.embedding_function,
                        metadata={"hnsw:space": "cosine"}
                    )
                    print("Collection cleared.")
                else:
                    print("Skipping embedding generation.")
                    return True

            # Load processed chunks
            chunks = self.load_chunks()
            
            # Add chunks to ChromaDB (embeddings are generated automatically)
            self.add_chunks_to_db(chunks)
            
            return True
            
        except FileNotFoundError as e:
            print(f"Error: {e}")
            return False
        except Exception as e:
            print(f"An error occurred in the embedding pipeline: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main embedding generation and storage pipeline."""
    print("LEGAL DOCUMENT EMBEDDING GENERATOR (V2)")
    print("=" * 50)
    
    start_time = time.time()
    
    generator = LegalEmbeddingGenerator()
    
    # Process and store embeddings
    success = generator.process_embeddings()
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n" + "=" * 60)
    if success:
        print("EMBEDDING GENERATION & STORAGE COMPLETE!")
        print(f"Total time taken: {duration:.2f} seconds")
        print("=" * 60)
        
        final_count = generator.collection.count()
        print(f"\nDatabase Summary:")
        print(f"   - ChromaDB Collection: '{generator.collection_name}'")
        print(f"   - Location: '{generator.db_dir}'")
        print(f"   - Total Documents: {final_count}")
        print(f"   - Embedding Model: '{generator.model_name}'")
        
        print(f"\nThe system is now ready for the RAG pipeline.")
    else:
        print("EMBEDDING GENERATION FAILED!")
        print(f"Total time taken: {duration:.2f} seconds")
        print("=" * 60)
        print("Please check the error messages above.")


if __name__ == "__main__":
    main()
