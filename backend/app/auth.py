from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from . import utils
from .schemas import (
	UserRegisterRequest,
	LawyerRegisterRequest,
	LoginRequest,
	TokenResponse,
	ForgotRequest,
	ResetRequest,
	UserOut,
	UserUpdateRequest,
)
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .db import get_db
from . import models
from hashlib import sha256
import os
from dotenv import load_dotenv
from . import email_utils

load_dotenv()

router = APIRouter()
security = HTTPBearer()


@router.post('/register/user', response_model=UserOut)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
	# check duplicate email or username
	existing = db.query(models.User).filter((models.User.email == req.email) | (models.User.username == req.username)).first()
	if existing:
		raise HTTPException(status_code=400, detail='Email or username already exists')

	user = models.User(
		name=req.name,
		username=req.username,
		email=req.email,
		password=utils.hash_password(req.password),
		role='user',
		is_verified=False
	)
	db.add(user)
	db.commit()
	db.refresh(user)

	# Send verification email
	send_verification_email(user, db)

	return UserOut(name=user.name, username=user.username, email=user.email, role=user.role, barCouncilNumber=None, expertise=None, is_verified=user.is_verified)


@router.post('/register/lawyer', response_model=UserOut)
def register_lawyer(req: LawyerRegisterRequest, db: Session = Depends(get_db)):
	# check duplicate email or username or barCouncilNumber
	existing = db.query(models.User).filter(
		(models.User.email == req.email)
		| (models.User.username == req.username)
		| (models.User.barCouncilNumber == req.barCouncilNumber)
	).first()
	if existing:
		raise HTTPException(status_code=400, detail='Email, username or BAR council number already exists')

	user = models.User(
		name=req.name,
		username=req.username,
		email=req.email,
		password=utils.hash_password(req.password),
		role='lawyer',
		barCouncilNumber=req.barCouncilNumber,
		expertise=getattr(req, 'expertise', None),
		is_verified=False
	)
	db.add(user)
	db.commit()
	db.refresh(user)

	# Send verification email
	send_verification_email(user, db)

	return UserOut(name=user.name, username=user.username, email=user.email, role=user.role, barCouncilNumber=user.barCouncilNumber, expertise=user.expertise, is_verified=user.is_verified)

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    # Find the verification token in DB
    token_hash = sha256(token.encode()).hexdigest()
    v_token = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token_hash == token_hash,
        models.EmailVerificationToken.used == False
    ).first()

    if not v_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Mark user as verified
    user = db.query(models.User).filter(models.User.id == v_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    v_token.used = True  # mark token as used
    db.commit()

    return {"message": "Email verified successfully!"}


@router.post('/login')
def login(req: LoginRequest, db: Session = Depends(get_db)):
	# allow login by email OR username
	user = db.query(models.User).filter((models.User.email == req.email) | (models.User.username == req.email)).first()
	if not user:
		raise HTTPException(status_code=401, detail='Not a User. Sign up first.')
	if not utils.verify_password(user.password, req.password):
		raise HTTPException(status_code=401, detail='Invalid credentials')
	if not user.is_verified:
		raise HTTPException(status_code=403, detail='Email not verified. Please check your inbox.')

	# Generate JWT token
	access_token = utils.create_jwt_token(
		data={"sub": user.email, "user_id": user.id, "role": user.role}
	)
	token_hash = sha256(access_token.encode()).hexdigest()
	
	# Clean up expired tokens for this user
	current_time = datetime.now(timezone.utc)
	expired_tokens = db.query(models.LoginToken).filter(
		models.LoginToken.user_id == user.id,
		models.LoginToken.expires_at < current_time
	).all()
	for token in expired_tokens:
		db.delete(token)
	
	# Create new login token
	login_token = models.LoginToken(
		token_hash=token_hash,
		user_id=user.id,
		expires_at=utils.token_expiration(1440)
	)
	db.add(login_token)
	db.commit()
	
	# Return response with user info
	return {
		"access_token": access_token,
		"token_type": "bearer",
		"expires_in": 3600,
		"user": {
			"id": user.id,
			"name": user.name,
			"username": user.username,
			"email": user.email,
			"role": user.role,
			"expertise": user.expertise if user.role == 'lawyer' else None,
			"barCouncilNumber": user.barCouncilNumber if user.role == 'lawyer' else None
		}
	}


@router.post('/forgot')
def forgot(req: ForgotRequest, db: Session = Depends(get_db)):
	# Always return a generic message to avoid account enumeration
	user = db.query(models.User).filter(models.User.email == req.email).first()

	# create token and store hashed version with expiry and used flag
	token = utils.generate_token()
	token_hash = sha256(token.encode()).hexdigest()
	
	# Clean up expired reset tokens for this user
	if user:
		current_time = datetime.now(timezone.utc)
		expired_tokens = db.query(models.ResetToken).filter(
			models.ResetToken.user_id == user.id,
			models.ResetToken.expires_at < current_time
		).all()
		for reset_token in expired_tokens:
			db.delete(reset_token)
	
		# Create new reset token
		reset_token = models.ResetToken(
			token_hash=token_hash,
			user_id=user.id,
			email=req.email,
			expires_at=utils.token_expiration(60),
			used=False
		)
		db.add(reset_token)
		db.commit()

	# send email only if user exists; otherwise do nothing (still return success)
	try:
		if user:
			frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
			reset_link = f"{frontend_url}/reset-password?token={token}"
			subject = 'OKIL AI — Password reset'
			body = f"We received a password reset request. Use the link below to reset your password:\n\n{reset_link}\n\nIf you didn't request this, ignore this message."
			html = f"<p>We received a password reset request. Click to reset your password:</p><p><a href=\"{reset_link}\">Reset password</a></p>"
			email_utils.send_email(req.email, subject, body, html)
	except Exception:
		# don't expose email failures to the client
		pass

	return {'message': 'If an account with that email exists, a reset link has been sent.'}


@router.post('/reset')
def reset(req: ResetRequest, db: Session = Depends(get_db)):
	token_hash = sha256(req.token.encode()).hexdigest()
	
	# Find the reset token in database
	reset_token = db.query(models.ResetToken).filter(
		models.ResetToken.token_hash == token_hash
	).first()
	
	if not reset_token:
		raise HTTPException(status_code=400, detail='Invalid or expired token')

	# Check if token is expired
	current_time = datetime.now(timezone.utc)
	if current_time > reset_token.expires_at:
		# Remove expired token
		db.delete(reset_token)
		db.commit()
		raise HTTPException(status_code=400, detail='Invalid or expired token')

	# Check if token is already used
	if reset_token.used:
		raise HTTPException(status_code=400, detail='Token already used')

	# Find user by token's user_id
	user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail='User not found for this token')

	# Update password
	user.password = utils.hash_password(req.new_password)
	
	# Mark token as used (single-use)
	reset_token.used = True
	
	db.add(user)
	db.add(reset_token)
	db.commit()
	
	return {'message': 'Password reset successful'}

