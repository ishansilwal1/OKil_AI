"""
Chat History API - Save and retrieve user chat sessions
"""
from fastapi import APIRouter, HTTPException, Depends, status, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ...db import get_db
from ... import models, utils

router = APIRouter()


# Schemas
class MessageCreate(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    title: str
    messages: List[MessageCreate]


class SessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class SessionDetail(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut]

    class Config:
        from_attributes = True


# Helper function to get user from JWT token
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Extract user from JWT token in Authorization header"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Not authenticated')
    
    token = authorization.replace('Bearer ', '')
    payload = utils.decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail='Invalid token')
    
    user_id = payload.get('user_id')
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    
    return user


@router.post('/sessions', response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new chat session with messages"""
    # Create session
    chat_session = models.ChatSession(
        user_id=current_user.id,
        title=session_data.title
    )
    db.add(chat_session)
    db.flush()  # Get the session ID
    
    # Add messages
    for msg in session_data.messages:
        chat_msg = models.ChatMessage(
            session_id=chat_session.id,
            role=msg.role,
            content=msg.content
        )
        db.add(chat_msg)
    
    db.commit()
    db.refresh(chat_session)
    
    return SessionOut(
        id=chat_session.id,
        title=chat_session.title,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
        message_count=len(session_data.messages)
    )


@router.get('/sessions', response_model=List[SessionOut])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all chat sessions for the current user"""
    sessions = db.query(models.ChatSession)\
        .filter(models.ChatSession.user_id == current_user.id)\
        .order_by(models.ChatSession.updated_at.desc())\
        .all()
    
    return [
        SessionOut(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=len(session.messages)
        )
        for session in sessions
    ]


@router.get('/sessions/{session_id}', response_model=SessionDetail)
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific chat session with all messages"""
    session = db.query(models.ChatSession)\
        .filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == current_user.id
        )\
        .first()
    
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    
    return SessionDetail(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[
            MessageOut(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at
            )
            for msg in session.messages
        ]
    )


@router.put('/sessions/{session_id}/messages', response_model=SessionOut)
def add_messages_to_session(
    session_id: int,
    messages: List[MessageCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add new messages to an existing session"""
    session = db.query(models.ChatSession)\
        .filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == current_user.id
        )\
        .first()
    
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    
    # Add messages
    for msg in messages:
        chat_msg = models.ChatMessage(
            session_id=session.id,
            role=msg.role,
            content=msg.content
        )
        db.add(chat_msg)
    
    db.commit()
    db.refresh(session)
    
    return SessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages)
    )


@router.delete('/sessions/{session_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a chat session"""
    session = db.query(models.ChatSession)\
        .filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == current_user.id
        )\
        .first()
    
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    
    db.delete(session)
    db.commit()
    
    return None
