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
	email: EmailStr
	password: str


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	expires_in: int


class ForgotRequest(BaseModel):
	email: EmailStr


class ResetRequest(BaseModel):
	token: str
	new_password: str


class UserOut(BaseModel):
	name: str
	username: str
	email: EmailStr
	role: Optional[str] = 'user'
	barCouncilNumber: Optional[str] = None
	# Do not include password


class LawyerOut(BaseModel):
	id: int
	name: str
	username: str
	email: EmailStr
	barCouncilNumber: Optional[str] = None

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
