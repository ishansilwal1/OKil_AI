from pydantic import BaseModel, EmailStr
from typing import Optional


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
	user: 'UserOut'


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
	

# Update forward references
TokenResponse.model_rebuild()
