"""
Legal Chat API - RAG-powered legal Q&A endpoint
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Import RAG service using relative import
try:
    from ...rag_service import LegalRAGWithGroq
except ImportError as e:
    print(f"Failed to import RAG service: {e}")
    LegalRAGWithGroq = None

router = APIRouter()

# Models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    top_k: int = 3  # Reduced from 6 to 3 to stay under token limits

class SourceReference(BaseModel):
    document: str
    section: str
    content: str
    similarity: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceReference]
    query: str

# Global RAG system instance (singleton pattern)
rag_system = None

def get_rag_system():
    """Initialize RAG system once and reuse"""
    global rag_system
    
    if rag_system is None:
        if LegalRAGWithGroq is None:
            raise HTTPException(
                status_code=500,
                detail="RAG service not available. Check if dependencies are installed."
            )
        
        try:
            rag_system = LegalRAGWithGroq(base_dir="D:/okil ai/ml")
            print("✅ RAG system initialized successfully")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize RAG system: {str(e)}"
            )
    
    return rag_system

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Legal Q&A endpoint powered by RAG system
    
    - **message**: User's legal question
    - **history**: Previous chat messages for context
    - **top_k**: Number of relevant documents to retrieve (default: 6)
    """
    print(f"🔵 Chat endpoint called with message: {request.message[:50]}...")
    print(f"🔵 History length: {len(request.history)}")
    print(f"🔵 Top-k: {request.top_k}")
    
    try:
        # Get RAG system
        rag = get_rag_system()
        
        # Generate answer using Groq (this returns a dict with answer, sources, etc.)
        result = rag.answer_question(request.message, top_k=request.top_k)
        
        # Debug: Print the result to see what we got
        print(f"\n🔍 DEBUG - Result type: {type(result)}")
        print(f"🔍 DEBUG - Result keys: {result.keys() if isinstance(result, dict) else 'NOT A DICT'}")
        
        # Extract answer and sources from result
        answer_text = result.get('answer', 'माफ गर्नुहोस्, त्रुटि भयो।')
        print(f"🔍 DEBUG - Answer type: {type(answer_text)}")
        print(f"🔍 DEBUG - Answer preview: {str(answer_text)[:100]}")
        
        retrieved_docs = result.get('sources', [])
        
        # Format sources
        sources = []
        for doc in retrieved_docs:
            metadata = doc.get('metadata', {})
            sources.append(SourceReference(
                document=metadata.get('citation_reference', 'Unknown'),
                section=f"{metadata.get('section_type_ne', '')} {metadata.get('section_number', '')}".strip() or 'N/A',
                content=doc.get('text', '')[:500],  # Truncate to 500 chars
                similarity=doc.get('similarity', 0.0)
            ))
        
        # Ensure answer_text is a string, not a dict
        if isinstance(answer_text, dict):
            # If it's still a dict, extract the answer field
            answer_text = answer_text.get('answer', 'माफ गर्नुहोस्, त्रुटि भयो।')
        
        return ChatResponse(
            answer=str(answer_text),  # Ensure it's a string
            sources=sources,
            query=request.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Check if RAG system is initialized and healthy"""
    try:
        rag = get_rag_system()
        return {
            "status": "healthy",
            "message": "RAG system is operational",
            "collection_count": rag.collection.count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"RAG system not available: {str(e)}"
        )

@router.get("/stats")
async def get_stats():
    """Get statistics about the legal corpus"""
    try:
        rag = get_rag_system()
        count = rag.collection.count()
        
        # Get sample metadata
        sample = rag.collection.get(limit=1, include=['metadatas'])
        
        return {
            "total_documents": count,
            "sample_metadata": sample['metadatas'][0] if sample['metadatas'] else {}
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stats: {str(e)}"
        )
