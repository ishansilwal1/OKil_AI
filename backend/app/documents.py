from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .db import get_db
from . import models
from .schemas import DocumentOut, DocumentListOut

router = APIRouter()


@router.get("/documents", response_model=List[DocumentListOut])
def list_documents(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of all documents. Optionally filter by category.
    Returns metadata only (no file content).
    Categories: Acts, ordinance, formats
    """
    query = db.query(models.Document)
    
    if category:
        # Validate category
        valid_categories = ['Acts', 'ordinance', 'formats']
        if category not in valid_categories:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        query = query.filter(models.Document.category == category)
    
    documents = query.order_by(models.Document.title.asc()).all()
    
    # Return only metadata (exclude binary data)
    return [
        DocumentListOut(
            id=doc.id,
            filename=doc.title,  # Map title to filename for consistency
            category=doc.category,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        for doc in documents
    ]


@router.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Download a specific document by ID.
    Returns the PDF file directly.
    """
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Return the PDF file as a response
    return Response(
        content=document.file_data,
        media_type=document.mime_type,
        headers={
            'Content-Disposition': f'inline; filename="{document.title}"',
            'Content-Length': str(document.file_size)
        }
    )


@router.get("/documents/by-filename/{filename}")
def get_document_by_filename(
    filename: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Download a document by filename. Optionally specify category if there are duplicates.
    Returns the PDF file directly.
    """
    query = db.query(models.Document).filter(models.Document.title == filename)
    
    if category:
        query = query.filter(models.Document.category == category)
    
    document = query.first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Return the PDF file as a response
    return Response(
        content=document.file_data,
        media_type=document.mime_type,
        headers={
            'Content-Disposition': f'inline; filename="{document.title}"',
            'Content-Length': str(document.file_size)
        }
    )


@router.get("/documents/categories/list")
def list_categories(db: Session = Depends(get_db)):
    """
    Get list of all available categories with document counts.
    """
    categories = db.query(
        models.Document.category,
        db.func.count(models.Document.id).label('count')
    ).group_by(models.Document.category).all()
    
    return [
        {
            "category": cat.category,
            "document_count": cat.count
        }
        for cat in categories
    ]


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a document from the database.
    Note: This permanently removes the document.
    """
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    filename = document.title
    db.delete(document)
    db.commit()
    
    return {"message": f"Document '{filename}' deleted successfully"}
