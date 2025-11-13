#!/usr/bin/env python3
"""
Delimiter-Based Legal Document Chunker for Nepali Legal Texts
Processes Nepali legal documents by splitting on structural markers (धारा, दफा, नियम)
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any
import unicodedata


def normalize_nepali_number(text: str) -> str:
    """Convert Nepali numerals (०-९) to English numerals (0-9)."""
    nepali_to_english = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    }
    
    for nepali, english in nepali_to_english.items():
        text = text.replace(nepali, english)
    
    return text


def slugify(text: str) -> str:
    """Create a URL-safe slug from Nepali/English text."""
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and special chars with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text


def preprocess_text(content: str) -> str:
    """Clean and preprocess legal document text."""
    # Remove URLs
    content = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', content)
    
    # Remove email addresses
    content = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', content)
    
    # Remove page numbers (common patterns)
    content = re.sub(r'(?i)page\s*\d+', '', content)
    content = re.sub(r'पृष्ठ\s*[०-९\d]+', '', content)
    
    # Remove excessive newlines (more than 2 consecutive)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Remove excessive spaces
    content = re.sub(r' {2,}', ' ', content)
    
    # Remove form feed and other control characters
    content = re.sub(r'[\f\r\v]', '', content)
    
    return content.strip()


def extract_legal_chunks(file_content: str, act_name_ne: str, file_name: str) -> List[Dict[str, Any]]:
    """
    Extract legal chunks from Nepali legal documents based on delimiters.
    
    Args:
        file_content: The raw text content of the legal document
        act_name_ne: The name of the act in Nepali (e.g., 'आर्थिक ऐन, २०८२')
        file_name: The source file name (e.g., 'financial_act_cleaned.txt')
    
    Returns:
        List of dictionaries, each representing a legal provision chunk
    """
    
    # Preprocess the content
    content = preprocess_text(file_content)
    
    # Define the delimiter pattern
    # Matches: धारा/दफा/नियम at START of line only (prevents matching in-text references)
    # ^ matches start of line in MULTILINE mode
    # This prevents matching cross-references like "see धारा २०, २१, २२"
    delimiter_pattern = r'^(धारा|दफा|नियम)\s*([\d०-९]+)'
    
    # Find all delimiter matches with their positions
    delimiter_matches = []
    for match in re.finditer(delimiter_pattern, content, re.MULTILINE):
        section_type = match.group(1)  # धारा, दफा, or नियम
        section_number = match.group(2)  # The numeral
        
        # Normalize the section number to English numerals
        section_number_normalized = normalize_nepali_number(section_number)
        
        delimiter_matches.append({
            'section_type': section_type,
            'section_number_original': section_number,
            'section_number': section_number_normalized,
            'start_pos': match.start(),
            'end_pos': match.end()
        })
    
    if not delimiter_matches:
        print(f"Warning: No delimiters found in {file_name}")
        print(f"  Content length: {len(content)} chars")
        print(f"  Newlines: {content.count(chr(10))}")
        print(f"  Pattern: {delimiter_pattern}")
        return []
    
    # Extract chunks between delimiters
    chunks = []
    
    for i, delimiter_info in enumerate(delimiter_matches):
        # Determine the chunk boundaries
        chunk_start = delimiter_info['start_pos']
        
        # If there's a next delimiter, chunk ends there; otherwise, to end of document
        if i + 1 < len(delimiter_matches):
            chunk_end = delimiter_matches[i + 1]['start_pos']
        else:
            chunk_end = len(content)
        
        # Extract the chunk text
        chunk_text = content[chunk_start:chunk_end].strip()
        
        # Skip if chunk is too short (likely noise)
        if len(chunk_text) < 20:
            continue
        
        # Generate a unique, slugified ID
        act_slug = slugify(act_name_ne)
        section_type_slug = slugify(delimiter_info['section_type'])
        section_num = delimiter_info['section_number']
        # Add chunk index to ensure uniqueness (in case same article appears multiple times)
        chunk_id = f"{act_slug}-{section_type_slug}-{section_num}-{i}"
        
        # Build the metadata
        metadata = {
            'act_name_ne': act_name_ne,
            'section_type_ne': delimiter_info['section_type'],
            'section_number': delimiter_info['section_number'],
            'section_number_original': delimiter_info['section_number_original'],
            'source_file': file_name,
            'chunk_index': i,
            'citation_reference': f"{act_name_ne}, {delimiter_info['section_type']} {delimiter_info['section_number_original']}"
        }
        
        # Create the chunk dictionary
        chunk = {
            'id': chunk_id,
            'text_chunk': chunk_text,
            'metadata': metadata
        }
        
        chunks.append(chunk)
    
    return chunks


def process_legal_document(file_path: Path, act_name_ne: str) -> List[Dict[str, Any]]:
    """
    Process a legal document file and extract chunks.
    
    Args:
        file_path: Path to the legal document file
        act_name_ne: The name of the act in Nepali
    
    Returns:
        List of chunk dictionaries
    """
    print(f"Processing: {file_path.name}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        chunks = extract_legal_chunks(content, act_name_ne, file_path.name)
        print(f"  ✓ Extracted {len(chunks)} chunks from {file_path.name}")
        
        return chunks
        
    except Exception as e:
        print(f"  ✗ Error processing {file_path.name}: {e}")
        return []


def main():
    """Main execution: Process all legal documents from the cleaned folder."""
    
    print("DELIMITER-BASED LEGAL DOCUMENT CHUNKER")
    print("=" * 60)
    
    # Define the base directory and cleaned data folder
    # Use script's parent directory to get to ml folder
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent  # Go up to ml directory
    cleaned_dir = base_dir / "data" / "raw"  # Changed from "cleaned" to "raw"
    output_dir = base_dir / "processed" / "chunks"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Define documents to process with their Nepali act names
    documents_config = [
        {
            'file': 'civilcode.txt',
            'act_name_ne': 'नागरिक संहिता, २०७४',
            'act_name_en': 'Civil Code, 2074'
        },
        {
            'file': 'Constitution_Nepali.txt',
            'act_name_ne': 'नेपालको संविधान, २०७२',
            'act_name_en': 'Constitution of Nepal, 2072'
        },
        {
            'file': 'constitution_english.txt',
            'act_name_ne': 'Constitution of Nepal, 2072',
            'act_name_en': 'Constitution of Nepal, 2072'
        },
        {
            'file': 'Financial_Act.txt',
            'act_name_ne': 'आर्थिक ऐन, २०८२',
            'act_name_en': 'Financial Act, 2082'
        },
        {
            'file': 'Land_use_act.txt',
            'act_name_ne': 'भूमि उपयोग ऐन, २०७६',
            'act_name_en': 'Land Use Act, 2076'
        },
        {
            'file': 'Property_Tax.txt',
            'act_name_ne': 'सम्पत्ति कर ऐन, २०७९',
            'act_name_en': 'Property Tax Act, 2079'
        }
    ]
    
    all_chunks = []
    stats = {}
    
    for doc_config in documents_config:
        file_path = cleaned_dir / doc_config['file']
        
        if not file_path.exists():
            print(f"Skipping {doc_config['file']} (not found)")
            continue
        
        chunks = process_legal_document(file_path, doc_config['act_name_ne'])
        
        if chunks:
            all_chunks.extend(chunks)
            stats[doc_config['act_name_en']] = {
                'total_chunks': len(chunks),
                'file': doc_config['file']
            }
    
    # Save all chunks to a JSONL file
    if all_chunks:
        output_file = output_dir / "legal_chunks_delimiter_based.jsonl"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            for chunk in all_chunks:
                f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
        
        print(f"\n{'=' * 60}")
        print("CHUNKING COMPLETE!")
        print(f"{'=' * 60}")
        print(f"\nTotal chunks extracted: {len(all_chunks)}")
        print(f"Output file: {output_file}")
        
        print(f"\nStatistics by Document:")
        for doc_name, doc_stats in stats.items():
            print(f"  - {doc_name}: {doc_stats['total_chunks']} chunks")
        
        # Display first 3 chunks for verification
        print(f"\n{'=' * 60}")
        print("SAMPLE CHUNKS (First 3):")
        print(f"{'=' * 60}")
        
        for i, chunk in enumerate(all_chunks[:3], 1):
            print(f"\nChunk {i}:")
            print(f"  ID: {chunk['id']}")
            print(f"  Citation: {chunk['metadata']['citation_reference']}")
            print(f"  Text Preview: {chunk['text_chunk'][:200]}...")
            print(f"  Full Text Length: {len(chunk['text_chunk'])} characters")
    else:
        print("\nNo chunks were extracted. Please check the input files.")


if __name__ == "__main__":
    main()
