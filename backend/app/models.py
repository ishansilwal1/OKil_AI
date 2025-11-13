from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Date, Time, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default='user')
    barCouncilNumber = Column(String, unique=True, nullable=True)
    # Lawyer's area of expertise; nullable for normal users
    expertise = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    login_tokens = relationship("LoginToken", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("ResetToken", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class LoginToken(Base):
    __tablename__ = 'login_tokens'

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)  # SHA256 hash of the token
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="login_tokens")


class ResetToken(Base):
    __tablename__ = 'reset_tokens'

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)  # SHA256 hash of the token
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email = Column(String, nullable=False)  # Store email for additional verification
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="reset_tokens")


class ChatSession(Base):
    __tablename__ = 'chat_sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)  # First user message or custom title
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    session = relationship("ChatSession", back_populates="messages")


class Appointment(Base):
    __tablename__ = 'appointments'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    lawyer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    # Match existing DB columns
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default='pending')  # pending, approved, rejected, cancelled, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Query(Base):
    __tablename__ = 'queries'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    lawyer_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # optional assignment
    # Match existing DB columns
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default='open')  # open, answered, closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AvailabilitySlot(Base):
    __tablename__ = 'availability_slots'

    id = Column(Integer, primary_key=True, index=True)
    lawyer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # Changed from filename to match existing DB
    category = Column(String, nullable=False)  # 'Acts', 'ordinance', 'formats'
    file_url = Column(String, nullable=True)  # Keep for backward compatibility
    file_data = Column(LargeBinary, nullable=True)  # New: PDF binary data
    file_size = Column(Integer, nullable=True)  # Size in bytes
    description = Column(Text, nullable=True)  # Existing field
    mime_type = Column(String, default='application/pdf')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
