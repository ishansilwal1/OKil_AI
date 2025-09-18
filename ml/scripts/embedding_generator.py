#!/usr/bin/env python3
"""
Legal Document Embedding Generator
Creates embeddings and FAISS index from processed document chunks
"""

import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple

class LegalEmbeddingGenerator:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.chunks_dir = self.base_dir / "processed" / "chunks"
        self.embeddings_dir = self.base_dir / "embeddings"
        
        # Create embeddings directory
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)
    
    def load_chunks(self) -> List[Dict[str, Any]]:
        """Load processed chunks from JSONL file"""
        chunks_file = self.chunks_dir / "legal_corpus_chunks.jsonl"
        
        if not chunks_file.exists():
            raise FileNotFoundError(f"Chunks file not found: {chunks_file}")
        
        chunks = []
        print(f"Loading chunks from {chunks_file}")
        
        with open(chunks_file, 'r', encoding='utf-8') as f:
            for line in f:
                chunk = json.loads(line.strip())
                chunks.append(chunk)
        
        print(f"Loaded {len(chunks)} chunks")
        return chunks
    
    def generate_embeddings(self, chunks: List[Dict[str, Any]]) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """Generate embeddings for all chunks"""
        print(f"\nGenerating embeddings for {len(chunks)} chunks...")
        
        try:
            from sentence_transformers import SentenceTransformer
            
            # Use multilingual model for mixed language content
            model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            print(f"Loading model: {model_name}")
            model = SentenceTransformer(model_name, device="cpu")
            
            # Extract texts
            texts = [chunk['text'] for chunk in chunks]
            
            # Generate embeddings in batches
            print("Encoding texts...")
            embeddings = model.encode(
                texts,
                batch_size=32,
                show_progress_bar=True,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            
            print(f"Generated embeddings: shape {embeddings.shape}")
            return embeddings, chunks
            
        except ImportError:
            print("Error: sentence-transformers not installed")
            print("Install with: pip install sentence-transformers")
            return None, chunks
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            return None, chunks
    
    def build_faiss_index(self, embeddings: np.ndarray, chunks: List[Dict[str, Any]]) -> None:
        """Build optimized FAISS index"""
        print("\nBuilding FAISS index...")
        
        try:
            import faiss
            
            if embeddings is None:
                print("No embeddings to index!")
                return
            
            print(f"Building index for {len(embeddings)} embeddings of dimension {embeddings.shape[1]}")
            
            # Create FAISS index (Inner product for normalized vectors = cosine similarity)
            d = embeddings.shape[1]
            index = faiss.IndexFlatIP(d)
            index.add(embeddings.astype('float32'))
            
            # Save index
            index_path = self.embeddings_dir / "legal_corpus_faiss.index"
            faiss.write_index(index, str(index_path))
            print(f"FAISS index saved to {index_path}")
            
            # Save embeddings as backup
            emb_path = self.embeddings_dir / "legal_corpus_embeddings.npy"
            np.save(str(emb_path), embeddings)
            print(f"Embeddings saved to {emb_path}")
            
        except ImportError:
            print("Error: faiss not installed")
            print("Install with: pip install faiss-cpu")
        except Exception as e:
            print(f"Error building FAISS index: {e}")
    
    def save_metadata(self, chunks: List[Dict[str, Any]]) -> None:
        """Save chunk metadata for RAG system"""
        print(f"\nSaving metadata for {len(chunks)} chunks...")
        
        # Save metadata
        meta_path = self.embeddings_dir / "legal_corpus_meta.json"
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)
        
        print(f"Metadata saved to {meta_path}")
        
        # Create summary statistics
        summary = {
            "total_chunks": len(chunks),
            "sources": {},
            "languages": {},
            "document_types": {}
        }
        
        for chunk in chunks:
            source = chunk['source']
            summary['sources'][source] = summary['sources'].get(source, 0) + 1
            
            lang = chunk['metadata'].get('language', 'unknown')
            summary['languages'][lang] = summary['languages'].get(lang, 0) + 1
            
            doc_type = chunk['metadata'].get('document_type', 'unknown')
            summary['document_types'][doc_type] = summary['document_types'].get(doc_type, 0) + 1
        
        # Add character statistics
        char_counts = [chunk['char_count'] for chunk in chunks]
        summary['char_stats'] = {
            "min": min(char_counts),
            "max": max(char_counts),
            "avg": np.mean(char_counts),
            "median": np.median(char_counts)
        }
        
        # Save summary
        summary_path = self.embeddings_dir / "legal_corpus_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"Summary saved to {summary_path}")
    
    def process_embeddings(self) -> None:
        """Complete embedding generation pipeline"""
        try:
            # Load processed chunks
            chunks = self.load_chunks()
            
            # Generate embeddings
            embeddings, chunks = self.generate_embeddings(chunks)
            
            # Build FAISS index
            if embeddings is not None:
                self.build_faiss_index(embeddings, chunks)
            
            # Save metadata and summary
            self.save_metadata(chunks)
            
            return embeddings is not None
            
        except FileNotFoundError as e:
            print(f"Error: {e}")
            print("Run document_chunker.py first to create chunks")
            return False
        except Exception as e:
            print(f"Error in embedding pipeline: {e}")
            return False


def main():
    """Main embedding generation pipeline"""
    print("LEGAL DOCUMENT EMBEDDING GENERATOR")
    print("=" * 50)
    
    # Initialize generator
    generator = LegalEmbeddingGenerator()
    
    # Process embeddings
    success = generator.process_embeddings()
    
    print(f"\n" + "=" * 60)
    if success:
        print("EMBEDDING GENERATION COMPLETE!")
        print("=" * 60)
        
        print(f"\nOutput files:")
        print(f"   - FAISS index: ml/embeddings/legal_corpus_faiss.index")
        print(f"   - Embeddings: ml/embeddings/legal_corpus_embeddings.npy")
        print(f"   - Metadata: ml/embeddings/legal_corpus_meta.json")
        print(f"   - Summary: ml/embeddings/legal_corpus_summary.json")
        
        print(f"\nReady for RAG system integration!")
    else:
        print("EMBEDDING GENERATION FAILED!")
        print("=" * 60)
        print("Check error messages above and ensure dependencies are installed:")
        print("  - pip install sentence-transformers")
        print("  - pip install faiss-cpu")


if __name__ == "__main__":
    main()