def send_verification_email(user, db):
    token = utils.generate_token()
    token_hash = sha256(token.encode()).hexdigest()

    # Clean expired verification tokens
    current_time = datetime.now(timezone.utc)
    expired = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == user.id,
        models.EmailVerificationToken.expires_at < current_time
    ).all()
    for e in expired:
        db.delete(e)

    verification_token = models.EmailVerificationToken(
        token_hash=token_hash,
        user_id=user.id,
        expires_at=utils.token_expiration(60),  # 60 minutes
        used=False
    )
    db.add(verification_token)
    db.commit()

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    verify_link = f"{frontend_url}/verify-email?token={token}"

    subject = "OKIL AI — Verify your email"
    body = f"Click the link to verify your email:\n\n{verify_link}"
    html = f"<p>Click to verify your email:</p><a href='{verify_link}'>Verify Email</a>"

    email_utils.send_email(user.email, subject, body, html)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
	token = credentials.credentials
	token_hash = sha256(token.encode()).hexdigest()
	
	# Find the login token in database
	login_token = db.query(models.LoginToken).filter(
		models.LoginToken.token_hash == token_hash
	).first()
	
	if not login_token:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
	
	# Check if token is expired
	current_time = datetime.now(timezone.utc)
	if current_time > login_token.expires_at:
		# Remove expired token
		db.delete(login_token)
		db.commit()
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired')
	
	# Get user
	user = db.query(models.User).filter(models.User.id == login_token.user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail='User not found')
	
	return {
		'id': login_token.user_id,
		'name': user.name,
		'email': user.email,
		'username': user.username,
		'role': user.role or 'user',
		'barCouncilNumber': user.barCouncilNumber,
		'expertise': getattr(user, 'expertise', None)
	}


