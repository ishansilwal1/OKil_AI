#!/usr/bin/env python3
"""
Legal Data Cleaning Pipeline
Processes raw legal documents and stores cleaned versions
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any
import PyPDF2

class LegalDataCleaner:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.raw_dir = self.base_dir / "data" / "raw"
        self.cleaned_dir = self.base_dir / "data" / "cleaned"
        
        # Create cleaned directory
        self.cleaned_dir.mkdir(parents=True, exist_ok=True)
    
    def clean_text(self, text: str, language: str = "english") -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove page numbers and headers/footers
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
        text = re.sub(r'\n\s*Page\s+\d+.*?\n', '\n', text, flags=re.IGNORECASE)
        
        # Language-specific cleaning
        if language == "nepali":
            # Normalize Devanagari punctuation
            text = text.replace('।।', '।')
            text = text.replace('॥', '।')
            # Clean unwanted characters but preserve Devanagari
            text = re.sub(r'[^\u0900-\u097F\u0020-\u007E।\s]+', ' ', text)
        else:
            # English text cleaning
            # Remove excessive punctuation
            text = re.sub(r'[.]{2,}', '.', text)
            text = re.sub(r'[-]{2,}', '-', text)
            # Remove special characters but keep basic punctuation
            text = re.sub(r'[^\w\s.,;:!?()\[\]"\'-]', ' ', text)
        
        # Clean up multiple spaces and newlines
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        return text.strip()
    
    def detect_language(self, text: str) -> str:
        """Detect if text is primarily Nepali or English"""
        # Count Devanagari characters
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
        total_chars = len(re.sub(r'\s', '', text))
        
        if total_chars == 0:
            return "english"
        
        devanagari_ratio = devanagari_chars / total_chars
        return "nepali" if devanagari_ratio > 0.3 else "english"
    
    def clean_pdf(self, pdf_path: Path) -> str:
        """Extract and clean text from PDF"""
        print(f"Processing PDF: {pdf_path.name}")
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = []
                
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
                
                combined_text = '\n'.join(text_content)
                language = self.detect_language(combined_text)
                cleaned_text = self.clean_text(combined_text, language)
                
                print(f"  Extracted {len(text_content)} pages, detected language: {language}")
                return cleaned_text
                
        except Exception as e:
            print(f"Error processing PDF {pdf_path}: {e}")
            return ""
    
    def clean_text_file(self, txt_path: Path) -> str:
        """Clean text file content"""
        print(f"Processing text file: {txt_path.name}")
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
            content = ""
            
            for encoding in encodings:
                try:
                    with open(txt_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            if not content:
                print(f"  Could not read file with any encoding")
                return ""
            
            language = self.detect_language(content)
            cleaned_text = self.clean_text(content, language)
            
            print(f"  Detected language: {language}")
            return cleaned_text
            
        except Exception as e:
            print(f"Error processing text file {txt_path}: {e}")
            return ""
    
    def save_cleaned_file(self, content: str, filename: str, metadata: Dict[str, Any]) -> None:
        """Save cleaned content"""
        if not content:
            print(f"  No content to save for {filename}")
            return
        
        # Save cleaned text only
        output_path = self.cleaned_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  Saved: {output_path}")
        print(f"  Characters: {metadata['char_count']:,}, Words: {metadata['word_count']:,}")
    
    def process_all_files(self) -> None:
        """Process all raw files and create cleaned versions"""
        print("LEGAL DATA CLEANING PIPELINE")
        print("=" * 40)
        
        if not self.raw_dir.exists():
            print(f"Raw data directory not found: {self.raw_dir}")
            return
        
        # Define file mappings with expected content types
        file_mappings = {
            "Sambidhan.pdf": {
                "output": "constitution_nepali_cleaned.txt",
                "type": "constitution",
                "language": "nepali",
                "source": "Nepal Constitution PDF"
            },
            "constitution_english.txt": {
                "output": "constitution_english_cleaned.txt", 
                "type": "constitution",
                "language": "english",
                "source": "Nepal Constitution English"
            },
            "civilcode.txt": {
                "output": "civil_code_cleaned.txt",
                "type": "civil_law", 
                "language": "english",
                "source": "Nepal Civil Code"
            },
            "Financial_Act.txt": {
                "output": "financial_act_cleaned.txt",
                "type": "financial_law",
                "language": "english", 
                "source": "Nepal Financial Act"
            },
            "Land_use_act.txt": {
                "output": "land_use_act_cleaned.txt",
                "type": "land_law",
                "language": "nepali",
                "source": "Nepal Land Use Act"
            },
            "Property_Tax.txt": {
                "output": "property_tax_cleaned.txt",
                "type": "tax_law",
                "language": "nepali",
                "source": "Nepal Property Tax Regulations"
            }
        }
        
        processed_files = []
        
        for filename, config in file_mappings.items():
            file_path = self.raw_dir / filename
            
            if not file_path.exists():
                print(f"File not found: {filename}")
                continue
            
            print(f"\nProcessing: {filename}")
            
            # Process based on file type
            if filename.endswith('.pdf'):
                cleaned_content = self.clean_pdf(file_path)
            else:
                cleaned_content = self.clean_text_file(file_path)
            
            if cleaned_content:
                # Create metadata
                metadata = {
                    "original_file": filename,
                    "cleaned_file": config["output"],
                    "document_type": config["type"],
                    "language": config["language"],
                    "source": config["source"],
                    "char_count": len(cleaned_content),
                    "word_count": len(cleaned_content.split()),
                    "processing_date": "2025-09-18"
                }
                
                # Save cleaned file
                self.save_cleaned_file(cleaned_content, config["output"], metadata)
                processed_files.append(config["output"])
            
        # Display summary
        print(f"\n" + "=" * 50)
        print("DATA CLEANING COMPLETE")
        print("=" * 50)
        print(f"Processed files: {len(processed_files)}")
        print(f"Output directory: {self.cleaned_dir}")
        
        if processed_files:
            print(f"\nCleaned files:")
            for file in processed_files:
                print(f"  - {file}")


def main():
    """Main data cleaning pipeline"""
    cleaner = LegalDataCleaner()
    cleaner.process_all_files()


if __name__ == "__main__":
    main()