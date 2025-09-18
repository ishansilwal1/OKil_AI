#!/usr/bin/env python3
"""
Legal Document Chunking Pipeline
Creates optimized chunks of 300-350 characters from all legal datasets
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from dataclasses import dataclass
import hashlib
import PyPDF2
import io

@dataclass
class DocumentChunk:
    """Document chunk with metadata"""
    text: str
    source: str
    chunk_id: str
    char_count: int
    metadata: Dict[str, Any]

class LegalDocumentChunker:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.raw_data_dir = self.base_dir / "data" / "raw"
        self.processed_dir = self.base_dir / "processed"
        self.chunks_dir = self.processed_dir / "chunks"
        self.embeddings_dir = self.base_dir / "embeddings"
        
        # Chunking parameters
        self.chunk_size = 325  # Target 300-350 characters
        self.chunk_overlap = 50  # Overlap for context preservation
        self.min_chunk_size = 150  # Minimum viable chunk size
        
        # Create directories
        for dir_path in [self.processed_dir, self.chunks_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def discover_datasets(self) -> List[Dict[str, Any]]:
        """Discover all available datasets"""
        datasets = []
        
        # Process existing JSON embeddings
        const_meta = self.embeddings_dir / "sambidhan_meta.json"
        if const_meta.exists():
            datasets.append({
                "name": "nepal_constitution_ne",
                "path": const_meta,
                "format": "meta_json",
                "type": "constitution",
                "language": "nepali",
                "priority": 10
            })
        
        const_meta_en = self.embeddings_dir / "sambidhan_meta_en.json"
        if const_meta_en.exists():
            datasets.append({
                "name": "nepal_constitution_en",
                "path": const_meta_en,
                "format": "meta_json",
                "type": "constitution",
                "language": "english",
                "priority": 9
            })
        
        # Process raw text files
        raw_files = [
            ("constitution_english.txt", "constitution_english", "constitution", "english", 8),
            ("civilcode.txt", "civil_code", "civil_code", "english", 7),
            ("Financial_Act.txt", "Financial_Act", "financial", "english", 6),
            ("Land_use_act.txt", "Land_use_act", "land_use", "nepali", 5),
            ("Property_Tax.txt", "Property_Tax", "property_tax", "nepali", 4)
        ]
        
        for filename, name, doc_type, language, priority in raw_files:
            file_path = self.raw_data_dir / filename
            if file_path.exists():
                datasets.append({
                    "name": name,
                    "path": file_path,
                    "format": "txt",
                    "type": doc_type,
                    "language": language,
                    "priority": priority
                })
        
        # Process PDF files
        pdf_file = self.raw_data_dir / "Sambidhan.pdf"
        if pdf_file.exists():
            datasets.append({
                "name": "sambidhan_pdf",
                "path": pdf_file,
                "format": "pdf",
                "type": "constitution",
                "language": "nepali",
                "priority": 5
            })
        
        return sorted(datasets, key=lambda x: x['priority'], reverse=True)
    
    def load_dataset(self, dataset_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Load a single dataset"""
        file_path = dataset_info['path']
        format_type = dataset_info['format']
        
        try:
            if format_type == "meta_json":
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return self._process_meta_json(data, dataset_info)
            
            elif format_type == "txt":
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    return self._process_text_file(content, dataset_info)
            
            elif format_type == "pdf":
                return self._process_pdf_file(file_path, dataset_info)
            
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return []
    
    def _process_meta_json(self, data: List[Dict], dataset_info: Dict) -> List[Dict]:
        """Process metadata JSON files (constitution)"""
        documents = []
        
        for item in data:
            # Use text_en for English, text_preview for Nepali
            text_field = 'text_en' if dataset_info['language'] == 'english' else 'text_preview'
            text = item.get(text_field, item.get('text_preview', ''))
            
            if text and len(text.strip()) > 20:
                documents.append({
                    "text": text.strip(),
                    "source": dataset_info['name'],
                    "metadata": {
                        **item,
                        "document_type": dataset_info['type'],
                        "language": dataset_info['language']
                    }
                })
        
        return documents
    
    def _process_text_file(self, content: str, dataset_info: Dict) -> List[Dict]:
        """Process raw text files"""
        # Split by sections/articles if possible
        sections = self._split_by_sections(content)
        
        documents = []
        for i, section in enumerate(sections):
            if len(section.strip()) > 50:
                documents.append({
                    "text": section.strip(),
                    "source": dataset_info['name'],
                    "metadata": {
                        "section_index": i,
                        "document_type": dataset_info['type'],
                        "language": dataset_info['language']
                    }
                })
        
        return documents
    
    def _process_pdf_file(self, file_path: Path, dataset_info: Dict) -> List[Dict]:
        """Process PDF files"""
        documents = []
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if text and len(text.strip()) > 100:
                        documents.append({
                            "text": text.strip(),
                            "source": dataset_info['name'],
                            "metadata": {
                                "page_number": page_num + 1,
                                "document_type": dataset_info['type'],
                                "language": dataset_info['language']
                            }
                        })
        
        except Exception as e:
            print(f"Error processing PDF {file_path}: {e}")
        
        return documents
    
    def _split_by_sections(self, content: str) -> List[str]:
        """Split content by sections/articles"""
        # Try various section patterns
        patterns = [
            r'\n(?=Article\s+\d+)',  # Article N
            r'\n(?=Section\s+\d+)',  # Section N  
            r'\n(?=\d+\.)',          # 1. 2. 3.
            r'\n(?=Chapter\s+\d+)',  # Chapter N
            r'\n(?=धारा\s*\d+)',      # धारा N (Nepali)
        ]
        
        for pattern in patterns:
            sections = re.split(pattern, content)
            if len(sections) > 1:
                return sections
        
        # If no sections found, split by paragraphs
        paragraphs = content.split('\n\n')
        return [p for p in paragraphs if len(p.strip()) > 50]
    
    def clean_text(self, text: str, language: str = "english") -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Language-specific cleaning
        if language == "nepali":
            # Normalize Devanagari punctuation
            text = text.replace('।।', '।')
            text = text.replace('॥', '।')
            # Remove unwanted characters but preserve Devanagari and spaces
            # Keep Devanagari (U+0900-U+097F), basic Latin (U+0020-U+007E), and punctuation
            text = re.sub(r'[^\u0900-\u097F\u0020-\u007E।\s]+', ' ', text)
            # Clean up multiple spaces
            text = re.sub(r'\s+', ' ', text)
        else:
            # English text cleaning
            # Remove excessive punctuation
            text = re.sub(r'[.]{2,}', '.', text)
            text = re.sub(r'[-]{2,}', '-', text)
            # Remove special characters but preserve basic punctuation
            text = re.sub(r'[^\w\s.,;:!?()\[\]"\'-]', ' ', text)
        
        # Remove very short fragments
        if len(text.strip()) < 20:
            return ""
        
        return text.strip()
    
    def smart_chunk_text(self, text: str, source: str, metadata: Dict) -> List[DocumentChunk]:
        """Intelligent chunking with 300-350 character target"""
        chunks = []
        
        if not text:
            return chunks
        
        language = metadata.get('language', 'english')
        cleaned_text = self.clean_text(text, language)
        
        if not cleaned_text:
            return chunks
        
        # Split by sentences first
        if language == "nepali":
            # Split by Devanagari sentence endings
            sentences = re.split(r'[।!?]+', cleaned_text)
        else:
            # Split by English sentence endings
            sentences = re.split(r'[.!?]+', cleaned_text)
        
        sentences = [s.strip() for s in sentences if s.strip()]
        
        current_chunk = ""
        chunk_index = 0
        
        for sentence in sentences:
            # Check if adding this sentence would exceed target size
            potential_chunk = current_chunk + " " + sentence if current_chunk else sentence
            
            if len(potential_chunk) <= self.chunk_size:
                current_chunk = potential_chunk
            else:
                # Save current chunk if it meets minimum size
                if current_chunk and len(current_chunk) >= self.min_chunk_size:
                    chunks.append(self._create_chunk(current_chunk, source, chunk_index, metadata))
                    chunk_index += 1
                
                # Start new chunk with current sentence
                current_chunk = sentence
                
                # If single sentence is too long, split it
                if len(current_chunk) > self.chunk_size:
                    # Split long sentence by clauses/phrases
                    sub_chunks = self._split_long_text(current_chunk)
                    for sub_chunk in sub_chunks:
                        if len(sub_chunk) >= self.min_chunk_size:
                            chunks.append(self._create_chunk(sub_chunk, source, chunk_index, metadata))
                            chunk_index += 1
                    current_chunk = ""
        
        # Don't forget the last chunk
        if current_chunk and len(current_chunk) >= self.min_chunk_size:
            chunks.append(self._create_chunk(current_chunk, source, chunk_index, metadata))
        
        return chunks
    
    def _split_long_text(self, text: str) -> List[str]:
        """Split overly long text into smaller chunks"""
        if len(text) <= self.chunk_size:
            return [text]
        
        # Try splitting by commas, semicolons, or other natural breaks
        break_patterns = [',', ';', ' and ', ' or ', ' but ', ' however ']
        
        for pattern in break_patterns:
            if pattern in text:
                parts = text.split(pattern)
                chunks = []
                current = ""
                
                for part in parts:
                    potential = current + pattern + part if current else part
                    if len(potential) <= self.chunk_size:
                        current = potential
                    else:
                        if current:
                            chunks.append(current.strip())
                        current = part
                
                if current:
                    chunks.append(current.strip())
                
                if all(len(c) >= self.min_chunk_size for c in chunks):
                    return chunks
        
        # If no natural breaks, split by words
        words = text.split()
        chunks = []
        current = ""
        
        for word in words:
            potential = current + " " + word if current else word
            if len(potential) <= self.chunk_size:
                current = potential
            else:
                if current and len(current) >= self.min_chunk_size:
                    chunks.append(current)
                current = word
        
        if current and len(current) >= self.min_chunk_size:
            chunks.append(current)
        
        return chunks or [text]  # Return original if all else fails
    
    def _create_chunk(self, text: str, source: str, chunk_index: int, metadata: Dict) -> DocumentChunk:
        """Create a DocumentChunk object"""
        # Generate unique chunk ID
        chunk_content = f"{source}_{chunk_index}_{text[:50]}"
        chunk_id = hashlib.md5(chunk_content.encode()).hexdigest()[:12]
        
        return DocumentChunk(
            text=text.strip(),
            source=source,
            chunk_id=chunk_id,
            char_count=len(text),
            metadata={
                **metadata,
                "chunk_index": chunk_index,
                "chunk_id": chunk_id,
                "char_count": len(text)
            }
        )
    
    def process_all_datasets(self) -> List[DocumentChunk]:
        """Process all discovered datasets into optimized chunks"""
        print("Discovering legal datasets...")
        datasets = self.discover_datasets()
        
        print(f"Found {len(datasets)} datasets:")
        for ds in datasets:
            print(f"  - {ds['name']} ({ds['type']}, {ds['language']}, priority: {ds['priority']})")
        
        all_chunks = []
        stats = {}
        
        print(f"\nProcessing datasets with {self.chunk_size}±25 character chunks...")
        for dataset_info in datasets:
            print(f"\nProcessing {dataset_info['name']}...")
            
            # Load dataset
            documents = self.load_dataset(dataset_info)
            print(f"  Loaded {len(documents)} documents")
            
            # Process each document
            dataset_chunks = []
            for doc in documents:
                text = doc.get('text', '')
                if text:
                    chunks = self.smart_chunk_text(text, doc['source'], doc['metadata'])
                    dataset_chunks.extend(chunks)
            
            # Statistics
            if dataset_chunks:
                char_counts = [chunk.char_count for chunk in dataset_chunks]
                stats[dataset_info['name']] = {
                    "total_chunks": len(dataset_chunks),
                    "avg_chars": np.mean(char_counts),
                    "min_chars": min(char_counts),
                    "max_chars": max(char_counts)
                }
                
                print(f"  Created {len(dataset_chunks)} chunks")
                print(f"  Avg chars: {stats[dataset_info['name']]['avg_chars']:.1f}")
                print(f"  Range: {stats[dataset_info['name']]['min_chars']}-{stats[dataset_info['name']]['max_chars']} chars")
            
            all_chunks.extend(dataset_chunks)
        
        # Save chunking statistics
        stats_path = self.chunks_dir / "chunking_stats.json"
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        
        print(f"\nChunking complete! Created {len(all_chunks)} total chunks")
        print(f"Statistics saved to {stats_path}")
        
        return all_chunks
    
    def save_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Save processed chunks to JSONL file"""
        print(f"\nSaving {len(chunks)} processed chunks...")
        
        # Prepare metadata for JSON serialization
        chunk_data = []
        for i, chunk in enumerate(chunks):
            chunk_data.append({
                "index": i,
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "source": chunk.source,
                "char_count": chunk.char_count,
                "metadata": chunk.metadata
            })
        
        # Save JSONL for easy processing
        jsonl_path = self.chunks_dir / "legal_corpus_chunks.jsonl"
        with open(jsonl_path, 'w', encoding='utf-8') as f:
            for chunk_meta in chunk_data:
                f.write(json.dumps(chunk_meta, ensure_ascii=False) + '\n')
        
        print(f"Chunks saved to {jsonl_path}")
        return jsonl_path


def main():
    """Main chunking pipeline"""
    print("LEGAL DOCUMENT CHUNKING PIPELINE")
    print("=" * 50)
    
    # Initialize processor
    chunker = LegalDocumentChunker()
    
    # Process all datasets into chunks
    chunks = chunker.process_all_datasets()
    
    # Save chunks
    output_path = chunker.save_chunks(chunks)
    
    print(f"\n" + "=" * 60)
    print("CHUNKING COMPLETE!")
    print("=" * 60)
    
    print(f"\nFinal Statistics:")
    print(f"   Total chunks: {len(chunks)}")
    
    if chunks:
        char_counts = [c.char_count for c in chunks]
        print(f"   Average chunk size: {np.mean(char_counts):.1f} characters")
        print(f"   Chunk size range: {min(char_counts)}-{max(char_counts)} characters")
        
        sources = {}
        for chunk in chunks:
            sources[chunk.source] = sources.get(chunk.source, 0) + 1
        
        print(f"\nSources processed:")
        for source, count in sources.items():
            print(f"   - {source}: {count} chunks")
    
    print(f"\nOutput file:")
    print(f"   - Chunks: {output_path}")
    
    print(f"\nNext step: Run embedding creation script to generate embeddings from these chunks")


if __name__ == "__main__":
    main()