@router.get('/me')
def me(current=Depends(get_current_user)):
	return current


@router.put('/me')
def update_me(
	req: UserUpdateRequest,
	current=Depends(get_current_user),
	db: Session = Depends(get_db)
):
	"""Update the current user's profile information."""
	uid = current['id']
	user = db.query(models.User).filter(models.User.id == uid).first()
	if not user:
		raise HTTPException(status_code=404, detail='User not found')
	
	# Update fields if provided
	if req.name is not None:
		user.name = req.name
	if req.expertise is not None:
		user.expertise = req.expertise
	
	# Handle password change if both current and new password are provided
	if req.current_password and req.new_password:
		# Verify current password
		if not utils.verify_password(user.password, req.current_password):
			raise HTTPException(status_code=400, detail='Current password is incorrect')
		
		# Validate new password length
		if len(req.new_password) < 6:
			raise HTTPException(status_code=400, detail='New password must be at least 6 characters long')
		
		# Update password
		user.password = utils.hash_password(req.new_password)
	elif req.current_password or req.new_password:
		# If only one password field is provided, return error
		raise HTTPException(status_code=400, detail='Both current password and new password are required to change password')
	
	db.commit()
	db.refresh(user)
	
	return {
		'id': user.id,
		'name': user.name,
		'username': user.username,
		'email': user.email,
		'role': user.role,
		'barCouncilNumber': user.barCouncilNumber,
		'expertise': user.expertise
	}


@router.post('/logout')
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
	token = credentials.credentials
	token_hash = sha256(token.encode()).hexdigest()
	
	# Find and delete the login token
	login_token = db.query(models.LoginToken).filter(
		models.LoginToken.token_hash == token_hash
	).first()
	
	if login_token:
		db.delete(login_token)
		db.commit()
	
	return {'message': 'Logged out'}


@router.delete('/me')
def delete_me(current=Depends(get_current_user), db: Session = Depends(get_db)):
	"""Delete the currently authenticated user's account and related data.
	This removes availability slots, appointments (as user or lawyer), queries (as user or lawyer),
	and auth tokens before deleting the user.
	"""
	uid = current['id']

	# Best-effort cleanup of dependent rows to satisfy FK constraints
	db.query(models.AvailabilitySlot).filter(models.AvailabilitySlot.lawyer_id == uid).delete(synchronize_session=False)
	db.query(models.Appointment).filter(
		or_(
			models.Appointment.user_id == uid,
			models.Appointment.lawyer_id == uid
		)
	).delete(synchronize_session=False)
	db.query(models.Query).filter(
		or_(
			models.Query.user_id == uid,
			models.Query.lawyer_id == uid
		)
	).delete(synchronize_session=False)
	db.query(models.LoginToken).filter(models.LoginToken.user_id == uid).delete(synchronize_session=False)
	db.query(models.ResetToken).filter(models.ResetToken.user_id == uid).delete(synchronize_session=False)

	user = db.query(models.User).filter(models.User.id == uid).first()
	if not user:
		raise HTTPException(status_code=404, detail='User not found')

	db.delete(user)
	db.commit()
	return {'message': 'Account deleted'}

