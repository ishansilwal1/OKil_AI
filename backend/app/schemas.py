from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date as date_type, time as time_type


class UserRegisterRequest(BaseModel):
	name: str
	username: str
	email: EmailStr
	password: str


class LawyerRegisterRequest(BaseModel):
	name: str
	username: str
	barCouncilNumber: str
	expertise: Optional[str] = None
	email: EmailStr
	password: str


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	expires_in: int
	user: 'UserOut'


class ForgotRequest(BaseModel):
	email: EmailStr


class ResetRequest(BaseModel):
	token: str
	new_password: str


class UserUpdateRequest(BaseModel):
	name: Optional[str] = None
	expertise: Optional[str] = None
	current_password: Optional[str] = None
	new_password: Optional[str] = None


class UserOut(BaseModel):
	name: str
	username: str
	email: EmailStr
	role: Optional[str] = 'user'
	barCouncilNumber: Optional[str] = None
	expertise: Optional[str] = None
	# Do not include password


class LawyerOut(BaseModel):
	id: int
	name: str
	username: str
	email: EmailStr
	barCouncilNumber: Optional[str] = None
	expertise: Optional[str] = None

	class Config:
		from_attributes = True


class AppointmentCreate(BaseModel):
	lawyer_id: int
	# Either supply slot_id (preferred) or date/time
	preferred_at: Optional[datetime] = None
	date: Optional[date_type] = None
	time: Optional[time_type] = None
	message: Optional[str] = None
	slot_id: Optional[int] = None


class AppointmentOut(BaseModel):
	id: int
	user_id: int
	lawyer_id: int
	date: Optional[date_type] = None
	time: Optional[time_type] = None
	description: Optional[str] = None
	status: str
	created_at: datetime

	class Config:
		from_attributes = True


class AppointmentUpdate(BaseModel):
	# Update appointment status or reschedule
	status: Optional[str] = None  # expected: 'approved', 'rejected', 'cancelled', 'completed'
	# Reschedule inputs: either provide slot_id or both date and time
	date: Optional[date_type] = None
	time: Optional[time_type] = None
	slot_id: Optional[int] = None


class QueryCreate(BaseModel):
	title: str
	content: str
	lawyer_id: Optional[int] = None


class QueryOut(BaseModel):
	id: int
	user_id: int
	lawyer_id: Optional[int] = None
	subject: str
	description: str
	status: str
	created_at: datetime

	class Config:
		from_attributes = True


class QueryUpdate(BaseModel):
	# Update status or (optionally) edit content
	status: Optional[str] = None  # e.g., 'accepted', 'info_requested', 'rejected', 'answered', 'closed', 'open'
	subject: Optional[str] = None
	description: Optional[str] = None


class AvailabilitySlotCreate(BaseModel):
	start_at: datetime
	end_at: datetime


class AvailabilitySlotOut(BaseModel):
	id: int
	lawyer_id: int
	start_at: datetime
	end_at: datetime
	is_booked: bool

	class Config:
		from_attributes = True


class DocumentListOut(BaseModel):
	"""Document metadata without binary content"""
	id: int
	filename: str
	category: str
	file_size: int
	mime_type: str
	created_at: datetime
	updated_at: datetime

	class Config:
		from_attributes = True


class DocumentOut(BaseModel):
	"""Document with full content (for download)"""
	id: int
	filename: str
	category: str
	file_data: bytes
	file_size: int
	mime_type: str
	created_at: datetime

	class Config:
		from_attributes = True


# Update forward references
TokenResponse.model_rebuild()
