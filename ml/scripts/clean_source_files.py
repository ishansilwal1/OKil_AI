"""
Clean legal document source files:
1. Remove www.lawcommission.gov.np references
2. Add newlines before section headers (धारा, दफा, नियम)
3. Normalize spacing
"""

import os
import re
from pathlib import Path

def clean_legal_document(content: str) -> str:
    """Clean and format legal document text."""
    
    # Remove www.lawcommission.gov.np and variations
    content = re.sub(r'www\.lawcommission\.\s*gov\.np\s*\d*', '', content, flags=re.IGNORECASE)
    
    # Add double newline BEFORE section headers to ensure they start on new lines
    # Match: (not newline)(धारा|दफा|नियम)(whitespace)(numbers)
    # Replace with: (captured text)(newlines)(section marker)(space)(number)
    content = re.sub(r'([^\n])\s*(धारा|दफा|नियम)\s+([\d०-९]+)', r'\1\n\n\2 \3', content)
    
    # Also handle cases where section marker is at the very beginning
    content = re.sub(r'^(धारा|दफा|नियम)\s+([\d०-९]+)', r'\1 \2', content)
    
    # Remove multiple consecutive spaces (but keep intentional spacing)
    content = re.sub(r' {3,}', '  ', content)
    
    # Remove multiple consecutive newlines (max 2)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Clean up beginning and end
    content = content.strip()
    
    return content


def process_files():
    """Process all legal document files."""
    
    # Paths
    source_dir = Path("D:/okil ai/ml/data/cleaned")
    
    if not source_dir.exists():
        print(f"❌ Source directory not found: {source_dir}")
        return
    
    # Get all .txt files
    files = list(source_dir.glob("*.txt"))
    
    if not files:
        print(f"❌ No .txt files found in {source_dir}")
        return
    
    print("=" * 60)
    print("CLEANING LEGAL DOCUMENT SOURCE FILES")
    print("=" * 60)
    
    total_cleaned = 0
    
    for file_path in files:
        try:
            # Read original content
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            original_size = len(original_content)
            original_newlines = original_content.count('\n')
            
            # Clean content
            cleaned_content = clean_legal_document(original_content)
            
            cleaned_size = len(cleaned_content)
            cleaned_newlines = cleaned_content.count('\n')
            
            # Write cleaned content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
            
            print(f"\n✓ Cleaned: {file_path.name}")
            print(f"  Original: {original_size:,} chars, {original_newlines} newlines")
            print(f"  Cleaned:  {cleaned_size:,} chars, {cleaned_newlines} newlines")
            print(f"  Change:   {cleaned_size - original_size:+,} chars, {cleaned_newlines - original_newlines:+} newlines")
            
            total_cleaned += 1
            
        except Exception as e:
            print(f"\n❌ Error processing {file_path.name}: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"Cleaned {total_cleaned}/{len(files)} files successfully")
    print("=" * 60)


if __name__ == "__main__":
    process_files()
