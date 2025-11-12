"""
Script to upload all PDFs from the pdfs folder to PostgreSQL database.
Usage: python -m scripts.upload_pdfs_to_db
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db import SessionLocal, init_db
from app.models import Document


def upload_pdfs_to_database():
    """Upload all PDFs from pdfs folder to database."""
    
    # Initialize database (create tables if they don't exist)
    print("Initializing database...")
    init_db()
    
    # Get the project root directory (parent of backend)
    backend_dir = Path(__file__).parent.parent
    project_root = backend_dir.parent
    pdfs_dir = project_root / "pdfs"
    
    if not pdfs_dir.exists():
        print(f"Error: PDFs directory not found at {pdfs_dir}")
        return
    
    # Categories to process
    categories = ["Acts", "ordinance", "formats"]
    
    db: Session = SessionLocal()
    
    try:
        total_uploaded = 0
        total_skipped = 0
        
        for category in categories:
            category_path = pdfs_dir / category
            
            if not category_path.exists():
                print(f"Warning: Category folder '{category}' not found at {category_path}")
                continue
            
            # Get all PDF files in category (including subdirectories)
            pdf_files = list(category_path.rglob("*.pdf")) + list(category_path.rglob("*.PDF"))
            
            print(f"\n📁 Processing category: {category}")
            print(f"   Found {len(pdf_files)} PDF files")
            
            for pdf_path in pdf_files:
                filename = pdf_path.name
                
                # Check if document already exists
                existing = db.query(Document).filter(
                    Document.title == filename,
                    Document.category == category
                ).first()
                
                if existing:
                    print(f"   ⏭️  Skipped (already exists): {filename}")
                    total_skipped += 1
                    continue
                
                try:
                    # Read PDF file as binary
                    with open(pdf_path, 'rb') as f:
                        file_data = f.read()
                    
                    file_size = len(file_data)
                    
                    # Create document record
                    document = Document(
                        title=filename,  # Using title instead of filename
                        category=category,
                        file_data=file_data,
                        file_size=file_size,
                        mime_type='application/pdf',
                        description=f"PDF document from {category} category"
                    )
                    
                    db.add(document)
                    db.commit()
                    
                    print(f"   ✅ Uploaded: {filename} ({file_size / 1024:.2f} KB)")
                    total_uploaded += 1
                    
                except Exception as e:
                    print(f"   ❌ Error uploading {filename}: {str(e)}")
                    db.rollback()
        
        print(f"\n{'='*60}")
        print(f"📊 Upload Summary:")
        print(f"   ✅ Successfully uploaded: {total_uploaded} files")
        print(f"   ⏭️  Skipped (duplicates): {total_skipped} files")
        print(f"   📦 Total processed: {total_uploaded + total_skipped} files")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Starting PDF upload to database...\n")
    upload_pdfs_to_database()
    print("✨ Upload process completed!")
