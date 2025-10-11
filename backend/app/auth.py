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
)
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session
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
		role='user'
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return UserOut(name=user.name, username=user.username, email=user.email, role=user.role)


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
		barCouncilNumber=req.barCouncilNumber
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return UserOut(name=user.name, username=user.username, email=user.email, role=user.role, barCouncilNumber=user.barCouncilNumber)


@router.post('/login', response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
	# allow login by email OR username
	user = db.query(models.User).filter((models.User.email == req.email) | (models.User.username == req.email)).first()
	if not user:
		raise HTTPException(status_code=401, detail='Invalid credentials')
	if not utils.verify_password(user.password, req.password):
		raise HTTPException(status_code=401, detail='Invalid credentials')

	# Generate token
	access = utils.generate_token()
	token_hash = sha256(access.encode()).hexdigest()
	
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
	
	return TokenResponse(access_token=access, expires_in=3600)


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
		'barCouncilNumber': user.barCouncilNumber
	}


@router.get('/me')
def me(current=Depends(get_current_user)):
	return current


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

